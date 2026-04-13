'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAuthModal } from '@account-kit/react';
import { useAuth } from '@/lib/hooks/useAuth';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAccount } from '@/lib/wagmi/compat';
import { useNavigation } from '@/lib/contexts/NavigationContext';
import { useRouter } from 'next/navigation';
import {
  UserCircleIcon,
  WalletIcon,
  BuildingLibraryIcon,
  UsersIcon,
  IdentificationIcon,
  ShieldCheckIcon,
  UserGroupIcon,
  SparklesIcon,
  BanknotesIcon,
  DocumentTextIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  CurrencyDollarIcon,
  ArrowsRightLeftIcon,
  ClipboardDocumentListIcon,
  ChartBarIcon,
  CubeIcon,
  BuildingOfficeIcon,
  Cog6ToothIcon,
  LockClosedIcon,
  ArrowTrendingUpIcon,
  XMarkIcon,
  ArrowRightStartOnRectangleIcon,
} from '@heroicons/react/24/outline';

// Bottom user section — shows address + sign out button
function UserFooter() {
  const { openAuthModal } = useAuthModal();
  const { address } = useAccount();
  const { isAuthenticated, signOut, user } = useAuth();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      // signOut() handles everything: backend logout, JWT clear,
      // cookie cleanup, Alchemy signer disconnect.
      await signOut();
    } finally {
      setSigningOut(false);
      router.push('/');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="p-4 border-t border-gray-800/50">
        <button
          onClick={openAuthModal}
          className="w-full px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-medium text-sm transition-colors"
        >
          Connect Wallet
        </button>
      </div>
    );
  }

  const displayAddress = address ?? user?.walletAddress;

  return (
    <div className="p-4 border-t border-gray-800/50 space-y-3">
      {/* Address chip */}
      {displayAddress && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-800/50">
          <div className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0" />
          <span className="text-xs text-gray-400 font-mono truncate flex-1">
            {displayAddress.slice(0, 6)}…{displayAddress.slice(-4)}
          </span>
        </div>
      )}
      {/* Sign out */}
      <button
        onClick={handleSignOut}
        disabled={signingOut}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-gray-500 hover:text-white hover:bg-gray-800/60 disabled:opacity-40 disabled:cursor-not-allowed text-sm transition-colors"
      >
        {signingOut ? (
          <div className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
        ) : (
          <ArrowRightStartOnRectangleIcon className="w-4 h-4" />
        )}
        {signingOut ? 'Signing out…' : 'Sign out'}
      </button>
    </div>
  );
}

// Types
interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  requiredTier?: number;
  adminOnly?: boolean;
  businessOnly?: boolean;
  subItems?: NavSubItem[];
}

interface NavSubItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  requiredTier?: number;
  description?: string;
}

