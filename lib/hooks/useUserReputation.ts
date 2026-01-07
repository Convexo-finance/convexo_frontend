/**
 * User Reputation Hook - Version 3.0
 * 
 * Tier System (per CONTRACTS_REFERENCE.md):
 * | Tier | NFT              | Verification    | Access                              |
 * |------|------------------|-----------------|-------------------------------------|
 * | 0    | None             | -               | No access                           |
 * | 1    | Convexo_Passport | ZKPassport      | Treasury + Vault investments        |
 * | 2    | LP_Individuals   | Veriff          | LP pools + Vault investments        |
 * | 2    | LP_Business      | Sumsub          | LP pools + Vault investments        |
 * | 3    | Ecreditscoring   | AI Credit Score | All above + Vault creation          |
 */

import { useAccount, useChainId, useReadContract, useReadContracts } from 'wagmi';
import { getContractsForChain } from '@/lib/contracts/addresses';
import { ReputationManagerABI, ReputationTier, TIER_NAMES, TIER_COLORS, TIER_ICONS } from '@/lib/contracts/abis';

export interface UserReputation {
  tier: ReputationTier;
  tierNumeric: number;
  tierName: string;
  tierColor: string;
  tierIcon: string;
  // NFT Balances
  passportBalance: bigint;
  lpIndividualsBalance: bigint;
  lpBusinessBalance: bigint;
  ecreditscoringBalance: bigint;
  // Access Control
  canAccessTreasury: boolean;
  canInvestInVaults: boolean;
  canAccessLPPools: boolean;
  canRequestCreditScore: boolean;
  canCreateVaults: boolean;
  // Specific NFT checks
  holdsPassport: boolean;
  holdsLPIndividuals: boolean;
  holdsLPBusiness: boolean;
  holdsAnyLP: boolean;
  holdsEcreditscoring: boolean;
}

