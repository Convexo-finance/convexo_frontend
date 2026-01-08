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
  BuildingOfficeIcon,
  DocumentTextIcon,
  ShieldCheckIcon,
  IdentificationIcon,
  BuildingOffice2Icon,
} from '@heroicons/react/24/outline';

export default function LimitedPartnerPage() {
  const { isConnected, address } = useAccount();
  const { hasLPsNFT, hasVaultsNFT } = useNFTBalance();
  const { status: veriffStatus, isLoading } = useVerificationStatus(address);

  const isVerified = hasLPsNFT;
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
                <span className="text-white">Limited Partner</span>
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">Limited Partner Verification</h1>
              <p className="text-gray-400">Business verification to access LP pools and trading (Tier 2)</p>
            </div>
            <Image
              src="/NFTs/Convexo_lps.png"
              alt="Convexo LPs"
              width={80}
              height={80}
              className={`rounded-2xl ${isVerified ? '' : 'opacity-50 grayscale'}`}
            />
          </div>

          {/* Status Card */}
          <div className={`card p-6 ${
            isVerified 
              ? 'bg-blue-900/20 border-blue-700/50' 
              : verificationPending 
              ? 'bg-amber-900/20 border-amber-700/50'
              : 'bg-gray-800/50'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {isVerified ? (
                  <CheckBadgeIcon className="w-12 h-12 text-blue-400" />
                ) : verificationPending ? (
                  <div className="w-12 h-12 flex items-center justify-center">
                    <div className="w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : (
                  <XCircleIcon className="w-12 h-12 text-gray-500" />
                )}
                <div>
                  <p className="text-lg font-semibold text-white">
                    {isVerified ? 'Limited Partner Verified' : verificationPending ? 'Verification Pending' : 'Not Verified'}
                  </p>
                  <p className="text-gray-400">
                    {isVerified 
                      ? 'You have access to LP pools' 
                      : verificationPending
                      ? 'Your verification is being reviewed by admin'
                      : 'Complete business verification to get LP access'}
                  </p>
                </div>
              </div>
              {isVerified && (
                <div className="text-right">
                  <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-900/50 text-blue-400 border border-blue-700/50">
                    <span className="w-2 h-2 rounded-full bg-blue-400" />
                    Tier 2 Active
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Verification Methods */}
          {!isVerified && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-white">Choose Verification Type</h2>
              <p className="text-gray-400">
                Select the verification that matches your situation. Both grant the same Tier 2 LP access.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Veriff - Individuals */}
                <Link href="/digital-id/limited-partner/verify">
                  <div className="card p-6 h-full cursor-pointer transition-all duration-300 hover:border-purple-500/50">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center mb-4">
                      <IdentificationIcon className="w-7 h-7 text-white" />
                    </div>

                    <h3 className="text-lg font-semibold text-white mb-2">Individual Verification</h3>
                    <p className="text-gray-400 text-sm mb-4">
                      For individual investors. Complete KYC verification via Veriff.
                    </p>

                    <ul className="space-y-2 mb-6">
                      <li className="flex items-center gap-2 text-sm text-gray-300">
                        <CheckBadgeIcon className="w-4 h-4 text-blue-400 flex-shrink-0" />
                        ID document upload
                      </li>
                      <li className="flex items-center gap-2 text-sm text-gray-300">
                        <CheckBadgeIcon className="w-4 h-4 text-blue-400 flex-shrink-0" />
                        Liveness check
                      </li>
                      <li className="flex items-center gap-2 text-sm text-gray-300">
                        <CheckBadgeIcon className="w-4 h-4 text-blue-400 flex-shrink-0" />
                        Address verification
                      </li>
                      <li className="flex items-center gap-2 text-sm text-gray-300">
                        <CheckBadgeIcon className="w-4 h-4 text-blue-400 flex-shrink-0" />
                        Receive LP_Individuals NFT
                      </li>
                    </ul>

                    <div className="flex items-center gap-2 text-purple-400 font-medium">
                      <span>Start Individual KYC</span>
                      <ArrowRightIcon className="w-4 h-4" />
                    </div>
                  </div>
                </Link>

                {/* Sumsub - Business */}
                <Link href="/digital-id/limited-partner/verify">
                  <div className="card p-6 h-full cursor-pointer transition-all duration-300 hover:border-purple-500/50">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center mb-4">
                      <BuildingOffice2Icon className="w-7 h-7 text-white" />
                    </div>

                    <h3 className="text-lg font-semibold text-white mb-2">Business Verification</h3>
                    <p className="text-gray-400 text-sm mb-4">
                      For business entities. Complete KYB verification via Sumsub.
                    </p>

                    <ul className="space-y-2 mb-6">
                      <li className="flex items-center gap-2 text-sm text-gray-300">
                        <CheckBadgeIcon className="w-4 h-4 text-purple-400 flex-shrink-0" />
                        Business registration
                      </li>
                      <li className="flex items-center gap-2 text-sm text-gray-300">
                        <CheckBadgeIcon className="w-4 h-4 text-purple-400 flex-shrink-0" />
                        Tax documentation
                      </li>
                      <li className="flex items-center gap-2 text-sm text-gray-300">
                        <CheckBadgeIcon className="w-4 h-4 text-purple-400 flex-shrink-0" />
                        Beneficial ownership
                      </li>
                      <li className="flex items-center gap-2 text-sm text-gray-300">
                        <CheckBadgeIcon className="w-4 h-4 text-purple-400 flex-shrink-0" />
                        Receive LP_Business NFT
                      </li>
                    </ul>

                    <div className="flex items-center gap-2 text-purple-400 font-medium">
                      <span>Start Business KYB</span>
                      <ArrowRightIcon className="w-4 h-4" />
                    </div>
                  </div>
                </Link>
              </div>
            </div>
          )}

          {/* Benefits */}
          <div className="card">
            <h3 className="text-lg font-semibold text-white mb-4">Tier 2 Benefits</h3>
            <div className="space-y-6">
              {/* Tier 2 Exclusive Benefits */}
              <div>
                <h4 className="text-md font-medium text-blue-400 mb-3">Tier 2 Exclusive</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { icon: ArrowRightIcon, title: 'LP Pool Access', desc: 'Trade in USDC/ECOP and other compliant pools' },
                    { icon: BuildingOfficeIcon, title: 'Business Features', desc: 'Access B2B payment solutions' },
                    { icon: DocumentTextIcon, title: 'AI Credit Score', desc: 'Request credit score evaluation for vault creation' },
                    { icon: ShieldCheckIcon, title: 'Enhanced Compliance', desc: 'Full KYC/KYB verified status' },
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

          {/* Requirements */}
          <div className="card">
            <h3 className="text-lg font-semibold text-white mb-4">Requirements</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                'Valid business registration',
                'Tax identification number',
                'Proof of business address',
                'Beneficial ownership declaration',
                'AML/CFT compliance check',
                'Business bank statement',
              ].map((req) => (
                <div key={req} className="flex items-center gap-3 text-gray-300">
                  <DocumentTextIcon className="w-5 h-5 text-gray-500" />
                  <span>{req}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}


