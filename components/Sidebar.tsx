'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useState, useEffect } from 'react';
import { useAccount, useChainId, useBalance, useReadContract } from 'wagmi';
import { formatUnits } from 'viem';
import { erc20Abi } from 'viem';
import { useNFTBalance } from '@/lib/hooks/useNFTBalance';
import { getContractsForChain } from '@/lib/contracts/addresses';
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
  CheckBadgeIcon,
  XCircleIcon,
  ArrowTrendingUpIcon,
} from '@heroicons/react/24/outline';

// Types
interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  requiredTier?: number;
  adminOnly?: boolean;
  subItems?: NavSubItem[];
}

interface NavSubItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  requiredTier?: number;
  description?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

// Navigation structure per user requirements
const navigationSections: NavSection[] = [
  {
    title: 'Account',
    items: [
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
    ],
  },
  {
    title: 'Identity',
    items: [
      {
        name: 'Digital ID',
        href: '/digital-id',
        icon: IdentificationIcon,
        subItems: [
          { name: 'Humanity', href: '/digital-id/humanity', icon: ShieldCheckIcon, description: 'ZK Passport / Veriff', requiredTier: 0 },
          { name: 'Limited Partner', href: '/digital-id/limited-partner', icon: UserGroupIcon, description: 'LP NFT Status', requiredTier: 0 },
          { name: 'Credit Score', href: '/digital-id/credit-score', icon: SparklesIcon, description: 'Financial & Business', requiredTier: 0 },
        ],
      },
    ],
  },
  {
    title: 'Finance',
    items: [
      {
        name: 'Funding',
        href: '/funding',
        icon: BanknotesIcon,
        requiredTier: 3, // Vault Creator only
        subItems: [
          { name: 'E-Loans', href: '/funding/e-loans', icon: BanknotesIcon, description: 'Create loan vaults', requiredTier: 3 },
          { name: 'E-Contracts', href: '/funding/e-contracts', icon: DocumentTextIcon, description: 'Loan agreements', requiredTier: 3 },
        ],
      },
      {
        name: 'Treasury',
        href: '/treasury',
        icon: CurrencyDollarIcon,
        requiredTier: 1, // Passport or higher
        subItems: [
          { name: 'Monetization', href: '/treasury/monetization', icon: CurrencyDollarIcon, description: 'COP ↔ ECOP' },
          { name: 'Swaps', href: '/treasury/swaps', icon: ArrowsRightLeftIcon, description: 'ECOP/USDC/EUR Pools' },
          { name: 'OTC Orders', href: '/treasury/otc', icon: ClipboardDocumentListIcon, description: 'Large orders' },
        ],
      },
    ],
  },
  {
    title: 'Invest',
    items: [
      {
        name: 'Investments',
        href: '/investments',
        icon: ChartBarIcon,
        requiredTier: 1, // Passport or higher
        subItems: [
          { name: 'C-Bonds', href: '/investments/c-bonds', icon: BanknotesIcon, description: 'Invest in Vaults' },
          { name: 'Market LPs', href: '/investments/market-lps', icon: ArrowTrendingUpIcon, description: 'Provide liquidity' },
          { name: 'Vaults', href: '/investments/vaults', icon: CubeIcon, description: 'Earn protocols' },
        ],
      },
    ],
  },
  {
    title: 'Admin',
    items: [
      {
        name: 'Admin Panel',
        href: '/admin',
        icon: Cog6ToothIcon,
        adminOnly: true,
      },
    ],
  },
];

// User tier calculation
function useUserTier() {
  const { hasPassportNFT, hasLPsNFT, hasVaultsNFT, hasActivePassport } = useNFTBalance();
  
  // Highest tier wins (per CONTRACTS_REFERENCE.md)
  if (hasVaultsNFT) return 3; // Vault Creator
  if (hasLPsNFT) return 2; // Limited Partner
  if (hasPassportNFT || hasActivePassport) return 1; // Passport
  return 0; // None
}

