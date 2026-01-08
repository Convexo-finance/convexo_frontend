'use client';

import { useAccount, useChainId } from 'wagmi';
import { useState } from 'react';
import { getContractsForChain } from '@/lib/contracts/addresses';
import DashboardLayout from '@/components/DashboardLayout';
import {
  Cog6ToothIcon,
  UserGroupIcon,
  ShieldCheckIcon,
  CubeIcon,
  DocumentTextIcon,
  ChartBarIcon,
  BuildingLibraryIcon,
} from '@heroicons/react/24/outline';

// Import admin components
import { AdminDashboard } from '@/components/admin/AdminDashboard';
import { UserManagement } from '@/components/admin/UserManagement';
import { VeriffVerificationSystem } from '@/components/admin/VeriffVerificationSystem';
import { SumsubVerificationSystem } from '@/components/admin/SumsubVerificationSystem';
import { VaultsManagement } from '@/components/admin/VaultsManagement';
import { TreasuriesView } from '@/components/admin/TreasuriesView';
import { ContractsView } from '@/components/admin/ContractsView';

type TabType = 'dashboard' | 'users' | 'verification' | 'vaults' | 'treasuries' | 'contracts';
type VerificationTabType = 'veriff' | 'sumsub';

const tabs = [
  { id: 'dashboard' as TabType, name: 'Dashboard', icon: ChartBarIcon },
  { id: 'users' as TabType, name: 'User Management', icon: UserGroupIcon },
  { id: 'verification' as TabType, name: 'Verifications', icon: ShieldCheckIcon },
  { id: 'vaults' as TabType, name: 'Vaults', icon: CubeIcon },
  { id: 'treasuries' as TabType, name: 'Treasuries', icon: BuildingLibraryIcon },
  { id: 'contracts' as TabType, name: 'Contracts', icon: DocumentTextIcon },
];

export default function AdminPage() {
  const { isConnected, address } = useAccount();
  const chainId = useChainId();
  const contracts = getContractsForChain(chainId);
  const isAdmin = address?.toLowerCase() === contracts?.ADMIN_ADDRESS.toLowerCase();

  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [verificationTab, setVerificationTab] = useState<VerificationTabType>('veriff');

  if (!isConnected) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full min-h-[80vh]">
          <div className="text-center p-8">
            <Cog6ToothIcon className="w-16 h-16 mx-auto mb-4 text-gray-500" />
            <h2 className="text-2xl font-bold text-white mb-2">Connect Your Wallet</h2>
            <p className="text-gray-400">Connect your wallet to access admin panel</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!isAdmin) {
    return (
      <DashboardLayout>
        <div className="p-8">
          <div className="max-w-2xl mx-auto">
            <div className="card p-8 bg-red-900/20 border-red-700/50">
              <h2 className="text-2xl font-bold text-red-400 mb-4">Access Denied</h2>
              <p className="text-gray-300 mb-4">
                This page is restricted to the admin address only.
              </p>
              <div className="p-4 bg-gray-800/50 rounded-lg font-mono text-sm">
                <p className="text-gray-400 mb-2">Your address:</p>
                <p className="text-white break-all">{address}</p>
                <p className="text-gray-400 mt-4 mb-2">Required address:</p>
                <p className="text-emerald-400 break-all">{contracts?.ADMIN_ADDRESS || 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!contracts) {
    return (
      <DashboardLayout>
        <div className="p-8">
          <div className="max-w-2xl mx-auto">
            <div className="card p-8 bg-amber-900/20 border-amber-700/50">
              <h2 className="text-2xl font-bold text-amber-400 mb-4">Unsupported Network</h2>
              <p className="text-gray-300 mb-4">
                Please switch to one of the supported networks:
              </p>
              <ul className="space-y-2">
                <li className="text-gray-300">• Ethereum Sepolia (11155111)</li>
                <li className="text-gray-300">• Base Sepolia (84532)</li>
                <li className="text-gray-300">• Unichain Sepolia (1301)</li>
                <li className="text-gray-300">• Ethereum Mainnet (1)</li>
                <li className="text-gray-300">• Base Mainnet (8453)</li>
                <li className="text-gray-300">• Unichain Mainnet (130)</li>
              </ul>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Admin Panel</h1>
              <p className="text-gray-400">Convexo Protocol v2.2 - {contracts.CHAIN_NAME}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-sm text-gray-400">Admin Connected</span>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-800">
            <nav className="flex space-x-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors border-b-2 ${
                      isActive
                        ? 'border-purple-500 text-purple-400'
                        : 'border-transparent text-gray-400 hover:text-white hover:border-gray-700'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{tab.name}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="min-h-[600px]">
            {activeTab === 'dashboard' && <AdminDashboard />}
            {activeTab === 'users' && <UserManagement />}
            {activeTab === 'verification' && (
              <div className="space-y-6">
                {/* Verification Sub-tabs */}
                <div className="border-b border-gray-800">
                  <nav className="flex space-x-1">
                    <button
                      onClick={() => setVerificationTab('veriff')}
                      className={`px-4 py-3 font-medium transition-colors border-b-2 ${
                        verificationTab === 'veriff'
                          ? 'border-blue-500 text-blue-400'
                          : 'border-transparent text-gray-400 hover:text-white hover:border-gray-700'
                      }`}
                    >
                      Veriff KYC (Individuals)
                    </button>
                    <button
                      onClick={() => setVerificationTab('sumsub')}
                      className={`px-4 py-3 font-medium transition-colors border-b-2 ${
                        verificationTab === 'sumsub'
                          ? 'border-cyan-500 text-cyan-400'
                          : 'border-transparent text-gray-400 hover:text-white hover:border-gray-700'
                      }`}
                    >
                      Sumsub KYB (Business)
                    </button>
                  </nav>
                </div>

                {/* Verification Content */}
                <div className="min-h-[500px]">
                  {verificationTab === 'veriff' && <VeriffVerificationSystem />}
                  {verificationTab === 'sumsub' && <SumsubVerificationSystem />}
                </div>
              </div>
            )}
            {activeTab === 'vaults' && <VaultsManagement />}
            {activeTab === 'treasuries' && <TreasuriesView />}
            {activeTab === 'contracts' && <ContractsView />}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
