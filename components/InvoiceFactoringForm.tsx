'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits, keccak256, stringToBytes } from 'viem';
import { CONTRACTS } from '@/lib/contracts/addresses';
import { InvoiceFactoringABI } from '@/lib/contracts/abis';

export function InvoiceFactoringForm() {
  const { address } = useAccount();
  const [invoiceAmount, setInvoiceAmount] = useState('');
  const [maturityDays, setMaturityDays] = useState('');
  const [contractHash, setContractHash] = useState('');

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

  const handleCreateInvoice = () => {
    if (!invoiceAmount || !maturityDays || !address) {
      alert('Please fill in all required fields');
      return;
    }

    const amount = parseUnits(invoiceAmount, 6); // USDC has 6 decimals
    const maturityDate =
      BigInt(Math.floor(Date.now() / 1000)) +
      BigInt(parseInt(maturityDays) * 24 * 60 * 60);
    const hashValue = contractHash
      ? (contractHash as `0x${string}`)
      : keccak256(stringToBytes('invoice' + Date.now()));

    writeContract({
      address: CONTRACTS.BASE_SEPOLIA.INVOICE_FACTORING,
      abi: InvoiceFactoringABI,
      functionName: 'createInvoice',
      args: [address, amount, maturityDate, hashValue],
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
          Invoice Amount (USDC)
        </label>
        <input
          type="number"
          value={invoiceAmount}
          onChange={(e) => setInvoiceAmount(e.target.value)}
          placeholder="100000"
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
          placeholder="60"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
          Contract Hash (optional)
        </label>
        <input
          type="text"
          value={contractHash}
          onChange={(e) => setContractHash(e.target.value)}
          placeholder="0x..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        />
      </div>

      <button
        onClick={handleCreateInvoice}
        disabled={isPending || isConfirming}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending || isConfirming
          ? 'Creating Invoice...'
          : isSuccess
          ? 'Invoice Created!'
          : 'Create Invoice'}
      </button>

      {writeError && (
        <div className="text-red-600 text-sm">
          Error: {writeError.message}
        </div>
      )}

      {isSuccess && (
        <div className="text-green-600 text-sm">
          Invoice created successfully!{' '}
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

