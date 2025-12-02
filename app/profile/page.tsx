'use client';

import { useAccount } from 'wagmi';
import DashboardLayout from '@/components/DashboardLayout';
import { DashboardStats } from '@/components/DashboardStats';

export default function Home() {
  const { isConnected, address } = useAccount();

  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold mb-8 text-gray-900 dark:text-white">
            Dashboard
          </h1>

          {!isConnected ? (
            <div className="text-center py-20">
              <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
                Connect your wallet to get started
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-8">
                Connect to Base Sepolia to access the Convexo Protocol
              </p>
            </div>
          ) : (
            <DashboardStats />
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

