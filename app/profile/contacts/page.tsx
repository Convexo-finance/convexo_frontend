'use client';

import { useAccount } from 'wagmi';
import DashboardLayout from '@/components/DashboardLayout';
import { useState, useEffect } from 'react';
import {
  UsersIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  UserCircleIcon,
  ClipboardDocumentIcon,
  XMarkIcon,
  ArrowUpIcon,
  CameraIcon,
} from '@heroicons/react/24/outline';

interface Contact {
  id: number;
  name: string;
  address: `0x${string}`;
  type: 'Provider' | 'Friend' | 'Client' | 'Family' | 'Other';
}

export default function ContactsPage() {
  const { isConnected } = useAccount();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

  // Form states for adding contact
  const [newContactName, setNewContactName] = useState('');
  const [newContactAddress, setNewContactAddress] = useState('');
  const [newContactType, setNewContactType] = useState<Contact['type']>('Friend');

  // Send form states
  const [sendAmount, setSendAmount] = useState('');
  const [selectedToken, setSelectedToken] = useState<'ETH' | 'USDC' | 'ECOP'>('USDC');

  // Load contacts from localStorage
  const [contacts, setContacts] = useState<Contact[]>([]);

  useEffect(() => {
    const storedContacts = localStorage.getItem('convexo_contacts');
    if (storedContacts) {
      setContacts(JSON.parse(storedContacts));
    } else {
      // Initialize with default contacts
      const defaultContacts: Contact[] = [
        {
          id: 1,
          name: 'Treasury Account',
          address: '0x742d35Cc6634C0532925a3b844Bc9e7595f52bE8',
          type: 'Provider',
        },
        {
          id: 2,
          name: 'Business Partner',
          address: '0x8Ba1f109551bD432803012645Hc136E4024Fe235',
          type: 'Client',
        },
        {
          id: 3,
          name: 'Cold Wallet',
          address: '0xdD2FD4581271e230360230F9337D5c0430Bf44C0',
          type: 'Other',
        },
      ];
      setContacts(defaultContacts);
      localStorage.setItem('convexo_contacts', JSON.stringify(defaultContacts));
    }
  }, []);

  const filteredContacts = contacts.filter(
    (contact) =>
      contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const copyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
  };

  const handleAddContact = () => {
    if (!newContactName || !newContactAddress) {
      alert('Please fill in all fields');
      return;
    }

    const newContact: Contact = {
      id: Math.max(0, ...contacts.map(c => c.id)) + 1,
      name: newContactName,
      address: newContactAddress as `0x${string}`,
      type: newContactType,
    };

    const updatedContacts = [...contacts, newContact];
    setContacts(updatedContacts);
    localStorage.setItem('convexo_contacts', JSON.stringify(updatedContacts));

    // Reset form
    setNewContactName('');
    setNewContactAddress('');
    setNewContactType('Friend');
    setShowAddModal(false);
  };

  const handleSendToContact = (contact: Contact) => {
    setSelectedContact(contact);
    setShowSendModal(true);
  };

  const handleSend = () => {
    if (!selectedContact || !sendAmount) {
      alert('Please enter an amount');
      return;
    }

    // TODO: Implement actual send functionality with smart contract
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
            <button
              onClick={() => setShowAddModal(true)}
              className="btn-primary flex items-center gap-2"
            >
              <PlusIcon className="w-5 h-5" />
              Add Contact
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <MagnifyingGlassIcon className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or address..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-12"
            />
          </div>

          {/* Contacts List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">
                {filteredContacts.length} Contact{filteredContacts.length !== 1 ? 's' : ''}
              </h2>
            </div>

            {filteredContacts.length === 0 ? (
              <div className="card p-8 text-center">
                <UsersIcon className="w-12 h-12 mx-auto mb-4 text-gray-500" />
                <p className="text-gray-400 mb-4">
                  {searchTerm ? 'No contacts found matching your search' : 'No contacts yet'}
                </p>
                {!searchTerm && (
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="btn-secondary"
                  >
                    Add Your First Contact
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredContacts.map((contact) => (
                  <div
                    key={contact.id}
                    className="card p-4 flex items-center justify-between hover:border-purple-500/30 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-white font-bold">
                        {contact.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-white">{contact.name}</p>
                          <span className="px-2 py-0.5 text-xs rounded-full bg-gray-700 text-gray-300">
                            {contact.type}
                          </span>
                        </div>
                        <p className="text-sm text-gray-400 font-mono">
                          {contact.address.slice(0, 10)}...{contact.address.slice(-8)}
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
                        onClick={() => handleSendToContact(contact)}
                        className="btn-secondary text-sm py-2"
                      >
                        Send
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Import/Export */}
          <div className="card">
            <h3 className="text-lg font-semibold text-white mb-4">Manage Contacts</h3>
            <div className="flex gap-4">
              <button className="btn-ghost flex-1">Import Contacts</button>
              <button className="btn-ghost flex-1">Export Contacts</button>
            </div>
          </div>
        </div>
      </div>

      {/* Add Contact Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Add New Contact</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Name</label>
                <input
                  type="text"
                  value={newContactName}
                  onChange={(e) => setNewContactName(e.target.value)}
                  placeholder="Enter contact name"
                  className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-sm text-gray-400 mb-2 block">Wallet Address</label>
                <input
                  type="text"
                  value={newContactAddress}
                  onChange={(e) => setNewContactAddress(e.target.value)}
                  placeholder="0x..."
                  className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-sm text-gray-400 mb-2 block">Type</label>
                <select
                  value={newContactType}
                  onChange={(e) => setNewContactType(e.target.value as Contact['type'])}
                  className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                >
                  <option value="Provider">Provider</option>
                  <option value="Friend">Friend</option>
                  <option value="Client">Client</option>
                  <option value="Family">Family</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <button
                onClick={handleAddContact}
                disabled={!newContactName || !newContactAddress}
                className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Contact
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
              <button
                onClick={() => setShowSendModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-gray-800/50 rounded-lg">
                <p className="text-sm text-gray-400 mb-1">Sending to</p>
                <p className="font-medium text-white">{selectedContact.name}</p>
                <p className="text-sm text-gray-400 font-mono">
                  {selectedContact.address.slice(0, 10)}...{selectedContact.address.slice(-8)}
                </p>
              </div>

              <div>
                <label className="text-sm text-gray-400 mb-2 block">Select Token</label>
                <div className="grid grid-cols-3 gap-2">
                  {['ETH', 'USDC', 'ECOP'].map((token) => (
                    <button
                      key={token}
                      onClick={() => setSelectedToken(token as 'ETH' | 'USDC' | 'ECOP')}
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
                  onChange={(e) => setSendAmount(e.target.value)}
                  placeholder="0.00"
                  step="0.000001"
                  className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div className="p-4 bg-amber-900/20 border border-amber-700/50 rounded-lg">
                <p className="text-sm text-amber-400">
                  This will open a transaction confirmation. Make sure you have enough balance and gas.
                </p>
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


