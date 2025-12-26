'use client';

import { useAccount } from 'wagmi';
import DashboardLayout from '@/components/DashboardLayout';
import Link from 'next/link';
import {
  ShieldCheckIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

export default function GetVerifiedPage() {
  const { isConnected } = useAccount();

  if (!isConnected) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Connect Your Wallet
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Please connect your wallet to access verification services
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Get Verified
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Complete verification to unlock access to Convexo Protocol features
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* AML/CFT Verification Card */}
          <Link href="/get-verified/amlcft">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer border-2 border-transparent hover:border-blue-500">
              <div className="flex items-center space-x-4 mb-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <ShieldCheckIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    AML/CFT Verification
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Required for LPs NFT
                  </p>
                </div>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Complete identity verification through Sumsub to comply with Anti-Money
                Laundering (AML) and Counter-Financing of Terrorism (CFT) regulations.
              </p>
              <div className="space-y-2">
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <span className="mr-2">✓</span>
                  <span>Identity document verification</span>
                </div>
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <span className="mr-2">✓</span>
                  <span>Liveness check</span>
                </div>
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <span className="mr-2">✓</span>
                  <span>Address verification</span>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                  Start Verification →
                </span>
              </div>
            </div>
          </Link>

          {/* AI Credit Check Card */}
          <Link href="/get-verified/ai-credit-check">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer border-2 border-transparent hover:border-purple-500">
              <div className="flex items-center space-x-4 mb-4">
                <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
                  <SparklesIcon className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    AI Credit Check
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Required for Vaults NFT
                  </p>
                </div>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Submit your financial information for AI-powered credit scoring to
                determine your eligibility for creating vaults and accessing credit.
              </p>
              <div className="space-y-2">
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <span className="mr-2">✓</span>
                  <span>Financial statement analysis</span>
                </div>
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <span className="mr-2">✓</span>
                  <span>AI-powered credit scoring</span>
                </div>
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <span className="mr-2">✓</span>
                  <span>Instant results</span>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <span className="text-sm font-semibold text-purple-600 dark:text-purple-400">
                  Start Credit Check →
                </span>
              </div>
            </div>
          </Link>

          {/* ZK Verification Card */}
          <Link href="/get-verified/zk-verification">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer border-2 border-transparent hover:border-green-500">
              <div className="flex items-center space-x-4 mb-4">
                <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                  <SparklesIcon className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    ZK Verification
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Required for Passport NFT
                  </p>
                </div>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Verify your identity using ZKPassport zero-knowledge proofs to receive
                your Convexo Passport NFT for individual investor access.
              </p>
              <div className="space-y-2">
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <span className="mr-2">✓</span>
                  <span>Privacy-preserving verification</span>
                </div>
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <span className="mr-2">✓</span>
                  <span>Age verification (18+)</span>
                </div>
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <span className="mr-2">✓</span>
                  <span>Soulbound NFT</span>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                  Start ZK Verification →
                </span>
              </div>
            </div>
          </Link>
        </div>

        {/* Information Section */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Why Get Verified?
          </h3>
          <div className="space-y-2 text-gray-600 dark:text-gray-400">
            <p>
              <strong>LPs NFT (Tier 1):</strong> Grants access to liquidity provision features and
              allows you to participate in the protocol as a liquidity provider.
            </p>
            <p>
              <strong>Vaults NFT (Tier 2):</strong> Enables you to create funding vaults and access
              credit facilities based on your creditworthiness.
            </p>
            <p>
              <strong>Passport NFT (Tier 3):</strong> Allows individual investors to invest in vaults
              using privacy-preserving ZKPassport verification.
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

