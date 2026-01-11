'use client';

import { useAccount, useChainId, useReadContract } from 'wagmi';
import { formatUnits } from 'viem';
import { erc20Abi } from 'viem';
import DashboardLayout from '@/components/DashboardLayout';
import { useNFTBalance } from '@/lib/hooks/useNFTBalance';
import { getContractsForChain } from '@/lib/contracts/addresses';
import { ecopAbi } from '@/lib/contracts/ecopAbi';
import Link from 'next/link';
import { useState } from 'react';
import {
  ArrowsRightLeftIcon,
  LockClosedIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';

const tokens = [
  { symbol: 'USDC', name: 'USD Coin', decimals: 6, icon: '$' },
  { symbol: 'ECOP', name: 'Electronic COP', decimals: 18, icon: '₱' },
];

export default function SwapsPage() {
  const { isConnected, address } = useAccount();
  const chainId = useChainId();
  const contracts = getContractsForChain(chainId);
  const { hasPassportNFT, hasActivePassport, hasAnyLPNFT, hasEcreditscoringNFT } = useNFTBalance();
  
  const [fromToken, setFromToken] = useState(tokens[0]);
  const [toToken, setToToken] = useState(tokens[1]);
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');

  const canAccess = hasPassportNFT || hasActivePassport || hasAnyLPNFT || hasEcreditscoringNFT;

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

  const swapTokens = () => {
    setFromToken(toToken);
    setToToken(fromToken);
    setFromAmount(toAmount);
    setToAmount(fromAmount);
  };

  const handleFromAmountChange = (value: string) => {
    setFromAmount(value);
    // Mock exchange rate calculation
    if (value) {
      const rate = fromToken.symbol === 'USDC' ? 4200 : 1/4200;
      setToAmount((parseFloat(value) * rate).toFixed(toToken.decimals === 6 ? 2 : 0));
    } else {
      setToAmount('');
    }
  };

  const getBalance = (symbol: string) => {
    if (symbol === 'USDC' && usdcBalance) {
      return parseFloat(formatUnits(usdcBalance as bigint, 6)).toLocaleString();
    }
    if (symbol === 'ECOP' && ecopBalance) {
      return parseFloat(formatUnits(ecopBalance as bigint, 18)).toLocaleString();
    }
    return '0';
  };

  if (!isConnected) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full min-h-[80vh]">
          <div className="text-center p-8">
            <ArrowsRightLeftIcon className="w-16 h-16 mx-auto mb-4 text-gray-500" />
            <h2 className="text-2xl font-bold text-white mb-2">Connect Your Wallet</h2>
            <p className="text-gray-400">Connect your wallet to access swaps</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!canAccess) {
    return (
      <DashboardLayout>
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
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
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
            <p className="text-gray-400">Swap between ECOP, USDC, and EUR pools</p>
          </div>

          {/* Swap Card */}
          <div className="card p-6">
            {/* From Token */}
            <div className="mb-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">From</span>
                <span className="text-sm text-gray-400">
                  Balance: {getBalance(fromToken.symbol)} {fromToken.symbol}
                </span>
              </div>
              <div className="flex items-center gap-4 p-4 bg-gray-800 rounded-xl">
                <input
                  type="number"
                  value={fromAmount}
                  onChange={(e) => handleFromAmountChange(e.target.value)}
                  placeholder="0.00"
                  className="flex-1 bg-transparent text-2xl font-semibold text-white outline-none"
                />
                <button className="flex items-center gap-2 px-4 py-2 bg-gray-700 rounded-xl hover:bg-gray-600 transition-colors">
                  <span className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-sm font-bold">
                    {fromToken.icon}
                  </span>
                  <span className="font-medium text-white">{fromToken.symbol}</span>
                  <ChevronDownIcon className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            </div>

            {/* Swap Button */}
            <div className="flex justify-center -my-2 relative z-10">
              <button
                onClick={swapTokens}
                className="p-3 bg-gray-900 rounded-xl border border-gray-700 hover:border-purple-500 transition-colors"
              >
                <ArrowsRightLeftIcon className="w-5 h-5 text-gray-400 rotate-90" />
              </button>
            </div>

            {/* To Token */}
            <div className="mt-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">To</span>
                <span className="text-sm text-gray-400">
                  Balance: {getBalance(toToken.symbol)} {toToken.symbol}
                </span>
              </div>
              <div className="flex items-center gap-4 p-4 bg-gray-800 rounded-xl">
                <input
                  type="number"
                  value={toAmount}
                  readOnly
                  placeholder="0.00"
                  className="flex-1 bg-transparent text-2xl font-semibold text-white outline-none"
                />
                <button className="flex items-center gap-2 px-4 py-2 bg-gray-700 rounded-xl hover:bg-gray-600 transition-colors">
                  <span className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white text-sm font-bold">
                    {toToken.icon}
                  </span>
                  <span className="font-medium text-white">{toToken.symbol}</span>
                  <ChevronDownIcon className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            </div>

            {/* Rate Info */}
            {fromAmount && toAmount && (
              <div className="mt-4 p-3 bg-gray-800/50 rounded-xl">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Exchange Rate</span>
                  <span className="text-white">
                    1 {fromToken.symbol} = {fromToken.symbol === 'USDC' ? '4,200' : '0.000238'} {toToken.symbol}
                  </span>
                </div>
              </div>
            )}

            {/* Swap Button */}
            <button className="btn-primary w-full mt-6" disabled={!fromAmount}>
              Swap
            </button>
          </div>

          {/* Pool Info */}
          <div className="card">
            <h3 className="text-lg font-semibold text-white mb-4">Available Pools</h3>
            <div className="space-y-3">
              {[
                { pair: 'USDC/ECOP', tvl: '$125,000', apy: '8.5%' },
                { pair: 'USDC/EUR', tvl: '$89,000', apy: '6.2%' },
              ].map((pool) => (
                <div key={pool.pair} className="flex items-center justify-between p-4 bg-gray-800/50 rounded-xl">
                  <span className="font-medium text-white">{pool.pair}</span>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-xs text-gray-400">TVL</p>
                      <p className="text-sm font-medium text-white">{pool.tvl}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400">APY</p>
                      <p className="text-sm font-medium text-emerald-400">{pool.apy}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}