// Flat navigation items (no section grouping)
const navItems: NavItem[] = [
  {
    name: 'Profile',
    href: '/profile',
    icon: UserCircleIcon,
    subItems: [
      { name: 'Wallet', href: '/profile/wallet', icon: WalletIcon, description: 'View balances' },
      { name: 'Bank Accounts', href: '/profile/bank-accounts', icon: BuildingLibraryIcon, description: 'Linked accounts' },
      { name: 'Contacts', href: '/profile/contacts', icon: UsersIcon, description: 'Address book' },
    ],
  },
  {
    name: 'Digital ID',
    href: '/digital-id',
    icon: IdentificationIcon,
    subItems: [
      { name: 'Tier 1: Humanity', href: '/digital-id/humanity', icon: ShieldCheckIcon, description: 'ZK Passport', requiredTier: 0 },
      { name: 'Tier 2: LP Individuals', href: '/digital-id/limited-partner-individuals', icon: UserGroupIcon, description: 'Individual KYC', requiredTier: 0 },
      { name: 'Tier 2: LP Business', href: '/digital-id/limited-partner-business', icon: BuildingOfficeIcon, description: 'Business KYB', requiredTier: 0 },
      { name: 'Tier 3: Credit Score', href: '/digital-id/credit-score', icon: SparklesIcon, description: 'Vault Creator', requiredTier: 0 },
    ],
  },
  {
    name: 'Trade',
    href: '/treasury',
    icon: CurrencyDollarIcon,
    requiredTier: 1,
    subItems: [
      { name: 'OTC Orders', href: '/treasury/otc', icon: ClipboardDocumentListIcon, description: 'Large orders' },
      { name: 'Swaps', href: '/treasury/swaps', icon: ArrowsRightLeftIcon, description: 'ECOP/USDC/EUR Pools' },
      { name: 'Monetization', href: '/treasury/monetization', icon: CurrencyDollarIcon, description: 'COP ↔ ECOP' },
    ],
  },
  {
    name: 'Funding',
    href: '/funding',
    icon: BanknotesIcon,
    requiredTier: 3,
    businessOnly: true,
    subItems: [
      { name: 'E-Loans', href: '/funding/e-loans', icon: BanknotesIcon, description: 'Create loan vaults', requiredTier: 3 },
      { name: 'E-Contracts', href: '/funding/e-contracts', icon: DocumentTextIcon, description: 'Sign & view contracts', requiredTier: 3 },
    ],
  },
  {
    name: 'Investments',
    href: '/investments',
    icon: ChartBarIcon,
    requiredTier: 1,
    subItems: [
      { name: 'C-Bonds', href: '/investments/c-bonds', icon: BanknotesIcon, description: 'Invest in Vaults' },
      { name: 'Market LPs', href: '/investments/market-lps', icon: ArrowTrendingUpIcon, description: 'Provide liquidity' },
      { name: 'Vaults', href: '/investments/vaults', icon: CubeIcon, description: 'Earn protocols' },
    ],
  },
  {
    name: 'Admin Panel',
    href: '/admin',
    icon: Cog6ToothIcon,
    adminOnly: true,
  },
];



interface SidebarProps {
  onClose?: () => void;
}

