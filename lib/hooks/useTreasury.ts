/**
 * Treasury Contract Hooks
 * Complete read and write functions for treasury factory and individual treasury interactions
 */

import { useAccount, useChainId, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { getContractsForChain, ERC20_ABI } from '@/lib/contracts/addresses';
import { TreasuryFactoryABI, TreasuryVaultABI } from '@/lib/contracts/abis';

// ============================================
// TREASURY FACTORY HOOKS
// ============================================

export function useTreasuryFactory() {
  const { address } = useAccount();
  const chainId = useChainId();
  const contracts = getContractsForChain(chainId);

  // Read: Get total treasury count
  const { data: treasuryCount, isLoading: isLoadingCount, refetch: refetchCount } = useReadContract({
    address: contracts?.TREASURY_FACTORY,
    abi: TreasuryFactoryABI,
    functionName: 'getTreasuryCount',
    query: { enabled: !!contracts },
  });

  // Read: Get treasury by ID
  const useTreasury = (treasuryId: bigint) => {
    return useReadContract({
      address: contracts?.TREASURY_FACTORY,
      abi: TreasuryFactoryABI,
      functionName: 'getTreasury',
      args: [treasuryId],
      query: { enabled: !!contracts },
    });
  };

  // Read: Get treasury address at index
  const useTreasuryAddressAtIndex = (index: bigint) => {
    return useReadContract({
      address: contracts?.TREASURY_FACTORY,
      abi: TreasuryFactoryABI,
      functionName: 'getTreasuryAddressAtIndex',
      args: [index],
      query: { enabled: !!contracts },
    });
  };

  // Read: Get treasuries by owner
  const { data: userTreasuries, isLoading: isLoadingUserTreasuries, refetch: refetchUserTreasuries } = useReadContract({
    address: contracts?.TREASURY_FACTORY,
    abi: TreasuryFactoryABI,
    functionName: 'getTreasuriesByOwner',
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!contracts },
  });

  // Read: Get treasury count by owner
  const { data: userTreasuryCount, isLoading: isLoadingUserCount } = useReadContract({
    address: contracts?.TREASURY_FACTORY,
    abi: TreasuryFactoryABI,
    functionName: 'getTreasuryCountByOwner',
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!contracts },
  });

  // Write: Create treasury
  const { writeContract: createTreasuryWrite, data: createHash, isPending: isCreating, error: createError } = useWriteContract();
  const { isLoading: isConfirmingCreate, isSuccess: isCreateSuccess } = useWaitForTransactionReceipt({ hash: createHash });

  const createTreasury = async (signers: `0x${string}`[], signaturesRequired: bigint) => {
    if (!contracts) throw new Error('Contracts not available');
    return createTreasuryWrite({
      address: contracts.TREASURY_FACTORY,
      abi: TreasuryFactoryABI,
      functionName: 'createTreasury',
      args: [signers, signaturesRequired],
    });
  };

  return {
    // Read data
    treasuryCount: treasuryCount as bigint | undefined,
    userTreasuries: userTreasuries as bigint[] | undefined,
    userTreasuryCount: userTreasuryCount as bigint | undefined,
    // Loading states
    isLoadingCount,
    isLoadingUserTreasuries,
    isLoadingUserCount,
    // Refetch
    refetchCount,
    refetchUserTreasuries,
    // Query hooks
    useTreasury,
    useTreasuryAddressAtIndex,
    // Write functions
    createTreasury,
    isCreating,
    isConfirmingCreate,
    isCreateSuccess,
    createHash,
    createError,
  };
}

// ============================================
// TREASURY VAULT HOOKS
// ============================================