// Admin check
function useIsAdmin() {
  const { address } = useAccount();
  const chainId = useChainId();
  const contracts = getContractsForChain(chainId);
  
  if (!address || !contracts) return false;
  return address.toLowerCase() === contracts.ADMIN_ADDRESS.toLowerCase();
}

// Wallet balances component
function WalletBalances() {
  const { address } = useAccount();
  const chainId = useChainId();
  const contracts = getContractsForChain(chainId);
  
  const { data: ethBalance } = useBalance({ address });
  
  const { data: usdcBalance } = useReadContract({
    address: contracts?.USDC,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!contracts },
  });

  const formatBalance = (balance: bigint | undefined, decimals: number) => {
    if (!balance) return '0.00';
    const formatted = parseFloat(formatUnits(balance, decimals));
    if (formatted >= 1000000) return `${(formatted / 1000000).toFixed(2)}M`;
    if (formatted >= 1000) return `${(formatted / 1000).toFixed(2)}K`;
    return formatted.toFixed(2);
  };

  return (
    <div className="px-4 py-3 space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-400">ETH</span>
        <span className="text-white font-medium">
          {formatBalance(ethBalance?.value, 18)}
        </span>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-400">USDC</span>
        <span className="text-emerald-400 font-medium">
          ${formatBalance(usdcBalance as bigint | undefined, 6)}
        </span>
      </div>
    </div>
  );
}

