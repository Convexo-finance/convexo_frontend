'use client';

import { useAccount, useChainId, useReadContract } from '@/lib/wagmi/compat';
import { useState } from 'react';
import { formatUnits, parseUnits, erc20Abi } from 'viem';
import { getContractsForChain, getTxExplorerLink } from '@/lib/contracts/addresses';
import { useNFTBalance } from '@/lib/hooks/useNFTBalance';
import { useV4Swap } from '@/lib/hooks/useV4Swap';
import { useV4Quote } from '@/lib/hooks/useV4Quote';
import { ecopAbi } from '@/lib/contracts/ecopAbi';
import Link from 'next/link';
import {
  ArrowsUpDownIcon,
  LockClosedIcon,
  CheckCircleIcon,
  ArrowTopRightOnSquareIcon,
} from '@heroicons/react/24/outline';

type SwapDir = 'ecop-to-usdc' | 'usdc-to-ecop';

export default function ConvertFastPage() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const contracts = getContractsForChain(chainId);
  const { hasPassportNFT, hasActivePassport, hasAnyLPNFT } = useNFTBalance();

  const [dir, setDir] = useState<SwapDir>('ecop-to-usdc');
  const [inputAmount, setInputAmount] = useState('');

  const canAccess = hasPassportNFT || hasActivePassport || hasAnyLPNFT;

  const fromSymbol: 'USDC' | 'ECOP' = dir === 'ecop-to-usdc' ? 'ECOP' : 'USDC';
  const toSymbol: 'USDC' | 'ECOP'   = dir === 'ecop-to-usdc' ? 'USDC' : 'ECOP';
  const inputDecimals  = fromSymbol === 'ECOP' ? 18 : 6;
  const outputDecimals = toSymbol   === 'ECOP' ? 18 : 6;

  const amountInWei = (() => {
    try { return inputAmount ? parseUnits(inputAmount, inputDecimals) : 0n; }
    catch { return 0n; }
  })();

  const { amountOut, isLoading: isQuoting, error: quoteError } = useV4Quote({
    fromSymbol,
    amountIn: amountInWei,
  });

  const { swap, step, errorMsg, txHash, reset } = useV4Swap();
  const isProcessing = step === 'swapping';

  // Token balances
  const ecopEnabled = !!address && !!contracts && contracts.ECOP !== '0x0000000000000000000000000000000000000000';
  const { data: ecopBalance } = useReadContract({
    address: contracts?.ECOP,
    abi: ecopAbi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: ecopEnabled },
  });
  const { data: usdcBalance } = useReadContract({
    address: contracts?.USDC,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!contracts },
  });

  const inputBalance = fromSymbol === 'ECOP'
    ? (ecopBalance ? parseFloat(formatUnits(ecopBalance as bigint, 18)) : 0)
    : (usdcBalance ? parseFloat(formatUnits(usdcBalance as bigint, 6)) : 0);

  const outputAmount = amountOut
    ? parseFloat(formatUnits(amountOut, outputDecimals)).toLocaleString('en-US', {
        maximumFractionDigits: outputDecimals === 6 ? 2 : 0,
      })
    : '';

  const flipDirection = () => {
    setDir(d => d === 'ecop-to-usdc' ? 'usdc-to-ecop' : 'ecop-to-usdc');
    setInputAmount('');
    reset();
  };

  const handleMax = () => setInputAmount(inputBalance.toFixed(inputDecimals === 6 ? 2 : 4));

  const handleSwap = async () => {
    if (!inputAmount || amountInWei === 0n) return;
    await swap({
      fromSymbol,
      amountIn: amountInWei,
      amountOutMinimum: amountOut ? (amountOut * 95n) / 100n : 0n,
    });
  };

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center h-full min-h-[80vh]">
        <div className="text-center p-8">
          <ArrowsUpDownIcon className="w-16 h-16 mx-auto mb-4 text-gray-500" />
          <h2 className="text-2xl font-bold text-white mb-2">Connect Your Wallet</h2>
          <p className="text-gray-400">Connect your wallet to access Convert Fast</p>
        </div>
      </div>
    );
  }

  if (!canAccess) {
    return (
      <div className="p-8">
        <div className="max-w-2xl mx-auto">
          <div className="card p-8 text-center">
            <LockClosedIcon className="w-16 h-16 mx-auto mb-4 text-gray-500" />
            <h2 className="text-2xl font-bold text-white mb-2">Verification Required</h2>
            <p className="text-gray-400 mb-6">
              You need a CONVEXO PASSPORT (Tier 1) to access treasury features.
            </p>
            <Link href="/digital-id/humanity">
              <button className="btn-primary">Get Verified</button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div className="p-8">
        <div className="max-w-lg mx-auto">
          <div className="card p-8 text-center space-y-4">
            <CheckCircleIcon className="w-16 h-16 text-emerald-400 mx-auto" />
            <p className="text-white font-semibold text-xl">Swap successful!</p>
            {txHash && (
              <a
                href={getTxExplorerLink(chainId, txHash)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-purple-400 hover:text-purple-300"
              >
                View transaction <ArrowTopRightOnSquareIcon className="w-4 h-4" />
              </a>
            )}
            <button onClick={() => { reset(); setInputAmount(''); }} className="btn-secondary w-full">
              Swap again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-lg mx-auto space-y-6">

        {/* Header */}
        <div>
          <div className="flex items-center gap-3 mb-2 text-sm">
            <Link href="/treasury" className="text-gray-400 hover:text-white transition-colors">Treasury</Link>
            <span className="text-gray-600">/</span>
            <span className="text-white">Convert Fast</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-1">Convert Fast</h1>
          <p className="text-gray-400">Swap ECOP ↔ USDC via the Uniswap V4 pool</p>
        </div>

        {/* Swap card */}
        <div className="card space-y-2 p-6">

          {/* Input */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">You pay</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">
                  Balance: {inputBalance.toLocaleString(undefined, { maximumFractionDigits: 4 })} {fromSymbol}
                </span>
                <button onClick={handleMax} className="text-xs text-purple-400 hover:text-purple-300 font-medium">
                  MAX
                </button>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-gray-900/60 rounded-xl border border-gray-700/50">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                {fromSymbol[0]}
              </div>
              <input
                type="number"
                value={inputAmount}
                onChange={e => { setInputAmount(e.target.value); reset(); }}
                placeholder="0.00"
                min="0"
                step="any"
                disabled={isProcessing}
                className="flex-1 bg-transparent text-2xl font-semibold text-white outline-none placeholder-gray-600 disabled:opacity-50"
              />
              <span className="text-white font-semibold text-lg">{fromSymbol}</span>
            </div>
          </div>

          {/* Flip button */}
          <div className="flex justify-center">
            <button
              onClick={flipDirection}
              disabled={isProcessing}
              className="p-2.5 bg-gray-800 border border-gray-700 rounded-xl hover:border-purple-500/50 hover:bg-gray-700 transition-all disabled:opacity-50"
              title="Flip direction"
            >
              <ArrowsUpDownIcon className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Output */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">You receive (estimated)</span>
            </div>
            <div className="flex items-center gap-3 p-4 bg-gray-900/60 rounded-xl border border-gray-700/50">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                {toSymbol[0]}
              </div>
              <div className="flex-1 text-2xl font-semibold text-white">
                {isQuoting ? (
                  <span className="text-gray-500 text-base">Fetching quote…</span>
                ) : (
                  outputAmount || <span className="text-gray-600">0.00</span>
                )}
              </div>
              <span className="text-white font-semibold text-lg">{toSymbol}</span>
            </div>
          </div>

          {/* Quote info */}
          {amountOut && inputAmount && (
            <div className="p-3 bg-gray-800/50 rounded-xl space-y-1 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Rate (V4 pool)</span>
                <span className="text-white">
                  1 {fromSymbol} ≈ {fromSymbol === 'USDC'
                    ? parseFloat(formatUnits(amountOut, 18)).toLocaleString('en-US', { maximumFractionDigits: 0 })
                    : parseFloat(formatUnits(amountOut, 6)).toFixed(6)
                  } {toSymbol}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Slippage tolerance</span>
                <span className="text-white">5%</span>
              </div>
            </div>
          )}

          {/* Quote error */}
          {quoteError && inputAmount && (
            <div className="p-3 bg-yellow-900/20 border border-yellow-700/40 rounded-xl">
              <p className="text-yellow-400 text-sm">{quoteError}</p>
            </div>
          )}

          {/* Processing */}
          {isProcessing && (
            <div className="flex items-center gap-3 p-3 bg-purple-900/20 border border-purple-700/40 rounded-xl">
              <div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin shrink-0" />
              <span className="text-purple-300 text-sm">Swapping…</span>
            </div>
          )}

          {/* Swap error */}
          {step === 'error' && errorMsg && (
            <div className="p-3 bg-red-900/20 border border-red-700/40 rounded-xl">
              <p className="text-red-400 text-sm">{errorMsg}</p>
            </div>
          )}

          {/* Swap button */}
          <button
            onClick={handleSwap}
            disabled={!inputAmount || amountInWei === 0n || isProcessing || isQuoting}
            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? 'Swapping…' : `Swap ${fromSymbol} → ${toSymbol}`}
          </button>
        </div>

        {/* Pool info */}
        <div className="card">
          <h3 className="text-sm font-semibold text-white mb-3">Pool Details</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="p-3 bg-gray-800/50 rounded-lg">
              <p className="text-gray-400 text-xs mb-1">Pair</p>
              <p className="text-white font-medium">ECOP / USDC</p>
            </div>
            <div className="p-3 bg-gray-800/50 rounded-lg">
              <p className="text-gray-400 text-xs mb-1">Protocol</p>
              <p className="text-white font-medium">Uniswap V4</p>
            </div>
            <div className="p-3 bg-gray-800/50 rounded-lg">
              <p className="text-gray-400 text-xs mb-1">Network</p>
              <p className="text-white font-medium">{contracts?.CHAIN_NAME ?? 'Unknown'}</p>
            </div>
            <div className="p-3 bg-gray-800/50 rounded-lg">
              <p className="text-gray-400 text-xs mb-1">Slippage</p>
              <p className="text-white font-medium">5% max</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
