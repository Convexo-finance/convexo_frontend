'use client';

import { useAccount } from 'wagmi';
import { useVaultCount, useVaultAddress } from '@/lib/hooks/useVaults';
import { VaultCard } from '@/components/VaultCard';
import DashboardLayout from '@/components/DashboardLayout';

export default function InvestmentsPage() {
  const { isConnected } = useAccount();
  const { count, isLoading: isLoadingCount } = useVaultCount();

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
          Investments Dashboard
        </h1>

        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-blue-800 dark:text-blue-200">
            Browse available vaults and invest USDC to earn 10-12% APY. All
            investments are transparent and tracked on-chain.
          </p>
        </div>

        {isLoadingCount ? (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">Loading vaults...</p>
          </div>
        ) : count === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
            <p className="text-gray-600 dark:text-gray-400">
              No vaults available yet. Check back later!
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
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!vaultAddress) {
    return null;
  }

  return <VaultCard vaultAddress={vaultAddress} />;
}

