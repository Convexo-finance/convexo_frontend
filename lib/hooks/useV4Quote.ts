'use client';

import { useCallback, useEffect, useState } from 'react';
import { useChainId, usePublicClient, useAccount } from '@/lib/wagmi/compat';
import { encodeAbiParameters } from 'viem';
import { getContractsForChain } from '@/lib/contracts/addresses';

// V4 Quoter ABI — quoteExactInputSingle only
const QUOTER_ABI = [
  {
    name: 'quoteExactInputSingle',
    type: 'function',
    inputs: [{
      name: 'params',
      type: 'tuple',
      components: [
        {
          name: 'poolKey',
          type: 'tuple',
          components: [
            { name: 'currency0', type: 'address' },
            { name: 'currency1', type: 'address' },
            { name: 'fee', type: 'uint24' },
            { name: 'tickSpacing', type: 'int24' },
            { name: 'hooks', type: 'address' },
          ],
        },
        { name: 'zeroForOne', type: 'bool' },
        { name: 'exactAmount', type: 'uint128' },
        { name: 'hookData', type: 'bytes' },
      ],
    }],
    outputs: [
      { name: 'deltaAmounts', type: 'int128[]' },
      { name: 'sqrtPriceX96After', type: 'uint160' },
      { name: 'initializedTicksLoaded', type: 'uint32' },
    ],
    stateMutability: 'nonpayable',
  },
] as const;

export function useV4Quote({
  fromSymbol,
  amountIn,
}: {
  fromSymbol: 'USDC' | 'ECOP';
  amountIn: bigint;
}) {
  const { address: userAddress } = useAccount();
  const chainId = useChainId();
  const publicClient = usePublicClient();
  const contracts = getContractsForChain(chainId);

  const [amountOut, setAmountOut] = useState<bigint | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchQuote = useCallback(async () => {
    if (!contracts || !publicClient || amountIn === 0n) {
      setAmountOut(null);
      return;
    }

    const quoter = contracts.QUOTER;
    if (!quoter || quoter === '0x0000000000000000000000000000000000000000') return;

    setIsLoading(true);
    setError(null);

    try {
      // hookData encodes the user address (required by PassportGatedHook)
      // Fall back to zero address for quote-only calls (hook reads but doesn't gate quotes)
      const hookData = encodeAbiParameters(
        [{ type: 'address' }],
        [userAddress ?? '0x0000000000000000000000000000000000000000']
      );

      // Determine canonical pool key ordering: currency0 < currency1 by address
      const ecopIsC0 = contracts.ECOP.toLowerCase() < contracts.USDC.toLowerCase();
      const currency0 = (ecopIsC0 ? contracts.ECOP : contracts.USDC) as `0x${string}`;
      const currency1 = (ecopIsC0 ? contracts.USDC : contracts.ECOP) as `0x${string}`;
      const zeroForOne = ecopIsC0 ? fromSymbol === 'ECOP' : fromSymbol === 'USDC';

      const result = await publicClient.simulateContract({
        address: quoter as `0x${string}`,
        abi: QUOTER_ABI,
        functionName: 'quoteExactInputSingle',
        args: [{
          poolKey: {
            currency0,
            currency1,
            fee: 500,
            tickSpacing: 10,
            hooks: contracts.PASSPORT_GATED_HOOK as `0x${string}`,
          },
          zeroForOne,
          exactAmount: amountIn,
          hookData,
        }],
      });

      // deltaAmounts from pool perspective: output token has negative delta (pool loses it)
      // outputIdx = 1 for zeroForOne (selling c0, receiving c1), 0 for oneForZero
      const deltaAmounts = result.result[0] as bigint[];
      const outputIdx = zeroForOne ? 1 : 0;
      const rawDelta = deltaAmounts[outputIdx];
      setAmountOut(rawDelta < 0n ? -rawDelta : rawDelta);
    } catch (err: unknown) {
      const raw = (err as { shortMessage?: string; message?: string });
      const text = raw?.shortMessage ?? raw?.message ?? '';
      // 0x6190b2b0 = PoolNotInitialized() — pool doesn't exist on this chain yet
      const msg = text.includes('0x6190b2b0') || text.includes('PoolNotInitialized')
        ? 'Pool not available on this network yet'
        : text || 'Quote unavailable';
      setError(msg);
      setAmountOut(null);
    } finally {
      setIsLoading(false);
    }
  }, [contracts, publicClient, fromSymbol, amountIn, userAddress]);

  // Debounce: wait 500ms after last input change before fetching
  useEffect(() => {
    if (amountIn === 0n) {
      setAmountOut(null);
      setError(null);
      return;
    }
    const timer = setTimeout(fetchQuote, 500);
    return () => clearTimeout(timer);
  }, [fetchQuote, amountIn]);

  return { amountOut, isLoading, error };
}
