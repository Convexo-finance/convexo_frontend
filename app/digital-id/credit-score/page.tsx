'use client';

import { useAccount } from 'wagmi';
import DashboardLayout from '@/components/DashboardLayout';
import { useNFTBalance } from '@/lib/hooks/useNFTBalance';
import Image from 'next/image';
import Link from 'next/link';
import {
  SparklesIcon,
  CheckBadgeIcon,
  XCircleIcon,
  ArrowRightIcon,
  DocumentChartBarIcon,
  BuildingOfficeIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  LockClosedIcon,
} from '@heroicons/react/24/outline';

export default function CreditScorePage() {
  const { isConnected } = useAccount();
  const { hasEcreditscoringNFT, hasAnyLPNFT, canRequestCreditScore } = useNFTBalance();

  const isVerified = hasEcreditscoringNFT;

  const evaluationCategories = [
    {
      id: 'financial',
      name: 'Financial Evaluation',
      description: 'Analysis of financial statements and cash flow',
      icon: CurrencyDollarIcon,
      color: 'from-emerald-600 to-teal-600',
      items: [
        'Revenue & profitability',
        'Cash flow analysis',
        'Debt-to-equity ratio',
        'Working capital',
      ],
    },
    {
      id: 'business',
      name: 'Business Evaluation',
      description: 'Assessment of business operations and stability',
      icon: BuildingOfficeIcon,
      color: 'from-purple-600 to-pink-600',
      items: [
        'Business history',
        'Industry analysis',
        'Management team',
        'Growth potential',
      ],
    },
  ];

  if (!isConnected) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full min-h-[80vh]">
          <div className="text-center p-8">
            <SparklesIcon className="w-16 h-16 mx-auto mb-4 text-gray-500" />
            <h2 className="text-2xl font-bold text-white mb-2">Connect Your Wallet</h2>
            <p className="text-gray-400">Connect your wallet to view credit scoring</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!canRequestCreditScore) {
    return (
      <DashboardLayout>
        <div className="p-8">
          <div className="max-w-2xl mx-auto">
            <div className="card p-8 text-center">
              <LockClosedIcon className="w-16 h-16 mx-auto mb-4 text-gray-500" />
              <h2 className="text-2xl font-bold text-white mb-2">Tier 2 Required</h2>
              <p className="text-gray-400 mb-6">
                You need at least a Limited Partner NFT (Tier 2) to request credit score evaluation.
              </p>
              <Link href="/digital-id/limited-partner">
                <button className="btn-primary">Get LP Verification</button>
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
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Link href="/digital-id" className="text-gray-400 hover:text-white">Digital ID</Link>
                <span className="text-gray-600">/</span>
                <span className="text-white">Credit Score</span>
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">Credit Score Evaluation</h1>
              <p className="text-gray-400">Financial & Business evaluation for vault creation (Tier 3)</p>
            </div>
            <Image
              src="/NFTs/convexo_vaults.png"
              alt="Convexo Vaults"
              width={80}
              height={80}
              className={`rounded-2xl ${isVerified ? '' : 'opacity-50 grayscale'}`}
            />
          </div>

          {/* Status Card */}
          <div className={`card p-6 ${
            isVerified 
              ? 'bg-purple-900/20 border-purple-700/50' 
              : 'bg-gray-800/50'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {isVerified ? (
                  <CheckBadgeIcon className="w-12 h-12 text-purple-400" />
                ) : (
                  <XCircleIcon className="w-12 h-12 text-gray-500" />
                )}
                <div>
                  <p className="text-lg font-semibold text-white">
                    {isVerified ? 'Credit Verified' : 'Not Evaluated'}
                  </p>
                  <p className="text-gray-400">
                    {isVerified 
                      ? 'You can create funding vaults' 
                      : 'Complete credit evaluation to unlock vault creation'}
                  </p>
                </div>
              </div>
              {isVerified && (
                <div className="text-right">
                  <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-900/50 text-purple-400 border border-purple-700/50">
                    <span className="w-2 h-2 rounded-full bg-purple-400" />
                    Tier 3 Active
                  </span>
                </div>
              )}
            </div>

            {isVerified && (
              <div className="mt-6 pt-6 border-t border-purple-700/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Credit Score</p>
                    <p className="text-3xl font-bold text-purple-400">85 / 100</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Risk Rating</p>
                    <span className="px-3 py-1 rounded-full bg-emerald-900/50 text-emerald-400 text-sm font-medium">
                      Low Risk
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Max Credit Line</p>
                    <p className="text-xl font-semibold text-white">$500,000</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Evaluation Categories */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-white">Evaluation Categories</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {evaluationCategories.map((category) => (
                <div key={category.id} className="card p-6">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${category.color} flex items-center justify-center mb-4`}>
                    <category.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">{category.name}</h3>
                  <p className="text-gray-400 text-sm mb-4">{category.description}</p>
                  <ul className="space-y-2">
                    {category.items.map((item) => (
                      <li key={item} className="flex items-center gap-2 text-sm text-gray-300">
                        <ChartBarIcon className="w-4 h-4 text-gray-500" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Start Evaluation */}
          {!isVerified && (
            <div className="card p-6 bg-gradient-to-r from-purple-900/30 to-blue-900/30 border-purple-700/50">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Start Credit Evaluation</h3>
                  <p className="text-gray-400">
                    Upload your financial documents for AI-powered credit scoring.
                  </p>
                </div>
                <Link href="/digital-id/credit-score/verify">
                  <button className="btn-primary flex items-center gap-2">
                    <SparklesIcon className="w-5 h-5" />
                    Start Evaluation
                  </button>
                </Link>
              </div>
            </div>
          )}

          {/* Benefits */}
          <div className="card">
            <h3 className="text-lg font-semibold text-white mb-4">Tier 3 Benefits</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { icon: DocumentChartBarIcon, title: 'Create Vaults', desc: 'Launch tokenized bond vaults for funding' },
                { icon: CurrencyDollarIcon, title: 'Access Credit', desc: 'Get credit lines based on your score' },
                { icon: CheckBadgeIcon, title: 'All Lower Tiers', desc: 'Full access to Tier 1 & 2 features' },
              ].map((benefit) => (
                <div key={benefit.title} className="p-4 bg-gray-800/50 rounded-xl">
                  <benefit.icon className="w-6 h-6 text-purple-400 mb-2" />
                  <p className="font-medium text-white mb-1">{benefit.title}</p>
                  <p className="text-sm text-gray-400">{benefit.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Documents Required */}
          <div className="card">
            <h3 className="text-lg font-semibold text-white mb-4">Documents Required</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                'Last 3 years financial statements',
                'Bank statements (6 months)',
                'Tax returns',
                'Business plan / projections',
                'Accounts receivable aging',
                'Existing debt schedule',
              ].map((doc) => (
                <div key={doc} className="flex items-center gap-3 text-gray-300">
                  <DocumentChartBarIcon className="w-5 h-5 text-gray-500" />
                  <span>{doc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}


