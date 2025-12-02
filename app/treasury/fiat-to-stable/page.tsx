'use client';

import { useAccount } from 'wagmi';
import { useState } from 'react';
import { useContractRead } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import { CONTRACTS } from '@/lib/contracts/addresses';
import { ecopAbi } from '@/lib/contracts/ecopAbi';
import DashboardLayout from '@/components/DashboardLayout';
import { useNFTBalance } from '@/lib/hooks/useNFTBalance';

export default function FundingPage() {
  const { address, isConnected } = useAccount();
  const { hasLPsNFT } = useNFTBalance();

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

  if (!hasLPsNFT) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Compliance Required
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              You need to hold a Convexo LPs NFT (Compliance) to access Treasury services.
            </p>
            <a
              href="/get-verified/amlcft"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg"
            >
              Get Verified
            </a>
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
            FIAT to STABLE
          </h1>
          <div className="mb-8">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Request ECOP stablecoins from fiat or redeem ECOP back to fiat. ECOP
              is the Colombian Peso stablecoin pegged 1:1 with COP.
            </p>
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Note:</strong> Minting and redemption are processed manually by our agents. 
                After submitting your request, an agent will contact you via email or Telegram to complete the transaction.
              </p>
            </div>
          </div>

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
  const [email, setEmail] = useState('');
  const [telegram, setTelegram] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requestSubmitted, setRequestSubmitted] = useState(false);
  const [requestId, setRequestId] = useState<string | null>(null);

  const handleSubmitRequest = async () => {
    if (!fiatAmount || !address) {
      alert('Please enter an amount');
      return;
    }

    if (!email && !telegram) {
      alert('Please provide either email or Telegram contact');
      return;
    }

    setIsSubmitting(true);

    try {
      // Submit request to API
      const response = await fetch('/api/funding-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'MINT',
          amount: fiatAmount,
          ecopAmount: ecopAmount,
          address: address,
          email: email || null,
          telegram: telegram || null,
          bankAccount: null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit request');
      }

      const data = await response.json();
      setRequestId(data.requestId);
      setRequestSubmitted(true);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to submit request. Please try again.');
      console.error('Request submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (requestSubmitted) {
    return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
        <div className="text-center py-6">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Request Submitted Successfully!
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Request ID: <span className="font-mono text-sm">{requestId}</span>
          </p>
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 text-left">
            <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">
              <strong>What happens next?</strong>
            </p>
            <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1 list-disc list-inside">
              <li>An agent will contact you via {email ? `email (${email})` : `Telegram (${telegram})`}</li>
              <li>You'll receive instructions to send {fiatAmount} COP</li>
              <li>After verification, {ecopAmount} ECOP will be minted to your wallet</li>
              <li>Processing typically takes 1-2 business days</li>
            </ul>
          </div>
          <button
            onClick={() => {
              setRequestSubmitted(false);
              setFiatAmount('');
              setEcopAmount('');
              setEmail('');
              setTelegram('');
              setRequestId(null);
            }}
            className="mt-4 text-blue-600 dark:text-blue-400 hover:underline text-sm"
          >
            Submit Another Request
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
        Request ECOP from Fiat
      </h2>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        Submit a request to exchange fiat (COP) for ECOP stablecoins. An agent will contact you to complete the transaction.
      </p>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
            Fiat Amount (COP) *
          </label>
          <input
            type="number"
            value={fiatAmount}
            onChange={(e) => {
              setFiatAmount(e.target.value);
              setEcopAmount(e.target.value); // 1:1 rate
            }}
            placeholder="1000"
            min="0"
            step="0.01"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
            ECOP Amount (1:1 rate)
          </label>
          <input
            type="text"
            value={ecopAmount || '0'}
            readOnly
            className="w-full px-4 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white bg-gray-50 dark:bg-gray-900"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
            Email Address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your.email@example.com"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
            Telegram Username
          </label>
          <input
            type="text"
            value={telegram}
            onChange={(e) => setTelegram(e.target.value)}
            placeholder="@username"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Provide at least one contact method (email or Telegram)
          </p>
        </div>

        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
          <p className="text-xs text-yellow-800 dark:text-yellow-200">
            <strong>Wallet Address:</strong> {address?.slice(0, 6)}...{address?.slice(-4)}
            <br />
            ECOP will be minted to this address after agent verification.
          </p>
        </div>

        <button
          onClick={handleSubmitRequest}
          disabled={isSubmitting || !fiatAmount || (!email && !telegram)}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Submitting Request...' : 'Submit Request'}
        </button>
      </div>
    </div>
  );
}

function RedeemECOP() {
  const { address } = useAccount();
  const [ecopAmount, setEcopAmount] = useState('');
  const [fiatAmount, setFiatAmount] = useState('');
  const [email, setEmail] = useState('');
  const [telegram, setTelegram] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requestSubmitted, setRequestSubmitted] = useState(false);
  const [requestId, setRequestId] = useState<string | null>(null);

  // Check ECOP balance
  const { data: balance } = useContractRead({
    address: address ? CONTRACTS[84532].ECOP : undefined,
    abi: ecopAbi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  const handleSubmitRequest = async () => {
    if (!ecopAmount || !address) {
      alert('Please enter an amount');
      return;
    }

    if (!email && !telegram) {
      alert('Please provide either email or Telegram contact');
      return;
    }

    if (!bankAccount) {
      alert('Please provide bank account details for fiat transfer');
      return;
    }

    const amount = parseUnits(ecopAmount, 18);

    // Check if user has enough balance
    if (balance && balance < amount) {
      alert('Insufficient ECOP balance');
      return;
    }

    setIsSubmitting(true);

    try {
      // Submit request to API
      const response = await fetch('/api/funding-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'REDEEM',
          amount: fiatAmount,
          ecopAmount: ecopAmount,
          address: address,
          email: email || null,
          telegram: telegram || null,
          bankAccount: bankAccount || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit request');
      }

      const data = await response.json();
      setRequestId(data.requestId);
      setRequestSubmitted(true);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to submit request. Please try again.');
      console.error('Request submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (requestSubmitted) {
    return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
        <div className="text-center py-6">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Redemption Request Submitted!
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Request ID: <span className="font-mono text-sm">{requestId}</span>
          </p>
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 text-left">
            <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">
              <strong>What happens next?</strong>
            </p>
            <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1 list-disc list-inside">
              <li>An agent will contact you via {email ? `email (${email})` : `Telegram (${telegram})`}</li>
              <li>You'll receive instructions to burn {ecopAmount} ECOP from your wallet</li>
              <li>After verification, {fiatAmount} COP will be transferred to your bank account</li>
              <li>Processing typically takes 1-2 business days</li>
            </ul>
          </div>
          <button
            onClick={() => {
              setRequestSubmitted(false);
              setEcopAmount('');
              setFiatAmount('');
              setEmail('');
              setTelegram('');
              setBankAccount('');
              setRequestId(null);
            }}
            className="mt-4 text-blue-600 dark:text-blue-400 hover:underline text-sm"
          >
            Submit Another Request
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
        Redeem ECOP to Fiat
      </h2>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        Submit a request to redeem ECOP stablecoins for fiat (COP). An agent will contact you to complete the transaction.
      </p>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
            ECOP Amount to Redeem *
          </label>
          <input
            type="number"
            value={ecopAmount}
            onChange={(e) => {
              setEcopAmount(e.target.value);
              setFiatAmount(e.target.value); // 1:1 rate
            }}
            placeholder="1000"
            min="0"
            step="0.01"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
          {balance && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
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
            value={fiatAmount || '0'}
            readOnly
            className="w-full px-4 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white bg-gray-50 dark:bg-gray-900"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
            Bank Account Details *
          </label>
          <input
            type="text"
            value={bankAccount}
            onChange={(e) => setBankAccount(e.target.value)}
            placeholder="Account number, bank name, etc."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Where you want to receive the fiat (COP)
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
            Email Address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your.email@example.com"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
            Telegram Username
          </label>
          <input
            type="text"
            value={telegram}
            onChange={(e) => setTelegram(e.target.value)}
            placeholder="@username"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Provide at least one contact method (email or Telegram)
          </p>
        </div>

        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
          <p className="text-xs text-yellow-800 dark:text-yellow-200">
            <strong>Wallet Address:</strong> {address?.slice(0, 6)}...{address?.slice(-4)}
            <br />
            ECOP will be burned from this address after agent verification.
          </p>
        </div>

        <button
          onClick={handleSubmitRequest}
          disabled={isSubmitting || !ecopAmount || !bankAccount || (!email && !telegram)}
          className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Submitting Request...' : 'Submit Redemption Request'}
        </button>
      </div>
    </div>
  );
}

function ECOPBalance() {
  const { address } = useAccount();

  const { data: balance, isLoading } = useContractRead({
    address: address ? CONTRACTS[84532].ECOP : undefined,
    abi: ecopAbi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  const { data: symbol } = useContractRead({
    address: CONTRACTS[84532].ECOP,
    abi: ecopAbi,
    functionName: 'symbol',
  });

  const { data: decimals } = useContractRead({
    address: CONTRACTS[84532].ECOP,
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

