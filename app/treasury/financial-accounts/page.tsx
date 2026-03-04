'use client';

import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import { BuildingLibraryIcon, ArrowRightIcon } from '@heroicons/react/24/outline';

export default function FinancialAccountsPage() {
  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="max-w-xl mx-auto mt-16">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
            <BuildingLibraryIcon className="h-16 w-16 mx-auto mb-4 text-blue-500" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Financial Accounts
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              Manage your linked bank accounts from your profile settings.
            </p>
            <Link
              href="/profile/bank-accounts"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg"
            >
              Go to Bank Accounts
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
