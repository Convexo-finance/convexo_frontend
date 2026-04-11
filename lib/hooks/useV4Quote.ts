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

      // USDC is currency0 (lower address), ECOP is currency1
      const zeroForOne = fromSymbol === 'USDC'; // USDC→ECOP

      const result = await publicClient.simulateContract({
        address: quoter as `0x${string}`,
        abi: QUOTER_ABI,
        functionName: 'quoteExactInputSingle',
        args: [{
          poolKey: {
            currency0: contracts.USDC,
            currency1: contracts.ECOP,
            fee: 500,
            tickSpacing: 10,
            hooks: contracts.PASSPORT_GATED_HOOK as `0x${string}`,
          },
          zeroForOne,
          exactAmount: amountIn,
          hookData,
        }],
      });

      // deltaAmounts from pool perspective:
      //   zeroForOne (USDC→ECOP): deltaAmounts[0] > 0 (pool gains USDC), deltaAmounts[1] < 0 (pool loses ECOP)
      //   Output = -deltaAmounts[1] for zeroForOne, -deltaAmounts[0] for oneForZero
      const deltaAmounts = result.result[0] as bigint[];
      const outputIdx = zeroForOne ? 1 : 0;
      const rawDelta = deltaAmounts[outputIdx];
      setAmountOut(rawDelta < 0n ? -rawDelta : rawDelta);
    } catch (err: unknown) {
      const msg = (err as { shortMessage?: string })?.shortMessage ?? 'Quote unavailable';
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
