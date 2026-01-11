/**
 * Comprehensive Convexo Protocol Contract Hooks
 * Provides read and write functions for all protocol contracts
 * Version 3.1 - Uses new tier system: Passport (1) → LP_Individuals/LP_Business (2) → Ecreditscoring (3)
 */

import { useAccount, useChainId, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { getContractsForChain, ERC20_ABI } from '@/lib/contracts/addresses';
import {
  ConvexoPassportABI,
  LPIndividualsABI,
  LPBusinessABI,
  EcreditscoringABI,
  ReputationManagerABI,
  VaultFactoryABI,
  PoolRegistryABI,
  PriceFeedManagerABI,
  ReputationTier,
  type ReputationDetails,
  type VerifiedIdentity,
} from '@/lib/contracts/abis';

// ============================================
// LP INDIVIDUALS NFT HOOKS (Tier 2 - Veriff KYC)
// ============================================

export function useLPIndividuals() {
  const { address } = useAccount();
  const chainId = useChainId();
  const contracts = getContractsForChain(chainId);

  // Read: Get balance
  const { data: balance, isLoading: isLoadingBalance, refetch: refetchBalance } = useReadContract({
    address: contracts?.LP_INDIVIDUALS,
    abi: LPIndividualsABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!contracts },
  });

  // Read: Get token state (active/inactive)
  const useTokenState = (tokenId: bigint) => {
    return useReadContract({
      address: contracts?.LP_INDIVIDUALS,
      abi: LPIndividualsABI,
      functionName: 'getTokenState',
      args: [tokenId],
      query: { enabled: !!contracts },
    });
  };

  // Read: Get token URI
  const useTokenURI = (tokenId: bigint) => {
    return useReadContract({
      address: contracts?.LP_INDIVIDUALS,
      abi: LPIndividualsABI,
      functionName: 'tokenURI',
      args: [tokenId],
      query: { enabled: !!contracts },
    });
  };

  return {
    balance: balance as bigint | undefined,
    hasNFT: balance ? (balance as bigint) > 0n : false,
    isLoadingBalance,
    refetchBalance,
    useTokenState,
    useTokenURI,
  };
}

// ============================================
// LP BUSINESS NFT HOOKS (Tier 2 - Sumsub KYB)
// ============================================

export function useLPBusiness() {
  const { address } = useAccount();
  const chainId = useChainId();
  const contracts = getContractsForChain(chainId);

  // Read: Get balance
  const { data: balance, isLoading: isLoadingBalance, refetch: refetchBalance } = useReadContract({
    address: contracts?.LP_BUSINESS,
    abi: LPBusinessABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!contracts },
  });

  // Read: Get token state
  const useTokenState = (tokenId: bigint) => {
    return useReadContract({
      address: contracts?.LP_BUSINESS,
      abi: LPBusinessABI,
      functionName: 'getTokenState',
      args: [tokenId],
      query: { enabled: !!contracts },
    });
  };

  // Read: Get company ID for token
  const useCompanyId = (tokenId: bigint) => {
    return useReadContract({
      address: contracts?.LP_BUSINESS,
      abi: LPBusinessABI,
      functionName: 'getCompanyId',
      args: [tokenId],
      query: { enabled: !!contracts },
    });
  };

  return {
    balance: balance as bigint | undefined,
    hasNFT: balance ? (balance as bigint) > 0n : false,
    isLoadingBalance,
    refetchBalance,
    useTokenState,
    useCompanyId,
  };
}

// ============================================
// ECREDITSCORING NFT HOOKS (Tier 3 - AI Credit Score)
// ============================================

