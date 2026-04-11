'use client';

import { useAccount, useChainId, useReadContract } from '@/lib/wagmi/compat';
import { formatUnits, parseUnits } from 'viem';
import { erc20Abi } from 'viem';
import { useNFTBalance } from '@/lib/hooks/useNFTBalance';
import { useV4Swap } from '@/lib/hooks/useV4Swap';
import { useV4Quote } from '@/lib/hooks/useV4Quote';
import { getContractsForChain, getTxExplorerLink } from '@/lib/contracts/addresses';
import { ecopAbi } from '@/lib/contracts/ecopAbi';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import {
  ArrowsRightLeftIcon,
  LockClosedIcon,
  ChevronDownIcon,
  CheckCircleIcon,
  ArrowTopRightOnSquareIcon,
} from '@heroicons/react/24/outline';

const TOKENS = {
  USDC: { symbol: 'USDC', name: 'USD Coin',        decimals: 6,  icon: '$' },
  ECOP: { symbol: 'ECOP', name: 'Electronic COP',  decimals: 18, icon: '₱' },
} as const;

type TokenSymbol = keyof typeof TOKENS;

// Step labels for the multi-step swap flow
const STEP_LABELS: Record<string, string> = {
  'approving-usdc':    'Approving USDC…',
  'approving-permit2': 'Setting up router…',
  'swapping':          'Swapping…',
};