export function useTreasuryVaultInfo(treasuryAddress?: `0x${string}`) {
  // Read: Get signers
  const { data: signers, isLoading: isLoadingSigners, refetch: refetchSigners } = useReadContract({
    address: treasuryAddress,
    abi: TreasuryVaultABI,
    functionName: 'getSigners',
    query: { enabled: !!treasuryAddress },
  });

  // Read: Get signatures required
  const { data: signaturesRequired, isLoading: isLoadingRequired } = useReadContract({
    address: treasuryAddress,
    abi: TreasuryVaultABI,
    functionName: 'signaturesRequired',
    query: { enabled: !!treasuryAddress },
  });

  // Read: Get transaction count
  const { data: transactionCount, isLoading: isLoadingTxCount, refetch: refetchTxCount } = useReadContract({
    address: treasuryAddress,
    abi: TreasuryVaultABI,
    functionName: 'getTransactionCount',
    query: { enabled: !!treasuryAddress },
  });

  // Read: Get owner
  const { data: owner, isLoading: isLoadingOwner } = useReadContract({
    address: treasuryAddress,
    abi: TreasuryVaultABI,
    functionName: 'owner',
    query: { enabled: !!treasuryAddress },
  });

  return {
    signers: signers as `0x${string}`[] | undefined,
    signaturesRequired: signaturesRequired as bigint | undefined,
    transactionCount: transactionCount as bigint | undefined,
    owner: owner as `0x${string}` | undefined,
    isLoading: isLoadingSigners || isLoadingRequired || isLoadingTxCount || isLoadingOwner,
    refetch: () => {
      refetchSigners();
      refetchTxCount();
    },
  };
}

export function useTreasuryTransaction(treasuryAddress?: `0x${string}`, txIndex?: bigint) {
  const { data: transaction, isLoading, refetch } = useReadContract({
    address: treasuryAddress,
    abi: TreasuryVaultABI,
    functionName: 'getTransaction',
    args: txIndex !== undefined ? [txIndex] : undefined,
    query: { enabled: !!treasuryAddress && txIndex !== undefined },
  });

  const parsed = transaction as [
    `0x${string}`,  // to
    bigint,         // value
    `0x${string}`,  // data
    boolean,        // executed
    bigint,         // numConfirmations
  ] | undefined;

  return {
    transaction: parsed ? {
      to: parsed[0],
      value: parsed[1],
      data: parsed[2],
      executed: parsed[3],
      numConfirmations: parsed[4],
    } : undefined,
    isLoading,
    refetch,
  };
}

export function useIsTreasurySigner(treasuryAddress?: `0x${string}`, signerAddress?: `0x${string}`) {
  const { address } = useAccount();
  const signer = signerAddress ?? address;

  const { data: isSigner, isLoading, refetch } = useReadContract({
    address: treasuryAddress,
    abi: TreasuryVaultABI,
    functionName: 'isSigner',
    args: signer ? [signer] : undefined,
    query: { enabled: !!treasuryAddress && !!signer },
  });

  return { isSigner: isSigner === true, isLoading, refetch };
}

export function useHasConfirmed(treasuryAddress?: `0x${string}`, txIndex?: bigint, signerAddress?: `0x${string}`) {
  const { address } = useAccount();
  const signer = signerAddress ?? address;

  const { data: hasConfirmed, isLoading, refetch } = useReadContract({
    address: treasuryAddress,
    abi: TreasuryVaultABI,
    functionName: 'isConfirmed',
    args: txIndex !== undefined && signer ? [txIndex, signer] : undefined,
    query: { enabled: !!treasuryAddress && txIndex !== undefined && !!signer },
  });

  return { hasConfirmed: hasConfirmed === true, isLoading, refetch };
}

// ============================================
// TREASURY VAULT WRITE HOOKS
// ============================================

