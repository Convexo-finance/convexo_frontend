'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import {
  HomeIcon,
  BuildingOfficeIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  ArrowPathIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';

const navigation = [
  { name: 'Dashboard', href: '/', icon: HomeIcon },
  { name: 'Enterprise', href: '/enterprise', icon: BuildingOfficeIcon },
  { name: 'Investor', href: '/investor', icon: ChartBarIcon },
  { name: 'Funding', href: '/funding', icon: CurrencyDollarIcon },
  { name: 'Conversion', href: '/conversion', icon: ArrowPathIcon },
  { name: 'Admin', href: '/admin', icon: Cog6ToothIcon },
];

export function Sidebar() {
  const pathname = usePathname();

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
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
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
          );
        })}
      </nav>

      {/* Wallet Connection - Fixed at bottom */}
      <div className="p-4 border-t border-gray-800 flex-shrink-0">
        <ConnectButton />
      </div>
    </div>
  );
}