export default function SwapsPage() {
  const { isConnected, address } = useAccount();
  const chainId = useChainId();
  const contracts = getContractsForChain(chainId);
  const { hasPassportNFT, hasActivePassport, hasAnyLPNFT, hasEcreditscoringNFT } = useNFTBalance();

  const [fromSymbol, setFromSymbol] = useState<TokenSymbol>('USDC');
  const [fromAmount, setFromAmount] = useState('');

  const fromToken = TOKENS[fromSymbol];
  const toSymbol: TokenSymbol = fromSymbol === 'USDC' ? 'ECOP' : 'USDC';
  const toToken = TOKENS[toSymbol];

  // Parse input amount to bigint
  const amountInWei = (() => {
    try {
      return fromAmount ? parseUnits(fromAmount, fromToken.decimals) : 0n;
    } catch {
      return 0n;
    }
  })();

  // On-chain quote via V4 Quoter
  const { amountOut, isLoading: isQuoting, error: quoteError } = useV4Quote({
    fromSymbol,
    amountIn: amountInWei,
  });

  const toAmount = amountOut
    ? parseFloat(formatUnits(amountOut, toToken.decimals)).toLocaleString('en-US', {
        maximumFractionDigits: toToken.decimals === 6 ? 2 : 0,
      })
    : '';

  // V4 swap hook
  const { swap, step, errorMsg, txHash, reset } = useV4Swap();

  const canAccess = hasPassportNFT || hasActivePassport || hasAnyLPNFT || hasEcreditscoringNFT;
  const isProcessing = ['approving-usdc', 'approving-permit2', 'swapping'].includes(step);

  // Token balances
  const { data: usdcBalance } = useReadContract({
    address: contracts?.USDC,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!contracts },
  });

  const { data: ecopBalance } = useReadContract({
    address: contracts?.ECOP,
    abi: ecopAbi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!contracts && contracts.ECOP !== '0x0000000000000000000000000000000000000000' },
  });

  const getBalance = (symbol: TokenSymbol) => {
    if (symbol === 'USDC' && usdcBalance) return parseFloat(formatUnits(usdcBalance as bigint, 6)).toLocaleString();
    if (symbol === 'ECOP' && ecopBalance) return parseFloat(formatUnits(ecopBalance as bigint, 18)).toLocaleString();
    return '0';
  };

  const handleSwapDirection = () => {
    setFromSymbol(toSymbol);
    setFromAmount('');
    reset();
  };

  const handleSwap = async () => {
    if (!fromAmount || amountInWei === 0n) return;
    await swap({
      fromSymbol,
      amountIn: amountInWei,
      amountOutMinimum: amountOut ? (amountOut * 95n) / 100n : 0n, // 5% slippage tolerance
    });
  };

  // Reset form after success
  useEffect(() => {
    if (step === 'success') {
      setFromAmount('');
    }
  }, [step]);

  if (!isConnected) {
    return (
        <div className="flex items-center justify-center h-full min-h-[80vh]">
          <div className="text-center p-8">
            <ArrowsRightLeftIcon className="w-16 h-16 mx-auto mb-4 text-gray-500" />
            <h2 className="text-2xl font-bold text-white mb-2">Connect Your Wallet</h2>
            <p className="text-gray-400">Connect your wallet to access swaps</p>
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
              <h2 className="text-2xl font-bold text-white mb-2">Tier 1 Required</h2>
              <p className="text-gray-400 mb-6">
                You need at least a CONVEXO PASSPORT (Tier 1) to access swap features.
              </p>
              <Link href="/digital-id/humanity">
                <button className="btn-primary">Get Verified</button>
              </Link>
            </div>
          </div>
        </div>
    );
  }

  return (
      <div className="p-8">
        <div className="max-w-xl mx-auto space-y-8">

          {/* Header */}
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Link href="/treasury" className="text-gray-400 hover:text-white">Treasury</Link>
              <span className="text-gray-600">/</span>
              <span className="text-white">Swaps</span>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Token Swaps</h1>
            <p className="text-gray-400">Swap USDC and ECOP via Uniswap V4</p>
          </div>

          {/* Success state */}
          {step === 'success' && (
            <div className="card p-6 text-center space-y-4">
              <CheckCircleIcon className="w-12 h-12 text-emerald-400 mx-auto" />
              <p className="text-white font-semibold text-lg">Swap successful!</p>
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
              <button onClick={reset} className="btn-secondary w-full">
                Swap again
              </button>
            </div>
          )}

          {/* Swap card */}
          {step !== 'success' && (
            <div className="card p-6">
              {/* From */}
              <div className="mb-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">From</span>
                  <span className="text-sm text-gray-400">
                    Balance: {getBalance(fromSymbol)} {fromSymbol}
                  </span>
                </div>
                <div className="flex items-center gap-4 p-4 bg-gray-800 rounded-xl">
                  <input
                    type="number"
                    value={fromAmount}
                    onChange={(e) => { setFromAmount(e.target.value); reset(); }}
                    placeholder="0.00"
                    disabled={isProcessing}
                    className="flex-1 bg-transparent text-2xl font-semibold text-white outline-none disabled:opacity-50"
                  />
                  <div className="flex items-center gap-2 px-4 py-2 bg-gray-700 rounded-xl">
                    <span className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-sm font-bold">
                      {fromToken.icon}
                    </span>
                    <span className="font-medium text-white">{fromToken.symbol}</span>
                  </div>
                </div>
              </div>

              {/* Direction toggle */}
              <div className="flex justify-center -my-2 relative z-10">
                <button
                  onClick={handleSwapDirection}
                  disabled={isProcessing}
                  className="p-3 bg-gray-900 rounded-xl border border-gray-700 hover:border-purple-500 transition-colors disabled:opacity-50"
                >
                  <ArrowsRightLeftIcon className="w-5 h-5 text-gray-400 rotate-90" />
                </button>
              </div>

              {/* To */}
              <div className="mt-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">To (estimated)</span>
                  <span className="text-sm text-gray-400">
                    Balance: {getBalance(toSymbol)} {toSymbol}
                  </span>
                </div>
                <div className="flex items-center gap-4 p-4 bg-gray-800 rounded-xl">
                  <div className="flex-1 text-2xl font-semibold text-white">
                    {isQuoting ? (
                      <span className="text-gray-500 text-base">Fetching quote…</span>
                    ) : (
                      toAmount || <span className="text-gray-600">0.00</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-gray-700 rounded-xl">
                    <span className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white text-sm font-bold">
                      {toToken.icon}
                    </span>
                    <span className="font-medium text-white">{toToken.symbol}</span>
                    <ChevronDownIcon className="w-4 h-4 text-gray-400 opacity-0" />
                  </div>
                </div>
              </div>

              {/* Quote info */}
              {amountOut && fromAmount && (
                <div className="mt-4 p-3 bg-gray-800/50 rounded-xl space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Rate</span>
                    <span className="text-white">
                      1 {fromSymbol} ={' '}
                      {fromSymbol === 'USDC'
                        ? parseFloat(formatUnits(amountOut, 18)).toLocaleString('en-US', { maximumFractionDigits: 0 })
                        : parseFloat(formatUnits(amountOut, 6)).toFixed(6)
                      } {toSymbol}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Slippage tolerance</span>
                    <span className="text-white">5%</span>
                  </div>
                </div>
              )}

              {/* Quote error */}
              {quoteError && fromAmount && (
                <div className="mt-3 p-3 bg-yellow-900/20 border border-yellow-700/40 rounded-xl">
                  <p className="text-yellow-400 text-sm">{quoteError}</p>
                </div>
              )}

              {/* Processing status */}
              {isProcessing && (
                <div className="mt-4 flex items-center gap-3 p-3 bg-purple-900/20 border border-purple-700/40 rounded-xl">
                  <div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin shrink-0" />
                  <span className="text-purple-300 text-sm">{STEP_LABELS[step]}</span>
                </div>
              )}

              {/* Swap error */}
              {step === 'error' && errorMsg && (
                <div className="mt-4 p-3 bg-red-900/20 border border-red-700/40 rounded-xl">
                  <p className="text-red-400 text-sm">{errorMsg}</p>
                </div>
              )}

              {/* Swap button */}
              <button
                onClick={handleSwap}
                disabled={!fromAmount || amountInWei === 0n || isProcessing || isQuoting}
                className="btn-primary w-full mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? STEP_LABELS[step] : 'Swap'}
              </button>
            </div>
          )}

          {/* Pool info */}
          <div className="card">
            <h3 className="text-lg font-semibold text-white mb-4">USDC / ECOP Pool</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Protocol</span>
                <span className="text-white">Uniswap V4</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Fee tier</span>
                <span className="text-white">0.05%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Access</span>
                <span className="text-emerald-400">Tier 1+ (Convexo Passport)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Network</span>
                <span className="text-white">{contracts?.CHAIN_NAME ?? 'Unknown'}</span>
              </div>
            </div>
          </div>

        </div>
      </div>
  );
}
