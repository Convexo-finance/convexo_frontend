'use client';

import { useAccount } from 'wagmi';
import DashboardLayout from '@/components/DashboardLayout';
import { useState } from 'react';
import {
  UsersIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  UserCircleIcon,
  ClipboardDocumentIcon,
} from '@heroicons/react/24/outline';

interface Contact {
  id: number;
  name: string;
  address: `0x${string}`;
  label?: string;
}

export default function ContactsPage() {
  const { isConnected } = useAccount();
  const [searchTerm, setSearchTerm] = useState('');

  // Mock contacts data - in production this would come from local storage or API
  const [contacts] = useState<Contact[]>([
    {
      id: 1,
      name: 'Treasury Account',
      address: '0x742d35Cc6634C0532925a3b844Bc9e7595f52bE8',
      label: 'Company',
    },
    {
      id: 2,
      name: 'Business Partner',
      address: '0x8Ba1f109551bD432803012645Hc136E4024Fe235',
      label: 'Partner',
    },
    {
      id: 3,
      name: 'Cold Wallet',
      address: '0xdD2FD4581271e230360230F9337D5c0430Bf44C0',
      label: 'Personal',
    },
  ]);

  const filteredContacts = contacts.filter(
    (contact) =>
      contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const copyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
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
            <button className="btn-primary flex items-center gap-2">
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
                  <button className="btn-secondary">Add Your First Contact</button>
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
                          {contact.label && (
                            <span className="px-2 py-0.5 text-xs rounded-full bg-gray-700 text-gray-300">
                              {contact.label}
                            </span>
                          )}
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
                      <button className="btn-secondary text-sm py-2">Send</button>
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
    </DashboardLayout>
  );
}


