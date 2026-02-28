'use client';

import { useAccount, useChainId } from '@/lib/wagmi/compat';
import DashboardLayout from '@/components/DashboardLayout';
import { useNFTBalance } from '@/lib/hooks/useNFTBalance';
import { getAddressExplorerLink } from '@/lib/contracts/addresses';
import Image from 'next/image';
import {
  WalletIcon,
  ArrowTopRightOnSquareIcon,
  CheckBadgeIcon,
  ClipboardDocumentIcon,
  CheckIcon,
  UserIcon,
  DevicePhoneMobileIcon,
  EnvelopeIcon,
} from '@heroicons/react/24/outline';
import { useState, useEffect } from 'react';

const STORAGE_KEY = 'convexo_profile_contact';

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

export default function ProfilePage() {
  const { isConnected, address } = useAccount();
  const chainId = useChainId();
  const { hasPassportNFT, hasLPIndividualsNFT, hasLPBusinessNFT, hasEcreditscoringNFT, hasActivePassport, userTier } = useNFTBalance();
  const [copied, setCopied] = useState(false);
  const [contact, setContact] = useState<ContactInfo>(defaultContact);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<ContactInfo>(defaultContact);

  // Load saved contact info
  useEffect(() => {
    if (!address) return;
    const key = `${STORAGE_KEY}_${address}`;
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        setContact(parsed);
        setDraft(parsed);
      }
    } catch {}
  }, [address]);

  const saveContact = () => {
    if (!address) return;
    const key = `${STORAGE_KEY}_${address}`;
    localStorage.setItem(key, JSON.stringify(draft));
    setContact(draft);
    setEditing(false);
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
                  <button onClick={saveContact} className="text-sm text-emerald-400 hover:text-emerald-300 font-medium transition-colors">Save</button>
                </div>
              )}
            </div>

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
