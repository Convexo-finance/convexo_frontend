'use client';

import { useCallback, useEffect, useState } from 'react';
import { useChainId, usePublicClient } from '@/lib/wagmi/compat';
import { encodePacked, keccak256 } from 'viem';
import { getContractsForChain } from '@/lib/contracts/addresses';

// StateLibrary constants (v4-core v1.0.x)
const POOLS_SLOT = BigInt(6);

// MASK_160_BITS = (1 << 160) - 1
const MASK_160_BITS = (1n << 160n) - 1n;

const EXTSLOAD_ABI = [
  {
    name: 'extsload',
    type: 'function',
    inputs: [{ name: 'slot', type: 'bytes32' }],
    outputs: [{ name: '', type: 'bytes32' }],
    stateMutability: 'view',
  },
] as const;

/** Compute pool storage slot: keccak256(abi.encodePacked(poolId, POOLS_SLOT)) */
function poolStateSlot(poolId: `0x${string}`): `0x${string}` {
  return keccak256(
    encodePacked(
      ['bytes32', 'bytes32'],
      [poolId, `0x${POOLS_SLOT.toString(16).padStart(64, '0')}` as `0x${string}`]
    )
  );
}

/** Compute keccak256(abi.encode(currency0, currency1, fee, tickSpacing, hooks)) */
function computePoolId(
  currency0: `0x${string}`,
  currency1: `0x${string}`,
  fee: number,
  tickSpacing: number,
  hooks: `0x${string}`
): `0x${string}` {
  // abi.encode pads each value to 32 bytes
  const addr0 = currency0.toLowerCase().replace('0x', '').padStart(64, '0');
  const addr1 = currency1.toLowerCase().replace('0x', '').padStart(64, '0');
  const feeHex = fee.toString(16).padStart(64, '0');
  const tickHex = ((tickSpacing < 0 ? (BigInt(tickSpacing) + (1n << 256n)) : BigInt(tickSpacing))).toString(16).padStart(64, '0');
  const hooksHex = hooks.toLowerCase().replace('0x', '').padStart(64, '0');
  return keccak256(`0x${addr0}${addr1}${feeHex}${tickHex}${hooksHex}`);
}

/**
 * Estimate output amount from sqrtPriceX96 (no price impact — accurate for small swaps).
 *
 * ECOP = currency0 (18 decimals), USDC = currency1 (6 decimals)
 * sqrtPriceX96 encodes price as: sqrt(token1/token0) * 2^96 (raw unit ratio)
 *
 * raw price = (sqrtPriceX96 / 2^96)^2 → ratio of raw token units
 *
 * For zeroForOne (ECOP → USDC):
 *   outUSDC_raw = inECOP_raw * sqrtPriceX96^2 / 2^192
 * For oneForZero (USDC → ECOP):
 *   outECOP_raw = inUSDC_raw * 2^192 / sqrtPriceX96^2
 */
function estimateOutput(sqrtPriceX96: bigint, amountIn: bigint, zeroForOne: boolean): bigint {
  const Q192 = 1n << 192n;
  if (sqrtPriceX96 === 0n) return 0n;
  if (zeroForOne) {
    // selling currency0 (ECOP) for currency1 (USDC)
    return (amountIn * sqrtPriceX96 * sqrtPriceX96) / Q192;
  } else {
    // selling currency1 (USDC) for currency0 (ECOP)
    return (amountIn * Q192) / (sqrtPriceX96 * sqrtPriceX96);
  }
}

export function useV4Quote({
  fromSymbol,
  amountIn,
}: {
  fromSymbol: 'USDC' | 'ECOP';
  amountIn: bigint;
}) {
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

    setIsLoading(true);
    setError(null);

    try {
      const ecopIsC0 = contracts.ECOP.toLowerCase() < contracts.USDC.toLowerCase();
      const currency0 = (ecopIsC0 ? contracts.ECOP : contracts.USDC) as `0x${string}`;
      const currency1 = (ecopIsC0 ? contracts.USDC : contracts.ECOP) as `0x${string}`;
      const zeroForOne = ecopIsC0 ? fromSymbol === 'ECOP' : fromSymbol === 'USDC';

      const poolId = computePoolId(currency0, currency1, 500, 10, contracts.PASSPORT_GATED_HOOK as `0x${string}`);
      const slot = poolStateSlot(poolId);

      const raw = await publicClient.readContract({
        address: contracts.POOL_MANAGER as `0x${string}`,
        abi: EXTSLOAD_ABI,
        functionName: 'extsload',
        args: [slot],
      });

      const slotData = BigInt(raw as string);
      const sqrtPriceX96 = slotData & MASK_160_BITS;

      if (sqrtPriceX96 === 0n) {
        setError('Pool not initialized');
        setAmountOut(null);
        return;
      }

      const out = estimateOutput(sqrtPriceX96, amountIn, zeroForOne);
      setAmountOut(out > 0n ? out : null);
    } catch (err: unknown) {
      const msg = (err as { shortMessage?: string; message?: string })?.shortMessage
        ?? (err as { message?: string })?.message
        ?? 'Quote unavailable';
      setError(msg.slice(0, 120));
      setAmountOut(null);
    } finally {
      setIsLoading(false);
    }
  }, [contracts, publicClient, fromSymbol, amountIn]);

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
