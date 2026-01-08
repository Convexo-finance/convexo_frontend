'use client';

import { useAccount, useChainId, useReadContract } from 'wagmi';
import DashboardLayout from '@/components/DashboardLayout';
import { useNFTBalance } from '@/lib/hooks/useNFTBalance';
import { ContractsTable } from '@/components/ContractsTable';
import { getContractsForChain } from '@/lib/contracts/addresses';
import { ContractSignerABI } from '@/lib/contracts/abis';
import Link from 'next/link';
import {
  DocumentTextIcon,
  LockClosedIcon,
  PlusCircleIcon,
} from '@heroicons/react/24/outline';

export default function EContractsPage() {
  const { isConnected, address } = useAccount();
  const chainId = useChainId();
  const contracts = getContractsForChain(chainId);
  const { hasPassportNFT, hasActivePassport, canAccessTreasury } = useNFTBalance();

  const { data: contractCount } = useReadContract({
    address: contracts?.CONTRACT_SIGNER,
    abi: ContractSignerABI,
    functionName: 'getContractCount',
    query: { enabled: !!contracts },
  });

  // Tier 1+ access (Convexo Passport holders and above)
  const canAccess = hasPassportNFT || hasActivePassport || canAccessTreasury;

  if (!isConnected) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full min-h-[80vh]">
          <div className="text-center p-8">
            <DocumentTextIcon className="w-16 h-16 mx-auto mb-4 text-gray-500" />
            <h2 className="text-2xl font-bold text-white mb-2">Connect Your Wallet</h2>
            <p className="text-gray-400">Connect your wallet to access E-Contracts</p>
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
                You need at least a Convexo Passport (Tier 1) to access contract signing.
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
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Link href="/funding" className="text-gray-400 hover:text-white">Funding</Link>
                <span className="text-gray-600">/</span>
                <span className="text-white">E-Contracts</span>
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">E-Contracts</h1>
              <p className="text-gray-400">View and manage loan agreements linked to your vaults</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card p-5">
              <p className="text-gray-400 text-sm mb-1">Total Contracts</p>
              <p className="text-3xl font-bold text-white">{contractCount ? Number(contractCount) : 0}</p>
            </div>
            <div className="card p-5">
              <p className="text-gray-400 text-sm mb-1">Pending Signatures</p>
              <p className="text-3xl font-bold text-amber-400">0</p>
            </div>
            <div className="card p-5">
              <p className="text-gray-400 text-sm mb-1">Executed</p>
              <p className="text-3xl font-bold text-emerald-400">0</p>
            </div>
          </div>

          {/* Info Banner */}
          <div className="card bg-blue-900/20 border-blue-700/50 p-4">
            <p className="text-blue-300">
              <strong>Note:</strong> Contracts are created by admins after your vault is fully funded. 
              All parties must sign before funds can be withdrawn.
            </p>
          </div>

          {/* Contracts Table */}
          <div className="card">
            <h2 className="text-lg font-semibold text-white mb-4">All Contracts</h2>
            <ContractsTable />
          </div>

          {/* Contract Flow */}
          <div className="card">
            <h3 className="text-lg font-semibold text-white mb-4">Contract Signing Flow</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { step: '1', title: 'Vault Funded', desc: 'Investors fill your vault to 100%' },
                { step: '2', title: 'Contract Created', desc: 'Admin creates loan agreement' },
                { step: '3', title: 'All Sign', desc: 'Borrower, investors, and admin sign' },
                { step: '4', title: 'Executed', desc: 'Contract attached to vault, funds released' },
              ].map((item) => (
                <div key={item.step} className="text-center p-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center text-white font-bold mx-auto mb-3">
                    {item.step}
                  </div>
                  <p className="font-medium text-white mb-1">{item.title}</p>
                  <p className="text-sm text-gray-400">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}


