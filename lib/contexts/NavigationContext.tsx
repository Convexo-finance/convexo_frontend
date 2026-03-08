'use client';

import React, { createContext, useContext, useMemo, useCallback, ReactNode } from 'react';
import { useAccount, useChainId } from '@/lib/wagmi/compat';
import { getContractsForChain } from '@/lib/contracts/addresses';
import { useNFTBalance } from '@/lib/hooks/useNFTBalance';
import { useUserReputation } from '@/lib/hooks/useUserReputation';
import { useOnboarding, type AccountType, type OnboardingStep } from '@/lib/hooks/useOnboarding';
import { useAuth } from '@/lib/hooks/useAuth';

/**
 * Tier System per CONTRACTS_REFERENCE.md v3.0
 * 
 * | Tier | NFT              | Verification    | Access                              |
 * |------|------------------|-----------------|-------------------------------------|
 * | 0    | None             | -               | No access                           |
 * | 1    | Convexo_Passport | ZKPassport      | Treasury + Vault investments        |
 * | 2    | LP_Individuals   | Veriff          | LP pools + Vault investments        |
 * | 2    | LP_Business      | Sumsub          | LP pools + Vault investments        |
 * | 3    | Ecreditscoring   | AI Credit Score | All above + Vault creation          |
 */
export enum UserTier {
  None = 0,           // No NFTs - No access
  Passport = 1,       // Convexo_Passport - Individual: Treasury + Vault investments
  LimitedPartner = 2, // LP_Individuals OR LP_Business - LP pools + Vault investments  
  VaultCreator = 3,   // Ecreditscoring - Vault creation + All benefits
}

export interface NFTStatus {
  // Tier 1
  hasPassport: boolean;
  passportActive: boolean;
  // Tier 2
  hasLPIndividuals: boolean;
  hasLPBusiness: boolean;
  hasAnyLP: boolean;
  // Tier 3
  hasEcreditscoring: boolean;
}

export interface NavigationState {
  // Connection
  isConnected: boolean;
  address: `0x${string}` | undefined;
  chainId: number;
  chainName: string;
  
  // User Status
  userTier: UserTier;
  isAdmin: boolean;
  
  // Onboarding / Account Type
  accountType: AccountType | null;
  onboardingStep: OnboardingStep | null;
  isOnboardingComplete: boolean;
  
  // NFT Status
  nftStatus: NFTStatus;
  
  // Access Control per CONTRACTS_REFERENCE.md
  canAccessTreasury: boolean;     // Tier 1+ (Passport or higher)
  canInvestInVaults: boolean;     // Tier 1+ (Passport or higher)
  canAccessLPPools: boolean;      // Tier 2+ (LPs or higher)
  canRequestCreditScore: boolean; // Tier 2+ (LPs or higher)
  canCreateVaults: boolean;       // Tier 3 (Ecreditscoring only)
  
  // Loading
  isLoading: boolean;
  
  // Refetch
  refetchAll: () => void;
}

const NavigationContext = createContext<NavigationState | undefined>(undefined);

