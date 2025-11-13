'use client';

import { useAccount } from 'wagmi';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import {
  CurrencyDollarIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

export default function TreasuryPage() {
  const { isConnected } = useAccount();

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
            Treasury
          </h1>

          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>About Treasury:</strong> Manage your stablecoin holdings and conversions. 
              Mint or redeem ECOP stablecoins, and swap between ECOP and USDC on Uniswap V4.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Link href="/funding">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow cursor-pointer border-2 border-transparent hover:border-blue-500">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <CurrencyDollarIcon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      Funding
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      ECOP Stablecoin
                    </p>
                  </div>
                </div>
                <p className="text-gray-700 dark:text-gray-300">
                  Request ECOP stablecoins from fiat or redeem ECOP back to fiat. 
                  ECOP is the Colombian Peso stablecoin pegged 1:1 with COP.
                </p>
                <div className="mt-4 text-blue-600 dark:text-blue-400 font-medium">
                  Go to Funding →
                </div>
              </div>
            </Link>

            <Link href="/conversion">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow cursor-pointer border-2 border-transparent hover:border-blue-500">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                    <ArrowPathIcon className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      Conversion
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      ECOP/USDC Swap
                    </p>
                  </div>
                </div>
                <p className="text-gray-700 dark:text-gray-300">
                  Swap between ECOP and USDC using Uniswap V4 liquidity pools. 
                  View real-time exchange rates and execute swaps.
                </p>
                <div className="mt-4 text-indigo-600 dark:text-indigo-400 font-medium">
                  Go to Conversion →
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

