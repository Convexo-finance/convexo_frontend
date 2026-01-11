/**
 * NFT Balance Hook - Version 3.2
 * 
 * Tier System:
 * - Tier 1: Convexo_Passport (ZKPassport verified)
 * - Tier 2: LP_Individuals (Veriff) OR LP_Business (Sumsub)
 * - Tier 3: Ecreditscoring (AI Credit Score)
 * 
 * Features:
 * - Automatic refetch on chain switch
 * - Proper query key invalidation per chain
 */

import { useEffect, useCallback, useState } from 'react';
import { useAccount, useChainId, useReadContract } from 'wagmi';
import { getContractsForChain, type ChainId } from '@/lib/contracts/addresses';
import {
  ConvexoPassportABI,
  LPIndividualsABI,
  LPBusinessABI,
  EcreditscoringABI,
} from '@/lib/contracts/abis';

export function useNFTBalance() {
  const { address } = useAccount();
  const chainId = useChainId();
  const contracts = getContractsForChain(chainId);
  const [lastChainId, setLastChainId] = useState<number | null>(null);

  // Debug: Log chain changes
  useEffect(() => {
    console.log(`[useNFTBalance] Chain: ${chainId}, Contracts loaded: ${!!contracts}, Address: ${address?.slice(0, 8)}...`);
    if (contracts) {
      console.log(`[useNFTBalance] CONVEXO_PASSPORT: ${contracts.CONVEXO_PASSPORT}`);
    }
  }, [chainId, contracts, address]);

  // Tier 1: Convexo Passport (ZKPassport verified)
  const { data: passportBalance, refetch: refetchPassport, isLoading: isLoadingPassport } = useReadContract({
    address: contracts?.CONVEXO_PASSPORT,
    abi: ConvexoPassportABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    chainId: chainId as ChainId,
    query: {
      enabled: !!address && !!contracts?.CONVEXO_PASSPORT,
      refetchOnMount: 'always',
      refetchOnWindowFocus: true,
      staleTime: 0,
      gcTime: 0,
    },
  });

  const { data: hasActivePassport, refetch: refetchActivePassport } = useReadContract({
    address: contracts?.CONVEXO_PASSPORT,
    abi: ConvexoPassportABI,
    functionName: 'holdsActivePassport',
    args: address ? [address] : undefined,
    chainId: chainId as ChainId,
    query: {
      enabled: !!address && !!contracts?.CONVEXO_PASSPORT,
      refetchOnMount: 'always',
      refetchOnWindowFocus: true,
      staleTime: 0,
      gcTime: 0,
    },
  });

  const { data: verifiedIdentity, refetch: refetchVerifiedIdentity } = useReadContract({
    address: contracts?.CONVEXO_PASSPORT,
    abi: ConvexoPassportABI,
    functionName: 'getVerifiedIdentity',
    args: address ? [address] : undefined,
    chainId: chainId as ChainId,
    query: {
      enabled: !!address && !!contracts?.CONVEXO_PASSPORT,
      refetchOnMount: 'always',
      refetchOnWindowFocus: true,
      staleTime: 0,
      gcTime: 0,
    },
  });

  // Tier 2: LP Individuals (Veriff verified)
  const { data: lpIndividualsBalance, refetch: refetchLPIndividuals } = useReadContract({
    address: contracts?.LP_INDIVIDUALS,
    abi: LPIndividualsABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    chainId: chainId as ChainId,
    query: {
      enabled: !!address && !!contracts?.LP_INDIVIDUALS,
      refetchOnMount: 'always',
      refetchOnWindowFocus: true,
      staleTime: 0,
      gcTime: 0,
    },
  });

  // Tier 2: LP Business (Sumsub verified)
  const { data: lpBusinessBalance, refetch: refetchLPBusiness } = useReadContract({
    address: contracts?.LP_BUSINESS,
    abi: LPBusinessABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    chainId: chainId as ChainId,
    query: {
      enabled: !!address && !!contracts?.LP_BUSINESS,
      refetchOnMount: 'always',
      refetchOnWindowFocus: true,
      staleTime: 0,
      gcTime: 0,
    },
  });

  // Tier 3: Ecreditscoring (AI Credit Score)
  const { data: ecreditscoringBalance, refetch: refetchEcreditscoring } = useReadContract({
    address: contracts?.ECREDITSCORING,
    abi: EcreditscoringABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    chainId: chainId as ChainId,
    query: {
      enabled: !!address && !!contracts?.ECREDITSCORING,
      refetchOnMount: 'always',
      refetchOnWindowFocus: true,
      staleTime: 0,
      gcTime: 0,
    },
  });

  // Parse balances
  const passport = passportBalance ?? undefined;
  const lpIndividuals = lpIndividualsBalance ?? undefined;
  const lpBusiness = lpBusinessBalance ?? undefined;
  const ecreditscoring = ecreditscoringBalance ?? undefined;

  // NFT ownership flags
  const hasPassportNFT = typeof passport === 'bigint' && passport > 0n;
  const hasLPIndividualsNFT = typeof lpIndividuals === 'bigint' && lpIndividuals > 0n;
  const hasLPBusinessNFT = typeof lpBusiness === 'bigint' && lpBusiness > 0n;
  const hasEcreditscoringNFT = typeof ecreditscoring === 'bigint' && ecreditscoring > 0n;

  // Combined checks
  const hasAnyLPNFT = hasLPIndividualsNFT || hasLPBusinessNFT;

  // Calculate user tier (highest tier wins)
  const getUserTier = (): number => {
    if (hasEcreditscoringNFT) return 3; // VaultCreator
    if (hasAnyLPNFT) return 2; // LimitedPartner
    if (hasPassportNFT || hasActivePassport === true) return 1; // Passport
    return 0; // None
  };

  // Force refetch all balances when chain changes
  const refetchAllBalances = useCallback(async () => {
    if (!address || !contracts) {
      console.log(`[useNFTBalance] Skip refetch - no address or contracts`);
      return;
    }
    
    console.log(`[useNFTBalance] 🔄 Refetching ALL balances for chain ${chainId} (${contracts.CHAIN_NAME})`);
    
    try {
      const results = await Promise.all([
        refetchPassport(),
        refetchActivePassport(),
        refetchVerifiedIdentity(),
        refetchLPIndividuals(),
        refetchLPBusiness(),
        refetchEcreditscoring(),
      ]);
      
      console.log(`[useNFTBalance] ✅ Balances refetched:`, {
        passport: results[0].data?.toString(),
        activePassport: results[1].data,
        lpIndividuals: results[3].data?.toString(),
        lpBusiness: results[4].data?.toString(),
        ecreditscoring: results[5].data?.toString(),
      });
    } catch (error) {
      console.error(`[useNFTBalance] ❌ Error refetching balances:`, error);
    }
  }, [address, contracts, chainId, refetchPassport, refetchActivePassport, refetchVerifiedIdentity, refetchLPIndividuals, refetchLPBusiness, refetchEcreditscoring]);

  // Refetch when chain changes
  useEffect(() => {
    if (chainId !== lastChainId) {
      console.log(`[useNFTBalance] 🔀 Chain changed: ${lastChainId} → ${chainId}`);
      setLastChainId(chainId);
      
      // Small delay to ensure contract addresses are updated
      const timer = setTimeout(() => {
        refetchAllBalances();
      }, 200);
      
      return () => clearTimeout(timer);
    }
  }, [chainId, lastChainId, refetchAllBalances]);

  // Also refetch when address changes
  useEffect(() => {
    if (address && contracts) {
      refetchAllBalances();
    }
  }, [address]);

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

    // Computed tier
    userTier: getUserTier(),

    // Access control helpers
    canAccessTreasury: getUserTier() >= 1,
    canInvestInVaults: getUserTier() >= 1,
    canAccessLPPools: getUserTier() >= 2,
    canRequestCreditScore: getUserTier() >= 2,
    canCreateVaults: getUserTier() >= 3,

    // Loading state
    isLoading: isLoadingPassport,

    // Current chain info
    chainId,
    chainName: contracts?.CHAIN_NAME ?? 'Unknown',

    // Refetch all NFT balances
    refetch: refetchAllBalances,
  };
}
