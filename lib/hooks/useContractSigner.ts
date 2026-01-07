/**
 * Contract Signer Hooks
 * Complete read and write functions for ContractSigner contract
 * Used for digital contract signing and agreement management
 */

import { useAccount, useChainId, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { keccak256, toBytes } from 'viem';
import { getContractsForChain } from '@/lib/contracts/addresses';
import { 
  ContractSignerABI, 
  type ContractDocument, 
  type Signature,
  AgreementType,
} from '@/lib/contracts/abis';

// ============================================
// CONTRACT DOCUMENT HOOKS
// ============================================

export function useContractDocument(documentHash?: `0x${string}`) {
  const chainId = useChainId();
  const contracts = getContractsForChain(chainId);

  const { data: document, isLoading, refetch, error } = useReadContract({
    address: contracts?.CONTRACT_SIGNER,
    abi: ContractSignerABI,
    functionName: 'getContract',
    args: documentHash ? [documentHash] : undefined,
    query: { enabled: !!documentHash && !!contracts },
  });

  const parsed = document as [
    `0x${string}`,  // documentHash
    number,         // agreementType
    `0x${string}`,  // initiator
    bigint,         // createdAt
    bigint,         // expiresAt
    boolean,        // isExecuted
    boolean,        // isCancelled
    string,         // ipfsHash
    bigint,         // nftReputationTier
    bigint,         // vaultId
  ] | undefined;

  const contractDoc: ContractDocument | undefined = parsed ? {
    documentHash: parsed[0],
    agreementType: parsed[1],
    initiator: parsed[2],
    createdAt: parsed[3],
    expiresAt: parsed[4],
    isExecuted: parsed[5],
    isCancelled: parsed[6],
    ipfsHash: parsed[7],
    nftReputationTier: parsed[8],
    vaultId: parsed[9],
  } : undefined;

  return { 
    document: contractDoc, 
    isLoading, 
    refetch, 
    error,
    // Convenience flags
    isActive: contractDoc ? !contractDoc.isExecuted && !contractDoc.isCancelled : false,
    isExpired: contractDoc ? BigInt(Date.now()) / 1000n > contractDoc.expiresAt : false,
  };
}

export function useDocumentExists(documentHash?: `0x${string}`) {
  const chainId = useChainId();
  const contracts = getContractsForChain(chainId);

  const { data: exists, isLoading, refetch, error } = useReadContract({
    address: contracts?.CONTRACT_SIGNER,
    abi: ContractSignerABI,
    functionName: 'documentExists',
    args: documentHash ? [documentHash] : undefined,
    query: { enabled: !!documentHash && !!contracts },
  });

  return { exists: exists === true, isLoading, refetch, error };
}

// ============================================
// CONTRACT COUNT & INDEX HOOKS
// ============================================

export function useContractCount() {
  const chainId = useChainId();
  const contracts = getContractsForChain(chainId);

  const { data: count, isLoading, refetch, error } = useReadContract({
    address: contracts?.CONTRACT_SIGNER,
    abi: ContractSignerABI,
    functionName: 'getContractCount',
    query: { enabled: !!contracts },
  });

  return { count: count as bigint | undefined, isLoading, refetch, error };
}

export function useDocumentHashAtIndex(index?: bigint) {
  const chainId = useChainId();
  const contracts = getContractsForChain(chainId);

  const { data: hash, isLoading, refetch, error } = useReadContract({
    address: contracts?.CONTRACT_SIGNER,
    abi: ContractSignerABI,
    functionName: 'getDocumentHashAtIndex',
    args: index !== undefined ? [index] : undefined,
    query: { enabled: index !== undefined && !!contracts },
  });

  return { documentHash: hash as `0x${string}` | undefined, isLoading, refetch, error };
}

// ============================================
// SIGNATURES HOOKS
// ============================================

export function useContractSignatures(documentHash?: `0x${string}`) {
  const chainId = useChainId();
  const contracts = getContractsForChain(chainId);

  const { data: signatures, isLoading, refetch, error } = useReadContract({
    address: contracts?.CONTRACT_SIGNER,
    abi: ContractSignerABI,
    functionName: 'getSignatures',
    args: documentHash ? [documentHash] : undefined,
    query: { enabled: !!documentHash && !!contracts },
  });

  const parsedSignatures = (signatures as Array<[`0x${string}`, `0x${string}`, bigint, boolean]> | undefined)?.map(sig => ({
    signer: sig[0],
    signature: sig[1],
    timestamp: sig[2],
    isValid: sig[3],
  })) as Signature[] | undefined;

  return { signatures: parsedSignatures, isLoading, refetch, error };
}

export function useRequiredSigners(documentHash?: `0x${string}`) {
  const chainId = useChainId();
  const contracts = getContractsForChain(chainId);

  const { data: signers, isLoading, refetch, error } = useReadContract({
    address: contracts?.CONTRACT_SIGNER,
    abi: ContractSignerABI,
    functionName: 'getRequiredSigners',
    args: documentHash ? [documentHash] : undefined,
    query: { enabled: !!documentHash && !!contracts },
  });

  return { signers: signers as `0x${string}`[] | undefined, isLoading, refetch, error };
}

export function useHasSigned(documentHash?: `0x${string}`, signerAddress?: `0x${string}`) {
  const { address } = useAccount();
  const chainId = useChainId();
  const contracts = getContractsForChain(chainId);
  const signer = signerAddress ?? address;

  const { data: hasSigned, isLoading, refetch, error } = useReadContract({
    address: contracts?.CONTRACT_SIGNER,
    abi: ContractSignerABI,
    functionName: 'hasSigned',
    args: documentHash && signer ? [documentHash, signer] : undefined,
    query: { enabled: !!documentHash && !!signer && !!contracts },
  });

  return { hasSigned: hasSigned === true, isLoading, refetch, error };
}

export function useIsFullySigned(documentHash?: `0x${string}`) {
  const chainId = useChainId();
  const contracts = getContractsForChain(chainId);

  const { data: isFullySigned, isLoading, refetch, error } = useReadContract({
    address: contracts?.CONTRACT_SIGNER,
    abi: ContractSignerABI,
    functionName: 'isFullySigned',
    args: documentHash ? [documentHash] : undefined,
    query: { enabled: !!documentHash && !!contracts },
  });

  return { isFullySigned: isFullySigned === true, isLoading, refetch, error };
}

// ============================================
// WRITE HOOKS
// ============================================

export function useCreateContract() {
  const chainId = useChainId();
  const contracts = getContractsForChain(chainId);

  const { writeContract: create, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const createContract = async (params: {
    documentHash: `0x${string}`;
    agreementType: AgreementType;
    requiredSigners: `0x${string}`[];
    ipfsHash: string;
    nftReputationTier: bigint;
    expiryDuration: bigint;
  }) => {
    if (!contracts) throw new Error('Contracts not available');
    return create({
      address: contracts.CONTRACT_SIGNER,
      abi: ContractSignerABI,
      functionName: 'createContract',
      args: [
        params.documentHash,
        params.agreementType,
        params.requiredSigners,
        params.ipfsHash,
        params.nftReputationTier,
        params.expiryDuration,
      ],
    });
  };

  return { createContract, isPending, isConfirming, isSuccess, hash, error };
}

export function useSignContract() {
  const chainId = useChainId();
  const contracts = getContractsForChain(chainId);

  const { writeContract: sign, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const signContract = async (documentHash: `0x${string}`, signature: `0x${string}`) => {
    if (!contracts) throw new Error('Contracts not available');
    return sign({
      address: contracts.CONTRACT_SIGNER,
      abi: ContractSignerABI,
      functionName: 'signContract',
      args: [documentHash, signature],
    });
  };

  return { signContract, isPending, isConfirming, isSuccess, hash, error };
}

export function useCancelContract() {
  const chainId = useChainId();
  const contracts = getContractsForChain(chainId);

  const { writeContract: cancel, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const cancelContract = async (documentHash: `0x${string}`) => {
    if (!contracts) throw new Error('Contracts not available');
    return cancel({
      address: contracts.CONTRACT_SIGNER,
      abi: ContractSignerABI,
      functionName: 'cancelContract',
      args: [documentHash],
    });
  };

  return { cancelContract, isPending, isConfirming, isSuccess, hash, error };
}

export function useExecuteContract() {
  const chainId = useChainId();
  const contracts = getContractsForChain(chainId);

  const { writeContract: execute, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const executeContract = async (documentHash: `0x${string}`, vaultId: bigint) => {
    if (!contracts) throw new Error('Contracts not available');
    return execute({
      address: contracts.CONTRACT_SIGNER,
      abi: ContractSignerABI,
      functionName: 'executeContract',
      args: [documentHash, vaultId],
    });
  };

  return { executeContract, isPending, isConfirming, isSuccess, hash, error };
}

// ============================================
// ROLE HOOKS
// ============================================

export function useContractSignerRoles() {
  const { address } = useAccount();
  const chainId = useChainId();
  const contracts = getContractsForChain(chainId);

  // Get VERIFIER_ROLE
  const { data: verifierRole } = useReadContract({
    address: contracts?.CONTRACT_SIGNER,
    abi: ContractSignerABI,
    functionName: 'VERIFIER_ROLE',
    query: { enabled: !!contracts },
  });

  // Check if current user has VERIFIER_ROLE
  const { data: hasVerifierRole, isLoading, refetch } = useReadContract({
    address: contracts?.CONTRACT_SIGNER,
    abi: ContractSignerABI,
    functionName: 'hasRole',
    args: verifierRole && address ? [verifierRole as `0x${string}`, address] : undefined,
    query: { enabled: !!verifierRole && !!address && !!contracts },
  });

  // Get DEFAULT_ADMIN_ROLE
  const { data: adminRole } = useReadContract({
    address: contracts?.CONTRACT_SIGNER,
    abi: ContractSignerABI,
    functionName: 'DEFAULT_ADMIN_ROLE',
    query: { enabled: !!contracts },
  });

  // Check if current user has DEFAULT_ADMIN_ROLE
  const { data: hasAdminRole } = useReadContract({
    address: contracts?.CONTRACT_SIGNER,
    abi: ContractSignerABI,
    functionName: 'hasRole',
    args: adminRole && address ? [adminRole as `0x${string}`, address] : undefined,
    query: { enabled: !!adminRole && !!address && !!contracts },
  });

  return {
    verifierRole: verifierRole as `0x${string}` | undefined,
    hasVerifierRole: hasVerifierRole === true,
    adminRole: adminRole as `0x${string}` | undefined,
    hasAdminRole: hasAdminRole === true,
    isLoading,
    refetch,
  };
}

// ============================================
// COMPREHENSIVE CONTRACT SIGNER HOOK
// ============================================

export function useContractSigner(documentHash?: `0x${string}`) {
  const { address } = useAccount();

  // Read hooks
  const document = useContractDocument(documentHash);
  const signatures = useContractSignatures(documentHash);
  const requiredSigners = useRequiredSigners(documentHash);
  const hasSigned = useHasSigned(documentHash);
  const isFullySigned = useIsFullySigned(documentHash);
  const roles = useContractSignerRoles();

  // Write hooks
  const create = useCreateContract();
  const sign = useSignContract();
  const cancel = useCancelContract();
  const execute = useExecuteContract();

  // Computed properties
  const isInitiator = document.document?.initiator.toLowerCase() === address?.toLowerCase();
  const isRequiredSigner = requiredSigners.signers?.some(
    s => s.toLowerCase() === address?.toLowerCase()
  );
  const canSign = isRequiredSigner && !hasSigned.hasSigned && document.isActive;
  const canCancel = isInitiator && document.isActive;
  const canExecute = isFullySigned.isFullySigned && document.isActive;

  return {
    // Document hash
    documentHash,
    // Read data
    document: document.document,
    signatures: signatures.signatures,
    requiredSigners: requiredSigners.signers,
    hasSigned: hasSigned.hasSigned,
    isFullySigned: isFullySigned.isFullySigned,
    isActive: document.isActive,
    isExpired: document.isExpired,
    // Roles
    ...roles,
    // Computed
    isInitiator,
    isRequiredSigner,
    canSign,
    canCancel,
    canExecute,
    // Loading
    isLoading: document.isLoading || signatures.isLoading || requiredSigners.isLoading,
    // Write functions
    create,
    sign,
    cancel,
    execute,
    // Refetch
    refetch: () => {
      document.refetch();
      signatures.refetch();
      requiredSigners.refetch();
      hasSigned.refetch();
      isFullySigned.refetch();
    },
  };
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Generate a document hash from content
 * Use this to create a deterministic hash for contract documents
 */
export function generateDocumentHash(content: string): `0x${string}` {
  return keccak256(toBytes(content));
}

/**
 * Get agreement type label
 */
export function getAgreementTypeLabel(type: AgreementType): string {
  const labels: Record<AgreementType, string> = {
    [AgreementType.Investment]: 'Investment Agreement',
    [AgreementType.Loan]: 'Loan Agreement',
    [AgreementType.Partnership]: 'Partnership Agreement',
    [AgreementType.Other]: 'Other Agreement',
  };
  return labels[type] ?? 'Unknown';
}

/**
 * Default expiry duration (30 days in seconds)
 */
export const DEFAULT_EXPIRY_DURATION = 30n * 24n * 60n * 60n; // 30 days

/**
 * Calculate expiry timestamp from now
 */
export function calculateExpiryTimestamp(durationSeconds: bigint): bigint {
  return BigInt(Math.floor(Date.now() / 1000)) + durationSeconds;
}


