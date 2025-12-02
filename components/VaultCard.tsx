'use client';

import { useState } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { useContractRead, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import { TokenizedBondVaultABI } from '@/lib/contracts/abis';
import { getContractsForChain } from '@/lib/contracts/addresses';
import { erc20Abi } from 'viem';
import { ClipboardDocumentIcon, CheckIcon } from '@heroicons/react/24/outline';

interface VaultCardProps {
  vaultAddress: `0x${string}`;
  vaultId?: number;
}

export function VaultCard({ vaultAddress, vaultId }: VaultCardProps) {
  const { address } = useAccount();
  const chainId = useChainId();
  const contracts = getContractsForChain(chainId);
  const [investmentAmount, setInvestmentAmount] = useState('');
  const [showInvestForm, setShowInvestForm] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const [repaymentAmount, setRepaymentAmount] = useState('');
  const [showRepaymentForm, setShowRepaymentForm] = useState(false);

  // Get vault metrics
  const { data: metrics, isLoading: isLoadingMetrics } = useContractRead({
    address: vaultAddress,
    abi: TokenizedBondVaultABI,
    functionName: 'getVaultMetrics',
  });

  // Get user's investment returns if they've invested
  const { data: userReturnsData } = useContractRead({
    address: address ? vaultAddress : undefined,
    abi: TokenizedBondVaultABI,
    functionName: 'getInvestorReturn',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  const userReturns = userReturnsData as [bigint, bigint, bigint] | undefined;

  // Get vault name and symbol
  const { data: name } = useContractRead({
    address: vaultAddress,
    abi: TokenizedBondVaultABI,
    functionName: 'name',
  });

  const { data: symbol } = useContractRead({
    address: vaultAddress,
    abi: TokenizedBondVaultABI,
    functionName: 'symbol',
  });

  // Get borrower address
  const { data: borrowerData } = useContractRead({
    address: vaultAddress,
    abi: TokenizedBondVaultABI,
    functionName: 'getVaultBorrower',
  });
  const borrower = borrowerData as `0x${string}` | undefined;

  // Get lenders/investors
  const { data: lendersData } = useContractRead({
    address: vaultAddress,
    abi: TokenizedBondVaultABI,
    functionName: 'getInvestors',
  });
  const lenders = lendersData as `0x${string}`[] | undefined;

  // Get vault contract hash
  const { data: vaultContractHashData } = useContractRead({
    address: vaultAddress,
    abi: TokenizedBondVaultABI,
    functionName: 'getVaultContractHash',
  });
  const vaultContractHash = vaultContractHashData as `0x${string}` | undefined;
  const hasContract = vaultContractHash && vaultContractHash !== '0x0000000000000000000000000000000000000000000000000000000000000000';

  // Get vault state
  const { data: vaultStateData } = useContractRead({
    address: vaultAddress,
    abi: TokenizedBondVaultABI,
    functionName: 'getVaultState',
  });
  const vaultState = vaultStateData as number | undefined;

  // Get repayment status
  const { data: repaymentStatusData } = useContractRead({
    address: vaultAddress,
    abi: TokenizedBondVaultABI,
    functionName: 'getRepaymentStatus',
  });
  const repaymentStatus = repaymentStatusData as [bigint, bigint, bigint, bigint] | undefined;

  // Get accrued interest
  const { data: accruedInterestData } = useContractRead({
    address: vaultAddress,
    abi: TokenizedBondVaultABI,
    functionName: 'getAccruedInterest',
  });
  const accruedInterest = accruedInterestData as [bigint, bigint] | undefined;

  // Get vault info
  const { data: vaultInfoData } = useContractRead({
    address: vaultAddress,
    abi: TokenizedBondVaultABI,
    functionName: 'vaultInfo',
  });
  const vaultInfo = vaultInfoData as any;

  // Extract vault info fields safely
  // VaultInfo struct: borrower, contractHash, principalAmount, interestRate, protocolFeeRate, totalRepaid, createdAt, maturityDate, state, disbursedAt
  const borrowerFromInfo = vaultInfo?.[0] as `0x${string}` | undefined;
  const contractHashFromInfo = vaultInfo?.[1] as `0x${string}` | undefined;
  const principal = vaultInfo?.[2] as bigint | undefined;
  const interestRate = vaultInfo?.[3] as bigint | undefined; // in basis points (e.g., 1200 = 12%)
  const protocolFeeRate = vaultInfo?.[4] as bigint | undefined; // in basis points (e.g., 200 = 2%)
  const totalRepaid = vaultInfo?.[5] as bigint | undefined;
  const createdAt = vaultInfo?.[6] as bigint | undefined;
  const maturityDate = vaultInfo?.[7] as bigint | undefined;
  const stateFromInfo = vaultInfo?.[8] as number | undefined;
  const disbursedAt = vaultInfo?.[9] as bigint | undefined;

  // v2.2: Get accurate timestamps from contract
  const { data: vaultCreatedAtData } = useContractRead({
    address: vaultAddress,
    abi: TokenizedBondVaultABI,
    functionName: 'getVaultCreatedAt',
  });
  const vaultCreatedAt = vaultCreatedAtData as bigint | undefined;

  const { data: vaultFundedAtData } = useContractRead({
    address: vaultAddress,
    abi: TokenizedBondVaultABI,
    functionName: 'getVaultFundedAt',
  });
  const vaultFundedAt = vaultFundedAtData as bigint | undefined;

  const { data: vaultContractAttachedAtData } = useContractRead({
    address: vaultAddress,
    abi: TokenizedBondVaultABI,
    functionName: 'getVaultContractAttachedAt',
  });
  const vaultContractAttachedAt = vaultContractAttachedAtData as bigint | undefined;

  const { data: vaultFundsWithdrawnAtData } = useContractRead({
    address: vaultAddress,
    abi: TokenizedBondVaultABI,
    functionName: 'getVaultFundsWithdrawnAt',
  });
  const vaultFundsWithdrawnAt = vaultFundsWithdrawnAtData as bigint | undefined;

  const { data: actualDueDateData } = useContractRead({
    address: vaultAddress,
    abi: TokenizedBondVaultABI,
    functionName: 'getActualDueDate',
  });
  const actualDueDate = actualDueDateData as bigint | undefined;

  // v2.2: Get available funds for investors (excludes protocol fees)
  const { data: availableForInvestorsData } = useContractRead({
    address: vaultAddress,
    abi: TokenizedBondVaultABI,
    functionName: 'getAvailableForInvestors',
  });
  const availableForInvestors = availableForInvestorsData as bigint | undefined;
  
  // Helper function to safely format dates
  const formatDate = (timestamp: bigint | undefined) => {
    if (!timestamp || timestamp === 0n) return null;
    try {
      const date = new Date(Number(timestamp) * 1000);
      if (isNaN(date.getTime())) return null;
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch (error) {
      return null;
    }
  };

  // v2.2: Use actual due date from contract (calculated on-chain)
  const dueDate = actualDueDate;
  const maturityDays = maturityDate ? Math.floor(Number(maturityDate) / (24 * 60 * 60)) : undefined;

  // Calculate payment breakdown
  const calculatePaymentBreakdown = () => {
    if (!principal || !interestRate || !protocolFeeRate) return null;
    
    try {
      const principalAmount = principal;
      const interestAmount = (principal * interestRate) / 10000n; // basis points to percentage
      const protocolFeeAmount = (principal * protocolFeeRate) / 10000n; // protocol fee on PRINCIPAL only
      const totalDue = principalAmount + interestAmount + protocolFeeAmount;
      
      return {
        principal: principalAmount,
        interest: interestAmount,
        interestRate: Number(interestRate) / 100, // convert basis points to percentage
        protocolFee: protocolFeeAmount,
        protocolFeeRate: Number(protocolFeeRate) / 100, // convert basis points to percentage
        totalDue: totalDue,
      };
    } catch (error) {
      console.error('Error calculating payment breakdown:', error);
      return null;
    }
  };

  const paymentBreakdown = calculatePaymentBreakdown();

  // Check USDC allowance for investment
  const { data: allowance } = useContractRead({
    address: address && vaultAddress && contracts ? contracts.USDC : undefined,
    abi: erc20Abi,
    functionName: 'allowance',
    args: address && vaultAddress ? [address, vaultAddress] : undefined,
    query: {
      enabled: !!address && !!vaultAddress && !!contracts,
    },
  });

  // Check USDC allowance for repayment
  const { data: repaymentAllowance, refetch: refetchRepaymentAllowance } = useContractRead({
    address: address && vaultAddress && contracts ? contracts.USDC : undefined,
    abi: erc20Abi,
    functionName: 'allowance',
    args: address && vaultAddress ? [address, vaultAddress] : undefined,
    query: {
      enabled: !!address && !!vaultAddress && !!contracts,
    },
  });

  // Approve USDC for investment
  const {
    writeContract: approve,
    data: approveHash,
    isPending: isApproving,
  } = useWriteContract();

  // Approve USDC for repayment
  const {
    writeContract: approveRepayment,
    data: approveRepaymentHash,
    isPending: isApprovingRepayment,
  } = useWriteContract();

  // Purchase shares
  const {
    writeContract: purchaseShares,
    data: purchaseHash,
    isPending: isPurchasing,
    error: purchaseError,
  } = useWriteContract();

  // Withdraw funds
  const {
    writeContract: withdrawFunds,
    data: withdrawHash,
    isPending: isWithdrawing,
    error: withdrawError,
  } = useWriteContract();

  // Attach contract
  const {
    writeContract: attachContract,
    data: attachHash,
    isPending: isAttaching,
    error: attachError,
  } = useWriteContract();

  // Make repayment
  const {
    writeContract: makeRepayment,
    data: repaymentHash,
    isPending: isRepaying,
    error: repaymentError,
  } = useWriteContract();

  // Withdraw protocol fees (for fee collector)
  const {
    writeContract: withdrawProtocolFees,
    data: withdrawFeesHash,
    isPending: isWithdrawingFees,
    error: withdrawFeesError,
  } = useWriteContract();

  // Redeem shares (for investors)
  const {
    writeContract: redeemShares,
    data: redeemHash,
    isPending: isRedeeming,
    error: redeemError,
  } = useWriteContract();

  const { isLoading: isConfirmingPurchase, isSuccess: purchaseSuccess } =
    useWaitForTransactionReceipt({
      hash: purchaseHash,
    });

  const { isLoading: isConfirmingApprove, isSuccess: approveSuccess } =
    useWaitForTransactionReceipt({
      hash: approveHash,
    });

  const { isLoading: isConfirmingApproveRepayment, isSuccess: approveRepaymentSuccess } =
    useWaitForTransactionReceipt({
      hash: approveRepaymentHash,
    });

  const { isLoading: isConfirmingWithdraw, isSuccess: withdrawSuccess } =
    useWaitForTransactionReceipt({
      hash: withdrawHash,
    });

  const { isLoading: isConfirmingAttach, isSuccess: attachSuccess } =
    useWaitForTransactionReceipt({
      hash: attachHash,
    });

  const { isLoading: isConfirmingRepayment, isSuccess: repaymentSuccess } =
    useWaitForTransactionReceipt({
      hash: repaymentHash,
    });

  const { isLoading: isConfirmingWithdrawFees, isSuccess: withdrawFeesSuccess } =
    useWaitForTransactionReceipt({
      hash: withdrawFeesHash,
    });

  const { isLoading: isConfirmingRedeem, isSuccess: redeemSuccess } =
    useWaitForTransactionReceipt({
      hash: redeemHash,
    });

  if (isLoadingMetrics) {
    return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return null;
  }

  const [totalShares, sharePrice, tvl, target, progress, apy] = metrics as [
    bigint,
    bigint,
    bigint,
    bigint,
    bigint,
    bigint,
  ];

  const needsApproval =
    investmentAmount &&
    allowance !== undefined &&
    allowance < parseUnits(investmentAmount, 6);

  const handleApprove = () => {
    if (!investmentAmount || !contracts) return;
    approve({
      address: contracts.USDC,
      abi: erc20Abi,
      functionName: 'approve',
      args: [vaultAddress, parseUnits('1000000', 6)], // Approve 1M USDC
    });
  };

  const handleInvest = () => {
    if (!investmentAmount) {
      alert('Please enter an investment amount');
      return;
    }
    purchaseShares({
      address: vaultAddress,
      abi: TokenizedBondVaultABI,
      functionName: 'purchaseShares',
      args: [parseUnits(investmentAmount, 6)],
    });
  };

  const handleWithdraw = () => {
    if (!hasContract) {
      alert('You must attach a signed contract to this vault before withdrawing funds.');
      return;
    }
    if (confirm('Are you sure you want to withdraw funds from this vault?')) {
      withdrawFunds({
        address: vaultAddress,
        abi: TokenizedBondVaultABI,
        functionName: 'withdrawFunds',
      });
    }
  };

  const handleAttachContract = () => {
    const contractHash = prompt('Enter the contract hash (from the Contracts page):');
    if (!contractHash) return;
    
    if (!contractHash.startsWith('0x') || contractHash.length !== 66) {
      alert('Invalid contract hash format. Must be a 32-byte hex string starting with 0x');
      return;
    }

    attachContract({
      address: vaultAddress,
      abi: TokenizedBondVaultABI,
      functionName: 'attachContract',
      args: [contractHash as `0x${string}`],
    });
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAddress(label);
    setTimeout(() => setCopiedAddress(null), 2000);
  };

  const handleApproveRepayment = () => {
    if (!repaymentAmount || !contracts) return;
    approveRepayment({
      address: contracts.USDC,
      abi: erc20Abi,
      functionName: 'approve',
      args: [vaultAddress, parseUnits('1000000', 6)], // Approve 1M USDC
    });
  };

  const handleRepayment = () => {
    if (!repaymentAmount) {
      alert('Please enter a repayment amount');
      return;
    }
    
    const amountInUnits = parseUnits(repaymentAmount, 6);
    
    makeRepayment({
      address: vaultAddress,
      abi: TokenizedBondVaultABI,
      functionName: 'makeRepayment',
      args: [amountInUnits],
    });
  };

  const needsRepaymentApproval =
    repaymentAmount &&
    repaymentAllowance !== undefined &&
    repaymentAllowance < parseUnits(repaymentAmount, 6);

  const handleWithdrawProtocolFees = () => {
    if (!isFeeCollector) {
      alert('Only the protocol fee collector can withdraw fees');
      return;
    }
    if (!repaymentStatus || repaymentStatus[3] === 0n) {
      alert('No protocol fees available to withdraw');
      return;
    }
    if (confirm(`Withdraw ${formatUnits(repaymentStatus[3], 6)} USDC protocol fees from this vault?`)) {
      withdrawProtocolFees({
        address: vaultAddress,
        abi: TokenizedBondVaultABI,
        functionName: 'withdrawProtocolFees',
      });
    }
  };

  const handleRedeemShares = () => {
    if (!userReturns || userReturns[0] === 0n) {
      alert('You have no shares to redeem');
      return;
    }
    
    // Get user's share balance
    const sharesToRedeem = prompt(`Enter amount of shares to redeem (you have ${formatUnits(userReturns[0], 6)} shares):`);
    if (!sharesToRedeem) return;

    redeemShares({
      address: vaultAddress,
      abi: TokenizedBondVaultABI,
      functionName: 'redeemShares',
      args: [parseUnits(sharesToRedeem, 6)],
    });
  };

  // Check if user is fee collector (admin)
  const isFeeCollector = address && contracts && address.toLowerCase() === contracts.ADMIN_ADDRESS.toLowerCase();
  
  // Check if user is an investor
  const isInvestor = userReturns && userReturns[0] > 0n;

  const isBorrower = address && borrower && address.toLowerCase() === borrower.toLowerCase();
  const canWithdraw = isBorrower && hasContract;

  // Vault state mapping
  const vaultStateNames = ['Pending', 'Funded', 'Active', 'Repaying', 'Completed', 'Defaulted'];
  const vaultStateName = vaultState !== undefined ? vaultStateNames[vaultState] : 'Unknown';
  
  const vaultStateColors: Record<string, string> = {
    'Pending': 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200',
    'Funded': 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200',
    'Active': 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200',
    'Repaying': 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200',
    'Completed': 'bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 font-bold',
    'Defaulted': 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200',
  };
  
  // Check if vault is fully repaid
  const isFullyRepaid = repaymentStatus && repaymentStatus[2] === 0n;

  // Get block explorer URL based on chain
  const getExplorerUrl = (addressOrTx: string, type: 'address' | 'tx' = 'address') => {
    const baseUrls: Record<number, string> = {
      84532: 'https://sepolia.basescan.org',
      11155111: 'https://sepolia.etherscan.io',
      1301: 'https://uniscan.uniwhale.io',
    };
    const baseUrl = baseUrls[chainId] || 'https://sepolia.basescan.org';
    return `${baseUrl}/${type}/${addressOrTx}`;
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
          {name ? String(name) : 'Vault'}
        </h3>
          <div className="flex items-center gap-2 flex-wrap">
            {vaultId !== undefined && (
              <span className="text-sm font-semibold bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full">
                ID: {vaultId}
              </span>
            )}
            <span className={`text-xs font-semibold px-3 py-1 rounded-full ${vaultStateColors[vaultStateName] || 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'}`}>
              {vaultStateName}
            </span>
            {isFullyRepaid && vaultState === 3 && (
              <span className="text-xs font-bold bg-green-600 text-white px-3 py-1 rounded-full animate-pulse flex items-center gap-1">
                <span>✓</span> FULLY PAID
              </span>
            )}
          </div>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
          Vault Address:{' '}
          <a
            href={getExplorerUrl(vaultAddress, 'address')}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 dark:text-blue-400 hover:underline font-mono"
          >
          {vaultAddress.slice(0, 6)}...{vaultAddress.slice(-4)}
          </a>
        </p>

        {/* Vault Timeline and Dates (v2.2 with accurate timestamps) */}
        <div className="mb-3 space-y-2">
          {/* Created Date - using v2.2 getVaultCreatedAt() */}
          {formatDate(vaultCreatedAt) && (
            <div className="p-2 bg-gray-50 dark:bg-gray-900/20 rounded-lg">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600 dark:text-gray-400">📅 Created:</span>
                <span className="font-mono text-gray-900 dark:text-white">
                  {formatDate(vaultCreatedAt)}
                </span>
              </div>
            </div>
          )}

          {/* Funded Date - using v2.2 getVaultFundedAt() */}
          {formatDate(vaultFundedAt) && vaultFundedAt !== 0n && (
            <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600 dark:text-gray-400">💰 Funded:</span>
                <span className="font-mono text-gray-900 dark:text-white">
                  {formatDate(vaultFundedAt)}
                </span>
              </div>
            </div>
          )}

          {/* Contract Attached Date - using v2.2 getVaultContractAttachedAt() */}
          {formatDate(vaultContractAttachedAt) && vaultContractAttachedAt !== 0n && (
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600 dark:text-gray-400">📄 Contract Attached:</span>
                <span className="font-mono text-gray-900 dark:text-white">
                  {formatDate(vaultContractAttachedAt)}
                </span>
              </div>
            </div>
          )}

          {/* Funds Withdrawn Date - using v2.2 getVaultFundsWithdrawnAt() */}
          {formatDate(vaultFundsWithdrawnAt) && vaultFundsWithdrawnAt !== 0n && (
            <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600 dark:text-gray-400">💸 Funds Withdrawn:</span>
                <span className="font-mono text-gray-900 dark:text-white">
                  {formatDate(vaultFundsWithdrawnAt)}
                </span>
              </div>
            </div>
          )}

          {/* Due Date - using v2.2 getActualDueDate() */}
          {formatDate(dueDate) && (
            <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600 dark:text-gray-400">🎯 Due Date:</span>
                <span className="font-mono text-gray-900 dark:text-white">
                  {formatDate(dueDate)}
                  {maturityDays && (
                    <span className="text-gray-500 dark:text-gray-400 ml-2">
                      ({maturityDays} days)
                    </span>
                  )}
                </span>
              </div>
            </div>
          )}
        </div>

        {borrower && (
          <div className="mb-2 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <p className="text-xs font-semibold text-purple-900 dark:text-purple-200 mb-1">
              Borrower
            </p>
            <div className="flex items-center justify-between">
              <a
                href={getExplorerUrl(borrower, 'address')}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-mono text-blue-600 dark:text-blue-400 hover:underline"
              >
                {borrower.slice(0, 10)}...{borrower.slice(-8)}
              </a>
              <button
                onClick={() => copyToClipboard(borrower, 'borrower')}
                className="p-1 hover:bg-purple-100 dark:hover:bg-purple-900 rounded"
                title="Copy address"
              >
                {copiedAddress === 'borrower' ? (
                  <CheckIcon className="h-4 w-4 text-green-600" />
                ) : (
                  <ClipboardDocumentIcon className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                )}
              </button>
            </div>
          </div>
        )}

        {lenders && lenders.length > 0 && (
          <div className="mb-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <p className="text-xs font-semibold text-green-900 dark:text-green-200 mb-2">
              Lenders ({lenders.length})
            </p>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {lenders.map((lender, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <a
                    href={getExplorerUrl(lender, 'address')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {lender.slice(0, 10)}...{lender.slice(-8)}
                  </a>
                  <button
                    onClick={() => copyToClipboard(lender, `lender-${index}`)}
                    className="p-1 hover:bg-green-100 dark:hover:bg-green-900 rounded"
                    title="Copy address"
                  >
                    {copiedAddress === `lender-${index}` ? (
                      <CheckIcon className="h-4 w-4 text-green-600" />
                    ) : (
                      <ClipboardDocumentIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {isBorrower && (
          <div className="mb-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-xs font-semibold text-blue-900 dark:text-blue-200 mb-1">
              Contract Status
            </p>
            {hasContract ? (
              <div>
                <p className="text-sm text-green-600 dark:text-green-400 flex items-center">
                  <CheckIcon className="h-4 w-4 mr-1" />
                  Contract attached
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 font-mono break-all">
                  {vaultContractHash}
                </p>
              </div>
            ) : (
              <div>
                <p className="text-sm text-yellow-600 dark:text-yellow-400">
                  ⚠ No contract attached
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  You must attach a signed contract before withdrawing funds
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="space-y-3 mb-4">
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-400">TVL:</span>
          <span className="font-semibold text-gray-900 dark:text-white">
            {formatUnits(tvl, 6)} USDC
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-400">Target:</span>
          <span className="font-semibold text-gray-900 dark:text-white">
            {formatUnits(target, 6)} USDC
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-400">APY:</span>
          <span className="font-semibold text-green-600">
            {(Number(apy) / 100).toFixed(2)}%
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-400">Progress:</span>
          <span className="font-semibold text-gray-900 dark:text-white">
            {(Number(progress) / 100).toFixed(1)}%
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full"
            style={{ width: `${Number(progress) / 100}%` }}
          ></div>
        </div>
      </div>

      {/* Payment Breakdown - Shows loan structure */}
      {paymentBreakdown && (
        <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-3 flex items-center">
            <span className="mr-2">📊</span> Loan Payment Breakdown
          </p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Principal Amount:</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {formatUnits(paymentBreakdown.principal, 6)} USDC
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">
                Interest ({paymentBreakdown.interestRate}%):
              </span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {formatUnits(paymentBreakdown.interest, 6)} USDC
              </span>
            </div>
            <div className="flex justify-between bg-yellow-100 dark:bg-yellow-900/30 p-2 rounded">
              <span className="text-gray-700 dark:text-gray-300 font-medium">
                Protocol Fee ({paymentBreakdown.protocolFeeRate}% on principal):
              </span>
              <span className="font-semibold text-yellow-700 dark:text-yellow-300">
                {formatUnits(paymentBreakdown.protocolFee, 6)} USDC
              </span>
            </div>
            <div className="border-t-2 border-blue-300 dark:border-blue-600 pt-2 flex justify-between">
              <span className="text-gray-900 dark:text-white font-bold">Total to Repay:</span>
              <span className="font-bold text-blue-700 dark:text-blue-300 text-lg">
                {formatUnits(paymentBreakdown.totalDue, 6)} USDC
              </span>
            </div>
          </div>
          <div className="mt-3 text-xs text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 p-2 rounded">
            <span className="font-semibold">Note:</span> The protocol fee ({paymentBreakdown.protocolFeeRate}%) is calculated on the principal amount only and must be paid by the borrower.
          </div>
        </div>
      )}

      {/* Repayment Status - For Borrower */}
      {isBorrower && repaymentStatus && (vaultState === 2 || vaultState === 3 || vaultState === 4) && (
        <div className={`mb-4 p-4 rounded-lg border ${
          repaymentStatus[2] === 0n 
            ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700'
            : 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <p className={`text-sm font-semibold flex items-center ${
              repaymentStatus[2] === 0n 
                ? 'text-green-900 dark:text-green-200'
                : 'text-purple-900 dark:text-purple-200'
            }`}>
              <span className="mr-2">{repaymentStatus[2] === 0n ? '✅' : '💰'}</span> 
              Repayment Status
            </p>
            {repaymentStatus[2] === 0n && (
              <span className="text-xs font-bold bg-green-600 text-white px-3 py-1 rounded-full animate-pulse">
                FULLY PAID
              </span>
            )}
          </div>
          
          {repaymentStatus[2] === 0n && (
            <div className="mb-3 p-3 bg-green-100 dark:bg-green-900/40 rounded-lg border border-green-300 dark:border-green-700">
              <p className="text-sm font-semibold text-green-800 dark:text-green-200 flex items-center">
                <span className="mr-2">🎉</span>
                Loan Fully Repaid!
              </p>
              <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                All payments including protocol fee have been completed. Investors and protocol collector can now withdraw their funds.
              </p>
            </div>
          )}
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Principal + Interest:</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {formatUnits(repaymentStatus[0], 6)} USDC
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Protocol Fee (2%):</span>
              <span className="font-semibold text-yellow-700 dark:text-yellow-400">
                +{formatUnits(repaymentStatus[3], 6)} USDC
              </span>
            </div>
            <div className="border-t border-gray-300 dark:border-gray-600 pt-2 flex justify-between">
              <span className="text-gray-900 dark:text-white font-bold">Total to Repay:</span>
              <span className="font-bold text-gray-900 dark:text-white">
                {formatUnits(repaymentStatus[0] + repaymentStatus[3], 6)} USDC
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Total Paid:</span>
              <span className="font-semibold text-green-600">
                {formatUnits(repaymentStatus[1], 6)} USDC
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Remaining:</span>
              <span className={`font-semibold ${
                repaymentStatus[2] === 0n ? 'text-green-600' : 'text-red-600'
              }`}>
                {formatUnits(repaymentStatus[2], 6)} USDC
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  repaymentStatus[2] === 0n ? 'bg-green-600' : 'bg-purple-600'
                }`}
                style={{ 
                  width: `${(repaymentStatus[0] + repaymentStatus[3]) > 0n ? (Number(repaymentStatus[1]) / Number(repaymentStatus[0] + repaymentStatus[3]) * 100).toFixed(1) : 0}%` 
                }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-1">
              {(repaymentStatus[0] + repaymentStatus[3]) > 0n ? ((Number(repaymentStatus[1]) / Number(repaymentStatus[0] + repaymentStatus[3]) * 100).toFixed(1)) : 0}% Repaid
            </p>
          </div>
        </div>
      )}

      {/* Accrued Interest - For All */}
      {accruedInterest && (vaultState === 2 || vaultState === 3 || vaultState === 4) && (
        <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
          <p className="text-sm font-semibold text-green-900 dark:text-green-200 mb-3 flex items-center">
            <span className="mr-2">📈</span> Interest Tracking
          </p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Accrued Interest:</span>
              <span className="font-semibold text-green-600">
                {formatUnits(accruedInterest[0], 6)} USDC
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Remaining Interest:</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {formatUnits(accruedInterest[1], 6)} USDC
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Total Interest:</span>
              <span className="font-semibold text-blue-600">
                {formatUnits(accruedInterest[0] + accruedInterest[1], 6)} USDC
              </span>
            </div>
          </div>
        </div>
      )}

      {/* User Investment Returns - For Lenders */}
      {userReturns && userReturns[0] > 0n && (
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-1">
            Your Investment
          </p>
          <div className="text-sm space-y-1">
            <div className="flex justify-between">
              <span>Invested:</span>
              <span>{formatUnits(userReturns[0], 6)} USDC</span>
            </div>
            <div className="flex justify-between">
              <span>Current Value:</span>
              <span>{formatUnits(userReturns[1], 6)} USDC</span>
            </div>
            <div className="flex justify-between">
              <span>Profit:</span>
              <span className="text-green-600">
                +{formatUnits(userReturns[2], 6)} USDC
              </span>
            </div>
          </div>
        </div>
      )}

      {showInvestForm ? (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
              Investment Amount (USDC)
            </label>
            <input
              type="number"
              value={investmentAmount}
              onChange={(e) => setInvestmentAmount(e.target.value)}
              placeholder="1000"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>

          {needsApproval ? (
            <button
              onClick={handleApprove}
              disabled={isApproving || isConfirmingApprove}
              className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-semibold py-2 px-4 rounded-lg disabled:opacity-50"
            >
              {isApproving || isConfirmingApprove
                ? 'Approving...'
                : approveSuccess
                ? 'Approved!'
                : 'Approve USDC'}
            </button>
          ) : (
            <button
              onClick={handleInvest}
              disabled={isPurchasing || isConfirmingPurchase || !investmentAmount}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg disabled:opacity-50"
            >
              {isPurchasing || isConfirmingPurchase
                ? 'Investing...'
                : purchaseSuccess
                ? 'Invested!'
                : 'Invest'}
            </button>
          )}

          {purchaseError && (
            <div className="text-red-600 text-sm">
              Error: {purchaseError.message}
            </div>
          )}

          {purchaseSuccess && purchaseHash && (
            <div className="text-green-600 text-sm">
              Investment successful!{' '}
              <a
                href={
                  chainId === 84532
                    ? `https://sepolia.basescan.org/tx/${purchaseHash}`
                    : chainId === 11155111
                    ? `https://sepolia.etherscan.io/tx/${purchaseHash}`
                    : chainId === 1301
                    ? `https://uniscan.uniwhale.io/tx/${purchaseHash}`
                    : '#'
                }
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                View Transaction
              </a>
            </div>
          )}

          <button
            onClick={() => {
              setShowInvestForm(false);
              setInvestmentAmount('');
            }}
            className="w-full text-gray-600 dark:text-gray-400 hover:underline text-sm"
          >
            Cancel
          </button>
        </div>
      ) : (
        <div className="space-y-2">
        <button
          onClick={() => setShowInvestForm(true)}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg"
        >
          Invest in Vault
        </button>
          
          {isBorrower && (
            <>
              {!hasContract && (
                <>
                  <button
                    onClick={handleAttachContract}
                    disabled={isAttaching || isConfirmingAttach}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg disabled:opacity-50"
                  >
                    {isAttaching || isConfirmingAttach
                      ? 'Attaching...'
                      : attachSuccess
                      ? 'Attached!'
                      : 'Attach Contract'}
                  </button>

                  {attachError && (
                    <div className="text-red-600 text-sm">
                      Error: {attachError.message}
                    </div>
                  )}

                  {attachSuccess && attachHash && (
                    <div className="text-green-600 text-sm">
                      Contract attached!{' '}
                      <a
                        href={
                          chainId === 84532
                            ? `https://sepolia.basescan.org/tx/${attachHash}`
                            : chainId === 11155111
                            ? `https://sepolia.etherscan.io/tx/${attachHash}`
                            : chainId === 1301
                            ? `https://uniscan.uniwhale.io/tx/${attachHash}`
                            : '#'
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline"
                      >
                        View TX
                      </a>
                    </div>
                  )}
                </>
              )}

              <button
                onClick={handleWithdraw}
                disabled={!canWithdraw || isWithdrawing || isConfirmingWithdraw}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg disabled:opacity-50"
                title={!hasContract ? 'Attach a contract first' : 'Withdraw funds'}
              >
                {isWithdrawing || isConfirmingWithdraw
                  ? 'Withdrawing...'
                  : withdrawSuccess
                  ? 'Withdrawn!'
                  : 'Withdraw Funds'}
              </button>

              {!hasContract && (
                <div className="text-yellow-600 dark:text-yellow-400 text-xs text-center">
                  ⚠ Attach a signed contract before withdrawing
                </div>
              )}

              {withdrawError && (
                <div className="text-red-600 text-sm">
                  Error: {withdrawError.message}
                </div>
              )}

              {withdrawSuccess && withdrawHash && (
                <div className="text-green-600 text-sm">
                  Withdrawal successful!{' '}
                  <a
                    href={
                      chainId === 84532
                        ? `https://sepolia.basescan.org/tx/${withdrawHash}`
                        : chainId === 11155111
                        ? `https://sepolia.etherscan.io/tx/${withdrawHash}`
                        : chainId === 1301
                        ? `https://uniscan.uniwhale.io/tx/${withdrawHash}`
                        : '#'
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                  >
                    View Transaction
                  </a>
                </div>
              )}

              {/* Make Repayment Button - Only show if vault is in Repaying state */}
              {(vaultState === 3 || vaultState === 2) && repaymentStatus && repaymentStatus[2] > 0n && (
                <>
                  {showRepaymentForm ? (
                    <div className="space-y-3 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                      {/* Alert if only protocol fee is remaining */}
                      {repaymentStatus[2] === repaymentStatus[3] && (
                        <div className="mb-3 p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg border border-yellow-300 dark:border-yellow-700">
                          <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-200 flex items-center">
                            <span className="mr-2">⚠️</span>
                            Protocol Fee Pending
                          </p>
                          <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                            You've paid the principal + interest. Only the {formatUnits(repaymentStatus[3], 6)} USDC protocol fee remains.
                          </p>
                        </div>
                      )}
                      
                      <div>
                        <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                          Repayment Amount (USDC)
                        </label>
                        <input
                          type="number"
                          value={repaymentAmount}
                          onChange={(e) => setRepaymentAmount(e.target.value)}
                          placeholder="Enter amount"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            Remaining: {repaymentStatus ? formatUnits(repaymentStatus[2], 6) : '0'} USDC
                          </p>
                          <button
                            onClick={() => setRepaymentAmount(formatUnits(repaymentStatus[2], 6))}
                            className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            Pay All
                          </button>
                        </div>
                      </div>

                      {needsRepaymentApproval ? (
                        <button
                          onClick={handleApproveRepayment}
                          disabled={isApprovingRepayment || isConfirmingApproveRepayment}
                          className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-semibold py-2 px-4 rounded-lg disabled:opacity-50"
                        >
                          {isApprovingRepayment || isConfirmingApproveRepayment
                            ? 'Approving...'
                            : approveRepaymentSuccess
                            ? 'Approved!'
                            : 'Approve USDC'}
                        </button>
                      ) : (
                        <button
                          onClick={handleRepayment}
                          disabled={isRepaying || isConfirmingRepayment || !repaymentAmount}
                          className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg disabled:opacity-50"
                        >
                          {isRepaying || isConfirmingRepayment
                            ? 'Processing...'
                            : repaymentSuccess
                            ? 'Repayment Successful!'
                            : '💵 Make Repayment'}
                        </button>
                      )}

                      {repaymentError && (
                        <div className="text-red-600 text-sm">
                          Error: {repaymentError.message}
                        </div>
                      )}

                      {repaymentSuccess && repaymentHash && (
                        <div className="text-green-600 text-sm">
                          Repayment successful!{' '}
                          <a
                            href={
                              chainId === 84532
                                ? `https://sepolia.basescan.org/tx/${repaymentHash}`
                                : chainId === 11155111
                                ? `https://sepolia.etherscan.io/tx/${repaymentHash}`
                                : chainId === 1301
                                ? `https://uniscan.uniwhale.io/tx/${repaymentHash}`
                                : '#'
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline"
                          >
                            View Transaction
                          </a>
                        </div>
                      )}

                      <button
                        onClick={() => {
                          setShowRepaymentForm(false);
                          setRepaymentAmount('');
                        }}
                        className="w-full text-gray-600 dark:text-gray-400 hover:underline text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowRepaymentForm(true)}
                      className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg"
                    >
                      💵 Make Repayment
                    </button>
                  )}
                </>
              )}
            </>
          )}

          {/* Withdraw Protocol Fees Button - For Fee Collector (Admin) */}
          {isFeeCollector && repaymentStatus && repaymentStatus[3] > 0n && (vaultState === 3 || vaultState === 4) && (
            <div className="space-y-2">
              <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
                <p className="text-xs font-semibold text-indigo-900 dark:text-indigo-200 mb-1">
                  Protocol Fees Available
                </p>
                <p className="text-lg font-bold text-indigo-700 dark:text-indigo-300">
                  {formatUnits(repaymentStatus[3], 6)} USDC
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  2% protocol fee on principal amount
                </p>
              </div>
              
              <button
                onClick={handleWithdrawProtocolFees}
                disabled={isWithdrawingFees || isConfirmingWithdrawFees}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg disabled:opacity-50"
              >
                {isWithdrawingFees || isConfirmingWithdrawFees
                  ? 'Withdrawing...'
                  : withdrawFeesSuccess
                  ? 'Fees Withdrawn!'
                  : '💼 Withdraw Protocol Fees (Admin)'}
              </button>

              {withdrawFeesError && (
                <div className="text-red-600 text-sm">
                  Error: {withdrawFeesError.message}
                </div>
              )}

              {withdrawFeesSuccess && withdrawFeesHash && (
                <div className="text-green-600 text-sm">
                  Protocol fees withdrawn!{' '}
                  <a
                    href={getExplorerUrl(withdrawFeesHash, 'tx')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                  >
                    View Transaction
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Redeem Shares Button - For Investors after repayment */}
          {isInvestor && (vaultState === 3 || vaultState === 4) && repaymentStatus && repaymentStatus[1] > 0n && (
            <>
              <button
                onClick={handleRedeemShares}
                disabled={isRedeeming || isConfirmingRedeem}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2 px-4 rounded-lg disabled:opacity-50"
              >
                {isRedeeming || isConfirmingRedeem
                  ? 'Redeeming...'
                  : redeemSuccess
                  ? 'Shares Redeemed!'
                  : '💎 Redeem Shares'}
              </button>

              {redeemError && (
                <div className="text-red-600 text-sm">
                  Error: {redeemError.message}
                </div>
              )}

              {redeemSuccess && redeemHash && (
                <div className="text-green-600 text-sm">
                  Shares redeemed successfully!{' '}
                  <a
                    href={getExplorerUrl(redeemHash, 'tx')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                  >
                    View Transaction
                  </a>
                </div>
              )}

              <div className="text-xs text-gray-600 dark:text-gray-400 text-center space-y-1">
                <div>Your shares: {userReturns ? formatUnits(userReturns[0], 6) : '0'}</div>
                <div>Current value: {userReturns ? formatUnits(userReturns[1], 6) : '0'} USDC</div>
                {availableForInvestors !== undefined && (
                  <div className="text-green-600 dark:text-green-400 font-semibold">
                    💰 Available for investors: {formatUnits(availableForInvestors, 6)} USDC
                  </div>
                )}
                <div className="text-xs text-gray-500 dark:text-gray-500 italic mt-1">
                  ✅ v2.2: Protocol fees are protected and excluded from investor withdrawals
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