export function useSubmitTransaction(treasuryAddress?: `0x${string}`) {
  const { writeContract: submit, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const submitTransaction = async (to: `0x${string}`, value: bigint, data: `0x${string}`) => {
    if (!treasuryAddress) throw new Error('Treasury address required');
    return submit({
      address: treasuryAddress,
      abi: TreasuryVaultABI,
      functionName: 'submitTransaction',
      args: [to, value, data],
    });
  };

  return { submitTransaction, isPending, isConfirming, isSuccess, hash, error };
}

export function useConfirmTransaction(treasuryAddress?: `0x${string}`) {
  const { writeContract: confirm, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const confirmTransaction = async (txIndex: bigint) => {
    if (!treasuryAddress) throw new Error('Treasury address required');
    return confirm({
      address: treasuryAddress,
      abi: TreasuryVaultABI,
      functionName: 'confirmTransaction',
      args: [txIndex],
    });
  };

  return { confirmTransaction, isPending, isConfirming, isSuccess, hash, error };
}

export function useRevokeConfirmation(treasuryAddress?: `0x${string}`) {
  const { writeContract: revoke, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const revokeConfirmation = async (txIndex: bigint) => {
    if (!treasuryAddress) throw new Error('Treasury address required');
    return revoke({
      address: treasuryAddress,
      abi: TreasuryVaultABI,
      functionName: 'revokeConfirmation',
      args: [txIndex],
    });
  };

  return { revokeConfirmation, isPending, isConfirming, isSuccess, hash, error };
}

export function useExecuteTransaction(treasuryAddress?: `0x${string}`) {
  const { writeContract: execute, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const executeTransaction = async (txIndex: bigint) => {
    if (!treasuryAddress) throw new Error('Treasury address required');
    return execute({
      address: treasuryAddress,
      abi: TreasuryVaultABI,
      functionName: 'executeTransaction',
      args: [txIndex],
    });
  };

  return { executeTransaction, isPending, isConfirming, isSuccess, hash, error };
}

// ============================================
// TREASURY DEPOSIT HOOKS
// ============================================

export function useDepositToTreasury(treasuryAddress?: `0x${string}`) {
  const chainId = useChainId();
  const contracts = getContractsForChain(chainId);

  // Approve USDC
  const { writeContract: approve, data: approveHash, isPending: isApproving } = useWriteContract();
  const { isLoading: isConfirmingApprove, isSuccess: isApproveSuccess } = useWaitForTransactionReceipt({ hash: approveHash });

  const approveUsdc = async (amount: bigint) => {
    if (!contracts || !treasuryAddress) throw new Error('Contracts not available');
    return approve({
      address: contracts.USDC,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [treasuryAddress, amount],
    });
  };

  // Deposit
  const { writeContract: deposit, data: depositHash, isPending: isDepositing } = useWriteContract();
  const { isLoading: isConfirmingDeposit, isSuccess: isDepositSuccess } = useWaitForTransactionReceipt({ hash: depositHash });

  const depositUsdc = async (amount: bigint) => {
    if (!treasuryAddress) throw new Error('Treasury address required');
    return deposit({
      address: treasuryAddress,
      abi: TreasuryVaultABI,
      functionName: 'deposit',
      args: [amount],
    });
  };

  return {
    approveUsdc,
    isApproving,
    isConfirmingApprove,
    isApproveSuccess,
    approveHash,
    depositUsdc,
    isDepositing,
    isConfirmingDeposit,
    isDepositSuccess,
    depositHash,
  };
}

// ============================================
// COMPREHENSIVE TREASURY HOOK
// ============================================

export function useTreasuryVault(treasuryAddress?: `0x${string}`) {
  const { address } = useAccount();

  // Info hooks
  const info = useTreasuryVaultInfo(treasuryAddress);
  const isSigner = useIsTreasurySigner(treasuryAddress);

  // Write hooks
  const submit = useSubmitTransaction(treasuryAddress);
  const confirm = useConfirmTransaction(treasuryAddress);
  const revoke = useRevokeConfirmation(treasuryAddress);
  const execute = useExecuteTransaction(treasuryAddress);
  const deposit = useDepositToTreasury(treasuryAddress);

  // Computed
  const isOwner = info.owner?.toLowerCase() === address?.toLowerCase();
  const canSign = isSigner.isSigner;

  return {
    // Address
    treasuryAddress,
    // Read data
    ...info,
    isSigner: isSigner.isSigner,
    // Computed
    isOwner,
    canSign,
    // Write functions
    submit,
    confirm,
    revoke,
    execute,
    deposit,
  };
}

// ============================================
// HELPER: TREASURY USDC TRANSFER
// ============================================

export function useTreasuryUsdcTransfer(treasuryAddress?: `0x${string}`) {
  const chainId = useChainId();
  const contracts = getContractsForChain(chainId);
  const submit = useSubmitTransaction(treasuryAddress);

  const submitUsdcTransfer = async (to: `0x${string}`, amount: bigint) => {
    if (!contracts) throw new Error('Contracts not available');
    
    // Encode transfer call data
    const transferData = encodeTransferCall(to, amount);
    
    return submit.submitTransaction(contracts.USDC, 0n, transferData);
  };

  return {
    submitUsdcTransfer,
    ...submit,
  };
}

// Helper to encode ERC20 transfer call
function encodeTransferCall(to: `0x${string}`, amount: bigint): `0x${string}` {
  // transfer(address,uint256) selector = 0xa9059cbb
  const selector = '0xa9059cbb';
  const toParam = to.slice(2).padStart(64, '0');
  const amountParam = amount.toString(16).padStart(64, '0');
  return `${selector}${toParam}${amountParam}` as `0x${string}`;
}


