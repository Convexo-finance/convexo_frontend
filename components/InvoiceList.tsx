'use client';

import { useContractRead } from 'wagmi';
import { CONTRACTS } from '@/lib/contracts/addresses';
import { InvoiceFactoringABI } from '@/lib/contracts/abis';
import { formatUnits } from 'viem';

interface InvoiceListProps {
  filterByAddress?: `0x${string}`;
}

export function InvoiceList({ filterByAddress }: InvoiceListProps) {
  // Note: Adjust based on actual InvoiceFactoring ABI functions
  // This is a placeholder - you may need to adjust based on your contract's actual functions
  const { data: invoiceCount, isLoading: isLoadingCount } = useContractRead({
    address: CONTRACTS.BASE_SEPOLIA.INVOICE_FACTORING,
    abi: InvoiceFactoringABI,
    functionName: 'getInvoiceCount', // Adjust based on actual ABI
    query: {
      enabled: true,
    },
  });

  const count = invoiceCount ? Number(invoiceCount) : 0;

  if (isLoadingCount) {
    return (
      <div className="text-center py-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Loading invoices...</p>
      </div>
    );
  }

  if (count === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600 dark:text-gray-400">No invoices created yet.</p>
        <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
          Note: Invoice listing functionality depends on your InvoiceFactoring contract ABI.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Total invoices: {count}
      </p>
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {Array.from({ length: count }).map((_, index) => (
          <InvoiceListItem key={index} invoiceIndex={index} filterByAddress={filterByAddress} />
        ))}
      </div>
    </div>
  );
}

function InvoiceListItem({ invoiceIndex, filterByAddress }: { invoiceIndex: number; filterByAddress?: `0x${string}` }) {
  // Note: Adjust based on actual InvoiceFactoring ABI
  // This is a placeholder implementation
  const { data: invoiceData, isLoading } = useContractRead({
    address: CONTRACTS.BASE_SEPOLIA.INVOICE_FACTORING,
    abi: InvoiceFactoringABI,
    functionName: 'getInvoice', // Adjust based on actual ABI
    args: [BigInt(invoiceIndex)],
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

  if (!invoiceData) {
    return null;
  }

  // Extract invoice data (adjust based on actual return structure)
  // const [seller, amount, maturityDate, contractHash] = invoiceData as any[];

  // Filter by address if provided
  // if (filterByAddress && seller && seller.toLowerCase() !== filterByAddress.toLowerCase()) {
  //   return null;
  // }

  return (
    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white">
            Invoice #{invoiceIndex + 1}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Index: {invoiceIndex}
          </p>
        </div>
        <a
          href={`https://sepolia.basescan.org/address/${CONTRACTS.BASE_SEPOLIA.INVOICE_FACTORING}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
        >
          View Contract
        </a>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
        Note: Full invoice details depend on your InvoiceFactoring contract implementation.
      </p>
    </div>
  );
}