export function useUserReputation() {
  const { address } = useAccount();
  const chainId = useChainId();
  const contracts = getContractsForChain(chainId);

  // Get tier and detailed info from ReputationManager
  const { data: tierData, isLoading: loadingTier, refetch: refetchTier, error: tierError } = useReadContract({
    address: address && contracts ? contracts.REPUTATION_MANAGER : undefined,
    abi: ReputationManagerABI,
    functionName: 'getReputationTier',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!contracts,
    },
  });

  const { data: tierNumericData } = useReadContract({
    address: address && contracts ? contracts.REPUTATION_MANAGER : undefined,
    abi: ReputationManagerABI,
    functionName: 'getReputationTierNumeric',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!contracts,
    },
  });

  const { data: details, refetch: refetchDetails } = useReadContract({
    address: address && contracts ? contracts.REPUTATION_MANAGER : undefined,
    abi: ReputationManagerABI,
    functionName: 'getReputationDetails',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!contracts,
    },
  });

  // Access control checks from ReputationManager
  const { data: accessData } = useReadContracts({
    contracts: address && contracts ? [
      {
        address: contracts.REPUTATION_MANAGER,
        abi: ReputationManagerABI,
        functionName: 'canAccessLPPools',
        args: [address],
      },
      {
        address: contracts.REPUTATION_MANAGER,
        abi: ReputationManagerABI,
        functionName: 'canCreateTreasury',
        args: [address],
      },
      {
        address: contracts.REPUTATION_MANAGER,
        abi: ReputationManagerABI,
        functionName: 'canInvestInVaults',
        args: [address],
      },
      {
        address: contracts.REPUTATION_MANAGER,
        abi: ReputationManagerABI,
        functionName: 'canRequestCreditScore',
        args: [address],
      },
      {
        address: contracts.REPUTATION_MANAGER,
        abi: ReputationManagerABI,
        functionName: 'canCreateVaults',
        args: [address],
      },
      {
        address: contracts.REPUTATION_MANAGER,
        abi: ReputationManagerABI,
        functionName: 'holdsPassport',
        args: [address],
      },
      {
        address: contracts.REPUTATION_MANAGER,
        abi: ReputationManagerABI,
        functionName: 'holdsLPIndividuals',
        args: [address],
      },
      {
        address: contracts.REPUTATION_MANAGER,
        abi: ReputationManagerABI,
        functionName: 'holdsLPBusiness',
        args: [address],
      },
      {
        address: contracts.REPUTATION_MANAGER,
        abi: ReputationManagerABI,
        functionName: 'holdsAnyLP',
        args: [address],
      },
      {
        address: contracts.REPUTATION_MANAGER,
        abi: ReputationManagerABI,
        functionName: 'holdsEcreditscoring',
        args: [address],
      },
    ] : [],
    query: {
      enabled: !!address && !!contracts,
    },
  });

  // Parse tier value
  const tier = typeof tierData === 'number' ? tierData as ReputationTier : ReputationTier.None;
  const tierNumeric = typeof tierNumericData === 'bigint' ? Number(tierNumericData) : 0;

  // Parse details: [tier, passportBalance, lpIndividualsBalance, lpBusinessBalance, ecreditscoringBalance]
  const parsedDetails = details as [number, bigint, bigint, bigint, bigint] | undefined;

  // Parse access control results
  const canAccessLPPools = accessData?.[0]?.result === true;
  const canCreateTreasury = accessData?.[1]?.result === true;
  const canInvestInVaults = accessData?.[2]?.result === true;
  const canRequestCreditScore = accessData?.[3]?.result === true;
  const canCreateVaults = accessData?.[4]?.result === true;
  const holdsPassport = accessData?.[5]?.result === true;
  const holdsLPIndividuals = accessData?.[6]?.result === true;
  const holdsLPBusiness = accessData?.[7]?.result === true;
  const holdsAnyLP = accessData?.[8]?.result === true;
  const holdsEcreditscoring = accessData?.[9]?.result === true;

  // Build reputation object
  const reputation: UserReputation | null = address ? {
    tier,
    tierNumeric,
    tierName: TIER_NAMES[tier] ?? 'Unknown',
    tierColor: TIER_COLORS[tier] ?? '#6B7280',
    tierIcon: TIER_ICONS[tier] ?? '⚪',
    // NFT Balances from details
    passportBalance: parsedDetails?.[1] ?? 0n,
    lpIndividualsBalance: parsedDetails?.[2] ?? 0n,
    lpBusinessBalance: parsedDetails?.[3] ?? 0n,
    ecreditscoringBalance: parsedDetails?.[4] ?? 0n,
    // Access Control
    canAccessTreasury: canCreateTreasury,
    canInvestInVaults,
    canAccessLPPools,
    canRequestCreditScore,
    canCreateVaults,
    // Specific NFT checks
    holdsPassport,
    holdsLPIndividuals,
    holdsLPBusiness,
    holdsAnyLP,
    holdsEcreditscoring,
  } : null;

  // Refetch all data
  const refetch = () => {
    refetchTier();
    refetchDetails();
  };

  return {
    // Full reputation object
    reputation,
    
    // Tier info (legacy support)
    tier,
    tierNumeric,
    tierName: TIER_NAMES[tier] ?? 'Unknown',
    
    // Details (legacy support)
    details: parsedDetails ? {
      tier: parsedDetails[0],
      passportBalance: parsedDetails[1],
      lpIndividualsBalance: parsedDetails[2],
      lpBusinessBalance: parsedDetails[3],
      ecreditscoringBalance: parsedDetails[4],
    } : undefined,
    
    // Access control shortcuts (legacy support)
    hasPassportAccess: tier >= ReputationTier.Passport,
    hasLimitedPartnerAccess: tier >= ReputationTier.LimitedPartner,
    hasVaultCreatorAccess: tier >= ReputationTier.VaultCreator,
    
    // State
    isLoading: loadingTier,
    error: tierError,
    refetch,
  };
}

// Re-export types and constants for convenience
export { ReputationTier, TIER_NAMES, TIER_COLORS, TIER_ICONS };
