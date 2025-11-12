'use client';

import { useAccount } from 'wagmi';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';

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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <ViewCard
                title="Enterprise"
                description="Create vaults, manage invoices, and access funding"
                href="/enterprise"
                color="bg-blue-500 hover:bg-blue-600"
              />
              <ViewCard
                title="Investor"
                description="Browse vaults, invest, and track returns"
                href="/investor"
                color="bg-green-500 hover:bg-green-600"
              />
              <ViewCard
                title="Funding"
                description="Mint and redeem ECOP stablecoins"
                href="/funding"
                color="bg-purple-500 hover:bg-purple-600"
              />
              <ViewCard
                title="Conversion"
                description="Swap ECOP/USDC on Uniswap V4"
                href="/conversion"
                color="bg-indigo-500 hover:bg-indigo-600"
              />
              <ViewCard
                title="Admin"
                description="Manage NFTs, pools, and protocol settings"
                href="/admin"
                color="bg-red-500 hover:bg-red-600"
              />
            </div>
          )}

          <div className="mt-12 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              About Convexo
            </h2>
            <p className="text-gray-700 dark:text-gray-300">
              Convexo Protocol bridges the gap between international investors
              and Latin American SMEs through compliant, on-chain lending
              infrastructure. Access liquidity pools, create funding vaults, and
              invest in tokenized bonds.
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function ViewCard({
  title,
  description,
  href,
  color,
}: {
  title: string;
  description: string;
  href: string;
  color: string;
}) {
  return (
    <Link href={href}>
      <div
        className={`${color} text-white p-6 rounded-lg shadow-lg transform transition-transform hover:scale-105 cursor-pointer`}
      >
        <h3 className="text-2xl font-bold mb-2">{title}</h3>
        <p className="text-white/90">{description}</p>
      </div>
    </Link>
  );
}

