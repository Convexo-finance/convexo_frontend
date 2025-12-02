'use client';

import { useState } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits } from 'viem';
import { getContractsForChain } from '@/lib/contracts/addresses';
import { VaultFactoryABI } from '@/lib/contracts/abis';

export function CreateVaultForm() {
  const { address } = useAccount();
  const chainId = useChainId();
  const contracts = getContractsForChain(chainId);
  const [principalAmount, setPrincipalAmount] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [maturityDays, setMaturityDays] = useState('');
  const [vaultName, setVaultName] = useState('');
  const [vaultSymbol, setVaultSymbol] = useState('');

  const {
    writeContract,
    data: hash,
    isPending,
    error: writeError,
  } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } =
    useWaitForTransactionReceipt({
      hash,
    });

  const handleCreateVault = () => {
    if (
      !principalAmount ||
      !interestRate ||
      !maturityDays ||
      !vaultName ||
      !vaultSymbol ||
      !address ||
      !contracts
    ) {
      alert('Please fill in all required fields and ensure you are connected to a supported network');
      return;
    }

    const principal = parseUnits(principalAmount, 6); // USDC has 6 decimals
    const interest = BigInt(Math.floor(parseFloat(interestRate) * 100)); // Convert to basis points
    const protocolFee = BigInt(200); // 2% = 200 basis points
    const maturityDate =
      BigInt(Math.floor(Date.now() / 1000)) +
      BigInt(parseInt(maturityDays) * 24 * 60 * 60);

    // The createVault function expects 6 parameters:
    // principalAmount, interestRate, protocolFeeRate, maturityDate, name, symbol
    writeContract({
      address: contracts.VAULT_FACTORY,
      abi: VaultFactoryABI,
      functionName: 'createVault',
      args: [
        principal,
        interest,
        protocolFee,
        maturityDate,
        vaultName,
        vaultSymbol,
      ],
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
          Vault Name
        </label>
        <input
          type="text"
          value={vaultName}
          onChange={(e) => setVaultName(e.target.value)}
          placeholder="My Funding Vault"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
          Vault Symbol
        </label>
        <input
          type="text"
          value={vaultSymbol}
          onChange={(e) => setVaultSymbol(e.target.value)}
          placeholder="MFV"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
          Principal Amount (USDC)
        </label>
        <input
          type="number"
          value={principalAmount}
          onChange={(e) => setPrincipalAmount(e.target.value)}
          placeholder="50000"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
          Interest Rate (%)
        </label>
        <input
          type="number"
          step="0.1"
          value={interestRate}
          onChange={(e) => setInterestRate(e.target.value)}
          placeholder="12.0"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
          Maturity (Days)
        </label>
        <input
          type="number"
          value={maturityDays}
          onChange={(e) => setMaturityDays(e.target.value)}
          placeholder="365"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        />
      </div>

      <button
        onClick={handleCreateVault}
        disabled={isPending || isConfirming}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending || isConfirming
          ? 'Creating Vault...'
          : isSuccess
          ? 'Vault Created!'
          : 'Create Vault'}
      </button>

      {writeError && (
        <div className="text-red-600 text-sm">
          Error: {writeError.message}
        </div>
      )}

      {isSuccess && hash && (
        <div className="text-green-600 text-sm">
          Vault created successfully!{' '}
          <a
            href={
              chainId === 84532
                ? `https://sepolia.basescan.org/tx/${hash}`
                : chainId === 11155111
                ? `https://sepolia.etherscan.io/tx/${hash}`
                : chainId === 1301
                ? `https://uniscan.uniwhale.io/tx/${hash}`
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
    </div>
  );
}

