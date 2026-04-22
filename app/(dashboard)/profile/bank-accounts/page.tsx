'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAccount } from '@/lib/wagmi/compat';
import { useAuth } from '@/lib/hooks/useAuth';
import { apiFetch, ApiError } from '@/lib/api/client';
import {
  BuildingLibraryIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  StarIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

// ─── Types ──────────────────────────────────────────────────────────────────

interface BankAccount {
  id: string;
  accountName: string;
  bankName: string;
  accountNumber: string;
  accountType: 'SAVINGS' | 'CHECKING' | 'BUSINESS';
  currency: string;
  holderName: string | null;
  isDefault: boolean;
  isVerified: boolean;
  // extended fields (may be absent on older records)
  bankCountry?: string | null;
  swiftCode?: string | null;
  routingNumber?: string | null;
  iban?: string | null;
  bankAddress?: string | null;
  bankCity?: string | null;
  bankState?: string | null;
  documentType?: string | null;
  documentNumber?: string | null;
}

type BankRegion = 'CO' | 'US' | 'EU' | 'OTHER';

// ─── Config ──────────────────────────────────────────────────────────────────

const COUNTRY_OPTIONS: { code: string; name: string; currency: string; region: BankRegion }[] = [
  { code: 'CO', name: 'Colombia',         currency: 'COP', region: 'CO'    },
  { code: 'US', name: 'United States',    currency: 'USD', region: 'US'    },
  { code: 'DE', name: 'Germany',          currency: 'EUR', region: 'EU'    },
  { code: 'FR', name: 'France',           currency: 'EUR', region: 'EU'    },
  { code: 'ES', name: 'Spain',            currency: 'EUR', region: 'EU'    },
  { code: 'IT', name: 'Italy',            currency: 'EUR', region: 'EU'    },
  { code: 'NL', name: 'Netherlands',      currency: 'EUR', region: 'EU'    },
  { code: 'PT', name: 'Portugal',         currency: 'EUR', region: 'EU'    },
  { code: 'AT', name: 'Austria',          currency: 'EUR', region: 'EU'    },
  { code: 'BE', name: 'Belgium',          currency: 'EUR', region: 'EU'    },
  { code: 'FI', name: 'Finland',          currency: 'EUR', region: 'EU'    },
  { code: 'IE', name: 'Ireland',          currency: 'EUR', region: 'EU'    },
  { code: 'GB', name: 'United Kingdom',   currency: 'GBP', region: 'OTHER' },
  { code: 'PA', name: 'Panama',           currency: 'USD', region: 'OTHER' },
  { code: 'MX', name: 'Mexico',           currency: 'MXN', region: 'OTHER' },
  { code: 'BR', name: 'Brazil',           currency: 'BRL', region: 'OTHER' },
  { code: 'AR', name: 'Argentina',        currency: 'ARS', region: 'OTHER' },
  { code: 'OTHER', name: 'Other country', currency: 'USD', region: 'OTHER' },
];

const DOC_TYPES: Record<BankRegion, string[]> = {
  CO:    ['CC – Cédula de Ciudadanía', 'NIT', 'CE – Cédula de Extranjería', 'Pasaporte'],
  US:    ['SSN – Social Security Number', 'EIN – Employer ID Number', 'ITIN', 'Passport'],
  EU:    ['National ID', 'Passport', 'Tax ID (NIF/VAT/USt-IdNr)'],
  OTHER: ['Passport', 'National ID', 'Tax ID'],
};

const ACCOUNT_TYPE_OPTIONS: Record<BankRegion, { value: 'SAVINGS' | 'CHECKING' | 'BUSINESS'; label: string }[]> = {
  CO:    [
    { value: 'SAVINGS',  label: 'Ahorros (Savings)'     },
    { value: 'CHECKING', label: 'Corriente (Checking)'  },
    { value: 'BUSINESS', label: 'Empresarial (Business)' },
  ],
  US:    [
    { value: 'CHECKING', label: 'Checking'  },
    { value: 'SAVINGS',  label: 'Savings'   },
    { value: 'BUSINESS', label: 'Business'  },
  ],
  EU:    [
    { value: 'CHECKING', label: 'Current Account'  },
    { value: 'SAVINGS',  label: 'Savings Account'  },
    { value: 'BUSINESS', label: 'Business Account' },
  ],
  OTHER: [
    { value: 'CHECKING', label: 'Checking'  },
    { value: 'SAVINGS',  label: 'Savings'   },
    { value: 'BUSINESS', label: 'Business'  },
  ],
};

// ─── Form state ──────────────────────────────────────────────────────────────

interface FormData {
  accountName: string;
  // Step 1 — location
  bankCountry: string;
  currency: string;
  // Step 2 — holder
  holderName: string;
  documentType: string;
  documentNumber: string;
  // Step 3 — bank
  bankName: string;
  accountType: 'SAVINGS' | 'CHECKING' | 'BUSINESS';
  accountNumber: string;   // CO / US / OTHER
  iban: string;            // EU
  routingNumber: string;   // US ABA
  swiftCode: string;
  // Step 4 — address
  bankAddress: string;
  bankCity: string;
  bankState: string;       // US only
}

const emptyForm: FormData = {
  accountName: '',
  bankCountry: '',
  currency: '',
  holderName: '',
  documentType: '',
  documentNumber: '',
  bankName: '',
  accountType: 'SAVINGS',
  accountNumber: '',
  iban: '',
  routingNumber: '',
  swiftCode: '',
  bankAddress: '',
  bankCity: '',
  bankState: '',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getRegion(countryCode: string): BankRegion {
  const opt = COUNTRY_OPTIONS.find(c => c.code === countryCode);
  return opt?.region ?? 'OTHER';
}

function countryName(code: string): string {
  return COUNTRY_OPTIONS.find(c => c.code === code)?.name ?? code;
}

function Req() {
  return <span className="text-red-400 ml-0.5">*</span>;
}

function Field({ label, required, hint, children }: {
  label: string; required?: boolean; hint?: string; children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-1.5">
        {label}{required && <Req />}
        {hint && <span className="ml-2 text-xs font-normal text-gray-500">{hint}</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls =
  'w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none disabled:opacity-40';

// ─── Main component ───────────────────────────────────────────────────────────

export default function BankAccountsPage() {
  const { isConnected } = useAccount();
  const { isAuthenticated, isSigningIn, signIn } = useAuth();

  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);

  const region = getRegion(form.bankCountry);

  // Auto-fill currency when country changes
  const handleCountryChange = (code: string) => {
    const opt = COUNTRY_OPTIONS.find(c => c.code === code);
    setForm(f => ({
      ...f,
      bankCountry: code,
      currency: opt?.currency ?? f.currency,
      documentType: '',
      accountType: ACCOUNT_TYPE_OPTIONS[opt?.region ?? 'OTHER'][0].value,
    }));
  };

  const set = (key: keyof FormData, value: string) =>
    setForm(f => ({ ...f, [key]: value }));

  const loadAccounts = useCallback(async () => {
    setLoading(true);
    setApiError(null);
    try {
      const data = await apiFetch<{ items: BankAccount[]; total: number }>('/bank-accounts');
      setAccounts(data.items);
    } catch (err) {
      if (err instanceof ApiError && err.statusCode !== 401) setApiError(err.message);
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
    const rgn = getRegion(form.bankCountry);
    const payload = {
      accountName:    form.accountName,
      bankName:       form.bankName,
      accountNumber:  rgn === 'EU' ? form.iban : form.accountNumber,
      accountType:    form.accountType,
      currency:       form.currency,
      holderName:     form.holderName,
      bankCountry:    form.bankCountry,
      swiftCode:      form.swiftCode || undefined,
      routingNumber:  rgn === 'US' ? form.routingNumber || undefined : undefined,
      iban:           rgn === 'EU' ? form.iban || undefined : undefined,
      bankAddress:    form.bankAddress || undefined,
      bankCity:       form.bankCity || undefined,
      bankState:      rgn === 'US' ? form.bankState || undefined : undefined,
      documentType:   form.documentType || undefined,
      documentNumber: form.documentNumber || undefined,
    };
    try {
      if (editingId) {
        const updated = await apiFetch<BankAccount>(`/bank-accounts/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        setAccounts(prev => prev.map(a => (a.id === editingId ? updated : a)));
      } else {
        const created = await apiFetch<BankAccount>('/bank-accounts', {
          method: 'POST',
          body: JSON.stringify(payload),
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
    const rgn = getRegion(account.bankCountry ?? '');
    setEditingId(account.id);
    setForm({
      accountName:    account.accountName,
      bankCountry:    account.bankCountry ?? '',
      currency:       account.currency,
      holderName:     account.holderName ?? '',
      documentType:   account.documentType ?? '',
      documentNumber: account.documentNumber ?? '',
      bankName:       account.bankName,
      accountType:    account.accountType,
      accountNumber:  rgn === 'EU' ? '' : '',    // not shown for security
      iban:           account.iban ?? '',
      routingNumber:  account.routingNumber ?? '',
      swiftCode:      account.swiftCode ?? '',
      bankAddress:    account.bankAddress ?? '',
      bankCity:       account.bankCity ?? '',
      bankState:      account.bankState ?? '',
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
    setForm(emptyForm);
  };

  // ─── Auth guards ────────────────────────────────────────────────────────────

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center h-full min-h-[80vh]">
        <div className="text-center p-8">
          <BuildingLibraryIcon className="w-16 h-16 mx-auto mb-4 text-gray-500" />
          <h2 className="text-2xl font-bold text-white mb-2">Connect Your Wallet</h2>
          <p className="text-gray-400">Connect your wallet to manage bank accounts</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
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
    );
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="p-8">
      <div className="max-w-5xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">Bank Accounts</h1>
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

        {/* ── Form ─────────────────────────────────────────────────────────── */}
        {showForm && (
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">
                {editingId ? 'Edit Account' : 'Add New Bank Account'}
              </h2>
              <button onClick={resetForm} className="p-1.5 text-gray-400 hover:text-white transition-colors">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">

              {/* Account nickname */}
              <Field label="Account Label" required hint="A friendly name to identify this account">
                <input
                  type="text"
                  value={form.accountName}
                  onChange={e => set('accountName', e.target.value)}
                  placeholder="e.g. My Bancolombia Savings"
                  required
                  className={inputCls}
                />
              </Field>

              {/* ── Section 1: Bank location ──────────────────────────────── */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
                  1 — Bank Location
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Country of Bank" required>
                    <select
                      value={form.bankCountry}
                      onChange={e => handleCountryChange(e.target.value)}
                      required
                      className={inputCls}
                    >
                      <option value="">Select country…</option>
                      {COUNTRY_OPTIONS.map(c => (
                        <option key={c.code} value={c.code}>{c.name}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Account Currency" required>
                    <select
                      value={form.currency}
                      onChange={e => set('currency', e.target.value)}
                      required
                      className={inputCls}
                    >
                      {['COP', 'USD', 'EUR', 'GBP', 'MXN', 'BRL', 'ARS'].map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </Field>
                </div>
              </div>

              {/* ── Section 2: Holder identity (shown once country chosen) ── */}
              {form.bankCountry && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
                    2 — Account Holder
                  </p>
                  <div className="space-y-4">
                    <Field label="Full Name of Account Holder" required>
                      <input
                        type="text"
                        value={form.holderName}
                        onChange={e => set('holderName', e.target.value)}
                        placeholder="As it appears on the bank account"
                        required
                        className={inputCls}
                      />
                    </Field>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Field label="Document Type" required>
                        <select
                          value={form.documentType}
                          onChange={e => set('documentType', e.target.value)}
                          required
                          className={inputCls}
                        >
                          <option value="">Select type…</option>
                          {DOC_TYPES[region].map(d => (
                            <option key={d} value={d}>{d}</option>
                          ))}
                        </select>
                      </Field>
                      <Field label="Document Number" required>
                        <input
                          type="text"
                          value={form.documentNumber}
                          onChange={e => set('documentNumber', e.target.value)}
                          placeholder="Document ID number"
                          required
                          className={inputCls}
                        />
                      </Field>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Section 3: Bank details (region-specific) ─────────────── */}
              {form.bankCountry && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
                    3 — Bank Details
                  </p>
                  <div className="space-y-4">

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Field label="Bank Name" required>
                        <input
                          type="text"
                          value={form.bankName}
                          onChange={e => set('bankName', e.target.value)}
                          placeholder={
                            region === 'CO' ? 'e.g. Bancolombia, Davivienda' :
                            region === 'US' ? 'e.g. Chase, Bank of America' :
                            'Bank name'
                          }
                          required
                          className={inputCls}
                        />
                      </Field>
                      <Field label="Account Type" required>
                        <select
                          value={form.accountType}
                          onChange={e => set('accountType', e.target.value as 'SAVINGS' | 'CHECKING' | 'BUSINESS')}
                          className={inputCls}
                        >
                          {ACCOUNT_TYPE_OPTIONS[region].map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </Field>
                    </div>

                    {/* Colombia + USA + OTHER: account number */}
                    {region !== 'EU' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Field
                          label="Account Number"
                          required={!editingId}
                          hint={editingId ? '(locked after creation)' : undefined}
                        >
                          <input
                            type="text"
                            value={form.accountNumber}
                            onChange={e => set('accountNumber', e.target.value)}
                            placeholder={editingId ? 'Cannot be changed' : ''}
                            required={!editingId}
                            disabled={!!editingId}
                            className={inputCls}
                          />
                        </Field>
                        {/* USA: routing number */}
                        {region === 'US' && (
                          <Field label="ABA Routing Number" required>
                            <input
                              type="text"
                              value={form.routingNumber}
                              onChange={e => set('routingNumber', e.target.value)}
                              placeholder="9-digit routing number"
                              required
                              className={inputCls}
                            />
                          </Field>
                        )}
                      </div>
                    )}

                    {/* EU: IBAN */}
                    {region === 'EU' && (
                      <Field label="IBAN" required={!editingId} hint={editingId ? '(locked after creation)' : undefined}>
                        <input
                          type="text"
                          value={form.iban}
                          onChange={e => set('iban', e.target.value.toUpperCase())}
                          placeholder="e.g. DE89 3704 0044 0532 0130 00"
                          required={!editingId}
                          disabled={!!editingId}
                          className={`${inputCls} font-mono tracking-wider`}
                        />
                      </Field>
                    )}

                    {/* SWIFT/BIC — required for US/EU, optional for CO */}
                    <Field
                      label="SWIFT / BIC Code"
                      required={region !== 'CO'}
                      hint={region === 'CO' ? '(optional for domestic transfers)' : undefined}
                    >
                      <input
                        type="text"
                        value={form.swiftCode}
                        onChange={e => set('swiftCode', e.target.value.toUpperCase())}
                        placeholder="e.g. COLBCOBBXXX"
                        required={region !== 'CO'}
                        className={`${inputCls} font-mono uppercase tracking-wider`}
                      />
                    </Field>

                  </div>
                </div>
              )}

              {/* ── Section 4: Bank address ───────────────────────────────── */}
              {form.bankCountry && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
                    4 — Bank Address
                  </p>
                  <div className="space-y-4">
                    <Field label="Bank Street Address" required>
                      <input
                        type="text"
                        value={form.bankAddress}
                        onChange={e => set('bankAddress', e.target.value)}
                        placeholder="Street address of the bank branch"
                        required
                        className={inputCls}
                      />
                    </Field>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Field label="City" required>
                        <input
                          type="text"
                          value={form.bankCity}
                          onChange={e => set('bankCity', e.target.value)}
                          placeholder="City"
                          required
                          className={inputCls}
                        />
                      </Field>
                      {region === 'US' ? (
                        <Field label="State" required>
                          <input
                            type="text"
                            value={form.bankState}
                            onChange={e => set('bankState', e.target.value)}
                            placeholder="e.g. New York"
                            required
                            className={inputCls}
                          />
                        </Field>
                      ) : (
                        <Field label="Country">
                          <input
                            type="text"
                            value={countryName(form.bankCountry)}
                            readOnly
                            className={`${inputCls} opacity-60`}
                          />
                        </Field>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-3 pt-2 border-t border-gray-700">
                <button type="submit" disabled={submitting || !form.bankCountry} className="btn-primary flex-1">
                  {submitting ? 'Saving…' : editingId ? 'Update Account' : 'Add Account'}
                </button>
                <button type="button" onClick={resetForm} className="btn-secondary">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── Table ─────────────────────────────────────────────────────────── */}
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
        ) : accounts.length > 0 ? (
          <div className="card overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-700/60 bg-gray-800/40">
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">Account</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">Bank</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">Country</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">Currency</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">Number / IBAN</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">SWIFT</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">Holder</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">Status</th>
                    <th className="px-5 py-3.5" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/60">
                  {accounts.map(acc => (
                    <tr key={acc.id} className="hover:bg-gray-800/30 transition-colors">
                      <td className="px-5 py-4 whitespace-nowrap">
                        <p className="font-medium text-white">{acc.accountName}</p>
                        <p className="text-xs text-gray-500 capitalize">
                          {acc.accountType.charAt(0) + acc.accountType.slice(1).toLowerCase()}
                        </p>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-gray-300">{acc.bankName}</td>
                      <td className="px-5 py-4 whitespace-nowrap text-gray-400">
                        {acc.bankCountry ? countryName(acc.bankCountry) : '—'}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="inline-block px-2 py-0.5 rounded-full bg-gray-700 text-gray-200 text-xs font-medium">
                          {acc.currency}
                        </span>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap font-mono text-gray-300 text-xs">
                        {acc.iban || acc.accountNumber || '—'}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap font-mono text-gray-400 text-xs">
                        {acc.swiftCode || '—'}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-gray-300">
                        {acc.holderName || '—'}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        {acc.isDefault ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-900/40 text-blue-300 border border-blue-700/40 text-xs">
                            <StarIcon className="w-3 h-3" />
                            Default
                          </span>
                        ) : acc.isVerified ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-900/30 text-emerald-400 border border-emerald-700/30 text-xs">
                            Verified
                          </span>
                        ) : (
                          <span className="text-xs text-gray-500">—</span>
                        )}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1 justify-end">
                          {!acc.isDefault && (
                            <button
                              onClick={() => handleSetDefault(acc.id)}
                              title="Set as default"
                              className="p-1.5 text-gray-500 hover:text-blue-400 transition-colors"
                            >
                              <StarIcon className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleEdit(acc)}
                            title="Edit"
                            className="p-1.5 text-gray-500 hover:text-white transition-colors"
                          >
                            <PencilIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(acc.id)}
                            title="Delete"
                            className="p-1.5 text-gray-500 hover:text-red-400 transition-colors"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}

      </div>
    </div>
  );
}