export function useEcreditscoring() {
  const { address } = useAccount();
  const chainId = useChainId();
  const contracts = getContractsForChain(chainId);

  // Read: Get balance
  const { data: balance, isLoading: isLoadingBalance, refetch: refetchBalance } = useReadContract({
    address: contracts?.ECREDITSCORING,
    abi: EcreditscoringABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!contracts },
  });

  // Read: Get credit score for token
  const useCreditScore = (tokenId: bigint) => {
    return useReadContract({
      address: contracts?.ECREDITSCORING,
      abi: EcreditscoringABI,
      functionName: 'getCreditScore',
      args: [tokenId],
      query: { enabled: !!contracts },
    });
  };

  // Read: Get token URI
  const useTokenURI = (tokenId: bigint) => {
    return useReadContract({
      address: contracts?.ECREDITSCORING,
      abi: EcreditscoringABI,
      functionName: 'tokenURI',
      args: [tokenId],
      query: { enabled: !!contracts },
    });
  };

  return {
    balance: balance as bigint | undefined,
    hasNFT: balance ? (balance as bigint) > 0n : false,
    isLoadingBalance,
    refetchBalance,
    useCreditScore,
    useTokenURI,
  };
}

// ============================================
// CONVEXO PASSPORT HOOKS (Tier 1 - ZKPassport)
// ============================================

export function useConvexoPassport() {
  const { address } = useAccount();
  const chainId = useChainId();
  const contracts = getContractsForChain(chainId);

  // Read: Get balance
  const { data: balance, isLoading: isLoadingBalance, refetch: refetchBalance } = useReadContract({
    address: contracts?.CONVEXO_PASSPORT,
    abi: ConvexoPassportABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!contracts },
  });

  // Read: Check if holds active passport
  const { data: hasActivePassport, isLoading: isLoadingActive, refetch: refetchActive } = useReadContract({
    address: contracts?.CONVEXO_PASSPORT,
    abi: ConvexoPassportABI,
    functionName: 'holdsActivePassport',
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!contracts },
  });

  // Read: Get verified identity
  const { data: verifiedIdentity, isLoading: isLoadingIdentity, refetch: refetchIdentity } = useReadContract({
    address: contracts?.CONVEXO_PASSPORT,
    abi: ConvexoPassportABI,
    functionName: 'getVerifiedIdentity',
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!contracts },
  });

  // Read: Get active passport count
  const { data: activeCount, isLoading: isLoadingCount } = useReadContract({
    address: contracts?.CONVEXO_PASSPORT,
    abi: ConvexoPassportABI,
    functionName: 'getActivePassportCount',
    query: { enabled: !!contracts },
  });

  // Write: Mint passport with ZK proof
  const { writeContract: mintWithZKPassport, data: mintHash, isPending: isMinting } = useWriteContract();
  const { isLoading: isConfirmingMint, isSuccess: isMintSuccess } = useWaitForTransactionReceipt({ hash: mintHash });

  const mintPassportWithZK = async (params: {
    publicKey: `0x${string}`;
    nullifier: `0x${string}`;
    proof: `0x${string}`;
    attestationId: bigint;
    scope: `0x${string}`;
    currentDate: bigint;
  }, isIDCard: boolean) => {
    if (!contracts) throw new Error('Contracts not available');
    return mintWithZKPassport({
      address: contracts.CONVEXO_PASSPORT,
      abi: ConvexoPassportABI,
      functionName: 'safeMintWithZKPassport',
      args: [params, isIDCard],
    });
  };

  // Write: Mint passport with identifier (admin only)
  const mintPassportWithIdentifier = async (identifier: `0x${string}`) => {
    if (!contracts) throw new Error('Contracts not available');
    return mintWithZKPassport({
      address: contracts.CONVEXO_PASSPORT,
      abi: ConvexoPassportABI,
      functionName: 'safeMintWithZKPassport',
      args: [identifier],
    });
  };

  return {
    balance: balance as bigint | undefined,
    hasPassport: balance ? (balance as bigint) > 0n : false,
    hasActivePassport: hasActivePassport === true,
    verifiedIdentity: verifiedIdentity as VerifiedIdentity | undefined,
    activeCount: activeCount as bigint | undefined,
    isLoading: isLoadingBalance || isLoadingActive || isLoadingIdentity,
    isLoadingCount,
    refetch: () => {
      refetchBalance();
      refetchActive();
      refetchIdentity();
    },
    // Write functions
    mintPassportWithZK,
    mintPassportWithIdentifier,
    isMinting,
    isConfirmingMint,
    isMintSuccess,
    mintHash,
  };
}

