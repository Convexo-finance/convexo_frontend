'use client';

import { useAccount } from 'wagmi';
import DashboardLayout from '@/components/DashboardLayout';
import { useNFTBalance } from '@/lib/hooks/useNFTBalance';
import { useVaultCount } from '@/lib/hooks/useVaults';
import Link from 'next/link';
import {
  ChartBarIcon,
  BanknotesIcon,
  ArrowTrendingUpIcon,
  CubeIcon,
  LockClosedIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';

export default function InvestmentsPage() {
  const { isConnected } = useAccount();
  const { hasPassportNFT, hasActivePassport, hasAnyLPNFT, hasEcreditscoringNFT } = useNFTBalance();
  const { count: vaultCount } = useVaultCount();

  const canAccess = hasPassportNFT || hasActivePassport || hasAnyLPNFT || hasEcreditscoringNFT;

  if (!isConnected) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full min-h-[80vh]">
          <div className="text-center p-8">
            <ChartBarIcon className="w-16 h-16 mx-auto mb-4 text-gray-500" />
            <h2 className="text-2xl font-bold text-white mb-2">Connect Your Wallet</h2>
            <p className="text-gray-400">Connect your wallet to access investments</p>
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
                You need at least a CONVEXO PASSPORT (Tier 1) to access investment features.
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
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Investments</h1>
            <p className="text-gray-400">Grow your portfolio with Convexo investment products</p>
        </div>

          {/* Portfolio Summary */}
          <div className="card p-6 bg-gradient-to-r from-purple-900/30 to-blue-900/30 border-purple-700/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm mb-1">Total Portfolio Value</p>
                <p className="text-4xl font-bold text-white">$0.00</p>
                <p className="text-sm text-emerald-400 mt-1">+0.00% all time</p>
              </div>
              <div className="grid grid-cols-3 gap-8">
                <div className="text-center">
                  <p className="text-2xl font-bold text-white">0</p>
                  <p className="text-xs text-gray-400">C-Bonds</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-white">0</p>
                  <p className="text-xs text-gray-400">LP Positions</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-white">0</p>
                  <p className="text-xs text-gray-400">Vaults</p>
                </div>
              </div>
            </div>
          </div>

          {/* Investment Products */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link href="/investments/c-bonds">
              <div className="card-interactive p-6 h-full">
                <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-600 w-fit mb-4">
                  <BanknotesIcon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">C-Bonds</h3>
                <p className="text-gray-400 mb-4">
                  Invest in tokenized bond vaults financing SMEs. Earn 10-12% APY with transparent on-chain tracking.
                </p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">Available Vaults</p>
                    <p className="text-lg font-semibold text-emerald-400">{vaultCount || 0}</p>
                  </div>
                  <div className="flex items-center gap-2 text-emerald-400 font-medium">
                    <span>Explore</span>
                    <ArrowRightIcon className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </Link>

            <Link href="/investments/market-lps">
              <div className="card-interactive p-6 h-full">
                <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-600 w-fit mb-4">
                  <ArrowTrendingUpIcon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Market LPs</h3>
                <p className="text-gray-400 mb-4">
                  Provide liquidity to compliant Uniswap V4 pools. Earn trading fees on ECOP/USDC and more.
                </p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">Active Pools</p>
                    <p className="text-lg font-semibold text-blue-400">2</p>
                  </div>
                  <div className="flex items-center gap-2 text-blue-400 font-medium">
                    <span>Explore</span>
                    <ArrowRightIcon className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </Link>

            <Link href="/investments/vaults">
              <div className="card-interactive p-6 h-full">
                <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 w-fit mb-4">
                  <CubeIcon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Earn Vaults</h3>
                <p className="text-gray-400 mb-4">
                  Connect to DeFi yield protocols like Morpho. Access institutional-grade earning strategies.
                </p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">Integrations</p>
                    <p className="text-lg font-semibold text-purple-400">Coming Soon</p>
                  </div>
                  <div className="flex items-center gap-2 text-purple-400 font-medium">
                    <span>Explore</span>
                    <ArrowRightIcon className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </Link>
          </div>

          {/* Info Section */}
          <div className="card">
            <h3 className="text-lg font-semibold text-white mb-4">Why Invest with Convexo?</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-4 bg-gray-800/50 rounded-xl">
                <h4 className="font-medium text-white mb-2">Compliant</h4>
                <p className="text-sm text-gray-400">
                  All investments are KYC/AML compliant with NFT-gated access controls.
                </p>
              </div>
              <div className="p-4 bg-gray-800/50 rounded-xl">
                <h4 className="font-medium text-white mb-2">Transparent</h4>
                <p className="text-sm text-gray-400">
                  Track your investments in real-time with on-chain transparency.
                </p>
              </div>
              <div className="p-4 bg-gray-800/50 rounded-xl">
                <h4 className="font-medium text-white mb-2">High Yield</h4>
                <p className="text-sm text-gray-400">
                  Access attractive yields from SME financing and DeFi strategies.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