export function NavigationProvider({ children }: { children: ReactNode }) {
  const { isConnected, address } = useAccount();
  const chainId = useChainId();
  const contracts = getContractsForChain(chainId);
  const { isAuthenticated, user } = useAuth();

  // Only fetch onboarding status when authenticated (JWT present).
  // Passing isAuthenticated ensures the hook re-fetches after sign-in
  // and resets after sign-out — fixing the race where the hook ran
  // once on mount (before JWT existed) and never re-fetched.
  const {
    step: onboardingStep,
    accountType,
    isComplete: isOnboardingComplete,
    isLoading: isOnboardingLoading,
    refetch: refetchOnboarding,
  } = useOnboarding(isAuthenticated);
  
  const {
    // Tier 1
    hasPassportNFT,
    hasActivePassport,
    // Tier 2
    hasLPIndividualsNFT,
    hasLPBusinessNFT,
    hasAnyLPNFT,
    // Tier 3
    hasEcreditscoringNFT,
    // Computed
    userTier: nftUserTier,
    canAccessTreasury: nftCanAccessTreasury,
    canInvestInVaults: nftCanInvestInVaults,
    canAccessLPPools: nftCanAccessLPPools,
    canRequestCreditScore: nftCanRequestCreditScore,
    canCreateVaults: nftCanCreateVaults,
    isLoading: isNFTLoading,
    refetch: refetchNFT,
  } = useNFTBalance();
  
  const {
    tier,
    refetch: refetchReputation,
  } = useUserReputation();

  // Use the computed tier from NFT balance hook (highest tier wins)
  const userTier = useMemo(() => {
    return nftUserTier as UserTier;
  }, [nftUserTier]);

  // Admin status comes from the backend JWT (adminRole) — more reliable
  // than a hardcoded on-chain address comparison.
  const isAdmin = useMemo(() => {
    return isAuthenticated && !!user?.isAdmin;
  }, [isAuthenticated, user?.isAdmin]);

  // Access control - use values from useNFTBalance or fallback to tier calculation
  const accessControl = useMemo(() => ({
    canAccessTreasury: nftCanAccessTreasury || userTier >= UserTier.Passport,
    canInvestInVaults: nftCanInvestInVaults || userTier >= UserTier.Passport,
    canAccessLPPools: nftCanAccessLPPools || userTier >= UserTier.LimitedPartner,
    canRequestCreditScore: nftCanRequestCreditScore || userTier >= UserTier.LimitedPartner,
    canCreateVaults: nftCanCreateVaults || userTier >= UserTier.VaultCreator,
  }), [userTier, nftCanAccessTreasury, nftCanInvestInVaults, nftCanAccessLPPools, nftCanRequestCreditScore, nftCanCreateVaults]);

  const nftStatus: NFTStatus = useMemo(() => ({
    // Tier 1
    hasPassport: hasPassportNFT,
    passportActive: hasActivePassport,
    // Tier 2
    hasLPIndividuals: hasLPIndividualsNFT,
    hasLPBusiness: hasLPBusinessNFT,
    hasAnyLP: hasAnyLPNFT,
    // Tier 3
    hasEcreditscoring: hasEcreditscoringNFT,
  }), [hasPassportNFT, hasActivePassport, hasLPIndividualsNFT, hasLPBusinessNFT, hasAnyLPNFT, hasEcreditscoringNFT]);

  const refetchAll = useCallback(() => {
    refetchNFT();
    refetchReputation();
    refetchOnboarding();
  }, [refetchNFT, refetchReputation, refetchOnboarding]);

  const state = useMemo<NavigationState>(() => ({
    isConnected,
    address,
    chainId,
    chainName: contracts?.CHAIN_NAME ?? 'Unknown',
    userTier,
    isAdmin,
    accountType: isAuthenticated ? accountType : null,
    onboardingStep: isAuthenticated ? onboardingStep : null,
    isOnboardingComplete: isAuthenticated ? isOnboardingComplete : false,
    nftStatus,
    ...accessControl,
    isLoading: isAuthenticated ? (isOnboardingLoading || isNFTLoading) : false,
    refetchAll,
  }), [isConnected, address, chainId, contracts, userTier, isAdmin, accountType, onboardingStep, isOnboardingComplete, isAuthenticated, isOnboardingLoading, isNFTLoading, nftStatus, accessControl, refetchAll]);

  return (
    <NavigationContext.Provider value={state}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation(): NavigationState {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within NavigationProvider');
  }
  return context;
}

// Helper to get tier label
export function getTierLabel(tier: UserTier): string {
  const labels: Record<UserTier, string> = {
    [UserTier.None]: 'Unverified',
    [UserTier.Passport]: 'Individual Investor',
    [UserTier.LimitedPartner]: 'Limited Partner',
    [UserTier.VaultCreator]: 'Vault Creator',
  };
  return labels[tier];
}

// Helper to get tier color
export function getTierColor(tier: UserTier): string {
  const colors: Record<UserTier, string> = {
    [UserTier.None]: 'text-gray-400',
    [UserTier.Passport]: 'text-emerald-400',
    [UserTier.LimitedPartner]: 'text-blue-400',
    [UserTier.VaultCreator]: 'text-purple-400',
  };
  return colors[tier];
}

// Helper to get tier badge color
export function getTierBadgeColor(tier: UserTier): string {
  const colors: Record<UserTier, string> = {
    [UserTier.None]: 'bg-gray-700 text-gray-300',
    [UserTier.Passport]: 'bg-emerald-900/50 text-emerald-300 border border-emerald-700',
    [UserTier.LimitedPartner]: 'bg-blue-900/50 text-blue-300 border border-blue-700',
    [UserTier.VaultCreator]: 'bg-purple-900/50 text-purple-300 border border-purple-700',
  };
  return colors[tier];
}

// Helper to get tier icon
export function getTierIcon(tier: UserTier): string {
  const icons: Record<UserTier, string> = {
    [UserTier.None]: '⚪',
    [UserTier.Passport]: '🛂',
    [UserTier.LimitedPartner]: '💼',
    [UserTier.VaultCreator]: '🏆',
  };
  return icons[tier];
}