// ============================================
// REPUTATION MANAGER HOOKS
// ============================================

export function useReputationManager() {
  const { address } = useAccount();
  const chainId = useChainId();
  const contracts = getContractsForChain(chainId);

  // Read: Get reputation tier
  const { data: tier, isLoading: isLoadingTier, refetch: refetchTier } = useReadContract({
    address: contracts?.REPUTATION_MANAGER,
    abi: ReputationManagerABI,
    functionName: 'getReputationTier',
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!contracts },
  });

  // Read: Get reputation tier (numeric)
  const { data: tierNumeric } = useReadContract({
    address: contracts?.REPUTATION_MANAGER,
    abi: ReputationManagerABI,
    functionName: 'getReputationTierNumeric',
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!contracts },
  });

  // Read: Get full reputation details
  const { data: details, isLoading: isLoadingDetails, refetch: refetchDetails } = useReadContract({
    address: contracts?.REPUTATION_MANAGER,
    abi: ReputationManagerABI,
    functionName: 'getReputationDetails',
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!contracts },
  });

  // Read: Check specific access levels
  const { data: hasCompliantAccess } = useReadContract({
    address: contracts?.REPUTATION_MANAGER,
    abi: ReputationManagerABI,
    functionName: 'hasCompliantAccess',
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!contracts },
  });

  const { data: hasCreditscoreAccess } = useReadContract({
    address: contracts?.REPUTATION_MANAGER,
    abi: ReputationManagerABI,
    functionName: 'hasCreditscoreAccess',
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!contracts },
  });

  const { data: hasLimitedPartnerAccess } = useReadContract({
    address: contracts?.REPUTATION_MANAGER,
    abi: ReputationManagerABI,
    functionName: 'hasLimitedPartnerAccess',
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!contracts },
  });

  const { data: hasVaultCreatorAccess } = useReadContract({
    address: contracts?.REPUTATION_MANAGER,
    abi: ReputationManagerABI,
    functionName: 'hasVaultCreatorAccess',
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!contracts },
  });

  const { data: hasPassportAccess } = useReadContract({
    address: contracts?.REPUTATION_MANAGER,
    abi: ReputationManagerABI,
    functionName: 'hasPassportAccess',
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!contracts },
  });

  // Read: Check protocol access
  const { data: canAccessLPPools } = useReadContract({
    address: contracts?.REPUTATION_MANAGER,
    abi: ReputationManagerABI,
    functionName: 'canAccessLPPools',
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!contracts },
  });

  const { data: canCreateVaults } = useReadContract({
    address: contracts?.REPUTATION_MANAGER,
    abi: ReputationManagerABI,
    functionName: 'canCreateVaults',
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!contracts },
  });

  const { data: canInvestInVaults } = useReadContract({
    address: contracts?.REPUTATION_MANAGER,
    abi: ReputationManagerABI,
    functionName: 'canInvestInVaults',
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!contracts },
  });

  const { data: canCreateTreasury } = useReadContract({
    address: contracts?.REPUTATION_MANAGER,
    abi: ReputationManagerABI,
    functionName: 'canCreateTreasury',
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!contracts },
  });

  // Read: Check NFT holdings
  const { data: holdsLPIndividuals } = useReadContract({
    address: contracts?.REPUTATION_MANAGER,
    abi: ReputationManagerABI,
    functionName: 'holdsLPIndividuals',
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!contracts },
  });

  const { data: holdsLPBusiness } = useReadContract({
    address: contracts?.REPUTATION_MANAGER,
    abi: ReputationManagerABI,
    functionName: 'holdsLPBusiness',
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!contracts },
  });

  const { data: holdsEcreditscoring } = useReadContract({
    address: contracts?.REPUTATION_MANAGER,
    abi: ReputationManagerABI,
    functionName: 'holdsEcreditscoring',
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!contracts },
  });

  const { data: holdsPassport } = useReadContract({
    address: contracts?.REPUTATION_MANAGER,
    abi: ReputationManagerABI,
    functionName: 'holdsConvexoPassport',
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!contracts },
  });

  // Parse reputation details
  // Returns: [tier, passportBalance, lpIndividualsBalance, lpBusinessBalance, ecreditscoringBalance]
  const parsedDetails = details as [number, bigint, bigint, bigint, bigint] | undefined;
  const reputationDetails: ReputationDetails | undefined = parsedDetails ? {
    tier: parsedDetails[0] as ReputationTier,
    passportBalance: parsedDetails[1],
    lpIndividualsBalance: parsedDetails[2],
    lpBusinessBalance: parsedDetails[3],
    ecreditscoringBalance: parsedDetails[4],
  } : undefined;

  return {
    tier: tier as number | undefined,
    tierNumeric: tierNumeric as bigint | undefined,
    details: reputationDetails,
    isLoading: isLoadingTier || isLoadingDetails,
    refetch: () => {
      refetchTier();
      refetchDetails();
    },
    // Access levels
    hasCompliantAccess: hasCompliantAccess === true,
    hasCreditscoreAccess: hasCreditscoreAccess === true,
    hasLimitedPartnerAccess: hasLimitedPartnerAccess === true,
    hasVaultCreatorAccess: hasVaultCreatorAccess === true,
    hasPassportAccess: hasPassportAccess === true,
    // Protocol access
    canAccessLPPools: canAccessLPPools === true,
    canCreateVaults: canCreateVaults === true,
    canInvestInVaults: canInvestInVaults === true,
    canCreateTreasury: canCreateTreasury === true,
    // NFT holdings (new names)
    holdsLPIndividuals: holdsLPIndividuals === true,
    holdsLPBusiness: holdsLPBusiness === true,
    holdsEcreditscoring: holdsEcreditscoring === true,
    holdsPassport: holdsPassport === true,
  };
}

