'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAccount } from '@/lib/wagmi/compat';
import { useAuth } from '@/lib/hooks/useAuth';
import { apiFetch, ApiError } from '@/lib/api/client';
import DashboardLayout from '@/components/DashboardLayout';
import {
  BuildingLibraryIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  StarIcon,
} from '@heroicons/react/24/outline';

interface BankAccount {
  id: string;
  accountName: string;
  bankName: string;
  accountNumber: string; // masked e.g. "****1234"
  accountType: 'SAVINGS' | 'CHECKING' | 'BUSINESS';
  currency: string;
  holderName: string | null;
  isDefault: boolean;
  isVerified: boolean;
}

const emptyForm: {
  accountName: string;
  bankName: string;
  accountNumber: string;
  accountType: 'SAVINGS' | 'CHECKING' | 'BUSINESS';
  currency: string;
  holderName: string;
} = {
  accountName: '',
  bankName: '',
  accountNumber: '',
  accountType: 'SAVINGS',
  currency: 'COP',
  holderName: '',
};

export default function BankAccountsPage() {
  const { isConnected } = useAccount();
  const { isAuthenticated, isSigningIn, signIn } = useAuth();

  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState(emptyForm);

  const loadAccounts = useCallback(async () => {
    setLoading(true);
    setApiError(null);
    try {
      const data = await apiFetch<{ items: BankAccount[]; total: number }>('/bank-accounts');
      setAccounts(data.items);
    } catch (err) {
      if (err instanceof ApiError && err.statusCode !== 401) {
        setApiError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) loadAccounts();
  }, [isAuthenticated, loadAccounts]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setApiError(null);
    try {
      if (editingId) {
        const updated = await apiFetch<BankAccount>(`/bank-accounts/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify({
            accountName: formData.accountName,
            bankName: formData.bankName,
            accountType: formData.accountType,
            currency: formData.currency,
            holderName: formData.holderName || undefined,
          }),
        });
        setAccounts(prev => prev.map(a => (a.id === editingId ? updated : a)));
      } else {
        const created = await apiFetch<BankAccount>('/bank-accounts', {
          method: 'POST',
          body: JSON.stringify({ ...formData, holderName: formData.holderName || undefined }),
        });
        setAccounts(prev => [...prev, created]);
      }
      resetForm();
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Failed to save account');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (account: BankAccount) => {
    setEditingId(account.id);
    setFormData({
      accountName: account.accountName,
      bankName: account.bankName,
      accountNumber: '',
      accountType: account.accountType,
      currency: account.currency,
      holderName: account.holderName ?? '',
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this bank account?')) return;
    try {
      await apiFetch(`/bank-accounts/${id}`, { method: 'DELETE' });
      setAccounts(prev => prev.filter(a => a.id !== id));
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Failed to delete');
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      const updated = await apiFetch<BankAccount>(`/bank-accounts/${id}/default`, { method: 'POST' });
      setAccounts(prev => prev.map(a => ({ ...a, isDefault: a.id === id ? updated.isDefault : false })));
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Failed to set default');
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData(emptyForm);
  };

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

  if (!isAuthenticated) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full min-h-[80vh]">
          <div className="text-center p-8">
            <BuildingLibraryIcon className="w-16 h-16 mx-auto mb-4 text-gray-500" />
            <h2 className="text-2xl font-bold text-white mb-2">Sign In Required</h2>
            <p className="text-gray-400 mb-6">Sign in to manage your bank accounts</p>
            <button onClick={signIn} disabled={isSigningIn} className="btn-primary">
              {isSigningIn ? 'Signing in…' : 'Sign In'}
            </button>
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
            {!showForm && (
              <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2">
                <PlusIcon className="w-5 h-5" />
                Add Account
              </button>
            )}
          </div>

          {/* Error */}
          {apiError && (
            <div className="card bg-red-900/20 border-red-700/50 text-red-400 text-sm p-4">
              {apiError}
            </div>
          )}

          {/* Add / Edit Form */}
          {showForm && (
            <div className="card">
              <h2 className="text-xl font-semibold text-white mb-6">
                {editingId ? 'Edit Account' : 'Add New Account'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Account Name</label>
                  <input
                    type="text"
                    value={formData.accountName}
                    onChange={e => setFormData({ ...formData, accountName: e.target.value })}
                    placeholder="My Business Account"
                    required
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Bank Name</label>
                    <input
                      type="text"
                      value={formData.bankName}
                      onChange={e => setFormData({ ...formData, bankName: e.target.value })}
                      placeholder="Bancolombia"
                      required
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      {editingId ? 'Account Number (locked)' : 'Account Number'}
                    </label>
                    <input
                      type="text"
                      value={formData.accountNumber}
                      onChange={e => setFormData({ ...formData, accountNumber: e.target.value })}
                      placeholder={editingId ? 'Cannot be changed' : '1234567890'}
                      required={!editingId}
                      disabled={!!editingId}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none disabled:opacity-40"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Account Type</label>
                    <select
                      value={formData.accountType}
                      onChange={e =>
                        setFormData({ ...formData, accountType: e.target.value as 'SAVINGS' | 'CHECKING' | 'BUSINESS' })
                      }
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                    >
                      <option value="SAVINGS">Savings</option>
                      <option value="CHECKING">Checking</option>
                      <option value="BUSINESS">Business</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Currency</label>
                    <select
                      value={formData.currency}
                      onChange={e => setFormData({ ...formData, currency: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                    >
                      <option value="COP">COP</option>
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="USDC">USDC</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Holder Name <span className="text-gray-500">(optional)</span>
                    </label>
                    <input
                      type="text"
                      value={formData.holderName}
                      onChange={e => setFormData({ ...formData, holderName: e.target.value })}
                      placeholder="Account holder"
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="submit" disabled={submitting} className="btn-primary flex-1">
                    {submitting ? 'Saving…' : editingId ? 'Update Account' : 'Add Account'}
                  </button>
                  <button type="button" onClick={resetForm} className="btn-secondary flex-1">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* List */}
          {loading ? (
            <div className="card p-8 text-center text-gray-400">Loading accounts…</div>
          ) : accounts.length === 0 && !showForm ? (
            <div className="card p-12 text-center">
              <BuildingLibraryIcon className="w-12 h-12 mx-auto mb-4 text-gray-500" />
              <p className="text-gray-400 mb-4">No bank accounts linked yet</p>
              <button onClick={() => setShowForm(true)} className="btn-secondary">
                Link Your First Account
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {accounts.map(account => (
                <div
                  key={account.id}
                  className={`card p-6 ${account.isDefault ? 'ring-2 ring-blue-500/60' : ''}`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center flex-shrink-0">
                        <BuildingLibraryIcon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-white">{account.accountName}</p>
                        {account.isDefault && (
                          <span className="text-xs bg-blue-900/40 text-blue-300 border border-blue-700/40 px-2 py-0.5 rounded-full">
                            Default
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleEdit(account)}
                        className="p-2 text-gray-400 hover:text-blue-400 transition-colors"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(account.id)}
                        className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Bank</span>
                      <span className="text-white font-medium">{account.bankName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Account</span>
                      <span className="text-white font-medium">{account.accountNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Type</span>
                      <span className="text-white font-medium capitalize">
                        {account.accountType.charAt(0) + account.accountType.slice(1).toLowerCase()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Currency</span>
                      <span className="text-white font-medium">{account.currency}</span>
                    </div>
                    {account.holderName && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Holder</span>
                        <span className="text-white font-medium">{account.holderName}</span>
                      </div>
                    )}
                  </div>

                  {!account.isDefault && (
                    <button
                      onClick={() => handleSetDefault(account.id)}
                      className="mt-4 w-full flex items-center justify-center gap-1.5 text-sm text-gray-400 hover:text-blue-400 transition-colors"
                    >
                      <StarIcon className="w-4 h-4" />
                      Set as Default
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
