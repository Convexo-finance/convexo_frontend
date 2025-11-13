'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits, keccak256, stringToBytes } from 'viem';
import { useUserReputation } from '@/lib/hooks/useUserReputation';
import { useNFTBalance } from '@/lib/hooks/useNFTBalance';
import { CONTRACTS } from '@/lib/contracts/addresses';
import { TokenizedBondCreditsABI } from '@/lib/contracts/abis';
import { PinataUpload } from '@/components/PinataUpload';
import { CreditList } from '@/components/CreditList';
import DashboardLayout from '@/components/DashboardLayout';

export default function CreditsPage() {
  const { isConnected, address } = useAccount();
  const { tier, hasCreditscoreAccess } = useUserReputation();
  const { hasLPsNFT, hasVaultsNFT } = useNFTBalance();

  if (!isConnected) {
    return (
      <DashboardLayout>
        <div className="p-8">
          <div className="text-center py-20">
            <h2 className="text-2xl font-semibold mb-4">Please connect your wallet</h2>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold mb-8 text-gray-900 dark:text-white">
            Tokenized Bond Credits
          </h1>

          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>About Tokenized Bond Credits:</strong> Get cash flow-backed loans with daily tracking. 
              Requires Tier 2 (both NFTs) and credit score above 70. Loans are disbursed in local currency 
              using price feeds, and repayments are managed automatically.
            </p>
          </div>

          {!hasCreditscoreAccess && (
            <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <h3 className="text-lg font-semibold mb-2 text-yellow-800 dark:text-yellow-200">
                Access Required
              </h3>
              <p className="text-yellow-700 dark:text-yellow-300">
                You need Tier 2 (both NFTs) to create credits. Current status:
              </p>
              <div className="mt-2 space-y-1 text-sm">
                <p className={hasLPsNFT ? 'text-green-600' : 'text-red-600'}>
                  Convexo_LPs NFT: {hasLPsNFT ? '✓ Owned' : '✗ Not Owned'}
                </p>
                <p className={hasVaultsNFT ? 'text-green-600' : 'text-red-600'}>
                  Convexo_Vaults NFT: {hasVaultsNFT ? '✓ Owned' : '✗ Not Owned'}
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {hasCreditscoreAccess && (
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
                <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                  Create New Credit
                </h2>
                <CreateCreditForm />
              </div>
            )}

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                Your Credits
              </h2>
              <CreditList filterByAddress={address} />
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function CreateCreditForm() {
  const { address } = useAccount();
  const [creditAmount, setCreditAmount] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [maturityDays, setMaturityDays] = useState('');
  const [contractHash, setContractHash] = useState('');
  const [ipfsHash, setIpfsHash] = useState('');

  const {
    writeContract,
    data: hash,
    isPending,
    error: writeError,
  } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const handleCreateCredit = () => {
    if (!creditAmount || !interestRate || !maturityDays || !address) {
      alert('Please fill in all required fields');
      return;
    }

    const amount = parseUnits(creditAmount, 6); // USDC has 6 decimals
    const interest = BigInt(Math.floor(parseFloat(interestRate) * 100)); // Convert to basis points
    const maturityDate =
      BigInt(Math.floor(Date.now() / 1000)) +
      BigInt(parseInt(maturityDays) * 24 * 60 * 60);
    const hashValue = contractHash
      ? (contractHash as `0x${string}`)
      : keccak256(stringToBytes('credit' + Date.now()));

    // Note: Adjust function name and args based on actual TokenizedBondCredits ABI
    writeContract({
      address: CONTRACTS.BASE_SEPOLIA.TOKENIZED_BOND_CREDITS,
      abi: TokenizedBondCreditsABI,
      functionName: 'createCredit', // Adjust based on actual ABI
      args: [address, amount, interest, maturityDate, hashValue],
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
          Credit Amount (USDC)
        </label>
        <input
          type="number"
          value={creditAmount}
          onChange={(e) => setCreditAmount(e.target.value)}
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
          placeholder="10.0"
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
          placeholder="180"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
          Contract Hash (optional)
        </label>
        <div className="mb-3">
          <PinataUpload
            walletAddress={address}
            onUploadSuccess={(hash, uri) => {
              // Extract hash from ipfs://... format
              const extractedHash = uri.replace('ipfs://', '');
              setIpfsHash(extractedHash);
              // Generate contract hash from IPFS hash
              setContractHash(keccak256(stringToBytes(extractedHash)));
            }}
            onUploadError={(error) => {
              alert(`Upload failed: ${error}`);
            }}
          />
        </div>
        <input
          type="text"
          value={contractHash}
          onChange={(e) => setContractHash(e.target.value)}
          placeholder="0x... (from Contract Signer or IPFS)"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Optional: Create a contract on the{' '}
          <a href="/contracts" className="text-blue-600 dark:text-blue-400 underline">
            Contracts page
          </a>{' '}
          (Agreement Type: Tokenized Bond Credits) and paste the document hash here. Or upload a PDF above.
        </p>
      </div>

      <button
        onClick={handleCreateCredit}
        disabled={isPending || isConfirming}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending || isConfirming
          ? 'Creating Credit...'
          : isSuccess
          ? 'Credit Created!'
          : 'Create Credit'}
      </button>

      {writeError && (
        <div className="text-red-600 text-sm">
          Error: {writeError.message}
        </div>
      )}

      {isSuccess && (
        <div className="text-green-600 text-sm">
          Credit created successfully!{' '}
          <a
            href={`https://sepolia.basescan.org/tx/${hash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            View on BaseScan
          </a>
        </div>
      )}
    </div>
  );
}