// ============================================
// VAULT FACTORY HOOKS
// ============================================

export function useVaultFactory() {
  const { address } = useAccount();
  const chainId = useChainId();
  const contracts = getContractsForChain(chainId);

  // Read: Get vault count
  const { data: vaultCount, isLoading: isLoadingCount, refetch: refetchCount } = useReadContract({
    address: contracts?.VAULT_FACTORY,
    abi: VaultFactoryABI,
    functionName: 'getVaultCount',
    query: { enabled: !!contracts },
  });

  // Read: Get vault by ID
  const useVault = (vaultId: bigint) => {
    return useReadContract({
      address: contracts?.VAULT_FACTORY,
      abi: VaultFactoryABI,
      functionName: 'getVault',
      args: [vaultId],
      query: { enabled: !!contracts },
    });
  };

  // Read: Get vault address at index
  const useVaultAddressAtIndex = (index: bigint) => {
    return useReadContract({
      address: contracts?.VAULT_FACTORY,
      abi: VaultFactoryABI,
      functionName: 'getVaultAddressAtIndex',
      args: [index],
      query: { enabled: !!contracts },
    });
  };

  // Write: Create vault
  const { writeContract: createVaultWrite, data: createHash, isPending: isCreating, error: createError } = useWriteContract();
  const { isLoading: isConfirmingCreate, isSuccess: isCreateSuccess } = useWaitForTransactionReceipt({ hash: createHash });

  const createVault = async (params: {
    principalAmount: bigint;
    interestRate: bigint;
    protocolFeeRate: bigint;
    maturityDate: bigint;
    name: string;
    symbol: string;
  }) => {
    if (!contracts) throw new Error('Contracts not available');
    return createVaultWrite({
      address: contracts.VAULT_FACTORY,
      abi: VaultFactoryABI,
      functionName: 'createVault',
      args: [
        params.principalAmount,
        params.interestRate,
        params.protocolFeeRate,
        params.maturityDate,
        params.name,
        params.symbol,
      ],
    });
  };

  return {
    vaultCount: vaultCount as bigint | undefined,
    isLoadingCount,
    refetchCount,
    useVault,
    useVaultAddressAtIndex,
    // Write functions
    createVault,
    isCreating,
    isConfirmingCreate,
    isCreateSuccess,
    createHash,
    createError,
  };
}

