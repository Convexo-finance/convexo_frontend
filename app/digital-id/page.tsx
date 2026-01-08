'use client';

import { useAccount } from 'wagmi';
import DashboardLayout from '@/components/DashboardLayout';
import { useNFTBalance } from '@/lib/hooks/useNFTBalance';
import Link from 'next/link';
import Image from 'next/image';
import {
  IdentificationIcon,
  ShieldCheckIcon,
  UserGroupIcon,
  SparklesIcon,
  CheckBadgeIcon,
  XCircleIcon,
  ArrowRightIcon,
  BuildingOffice2Icon,
} from '@heroicons/react/24/outline';

export default function DigitalIDPage() {
  const { isConnected } = useAccount();
  const { hasPassportNFT, hasLPIndividualsNFT, hasLPBusinessNFT, hasVaultsNFT, hasActivePassport, verifiedIdentity } = useNFTBalance();

  const userTier = hasVaultsNFT ? 3 : (hasLPIndividualsNFT || hasLPBusinessNFT) ? 2 : (hasPassportNFT || hasActivePassport) ? 1 : 0;

  const nftCards = [
    {
      name: 'Humanity',
      description: 'Verify your identity via ZK Passport',
      href: '/digital-id/humanity',
      icon: ShieldCheckIcon,
      image: '/NFTs/convexo_zkpassport.png',
      owned: hasPassportNFT || hasActivePassport,
      tier: 1,
      benefits: ['Treasury access', 'Vault investments', 'Payment features'],
      gradient: 'from-emerald-600 to-teal-600',
    },
    {
      name: 'Limited Partner - Individuals',
      description: 'Individual KYC verification via Veriff',
      href: '/digital-id/limited-partner-individuals',
      icon: UserGroupIcon,
      image: '/NFTs/Convexo_lps.png',
      owned: hasLPIndividualsNFT,
      tier: 2,
      benefits: ['LP pool trading', 'ECOP/USDC pools', 'All Tier 1 benefits'],
      gradient: 'from-blue-600 to-cyan-600',
    },
    {
      name: 'Limited Partner - Business',
      description: 'Business KYB verification via Sumsub',
      href: '/digital-id/limited-partner-business',
      icon: BuildingOffice2Icon,
      image: '/NFTs/Convexo_lps.png',
      owned: hasLPBusinessNFT,
      tier: 2,
      benefits: ['LP pool trading', 'B2B features', 'All Tier 1 benefits'],
      gradient: 'from-purple-600 to-pink-600',
    },
    {
      name: 'Credit Score',
      description: 'AI-powered credit evaluation for vault creators',
      href: '/digital-id/credit-score',
      icon: SparklesIcon,
      image: '/NFTs/convexo_vaults.png',
      owned: hasVaultsNFT,
      tier: 3,
      benefits: ['Create funding vaults', 'Access credit lines', 'All Tier 2 benefits'],
      gradient: 'from-purple-600 to-pink-600',
    },
  ];

  if (!isConnected) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full min-h-[80vh]">
          <div className="text-center p-8">
            <IdentificationIcon className="w-16 h-16 mx-auto mb-4 text-gray-500" />
            <h2 className="text-2xl font-bold text-white mb-2">Connect Your Wallet</h2>
            <p className="text-gray-400">Connect your wallet to view your Digital ID</p>
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
            <h1 className="text-3xl font-bold text-white mb-2">Digital ID</h1>
            <p className="text-gray-400">Your NFT credentials that unlock protocol features</p>
          </div>

          {/* Current Status Banner */}
          <div className={`card p-6 ${
            userTier >= 1 
              ? 'bg-gradient-to-r from-purple-900/30 to-blue-900/30 border-purple-700/50' 
              : 'bg-gray-800/50'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm mb-1">Your Current Tier</p>
                <div className="flex items-center gap-3">
                  <span className={`text-3xl font-bold ${
                    userTier === 0 ? 'text-gray-400' :
                    userTier === 1 ? 'text-emerald-400' :
                    userTier === 2 ? 'text-blue-400' : 'text-purple-400'
                  }`}>
                    Tier {userTier}
                  </span>
                  <span className="text-xl text-gray-300">
                    {userTier === 0 ? 'Unverified' :
                     userTier === 1 ? 'Individual Investor' :
                     userTier === 2 ? 'Limited Partner (Individual or Business)' : 'Vault Creator'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {nftCards.map((nft) => (
                  <div
                    key={nft.name}
                    className={`w-10 h-10 rounded-full ${
                      nft.owned ? 'ring-2 ring-emerald-500 ring-offset-2 ring-offset-gray-900' : 'opacity-30 grayscale'
                    }`}
                  >
                    <Image
                      src={nft.image}
                      alt={nft.name}
                      width={40}
                      height={40}
                      className="rounded-full"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* NFT Cards */}
          <div className="space-y-6">
            {nftCards.map((nft, index) => (
              <Link key={nft.name} href={nft.href}>
                <div className={`card p-6 flex items-start gap-6 cursor-pointer transition-all duration-300 hover:border-purple-500/50 ${
                  nft.owned ? 'border-emerald-700/50 bg-emerald-900/5' : ''
                }`}>
                  {/* NFT Image */}
                  <div className={`relative flex-shrink-0 w-32 h-32 rounded-2xl overflow-hidden ${
                    nft.owned ? '' : 'opacity-50 grayscale'
                  }`}>
                    <Image
                      src={nft.image}
                      alt={nft.name}
                      fill
                      className="object-cover"
                    />
                    {nft.owned && (
                      <div className="absolute -top-1 -right-1 w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                        <CheckBadgeIcon className="w-5 h-5 text-white" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="text-xl font-semibold text-white">{nft.name}</h3>
                          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                            nft.owned
                              ? 'bg-emerald-900/50 text-emerald-400 border border-emerald-700/50'
                              : 'bg-gray-800 text-gray-400 border border-gray-700'
                          }`}>
                            Tier {nft.tier}
                          </span>
                        </div>
                        <p className="text-gray-400">{nft.description}</p>
                      </div>
                      <div className={`p-3 rounded-xl bg-gradient-to-br ${nft.gradient}`}>
                        <nft.icon className="w-6 h-6 text-white" />
                      </div>
                    </div>

                    {/* Benefits */}
                    <div className="mt-4">
                      <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Benefits</p>
                      <div className="flex flex-wrap gap-2">
                        {nft.benefits.map((benefit) => (
                          <span
                            key={benefit}
                            className="px-3 py-1 text-sm bg-gray-800 text-gray-300 rounded-full"
                          >
                            {benefit}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Status */}
                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {nft.owned ? (
                          <>
                            <CheckBadgeIcon className="w-5 h-5 text-emerald-400" />
                            <span className="text-emerald-400 font-medium">Verified & Active</span>
                          </>
                        ) : (
                          <>
                            <XCircleIcon className="w-5 h-5 text-gray-500" />
                            <span className="text-gray-400">Not Verified</span>
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-purple-400 font-medium">
                        <span>{nft.owned ? 'View Details' : 'Get Verified'}</span>
                        <ArrowRightIcon className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Tier Progression Info */}
          <div className="card">
            <h3 className="text-lg font-semibold text-white mb-4">Tier Progression</h3>
            <p className="text-gray-400 mb-6">
              Complete verifications to unlock more protocol features. Each tier includes all benefits from lower tiers.
            </p>
            <div className="relative">
              <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-700" />
              <div className="relative flex justify-between">
                {[
                  { tier: 0, label: 'Unverified', current: userTier === 0 },
                  { tier: 1, label: 'Passport', current: userTier === 1 },
                  { tier: 2, label: 'LP', current: userTier === 2 },
                  { tier: 3, label: 'Vault Creator', current: userTier === 3 },
                ].map((step) => (
                  <div key={step.tier} className="flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm z-10 ${
                      userTier >= step.tier
                        ? step.current
                          ? 'bg-gradient-to-br from-purple-600 to-blue-600 text-white ring-4 ring-purple-500/30'
                          : 'bg-emerald-600 text-white'
                        : 'bg-gray-700 text-gray-400'
                    }`}>
                      {step.tier}
                    </div>
                    <p className={`mt-2 text-sm ${userTier >= step.tier ? 'text-white' : 'text-gray-500'}`}>
                      {step.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}


