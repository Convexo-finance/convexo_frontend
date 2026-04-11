'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAccount } from '@/lib/wagmi/compat';
import { useAuth } from '@/lib/hooks/useAuth';
import { useNFTBalance } from '@/lib/hooks/useNFTBalance';
import { apiFetch, ApiError } from '@/lib/api/client';
import Link from 'next/link';
import {
  BanknotesIcon,
  LockClosedIcon,
  PlusCircleIcon,
  ArrowPathIcon,
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

// ─── Empty form state ─────────────────────────────────────────────────────────

const EMPTY_FORM = {
  amount: '',
  purpose: '',
  term: '12',
  collateral: '',
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ELoansPage() {
  const { isConnected } = useAccount();
  const { isAuthenticated, isSigningIn, signIn } = useAuth();
  const { hasEcreditscoringNFT, isLoading: nftLoading } = useNFTBalance();

  const [requests, setRequests] = useState<FundingRequest[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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

  // ── Form submit ────────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setApiError(null);
    setSuccessMessage(null);

    const amountNum = parseFloat(formData.amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setApiError('Please enter a valid amount.');
      setSubmitting(false);
      return;
    }

    try {
      const created = await apiFetch<FundingRequest>('/funding/requests', {
        method: 'POST',
        body: JSON.stringify({
          amount: amountNum,
          currency: 'USDC',
          purpose: formData.purpose,
          term: parseInt(formData.term, 10),
          collateral: formData.collateral.trim() || undefined,
        }),
      });
      setRequests(prev => [created, ...prev]);
      setFormData(EMPTY_FORM);
      setShowForm(false);
      setSuccessMessage('Funding request submitted successfully. Our team will review it shortly.');
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Guard: not connected ───────────────────────────────────────────────────

  if (!isConnected) {
    return (
        <div className="flex items-center justify-center h-full min-h-[80vh]">
          <div className="text-center p-8">
            <BanknotesIcon className="w-16 h-16 mx-auto mb-4 text-gray-500" />
            <h2 className="text-2xl font-bold text-white mb-2">Connect Your Wallet</h2>
            <p className="text-gray-400">Connect your wallet to access E-Loans</p>
          </div>
        </div>
    );
  }

  if (!isAuthenticated) {
    return (
        <div className="flex items-center justify-center h-full min-h-[80vh]">
          <div className="text-center p-8">
            <BanknotesIcon className="w-16 h-16 mx-auto mb-4 text-gray-500" />
            <h2 className="text-2xl font-bold text-white mb-2">Sign In Required</h2>
            <p className="text-gray-400 mb-6">Sign in to access E-Loans</p>
            <button onClick={signIn} disabled={isSigningIn} className="btn-primary">
              {isSigningIn ? 'Signing in…' : 'Sign In'}
            </button>
          </div>
        </div>
    );
  }

  // ── Guard: NFT loading ─────────────────────────────────────────────────────

  if (nftLoading) {
    return (
        <div className="flex items-center justify-center h-full min-h-[80vh]">
          <div className="text-center p-8">
            <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-400">Checking access…</p>
          </div>
        </div>
    );
  }

  // ── Guard: Tier 3 required ─────────────────────────────────────────────────

  if (!hasEcreditscoringNFT) {
    return (
        <div className="p-8">
          <div className="max-w-2xl mx-auto">
            <div className="card p-8 text-center">
              <LockClosedIcon className="w-16 h-16 mx-auto mb-4 text-gray-500" />
              <h2 className="text-2xl font-bold text-white mb-2">Credit Score (Tier 3) Required</h2>
              <p className="text-gray-400 mb-6">
                E-Loans is a Business-only feature. You need an AI Credit Score NFT (Tier 3) to submit funding
                requests. Complete credit verification to unlock this module.
              </p>
              <Link href="/digital-id/credit-score">
                <button className="btn-primary">Get Credit Verified</button>
              </Link>
            </div>
          </div>
        </div>
    );
  }

  // ── Main view ──────────────────────────────────────────────────────────────

  return (
      <div className="p-8">
        <div className="max-w-5xl mx-auto space-y-8">

          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Link href="/funding" className="text-gray-400 hover:text-white transition-colors">Funding</Link>
                <span className="text-gray-600">/</span>
                <span className="text-white">E-Loans</span>
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">E-Loans</h1>
              <p className="text-gray-400">Submit and track funding requests for your business</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={loadRequests}
                disabled={loadingList}
                className="p-2 text-gray-400 hover:text-white transition-colors disabled:opacity-50"
                title="Refresh"
              >
                <ArrowPathIcon className={`w-5 h-5 ${loadingList ? 'animate-spin' : ''}`} />
              </button>
              {!showForm && (
                <button
                  onClick={() => { setShowForm(true); setApiError(null); setSuccessMessage(null); }}
                  className="btn-primary flex items-center gap-2"
                >
                  <PlusCircleIcon className="w-5 h-5" />
                  New Request
                </button>
              )}
            </div>
          </div>

          {/* Success banner */}
          {successMessage && (
            <div className="card bg-emerald-900/20 border-emerald-700/50 p-4">
              <p className="text-emerald-300 text-sm">{successMessage}</p>
            </div>
          )}

          {/* Error banner */}
          {apiError && (
            <div className="card bg-red-900/20 border-red-700/50 p-4">
              <p className="text-red-400 text-sm">{apiError}</p>
            </div>
          )}

          {/* Info banner */}
          <div className="card bg-purple-900/20 border-purple-700/50 p-4">
            <p className="text-purple-300 text-sm">
              <strong>How it works:</strong> Submit a funding request with your business details. Our team will review
              it within 2–5 business days. Approved requests will have a vault created for investor funding.
            </p>
          </div>

          {/* New Request Form */}
          {showForm && (
            <div className="card">
              <h2 className="text-xl font-semibold text-white mb-6">New Funding Request</h2>
              <form onSubmit={handleSubmit} className="space-y-5">

                {/* Amount */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Amount <span className="text-gray-500">(USDC)</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    value={formData.amount}
                    onChange={e => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="e.g. 50000"
                    required
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
                  />
                </div>

                {/* Term */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Term</label>
                  <select
                    value={formData.term}
                    onChange={e => setFormData({ ...formData, term: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                  >
                    <option value="3">3 months</option>
                    <option value="6">6 months</option>
                    <option value="12">12 months</option>
                    <option value="24">24 months</option>
                  </select>
                </div>

                {/* Purpose */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Purpose</label>
                  <textarea
                    value={formData.purpose}
                    onChange={e => setFormData({ ...formData, purpose: e.target.value })}
                    placeholder="Describe how you will use these funds (e.g. expand operations, purchase equipment…)"
                    required
                    rows={4}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none resize-none"
                  />
                </div>

                {/* Collateral (optional) */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Collateral <span className="text-gray-500">(optional)</span>
                  </label>
                  <textarea
                    value={formData.collateral}
                    onChange={e => setFormData({ ...formData, collateral: e.target.value })}
                    placeholder="Describe any collateral you can offer to secure the loan…"
                    rows={3}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none resize-none"
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <button type="submit" disabled={submitting} className="btn-primary flex-1">
                    {submitting ? 'Submitting…' : 'Submit Request'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowForm(false); setFormData(EMPTY_FORM); setApiError(null); }}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Requests List */}
          {loadingList ? (
            <div className="text-center py-12">
              <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-400">Loading requests…</p>
            </div>
          ) : requests.length === 0 ? (
            <div className="card p-12 text-center">
              <BanknotesIcon className="w-16 h-16 mx-auto mb-4 text-gray-500" />
              <h3 className="text-xl font-semibold text-white mb-2">No Funding Requests Yet</h3>
              <p className="text-gray-400 mb-6">
                Submit your first funding request to start raising capital for your business.
              </p>
              {!showForm && (
                <button
                  onClick={() => setShowForm(true)}
                  className="btn-primary"
                >
                  Create First Request
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-white">Your Requests ({requests.length})</h2>
              {requests.map(req => (
                <div key={req.id} className="card p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <p className="text-white font-semibold text-lg">
                          {req.amount.toLocaleString()} {req.currency}
                        </p>
                        <StatusBadge status={req.status} />
                      </div>
                      <p className="text-gray-400 text-sm">
                        {req.term} month{req.term !== 1 ? 's' : ''} &middot; Submitted {formatDate(req.createdAt)}
                      </p>
                    </div>
                    {req.vaultId && (
                      <Link href={`/funding/vaults/${req.vaultId}`}>
                        <button className="text-sm text-purple-400 hover:text-purple-300 transition-colors border border-purple-700/50 px-3 py-1.5 rounded-lg">
                          View Vault
                        </button>
                      </Link>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div>
                      <p className="text-gray-500 text-xs font-medium uppercase tracking-wide mb-1">Purpose</p>
                      <p className="text-gray-300 text-sm">{req.purpose}</p>
                    </div>
                    {req.collateral && (
                      <div>
                        <p className="text-gray-500 text-xs font-medium uppercase tracking-wide mb-1">Collateral</p>
                        <p className="text-gray-300 text-sm">{req.collateral}</p>
                      </div>
                    )}
                    {req.adminNotes && (
                      <div className="mt-3 p-3 bg-gray-800/60 rounded-lg border border-gray-700/50">
                        <p className="text-gray-500 text-xs font-medium uppercase tracking-wide mb-1">Admin Notes</p>
                        <p className="text-gray-300 text-sm">{req.adminNotes}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
  );
}
