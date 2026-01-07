'use client';

import { useAccount, useBalance, useChainId, useReadContract } from 'wagmi';
import { formatUnits } from 'viem';
import { erc20Abi } from 'viem';
import DashboardLayout from '@/components/DashboardLayout';
import { useNFTBalance } from '@/lib/hooks/useNFTBalance';
import { getContractsForChain, getAddressExplorerLink } from '@/lib/contracts/addresses';
import Link from 'next/link';
import {
  WalletIcon,
  BuildingLibraryIcon,
  UsersIcon,
  ArrowTopRightOnSquareIcon,
  CheckBadgeIcon,
  XCircleIcon,
  ClipboardDocumentIcon,
} from '@heroicons/react/24/outline';
import { useState } from 'react';

export default function ProfilePage() {
  const { isConnected, address } = useAccount();
  const chainId = useChainId();
  const contracts = getContractsForChain(chainId);
  const { hasPassportNFT, hasLPsNFT, hasVaultsNFT, hasActivePassport } = useNFTBalance();
  const [copied, setCopied] = useState(false);

  const { data: ethBalance } = useBalance({ address });
  const { data: usdcBalance } = useReadContract({
    address: contracts?.USDC,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!contracts },
  });

  const userTier = hasVaultsNFT ? 3 : hasLPsNFT ? 2 : (hasPassportNFT || hasActivePassport) ? 1 : 0;

  const tierConfig = {
    0: { label: 'Unverified', color: 'text-gray-400', bg: 'bg-gray-800', border: 'border-gray-700' },
    1: { label: 'Individual Investor', color: 'text-emerald-400', bg: 'bg-emerald-900/20', border: 'border-emerald-700/50' },
    2: { label: 'Limited Partner', color: 'text-blue-400', bg: 'bg-blue-900/20', border: 'border-blue-700/50' },
    3: { label: 'Vault Creator', color: 'text-purple-400', bg: 'bg-purple-900/20', border: 'border-purple-700/50' },
  };

  const tier = tierConfig[userTier as keyof typeof tierConfig];

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!isConnected) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full min-h-[80vh]">
          <div className="text-center p-8">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gray-800 flex items-center justify-center">
              <WalletIcon className="w-8 h-8 text-gray-500" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Connect Your Wallet</h2>
            <p className="text-gray-400">Connect your wallet to view your profile</p>
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
            <h1 className="text-3xl font-bold text-white mb-2">Profile</h1>
            <p className="text-gray-400">Manage your account and view your status</p>
          </div>

          {/* User Card */}
          <div className="card">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-white text-2xl font-bold">
                  {address?.slice(2, 4).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-white font-mono text-lg">
                      {address?.slice(0, 6)}...{address?.slice(-4)}
                    </span>
                    <button
                      onClick={copyAddress}
                      className="p-1 rounded hover:bg-gray-700 transition-colors"
                      title="Copy address"
                    >
                      <ClipboardDocumentIcon className="w-4 h-4 text-gray-400" />
                    </button>
                    {copied && <span className="text-xs text-emerald-400">Copied!</span>}
                    <a
                      href={getAddressExplorerLink(chainId, address!)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 rounded hover:bg-gray-700 transition-colors"
                    >
                      <ArrowTopRightOnSquareIcon className="w-4 h-4 text-gray-400" />
                    </a>
                  </div>
                  <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm ${tier.bg} ${tier.color} border ${tier.border}`}>
                    <span className="w-2 h-2 rounded-full bg-current" />
                    Tier {userTier}: {tier.label}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Network</p>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-white font-medium">{contracts?.CHAIN_NAME || 'Unknown'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card p-5">
              <p className="text-gray-400 text-sm mb-1">ETH Balance</p>
              <p className="text-2xl font-bold text-white">
                {ethBalance ? parseFloat(formatUnits(ethBalance.value, 18)).toFixed(4) : '0.0000'}
              </p>
            </div>
            <div className="card p-5">
              <p className="text-gray-400 text-sm mb-1">USDC Balance</p>
              <p className="text-2xl font-bold text-emerald-400">
                ${usdcBalance ? parseFloat(formatUnits(usdcBalance as bigint, 6)).toLocaleString() : '0.00'}
              </p>
            </div>
            <div className="card p-5">
              <p className="text-gray-400 text-sm mb-1">NFTs Owned</p>
              <p className="text-2xl font-bold text-purple-400">
                {(hasPassportNFT ? 1 : 0) + (hasLPsNFT ? 1 : 0) + (hasVaultsNFT ? 1 : 0)} / 3
              </p>
            </div>
          </div>

          {/* NFT Status */}
          <div className="card">
            <h2 className="text-lg font-semibold text-white mb-4">NFT Holdings</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { name: 'Convexo Passport', owned: hasPassportNFT || hasActivePassport, tier: 1, desc: 'Individual investor access' },
                { name: 'Limited Partner', owned: hasLPsNFT, tier: 2, desc: 'LP pool access' },
                { name: 'Vault Creator', owned: hasVaultsNFT, tier: 3, desc: 'Create funding vaults' },
              ].map((nft) => (
                <div
                  key={nft.name}
                  className={`p-4 rounded-xl border ${
                    nft.owned
                      ? 'bg-emerald-900/10 border-emerald-700/50'
                      : 'bg-gray-800/50 border-gray-700/50'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    {nft.owned ? (
                      <CheckBadgeIcon className="w-6 h-6 text-emerald-400" />
                    ) : (
                      <XCircleIcon className="w-6 h-6 text-gray-500" />
                    )}
                    <div>
                      <p className={`font-medium ${nft.owned ? 'text-white' : 'text-gray-400'}`}>
                        {nft.name}
                      </p>
                      <p className="text-xs text-gray-500">Tier {nft.tier}</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-400">{nft.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/profile/wallet" className="card-interactive p-5">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-purple-900/30">
                  <WalletIcon className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <p className="font-medium text-white">Wallet</p>
                  <p className="text-sm text-gray-400">View all balances</p>
                </div>
              </div>
            </Link>
            <Link href="/profile/bank-accounts" className="card-interactive p-5">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-blue-900/30">
                  <BuildingLibraryIcon className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <p className="font-medium text-white">Bank Accounts</p>
                  <p className="text-sm text-gray-400">Linked accounts</p>
                </div>
              </div>
            </Link>
            <Link href="/profile/contacts" className="card-interactive p-5">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-emerald-900/30">
                  <UsersIcon className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <p className="font-medium text-white">Contacts</p>
                  <p className="text-sm text-gray-400">Address book</p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
