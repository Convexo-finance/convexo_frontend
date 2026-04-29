'use client';

import { useState, useCallback } from 'react';
import { createSmartWalletClient, alchemyWalletTransport } from '@alchemy/wallet-apis';
import { useAccount, useChainId, usePublicClient } from '@/lib/wagmi/compat';
import { usePrivySigner } from '@/lib/privy/usePrivySigner';
import { getViemChain, getPolicyId } from '@/lib/privy/config';
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
const V4_SWAP_COMMAND      = '0x10' as `0x${string}`;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const permit2Expiration = () => Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60;
const swapDeadline      = () => BigInt(Math.floor(Date.now() / 1000) + 300);

function encodeV4SwapInput({
  currency0, currency1, fee, tickSpacing, hooks,
  zeroForOne, amountIn, amountOutMinimum, hookData,
}: {
  currency0: `0x${string}`; currency1: `0x${string}`; fee: number;
  tickSpacing: number; hooks: `0x${string}`; zeroForOne: boolean;
  amountIn: bigint; amountOutMinimum: bigint; hookData: `0x${string}`;
}): `0x${string}` {
  const poolKeyComponents = [
    { name: 'currency0', type: 'address' as const },
    { name: 'currency1', type: 'address' as const },
    { name: 'fee', type: 'uint24' as const },
    { name: 'tickSpacing', type: 'int24' as const },
    { name: 'hooks', type: 'address' as const },
  ];

  const swapParams = encodeAbiParameters(
    [{ type: 'tuple', components: [
      { name: 'poolKey', type: 'tuple', components: poolKeyComponents },
      { name: 'zeroForOne', type: 'bool' },
      { name: 'amountIn', type: 'uint128' },
      { name: 'amountOutMinimum', type: 'uint128' },
      { name: 'hookData', type: 'bytes' },
    ]}],
    [{ poolKey: { currency0, currency1, fee, tickSpacing, hooks }, zeroForOne, amountIn, amountOutMinimum, hookData }]
  );

  const inputCurrency  = zeroForOne ? currency0 : currency1;
  const outputCurrency = zeroForOne ? currency1 : currency0;

  const settleParams = encodeAbiParameters(
    [{ type: 'address' }, { type: 'uint256' }], [inputCurrency, amountIn]
  );
  const takeParams = encodeAbiParameters(
    [{ type: 'address' }, { type: 'uint256' }], [outputCurrency, amountOutMinimum]
  );

  const actions = encodePacked(['uint8', 'uint8', 'uint8'], [SWAP_EXACT_IN_SINGLE, SETTLE_ALL, TAKE_ALL]);

  return encodeAbiParameters(
    [{ type: 'bytes' }, { type: 'bytes[]' }],
    [actions, [swapParams, settleParams, takeParams]]
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export type SwapStep = 'idle' | 'swapping' | 'success' | 'error';

export function useV4Swap() {
  const { address: userAddress } = useAccount();
  const chainId = useChainId();
  const publicClient = usePublicClient();
  const contracts = getContractsForChain(chainId);
  const signer = usePrivySigner();

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
    if (!signer) {
      setErrorMsg('Smart account not ready — sign in to swap');
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

    const chain = getViemChain(chainId);
    const client = createSmartWalletClient({
      signer,
      transport: alchemyWalletTransport({ apiKey: process.env.NEXT_PUBLIC_ALCHEMY_API_KEY! }),
      chain,
      paymaster: { policyId: getPolicyId(chainId) },
    });

    // Determine pool key ordering: currency0 < currency1 by address
    const ecopIsC0   = contracts.ECOP.toLowerCase() < contracts.USDC.toLowerCase();
    const currency0  = (ecopIsC0 ? contracts.ECOP : contracts.USDC) as `0x${string}`;
    const currency1  = (ecopIsC0 ? contracts.USDC : contracts.ECOP) as `0x${string}`;
    const zeroForOne = ecopIsC0 ? fromSymbol === 'ECOP' : fromSymbol === 'USDC';
    const inputToken = fromSymbol === 'USDC' ? contracts.USDC : contracts.ECOP;

    try {
      setErrorMsg('');
      setStep('swapping');

      // Read current allowances
      const erc20Allowance = await publicClient.readContract({
        address: inputToken,
        abi: erc20Abi,
        functionName: 'allowance',
        args: [userAddress, PERMIT2],
      }) as bigint;

      const [p2Amount, p2Expiration] = await publicClient.readContract({
        address: PERMIT2,
        abi: PERMIT2_ABI,
        functionName: 'allowance',
        args: [userAddress, inputToken, universalRouter as `0x${string}`],
      }) as [bigint, number, number];

      const nowSeconds = Math.floor(Date.now() / 1000);

      // Build batched call list
      const calls: { to: `0x${string}`; data: `0x${string}`; value: bigint }[] = [];

      if (erc20Allowance < amountIn) {
        calls.push({
          to: inputToken,
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
          to: PERMIT2,
          data: encodeFunctionData({
            abi: PERMIT2_ABI as Abi,
            functionName: 'approve',
            args: [inputToken, universalRouter as `0x${string}`, maxUint160, permit2Expiration()],
          }),
          value: 0n,
        });
      }

      const hookData = encodeAbiParameters([{ type: 'address' }], [userAddress]);
      const v4Input = encodeV4SwapInput({
        currency0, currency1, fee: 500, tickSpacing: 10,
        hooks: contracts.PASSPORT_GATED_HOOK as `0x${string}`,
        zeroForOne, amountIn, amountOutMinimum, hookData,
      });

      calls.push({
        to: universalRouter as `0x${string}`,
        data: encodeFunctionData({
          abi: UNIVERSAL_ROUTER_ABI as Abi,
          functionName: 'execute',
          args: [V4_SWAP_COMMAND, [v4Input], swapDeadline()],
        }),
        value: 0n,
      });

      const { id } = await client.sendCalls({ calls });
      const result = await client.waitForCallsStatus({ id });
      setTxHash(result.receipts?.[0]?.transactionHash as `0x${string}` | undefined);
      setStep('success');

    } catch (err: unknown) {
      const e = err as { shortMessage?: string; message?: string };
      setErrorMsg(e?.shortMessage ?? e?.message ?? 'Swap failed');
      setStep('error');
    }
  }, [userAddress, contracts, publicClient, signer, chainId]);

  const reset = useCallback(() => {
    setStep('idle');
    setErrorMsg('');
    setTxHash(undefined);
  }, []);

  return { swap, step, errorMsg, txHash, reset };
}
