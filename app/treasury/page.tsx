'use client';

import { useAccount, useChainId, useReadContract } from 'wagmi';
import { formatUnits } from 'viem';
import { erc20Abi } from 'viem';
import DashboardLayout from '@/components/DashboardLayout';
import { useNFTBalance } from '@/lib/hooks/useNFTBalance';
import { getContractsForChain } from '@/lib/contracts/addresses';
import { ecopAbi } from '@/lib/contracts/ecopAbi';
import Link from 'next/link';
import {
  CurrencyDollarIcon,
  ArrowsRightLeftIcon,
  ClipboardDocumentListIcon,
  LockClosedIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';

export default function TreasuryPage() {
  const { isConnected, address } = useAccount();
  const chainId = useChainId();
  const contracts = getContractsForChain(chainId);
  const { hasPassportNFT, hasActivePassport, hasAnyLPNFT, hasEcreditscoringNFT } = useNFTBalance();

  const canAccess = hasPassportNFT || hasActivePassport || hasAnyLPNFT || hasEcreditscoringNFT;

  const { data: usdcBalance } = useReadContract({
    address: contracts?.USDC,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!contracts },
  });

  const { data: ecopBalance } = useReadContract({
    address: contracts?.ECOP,
    abi: ecopAbi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!contracts && contracts.ECOP !== '0x0000000000000000000000000000000000000000' },
  });

  if (!isConnected) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full min-h-[80vh]">
          <div className="text-center p-8">
            <CurrencyDollarIcon className="w-16 h-16 mx-auto mb-4 text-gray-500" />
            <h2 className="text-2xl font-bold text-white mb-2">Connect Your Wallet</h2>
            <p className="text-gray-400">Connect your wallet to access Treasury</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!canAccess) {
    return (
      <DashboardLayout>
        <div className="p-8">
          <div className="max-w-2xl mx-auto">
            <div className="card p-8 text-center">
              <LockClosedIcon className="w-16 h-16 mx-auto mb-4 text-gray-500" />
              <h2 className="text-2xl font-bold text-white mb-2">Tier 1 Required</h2>
              <p className="text-gray-400 mb-6">
                You need at least a CONVEXO PASSPORT (Tier 1) to access Treasury features.
              </p>
              <Link href="/digital-id/humanity">
                <button className="btn-primary">Get Verified</button>
              </Link>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Treasury</h1>
            <p className="text-gray-400">Manage your stablecoins, conversions, and trades</p>
          </div>

          {/* Balances */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card p-5 bg-gradient-to-br from-blue-900/30 to-cyan-900/30 border-blue-700/50">
              <p className="text-gray-400 text-sm mb-1">USDC Balance</p>
              <p className="text-3xl font-bold text-white">
                ${usdcBalance ? parseFloat(formatUnits(usdcBalance as bigint, 6)).toLocaleString() : '0.00'}
              </p>
            </div>
            <div className="card p-5 bg-gradient-to-br from-emerald-900/30 to-teal-900/30 border-emerald-700/50">
              <p className="text-gray-400 text-sm mb-1">ECOP Balance</p>
              <p className="text-3xl font-bold text-emerald-400">
                {ecopBalance ? parseFloat(formatUnits(ecopBalance as bigint, 18)).toLocaleString() : '0'} ECOP
              </p>
            </div>
            <div className="card p-5">
              <p className="text-gray-400 text-sm mb-1">Total Value</p>
              <p className="text-3xl font-bold text-purple-400">
                ${usdcBalance ? parseFloat(formatUnits(usdcBalance as bigint, 6)).toLocaleString() : '0.00'}
              </p>
            </div>
          </div>

          {/* Main Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link href="/treasury/monetization">
              <div className="card-interactive p-6 h-full">
                <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-600 w-fit mb-4">
                  <CurrencyDollarIcon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Monetization</h3>
                <p className="text-gray-400 mb-4">
                  Convert COP to ECOP stablecoin and back. 1:1 peg with Colombian Peso.
                </p>
                <div className="flex items-center gap-2 text-emerald-400 font-medium">
                  <span>Convert Now</span>
                  <ArrowRightIcon className="w-4 h-4" />
                </div>
              </div>
            </Link>

            <Link href="/treasury/swaps">
              <div className="card-interactive p-6 h-full">
                <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 w-fit mb-4">
                  <ArrowsRightLeftIcon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Swaps</h3>
                <p className="text-gray-400 mb-4">
                  Swap between ECOP, USDC, and EUR using Uniswap V4 compliant pools.
                </p>
                <div className="flex items-center gap-2 text-purple-400 font-medium">
                  <span>Swap Tokens</span>
                  <ArrowRightIcon className="w-4 h-4" />
                </div>
              </div>
            </Link>

            <Link href="/treasury/otc">
              <div className="card-interactive p-6 h-full">
                <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-600 w-fit mb-4">
                  <ClipboardDocumentListIcon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">OTC Orders</h3>
                <p className="text-gray-400 mb-4">
                  Create large orders with personalized attention from our trading desk.
                </p>
                <div className="flex items-center gap-2 text-blue-400 font-medium">
                  <span>Create Order</span>
                  <ArrowRightIcon className="w-4 h-4" />
                </div>
              </div>
            </Link>
          </div>

          {/* Info Section */}
          <div className="card">
            <h3 className="text-lg font-semibold text-white mb-4">About Treasury</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h4 className="font-medium text-white mb-2">ECOP Stablecoin</h4>
                <p className="text-sm text-gray-400">
                  Electronic Colombian Peso pegged 1:1 with COP. Backed by reserves and fully redeemable.
                </p>
              </div>
              <div>
                <h4 className="font-medium text-white mb-2">Compliant Pools</h4>
                <p className="text-sm text-gray-400">
                  All pools use Uniswap V4 hooks to ensure only verified users can trade.
                </p>
              </div>
              <div>
                <h4 className="font-medium text-white mb-2">OTC Trading</h4>
                <p className="text-sm text-gray-400">
                  For trades over $50,000, use our OTC desk for better rates and personal service.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
