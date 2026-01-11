'use client';

import { useAccount } from 'wagmi';
import DashboardLayout from '@/components/DashboardLayout';
import { useNFTBalance } from '@/lib/hooks/useNFTBalance';
import { useVaultCount, useVaultAddress } from '@/lib/hooks/useVaults';
import { VaultCard } from '@/components/VaultCard';
import { CreateVaultForm } from '@/components/CreateVaultForm';
import Link from 'next/link';
import { useState } from 'react';
import {
  BanknotesIcon,
  LockClosedIcon,
  PlusCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

export default function ELoansPage() {
  const { isConnected } = useAccount();
  const { hasEcreditscoringNFT } = useNFTBalance();
  const { count, isLoading: isLoadingCount } = useVaultCount();
  const [showCreateForm, setShowCreateForm] = useState(false);

  // User can access if they have Ecreditscoring NFT (Tier 3)
  const canAccess = hasEcreditscoringNFT;

  if (!isConnected) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full min-h-[80vh]">
          <div className="text-center p-8">
            <BanknotesIcon className="w-16 h-16 mx-auto mb-4 text-gray-500" />
            <h2 className="text-2xl font-bold text-white mb-2">Connect Your Wallet</h2>
            <p className="text-gray-400">Connect your wallet to access E-Loans</p>
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
              <h2 className="text-2xl font-bold text-white mb-2">Tier 3 Required</h2>
              <p className="text-gray-400 mb-6">
                You need a Credit Score NFT (Tier 3) to create loan vaults. Complete the AI-powered credit verification to unlock vault creation.
              </p>
              <Link href="/digital-id/credit-score">
                <button className="btn-primary">Get Credit Verified</button>
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
                <Link href="/funding" className="text-gray-400 hover:text-white">Funding</Link>
                <span className="text-gray-600">/</span>
                <span className="text-white">E-Loans</span>
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">E-Loans</h1>
              <p className="text-gray-400">Create and manage your tokenized bond vaults</p>
            </div>
            <button
              onClick={() => setShowCreateForm(true)}
              className="btn-primary flex items-center gap-2"
            >
              <PlusCircleIcon className="w-5 h-5" />
              Create New Vault
            </button>
          </div>

          {/* Create Vault Modal */}
          {showCreateForm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
              <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-700 transition-colors z-10"
                >
                  <XMarkIcon className="w-6 h-6 text-gray-400" />
                </button>
                <CreateVaultForm onSuccess={() => setShowCreateForm(false)} />
              </div>
            </div>
          )}

          {/* Info Banner */}
          <div className="card bg-purple-900/20 border-purple-700/50 p-4">
            <p className="text-purple-300">
              <strong>Tip:</strong> Create a vault with competitive interest rates (10-12% APY) to attract investors quickly.
              All vaults require a signed contract before funds can be withdrawn.
            </p>
          </div>

          {/* Vaults List */}
          {isLoadingCount ? (
            <div className="text-center py-12">
              <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-400">Loading vaults...</p>
            </div>
          ) : count === 0 ? (
            <div className="card p-12 text-center">
              <BanknotesIcon className="w-16 h-16 mx-auto mb-4 text-gray-500" />
              <h3 className="text-xl font-semibold text-white mb-2">No Vaults Yet</h3>
              <p className="text-gray-400 mb-6">
                Create your first vault to start raising funding for your business.
              </p>
              <button
                onClick={() => setShowCreateForm(true)}
                className="btn-primary"
              >
                Create Your First Vault
              </button>
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


