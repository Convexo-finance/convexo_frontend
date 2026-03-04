'use client';

import { useAccount, useChainId } from '@/lib/wagmi/compat';
import DashboardLayout from '@/components/DashboardLayout';
import { useNFTBalance } from '@/lib/hooks/useNFTBalance';
import { getAddressExplorerLink } from '@/lib/contracts/addresses';
import Image from 'next/image';
import { apiFetch, getToken } from '@/lib/api/client';
import {
  WalletIcon,
  ArrowTopRightOnSquareIcon,
  CheckBadgeIcon,
  ClipboardDocumentIcon,
  CheckIcon,
  UserIcon,
  DevicePhoneMobileIcon,
  EnvelopeIcon,
  KeyIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import { useState, useEffect, useCallback } from 'react';
import { useAddPasskey, useAuthenticate, useSignerStatus } from '@account-kit/react';

interface ContactInfo {
  displayName: string;
  email: string;
  phone: string;
  telegram: string;
  twitter: string;
  linkedin: string;
}

const defaultContact: ContactInfo = {
  displayName: '',
  email: '',
  phone: '',
  telegram: '',
  twitter: '',
  linkedin: '',
};

function TwitterIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Sign-in Methods card                                                 */
/* ------------------------------------------------------------------ */
function SignInMethodsCard() {
  const { status } = useSignerStatus();
  const { addPasskey, isAddingPasskey } = useAddPasskey();
  const { authenticate, isPending: isAuthPending } = useAuthenticate();

  // Email-link flow state
  const [showEmailInput, setShowEmailInput] = useState(false);
  const [emailValue, setEmailValue] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [emailError, setEmailError] = useState('');

  // Passkey state
  const [passkeySuccess, setPasskeySuccess] = useState(false);
  const [passkeyError, setPasskeyError] = useState('');
  const prevAddingRef = useState<boolean>(false);

  // Detect when addPasskey finishes (isAddingPasskey: true → false)
  useEffect(() => {
    if (prevAddingRef[0] && !isAddingPasskey && !passkeyError) {
      setPasskeySuccess(true);
    }
    prevAddingRef[0] = isAddingPasskey;
  }, [isAddingPasskey, passkeyError]);

  const handleAddPasskey = useCallback(() => {
    setPasskeyError('');
    setPasskeySuccess(false);
    (async () => {
      try {
        await (addPasskey() as unknown as Promise<void>);
      } catch (e) {
        setPasskeyError((e as Error)?.message ?? 'Could not add passkey');
      }
    })();
  }, [addPasskey]);

  const handleLinkEmail = useCallback(() => {
    const trimmed = emailValue.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setEmailError('Enter a valid email address');
      return;
    }
    setEmailError('');
    authenticate(
      { type: 'email', email: trimmed },
      {
        onSuccess: () => { setEmailSent(true); setShowEmailInput(false); },
        onError: (e) => setEmailError(e.message ?? 'Could not send code'),
      },
    );
  }, [emailValue, authenticate]);

  const isConnected = status === 'CONNECTED';

  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-5">
        <ShieldCheckIcon className="w-5 h-5 text-purple-400" />
        <h2 className="text-lg font-semibold text-white">Sign-in Methods</h2>
      </div>

      <div className="space-y-3">
        {/* ── Passkey ── */}
        <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-xl border border-gray-700/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gray-700 flex items-center justify-center">
              <KeyIcon className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">Passkey</p>
              <p className="text-xs text-gray-500">Biometric or device PIN — no password needed</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            {passkeySuccess ? (
              <span className="text-xs text-emerald-400 flex items-center gap-1">
                <CheckIcon className="w-3.5 h-3.5" /> Added!
              </span>
            ) : (
              <button
                onClick={handleAddPasskey}
                disabled={isAddingPasskey || !isConnected}
                className="text-xs px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium transition-colors"
              >
                {isAddingPasskey ? 'Adding…' : 'Add Passkey'}
              </button>
            )}
            {passkeyError && <p className="text-xs text-red-400 max-w-[180px] text-right">{passkeyError}</p>}
          </div>
        </div>

        {/* ── Email OTP ── */}
        <div className="p-4 bg-gray-800/50 rounded-xl border border-gray-700/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gray-700 flex items-center justify-center">
                <EnvelopeIcon className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">Email</p>
                <p className="text-xs text-gray-500">Sign in with a one-time code</p>
              </div>
            </div>
            {!showEmailInput && !emailSent && (
              <button
                onClick={() => setShowEmailInput(true)}
                disabled={!isConnected}
                className="text-xs px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium transition-colors"
              >
                Link Email
              </button>
            )}
            {emailSent && (
              <span className="text-xs text-emerald-400 flex items-center gap-1">
                <CheckIcon className="w-3.5 h-3.5" /> Linked!
              </span>
            )}
          </div>

          {showEmailInput && (
            <div className="mt-3 flex gap-2">
              <div className="relative flex-1">
                <EnvelopeIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="email"
                  value={emailValue}
                  onChange={(e) => setEmailValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLinkEmail()}
                  placeholder="your@email.com"
                  className="w-full pl-9 pr-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 text-sm focus:border-blue-500 focus:outline-none"
                  autoFocus
                />
              </div>
              <button
                onClick={handleLinkEmail}
                disabled={isAuthPending}
                className="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-medium transition-colors"
              >
                {isAuthPending ? '…' : 'Send'}
              </button>
              <button
                onClick={() => { setShowEmailInput(false); setEmailError(''); }}
                className="px-3 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
          {emailError && <p className="mt-2 text-xs text-red-400">{emailError}</p>}
        </div>

        {/* ── Google ── */}
        <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-xl border border-gray-700/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gray-700 flex items-center justify-center">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-white">Google</p>
              <p className="text-xs text-gray-500">Sign in with your Google account</p>
            </div>
          </div>
          <button
            onClick={() =>
              authenticate({ type: 'oauth', authProviderId: 'google', mode: 'popup' })
            }
            disabled={isAuthPending || !isConnected}
            className="text-xs px-3 py-1.5 rounded-lg bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium transition-colors border border-gray-600"
          >
            {isAuthPending ? 'Connecting…' : 'Link Google'}
          </button>
        </div>
      </div>

      <p className="mt-4 text-xs text-gray-600">Adding a method lets you sign in multiple ways. Your wallet address stays the same.</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */

export default function ProfilePage() {
  const { isConnected, address, isReconnecting } = useAccount();
  const chainId = useChainId();
  const { hasPassportNFT, hasLPIndividualsNFT, hasLPBusinessNFT, hasEcreditscoringNFT, hasActivePassport, userTier } = useNFTBalance();
  const [copied, setCopied] = useState(false);
  const [contact, setContact] = useState<ContactInfo>(defaultContact);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<ContactInfo>(defaultContact);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Load profile from backend
  // Uses JWT (getToken) rather than requiring an address so the profile renders
  // correctly when the Account Kit signer session is expired but the JWT is valid.
  useEffect(() => {
    if (!getToken()) return;
    (async () => {
      try {
        const data = await apiFetch<Record<string, unknown>>('/profile');
        const info: ContactInfo = {
          displayName: (data.displayName as string) || '',
          email: (data.email as string) || '',
          phone: (data.phone as string) || '',
          telegram: (data.telegram as string) || '',
          twitter: (data.twitter as string) || '',
          linkedin: (data.linkedin as string) || '',
        };
        setContact(info);
        setDraft(info);
      } catch {
        // Profile may not exist yet — silently fallback to defaults
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address]);

  const saveContact = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      await apiFetch('/profile', {
        method: 'PUT',
        body: JSON.stringify({
          displayName: draft.displayName || undefined,
          email: draft.email || undefined,
          phone: draft.phone || undefined,
          telegram: draft.telegram || undefined,
          twitter: draft.twitter || undefined,
          linkedin: draft.linkedin || undefined,
        }),
      });
      setContact(draft);
      setEditing(false);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const cancelEdit = () => {
    setDraft(contact);
    setEditing(false);
  };

  const tierConfig = {
    0: { label: 'Unverified', color: 'text-gray-400', bg: 'bg-gray-800', border: 'border-gray-700' },
    1: { label: 'Individual Investor', color: 'text-emerald-400', bg: 'bg-emerald-900/20', border: 'border-emerald-700/50' },
    2: { label: 'Limited Partner', color: 'text-blue-400', bg: 'bg-blue-900/20', border: 'border-blue-700/50' },
    3: { label: 'Vault Creator', color: 'text-purple-400', bg: 'bg-purple-900/20', border: 'border-purple-700/50' },
  };
  const tier = tierConfig[userTier as keyof typeof tierConfig];

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isReconnecting) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full min-h-[80vh]">
          <div className="w-7 h-7 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (!isConnected) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full min-h-[80vh]">
          <div className="text-center p-8">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gray-800 flex items-center justify-center">
              <WalletIcon className="w-8 h-8 text-gray-500" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Connect Your Wallet</h2>
            <p className="text-gray-400">Connect your wallet to view your profile</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="max-w-5xl mx-auto space-y-8">

          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Profile</h1>
            <p className="text-gray-400">Manage your account and view your status</p>
          </div>

          {/* Identity Card */}
          <div className="card">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-white text-2xl font-bold">
                  {contact.displayName ? contact.displayName.slice(0, 2).toUpperCase() : address?.slice(2, 4).toUpperCase()}
                </div>
                <div>
                  {contact.displayName && (
                    <p className="text-white font-semibold text-lg mb-0.5">{contact.displayName}</p>
                  )}
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-gray-300 font-mono">
                      {address?.slice(0, 6)}...{address?.slice(-4)}
                    </span>
                    <button onClick={copyAddress} className="p-1 rounded hover:bg-gray-700 transition-colors" title="Copy address">
                      {copied
                        ? <CheckIcon className="w-4 h-4 text-emerald-400" />
                        : <ClipboardDocumentIcon className="w-4 h-4 text-gray-400" />
                      }
                    </button>
                    {copied && <span className="text-xs text-emerald-400">Copied!</span>}
                    <a href={getAddressExplorerLink(chainId, address!)} target="_blank" rel="noopener noreferrer" className="p-1 rounded hover:bg-gray-700 transition-colors">
                      <ArrowTopRightOnSquareIcon className="w-4 h-4 text-gray-400" />
                    </a>
                  </div>
                  <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm ${tier.bg} ${tier.color} border ${tier.border}`}>
                    <span className="w-2 h-2 rounded-full bg-current" />
                    Tier {userTier}: {tier.label}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Contact & Social Media */}
          <div className="card">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-white">Contact & Social</h2>
              {!editing ? (
                <button
                  onClick={() => { setDraft(contact); setEditing(true); }}
                  className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
                >
                  Edit
                </button>
              ) : (
                <div className="flex gap-3">
                  <button onClick={cancelEdit} className="text-sm text-gray-400 hover:text-white transition-colors">Cancel</button>
                  <button onClick={saveContact} disabled={saving} className="text-sm text-emerald-400 hover:text-emerald-300 font-medium transition-colors disabled:opacity-50">
                    {saving ? 'Saving…' : 'Save'}
                  </button>
                </div>
              )}
            </div>

            {saveError && (
              <div className="mb-4 text-sm text-red-400 bg-red-900/20 border border-red-700/30 rounded-lg px-3 py-2">
                {saveError}
              </div>
            )}

            {editing ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1.5">Display Name</label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      type="text"
                      value={draft.displayName}
                      onChange={(e) => setDraft({ ...draft, displayName: e.target.value })}
                      placeholder="Your name"
                      className="w-full pl-9 pr-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-600 focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1.5">Email</label>
                    <div className="relative">
                      <EnvelopeIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <input
                        type="email"
                        value={draft.email}
                        onChange={(e) => setDraft({ ...draft, email: e.target.value })}
                        placeholder="your@email.com"
                        className="w-full pl-9 pr-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-600 focus:border-purple-500 focus:outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1.5">Phone</label>
                    <div className="relative">
                      <DevicePhoneMobileIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <input
                        type="tel"
                        value={draft.phone}
                        onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
                        placeholder="+57 300 000 0000"
                        className="w-full pl-9 pr-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-600 focus:border-purple-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1.5">Telegram Username</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">@</span>
                    <input
                      type="text"
                      value={draft.telegram}
                      onChange={(e) => setDraft({ ...draft, telegram: e.target.value.replace(/^@/, '') })}
                      placeholder="username"
                      className="w-full pl-7 pr-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-600 focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="border-t border-gray-700 pt-4">
                  <p className="text-sm font-medium text-gray-400 mb-3">Social Media</p>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm text-gray-400 mb-1.5">X (Twitter) Username</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2">
                          <TwitterIcon className="w-4 h-4 text-gray-500" />
                        </span>
                        <input
                          type="text"
                          value={draft.twitter}
                          onChange={(e) => setDraft({ ...draft, twitter: e.target.value.replace(/^@/, '') })}
                          placeholder="username"
                          className="w-full pl-9 pr-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-600 focus:border-purple-500 focus:outline-none"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1.5">LinkedIn</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2">
                          <LinkedInIcon className="w-4 h-4 text-gray-500" />
                        </span>
                        <input
                          type="text"
                          value={draft.linkedin}
                          onChange={(e) => setDraft({ ...draft, linkedin: e.target.value })}
                          placeholder="linkedin.com/in/username"
                          className="w-full pl-9 pr-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-600 focus:border-purple-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* View mode */}
                {(contact.displayName || contact.email || contact.phone || contact.telegram) ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {contact.displayName && (
                      <div className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg">
                        <UserIcon className="w-4 h-4 text-gray-500 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-gray-500">Name</p>
                          <p className="text-white text-sm">{contact.displayName}</p>
                        </div>
                      </div>
                    )}
                    {contact.email && (
                      <div className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg">
                        <EnvelopeIcon className="w-4 h-4 text-gray-500 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-gray-500">Email</p>
                          <p className="text-white text-sm">{contact.email}</p>
                        </div>
                      </div>
                    )}
                    {contact.phone && (
                      <div className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg">
                        <DevicePhoneMobileIcon className="w-4 h-4 text-gray-500 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-gray-500">Phone</p>
                          <p className="text-white text-sm">{contact.phone}</p>
                        </div>
                      </div>
                    )}
                    {contact.telegram && (
                      <div className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg">
                        <span className="text-[#229ED9] text-sm flex-shrink-0">✈</span>
                        <div>
                          <p className="text-xs text-gray-500">Telegram</p>
                          <p className="text-white text-sm">@{contact.telegram}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No contact info added yet.</p>
                )}

                {(contact.twitter || contact.linkedin) && (
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-3 mt-2">Social Media</p>
                    <div className="flex flex-wrap gap-3">
                      {contact.twitter && (
                        <a
                          href={`https://x.com/${contact.twitter}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-3 py-2 bg-gray-800/50 hover:bg-gray-800 rounded-lg transition-colors"
                        >
                          <TwitterIcon className="w-4 h-4 text-white" />
                          <span className="text-sm text-gray-300">@{contact.twitter}</span>
                        </a>
                      )}
                      {contact.linkedin && (
                        <a
                          href={contact.linkedin.startsWith('http') ? contact.linkedin : `https://${contact.linkedin}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-3 py-2 bg-gray-800/50 hover:bg-gray-800 rounded-lg transition-colors"
                        >
                          <LinkedInIcon className="w-4 h-4 text-[#0A66C2]" />
                          <span className="text-sm text-gray-300">LinkedIn</span>
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {!contact.twitter && !contact.linkedin && !contact.displayName && !contact.email && !contact.phone && !contact.telegram && (
                  <button
                    onClick={() => setEditing(true)}
                    className="w-full py-3 border border-dashed border-gray-700 rounded-lg text-gray-500 hover:text-gray-400 hover:border-gray-600 transition-colors text-sm"
                  >
                    + Add contact info & social media
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Sign-in Methods */}
          <SignInMethodsCard />

          {/* NFT Holdings */}
          <div className="card">
            <h2 className="text-lg font-semibold text-white mb-4">NFT Holdings</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { name: 'Humanity (ZK Passport)', owned: hasPassportNFT || hasActivePassport, tier: 1, desc: 'Individual investor access', image: '/NFTs/convexo_zkpassport.png' },
                { name: 'LP - Individuals', owned: hasLPIndividualsNFT, tier: 2, desc: 'Individual KYC verified', image: '/NFTs/Convexo_lps.png' },
                { name: 'LP - Business', owned: hasLPBusinessNFT, tier: 2, desc: 'Business KYB verified', image: '/NFTs/Convexo_lps.png' },
                { name: 'Credit Score', owned: hasEcreditscoringNFT, tier: 3, desc: 'Create funding vaults', image: '/NFTs/convexo_vaults.png' },
              ].map((nft) => (
                <div
                  key={nft.name}
                  className={`p-4 rounded-xl border ${nft.owned ? 'bg-emerald-900/10 border-emerald-700/50' : 'bg-gray-800/50 border-gray-700/50'}`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`relative w-14 h-14 rounded-xl overflow-hidden ${nft.owned ? '' : 'opacity-50 grayscale'}`}>
                      <Image src={nft.image} alt={nft.name} fill className="object-cover" />
                      {nft.owned && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                          <CheckBadgeIcon className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className={`font-medium text-sm ${nft.owned ? 'text-white' : 'text-gray-400'}`}>{nft.name}</p>
                      <p className="text-xs text-gray-500">Tier {nft.tier} · {nft.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
}
