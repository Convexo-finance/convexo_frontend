'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useState } from 'react';
import {
  UserCircleIcon,
  BuildingOfficeIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  ArrowPathIcon,
  Cog6ToothIcon,
  DocumentTextIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  BanknotesIcon,
  ShieldCheckIcon,
  SparklesIcon,
  BuildingLibraryIcon,
  CreditCardIcon,
  ArrowsRightLeftIcon,
  ArrowLeftOnRectangleIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '@/lib/auth';

const navigation = [
  { name: 'Profile', href: '/profile', icon: UserCircleIcon },
  { 
    name: 'Get Verified', 
    href: '/get-verified', 
    icon: ShieldCheckIcon,
    subItems: [
      { name: 'AML/CFT', href: '/get-verified/amlcft', icon: ShieldCheckIcon },
      { name: 'AI Credit Check', href: '/get-verified/ai-credit-check', icon: SparklesIcon },
    ]
  },
  { 
    name: 'Loans', 
    href: '/loans', 
    icon: BuildingOfficeIcon,
    subItems: [
      { name: 'Vaults', href: '/loans/vaults', icon: BanknotesIcon },
      { name: 'Contracts', href: '/loans/contracts', icon: DocumentTextIcon },
    ]
  },
  { name: 'Investments', href: '/investments', icon: ChartBarIcon },
  { 
    name: 'Treasury', 
    href: '/treasury', 
    icon: CurrencyDollarIcon,
    subItems: [
      { name: 'FIAT to STABLE', href: '/treasury/fiat-to-stable', icon: CurrencyDollarIcon },
      { name: 'Convert Fast', href: '/treasury/convert-fast', icon: ArrowPathIcon },
      { name: 'OTC', href: '/treasury/otc', icon: ArrowsRightLeftIcon },
      { name: 'Financial Accounts', href: '/treasury/financial-accounts', icon: BuildingLibraryIcon },
    ]
  },
  { name: 'Payments', href: '/payments', icon: CreditCardIcon },
  { name: 'Admin', href: '/admin', icon: Cog6ToothIcon },
];

export function Sidebar() {
  const { logout } = useAuth();
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = useState<string[]>(() => {
    // Auto-expand Get Verified if on any verification sub-page
    if (pathname?.startsWith('/get-verified')) {
      return ['Get Verified'];
    }
    // Auto-expand Loans if on any loans sub-page
    if (pathname?.startsWith('/loans')) {
      return ['Loans'];
    }
    // Auto-expand Treasury if on any treasury sub-page
    if (pathname?.startsWith('/treasury')) {
      return ['Treasury'];
    }
    return [];
  });

  const toggleExpand = (itemName: string) => {
    setExpandedItems((prev) =>
      prev.includes(itemName)
        ? prev.filter((name) => name !== itemName)
        : [...prev, itemName]
    );
  };

  const isItemActive = (href: string, subItems?: typeof navigation[0]['subItems']) => {
    if (pathname === href) return true;
    if (subItems) {
      return subItems.some((subItem) => pathname === subItem.href);
    }
    return false;
  };

  const isSubItemActive = (href: string) => pathname === href;

  return (
    <div className="w-64 flex flex-col h-full bg-gray-900 text-white">
      {/* Logo */}
      <div className="p-6 border-b border-gray-800 flex-shrink-0">
        <h1 className="text-2xl font-bold text-white">Convexo</h1>
        <p className="text-sm text-gray-400">Protocol</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = isItemActive(item.href, item.subItems);
          const isExpanded = expandedItems.includes(item.name);
          const hasSubItems = item.subItems && item.subItems.length > 0;

          return (
            <div key={item.name}>
              {hasSubItems ? (
                <>
                  <button
                    onClick={() => toggleExpand(item.name)}
                    className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className="w-5 h-5" />
                      <span className="font-medium">{item.name}</span>
                    </div>
                    {isExpanded ? (
                      <ChevronDownIcon className="w-4 h-4" />
                    ) : (
                      <ChevronRightIcon className="w-4 h-4" />
                    )}
                  </button>
                  {isExpanded && (
                    <div className="ml-4 mt-1 space-y-1">
                      {item.subItems.map((subItem) => {
                        const isSubActive = isSubItemActive(subItem.href);
                        return (
                          <Link
                            key={subItem.name}
                            href={subItem.href}
                            className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors text-sm ${
                              isSubActive
                                ? 'bg-blue-700 text-white'
                                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                            }`}
                          >
                            <subItem.icon className="w-4 h-4" />
                            <span>{subItem.name}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </>
              ) : (
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.name}</span>
                </Link>
              )}
            </div>
          );
        })}
      </nav>

      {/* Wallet Connection - Fixed at bottom */}
      <div className="p-4 border-t border-gray-800 flex-shrink-0 space-y-4">
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 px-4 py-3 rounded-lg transition-colors text-gray-300 hover:bg-gray-800 hover:text-white"
        >
          <ArrowLeftOnRectangleIcon className="w-5 h-5" />
          <span className="font-medium">Logout</span>
        </button>
        <ConnectButton />
      </div>
    </div>
  );
}

