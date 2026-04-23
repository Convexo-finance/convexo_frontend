'use client';

import { useState, useCallback } from 'react';
import { useAccount, useChainId, usePublicClient } from '@/lib/wagmi/compat';
import { useSmartAccountClient, useSendUserOperation } from '@account-kit/react';
import { encodeAbiParameters, encodeFunctionData, encodePacked, erc20Abi, maxUint160, type Abi } from 'viem';
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
  | 'swapping'  // Checking allowances + sending batched UO (approve(s) + swap)
  | 'success'
  | 'error';

export function useV4Swap() {
  const { address: userAddress } = useAccount();
  const chainId = useChainId();
  const publicClient = usePublicClient();
  const contracts = getContractsForChain(chainId);

  const { client } = useSmartAccountClient({ type: 'MultiOwnerModularAccount' });
  const { sendUserOperationAsync } = useSendUserOperation({ client, waitForTxn: true });

  const [step, setStep] = useState<SwapStep>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();

  const swap = useCallback(async ({
    fromSymbol,
    amountIn,
    amountOutMinimum = 0n,
  }: {
    fromSymbol: 'USDC' | 'ECOP';
    amountIn: bigint;
    amountOutMinimum?: bigint;
  }) => {
    if (!client) {
      setErrorMsg('Smart account not ready — sign in with email, passkey, or Google to swap');
      setStep('error');
      return;
    }

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

    // Determine canonical pool key ordering: currency0 < currency1 by address
    const ecopIsC0 = contracts.ECOP.toLowerCase() < contracts.USDC.toLowerCase();
    const currency0 = (ecopIsC0 ? contracts.ECOP : contracts.USDC) as `0x${string}`;
    const currency1 = (ecopIsC0 ? contracts.USDC : contracts.ECOP) as `0x${string}`;
    // zeroForOne = true means selling currency0; false means selling currency1
    const zeroForOne = ecopIsC0 ? fromSymbol === 'ECOP' : fromSymbol === 'USDC';
    const inputToken = fromSymbol === 'USDC' ? contracts.USDC : contracts.ECOP;

    try {
      setErrorMsg('');
      setStep('swapping');

      // ── Read current allowances (no UO needed, just reads) ────────────────
      const erc20Allowance = await publicClient.readContract({
        address: inputToken,
        abi: erc20Abi,
        functionName: 'allowance',
        args: [userAddress, PERMIT2],
      }) as bigint;

      const permit2Allowance = await publicClient.readContract({
        address: PERMIT2,
        abi: PERMIT2_ABI,
        functionName: 'allowance',
        args: [userAddress, inputToken, universalRouter as `0x${string}`],
      }) as [bigint, number, number];

      const [p2Amount, p2Expiration] = permit2Allowance;
      const nowSeconds = Math.floor(Date.now() / 1000);

      // ── Build batched call list ────────────────────────────────────────────
      const calls: { target: `0x${string}`; data: `0x${string}`; value: bigint }[] = [];

      if (erc20Allowance < amountIn) {
        calls.push({
          target: inputToken,
          data: encodeFunctionData({
            abi: erc20Abi as Abi,
            functionName: 'approve',
            args: [PERMIT2, BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff')],
          }),
          value: 0n,
        });
      }

      if (p2Amount < amountIn || p2Expiration < nowSeconds) {
        calls.push({
          target: PERMIT2,
          data: encodeFunctionData({
            abi: PERMIT2_ABI as Abi,
            functionName: 'approve',
            args: [inputToken, universalRouter as `0x${string}`, maxUint160, permit2Expiration()],
          }),
          value: 0n,
        });
      }

      // ── Build swap call ────────────────────────────────────────────────────
      const hookData = encodeAbiParameters([{ type: 'address' }], [userAddress]);

      const v4Input = encodeV4SwapInput({
        currency0,
        currency1,
        fee: 500,
        tickSpacing: 10,
        hooks: contracts.PASSPORT_GATED_HOOK as `0x${string}`,
        zeroForOne,
        amountIn,
        amountOutMinimum,
        hookData,
      });

      calls.push({
        target: universalRouter as `0x${string}`,
        data: encodeFunctionData({
          abi: UNIVERSAL_ROUTER_ABI as Abi,
          functionName: 'execute',
          args: [V4_SWAP_COMMAND, [v4Input], swapDeadline()],
        }),
        value: 0n,
      });

      // ── Send as single batched UserOperation ──────────────────────────────
      const result = await sendUserOperationAsync({
        uo: calls.length === 1 ? calls[0] : calls,
      });

      setTxHash(result.hash);
      setStep('success');

    } catch (err: unknown) {
      const e = err as { shortMessage?: string; message?: string };
      const msg = e?.shortMessage ?? e?.message ?? 'Swap failed';
      setErrorMsg(msg);
      setStep('error');
    }
  }, [userAddress, contracts, publicClient, sendUserOperationAsync, client]);

  const reset = useCallback(() => {
    setStep('idle');
    setErrorMsg('');
    setTxHash(undefined);
  }, []);

  return { swap, step, errorMsg, txHash, reset };
}
