'use client';

import { useAccount } from '@/lib/wagmi/compat';
import { useAuth } from '@/lib/hooks/useAuth';
import { apiFetch, ApiError } from '@/lib/api/client';
import DashboardLayout from '@/components/DashboardLayout';
import { useState, useEffect, useCallback } from 'react';
import {
  UsersIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  ClipboardDocumentIcon,
  XMarkIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';

type ContactType = 'PROVIDER' | 'FRIEND' | 'CLIENT' | 'FAMILY' | 'OTHER';

interface Contact {
  id: string;
  name: string;
  address: string;
  type: ContactType;
  notes: string | null;
}

interface ContactsResponse {
  contacts: Contact[];
  total: number;
}

const TYPE_LABELS: Record<ContactType, string> = {
  PROVIDER: 'Provider',
  FRIEND: 'Friend',
  CLIENT: 'Client',
  FAMILY: 'Family',
  OTHER: 'Other',
};

export default function ContactsPage() {
  const { isConnected } = useAccount();
  const { isAuthenticated, isSigningIn, signIn } = useAuth();

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [newName, setNewName] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newType, setNewType] = useState<ContactType>('OTHER');
  const [newNotes, setNewNotes] = useState('');

  // Send modal state
  const [showSendModal, setShowSendModal] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [sendAmount, setSendAmount] = useState('');
  const [selectedToken, setSelectedToken] = useState<'ETH' | 'USDC' | 'ECOP'>('USDC');

  const loadContacts = useCallback(async (search?: string) => {
    setLoading(true);
    setApiError(null);
    try {
      const qs = search ? `?search=${encodeURIComponent(search)}` : '';
      const data = await apiFetch<ContactsResponse>(`/contacts${qs}`);
      setContacts(data.contacts);
    } catch (err) {
      if (err instanceof ApiError && err.statusCode !== 401) {
        setApiError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadContacts();
    }
  }, [isAuthenticated, loadContacts]);

  // Debounced search
  useEffect(() => {
    if (!isAuthenticated) return;
    const timer = setTimeout(() => loadContacts(searchTerm || undefined), 300);
    return () => clearTimeout(timer);
  }, [searchTerm, isAuthenticated, loadContacts]);

  const handleAddContact = async () => {
    if (!newName.trim() || !newAddress.trim()) return;
    setSubmitting(true);
    setApiError(null);
    try {
      const created = await apiFetch<Contact>('/contacts', {
        method: 'POST',
        body: JSON.stringify({
          name: newName.trim(),
          address: newAddress.trim().toLowerCase(),
          type: newType,
          notes: newNotes.trim() || undefined,
        }),
      });
      setContacts(prev => [...prev, created]);
      setNewName('');
      setNewAddress('');
      setNewType('OTHER');
      setNewNotes('');
      setShowAddModal(false);
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Failed to add contact');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this contact?')) return;
    try {
      await apiFetch(`/contacts/${id}`, { method: 'DELETE' });
      setContacts(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Failed to delete contact');
    }
  };

  const copyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
  };

  const handleSend = () => {
    if (!selectedContact || !sendAmount) return;
    alert(`Sending ${sendAmount} ${selectedToken} to ${selectedContact.name} (${selectedContact.address})`);
    setShowSendModal(false);
    setSendAmount('');
  };

  if (!isConnected) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full min-h-[80vh]">
          <div className="text-center p-8">
            <UsersIcon className="w-16 h-16 mx-auto mb-4 text-gray-500" />
            <h2 className="text-2xl font-bold text-white mb-2">Connect Your Wallet</h2>
            <p className="text-gray-400">Connect your wallet to manage contacts</p>
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
            <UsersIcon className="w-16 h-16 mx-auto mb-4 text-gray-500" />
            <h2 className="text-2xl font-bold text-white mb-2">Sign In Required</h2>
            <p className="text-gray-400 mb-6">Sign in to manage your contacts</p>
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
              <h1 className="text-3xl font-bold text-white mb-2">Contacts</h1>
              <p className="text-gray-400">Manage your address book for quick transfers</p>
            </div>
            <button onClick={() => setShowAddModal(true)} className="btn-primary flex items-center gap-2">
              <PlusIcon className="w-5 h-5" />
              Add Contact
            </button>
          </div>

          {/* Error */}
          {apiError && (
            <div className="card bg-red-900/20 border-red-700/50 text-red-400 text-sm p-4">
              {apiError}
            </div>
          )}

          {/* Search */}
          <div className="relative">
            <MagnifyingGlassIcon className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or address…"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Contacts List */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-white">
              {contacts.length} Contact{contacts.length !== 1 ? 's' : ''}
            </h2>

            {loading ? (
              <div className="card p-8 text-center text-gray-400">Loading contacts…</div>
            ) : contacts.length === 0 ? (
              <div className="card p-8 text-center">
                <UsersIcon className="w-12 h-12 mx-auto mb-4 text-gray-500" />
                <p className="text-gray-400 mb-4">
                  {searchTerm ? 'No contacts found' : 'No contacts yet'}
                </p>
                {!searchTerm && (
                  <button onClick={() => setShowAddModal(true)} className="btn-secondary">
                    Add Your First Contact
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {contacts.map(contact => (
                  <div
                    key={contact.id}
                    className="card p-4 flex items-center justify-between hover:border-purple-500/30 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                        {contact.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-white">{contact.name}</p>
                          <span className="px-2 py-0.5 text-xs rounded-full bg-gray-700 text-gray-300">
                            {TYPE_LABELS[contact.type]}
                          </span>
                        </div>
                        <p className="text-sm text-gray-400 font-mono">
                          {contact.address.slice(0, 10)}…{contact.address.slice(-8)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => copyAddress(contact.address)}
                        className="p-2 rounded-lg hover:bg-gray-700 transition-colors"
                        title="Copy address"
                      >
                        <ClipboardDocumentIcon className="w-5 h-5 text-gray-400" />
                      </button>
                      <button
                        onClick={() => { setSelectedContact(contact); setShowSendModal(true); }}
                        className="btn-secondary text-sm py-1.5 px-3"
                      >
                        Send
                      </button>
                      <button
                        onClick={() => handleDelete(contact.id)}
                        className="p-2 rounded-lg hover:bg-gray-700 transition-colors text-gray-400 hover:text-red-400"
                        title="Delete"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Contact Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Add New Contact</h2>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-white">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            {apiError && (
              <div className="mb-4 text-red-400 text-sm">{apiError}</div>
            )}
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Name</label>
                <input
                  type="text"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="Contact name"
                  className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Wallet Address</label>
                <input
                  type="text"
                  value={newAddress}
                  onChange={e => setNewAddress(e.target.value)}
                  placeholder="0x…"
                  className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Type</label>
                <select
                  value={newType}
                  onChange={e => setNewType(e.target.value as ContactType)}
                  className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                >
                  {(Object.keys(TYPE_LABELS) as ContactType[]).map(t => (
                    <option key={t} value={t}>{TYPE_LABELS[t]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-2 block">
                  Notes <span className="text-gray-500">(optional)</span>
                </label>
                <input
                  type="text"
                  value={newNotes}
                  onChange={e => setNewNotes(e.target.value)}
                  placeholder="Add a note…"
                  className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
                />
              </div>
              <button
                onClick={handleAddContact}
                disabled={submitting || !newName.trim() || !newAddress.trim()}
                className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Adding…' : 'Add Contact'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Send Modal */}
      {showSendModal && selectedContact && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Send to {selectedContact.name}</h2>
              <button onClick={() => setShowSendModal(false)} className="text-gray-400 hover:text-white">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="p-4 bg-gray-800/50 rounded-lg">
                <p className="text-sm text-gray-400 mb-1">Sending to</p>
                <p className="font-medium text-white">{selectedContact.name}</p>
                <p className="text-sm text-gray-400 font-mono">
                  {selectedContact.address.slice(0, 10)}…{selectedContact.address.slice(-8)}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Select Token</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['ETH', 'USDC', 'ECOP'] as const).map(token => (
                    <button
                      key={token}
                      onClick={() => setSelectedToken(token)}
                      className={`p-3 rounded-lg border-2 transition-colors ${
                        selectedToken === token
                          ? 'border-purple-500 bg-purple-900/30'
                          : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                      }`}
                    >
                      <p className="font-medium text-white">{token}</p>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Amount</label>
                <input
                  type="number"
                  value={sendAmount}
                  onChange={e => setSendAmount(e.target.value)}
                  placeholder="0.00"
                  step="0.000001"
                  className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
                />
              </div>
              <button
                onClick={handleSend}
                disabled={!sendAmount}
                className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Send {selectedToken}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
