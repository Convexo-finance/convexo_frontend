/**
 * Verification Contract Hooks
 * Complete read and write functions for VeriffVerifier contract
 */

import { useAccount, useChainId, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { getContractsForChain } from '@/lib/contracts/addresses';
import { VeriffVerifierABI, type VerificationRecord, VerificationStatus, getVerificationStatusLabel } from '@/lib/contracts/abis';

// ============================================
// VERIFICATION STATUS HOOKS
// ============================================

export function useVerificationStatus(userAddress?: `0x${string}`) {
  const { address } = useAccount();
  const chainId = useChainId();
  const contracts = getContractsForChain(chainId);
  const user = userAddress ?? address;

  const { data: status, isLoading, refetch, error } = useReadContract({
    address: contracts?.VERIFF_VERIFIER,
    abi: VeriffVerifierABI,
    functionName: 'getVerificationStatus',
    args: user ? [user] : undefined,
    query: { enabled: !!user && !!contracts },
  });

  const parsed = status as [
    `0x${string}`,  // user
    string,         // veriffSessionId
    number,         // status
    bigint,         // submittedAt
    bigint,         // processedAt
    `0x${string}`,  // processor
    string,         // rejectionReason
    bigint,         // nftTokenId
  ] | undefined;

  const verificationRecord: VerificationRecord | undefined = parsed ? {
    user: parsed[0],
    veriffSessionId: parsed[1],
    status: parsed[2],
    submittedAt: parsed[3],
    processedAt: parsed[4],
    processor: parsed[5],
    rejectionReason: parsed[6],
    nftTokenId: parsed[7],
  } : undefined;

  const statusEnum = verificationRecord?.status;
  const statusLabel = statusEnum !== undefined ? getVerificationStatusLabel(statusEnum) : undefined;

  return {
    verification: verificationRecord,
    status: statusEnum,
    statusLabel,
    isLoading,
    refetch,
    error,
    // Convenience flags
    isNone: statusEnum === VerificationStatus.None,
    isPending: statusEnum === VerificationStatus.Pending,
    isApproved: statusEnum === VerificationStatus.Approved,
    isRejected: statusEnum === VerificationStatus.Rejected,
    hasNFT: verificationRecord ? verificationRecord.nftTokenId > 0n : false,
  };
}

export function useIsVerified(userAddress?: `0x${string}`) {
  const { address } = useAccount();
  const chainId = useChainId();
  const contracts = getContractsForChain(chainId);
  const user = userAddress ?? address;

  const { data: isVerified, isLoading, refetch, error } = useReadContract({
    address: contracts?.VERIFF_VERIFIER,
    abi: VeriffVerifierABI,
    functionName: 'isVerified',
    args: user ? [user] : undefined,
    query: { enabled: !!user && !!contracts },
  });

  return { isVerified: isVerified === true, isLoading, refetch, error };
}

// ============================================
// SESSION HOOKS
// ============================================

export function useIsSessionIdUsed(sessionId?: string) {
  const chainId = useChainId();
  const contracts = getContractsForChain(chainId);

  const { data: isUsed, isLoading, refetch, error } = useReadContract({
    address: contracts?.VERIFF_VERIFIER,
    abi: VeriffVerifierABI,
    functionName: 'isSessionIdUsed',
    args: sessionId ? [sessionId] : undefined,
    query: { enabled: !!sessionId && !!contracts },
  });

  return { isUsed: isUsed === true, isLoading, refetch, error };
}

export function useUserBySessionId(sessionId?: string) {
  const chainId = useChainId();
  const contracts = getContractsForChain(chainId);

  const { data: user, isLoading, refetch, error } = useReadContract({
    address: contracts?.VERIFF_VERIFIER,
    abi: VeriffVerifierABI,
    functionName: 'getUserBySessionId',
    args: sessionId ? [sessionId] : undefined,
    query: { enabled: !!sessionId && !!contracts },
  });

  return { 
    user: user as `0x${string}` | undefined, 
    hasUser: user && user !== '0x0000000000000000000000000000000000000000',
    isLoading, 
    refetch, 
    error 
  };
}

// ============================================
// WRITE HOOKS - USER
// ============================================

export function useSubmitVerification() {
  const { address } = useAccount();
  const chainId = useChainId();
  const contracts = getContractsForChain(chainId);

  const { writeContract: submit, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const submitVerification = async (sessionId: string, userAddress?: `0x${string}`) => {
    if (!contracts) throw new Error('Contracts not available');
    const user = userAddress ?? address;
    if (!user) throw new Error('User address required');
    
    return submit({
      address: contracts.VERIFF_VERIFIER,
      abi: VeriffVerifierABI,
      functionName: 'submitVerification',
      args: [user, sessionId],
    });
  };

  return { submitVerification, isPending, isConfirming, isSuccess, hash, error };
}

// ============================================
// WRITE HOOKS - ADMIN/VERIFIER
// ============================================

export function useApproveVerification() {
  const chainId = useChainId();
  const contracts = getContractsForChain(chainId);

  const { writeContract: approve, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const approveVerification = async (userAddress: `0x${string}`) => {
    if (!contracts) throw new Error('Contracts not available');
    return approve({
      address: contracts.VERIFF_VERIFIER,
      abi: VeriffVerifierABI,
      functionName: 'approveVerification',
      args: [userAddress],
    });
  };

  return { approveVerification, isPending, isConfirming, isSuccess, hash, error };
}

export function useRejectVerification() {
  const chainId = useChainId();
  const contracts = getContractsForChain(chainId);

  const { writeContract: reject, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const rejectVerification = async (userAddress: `0x${string}`, reason: string) => {
    if (!contracts) throw new Error('Contracts not available');
    return reject({
      address: contracts.VERIFF_VERIFIER,
      abi: VeriffVerifierABI,
      functionName: 'rejectVerification',
      args: [userAddress, reason],
    });
  };

  return { rejectVerification, isPending, isConfirming, isSuccess, hash, error };
}

export function useResetVerification() {
  const chainId = useChainId();
  const contracts = getContractsForChain(chainId);

  const { writeContract: reset, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const resetVerification = async (userAddress: `0x${string}`) => {
    if (!contracts) throw new Error('Contracts not available');
    return reset({
      address: contracts.VERIFF_VERIFIER,
      abi: VeriffVerifierABI,
      functionName: 'resetVerification',
      args: [userAddress],
    });
  };

  return { resetVerification, isPending, isConfirming, isSuccess, hash, error };
}

// ============================================
// ROLE HOOKS
// ============================================

export function useVerifierRole() {
  const { address } = useAccount();
  const chainId = useChainId();
  const contracts = getContractsForChain(chainId);

  // Get VERIFIER_ROLE
  const { data: verifierRole } = useReadContract({
    address: contracts?.VERIFF_VERIFIER,
    abi: VeriffVerifierABI,
    functionName: 'VERIFIER_ROLE',
    query: { enabled: !!contracts },
  });

  // Check if current user has VERIFIER_ROLE
  const { data: hasRole, isLoading, refetch } = useReadContract({
    address: contracts?.VERIFF_VERIFIER,
    abi: VeriffVerifierABI,
    functionName: 'hasRole',
    args: verifierRole && address ? [verifierRole as `0x${string}`, address] : undefined,
    query: { enabled: !!verifierRole && !!address && !!contracts },
  });

  // Get DEFAULT_ADMIN_ROLE
  const { data: adminRole } = useReadContract({
    address: contracts?.VERIFF_VERIFIER,
    abi: VeriffVerifierABI,
    functionName: 'DEFAULT_ADMIN_ROLE',
    query: { enabled: !!contracts },
  });

  // Check if current user has DEFAULT_ADMIN_ROLE
  const { data: hasAdminRole } = useReadContract({
    address: contracts?.VERIFF_VERIFIER,
    abi: VeriffVerifierABI,
    functionName: 'hasRole',
    args: adminRole && address ? [adminRole as `0x${string}`, address] : undefined,
    query: { enabled: !!adminRole && !!address && !!contracts },
  });

  return {
    verifierRole: verifierRole as `0x${string}` | undefined,
    hasVerifierRole: hasRole === true,
    adminRole: adminRole as `0x${string}` | undefined,
    hasAdminRole: hasAdminRole === true,
    isLoading,
    refetch,
    canVerify: hasRole === true || hasAdminRole === true,
  };
}

// ============================================
// COMPREHENSIVE VERIFICATION HOOK
// ============================================

export function useVerification(userAddress?: `0x${string}`) {
  const { address } = useAccount();
  const user = userAddress ?? address;

  // Read hooks
  const status = useVerificationStatus(user);
  const isVerified = useIsVerified(user);
  const roles = useVerifierRole();

  // Write hooks
  const submit = useSubmitVerification();
  const approve = useApproveVerification();
  const reject = useRejectVerification();
  const reset = useResetVerification();

  return {
    // User address
    userAddress: user,
    // Read data
    ...status,
    isVerified: isVerified.isVerified,
    // Roles
    ...roles,
    // Write functions
    submit,
    approve,
    reject,
    reset,
    // Computed
    canSubmit: status.isNone || status.isRejected,
    needsVerification: !isVerified.isVerified && !status.isPending,
  };
}

// ============================================
// VERIFICATION FLOW HELPER
// ============================================

export function useVerificationFlow() {
  const { address } = useAccount();
  const verification = useVerification();
  
  // State machine for verification flow
  const getCurrentStep = () => {
    if (verification.isVerified) return 'completed';
    if (verification.isApproved) return 'approved';
    if (verification.isPending) return 'pending';
    if (verification.isRejected) return 'rejected';
    return 'not_started';
  };

  const getNextAction = () => {
    const step = getCurrentStep();
    switch (step) {
      case 'not_started':
      case 'rejected':
        return 'submit';
      case 'pending':
        return 'wait';
      case 'approved':
      case 'completed':
        return 'none';
      default:
        return 'unknown';
    }
  };

  return {
    ...verification,
    currentStep: getCurrentStep(),
    nextAction: getNextAction(),
    isComplete: verification.isVerified,
    requiresAction: getNextAction() === 'submit',
    isWaiting: getNextAction() === 'wait',
  };
}


