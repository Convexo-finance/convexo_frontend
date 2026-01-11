'use client';

import { useAccount } from 'wagmi';
import DashboardLayout from '@/components/DashboardLayout';
import { useNFTBalance } from '@/lib/hooks/useNFTBalance';
import { useVerificationStatus } from '@/lib/hooks/useVerification';
import { NFTDisplayCard } from '@/components/NFTDisplayCard';
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
      href: '/digital-id/humanity/verify',
      gradient: 'from-emerald-600 to-teal-600',
      features: [
        'Privacy-first: No personal data stored',
        'Instant verification',
        'Passport NFC chip scan',
        'Age verification (18+)',
      ],
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

          {/* Show NFT Card when verified */}
          {isVerified && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <NFTDisplayCard type="passport" address={address} />
              <div className="space-y-4">
                <div className="card p-6 bg-emerald-900/20 border-emerald-700/50">
                  <div className="flex items-center gap-4">
                    <CheckBadgeIcon className="w-12 h-12 text-emerald-400" />
                    <div>
                      <p className="text-lg font-semibold text-white">Verified Human</p>
                      <p className="text-gray-400">You have a valid CONVEXO PASSPORT</p>
                    </div>
                  </div>
                  <div className="mt-4 flex justify-end">
                    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-900/50 text-emerald-400 border border-emerald-700/50">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      Tier 1 Active
                    </span>
                  </div>
                  
                  {verifiedIdentity && (
                    <div className="mt-6 pt-4 border-t border-emerald-700/30 grid grid-cols-2 gap-4">
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
                
                {/* Quick Access Links */}
                <div className="card p-4">
                  <h4 className="text-sm font-medium text-gray-400 mb-3">Quick Access</h4>
                  <div className="space-y-2">
                    <Link href="/treasury" className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg hover:bg-gray-800 transition group">
                      <span className="text-white">Treasury</span>
                      <ArrowRightIcon className="w-4 h-4 text-gray-400 group-hover:text-white transition" />
                    </Link>
                    <Link href="/investments/vaults" className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg hover:bg-gray-800 transition group">
                      <span className="text-white">Vault Investments</span>
                      <ArrowRightIcon className="w-4 h-4 text-gray-400 group-hover:text-white transition" />
                    </Link>
                    <Link href="/digital-id/limited-partner-individuals" className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg hover:bg-gray-800 transition group">
                      <span className="text-white">Upgrade to Tier 2</span>
                      <ArrowRightIcon className="w-4 h-4 text-gray-400 group-hover:text-white transition" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Status Card - only show when NOT verified */}
          {!isVerified && (
            <div className="card p-6 bg-gray-800/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <XCircleIcon className="w-12 h-12 text-gray-500" />
                  <div>
                    <p className="text-lg font-semibold text-white">Not Verified</p>
                    <p className="text-gray-400">Choose a verification method below</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Verification Method */}
          {!isVerified && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-white">Verification Method</h2>
              <p className="text-gray-400">
                Use your passport's NFC chip to verify your identity with zero-knowledge proofs. Your personal data stays private.
              </p>

              <div className="max-w-2xl">
                {verificationMethods.map((method) => (
                  <Link key={method.id} href={method.href}>
                    <div className="card p-6 cursor-pointer transition-all duration-300 hover:border-purple-500/50">
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { title: 'OTC Orders', desc: 'Create and execute over-the-counter trades' },
                { title: 'Token Swaps', desc: 'Swap between USDC, ECOP, and other tokens' },
                { title: 'COP Monetization', desc: 'Convert COP to ECOP and vice versa' },
                { title: 'LP Interactions', desc: 'Exchange local stables with USDC or EURC' },
                { title: 'Tokenized Loans', desc: 'Invest in available tokenized bond vaults' },
                { title: 'Treasury Access', desc: 'Create and manage multi-sig treasuries' },
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


