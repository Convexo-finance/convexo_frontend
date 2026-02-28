'use client';

import { useSignerStatus } from '@account-kit/react';
import { useSmartWalletActivation } from '@/lib/hooks/useSmartWalletActivation';

function fmt(addr: string) {
  return addr.slice(0, 6) + '…' + addr.slice(-4);
}

function Spinner() {
  return (
    <svg className="animate-spin w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  );
}

/**
 * Shows smart wallet activation status for AlchemySigner users (email / passkey / Google).
 * External EOA wallets (MetaMask, WalletConnect) are skipped — they connect as plain EOAs.
 *
 * States:
 *   • Checking  — skeleton pulse while querying on-chain bytecode
 *   • Inactive  — banner with "Activate" CTA + benefits list
 *   • Activating — button spinner while user op is in flight
 *   • Active    — compact green badge confirming the wallet is live
 */
export function SmartWalletActivationBanner() {
  const { isConnected } = useSignerStatus();
  const {
    isActivated,
    isCheckingStatus,
    isActivating,
    activate,
    error,
    smartWalletAddress,
  } = useSmartWalletActivation();

  // Only relevant for embedded signer (email / passkey / Google) users
  if (!isConnected) return null;

  // ── Checking ──────────────────────────────────────────────────────────────
  if (isCheckingStatus) {
    return (
      <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4 animate-pulse">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-white/10 shrink-0" />
          <div className="space-y-2 flex-1">
            <div className="h-3.5 w-40 bg-white/10 rounded" />
            <div className="h-3 w-56 bg-white/10 rounded" />
          </div>
        </div>
      </div>
    );
  }

  // ── Active ─────────────────────────────────────────────────────────────────
  if (isActivated) {
    return (
      <div className="rounded-2xl border border-emerald-700/30 bg-emerald-900/10 px-4 py-3 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-emerald-500/15 flex items-center justify-center shrink-0">
          <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-emerald-300">Smart Wallet Active</p>
          <p className="text-xs text-emerald-600 truncate">
            Gas-free transactions enabled
            {smartWalletAddress && (
              <span className="ml-1.5 text-emerald-700">· {fmt(smartWalletAddress)}</span>
            )}
          </p>
        </div>
        <span className="text-[10px] font-semibold uppercase tracking-widest text-emerald-600 bg-emerald-900/40 px-2 py-0.5 rounded-full shrink-0">
          Live
        </span>
      </div>
    );
  }

  // ── Not activated ──────────────────────────────────────────────────────────
  return (
    <div className="rounded-2xl border border-amber-600/30 bg-amber-900/10 p-4 space-y-3">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-amber-500/15 flex items-center justify-center shrink-0 mt-0.5">
          <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-semibold text-amber-300">Activate your Smart Wallet</p>
          <p className="text-xs text-amber-600 mt-0.5">
            Your account is ready — one step left to go gas-free.
          </p>
        </div>
      </div>

      {/* Benefits */}
      <ul className="space-y-1 pl-11">
        {[
          'No ETH needed for gas — Convexo sponsors fees',
          'Batch multiple actions into a single transaction',
          'Same address, upgraded to a Smart Wallet',
        ].map((b) => (
          <li key={b} className="flex items-center gap-1.5 text-xs text-amber-700">
            <span className="w-1 h-1 rounded-full bg-amber-500 shrink-0" />
            {b}
          </li>
        ))}
      </ul>

      {/* Address preview */}
      {smartWalletAddress && (
        <p className="pl-11 text-xs text-amber-800 font-mono">
          {smartWalletAddress}
        </p>
      )}

      {/* Error */}
      {error && (
        <div className="pl-11 text-xs text-red-400 break-words">{error}</div>
      )}

      {/* CTA */}
      <div className="pl-11">
        <button
          onClick={activate}
          disabled={isActivating}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-60 disabled:cursor-not-allowed text-black font-semibold text-sm transition-colors"
        >
          {isActivating ? (
            <>
              <Spinner />
              Activating…
            </>
          ) : (
            <>
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Activate Smart Wallet
            </>
          )}
        </button>
        <p className="text-[10px] text-amber-800 mt-1.5">
          Signs one transaction — gas-free, sponsored by Convexo.
        </p>
      </div>
    </div>
  );
}
