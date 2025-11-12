'use client';

import { useAccount } from 'wagmi';
import { useState } from 'react';
import { useContractRead, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import { CONTRACTS } from '@/lib/contracts/addresses';
import { erc20Abi } from 'viem';
import { ecopAbi } from '@/lib/contracts/ecopAbi';
import DashboardLayout from '@/components/DashboardLayout';

export default function FundingPage() {
  const { address, isConnected } = useAccount();

  if (!isConnected) {
    return (
      <DashboardLayout>
        <div className="p-8">
          <div className="text-center py-20">
            <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
              Please connect your wallet
            </h2>
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
            Funding - ECOP Stablecoin
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            Mint ECOP stablecoins from fiat or redeem ECOP back to fiat. ECOP
            is the Colombian Peso stablecoin pegged 1:1 with COP.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <MintECOP />
            <RedeemECOP />
          </div>

          <ECOPBalance />
        </div>
      </div>
    </DashboardLayout>
  );
}

function MintECOP() {
  const { address } = useAccount();
  const [fiatAmount, setFiatAmount] = useState('');
  const [ecopAmount, setEcopAmount] = useState('');

  const {
    writeContract: mint,
    data: mintHash,
    isPending: isMinting,
    error: mintError,
  } = useWriteContract();

  const { isLoading: isConfirmingMint, isSuccess: mintSuccess } =
    useWaitForTransactionReceipt({
      hash: mintHash,
    });

  const handleMint = () => {
    if (!fiatAmount || !address) {
      alert('Please enter an amount');
      return;
    }

    // Assuming 1:1 rate (1 COP = 1 ECOP)
    const amount = parseUnits(fiatAmount, 18); // Assuming 18 decimals

    mint({
      address: CONTRACTS.BASE_SEPOLIA.ECOP,
      abi: ecopAbi,
      functionName: 'mint',
      args: [address, amount],
    });
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
        Mint ECOP from Fiat
      </h2>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        Send fiat (COP) and receive ECOP stablecoins. This action mints new
        ECOP tokens to your address.
      </p>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
            Fiat Amount (COP)
          </label>
          <input
            type="number"
            value={fiatAmount}
            onChange={(e) => {
              setFiatAmount(e.target.value);
              setEcopAmount(e.target.value); // 1:1 rate
            }}
            placeholder="1000"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
            ECOP Amount (1:1 rate)
          </label>
          <input
            type="text"
            value={ecopAmount}
            readOnly
            className="w-full px-4 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white bg-gray-50"
          />
        </div>

        <button
          onClick={handleMint}
          disabled={isMinting || isConfirmingMint || !fiatAmount}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isMinting || isConfirmingMint
            ? 'Minting...'
            : mintSuccess
            ? 'Minted!'
            : 'Mint ECOP'}
        </button>

        {mintError && (
          <div className="text-red-600 text-sm">
            Error: {mintError.message}
          </div>
        )}

        {mintSuccess && (
          <div className="text-green-600 text-sm">
            ECOP minted successfully!{' '}
            <a
              href={`https://sepolia.basescan.org/tx/${mintHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              View on BaseScan
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

function RedeemECOP() {
  const { address } = useAccount();
  const [ecopAmount, setEcopAmount] = useState('');
  const [fiatAmount, setFiatAmount] = useState('');

  // Check ECOP balance
  const { data: balance } = useContractRead({
    address: address ? CONTRACTS.BASE_SEPOLIA.ECOP : undefined,
    abi: ecopAbi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  const {
    writeContract: burn,
    data: burnHash,
    isPending: isBurning,
    error: burnError,
  } = useWriteContract();

  const { isLoading: isConfirmingBurn, isSuccess: burnSuccess } =
    useWaitForTransactionReceipt({
      hash: burnHash,
    });

  const handleRedeem = () => {
    if (!ecopAmount || !address) {
      alert('Please enter an amount');
      return;
    }

    const amount = parseUnits(ecopAmount, 18);

    // Check if user has enough balance
    if (balance && balance < amount) {
      alert('Insufficient ECOP balance');
      return;
    }

    burn({
      address: CONTRACTS.BASE_SEPOLIA.ECOP,
      abi: ecopAbi,
      functionName: 'burn',
      args: [amount],
    });
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
        Redeem ECOP to Fiat
      </h2>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        Burn ECOP stablecoins to redeem fiat (COP). This action burns ECOP
        tokens and initiates the fiat redemption process.
      </p>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
            ECOP Amount to Redeem
          </label>
          <input
            type="number"
            value={ecopAmount}
            onChange={(e) => {
              setEcopAmount(e.target.value);
              setFiatAmount(e.target.value); // 1:1 rate
            }}
            placeholder="1000"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
          {balance && (
            <p className="text-sm text-gray-500 mt-1">
              Available: {formatUnits(balance, 18)} ECOP
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
            Fiat Amount (COP) - 1:1 rate
          </label>
          <input
            type="text"
            value={fiatAmount}
            readOnly
            className="w-full px-4 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white bg-gray-50"
          />
        </div>

        <button
          onClick={handleRedeem}
          disabled={isBurning || isConfirmingBurn || !ecopAmount}
          className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isBurning || isConfirmingBurn
            ? 'Redeeming...'
            : burnSuccess
            ? 'Redeemed!'
            : 'Redeem to Fiat'}
        </button>

        {burnError && (
          <div className="text-red-600 text-sm">
            Error: {burnError.message}
          </div>
        )}

        {burnSuccess && (
          <div className="text-green-600 text-sm">
            ECOP redeemed successfully! Fiat will be sent to your registered
            account.{' '}
            <a
              href={`https://sepolia.basescan.org/tx/${burnHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              View on BaseScan
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

function ECOPBalance() {
  const { address } = useAccount();

  const { data: balance, isLoading } = useContractRead({
    address: address ? CONTRACTS.BASE_SEPOLIA.ECOP : undefined,
    abi: ecopAbi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  const { data: symbol } = useContractRead({
    address: CONTRACTS.BASE_SEPOLIA.ECOP,
    abi: ecopAbi,
    functionName: 'symbol',
  });

  const { data: decimals } = useContractRead({
    address: CONTRACTS.BASE_SEPOLIA.ECOP,
    abi: ecopAbi,
    functionName: 'decimals',
  });

  if (isLoading) {
    return (
      <div className="mt-6 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
        <p className="text-gray-600 dark:text-gray-400">Loading balance...</p>
      </div>
    );
  }

  return (
    <div className="mt-6 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
      <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
        Your ECOP Balance
      </h3>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold text-gray-900 dark:text-white">
          {balance && decimals
            ? formatUnits(balance, decimals)
            : '0.00'}
        </span>
        <span className="text-xl text-gray-600 dark:text-gray-400">
          {symbol || 'ECOP'}
        </span>
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
        Address: {address?.slice(0, 6)}...{address?.slice(-4)}
      </p>
    </div>
  );
}

