'use client';

import { useAccount } from 'wagmi';
import DashboardLayout from '@/components/DashboardLayout';
import { useNFTBalance } from '@/lib/hooks/useNFTBalance';
import { useVaultCount } from '@/lib/hooks/useVaults';
import Link from 'next/link';
import {
  BanknotesIcon,
  DocumentTextIcon,
  LockClosedIcon,
  ArrowRightIcon,
  PlusCircleIcon,
} from '@heroicons/react/24/outline';

export default function FundingPage() {
  const { isConnected } = useAccount();
  const { hasVaultsNFT, hasPassportNFT, hasActivePassport, canAccessTreasury, userTier } = useNFTBalance();
  const { count: vaultCount } = useVaultCount();

  // Tier 1+ can access funding features (E-Contracts)
  const canAccess = hasPassportNFT || hasActivePassport || canAccessTreasury || userTier >= 1;
  // Only Tier 3 can create vaults
  const canCreateVaults = hasVaultsNFT || userTier >= 3;

  if (!isConnected) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full min-h-[80vh]">
          <div className="text-center p-8">
            <BanknotesIcon className="w-16 h-16 mx-auto mb-4 text-gray-500" />
            <h2 className="text-2xl font-bold text-white mb-2">Connect Your Wallet</h2>
            <p className="text-gray-400">Connect your wallet to access funding features</p>
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
                You need at least a Convexo Passport (Tier 1) to access funding features.
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Funding</h1>
              <p className="text-gray-400">Access contracts and create funding vaults</p>
            </div>
            {canCreateVaults && (
              <Link href="/funding/e-loans">
                <button className="btn-primary flex items-center gap-2">
                  <PlusCircleIcon className="w-5 h-5" />
                  Create New Vault
                </button>
              </Link>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card p-5">
              <p className="text-gray-400 text-sm mb-1">Your Vaults</p>
              <p className="text-3xl font-bold text-white">{vaultCount || 0}</p>
            </div>
            <div className="card p-5">
              <p className="text-gray-400 text-sm mb-1">Total Raised</p>
              <p className="text-3xl font-bold text-emerald-400">$0</p>
            </div>
            <div className="card p-5">
              <p className="text-gray-400 text-sm mb-1">Active Contracts</p>
              <p className="text-3xl font-bold text-purple-400">0</p>
            </div>
          </div>

          {/* Main Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {canCreateVaults ? (
              <Link href="/funding/e-loans">
                <div className="card-interactive p-6 h-full">
                  <div className="flex items-start gap-4">
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-600">
                      <BanknotesIcon className="w-8 h-8 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-white mb-2">E-Loans</h3>
                      <p className="text-gray-400 mb-4">
                        Create tokenized bond vaults to raise funding for your business.
                        Set your terms and attract investors.
                      </p>
                      <div className="flex items-center gap-2 text-purple-400 font-medium">
                        <span>Create Vault</span>
                        <ArrowRightIcon className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ) : (
              <div className="card p-6 h-full opacity-60">
                <div className="flex items-start gap-4">
                  <div className="p-4 rounded-2xl bg-gray-700">
                    <LockClosedIcon className="w-8 h-8 text-gray-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-white mb-2">E-Loans</h3>
                    <p className="text-gray-400 mb-4">
                      Create tokenized bond vaults to raise funding. Requires Tier 3 (Vault Creator NFT).
                    </p>
                    <Link href="/digital-id/credit-score">
                      <div className="flex items-center gap-2 text-blue-400 font-medium">
                        <span>Get Tier 3 Access</span>
                        <ArrowRightIcon className="w-4 h-4" />
                      </div>
                    </Link>
                  </div>
                </div>
              </div>
            )}

            <Link href="/funding/e-contracts">
              <div className="card-interactive p-6 h-full">
                <div className="flex items-start gap-4">
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600">
                    <DocumentTextIcon className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-white mb-2">E-Contracts</h3>
                    <p className="text-gray-400 mb-4">
                      View and manage loan agreements. Sign contracts and track 
                      your obligations.
                    </p>
                    <div className="flex items-center gap-2 text-purple-400 font-medium">
                      <span>View Contracts</span>
                      <ArrowRightIcon className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          </div>

          {/* Info Section */}
          <div className="card">
            <h3 className="text-lg font-semibold text-white mb-4">How Funding Works</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { step: '1', title: 'Create Vault', desc: 'Set amount, interest rate, and terms' },
                { step: '2', title: 'Attract Investors', desc: 'Investors fund your vault with USDC' },
                { step: '3', title: 'Sign Contract', desc: 'All parties sign the loan agreement' },
                { step: '4', title: 'Receive Funds', desc: 'Withdraw funds and start repaying' },
              ].map((item) => (
                <div key={item.step} className="text-center p-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-white font-bold mx-auto mb-3">
                    {item.step}
                  </div>
                  <p className="font-medium text-white mb-1">{item.title}</p>
                  <p className="text-sm text-gray-400">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}