export function Sidebar({ onClose }: SidebarProps) {
  const pathname = usePathname();
  const { userTier, isAdmin } = useNavigation();
  const { user } = useAuth();
  const isBusinessAccount = user?.accountType === 'BUSINESS';

  // Track expanded items
  const [expandedItems, setExpandedItems] = useState<string[]>(() => {
    const expanded: string[] = [];
    navItems.forEach(item => {
      if (item.subItems?.some(sub => pathname?.startsWith(sub.href))) {
        expanded.push(item.name);
      } else if (pathname?.startsWith(item.href) && item.subItems) {
        expanded.push(item.name);
      }
    });
    return expanded;
  });

  // Auto-expand based on pathname changes
  useEffect(() => {
    navItems.forEach(item => {
      if (item.subItems?.some(sub => pathname?.startsWith(sub.href))) {
        setExpandedItems(prev =>
          prev.includes(item.name) ? prev : [...prev, item.name]
        );
      }
    });
  }, [pathname]);

  const toggleExpand = useCallback((itemName: string) => {
    setExpandedItems(prev =>
      prev.includes(itemName)
        ? prev.filter(name => name !== itemName)
        : [...prev, itemName]
    );
  }, []);

  const isItemActive = (href: string, subItems?: NavSubItem[]) => {
    if (pathname === href) return true;
    if (subItems) return subItems.some(sub => pathname?.startsWith(sub.href));
    return pathname?.startsWith(href) && href !== '/';
  };

  const isSubItemActive = (href: string) => pathname?.startsWith(href);

  const canAccessItem = (item: NavItem | NavSubItem) => {
    if ('adminOnly' in item && item.adminOnly) return isAdmin;
    if ('businessOnly' in item && item.businessOnly && !isBusinessAccount) return false;
    if (item.requiredTier !== undefined) return userTier >= item.requiredTier;
    return true;
  };

  const visibleItems = useMemo(() => navItems.filter(item => {
    if (item.adminOnly) return isAdmin;
    // Business-only items (e.g. Funding) are hidden entirely for Individual accounts.
    // We only show them once the user's accountType is confirmed as BUSINESS.
    if (item.businessOnly && !isBusinessAccount) return false;
    return true;
  }), [isAdmin, isBusinessAccount]);

  return (
    <div className="w-64 flex flex-col h-full bg-[#0f1219] border-r border-gray-800/50">
      {/* Logo Header */}
      <div className="px-5 py-4 border-b border-gray-800/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image
              src="/logo_convexo.png"
              alt="Convexo"
              width={40}
              height={40}
              className="object-contain"
            />
            <div>
              <h1 className="text-xl font-bold text-white">Convexo</h1>
              <p className="text-xs text-gray-500">Protocol v2.1</p>
            </div>
          </div>
          {/* Mobile close button */}
          <button
            onClick={onClose}
            className="lg:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800/50 transition-colors"
            aria-label="Close menu"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {visibleItems.map((item) => {
          const isLocked = !canAccessItem(item);
          const isActive = isItemActive(item.href, item.subItems);
          const isExpanded = expandedItems.includes(item.name);
          const hasSubItems = item.subItems && item.subItems.length > 0;

          return (
            <div key={item.name}>
              {hasSubItems ? (
                <>
                  <div
                    className={`flex items-center gap-3 rounded-xl transition-all duration-200 ${
                      isLocked
                        ? 'text-gray-600 cursor-not-allowed opacity-50'
                        : isActive
                        ? 'bg-purple-500/10 text-white border-l-2 border-purple-500'
                        : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'
                    }`}
                  >
                    {isLocked ? (
                      <div className="flex-1 flex items-center gap-3 px-4 py-3">
                        <LockClosedIcon className="w-5 h-5" />
                        <span className="font-medium">{item.name}</span>
                      </div>
                    ) : (
                      <>
                        <Link
                          href={item.href}
                          className="flex-1 flex items-center gap-3 px-4 py-3"
                          title={item.name}
                        >
                          <item.icon className="w-5 h-5" />
                          <span className="font-medium">{item.name}</span>
                        </Link>
                        <button
                          onClick={() => toggleExpand(item.name)}
                          className="px-3 py-3 hover:bg-gray-700/30 rounded-r-xl transition-colors"
                          title={isExpanded ? 'Collapse' : 'Expand'}
                        >
                          <div className="flex items-center gap-2">
                            {item.badge && (
                              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-purple-500/20 text-purple-400">
                                {item.badge}
                              </span>
                            )}
                            {isExpanded ? (
                              <ChevronDownIcon className="w-4 h-4" />
                            ) : (
                              <ChevronRightIcon className="w-4 h-4" />
                            )}
                          </div>
                        </button>
                      </>
                    )}
                  </div>

                  {/* Sub-items with animation */}
                  <div
                    className={`ml-4 mt-1 space-y-1 overflow-hidden transition-all duration-200 ${
                      isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                    }`}
                  >
                    {item.subItems?.map((subItem) => {
                      const isSubLocked = !canAccessItem(subItem);
                      const isSubActive = isSubItemActive(subItem.href);

                      return isSubLocked ? (
                        <div
                          key={subItem.name}
                          className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-600 cursor-not-allowed opacity-50"
                          title={`Requires Tier ${subItem.requiredTier} access`}
                        >
                          <LockClosedIcon className="w-4 h-4" />
                          <div>
                            <span className="text-sm">{subItem.name}</span>
                            {subItem.description && (
                              <p className="text-xs text-gray-600">{subItem.description}</p>
                            )}
                          </div>
                        </div>
                      ) : (
                        <Link
                          key={subItem.name}
                          href={subItem.href}
                          className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 ${
                            isSubActive
                              ? 'bg-purple-500/10 text-purple-400'
                              : 'text-gray-400 hover:bg-gray-800/30 hover:text-white'
                          }`}
                        >
                          <subItem.icon className="w-4 h-4" />
                          <div>
                            <span className="text-sm font-medium">{subItem.name}</span>
                            {subItem.description && (
                              <p className="text-xs text-gray-500">{subItem.description}</p>
                            )}
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </>
              ) : isLocked ? (
                <div
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 cursor-not-allowed opacity-50"
                  title={item.adminOnly ? 'Admin only' : `Requires Tier ${item.requiredTier} access`}
                >
                  <LockClosedIcon className="w-5 h-5" />
                  <span className="font-medium">{item.name}</span>
                </div>
              ) : (
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'bg-purple-500/10 text-white border-l-2 border-purple-500'
                      : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.name}</span>
                  {item.badge && (
                    <span className="ml-auto px-2 py-0.5 text-xs font-medium rounded-full bg-purple-500/20 text-purple-400">
                      {item.badge}
                    </span>
                  )}
                </Link>
              )}
            </div>
          );
        })}
      </nav>

      <UserFooter />
    </div>
  );
}
