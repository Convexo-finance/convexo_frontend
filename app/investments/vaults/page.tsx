'use client';

import { useAccount } from 'wagmi';
import DashboardLayout from '@/components/DashboardLayout';
import { useNFTBalance } from '@/lib/hooks/useNFTBalance';
import Link from 'next/link';
import {
  CubeIcon,
  LockClosedIcon,
  ArrowTopRightOnSquareIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

export default function EarnVaultsPage() {
  const { isConnected } = useAccount();
  const { hasPassportNFT, hasActivePassport, hasLPsNFT, hasVaultsNFT } = useNFTBalance();

  const canAccess = hasPassportNFT || hasActivePassport || hasLPsNFT || hasVaultsNFT;

  const vaults = [
    {
      id: 1,
      name: 'Morpho USDC Vault',
      protocol: 'Morpho',
      tvl: '$2.5M',
      apy: '5.2%',
      chain: 'Ethereum',
      status: 'coming_soon',
    },
    {
      id: 2,
      name: 'Aave USDC Lending',
      protocol: 'Aave',
      tvl: '$450M',
      apy: '4.8%',
      chain: 'Base',
      status: 'coming_soon',
    },
    {
      id: 3,
      name: 'Yearn USDC Vault',
      protocol: 'Yearn',
      tvl: '$15M',
      apy: '6.1%',
      chain: 'Ethereum',
      status: 'coming_soon',
    },
  ];

  if (!isConnected) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full min-h-[80vh]">
          <div className="text-center p-8">
            <CubeIcon className="w-16 h-16 mx-auto mb-4 text-gray-500" />
            <h2 className="text-2xl font-bold text-white mb-2">Connect Your Wallet</h2>
            <p className="text-gray-400">Connect your wallet to access earn vaults</p>
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
                You need at least a CONVEXO PASSPORT (Tier 1) to access earn vaults.
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
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header */}
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Link href="/investments" className="text-gray-400 hover:text-white">Investments</Link>
              <span className="text-gray-600">/</span>
              <span className="text-white">Earn Vaults</span>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Earn Vaults</h1>
            <p className="text-gray-400">Connect to DeFi yield protocols for institutional-grade earning strategies</p>
          </div>

          {/* Coming Soon Banner */}
          <div className="card p-6 bg-gradient-to-r from-purple-900/30 to-pink-900/30 border-purple-700/50">
            <div className="flex items-center gap-4">
              <div className="p-4 rounded-2xl bg-purple-600">
                <SparklesIcon className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white mb-1">Coming Soon</h3>
                <p className="text-gray-300">
                  We&apos;re integrating with leading DeFi protocols to bring you the best earning opportunities. 
                  Stay tuned for Morpho, Aave, Yearn, and more integrations.
                </p>
              </div>
            </div>
          </div>

          {/* Preview Vaults */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-white">Preview Available Integrations</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {vaults.map((vault) => (
                <div key={vault.id} className="card p-6 opacity-60 cursor-not-allowed relative overflow-hidden">
                  {/* Coming Soon Badge */}
                  <div className="absolute top-4 right-4">
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-900/50 text-purple-400 border border-purple-700/50">
                      Coming Soon
                    </span>
                  </div>

                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                      <CubeIcon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">{vault.name}</h3>
                      <p className="text-sm text-gray-400">{vault.protocol}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 text-sm">TVL</span>
                      <span className="text-white font-medium">{vault.tvl}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 text-sm">APY</span>
                      <span className="text-emerald-400 font-medium">{vault.apy}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 text-sm">Chain</span>
                      <span className="text-white">{vault.chain}</span>
                    </div>
                  </div>

                  <button disabled className="btn-secondary w-full mt-4 opacity-50 cursor-not-allowed">
                    Deposit
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* How it Works */}
          <div className="card">
            <h3 className="text-lg font-semibold text-white mb-4">How Earn Vaults Work</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { step: '1', title: 'Choose Vault', desc: 'Select a vault based on APY and risk profile' },
                { step: '2', title: 'Deposit USDC', desc: 'Deposit your stablecoins into the vault' },
                { step: '3', title: 'Earn Yield', desc: 'Your funds earn yield from DeFi strategies' },
                { step: '4', title: 'Withdraw', desc: 'Withdraw your funds + earnings anytime' },
              ].map((item) => (
                <div key={item.step} className="text-center p-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-white font-bold mx-auto mb-3">
                    {item.step}
                  </div>
                  <p className="font-medium text-white mb-1">{item.title}</p>
                  <p className="text-sm text-gray-400">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Protocol Links */}
          <div className="card">
            <h3 className="text-lg font-semibold text-white mb-4">Integrated Protocols</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { name: 'Morpho', url: 'https://morpho.org' },
                { name: 'Aave', url: 'https://aave.com' },
                { name: 'Yearn', url: 'https://yearn.fi' },
                { name: 'Compound', url: 'https://compound.finance' },
              ].map((protocol) => (
                <a
                  key={protocol.name}
                  href={protocol.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-4 bg-gray-800/50 rounded-xl hover:bg-gray-700/50 transition-colors"
                >
                  <span className="font-medium text-white">{protocol.name}</span>
                  <ArrowTopRightOnSquareIcon className="w-4 h-4 text-gray-400" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}


