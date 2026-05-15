'use client';

import { useAccount, useChainId, useReadContract } from '@/lib/wagmi/compat';
import { useState } from 'react';
import { parseUnits, formatUnits } from 'viem';
import { getContractsForChain } from '@/lib/contracts/addresses';
import { ecopAbi } from '@/lib/contracts/ecopAbi';
import { useNFTBalance } from '@/lib/hooks/useNFTBalance';
import { apiFetch } from '@/lib/api/client';
import Link from 'next/link';
import {
  BanknotesIcon,
  LockClosedIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

export default function FiatToStablePage() {
  const { address, isConnected } = useAccount();
  const { hasPassportNFT } = useNFTBalance();

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center h-full min-h-[80vh]">
        <div className="text-center p-8">
          <BanknotesIcon className="w-16 h-16 mx-auto mb-4 text-gray-500" />
          <h2 className="text-2xl font-bold text-white mb-2">Connect Your Wallet</h2>
          <p className="text-gray-400">Connect your wallet to access Fiat ↔ ECOP</p>
        </div>
      </div>
    );
  }

  if (!hasPassportNFT) {
    return (
      <div className="p-8">
        <div className="max-w-2xl mx-auto">
          <div className="card p-8 text-center">
            <LockClosedIcon className="w-16 h-16 mx-auto mb-4 text-gray-500" />
            <h2 className="text-2xl font-bold text-white mb-2">Tier 1 Required</h2>
            <p className="text-gray-400 mb-6">
              You need a CONVEXO PASSPORT (Tier 1) to access Fiat ↔ ECOP.
            </p>
            <Link href="/digital-id/humanity">
              <button className="btn-primary">Get Verified with ZKPassport</button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-5xl mx-auto space-y-8">

        {/* Header */}
        <div>
          <div className="flex items-center gap-3 mb-2 text-sm">
            <Link href="/treasury" className="text-gray-400 hover:text-white transition-colors">Treasury</Link>
            <span className="text-gray-600">/</span>
            <span className="text-white">Fiat ↔ ECOP</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Fiat ↔ ECOP</h1>
          <p className="text-gray-400">
            Request ECOP stablecoins from COP fiat, or redeem ECOP back to fiat.
            ECOP is the Colombian Peso stablecoin pegged 1:1 with COP.
          </p>
        </div>

        {/* Info notice */}
        <div className="p-4 bg-blue-900/20 border border-blue-700/30 rounded-xl">
          <p className="text-sm text-blue-300">
            <span className="font-semibold">How it works:</span> Submit a request and a Convexo agent
            will contact you to complete the transaction. Processing takes 1–2 business days.
          </p>
        </div>

        {/* Forms */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <MintECOP address={address} />
          <RedeemECOP address={address} />
        </div>

        <ECOPBalance address={address} />
      </div>
    </div>
  );
}

// ─── Mint ──────────────────────────────────────────────────────────────────────

function MintECOP({ address }: { address: string | undefined }) {
  const [fiatAmount, setFiatAmount] = useState('');
  const [email, setEmail] = useState('');
  const [telegram, setTelegram] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!fiatAmount || !address) { setError('Please enter an amount'); return; }
    if (!email && !telegram) { setError('Provide at least one contact method'); return; }
    setIsSubmitting(true);
    setError(null);
    try {
      const data = await apiFetch<{ id: string; requestId?: string }>('/funding/fiat-to-ecop', {
        method: 'POST',
        body: JSON.stringify({
          type: 'MINT',
          fiatAmount: parseFloat(fiatAmount),
          ecopAmount: parseFloat(fiatAmount),
          walletAddress: address,
          email: email || undefined,
          telegram: telegram || undefined,
        }),
      });
      setRequestId(data.id ?? data.requestId ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit request');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (requestId) {
    return (
      <div className="card p-6 text-center space-y-4">
        <CheckCircleIcon className="w-12 h-12 text-emerald-400 mx-auto" />
        <p className="text-white font-semibold text-lg">Request submitted!</p>
        <p className="text-gray-400 text-sm">ID: <span className="font-mono">{requestId}</span></p>
        <p className="text-gray-400 text-sm">
          An agent will contact you via {email ? `email (${email})` : `Telegram (${telegram})`} to
          confirm the COP transfer and mint {fiatAmount} ECOP to your wallet.
        </p>
        <button
          onClick={() => { setRequestId(null); setFiatAmount(''); setEmail(''); setTelegram(''); }}
          className="btn-secondary w-full"
        >
          Submit another request
        </button>
      </div>
    );
  }

  return (
    <div className="card p-6 space-y-4">
      <h2 className="text-xl font-semibold text-white">COP → ECOP</h2>
      <p className="text-sm text-gray-400">Send fiat COP and receive ECOP at 1:1 rate.</p>

      {error && (
        <div className="p-3 bg-red-900/20 border border-red-700/40 rounded-xl">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      <div>
        <label className="block text-sm text-gray-400 mb-1">Amount (COP) *</label>
        <input
          type="number"
          value={fiatAmount}
          onChange={e => setFiatAmount(e.target.value)}
          placeholder="1,000,000"
          min="0"
          className="w-full px-4 py-3 bg-gray-900/60 border border-gray-700/50 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-purple-500"
        />
        {fiatAmount && (
          <p className="text-xs text-gray-500 mt-1">You receive: {fiatAmount} ECOP (1:1)</p>
        )}
      </div>

      <div>
        <label className="block text-sm text-gray-400 mb-1">Email</label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="your@email.com"
          className="w-full px-4 py-3 bg-gray-900/60 border border-gray-700/50 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-purple-500"
        />
      </div>

      <div>
        <label className="block text-sm text-gray-400 mb-1">Telegram</label>
        <input
          type="text"
          value={telegram}
          onChange={e => setTelegram(e.target.value)}
          placeholder="@username"
          className="w-full px-4 py-3 bg-gray-900/60 border border-gray-700/50 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-purple-500"
        />
        <p className="text-xs text-gray-500 mt-1">Provide at least one contact method</p>
      </div>

      <button
        onClick={handleSubmit}
        disabled={isSubmitting || !fiatAmount || (!email && !telegram)}
        className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? 'Submitting…' : 'Request ECOP Mint'}
      </button>
    </div>
  );
}

// ─── Redeem ────────────────────────────────────────────────────────────────────

function RedeemECOP({ address }: { address: string | undefined }) {
  const chainId = useChainId();
  const contracts = getContractsForChain(chainId);
  const [ecopAmount, setEcopAmount] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [email, setEmail] = useState('');
  const [telegram, setTelegram] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const ecopEnabled = !!address && !!contracts && contracts.ECOP !== '0x0000000000000000000000000000000000000000';
  const { data: balance } = useReadContract({
    address: contracts?.ECOP,
    abi: ecopAbi,
    functionName: 'balanceOf',
    args: address ? [address as `0x${string}`] : undefined,
    query: { enabled: ecopEnabled },
  });

  const handleSubmit = async () => {
    if (!ecopAmount || !address) { setError('Please enter an amount'); return; }
    if (!email && !telegram) { setError('Provide at least one contact method'); return; }
    if (!bankAccount) { setError('Please provide your bank account details'); return; }
    const amount = parseUnits(ecopAmount, 18);
    if (balance && balance < amount) { setError('Insufficient ECOP balance'); return; }
    setIsSubmitting(true);
    setError(null);
    try {
      const data = await apiFetch<{ id: string; requestId?: string }>('/funding/ecop-to-fiat', {
        method: 'POST',
        body: JSON.stringify({
          type: 'REDEEM',
          fiatAmount: parseFloat(ecopAmount),
          ecopAmount: parseFloat(ecopAmount),
          walletAddress: address,
          email: email || undefined,
          telegram: telegram || undefined,
          bankAccount: bankAccount || undefined,
        }),
      });
      setRequestId(data.id ?? data.requestId ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit request');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (requestId) {
    return (
      <div className="card p-6 text-center space-y-4">
        <CheckCircleIcon className="w-12 h-12 text-emerald-400 mx-auto" />
        <p className="text-white font-semibold text-lg">Redemption submitted!</p>
        <p className="text-gray-400 text-sm">ID: <span className="font-mono">{requestId}</span></p>
        <p className="text-gray-400 text-sm">
          An agent will contact you to confirm the ECOP burn and transfer {ecopAmount} COP to your bank account.
        </p>
        <button
          onClick={() => { setRequestId(null); setEcopAmount(''); setBankAccount(''); setEmail(''); setTelegram(''); }}
          className="btn-secondary w-full"
        >
          Submit another request
        </button>
      </div>
    );
  }

  return (
    <div className="card p-6 space-y-4">
      <h2 className="text-xl font-semibold text-white">ECOP → COP</h2>
      <p className="text-sm text-gray-400">Redeem ECOP for fiat COP at 1:1 rate.</p>

      {error && (
        <div className="p-3 bg-red-900/20 border border-red-700/40 rounded-xl">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      <div>
        <label className="block text-sm text-gray-400 mb-1">ECOP Amount *</label>
        <input
          type="number"
          value={ecopAmount}
          onChange={e => setEcopAmount(e.target.value)}
          placeholder="1000"
          min="0"
          className="w-full px-4 py-3 bg-gray-900/60 border border-gray-700/50 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-purple-500"
        />
        {balance && (
          <p className="text-xs text-gray-500 mt-1">
            Available: {parseFloat(formatUnits(balance, 18)).toLocaleString()} ECOP
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm text-gray-400 mb-1">Bank Account *</label>
        <input
          type="text"
          value={bankAccount}
          onChange={e => setBankAccount(e.target.value)}
          placeholder="Account number, bank name…"
          className="w-full px-4 py-3 bg-gray-900/60 border border-gray-700/50 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-purple-500"
        />
      </div>

      <div>
        <label className="block text-sm text-gray-400 mb-1">Email</label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="your@email.com"
          className="w-full px-4 py-3 bg-gray-900/60 border border-gray-700/50 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-purple-500"
        />
      </div>

      <div>
        <label className="block text-sm text-gray-400 mb-1">Telegram</label>
        <input
          type="text"
          value={telegram}
          onChange={e => setTelegram(e.target.value)}
          placeholder="@username"
          className="w-full px-4 py-3 bg-gray-900/60 border border-gray-700/50 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-purple-500"
        />
        <p className="text-xs text-gray-500 mt-1">Provide at least one contact method</p>
      </div>

      <button
        onClick={handleSubmit}
        disabled={isSubmitting || !ecopAmount || !bankAccount || (!email && !telegram)}
        className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? 'Submitting…' : 'Request ECOP Redemption'}
      </button>
    </div>
  );
}

// ─── Balance ───────────────────────────────────────────────────────────────────

function ECOPBalance({ address }: { address: string | undefined }) {
  const chainId = useChainId();
  const contracts = getContractsForChain(chainId);
  const ecopEnabled = !!address && !!contracts && contracts.ECOP !== '0x0000000000000000000000000000000000000000';

  const { data: balance, isLoading } = useReadContract({
    address: contracts?.ECOP,
    abi: ecopAbi,
    functionName: 'balanceOf',
    args: address ? [address as `0x${string}`] : undefined,
    query: { enabled: ecopEnabled },
  });

  if (isLoading) {
    return (
      <div className="card p-6">
        <div className="h-4 w-32 bg-gray-700 rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="card p-6">
      <p className="text-sm text-gray-400 mb-1">Your ECOP Balance</p>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold text-emerald-400">
          {balance ? parseFloat(formatUnits(balance, 18)).toLocaleString() : '0'}
        </span>
        <span className="text-gray-400">ECOP</span>
      </div>
      {address && (
        <p className="text-xs text-gray-600 font-mono mt-2">{address.slice(0, 6)}…{address.slice(-4)}</p>
      )}
    </div>
  );
}
