'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { useContractRead, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import { TokenizedBondVaultABI } from '@/lib/contracts/abis';
import { CONTRACTS } from '@/lib/contracts/addresses';
import { erc20Abi } from 'viem';

interface VaultCardProps {
  vaultAddress: `0x${string}`;
}

export function VaultCard({ vaultAddress }: VaultCardProps) {
  const { address } = useAccount();
  const [investmentAmount, setInvestmentAmount] = useState('');
  const [showInvestForm, setShowInvestForm] = useState(false);

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

  // Check USDC allowance
  const { data: allowance } = useContractRead({
    address: address && vaultAddress ? CONTRACTS.BASE_SEPOLIA.USDC : undefined,
    abi: erc20Abi,
    functionName: 'allowance',
    args: address && vaultAddress ? [address, vaultAddress] : undefined,
    query: {
      enabled: !!address && !!vaultAddress,
    },
  });

  // Approve USDC
  const {
    writeContract: approve,
    data: approveHash,
    isPending: isApproving,
  } = useWriteContract();

  // Purchase shares
  const {
    writeContract: purchaseShares,
    data: purchaseHash,
    isPending: isPurchasing,
    error: purchaseError,
  } = useWriteContract();

  const { isLoading: isConfirmingPurchase, isSuccess: purchaseSuccess } =
    useWaitForTransactionReceipt({
      hash: purchaseHash,
    });

  const { isLoading: isConfirmingApprove, isSuccess: approveSuccess } =
    useWaitForTransactionReceipt({
      hash: approveHash,
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
    if (!investmentAmount) return;
    approve({
      address: CONTRACTS.BASE_SEPOLIA.USDC,
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

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
      <div className="mb-4">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
          {name ? String(name) : 'Vault'}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {vaultAddress.slice(0, 6)}...{vaultAddress.slice(-4)}
        </p>
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

      {userReturns && (
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
                {formatUnits(userReturns[2], 6)} USDC
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

          {purchaseSuccess && (
            <div className="text-green-600 text-sm">
              Investment successful!{' '}
              <a
                href={`https://sepolia.basescan.org/tx/${purchaseHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                View on BaseScan
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
        <button
          onClick={() => setShowInvestForm(true)}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg"
        >
          Invest in Vault
        </button>
      )}
    </div>
  );
}

