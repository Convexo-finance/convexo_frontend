'use client';

import { useAccount } from 'wagmi';
import DashboardLayout from '@/components/DashboardLayout';
import { useNFTBalance } from '@/lib/hooks/useNFTBalance';
import { useVaultCount, useVaultAddress } from '@/lib/hooks/useVaults';
import { VaultCard } from '@/components/VaultCard';
import Link from 'next/link';
import {
  BanknotesIcon,
  LockClosedIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';
import { useState } from 'react';

export default function CBondsPage() {
  const { isConnected } = useAccount();
  const { hasPassportNFT, hasActivePassport, hasAnyLPNFT, hasEcreditscoringNFT } = useNFTBalance();
  const { count, isLoading: isLoadingCount } = useVaultCount();
  const [filter, setFilter] = useState('all');

  const canAccess = hasPassportNFT || hasActivePassport || hasAnyLPNFT || hasEcreditscoringNFT;

  if (!isConnected) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full min-h-[80vh]">
          <div className="text-center p-8">
            <BanknotesIcon className="w-16 h-16 mx-auto mb-4 text-gray-500" />
            <h2 className="text-2xl font-bold text-white mb-2">Connect Your Wallet</h2>
            <p className="text-gray-400">Connect your wallet to invest in C-Bonds</p>
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
                You need at least a CONVEXO PASSPORT (Tier 1) to invest in vaults.
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
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Link href="/investments" className="text-gray-400 hover:text-white">Investments</Link>
                <span className="text-gray-600">/</span>
                <span className="text-white">C-Bonds</span>
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">C-Bonds</h1>
              <p className="text-gray-400">Invest in tokenized bond vaults and earn 10-12% APY</p>
            </div>
            <div className="flex items-center gap-3">
              <button className="btn-ghost flex items-center gap-2">
                <FunnelIcon className="w-5 h-5" />
                Filter
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="card p-4">
              <p className="text-gray-400 text-sm mb-1">Available Vaults</p>
              <p className="text-2xl font-bold text-white">{count || 0}</p>
            </div>
            <div className="card p-4">
              <p className="text-gray-400 text-sm mb-1">Total TVL</p>
              <p className="text-2xl font-bold text-emerald-400">$0</p>
            </div>
            <div className="card p-4">
              <p className="text-gray-400 text-sm mb-1">Avg APY</p>
              <p className="text-2xl font-bold text-purple-400">12%</p>
            </div>
            <div className="card p-4">
              <p className="text-gray-400 text-sm mb-1">Your Investments</p>
              <p className="text-2xl font-bold text-white">$0</p>
            </div>
          </div>

          {/* Info Banner */}
          <div className="card bg-emerald-900/20 border-emerald-700/50 p-4">
            <p className="text-emerald-300">
              <strong>How C-Bonds work:</strong> Purchase shares in tokenized bond vaults to fund SME loans. 
              Returns are distributed as borrowers repay their loans. All investments are tracked on-chain.
            </p>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2">
            {['all', 'funding', 'active', 'completed'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === f
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:text-white'
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>

          {/* Vaults Grid */}
          {isLoadingCount ? (
            <div className="text-center py-12">
              <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-400">Loading vaults...</p>
            </div>
          ) : count === 0 ? (
            <div className="card p-12 text-center">
              <BanknotesIcon className="w-16 h-16 mx-auto mb-4 text-gray-500" />
              <h3 className="text-xl font-semibold text-white mb-2">No Vaults Available</h3>
              <p className="text-gray-400">
                There are no investment opportunities at the moment. Check back later!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: count }, (_, i) => (
                <VaultListItem key={i} index={i} />
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

function VaultListItem({ index }: { index: number }) {
  const { vaultAddress, isLoading } = useVaultAddress(index);

  if (isLoading) {
    return (
      <div className="card p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-700 rounded w-3/4 mb-4" />
          <div className="h-4 bg-gray-700 rounded w-1/2" />
        </div>
      </div>
    );
  }

  if (!vaultAddress) return null;

  return <VaultCard vaultAddress={vaultAddress} />;
}


