'use client';

import { useAccount } from 'wagmi';
import { useUserReputation } from '@/lib/hooks/useUserReputation';
import { useNFTBalance } from '@/lib/hooks/useNFTBalance';
import { CreateVaultForm } from '@/components/CreateVaultForm';
import { VaultList } from '@/components/VaultList';
import DashboardLayout from '@/components/DashboardLayout';

export default function VaultsPage() {
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
            Tokenized Bond Vaults
          </h1>

          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>About Tokenized Bond Vaults:</strong> Create funding vaults to request capital from investors. 
              Requires Tier 2 (both Convexo_LPs and Convexo_Vaults NFTs). Investors can purchase shares in your vault, 
              and you'll pay interest on the principal amount.
            </p>
          </div>

          {!hasCreditscoreAccess && (
            <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <h3 className="text-lg font-semibold mb-2 text-yellow-800 dark:text-yellow-200">
                Access Required
              </h3>
              <p className="text-yellow-700 dark:text-yellow-300">
                You need Tier 2 (both NFTs) to create vaults. Current status:
              </p>
              <div className="mt-2 space-y-1 text-sm">
                <p className={hasLPsNFT ? 'text-green-600' : 'text-red-600'}>
                  Convexo_LPs NFT: {hasLPsNFT ? '✓ Owned' : '✗ Not Owned'}
                </p>
                <p className={hasVaultsNFT ? 'text-green-600' : 'text-red-600'}>
                  Convexo_Vaults NFT: {hasVaultsNFT ? '✓ Owned' : '✗ Not Owned'}
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {hasCreditscoreAccess && (
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
                <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                  Create New Vault
                </h2>
                <CreateVaultForm />
              </div>
            )}

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                Your Vaults
              </h2>
              <VaultList filterByAddress={address} />
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

