'use client';

import { useAccount } from 'wagmi';
import DashboardLayout from '@/components/DashboardLayout';
import { useNFTBalance } from '@/lib/hooks/useNFTBalance';
import { useVerificationStatus } from '@/lib/hooks/useVerification';
import Image from 'next/image';
import Link from 'next/link';
import {
  UserGroupIcon,
  CheckBadgeIcon,
  XCircleIcon,
  ArrowRightIcon,
  DocumentTextIcon,
  ShieldCheckIcon,
  BuildingOffice2Icon,
} from '@heroicons/react/24/outline';
import { getIPFSUrl } from '@/lib/contracts/addresses';

export default function LimitedPartnerBusinessPage() {
  const { isConnected, address } = useAccount();
  const { hasLPBusinessNFT } = useNFTBalance();
  const { status: sumsubStatus, isLoading } = useVerificationStatus(address);

  const isVerified = hasLPBusinessNFT;
  const verificationPending = sumsubStatus === 1; // Pending status

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
                <span className="text-white">Limited Partner - Business</span>
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">Business Entity Verification</h1>
              <p className="text-gray-400">KYB verification for business entities to access Tier 2 LP pools and trading (Tier 2)</p>
            </div>
            <Image
              src={getIPFSUrl('bafkreiejesvgsvohwvv7q5twszrbu5z6dnpke6sg5cdiwgn2rq7dilu33m')}
              alt="LP Business NFT"
              width={80}
              height={80}
              className={`rounded-2xl ${isVerified ? '' : 'opacity-50 grayscale'}`}
              onError={(e) => {
                e.currentTarget.src = '/NFTs/Convexo_lps.png';
              }}
            />
          </div>

          {/* Status Card */}
          <div className={`card p-6 ${
            isVerified 
              ? 'bg-purple-900/20 border-purple-700/50' 
              : verificationPending 
              ? 'bg-amber-900/20 border-amber-700/50'
              : 'bg-gray-800/50'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {isVerified ? (
                  <CheckBadgeIcon className="w-12 h-12 text-purple-400" />
                ) : verificationPending ? (
                  <div className="w-12 h-12 flex items-center justify-center">
                    <div className="w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : (
                  <XCircleIcon className="w-12 h-12 text-gray-500" />
                )}
                <div>
                  <p className="text-lg font-semibold text-white">
                    {isVerified ? 'Business LP Verified' : verificationPending ? 'Verification Pending' : 'Not Verified'}
                  </p>
                  <p className="text-gray-400">
                    {isVerified 
                      ? 'You have LP_Business NFT and full Tier 2 access' 
                      : verificationPending
                      ? 'Your KYB verification is being reviewed by admin'
                      : 'Complete business KYB verification to get LP access'}
                  </p>
                </div>
              </div>
              {isVerified && (
                <div className="text-right">
                  <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-900/50 text-purple-400 border border-purple-700/50">
                    <span className="w-2 h-2 rounded-full bg-purple-400" />
                    Tier 2 Active
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Verification Process */}
          {!isVerified && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-white">Business KYB Verification</h2>
              <p className="text-gray-400">
                Complete your business KYB verification via Sumsub to receive the LP_Business NFT and unlock Tier 2 features.
              </p>

              <div className="card p-6">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center flex-shrink-0">
                    <BuildingOffice2Icon className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Sumsub KYB Process</h3>
                    <p className="text-gray-400 text-sm">Comprehensive business verification</p>
                  </div>
                </div>

                <ul className="space-y-3 mb-6">
                  <li className="flex items-center gap-2 text-gray-300">
                    <CheckBadgeIcon className="w-5 h-5 text-purple-400 flex-shrink-0" />
                    <span>Business registration documents</span>
                  </li>
                  <li className="flex items-center gap-2 text-gray-300">
                    <CheckBadgeIcon className="w-5 h-5 text-purple-400 flex-shrink-0" />
                    <span>Tax identification number (TIN) and documentation</span>
                  </li>
                  <li className="flex items-center gap-2 text-gray-300">
                    <CheckBadgeIcon className="w-5 h-5 text-purple-400 flex-shrink-0" />
                    <span>Proof of business address</span>
                  </li>
                  <li className="flex items-center gap-2 text-gray-300">
                    <CheckBadgeIcon className="w-5 h-5 text-purple-400 flex-shrink-0" />
                    <span>Beneficial ownership declaration</span>
                  </li>
                  <li className="flex items-center gap-2 text-gray-300">
                    <CheckBadgeIcon className="w-5 h-5 text-purple-400 flex-shrink-0" />
                    <span>Recent business bank statement or invoice</span>
                  </li>
                  <li className="flex items-center gap-2 text-gray-300">
                    <CheckBadgeIcon className="w-5 h-5 text-purple-400 flex-shrink-0" />
                    <span>AML/CFT and sanctions screening</span>
                  </li>
                  <li className="flex items-center gap-2 text-gray-300">
                    <CheckBadgeIcon className="w-5 h-5 text-purple-400 flex-shrink-0" />
                    <span>Receive LP_Business NFT upon approval</span>
                  </li>
                </ul>

                <Link href="/digital-id/limited-partner-business/verify">
                  <button className="w-full px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors">
                    <div className="flex items-center justify-center gap-2">
                      <span>Start Business KYB Verification</span>
                      <ArrowRightIcon className="w-5 h-5" />
                    </div>
                  </button>
                </Link>
              </div>
            </div>
          )}

          {/* Verification Requirements */}
          <div className="card">
            <h3 className="text-lg font-semibold text-white mb-4">KYB Requirements</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                'Valid business registration',
                'Tax identification number',
                'Proof of business address',
                'Beneficial ownership information',
                'Business bank statement or invoice',
                'AML/CFT compliance check',
              ].map((req) => (
                <div key={req} className="flex items-center gap-3 text-gray-300">
                  <DocumentTextIcon className="w-5 h-5 text-purple-400 flex-shrink-0" />
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
                <h4 className="text-md font-medium text-purple-400 mb-3">Tier 2 Exclusive</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { icon: ArrowRightIcon, title: 'LP Pool Access', desc: 'Trade in USDC/ECOP and other compliant pools' },
                    { icon: DocumentTextIcon, title: 'B2B Features', desc: 'Access business payment solutions and features' },
                  ].map((benefit) => (
                    <div key={benefit.title} className="p-4 bg-gray-800/50 rounded-xl">
                      <benefit.icon className="w-6 h-6 text-purple-400 mb-2" />
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
          <div className="bg-purple-900/20 border border-purple-700/30 rounded-lg p-4">
            <div className="flex gap-3">
              <ShieldCheckIcon className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-purple-200 font-medium mb-1">Secure & Compliant</p>
                <p className="text-purple-300/80 text-sm">
                  Your business information is encrypted and processed through Sumsub's secure infrastructure. Convexo maintains strict compliance with international regulations.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
