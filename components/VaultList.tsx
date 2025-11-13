'use client';

import { useContractRead } from 'wagmi';
import { CONTRACTS } from '@/lib/contracts/addresses';
import { VaultFactoryABI, TokenizedBondVaultABI } from '@/lib/contracts/abis';
import { formatUnits } from 'viem';
import { VaultCard } from './VaultCard';

interface VaultListProps {
  filterByAddress?: `0x${string}`;
}

export function VaultList({ filterByAddress }: VaultListProps) {
  const { data: vaultCount, isLoading: isLoadingCount } = useContractRead({
    address: CONTRACTS.BASE_SEPOLIA.VAULT_FACTORY,
    abi: VaultFactoryABI,
    functionName: 'getVaultCount',
  });

  const count = vaultCount ? Number(vaultCount) : 0;

  if (isLoadingCount) {
    return (
      <div className="text-center py-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Loading vaults...</p>
      </div>
    );
  }

  if (count === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600 dark:text-gray-400">No vaults created yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Total vaults: {count}
      </p>
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {Array.from({ length: count }).map((_, index) => (
          <VaultListItem key={index} vaultIndex={index} filterByAddress={filterByAddress} />
        ))}
      </div>
    </div>
  );
}

function VaultListItem({ vaultIndex, filterByAddress }: { vaultIndex: number; filterByAddress?: `0x${string}` }) {
  const { data: vaultAddress, isLoading } = useContractRead({
    address: CONTRACTS.BASE_SEPOLIA.VAULT_FACTORY,
    abi: VaultFactoryABI,
    functionName: 'getVaultAddressAtIndex',
    args: [BigInt(vaultIndex)],
  });

  // Get borrower address from vault to filter
  const { data: borrower } = useContractRead({
    address: vaultAddress as `0x${string}` | undefined,
    abi: TokenizedBondVaultABI,
    functionName: 'borrower',
    query: {
      enabled: !!vaultAddress && !!filterByAddress,
    },
  });

  if (isLoading) {
    return (
      <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg animate-pulse">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
      </div>
    );
  }

  if (!vaultAddress) {
    return null;
  }

  // Filter by address if provided
  if (filterByAddress && borrower && (borrower as `0x${string}`).toLowerCase() !== filterByAddress.toLowerCase()) {
    return null;
  }

  return <VaultCard vaultAddress={vaultAddress as `0x${string}`} />;
}

