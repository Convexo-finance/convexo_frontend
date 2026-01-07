/**
 * TokenizedBondVault Contract Hooks
 * Complete read and write functions for individual vault interactions
 */

import { useAccount, useChainId, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { getContractsForChain, ERC20_ABI } from '@/lib/contracts/addresses';
import {
  TokenizedBondVaultABI,
  type VaultInfo,
  type VaultMetrics,
  type InvestorReturn,
  type RepaymentStatus,
  type AccruedInterest,
  VaultState,
} from '@/lib/contracts/abis';

// ============================================
// VAULT INFO & METRICS
// ============================================

export function useVaultInfo(vaultAddress?: `0x${string}`) {
  const { data: vaultInfo, isLoading, refetch, error } = useReadContract({
    address: vaultAddress,
    abi: TokenizedBondVaultABI,
    functionName: 'vaultInfo',
    query: { enabled: !!vaultAddress },
  });

  const parsed = vaultInfo as [
    bigint, `0x${string}`, `0x${string}`, bigint, bigint, bigint, bigint, 
    number, bigint, bigint, bigint, bigint, bigint, bigint
  ] | undefined;

  const info: VaultInfo | undefined = parsed ? {
    vaultId: parsed[0],
    borrower: parsed[1],
    contractHash: parsed[2],
    principalAmount: parsed[3],
    interestRate: parsed[4],
    protocolFeeRate: parsed[5],
    maturityDate: parsed[6],
    state: parsed[7],
    totalRaised: parsed[8],
    totalRepaid: parsed[9],
    createdAt: parsed[10],
    fundedAt: parsed[11],
    contractAttachedAt: parsed[12],
    fundsWithdrawnAt: parsed[13],
  } : undefined;

  return { vaultInfo: info, isLoading, refetch, error };
}

export function useVaultMetrics(vaultAddress?: `0x${string}`) {
  const { data: metrics, isLoading, refetch, error } = useReadContract({
    address: vaultAddress,
    abi: TokenizedBondVaultABI,
    functionName: 'getVaultMetrics',
    query: { enabled: !!vaultAddress },
  });

  const parsed = metrics as [bigint, bigint, bigint, bigint, bigint, bigint] | undefined;

  const vaultMetrics: VaultMetrics | undefined = parsed ? {
    totalShares: parsed[0],
    sharePrice: parsed[1],
    totalValueLocked: parsed[2],
    targetAmount: parsed[3],
    fundingProgress: parsed[4],
    currentAPY: parsed[5],
  } : undefined;

  return { metrics: vaultMetrics, isLoading, refetch, error };
}

export function useVaultState(vaultAddress?: `0x${string}`) {
  const { data: state, isLoading, refetch, error } = useReadContract({
    address: vaultAddress,
    abi: TokenizedBondVaultABI,
    functionName: 'getVaultState',
    query: { enabled: !!vaultAddress },
  });

  return { 
    state: state as number | undefined, 
    stateLabel: state !== undefined ? getVaultStateLabel(state as number) : undefined,
    isLoading, 
    refetch, 
    error 
  };
}

// ============================================
// INVESTOR FUNCTIONS
// ============================================

export function useInvestorReturn(vaultAddress?: `0x${string}`, investorAddress?: `0x${string}`) {
  const { address } = useAccount();
  const investor = investorAddress ?? address;

  const { data: returnData, isLoading, refetch, error } = useReadContract({
    address: vaultAddress,
    abi: TokenizedBondVaultABI,
    functionName: 'getInvestorReturn',
    args: investor ? [investor] : undefined,
    query: { enabled: !!vaultAddress && !!investor },
  });

  const parsed = returnData as [bigint, bigint, bigint, bigint] | undefined;

  const investorReturn: InvestorReturn | undefined = parsed ? {
    invested: parsed[0],
    currentValue: parsed[1],
    profit: parsed[2],
    apy: parsed[3],
  } : undefined;

  return { investorReturn, isLoading, refetch, error };
}

export function useIsInvestor(vaultAddress?: `0x${string}`, investorAddress?: `0x${string}`) {
  const { address } = useAccount();
  const investor = investorAddress ?? address;

  const { data: isInvestor, isLoading, refetch, error } = useReadContract({
    address: vaultAddress,
    abi: TokenizedBondVaultABI,
    functionName: 'isInvestorAddress',
    args: investor ? [investor] : undefined,
    query: { enabled: !!vaultAddress && !!investor },
  });

  return { isInvestor: isInvestor === true, isLoading, refetch, error };
}

export function useVaultInvestors(vaultAddress?: `0x${string}`) {
  const { data: investors, isLoading, refetch, error } = useReadContract({
    address: vaultAddress,
    abi: TokenizedBondVaultABI,
    functionName: 'getInvestors',
    query: { enabled: !!vaultAddress },
  });

  return { investors: investors as `0x${string}`[] | undefined, isLoading, refetch, error };
}

// ============================================
// REPAYMENT & BALANCE INFO
// ============================================

export function useRepaymentStatus(vaultAddress?: `0x${string}`) {
  const { data: status, isLoading, refetch, error } = useReadContract({
    address: vaultAddress,
    abi: TokenizedBondVaultABI,
    functionName: 'getRepaymentStatus',
    query: { enabled: !!vaultAddress },
  });

  const parsed = status as [bigint, bigint, bigint, bigint] | undefined;

  const repaymentStatus: RepaymentStatus | undefined = parsed ? {
    totalDue: parsed[0],
    totalPaid: parsed[1],
    remaining: parsed[2],
    protocolFee: parsed[3],
  } : undefined;

  return { repaymentStatus, isLoading, refetch, error };
}

export function useAccruedInterest(vaultAddress?: `0x${string}`) {
  const { data: interest, isLoading, refetch, error } = useReadContract({
    address: vaultAddress,
    abi: TokenizedBondVaultABI,
    functionName: 'getAccruedInterest',
    query: { enabled: !!vaultAddress },
  });

  const parsed = interest as [bigint, bigint] | undefined;

  const accrued: AccruedInterest | undefined = parsed ? {
    accruedInterest: parsed[0],
    remainingInterest: parsed[1],
  } : undefined;

  return { accruedInterest: accrued, isLoading, refetch, error };
}

export function useVaultBalance(vaultAddress?: `0x${string}`) {
  const { data: balance, isLoading, refetch, error } = useReadContract({
    address: vaultAddress,
    abi: TokenizedBondVaultABI,
    functionName: 'getVaultBalance',
    query: { enabled: !!vaultAddress },
  });

  return { balance: balance as bigint | undefined, isLoading, refetch, error };
}

export function useAvailableForInvestors(vaultAddress?: `0x${string}`) {
  const { data: available, isLoading, refetch, error } = useReadContract({
    address: vaultAddress,
    abi: TokenizedBondVaultABI,
    functionName: 'getAvailableForInvestors',
    query: { enabled: !!vaultAddress },
  });

  return { available: available as bigint | undefined, isLoading, refetch, error };
}

export function useShareValue(vaultAddress?: `0x${string}`) {
  const { data: value, isLoading, refetch, error } = useReadContract({
    address: vaultAddress,
    abi: TokenizedBondVaultABI,
    functionName: 'getShareValue',
    query: { enabled: !!vaultAddress },
  });

  return { shareValue: value as bigint | undefined, isLoading, refetch, error };
}

// ============================================
// TOKEN BALANCE & INFO
// ============================================

export function useVaultTokenBalance(vaultAddress?: `0x${string}`, holder?: `0x${string}`) {
  const { address } = useAccount();
  const account = holder ?? address;

  const { data: balance, isLoading, refetch, error } = useReadContract({
    address: vaultAddress,
    abi: TokenizedBondVaultABI,
    functionName: 'balanceOf',
    args: account ? [account] : undefined,
    query: { enabled: !!vaultAddress && !!account },
  });

  return { balance: balance as bigint | undefined, isLoading, refetch, error };
}

export function useVaultTokenSupply(vaultAddress?: `0x${string}`) {
  const { data: supply, isLoading, refetch, error } = useReadContract({
    address: vaultAddress,
    abi: TokenizedBondVaultABI,
    functionName: 'totalSupply',
    query: { enabled: !!vaultAddress },
  });

  return { totalSupply: supply as bigint | undefined, isLoading, refetch, error };
}

export function useVaultTokenName(vaultAddress?: `0x${string}`) {
  const { data: name, isLoading, error } = useReadContract({
    address: vaultAddress,
    abi: TokenizedBondVaultABI,
    functionName: 'name',
    query: { enabled: !!vaultAddress },
  });

  return { name: name as string | undefined, isLoading, error };
}

export function useVaultTokenSymbol(vaultAddress?: `0x${string}`) {
  const { data: symbol, isLoading, error } = useReadContract({
    address: vaultAddress,
    abi: TokenizedBondVaultABI,
    functionName: 'symbol',
    query: { enabled: !!vaultAddress },
  });

  return { symbol: symbol as string | undefined, isLoading, error };
}

// ============================================
// TIMESTAMPS
// ============================================

export function useVaultTimestamps(vaultAddress?: `0x${string}`) {
  const { data: createdAt } = useReadContract({
    address: vaultAddress,
    abi: TokenizedBondVaultABI,
    functionName: 'getVaultCreatedAt',
    query: { enabled: !!vaultAddress },
  });

  const { data: fundedAt } = useReadContract({
    address: vaultAddress,
    abi: TokenizedBondVaultABI,
    functionName: 'getVaultFundedAt',
    query: { enabled: !!vaultAddress },
  });

  const { data: contractAttachedAt } = useReadContract({
    address: vaultAddress,
    abi: TokenizedBondVaultABI,
    functionName: 'getVaultContractAttachedAt',
    query: { enabled: !!vaultAddress },
  });

  const { data: fundsWithdrawnAt } = useReadContract({
    address: vaultAddress,
    abi: TokenizedBondVaultABI,
    functionName: 'getVaultFundsWithdrawnAt',
    query: { enabled: !!vaultAddress },
  });

  const { data: actualDueDate } = useReadContract({
    address: vaultAddress,
    abi: TokenizedBondVaultABI,
    functionName: 'getActualDueDate',
    query: { enabled: !!vaultAddress },
  });

  return {
    createdAt: createdAt as bigint | undefined,
    fundedAt: fundedAt as bigint | undefined,
    contractAttachedAt: contractAttachedAt as bigint | undefined,
    fundsWithdrawnAt: fundsWithdrawnAt as bigint | undefined,
    actualDueDate: actualDueDate as bigint | undefined,
  };
}

// ============================================
// WRITE FUNCTIONS - INVESTOR
// ============================================

export function usePurchaseShares(vaultAddress?: `0x${string}`) {
  const chainId = useChainId();
  const contracts = getContractsForChain(chainId);

  const { writeContract: purchase, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  // Approve USDC first
  const { writeContract: approve, data: approveHash, isPending: isApproving } = useWriteContract();
  const { isLoading: isConfirmingApprove, isSuccess: isApproveSuccess } = useWaitForTransactionReceipt({ hash: approveHash });

  const approveUsdc = async (amount: bigint) => {
    if (!contracts || !vaultAddress) throw new Error('Contracts not available');
    return approve({
      address: contracts.USDC,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [vaultAddress, amount],
    });
  };

  const purchaseShares = async (amount: bigint) => {
    if (!vaultAddress) throw new Error('Vault address required');
    return purchase({
      address: vaultAddress,
      abi: TokenizedBondVaultABI,
      functionName: 'purchaseShares',
      args: [amount],
    });
  };

  return {
    approveUsdc,
    isApproving,
    isConfirmingApprove,
    isApproveSuccess,
    approveHash,
    purchaseShares,
    isPending,
    isConfirming,
    isSuccess,
    hash,
    error,
  };
}

export function useRedeemShares(vaultAddress?: `0x${string}`) {
  const { writeContract: redeem, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const redeemShares = async (shares: bigint) => {
    if (!vaultAddress) throw new Error('Vault address required');
    return redeem({
      address: vaultAddress,
      abi: TokenizedBondVaultABI,
      functionName: 'redeemShares',
      args: [shares],
    });
  };

  return { redeemShares, isPending, isConfirming, isSuccess, hash, error };
}

// ============================================
// WRITE FUNCTIONS - BORROWER
// ============================================

export function useWithdrawFunds(vaultAddress?: `0x${string}`) {
  const { writeContract: withdraw, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const withdrawFunds = async () => {
    if (!vaultAddress) throw new Error('Vault address required');
    return withdraw({
      address: vaultAddress,
      abi: TokenizedBondVaultABI,
      functionName: 'withdrawFunds',
      args: [],
    });
  };

  return { withdrawFunds, isPending, isConfirming, isSuccess, hash, error };
}

export function useMakeRepayment(vaultAddress?: `0x${string}`) {
  const chainId = useChainId();
  const contracts = getContractsForChain(chainId);

  const { writeContract: repay, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  // Approve USDC first
  const { writeContract: approve, data: approveHash, isPending: isApproving } = useWriteContract();
  const { isLoading: isConfirmingApprove, isSuccess: isApproveSuccess } = useWaitForTransactionReceipt({ hash: approveHash });

  const approveUsdc = async (amount: bigint) => {
    if (!contracts || !vaultAddress) throw new Error('Contracts not available');
    return approve({
      address: contracts.USDC,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [vaultAddress, amount],
    });
  };

  const makeRepayment = async (amount: bigint) => {
    if (!vaultAddress) throw new Error('Vault address required');
    return repay({
      address: vaultAddress,
      abi: TokenizedBondVaultABI,
      functionName: 'makeRepayment',
      args: [amount],
    });
  };

  return {
    approveUsdc,
    isApproving,
    isConfirmingApprove,
    isApproveSuccess,
    approveHash,
    makeRepayment,
    isPending,
    isConfirming,
    isSuccess,
    hash,
    error,
  };
}

export function useAttachContract(vaultAddress?: `0x${string}`) {
  const { writeContract: attach, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const attachContract = async (contractHash: `0x${string}`) => {
    if (!vaultAddress) throw new Error('Vault address required');
    return attach({
      address: vaultAddress,
      abi: TokenizedBondVaultABI,
      functionName: 'attachContract',
      args: [contractHash],
    });
  };

  return { attachContract, isPending, isConfirming, isSuccess, hash, error };
}

// ============================================
// WRITE FUNCTIONS - ADMIN
// ============================================

export function useDisburseLoan(vaultAddress?: `0x${string}`) {
  const { writeContract: disburse, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const disburseLoan = async () => {
    if (!vaultAddress) throw new Error('Vault address required');
    return disburse({
      address: vaultAddress,
      abi: TokenizedBondVaultABI,
      functionName: 'disburseLoan',
      args: [],
    });
  };

  return { disburseLoan, isPending, isConfirming, isSuccess, hash, error };
}

export function useMarkAsDefaulted(vaultAddress?: `0x${string}`) {
  const { writeContract: markDefault, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const markAsDefaulted = async () => {
    if (!vaultAddress) throw new Error('Vault address required');
    return markDefault({
      address: vaultAddress,
      abi: TokenizedBondVaultABI,
      functionName: 'markAsDefaulted',
      args: [],
    });
  };

  return { markAsDefaulted, isPending, isConfirming, isSuccess, hash, error };
}

export function useWithdrawProtocolFees(vaultAddress?: `0x${string}`) {
  const { writeContract: withdraw, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const withdrawProtocolFees = async () => {
    if (!vaultAddress) throw new Error('Vault address required');
    return withdraw({
      address: vaultAddress,
      abi: TokenizedBondVaultABI,
      functionName: 'withdrawProtocolFees',
      args: [],
    });
  };

  return { withdrawProtocolFees, isPending, isConfirming, isSuccess, hash, error };
}

// ============================================
// COMPREHENSIVE VAULT HOOK
// ============================================

export function useTokenizedBondVault(vaultAddress?: `0x${string}`) {
  const { address } = useAccount();
  
  // Read hooks
  const vaultInfo = useVaultInfo(vaultAddress);
  const metrics = useVaultMetrics(vaultAddress);
  const state = useVaultState(vaultAddress);
  const investorReturn = useInvestorReturn(vaultAddress);
  const isInvestor = useIsInvestor(vaultAddress);
  const repaymentStatus = useRepaymentStatus(vaultAddress);
  const accruedInterest = useAccruedInterest(vaultAddress);
  const balance = useVaultBalance(vaultAddress);
  const tokenBalance = useVaultTokenBalance(vaultAddress);
  const timestamps = useVaultTimestamps(vaultAddress);
  const tokenName = useVaultTokenName(vaultAddress);
  const tokenSymbol = useVaultTokenSymbol(vaultAddress);

  // Write hooks
  const purchase = usePurchaseShares(vaultAddress);
  const redeem = useRedeemShares(vaultAddress);
  const withdraw = useWithdrawFunds(vaultAddress);
  const repay = useMakeRepayment(vaultAddress);
  const attachContract = useAttachContract(vaultAddress);
  const disburse = useDisburseLoan(vaultAddress);
  const markDefault = useMarkAsDefaulted(vaultAddress);
  const withdrawFees = useWithdrawProtocolFees(vaultAddress);

  // Computed properties
  const isBorrower = vaultInfo.vaultInfo?.borrower.toLowerCase() === address?.toLowerCase();
  const isFunding = state.state === VaultState.Funding;
  const isActive = state.state === VaultState.Active;
  const isCompleted = state.state === VaultState.Completed;
  const isDefaulted = state.state === VaultState.Defaulted;

  return {
    // Address
    vaultAddress,
    // Read data
    vaultInfo: vaultInfo.vaultInfo,
    metrics: metrics.metrics,
    state: state.state,
    stateLabel: state.stateLabel,
    investorReturn: investorReturn.investorReturn,
    isInvestor: isInvestor.isInvestor,
    repaymentStatus: repaymentStatus.repaymentStatus,
    accruedInterest: accruedInterest.accruedInterest,
    balance: balance.balance,
    tokenBalance: tokenBalance.balance,
    timestamps,
    tokenName: tokenName.name,
    tokenSymbol: tokenSymbol.symbol,
    // Loading states
    isLoading: vaultInfo.isLoading || metrics.isLoading || state.isLoading,
    // Computed
    isBorrower,
    isFunding,
    isActive,
    isCompleted,
    isDefaulted,
    // Write functions
    purchase,
    redeem,
    withdraw,
    repay,
    attachContract,
    disburse,
    markDefault,
    withdrawFees,
    // Refetch
    refetch: () => {
      vaultInfo.refetch();
      metrics.refetch();
      state.refetch();
      investorReturn.refetch();
      repaymentStatus.refetch();
      accruedInterest.refetch();
      balance.refetch();
      tokenBalance.refetch();
    },
  };
}

// Helper function
function getVaultStateLabel(state: number): string {
  const labels: Record<number, string> = {
    0: 'Created',
    1: 'Funding',
    2: 'Funded',
    3: 'Active',
    4: 'Repaying',
    5: 'Completed',
    6: 'Defaulted',
  };
  return labels[state] ?? 'Unknown';
}


