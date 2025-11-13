'use client';

import { useAccount } from 'wagmi';
import { useUserReputation } from '@/lib/hooks/useUserReputation';
import { useNFTBalance } from '@/lib/hooks/useNFTBalance';
import { InvoiceFactoringForm } from '@/components/InvoiceFactoringForm';
import { InvoiceList } from '@/components/InvoiceList';
import DashboardLayout from '@/components/DashboardLayout';

export default function InvoicesPage() {
  const { isConnected, address } = useAccount();
  const { tier, hasCompliantAccess } = useUserReputation();
  const { hasLPsNFT } = useNFTBalance();

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
            Invoice Factoring
          </h1>

          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>About Invoice Factoring:</strong> Sell your unpaid invoices for immediate liquidity. 
              Requires Tier 1 (Convexo_LPs NFT). Your invoices will be tokenized and sold to investors, 
              providing you with upfront cash flow.
            </p>
          </div>

          {!hasCompliantAccess && (
            <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <h3 className="text-lg font-semibold mb-2 text-yellow-800 dark:text-yellow-200">
                Access Required
              </h3>
              <p className="text-yellow-700 dark:text-yellow-300">
                You need Tier 1 (Convexo_LPs NFT) to create invoices. Current status:
              </p>
              <div className="mt-2">
                <p className={hasLPsNFT ? 'text-green-600' : 'text-red-600'}>
                  Convexo_LPs NFT: {hasLPsNFT ? '✓ Owned' : '✗ Not Owned'}
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {hasCompliantAccess && (
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
                <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                  Create New Invoice
                </h2>
                <InvoiceFactoringForm />
              </div>
            )}

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                Your Invoices
              </h2>
              <InvoiceList filterByAddress={address} />
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

