'use client';

import { useContractRead } from 'wagmi';
import { CONTRACTS } from '@/lib/contracts/addresses';
import { TokenizedBondCreditsABI } from '@/lib/contracts/abis';
import { formatUnits } from 'viem';

interface CreditListProps {
  filterByAddress?: `0x${string}`;
}

export function CreditList({ filterByAddress }: CreditListProps) {
  // Note: Adjust based on actual TokenizedBondCredits ABI functions
  // This is a placeholder - you may need to adjust based on your contract's actual functions
  const { data: creditCount, isLoading: isLoadingCount } = useContractRead({
    address: CONTRACTS.BASE_SEPOLIA.TOKENIZED_BOND_CREDITS,
    abi: TokenizedBondCreditsABI,
    functionName: 'getCreditCount', // Adjust based on actual ABI
    query: {
      enabled: true,
    },
  });

  const count = creditCount ? Number(creditCount) : 0;

  if (isLoadingCount) {
    return (
      <div className="text-center py-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Loading credits...</p>
      </div>
    );
  }

  if (count === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600 dark:text-gray-400">No credits created yet.</p>
        <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
          Note: Credit listing functionality depends on your TokenizedBondCredits contract ABI.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Total credits: {count}
      </p>
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {Array.from({ length: count }).map((_, index) => (
          <CreditListItem key={index} creditIndex={index} filterByAddress={filterByAddress} />
        ))}
      </div>
    </div>
  );
}

function CreditListItem({ creditIndex, filterByAddress }: { creditIndex: number; filterByAddress?: `0x${string}` }) {
  // Note: Adjust based on actual TokenizedBondCredits ABI
  // This is a placeholder implementation
  const { data: creditData, isLoading } = useContractRead({
    address: CONTRACTS.BASE_SEPOLIA.TOKENIZED_BOND_CREDITS,
    abi: TokenizedBondCreditsABI,
    functionName: 'getCredit', // Adjust based on actual ABI
    args: [BigInt(creditIndex)],
    query: {
      enabled: true,
    },
  });

  if (isLoading) {
    return (
      <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg animate-pulse">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
      </div>
    );
  }

  if (!creditData) {
    return null;
  }

  // Extract credit data (adjust based on actual return structure)
  // const [borrower, amount, interestRate, maturityDate, contractHash] = creditData as any[];

  // Filter by address if provided
  // if (filterByAddress && borrower && borrower.toLowerCase() !== filterByAddress.toLowerCase()) {
  //   return null;
  // }

  return (
    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white">
            Credit #{creditIndex + 1}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Index: {creditIndex}
          </p>
        </div>
        <a
          href={`https://sepolia.basescan.org/address/${CONTRACTS.BASE_SEPOLIA.TOKENIZED_BOND_CREDITS}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
        >
          View Contract
        </a>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
        Note: Full credit details depend on your TokenizedBondCredits contract implementation.
      </p>
    </div>
  );
}

