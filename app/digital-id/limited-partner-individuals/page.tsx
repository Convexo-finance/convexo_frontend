'use client';

import { useAccount } from 'wagmi';
import DashboardLayout from '@/components/DashboardLayout';
import { useNFTBalance } from '@/lib/hooks/useNFTBalance';
import { useVerificationStatus } from '@/lib/hooks/useVerification';
import { NFTDisplayCard } from '@/components/NFTDisplayCard';
import Image from 'next/image';
import Link from 'next/link';
import {
  UserGroupIcon,
  CheckBadgeIcon,
  XCircleIcon,
  ArrowRightIcon,
  DocumentTextIcon,
  ShieldCheckIcon,
  IdentificationIcon,
} from '@heroicons/react/24/outline';
import { getIPFSUrl } from '@/lib/contracts/addresses';

export default function LimitedPartnerIndividualsPage() {
  const { isConnected, address } = useAccount();
  const { hasLPIndividualsNFT } = useNFTBalance();
  const { status: veriffStatus, isLoading } = useVerificationStatus(address);

  const isVerified = hasLPIndividualsNFT;
  const verificationPending = veriffStatus === 1; // Pending status

  if (!isConnected) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full min-h-[80vh]">
          <div className="text-center p-8">
            <UserGroupIcon className="w-16 h-16 mx-auto mb-4 text-gray-500" />
            <h2 className="text-2xl font-bold text-white mb-2">Connect Your Wallet</h2>
            <p className="text-gray-400">Connect your wallet to view LP verification</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Link href="/digital-id" className="text-gray-400 hover:text-white">Digital ID</Link>
                <span className="text-gray-600">/</span>
                <span className="text-white">Limited Partner - Individuals</span>
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">Individual Investor Verification</h1>
              <p className="text-gray-400">KYC verification for individual investors to access Tier 2 LP pools and trading (Tier 2)</p>
            </div>
            <Image
              src={getIPFSUrl('bafkreib7mkjzpdm3id6st6d5vsxpn7v5h6sxeiswejjmrbcb5yoagaf4em')}
              alt="LP Individuals NFT"
              width={80}
              height={80}
              className={`rounded-2xl ${isVerified ? '' : 'opacity-50 grayscale'}`}
              onError={(e) => {
                e.currentTarget.src = '/NFTs/Convexo_lps.png';
              }}
            />
          </div>

          {/* Show NFT Card when verified */}
          {isVerified && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <NFTDisplayCard type="lpIndividuals" address={address} />
              <div className="space-y-4">
                <div className="card p-6 bg-blue-900/20 border-blue-700/50">
                  <div className="flex items-center gap-4">
                    <CheckBadgeIcon className="w-12 h-12 text-blue-400" />
                    <div>
                      <p className="text-lg font-semibold text-white">Individual LP Verified</p>
                      <p className="text-gray-400">You have LP_Individuals NFT and full Tier 2 access</p>
                    </div>
                  </div>
                  <div className="mt-4 flex justify-end">
                    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-900/50 text-blue-400 border border-blue-700/50">
                      <span className="w-2 h-2 rounded-full bg-blue-400" />
                      Tier 2 Active
                    </span>
                  </div>
                </div>
                
                {/* Quick Access Links */}
                <div className="card p-4">
                  <h4 className="text-sm font-medium text-gray-400 mb-3">Quick Access</h4>
                  <div className="space-y-2">
                    <Link href="/investments/market-lps" className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg hover:bg-gray-800 transition group">
                      <span className="text-white">LP Market Pools</span>
                      <ArrowRightIcon className="w-4 h-4 text-gray-400 group-hover:text-white transition" />
                    </Link>
                    <Link href="/digital-id/credit-score" className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg hover:bg-gray-800 transition group">
                      <span className="text-white">Request Credit Score</span>
                      <ArrowRightIcon className="w-4 h-4 text-gray-400 group-hover:text-white transition" />
                    </Link>
                    <Link href="/treasury/monetization" className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg hover:bg-gray-800 transition group">
                      <span className="text-white">COP Monetization</span>
                      <ArrowRightIcon className="w-4 h-4 text-gray-400 group-hover:text-white transition" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Status Card - only show when NOT verified */}
          {!isVerified && (
            <div className={`card p-6 ${
              verificationPending 
                ? 'bg-amber-900/20 border-amber-700/50'
                : 'bg-gray-800/50'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {verificationPending ? (
                    <div className="w-12 h-12 flex items-center justify-center">
                      <div className="w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : (
                    <XCircleIcon className="w-12 h-12 text-gray-500" />
                  )}
                  <div>
                    <p className="text-lg font-semibold text-white">
                      {verificationPending ? 'Verification Pending' : 'Not Verified'}
                    </p>
                    <p className="text-gray-400">
                      {verificationPending
                        ? 'Your KYC verification is being reviewed by admin'
                        : 'Complete individual KYC verification to get LP access'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Verification Process */}
          {!isVerified && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-white">Individual KYC Verification</h2>
              <p className="text-gray-400">
                Complete your personal KYC verification via Veriff to receive the LP_Individuals NFT and unlock Tier 2 features.
              </p>

              <div className="card p-6">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center flex-shrink-0">
                    <IdentificationIcon className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Veriff KYC Process</h3>
                    <p className="text-gray-400 text-sm">Fast, secure identity verification</p>
                  </div>
                </div>

                <ul className="space-y-3 mb-6">
                  <li className="flex items-center gap-2 text-gray-300">
                    <CheckBadgeIcon className="w-5 h-5 text-blue-400 flex-shrink-0" />
                    <span>Valid government-issued ID (passport, driver's license, national ID)</span>
                  </li>
                  <li className="flex items-center gap-2 text-gray-300">
                    <CheckBadgeIcon className="w-5 h-5 text-blue-400 flex-shrink-0" />
                    <span>Selfie/video liveness check</span>
                  </li>
                  <li className="flex items-center gap-2 text-gray-300">
                    <CheckBadgeIcon className="w-5 h-5 text-blue-400 flex-shrink-0" />
                    <span>Address verification (proof of residence)</span>
                  </li>
                  <li className="flex items-center gap-2 text-gray-300">
                    <CheckBadgeIcon className="w-5 h-5 text-blue-400 flex-shrink-0" />
                    <span>Sanctions and AML screening</span>
                  </li>
                  <li className="flex items-center gap-2 text-gray-300">
                    <CheckBadgeIcon className="w-5 h-5 text-blue-400 flex-shrink-0" />
                    <span>Receive LP_Individuals NFT upon approval</span>
                  </li>
                </ul>

                <Link href="/digital-id/limited-partner-individuals/verify">
                  <button className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors">
                    <div className="flex items-center justify-center gap-2">
                      <span>Start Individual KYC Verification</span>
                      <ArrowRightIcon className="w-5 h-5" />
                    </div>
                  </button>
                </Link>
              </div>
            </div>
          )}

          {/* Verification Requirements */}
          <div className="card">
            <h3 className="text-lg font-semibold text-white mb-4">KYC Requirements</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                'Valid government-issued ID',
                'Proof of identity (selfie/video)',
                'Proof of residence',
                'Clean sanctions screening',
                'AML/CFT verification',
                'Age 18+',
              ].map((req) => (
                <div key={req} className="flex items-center gap-3 text-gray-300">
                  <DocumentTextIcon className="w-5 h-5 text-blue-400 flex-shrink-0" />
                  <span>{req}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Tier 2 Benefits */}
          <div className="card">
            <h3 className="text-lg font-semibold text-white mb-4">Tier 2 Benefits</h3>
            <div className="space-y-6">
              {/* Tier 2 Exclusive Benefits */}
              <div>
                <h4 className="text-md font-medium text-blue-400 mb-3">Tier 2 Exclusive</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { icon: ArrowRightIcon, title: 'LP Pool Access', desc: 'Trade in USDC/ECOP and other compliant pools' },
                    { icon: DocumentTextIcon, title: 'E-Contracts', desc: 'Sign and manage smart contracts' },
                  ].map((benefit) => (
                    <div key={benefit.title} className="p-4 bg-gray-800/50 rounded-xl">
                      <benefit.icon className="w-6 h-6 text-blue-400 mb-2" />
                      <p className="font-medium text-white mb-1">{benefit.title}</p>
                      <p className="text-sm text-gray-400">{benefit.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tier 1 Benefits Included */}
              <div>
                <h4 className="text-md font-medium text-emerald-400 mb-3">Tier 1 Benefits Included</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {[
                    { title: 'OTC Orders', desc: 'Over-the-counter trades' },
                    { title: 'Token Swaps', desc: 'USDC, ECOP swaps' },
                    { title: 'COP Monetization', desc: 'COP ↔ ECOP conversion' },
                    { title: 'LP Interactions', desc: 'Local stables exchange' },
                    { title: 'Tokenized Loans', desc: 'Vault investments' },
                    { title: 'Treasury Access', desc: 'Multi-sig treasuries' },
                  ].map((benefit) => (
                    <div key={benefit.title} className="p-3 bg-gray-800/30 rounded-lg">
                      <p className="font-medium text-white text-sm mb-1">{benefit.title}</p>
                      <p className="text-xs text-gray-400">{benefit.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-4">
            <div className="flex gap-3">
              <ShieldCheckIcon className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-blue-200 font-medium mb-1">Secure & Compliant</p>
                <p className="text-blue-300/80 text-sm">
                  Your personal information is encrypted and processed through Veriff's secure infrastructure. Convexo never stores sensitive identity documents.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
