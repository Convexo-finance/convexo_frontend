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

          {/* Verification Process */}
          {!isVerified && (
            <div className="card">
              <h2 className="text-xl font-semibold text-white mb-6">Verification Process</h2>
              
              <div className="space-y-6">
                {/* Step 1 */}
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                    1
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-white mb-1">Submit Business Documents</h3>
                    <p className="text-gray-400 text-sm mb-3">
                      Provide company registration, tax documents, and proof of business operations.
                    </p>
                    <Link href="/get-verified/amlcft">
                      <button className="btn-secondary text-sm">
                        Start Veriff KYB
                      </button>
                    </Link>
                  </div>
                </div>

                <div className="h-8 border-l-2 border-dashed border-gray-700 ml-5" />

                {/* Step 2 */}
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-gray-400 font-bold flex-shrink-0">
                    2
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-400 mb-1">Admin Review</h3>
                    <p className="text-gray-500 text-sm">
                      Our team reviews your submitted documents for compliance.
                    </p>
                  </div>
                </div>

                <div className="h-8 border-l-2 border-dashed border-gray-700 ml-5" />

                {/* Step 3 */}
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-gray-400 font-bold flex-shrink-0">
                    3
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-400 mb-1">Receive LP NFT</h3>
                    <p className="text-gray-500 text-sm">
                      Upon approval, your Convexo_LPs NFT is automatically minted.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Benefits */}
          <div className="card">
            <h3 className="text-lg font-semibold text-white mb-4">Tier 2 Benefits</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { icon: ArrowRightIcon, title: 'LP Pool Access', desc: 'Trade in USDC/ECOP and other compliant pools' },
                { icon: BuildingOfficeIcon, title: 'Business Features', desc: 'Access B2B payment solutions' },
                { icon: ShieldCheckIcon, title: 'All Tier 1 Benefits', desc: 'Treasury, investments, and payments' },
              ].map((benefit) => (
                <div key={benefit.title} className="p-4 bg-gray-800/50 rounded-xl">
                  <benefit.icon className="w-6 h-6 text-blue-400 mb-2" />
                  <p className="font-medium text-white mb-1">{benefit.title}</p>
                  <p className="text-sm text-gray-400">{benefit.desc}</p>
                </div>
              ))}
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