// ============================================
// USDC TOKEN HOOKS
// ============================================

export function useUSDC() {
  const { address } = useAccount();
  const chainId = useChainId();
  const contracts = getContractsForChain(chainId);

  // Read: Get USDC balance
  const { data: balance, isLoading: isLoadingBalance, refetch: refetchBalance } = useReadContract({
    address: contracts?.USDC,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!contracts },
  });

  // Read: Get allowance for a spender
  const useAllowance = (spender: `0x${string}`) => {
    return useReadContract({
      address: contracts?.USDC,
      abi: ERC20_ABI,
      functionName: 'allowance',
      args: address && spender ? [address, spender] : undefined,
      query: { enabled: !!address && !!contracts && !!spender },
    });
  };

  // Write: Approve USDC spending
  const { writeContract: approveWrite, data: approveHash, isPending: isApproving } = useWriteContract();
  const { isLoading: isConfirmingApprove, isSuccess: isApproveSuccess } = useWaitForTransactionReceipt({ hash: approveHash });

  const approve = async (spender: `0x${string}`, amount: bigint) => {
    if (!contracts) throw new Error('Contracts not available');
    return approveWrite({
      address: contracts.USDC,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [spender, amount],
    });
  };

  // Write: Transfer USDC
  const { writeContract: transferWrite, data: transferHash, isPending: isTransferring } = useWriteContract();
  const { isLoading: isConfirmingTransfer, isSuccess: isTransferSuccess } = useWaitForTransactionReceipt({ hash: transferHash });

  const transfer = async (to: `0x${string}`, amount: bigint) => {
    if (!contracts) throw new Error('Contracts not available');
    return transferWrite({
      address: contracts.USDC,
      abi: ERC20_ABI,
      functionName: 'transfer',
      args: [to, amount],
    });
  };

  return {
    balance: balance as bigint | undefined,
    isLoadingBalance,
    refetchBalance,
    useAllowance,
    // Write functions
    approve,
    isApproving,
    isConfirmingApprove,
    isApproveSuccess,
    approveHash,
    transfer,
    isTransferring,
    isConfirmingTransfer,
    isTransferSuccess,
    transferHash,
  };
}

// ============================================
// POOL REGISTRY HOOKS
// ============================================

export function usePoolRegistry() {
  const chainId = useChainId();
  const contracts = getContractsForChain(chainId);

  // Read operations would go here for pool registry
  // This is a placeholder for pool-related functionality
  
  return {
    contractAddress: contracts?.POOL_REGISTRY,
    isAvailable: !!contracts,
  };
}

// ============================================
// PRICE FEED MANAGER HOOKS
// ============================================

export function usePriceFeedManager() {
  const chainId = useChainId();
  const contracts = getContractsForChain(chainId);

  // Read operations would go here for price feed
  // This is a placeholder for price-related functionality

  return {
    contractAddress: contracts?.PRICE_FEED_MANAGER,
    isAvailable: !!contracts,
  };
}

// ============================================
// COMBINED HOOKS FOR CONVENIENCE
// ============================================

export function useConvexoProtocol() {
  const lpIndividuals = useLPIndividuals();
  const lpBusiness = useLPBusiness();
  const ecreditscoring = useEcreditscoring();
  const passport = useConvexoPassport();
  const reputation = useReputationManager();
  const vaultFactory = useVaultFactory();
  const usdc = useUSDC();

  return {
    // NFT holdings (Tier System)
    nfts: {
      passport,           // Tier 1
      lpIndividuals,      // Tier 2
      lpBusiness,         // Tier 2
      ecreditscoring,     // Tier 3
    },
    // Reputation
    reputation,
    // Factories
    vaultFactory,
    // Tokens
    usdc,
    // Convenience
    isFullyVerified: passport.hasActivePassport && reputation.hasPassportAccess,
    canAccessProtocol: reputation.hasCompliantAccess,
  };
}


