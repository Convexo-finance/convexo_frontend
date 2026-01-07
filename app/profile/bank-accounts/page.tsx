'use client';

import { useAccount } from 'wagmi';
import DashboardLayout from '@/components/DashboardLayout';
import {
  BuildingLibraryIcon,
  PlusIcon,
  CheckCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

export default function BankAccountsPage() {
  const { isConnected } = useAccount();

  // Mock bank accounts data - in production this would come from an API/database
  const bankAccounts = [
    {
      id: 1,
      bankName: 'Bancolombia',
      accountType: 'Savings',
      accountNumber: '****4521',
      currency: 'COP',
      status: 'verified',
    },
    {
      id: 2,
      bankName: 'Davivienda',
      accountType: 'Current',
      accountNumber: '****7832',
      currency: 'COP',
      status: 'pending',
    },
  ];

  if (!isConnected) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full min-h-[80vh]">
          <div className="text-center p-8">
            <BuildingLibraryIcon className="w-16 h-16 mx-auto mb-4 text-gray-500" />
            <h2 className="text-2xl font-bold text-white mb-2">Connect Your Wallet</h2>
            <p className="text-gray-400">Connect your wallet to manage bank accounts</p>
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Bank Accounts</h1>
              <p className="text-gray-400">Link and manage your bank accounts for fiat operations</p>
            </div>
            <button className="btn-primary flex items-center gap-2">
              <PlusIcon className="w-5 h-5" />
              Add Account
            </button>
          </div>

          {/* Info Banner */}
          <div className="card bg-blue-900/20 border-blue-700/50">
            <div className="flex items-start gap-3">
              <BuildingLibraryIcon className="w-6 h-6 text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-white mb-1">Bank Account Linking</p>
                <p className="text-sm text-gray-400">
                  Link your Colombian bank accounts to enable COP to ECOP conversions and receive payments directly to your bank.
                  All accounts require verification before use.
                </p>
              </div>
            </div>
          </div>

          {/* Bank Accounts List */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-white">Linked Accounts</h2>
            
            {bankAccounts.length === 0 ? (
              <div className="card p-8 text-center">
                <BuildingLibraryIcon className="w-12 h-12 mx-auto mb-4 text-gray-500" />
                <p className="text-gray-400 mb-4">No bank accounts linked yet</p>
                <button className="btn-secondary">Link Your First Account</button>
              </div>
            ) : (
              <div className="space-y-4">
                {bankAccounts.map((account) => (
                  <div key={account.id} className="card p-5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center">
                        <BuildingLibraryIcon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-white">{account.bankName}</p>
                        <p className="text-sm text-gray-400">
                          {account.accountType} • {account.accountNumber} • {account.currency}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-sm ${
                        account.status === 'verified'
                          ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-700/50'
                          : 'bg-amber-900/30 text-amber-400 border border-amber-700/50'
                      }`}>
                        {account.status === 'verified' ? (
                          <CheckCircleIcon className="w-4 h-4" />
                        ) : (
                          <ClockIcon className="w-4 h-4" />
                        )}
                        {account.status === 'verified' ? 'Verified' : 'Pending'}
                      </div>
                      <button className="btn-ghost text-sm">Manage</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Supported Banks */}
          <div className="card">
            <h2 className="text-lg font-semibold text-white mb-4">Supported Banks</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {['Bancolombia', 'Davivienda', 'BBVA Colombia', 'Banco de Bogotá'].map((bank) => (
                <div key={bank} className="p-4 bg-gray-800/50 rounded-xl text-center">
                  <p className="text-sm font-medium text-gray-300">{bank}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}


