'use client';

import { useAccount } from 'wagmi';
import { useUserReputation } from '@/lib/hooks/useUserReputation';
import { useNFTBalance } from '@/lib/hooks/useNFTBalance';
import { CreateVaultForm } from '@/components/CreateVaultForm';
import DashboardLayout from '@/components/DashboardLayout';
import Link from 'next/link';

export default function LoansPage() {
  const { isConnected, address } = useAccount();
  const { tier, hasCreditscoreAccess } = useUserReputation();
  const { hasLPsNFT, hasVaultsNFT } = useNFTBalance();

  if (!isConnected) {
    return (
      <DashboardLayout>
        <div className="p-8">
          <div className="text-center py-20">
            <h2 className="text-2xl font-semibold mb-4">Please connect your wallet</h2>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="max-w-6xl mx-auto">

        <h1 className="text-4xl font-bold mb-8 text-gray-900 dark:text-white">
          Loans Dashboard
        </h1>

        <div className="mb-8 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            Your Status
          </h2>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-700 dark:text-gray-300">
                Reputation Tier:
              </span>
              <span className="text-lg font-bold">
                {tier === undefined
                  ? 'Loading...'
                  : tier === 0
                  ? 'Tier 0 - No Access'
                  : tier === 1
                  ? 'Tier 1 - Compliant'
                  : 'Tier 2 - Creditscore'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-700 dark:text-gray-300">
                Convexo_LPs NFT:
              </span>
              <span className={hasLPsNFT ? 'text-green-600' : 'text-red-600'}>
                {hasLPsNFT ? '✓ Owned' : '✗ Not Owned'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-700 dark:text-gray-300">
                Convexo_Vaults NFT:
              </span>
              <span className={hasVaultsNFT ? 'text-green-600' : 'text-red-600'}>
                {hasVaultsNFT ? '✓ Owned' : '✗ Not Owned'}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {hasCreditscoreAccess && (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
              <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                Create Funding Vault
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Create a tokenized bond vault to request funding from investors.
                Requires Tier 2 (Both NFTs).
              </p>
              <CreateVaultForm />
            </div>
          )}

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
            <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              Quick Links
            </h3>
            <div className="space-y-3">
              <Link 
                href="/loans/vaults"
                className="block p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
              >
                <h4 className="font-semibold text-blue-900 dark:text-blue-100">View Vaults</h4>
                <p className="text-sm text-blue-700 dark:text-blue-300">Browse and manage tokenized bond vaults</p>
              </Link>
              <Link 
                href="/loans/contracts"
                className="block p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
              >
                <h4 className="font-semibold text-purple-900 dark:text-purple-100">Contract Interactions</h4>
                <p className="text-sm text-purple-700 dark:text-purple-300">Interact with deployed contracts</p>
              </Link>
            </div>
          </div>

          {!hasCreditscoreAccess && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-6 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <h3 className="text-lg font-semibold mb-2 text-yellow-800 dark:text-yellow-200">
                Access Required
              </h3>
              <p className="text-yellow-700 dark:text-yellow-300">
                You need Tier 2 (both Convexo_LPs and Convexo_Vaults NFTs) to create vaults. 
                Please contact an admin to mint your NFTs after completing KYB verification.
              </p>
            </div>
          )}
        </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
