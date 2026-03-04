'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAccount } from '@/lib/wagmi/compat';
import { useAuth } from '@/lib/hooks/useAuth';
import { useNFTBalance } from '@/lib/hooks/useNFTBalance';
import { apiFetch, ApiError } from '@/lib/api/client';
import DashboardLayout from '@/components/DashboardLayout';
import Link from 'next/link';
import {
  DocumentTextIcon,
  LockClosedIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

// ─── Types ────────────────────────────────────────────────────────────────────

type FundingStatus = 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'VAULT_CREATED';

interface FundingRequest {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  purpose: string;
  term: number;
  collateral?: string;
  status: FundingStatus;
  vaultId?: string;
  adminNotes?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface FundingListResponse {
  items: FundingRequest[];
  total: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_BADGE: Record<FundingStatus, { label: string; className: string }> = {
  PENDING: { label: 'Pending', className: 'bg-yellow-900/40 text-yellow-300 border border-yellow-700/40' },
  UNDER_REVIEW: { label: 'Under Review', className: 'bg-blue-900/40 text-blue-300 border border-blue-700/40' },
  APPROVED: { label: 'Approved', className: 'bg-emerald-900/40 text-emerald-300 border border-emerald-700/40' },
  REJECTED: { label: 'Rejected', className: 'bg-red-900/40 text-red-400 border border-red-700/40' },
  VAULT_CREATED: { label: 'Vault Created', className: 'bg-purple-900/40 text-purple-300 border border-purple-700/40' },
};

function StatusBadge({ status }: { status: FundingStatus }) {
  const { label, className } = STATUS_BADGE[status] ?? STATUS_BADGE.PENDING;
  return (
    <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${className}`}>
      {label}
    </span>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

// ─── Contract card ────────────────────────────────────────────────────────────

function ContractCard({ req, isActive }: { req: FundingRequest; isActive: boolean }) {
  return (
    <div className={`card p-6 ${isActive ? 'ring-2 ring-purple-500/50' : ''}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
              isActive
                ? 'bg-gradient-to-br from-purple-600 to-indigo-600'
                : 'bg-gradient-to-br from-gray-700 to-gray-600'
            }`}
          >
            {isActive ? (
              <CheckCircleIcon className="w-5 h-5 text-white" />
            ) : (
              <ClockIcon className="w-5 h-5 text-white" />
            )}
          </div>
          <div>
            <p className="font-semibold text-white">
              {req.amount.toLocaleString()} {req.currency}
            </p>
            <p className="text-gray-400 text-xs">{req.term} month{req.term !== 1 ? 's' : ''} term</p>
          </div>
        </div>
        <StatusBadge status={req.status} />
      </div>

      <div className="space-y-2 text-sm mb-4">
        <div className="flex justify-between">
          <span className="text-gray-400">Submitted</span>
          <span className="text-white">{formatDate(req.createdAt)}</span>
        </div>
        {req.reviewedAt && (
          <div className="flex justify-between">
            <span className="text-gray-400">Reviewed</span>
            <span className="text-white">{formatDate(req.reviewedAt)}</span>
          </div>
        )}
        {req.vaultId && (
          <div className="flex justify-between">
            <span className="text-gray-400">Vault ID</span>
            <span className="text-purple-300 font-mono text-xs">{req.vaultId.slice(0, 16)}…</span>
          </div>
        )}
      </div>

      <div className="mb-4">
        <p className="text-gray-500 text-xs font-medium uppercase tracking-wide mb-1">Purpose</p>
        <p className="text-gray-300 text-sm line-clamp-2">{req.purpose}</p>
      </div>

      {req.adminNotes && (
        <div className="p-3 bg-gray-800/60 rounded-lg border border-gray-700/50 mb-4">
          <p className="text-gray-500 text-xs font-medium uppercase tracking-wide mb-1">Admin Notes</p>
          <p className="text-gray-300 text-sm">{req.adminNotes}</p>
        </div>
      )}

      {req.vaultId && (
        <Link href={`/funding/vaults/${req.vaultId}`}>
          <button className="w-full btn-primary text-sm py-2">
            View Vault Details
          </button>
        </Link>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function EContractsPage() {
  const { isConnected } = useAccount();
  const { isAuthenticated, isSigningIn, signIn } = useAuth();
  const { hasEcreditscoringNFT, isLoading: nftLoading } = useNFTBalance();

  const [requests, setRequests] = useState<FundingRequest[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // ── Data fetching ──────────────────────────────────────────────────────────

  const loadRequests = useCallback(async () => {
    setLoadingList(true);
    setApiError(null);
    try {
      const data = await apiFetch<FundingListResponse>('/funding/requests');
      setRequests(data.items ?? []);
    } catch (err) {
      if (err instanceof ApiError && err.statusCode !== 401) {
        setApiError(err.message);
      }
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && hasEcreditscoringNFT) {
      loadRequests();
    }
  }, [isAuthenticated, hasEcreditscoringNFT, loadRequests]);

  // ── Derived data ───────────────────────────────────────────────────────────

  // Active contracts: fully approved with a vault created
  const activeContracts = requests.filter(r => r.status === 'VAULT_CREATED' && !!r.vaultId);

  // Pending contracts: awaiting review or approved but vault not yet created
  const pendingContracts = requests.filter(
    r => r.status === 'PENDING' || r.status === 'UNDER_REVIEW' || r.status === 'APPROVED',
  );

  // Rejected (display separately for transparency)
  const rejectedContracts = requests.filter(r => r.status === 'REJECTED');

  // ── Guard: not connected ───────────────────────────────────────────────────

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

  if (!isAuthenticated) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full min-h-[80vh]">
          <div className="text-center p-8">
            <DocumentTextIcon className="w-16 h-16 mx-auto mb-4 text-gray-500" />
            <h2 className="text-2xl font-bold text-white mb-2">Sign In Required</h2>
            <p className="text-gray-400 mb-6">Sign in to access E-Contracts</p>
            <button onClick={signIn} disabled={isSigningIn} className="btn-primary">
              {isSigningIn ? 'Signing in…' : 'Sign In'}
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ── Guard: NFT loading ─────────────────────────────────────────────────────

  if (nftLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full min-h-[80vh]">
          <div className="text-center p-8">
            <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-400">Checking access…</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ── Guard: Tier 3 required ─────────────────────────────────────────────────

  if (!hasEcreditscoringNFT) {
    return (
      <DashboardLayout>
        <div className="p-8">
          <div className="max-w-2xl mx-auto">
            <div className="card p-8 text-center">
              <LockClosedIcon className="w-16 h-16 mx-auto mb-4 text-gray-500" />
              <h2 className="text-2xl font-bold text-white mb-2">Credit Score (Tier 3) Required</h2>
              <p className="text-gray-400 mb-6">
                E-Contracts is a Business-only feature. You need an AI Credit Score NFT (Tier 3) to access
                loan contracts. Complete credit verification to unlock this module.
              </p>
              <Link href="/digital-id/credit-score">
                <button className="btn-primary">Get Credit Verified</button>
              </Link>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ── Main view ──────────────────────────────────────────────────────────────

  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="max-w-5xl mx-auto space-y-8">

          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Link href="/funding" className="text-gray-400 hover:text-white transition-colors">Funding</Link>
                <span className="text-gray-600">/</span>
                <span className="text-white">E-Contracts</span>
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">E-Contracts</h1>
              <p className="text-gray-400">View and manage your approved funding contracts</p>
            </div>
            <button
              onClick={loadRequests}
              disabled={loadingList}
              className="p-2 text-gray-400 hover:text-white transition-colors disabled:opacity-50"
              title="Refresh"
            >
              <ArrowPathIcon className={`w-5 h-5 ${loadingList ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card p-5">
              <p className="text-gray-400 text-sm mb-1">Active Contracts</p>
              <p className="text-3xl font-bold text-purple-400">{activeContracts.length}</p>
            </div>
            <div className="card p-5">
              <p className="text-gray-400 text-sm mb-1">Pending Review</p>
              <p className="text-3xl font-bold text-amber-400">{pendingContracts.length}</p>
            </div>
            <div className="card p-5">
              <p className="text-gray-400 text-sm mb-1">Total Capital</p>
              <p className="text-3xl font-bold text-white">
                {activeContracts
                  .reduce((sum, r) => sum + r.amount, 0)
                  .toLocaleString()}{' '}
                <span className="text-lg text-gray-400">USDC</span>
              </p>
            </div>
          </div>

          {/* Error banner */}
          {apiError && (
            <div className="card bg-red-900/20 border-red-700/50 p-4">
              <p className="text-red-400 text-sm">{apiError}</p>
            </div>
          )}

          {/* Loading */}
          {loadingList ? (
            <div className="text-center py-12">
              <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-400">Loading contracts…</p>
            </div>
          ) : requests.length === 0 ? (
            <div className="card p-12 text-center">
              <DocumentTextIcon className="w-16 h-16 mx-auto mb-4 text-gray-500" />
              <h3 className="text-xl font-semibold text-white mb-2">No Contracts Yet</h3>
              <p className="text-gray-400 mb-6">
                Submit a funding request via E-Loans. Once approved, your contracts will appear here.
              </p>
              <Link href="/funding/e-loans">
                <button className="btn-primary">Go to E-Loans</button>
              </Link>
            </div>
          ) : (
            <>
              {/* Active Contracts */}
              {activeContracts.length > 0 && (
                <section className="space-y-4">
                  <div className="flex items-center gap-2">
                    <CheckCircleIcon className="w-5 h-5 text-purple-400" />
                    <h2 className="text-lg font-semibold text-white">Active Contracts ({activeContracts.length})</h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {activeContracts.map(req => (
                      <ContractCard key={req.id} req={req} isActive />
                    ))}
                  </div>
                </section>
              )}

              {/* Pending Contracts */}
              {pendingContracts.length > 0 && (
                <section className="space-y-4">
                  <div className="flex items-center gap-2">
                    <ClockIcon className="w-5 h-5 text-amber-400" />
                    <h2 className="text-lg font-semibold text-white">Pending Contracts ({pendingContracts.length})</h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {pendingContracts.map(req => (
                      <ContractCard key={req.id} req={req} isActive={false} />
                    ))}
                  </div>
                </section>
              )}

              {/* Rejected (collapsed, informational) */}
              {rejectedContracts.length > 0 && (
                <section className="space-y-4">
                  <h2 className="text-base font-medium text-gray-500">
                    Rejected ({rejectedContracts.length})
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {rejectedContracts.map(req => (
                      <ContractCard key={req.id} req={req} isActive={false} />
                    ))}
                  </div>
                </section>
              )}
            </>
          )}

          {/* Info: Contract flow */}
          <div className="card">
            <h3 className="text-base font-semibold text-white mb-4">Contract Lifecycle</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { step: '1', title: 'Submit Request', desc: 'Submit via E-Loans with amount and purpose' },
                { step: '2', title: 'Under Review', desc: 'Convexo team evaluates your request (2–5 days)' },
                { step: '3', title: 'Approved', desc: 'Request approved — vault creation initiated' },
                { step: '4', title: 'Vault Created', desc: 'Investors can fund your vault contract' },
              ].map(item => (
                <div key={item.step} className="text-center p-4">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white font-bold mx-auto mb-3 text-sm">
                    {item.step}
                  </div>
                  <p className="font-medium text-white text-sm mb-1">{item.title}</p>
                  <p className="text-xs text-gray-400">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
}
