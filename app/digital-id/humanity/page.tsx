'use client';

import { useAccount } from 'wagmi';
import DashboardLayout from '@/components/DashboardLayout';
import { useNFTBalance } from '@/lib/hooks/useNFTBalance';
import { useVerificationStatus } from '@/lib/hooks/useVerification';
import Image from 'next/image';
import Link from 'next/link';
import {
  ShieldCheckIcon,
  CheckBadgeIcon,
  XCircleIcon,
  ArrowRightIcon,
  FingerPrintIcon,
  GlobeAltIcon,
} from '@heroicons/react/24/outline';

export default function HumanityPage() {
  const { isConnected, address } = useAccount();
  const { hasPassportNFT, hasActivePassport, verifiedIdentity } = useNFTBalance();
  const { status: veriffStatus } = useVerificationStatus(address);

  const isVerified = hasPassportNFT || hasActivePassport;

  const verificationMethods = [
    {
      id: 'zkpassport',
      name: 'ZK Passport',
      description: 'Privacy-preserving verification using zero-knowledge proofs from your passport',
      icon: FingerPrintIcon,
      href: '/get-verified/zk-verification',
      gradient: 'from-emerald-600 to-teal-600',
      features: [
        'Privacy-first: No personal data stored',
        'Instant verification',
        'Passport NFC chip scan',
        'Age verification (18+)',
      ],
      recommended: true,
    },
    {
      id: 'veriff',
      name: 'Veriff KYC',
      description: 'Traditional identity verification with document upload and liveness check',
      icon: GlobeAltIcon,
      href: '/get-verified/amlcft',
      gradient: 'from-blue-600 to-cyan-600',
      features: [
        'ID document upload',
        'Liveness check',
        'Address verification',
        'AML/CFT compliant',
      ],
      recommended: false,
    },
  ];

  if (!isConnected) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full min-h-[80vh]">
          <div className="text-center p-8">
            <ShieldCheckIcon className="w-16 h-16 mx-auto mb-4 text-gray-500" />
            <h2 className="text-2xl font-bold text-white mb-2">Connect Your Wallet</h2>
            <p className="text-gray-400">Connect your wallet to verify your humanity</p>
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
                <span className="text-white">Humanity</span>
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">Humanity Verification</h1>
              <p className="text-gray-400">Prove you&apos;re human to receive your CONVEXO PASSPORT (Tier 1)</p>
            </div>
            <Image
              src="/NFTs/convexo_zkpassport.png"
              alt="CONVEXO PASSPORT"
              width={80}
              height={80}
              className={`rounded-2xl ${isVerified ? '' : 'opacity-50 grayscale'}`}
            />
          </div>

          {/* Status Card */}
          <div className={`card p-6 ${
            isVerified 
              ? 'bg-emerald-900/20 border-emerald-700/50' 
              : 'bg-gray-800/50'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {isVerified ? (
                  <CheckBadgeIcon className="w-12 h-12 text-emerald-400" />
                ) : (
                  <XCircleIcon className="w-12 h-12 text-gray-500" />
                )}
                <div>
                  <p className="text-lg font-semibold text-white">
                    {isVerified ? 'Verified Human' : 'Not Verified'}
                  </p>
                  <p className="text-gray-400">
                    {isVerified 
                      ? 'You have a valid CONVEXO PASSPORT' 
                      : 'Choose a verification method below'}
                  </p>
                </div>
              </div>
              {isVerified && (
                <div className="text-right">
                  <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-900/50 text-emerald-400 border border-emerald-700/50">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    Tier 1 Active
                  </span>
                </div>
              )}
            </div>
            
            {isVerified && verifiedIdentity && (
              <div className="mt-6 pt-6 border-t border-emerald-700/30 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">KYC Status</p>
                  <p className={`font-medium ${verifiedIdentity.kycVerified ? 'text-emerald-400' : 'text-gray-400'}`}>
                    {verifiedIdentity.kycVerified ? 'Verified' : 'Pending'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Face Match</p>
                  <p className={`font-medium ${verifiedIdentity.faceMatchPassed ? 'text-emerald-400' : 'text-gray-400'}`}>
                    {verifiedIdentity.faceMatchPassed ? 'Passed' : 'Pending'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Sanctions</p>
                  <p className={`font-medium ${verifiedIdentity.sanctionsPassed ? 'text-emerald-400' : 'text-gray-400'}`}>
                    {verifiedIdentity.sanctionsPassed ? 'Clear' : 'Pending'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Age</p>
                  <p className={`font-medium ${verifiedIdentity.isOver18 ? 'text-emerald-400' : 'text-gray-400'}`}>
                    {verifiedIdentity.isOver18 ? '18+ Confirmed' : 'Pending'}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Verification Methods */}
          {!isVerified && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-white">Choose Verification Method</h2>
              <p className="text-gray-400">
                Both methods grant the same Tier 1 permissions. Choose based on your preference for privacy or convenience.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {verificationMethods.map((method) => (
                  <Link key={method.id} href={method.href}>
                    <div className={`card p-6 h-full cursor-pointer transition-all duration-300 hover:border-purple-500/50 relative ${
                      method.recommended ? 'ring-2 ring-purple-500/30' : ''
                    }`}>
                      {method.recommended && (
                        <div className="absolute -top-3 left-4 px-3 py-1 bg-purple-600 text-white text-xs font-semibold rounded-full">
                          Recommended
                        </div>
                      )}
                      
                      <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${method.gradient} flex items-center justify-center mb-4`}>
                        <method.icon className="w-7 h-7 text-white" />
                      </div>

                      <h3 className="text-lg font-semibold text-white mb-2">{method.name}</h3>
                      <p className="text-gray-400 text-sm mb-4">{method.description}</p>

                      <ul className="space-y-2 mb-6">
                        {method.features.map((feature) => (
                          <li key={feature} className="flex items-center gap-2 text-sm text-gray-300">
                            <CheckBadgeIcon className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                            {feature}
                          </li>
                        ))}
                      </ul>

                      <div className="flex items-center gap-2 text-purple-400 font-medium">
                        <span>Start Verification</span>
                        <ArrowRightIcon className="w-4 h-4" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Benefits */}
          <div className="card">
            <h3 className="text-lg font-semibold text-white mb-4">Tier 1 Benefits</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { title: 'Treasury Access', desc: 'Create and manage multi-sig treasuries' },
                { title: 'Vault Investments', desc: 'Invest in tokenized bond vaults' },
                { title: 'Payment Features', desc: 'Send and receive USDC payments' },
              ].map((benefit) => (
                <div key={benefit.title} className="p-4 bg-gray-800/50 rounded-xl">
                  <p className="font-medium text-white mb-1">{benefit.title}</p>
                  <p className="text-sm text-gray-400">{benefit.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}


