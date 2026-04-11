'use client';

import { useState, useCallback } from 'react';
import { useAccount, useChainId, usePublicClient } from '@/lib/wagmi/compat';
import { useWriteContract } from 'wagmi';
import { encodeAbiParameters, encodePacked, erc20Abi, maxUint160 } from 'viem';
import { getContractsForChain, PERMIT2 } from '@/lib/contracts/addresses';

// ─── ABIs ─────────────────────────────────────────────────────────────────────

const PERMIT2_ABI = [
  {
    name: 'allowance',
    type: 'function',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'token', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [
      { name: 'amount', type: 'uint160' },
      { name: 'expiration', type: 'uint48' },
      { name: 'nonce', type: 'uint48' },
    ],
    stateMutability: 'view',
  },
  {
    name: 'approve',
    type: 'function',
    inputs: [
      { name: 'token', type: 'address' },
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint160' },
      { name: 'expiration', type: 'uint48' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
] as const;

const UNIVERSAL_ROUTER_ABI = [
  {
    name: 'execute',
    type: 'function',
    inputs: [
      { name: 'commands', type: 'bytes' },
      { name: 'inputs', type: 'bytes[]' },
      { name: 'deadline', type: 'uint256' },
    ],
    outputs: [],
    stateMutability: 'payable',
  },
] as const;

// ─── V4 action IDs ────────────────────────────────────────────────────────────

const SWAP_EXACT_IN_SINGLE = 0x06;
const SETTLE_ALL           = 0x0c;
const TAKE_ALL             = 0x0f;

// Universal Router top-level command for V4 swaps
const V4_SWAP_COMMAND = '0x10' as `0x${string}`;

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Permit2 expiration: 30 days from now
const permit2Expiration = () => Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60;

// Swap deadline: 5 minutes from now
const swapDeadline = () => BigInt(Math.floor(Date.now() / 1000) + 300);

function encodeV4SwapInput({
  currency0,
  currency1,
  fee,
  tickSpacing,
  hooks,
  zeroForOne,
  amountIn,
  amountOutMinimum,
  hookData,
}: {
  currency0: `0x${string}`;
  currency1: `0x${string}`;
  fee: number;
  tickSpacing: number;
  hooks: `0x${string}`;
  zeroForOne: boolean;
  amountIn: bigint;
  amountOutMinimum: bigint;
  hookData: `0x${string}`;
}): `0x${string}` {
  const poolKeyComponents = [
    { name: 'currency0', type: 'address' as const },
    { name: 'currency1', type: 'address' as const },
    { name: 'fee', type: 'uint24' as const },
    { name: 'tickSpacing', type: 'int24' as const },
    { name: 'hooks', type: 'address' as const },
  ];

  // Encode SWAP_EXACT_IN_SINGLE params
  const swapParams = encodeAbiParameters(
    [{ type: 'tuple', components: [
      { name: 'poolKey', type: 'tuple', components: poolKeyComponents },
      { name: 'zeroForOne', type: 'bool' },
      { name: 'amountIn', type: 'uint128' },
      { name: 'amountOutMinimum', type: 'uint128' },
      { name: 'hookData', type: 'bytes' },
    ]}],
    [{
      poolKey: { currency0, currency1, fee, tickSpacing, hooks },
      zeroForOne,
      amountIn,
      amountOutMinimum,
      hookData,
    }]
  );

  // Encode SETTLE_ALL: (inputCurrency, maxAmount)
  const inputCurrency = zeroForOne ? currency0 : currency1;
  const settleParams = encodeAbiParameters(
    [{ type: 'address' }, { type: 'uint256' }],
    [inputCurrency, amountIn]
  );

  // Encode TAKE_ALL: (outputCurrency, minAmountOut)
  const outputCurrency = zeroForOne ? currency1 : currency0;
  const takeParams = encodeAbiParameters(
    [{ type: 'address' }, { type: 'uint256' }],
    [outputCurrency, amountOutMinimum]
  );

  // Pack action IDs into a bytes sequence
  const actions = encodePacked(
    ['uint8', 'uint8', 'uint8'],
    [SWAP_EXACT_IN_SINGLE, SETTLE_ALL, TAKE_ALL]
  );

  // Wrap into the V4 swap input format: (bytes actions, bytes[] params)
  return encodeAbiParameters(
    [{ type: 'bytes' }, { type: 'bytes[]' }],
    [actions, [swapParams, settleParams, takeParams]]
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export type SwapStep =
  | 'idle'
  | 'approving-usdc'    // ERC-20 approve to Permit2 (one-time)
  | 'approving-permit2' // Permit2.approve for Universal Router (one-time)
  | 'swapping'          // Universal Router execute
  | 'success'
  | 'error';

export function useV4Swap() {
  const { address: userAddress } = useAccount();
  const chainId = useChainId();
  const publicClient = usePublicClient();
  const contracts = getContractsForChain(chainId);

  const [step, setStep] = useState<SwapStep>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();

  const { writeContractAsync } = useWriteContract();

  const swap = useCallback(async ({
    fromSymbol,
    amountIn,
    amountOutMinimum = 0n,
  }: {
    fromSymbol: 'USDC' | 'ECOP';
    amountIn: bigint;
    amountOutMinimum?: bigint;
  }) => {
    if (!userAddress || !contracts || !publicClient) {
      setErrorMsg('Wallet not connected');
      setStep('error');
      return;
    }

    const universalRouter = contracts.UNIVERSAL_ROUTER;
    if (!universalRouter || universalRouter === '0x0000000000000000000000000000000000000000') {
      setErrorMsg('Universal Router not available on this chain');
      setStep('error');
      return;
    }

    // USDC is currency0 (lower address), ECOP is currency1
    const zeroForOne = fromSymbol === 'USDC';
    const inputToken = zeroForOne ? contracts.USDC : contracts.ECOP;

    try {
      setErrorMsg('');

      // ── Step 1: ERC-20 approve inputToken → Permit2 (one-time, if needed) ──
      const erc20Allowance = await publicClient.readContract({
        address: inputToken,
        abi: erc20Abi,
        functionName: 'allowance',
        args: [userAddress, PERMIT2],
      });

      if ((erc20Allowance as bigint) < amountIn) {
        setStep('approving-usdc');
        const approveTx = await writeContractAsync({
          address: inputToken,
          abi: erc20Abi,
          functionName: 'approve',
          args: [PERMIT2, BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff')],
        });
        await publicClient.waitForTransactionReceipt({ hash: approveTx });
      }

      // ── Step 2: Permit2.approve for Universal Router (one-time, if needed) ──
      const permit2Allowance = await publicClient.readContract({
        address: PERMIT2,
        abi: PERMIT2_ABI,
        functionName: 'allowance',
        args: [userAddress, inputToken, universalRouter as `0x${string}`],
      }) as [bigint, number, number];

      const [p2Amount, p2Expiration] = permit2Allowance;
      const nowSeconds = Math.floor(Date.now() / 1000);

      if (p2Amount < amountIn || p2Expiration < nowSeconds) {
        setStep('approving-permit2');
        const permit2Tx = await writeContractAsync({
          address: PERMIT2,
          abi: PERMIT2_ABI,
          functionName: 'approve',
          args: [inputToken, universalRouter as `0x${string}`, maxUint160, permit2Expiration()],
        });
        await publicClient.waitForTransactionReceipt({ hash: permit2Tx });
      }

      // ── Step 3: Execute swap via Universal Router ──────────────────────────
      setStep('swapping');

      // hookData encodes the real user address — required by PassportGatedHook
      const hookData = encodeAbiParameters([{ type: 'address' }], [userAddress]);

      const v4Input = encodeV4SwapInput({
        currency0: contracts.USDC,
        currency1: contracts.ECOP,
        fee: 500,
        tickSpacing: 10,
        hooks: contracts.PASSPORT_GATED_HOOK as `0x${string}`,
        zeroForOne,
        amountIn,
        amountOutMinimum,
        hookData,
      });

      const hash = await writeContractAsync({
        address: universalRouter as `0x${string}`,
        abi: UNIVERSAL_ROUTER_ABI,
        functionName: 'execute',
        args: [V4_SWAP_COMMAND, [v4Input], swapDeadline()],
      });

      setTxHash(hash);
      await publicClient.waitForTransactionReceipt({ hash });
      setStep('success');

    } catch (err: unknown) {
      const e = err as { shortMessage?: string; message?: string };
      const msg = e?.shortMessage ?? e?.message ?? 'Swap failed';
      setErrorMsg(msg);
      setStep('error');
    }
  }, [userAddress, contracts, publicClient, writeContractAsync]);

  const reset = useCallback(() => {
    setStep('idle');
    setErrorMsg('');
    setTxHash(undefined);
  }, []);

  return { swap, step, errorMsg, txHash, reset };
}