// NFT Status badges
function NFTStatusBadges() {
  const { hasPassportNFT, hasLPsNFT, hasVaultsNFT, hasActivePassport } = useNFTBalance();
  
  const nfts = [
    { name: 'Passport', owned: hasPassportNFT || hasActivePassport, tier: 1 },
    { name: 'LP', owned: hasLPsNFT, tier: 2 },
    { name: 'Vault', owned: hasVaultsNFT, tier: 3 },
  ];

  return (
    <div className="px-4 py-3 border-t border-gray-800">
      <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">NFT Status</p>
      <div className="flex gap-2">
        {nfts.map((nft) => (
          <div
            key={nft.name}
            className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
              nft.owned
                ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-700/50'
                : 'bg-gray-800 text-gray-500 border border-gray-700'
            }`}
          >
            {nft.owned ? (
              <CheckBadgeIcon className="w-3 h-3" />
            ) : (
              <XCircleIcon className="w-3 h-3" />
            )}
            <span>{nft.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Tier badge component
function TierBadge({ tier }: { tier: number }) {
  const tierConfig = {
    0: { label: 'Unverified', className: 'bg-gray-800 text-gray-400 border-gray-700' },
    1: { label: 'Passport', className: 'bg-emerald-900/30 text-emerald-400 border-emerald-700/50' },
    2: { label: 'LP', className: 'bg-blue-900/30 text-blue-400 border-blue-700/50' },
    3: { label: 'Vault Creator', className: 'bg-purple-900/30 text-purple-400 border-purple-700/50' },
  };

  const config = tierConfig[tier as keyof typeof tierConfig] || tierConfig[0];

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${config.className}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {config.label}
    </span>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { isConnected, address } = useAccount();
  const chainId = useChainId();
  const contracts = getContractsForChain(chainId);
  const userTier = useUserTier();
  const isAdmin = useIsAdmin();
  
  // Track expanded sections
  const [expandedItems, setExpandedItems] = useState<string[]>(() => {
    // Auto-expand based on current path
    const expanded: string[] = [];
    navigationSections.forEach(section => {
      section.items.forEach(item => {
        if (item.subItems?.some(sub => pathname?.startsWith(sub.href))) {
          expanded.push(item.name);
        } else if (pathname?.startsWith(item.href) && item.subItems) {
          expanded.push(item.name);
        }
      });
    });
    return expanded;
  });

  // Update expanded items when pathname changes
  useEffect(() => {
    navigationSections.forEach(section => {
      section.items.forEach(item => {
        if (item.subItems?.some(sub => pathname?.startsWith(sub.href))) {
          setExpandedItems(prev => 
            prev.includes(item.name) ? prev : [...prev, item.name]
          );
        }
      });
    });
  }, [pathname]);

  const toggleExpand = (itemName: string) => {
    setExpandedItems((prev) =>
      prev.includes(itemName)
        ? prev.filter((name) => name !== itemName)
        : [...prev, itemName]
    );
  };

  const isItemActive = (href: string, subItems?: NavSubItem[]) => {
    if (pathname === href) return true;
    if (subItems) {
      return subItems.some((subItem) => pathname?.startsWith(subItem.href));
    }
    return pathname?.startsWith(href) && href !== '/';
  };

  const isSubItemActive = (href: string) => pathname?.startsWith(href);

  const canAccessItem = (item: NavItem | NavSubItem) => {
    if ('adminOnly' in item && item.adminOnly) return isAdmin;
    if (item.requiredTier !== undefined) return userTier >= item.requiredTier;
    return true;
  };

  // Filter sections based on admin status
  const filteredSections = navigationSections.filter(section => {
    if (section.title === 'Admin') return isAdmin;
    return true;
  });

  return (
    <div className="w-72 flex flex-col h-full bg-[#0f1219] border-r border-gray-800/50">
      {/* Logo Header */}
      <div className="p-6 border-b border-gray-800/50">
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center overflow-hidden">
            <Image 
              src="/logo_convexo.png" 
              alt="Convexo" 
              width={40} 
              height={40}
              className="object-contain"
            />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Convexo</h1>
            <p className="text-xs text-gray-500">Protocol v2.1</p>
          </div>
        </div>
        
        {/* Network indicator */}
        {contracts && (
          <div className="mt-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs text-gray-400">{contracts.CHAIN_NAME}</span>
          </div>
        )}
      </div>

      {/* User Status (when connected) */}
      {isConnected && (
        <div className="border-b border-gray-800/50">
          <WalletBalances />
          <NFTStatusBadges />
          <div className="px-4 py-3 flex items-center justify-between">
            <span className="text-xs text-gray-500">Your Tier</span>
            <TierBadge tier={userTier} />
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-6 overflow-y-auto">
        {filteredSections.map((section) => (
          <div key={section.title}>
            <p className="px-3 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              {section.title}
            </p>
            <div className="space-y-1">
              {section.items.map((item) => {
                const isLocked = !canAccessItem(item);
                const isActive = isItemActive(item.href, item.subItems);
                const isExpanded = expandedItems.includes(item.name);
                const hasSubItems = item.subItems && item.subItems.length > 0;

                return (
                  <div key={item.name}>
                    {hasSubItems ? (
                      <>
                        <button
                          onClick={() => !isLocked && toggleExpand(item.name)}
                          disabled={isLocked}
                          className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                            isLocked
                              ? 'text-gray-600 cursor-not-allowed opacity-50'
                              : isActive
                              ? 'bg-purple-500/10 text-white border-l-2 border-purple-500'
                              : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'
                          }`}
                          title={isLocked ? `Requires Tier ${item.requiredTier} access` : ''}
                        >
                          <div className="flex items-center gap-3">
                            {isLocked ? (
                              <LockClosedIcon className="w-5 h-5" />
                            ) : (
                              <item.icon className="w-5 h-5" />
                            )}
                            <span className="font-medium">{item.name}</span>
                          </div>
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
            </div>
          </div>
        ))}
      </nav>

      {/* Wallet Connection - Fixed at bottom */}
      <div className="p-4 border-t border-gray-800/50 bg-[#0a0d14]">
        <ConnectButton 
          showBalance={false}
          chainStatus="icon"
          accountStatus={{
            smallScreen: 'avatar',
            largeScreen: 'full',
          }}
        />
      </div>
    </div>
  );
}
