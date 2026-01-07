/**
 * NFT Balance Hook - Version 3.0
 * 
 * Tier System:
 * - Tier 1: Convexo_Passport (ZKPassport verified)
 * - Tier 2: LP_Individuals (Veriff) OR LP_Business (Sumsub)
 * - Tier 3: Ecreditscoring (AI Credit Score)
 */

import { useAccount, useChainId, useReadContract } from 'wagmi';
import { getContractsForChain } from '@/lib/contracts/addresses';
import { 
  ConvexoPassportABI, 
  LPIndividualsABI, 
  LPBusinessABI, 
  EcreditscoringABI,
  // Legacy
  ConvexoLPsABI, 
  ConvexoVaultsABI 
} from '@/lib/contracts/abis';

export function useNFTBalance() {
  const { address } = useAccount();
  const chainId = useChainId();
  const contracts = getContractsForChain(chainId);

  // Tier 1: Convexo Passport (ZKPassport verified)
  const { data: passportBalance, refetch: refetchPassport } = useReadContract({
    address: address && contracts ? contracts.CONVEXO_PASSPORT : undefined,
    abi: ConvexoPassportABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!contracts,
    },
  });

  const { data: hasActivePassport } = useReadContract({
    address: address && contracts ? contracts.CONVEXO_PASSPORT : undefined,
    abi: ConvexoPassportABI,
    functionName: 'holdsActivePassport',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!contracts,
    },
  });

  const { data: verifiedIdentity } = useReadContract({
    address: address && contracts ? contracts.CONVEXO_PASSPORT : undefined,
    abi: ConvexoPassportABI,
    functionName: 'getVerifiedIdentity',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!contracts,
    },
  });

  // Tier 2: LP Individuals (Veriff verified)
  const { data: lpIndividualsBalance, refetch: refetchLPIndividuals } = useReadContract({
    address: address && contracts ? contracts.LP_INDIVIDUALS : undefined,
    abi: LPIndividualsABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!contracts,
    },
  });

  // Tier 2: LP Business (Sumsub verified)
  const { data: lpBusinessBalance, refetch: refetchLPBusiness } = useReadContract({
    address: address && contracts ? contracts.LP_BUSINESS : undefined,
    abi: LPBusinessABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!contracts,
    },
  });

  // Tier 3: Ecreditscoring (AI Credit Score)
  const { data: ecreditscoringBalance, refetch: refetchEcreditscoring } = useReadContract({
    address: address && contracts ? contracts.ECREDITSCORING : undefined,
    abi: EcreditscoringABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!contracts,
    },
  });

  // Legacy: Convexo_LPs (backwards compatibility)
  const { data: lpsBalance, refetch: refetchLPs } = useReadContract({
    address: address && contracts ? contracts.CONVEXO_LPS : undefined,
    abi: ConvexoLPsABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!contracts,
    },
  });

  // Legacy: Convexo_Vaults (backwards compatibility)
  const { data: vaultsBalance, refetch: refetchVaults } = useReadContract({
    address: address && contracts ? contracts.CONVEXO_VAULTS : undefined,
    abi: ConvexoVaultsABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!contracts,
    },
  });

  // Parse balances
  const passport = passportBalance ?? undefined;
  const lpIndividuals = lpIndividualsBalance ?? undefined;
  const lpBusiness = lpBusinessBalance ?? undefined;
  const ecreditscoring = ecreditscoringBalance ?? undefined;
  const lps = lpsBalance ?? undefined;
  const vaults = vaultsBalance ?? undefined;

  // NFT ownership flags
  const hasPassportNFT = typeof passport === 'bigint' && passport > 0n;
  const hasLPIndividualsNFT = typeof lpIndividuals === 'bigint' && lpIndividuals > 0n;
  const hasLPBusinessNFT = typeof lpBusiness === 'bigint' && lpBusiness > 0n;
  const hasEcreditscoringNFT = typeof ecreditscoring === 'bigint' && ecreditscoring > 0n;
  const hasLPsNFT = typeof lps === 'bigint' && lps > 0n;
  const hasVaultsNFT = typeof vaults === 'bigint' && vaults > 0n;

  // Combined checks
  const hasAnyLPNFT = hasLPIndividualsNFT || hasLPBusinessNFT || hasLPsNFT;

  // Calculate user tier (highest tier wins)
  const getUserTier = (): number => {
    if (hasEcreditscoringNFT || hasVaultsNFT) return 3; // VaultCreator
    if (hasAnyLPNFT) return 2; // LimitedPartner
    if (hasPassportNFT || hasActivePassport === true) return 1; // Passport
    return 0; // None
  };

  return {
    // Tier 1: Passport
    hasPassportNFT,
    hasActivePassport: hasActivePassport === true,
    passportBalance: typeof passport === 'bigint' ? passport : undefined,
    verifiedIdentity: verifiedIdentity as {
      uniqueIdentifier: `0x${string}`;
      personhoodProof: `0x${string}`;
      verifiedAt: bigint;
      zkPassportTimestamp: bigint;
      isActive: boolean;
      kycVerified: boolean;
      faceMatchPassed: boolean;
      sanctionsPassed: boolean;
      isOver18: boolean;
    } | undefined,

    // Tier 2: Limited Partner (Individuals or Business)
    hasLPIndividualsNFT,
    hasLPBusinessNFT,
    hasAnyLPNFT,
    lpIndividualsBalance: typeof lpIndividuals === 'bigint' ? lpIndividuals : undefined,
    lpBusinessBalance: typeof lpBusiness === 'bigint' ? lpBusiness : undefined,

    // Tier 3: Vault Creator
    hasEcreditscoringNFT,
    ecreditscoringBalance: typeof ecreditscoring === 'bigint' ? ecreditscoring : undefined,

    // Legacy (backwards compatibility)
    hasLPsNFT,
    hasVaultsNFT,
    lpsBalance: typeof lps === 'bigint' ? lps : undefined,
    vaultsBalance: typeof vaults === 'bigint' ? vaults : undefined,

    // Computed tier
    userTier: getUserTier(),

    // Access control helpers
    canAccessTreasury: getUserTier() >= 1,
    canInvestInVaults: getUserTier() >= 1,
    canAccessLPPools: getUserTier() >= 2,
    canRequestCreditScore: getUserTier() >= 2,
    canCreateVaults: getUserTier() >= 3,

    // Refetch all NFT balances
    refetch: () => {
      refetchPassport();
      refetchLPIndividuals();
      refetchLPBusiness();
      refetchEcreditscoring();
      refetchLPs();
      refetchVaults();
    },
  };
}
