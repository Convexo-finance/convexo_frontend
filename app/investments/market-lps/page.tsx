'use client';

import { useAccount } from 'wagmi';
import DashboardLayout from '@/components/DashboardLayout';
import { useNFTBalance } from '@/lib/hooks/useNFTBalance';
import Link from 'next/link';
import {
  ArrowTrendingUpIcon,
  LockClosedIcon,
  PlusCircleIcon,
  ArrowsRightLeftIcon,
} from '@heroicons/react/24/outline';

export default function MarketLPsPage() {
  const { isConnected } = useAccount();
  const { hasAnyLPNFT, hasEcreditscoringNFT } = useNFTBalance();

  // LP pools require Tier 2 (Limited Partner)
  const canAccess = hasAnyLPNFT || hasEcreditscoringNFT;

  const pools = [
    {
      id: 1,
      pair: 'USDC / ECOP',
      tvl: '$125,000',
      volume24h: '$45,000',
      apy: '8.5%',
      fee: '0.3%',
      myLiquidity: '$0',
    },
    {
      id: 2,
      pair: 'USDC / EUR',
      tvl: '$89,000',
      volume24h: '$32,000',
      apy: '6.2%',
      fee: '0.05%',
      myLiquidity: '$0',
    },
  ];

  if (!isConnected) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full min-h-[80vh]">
          <div className="text-center p-8">
            <ArrowTrendingUpIcon className="w-16 h-16 mx-auto mb-4 text-gray-500" />
            <h2 className="text-2xl font-bold text-white mb-2">Connect Your Wallet</h2>
            <p className="text-gray-400">Connect your wallet to provide liquidity</p>
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
              <h2 className="text-2xl font-bold text-white mb-2">Tier 2 Required</h2>
              <p className="text-gray-400 mb-6">
                You need a Convexo LPs NFT (Tier 2) to provide liquidity to compliant pools.
              </p>
              <Link href="/digital-id/limited-partner">
                <button className="btn-primary">Get LP Verified</button>
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
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Link href="/investments" className="text-gray-400 hover:text-white">Investments</Link>
                <span className="text-gray-600">/</span>
                <span className="text-white">Market LPs</span>
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">Market LPs</h1>
              <p className="text-gray-400">Provide liquidity to compliant Uniswap V4 pools</p>
            </div>
            <button className="btn-primary flex items-center gap-2">
              <PlusCircleIcon className="w-5 h-5" />
              Add Liquidity
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="card p-4">
              <p className="text-gray-400 text-sm mb-1">Total TVL</p>
              <p className="text-2xl font-bold text-white">$214,000</p>
            </div>
            <div className="card p-4">
              <p className="text-gray-400 text-sm mb-1">24h Volume</p>
              <p className="text-2xl font-bold text-emerald-400">$77,000</p>
            </div>
            <div className="card p-4">
              <p className="text-gray-400 text-sm mb-1">Your Liquidity</p>
              <p className="text-2xl font-bold text-purple-400">$0</p>
            </div>
            <div className="card p-4">
              <p className="text-gray-400 text-sm mb-1">Earned Fees</p>
              <p className="text-2xl font-bold text-blue-400">$0</p>
            </div>
          </div>

          {/* Info Banner */}
          <div className="card bg-blue-900/20 border-blue-700/50 p-4">
            <p className="text-blue-300">
              <strong>Compliant Pools:</strong> All pools use Uniswap V4 hooks to verify LP NFT ownership. 
              Only Tier 2+ verified users can provide liquidity or trade.
            </p>
          </div>

          {/* Pools Table */}
          <div className="card overflow-hidden">
            <h2 className="text-lg font-semibold text-white p-6 pb-4">Available Pools</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left text-sm text-gray-400 font-medium px-6 py-3">Pool</th>
                    <th className="text-right text-sm text-gray-400 font-medium px-6 py-3">TVL</th>
                    <th className="text-right text-sm text-gray-400 font-medium px-6 py-3">24h Volume</th>
                    <th className="text-right text-sm text-gray-400 font-medium px-6 py-3">APY</th>
                    <th className="text-right text-sm text-gray-400 font-medium px-6 py-3">Fee</th>
                    <th className="text-right text-sm text-gray-400 font-medium px-6 py-3">My Liquidity</th>
                    <th className="text-right text-sm text-gray-400 font-medium px-6 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pools.map((pool) => (
                    <tr key={pool.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex -space-x-2">
                            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold border-2 border-gray-900">$</div>
                            <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white text-xs font-bold border-2 border-gray-900">₱</div>
                          </div>
                          <span className="font-medium text-white">{pool.pair}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right text-white">{pool.tvl}</td>
                      <td className="px-6 py-4 text-right text-white">{pool.volume24h}</td>
                      <td className="px-6 py-4 text-right text-emerald-400 font-medium">{pool.apy}</td>
                      <td className="px-6 py-4 text-right text-gray-400">{pool.fee}</td>
                      <td className="px-6 py-4 text-right text-white">{pool.myLiquidity}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium rounded-lg transition-colors">
                            Add
                          </button>
                          <Link href="/treasury/swaps">
                            <button className="p-1.5 hover:bg-gray-700 rounded-lg transition-colors">
                              <ArrowsRightLeftIcon className="w-5 h-5 text-gray-400" />
                            </button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Your Positions */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Your LP Positions</h2>
            <div className="text-center py-8">
              <ArrowTrendingUpIcon className="w-12 h-12 mx-auto mb-4 text-gray-500" />
              <p className="text-gray-400">No active LP positions</p>
              <p className="text-sm text-gray-500 mt-1">Add liquidity to a pool to start earning fees</p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}


