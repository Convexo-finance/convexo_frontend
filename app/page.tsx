'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  AuthCard,
  useLogout,
  useSignerStatus,
  useAlchemyAccountContext,
} from '@account-kit/react';
import { useDisconnect } from '@/lib/wagmi/compat';
import { useAccount } from '@/lib/wagmi/compat';
import { useAuth } from '@/lib/hooks/useAuth';
import Image from 'next/image';

export default function SignInPage() {
  const router = useRouter();
  const { address } = useAccount();
  const { isAuthenticated, isInitializing, isConnected, isSigningIn, error, signIn } = useAuth();
  const { isConnected: isSignerConnected, isInitializing: isSignerInitializing } = useSignerStatus();
  const { logout } = useLogout();
  const { config: akConfig } = useAlchemyAccountContext();
  const { disconnect: disconnectEoa } = useDisconnect({ config: akConfig._internal.wagmiConfig });

  // ── Refs ─────────────────────────────────────────────────────────
  const hasAutoSigned = useRef(false);
  const wasConnectedBefore = useRef(false);

  // ── Page ready ──────────────────────────────────────────────────
  // Wait for both useAuth (JWT check) and Alchemy SDK to finish init.
  // Safety timeout ensures we never stay on the spinner forever.
  const [pageReady, setPageReady] = useState(false);
  useEffect(() => {
    if (!isInitializing && !isSignerInitializing) {
      setPageReady(true);
      return;
    }
    const t = setTimeout(() => setPageReady(true), 2_000);
    return () => clearTimeout(t);
  }, [isInitializing, isSignerInitializing]);

  // ── Auto-SIWE after fresh AuthCard connect ──────────────────────
  useEffect(() => {
    if (!pageReady) return;
    if (hasAutoSigned.current) return;
    if (isAuthenticated) return;
    if (error) return;

    if (!wasConnectedBefore.current && isConnected) {
      hasAutoSigned.current = true;
      signIn();
    }
    wasConnectedBefore.current = isConnected;
  }, [pageReady, isConnected, isAuthenticated, error, signIn]);

  // ── Redirect on auth ────────────────────────────────────────────
  useEffect(() => {
    if (isAuthenticated) router.push('/profile');
  }, [isAuthenticated, router]);

  // ── Disconnect everything → back to AuthCard ────────────────────
  const handleDifferentAccount = useCallback(() => {
    hasAutoSigned.current = false;
    wasConnectedBefore.current = false;
    if (isSignerConnected) logout();
    disconnectEoa();
  }, [isSignerConnected, logout, disconnectEoa]);

  // ── Loading ─────────────────────────────────────────────────────
  if (!pageReady) {
    return (
      <div className="min-h-screen bg-[#0a0d14] flex flex-col items-center justify-center gap-4">
        <Image src="/logo_convexo.png" alt="Convexo" width={56} height={56} className="object-contain opacity-80" />
        <div className="w-7 h-7 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  // ── Main ────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0a0d14] flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">

        {/* Branding */}
        <div className="text-center">
          <div className="flex justify-center mb-5">
            <Image src="/logo_convexo.png" alt="Convexo" width={80} height={80} className="object-contain" priority />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Convexo</h1>
          <p className="text-gray-400 text-sm">Reducing the funding gap for SMEs in Latin America</p>
        </div>

        {/* AuthCard — visible when not connected */}
        {!isConnected && (
          <div className="rounded-2xl overflow-hidden shadow-2xl shadow-black/40">
            <AuthCard />
          </div>
        )}

        {/* Auto-signing state */}
        {isConnected && !isAuthenticated && isSigningIn && (
          <div className="rounded-2xl bg-[#0f1219] border border-gray-800/50 p-6 shadow-2xl shadow-black/40 space-y-4">
            <div className="flex flex-col items-center gap-3">
              <div className="w-7 h-7 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
              <p className="text-white font-medium text-sm">Verifying wallet ownership…</p>
              <p className="text-gray-500 text-xs text-center">
                {isSignerConnected
                  ? 'This is automatic for embedded wallets'
                  : 'Please approve the signature request in your wallet'}
              </p>
            </div>
          </div>
        )}

        {/* Error state */}
        {isConnected && !isAuthenticated && !isSigningIn && error && (
          <div className="rounded-2xl bg-[#0f1219] border border-red-800/30 p-6 shadow-2xl shadow-black/40 space-y-4">
            {address && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-800/50 w-fit mx-auto">
                <div className="w-2 h-2 rounded-full bg-red-400" />
                <span className="text-xs text-gray-400 font-mono">
                  {address.slice(0, 6)}…{address.slice(-4)}
                </span>
              </div>
            )}
            <p className="text-red-400 text-sm text-center bg-red-500/10 rounded-lg px-3 py-2">
              {error}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => { hasAutoSigned.current = false; signIn(); }}
                className="flex-1 px-4 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-sm transition-colors"
              >
                Try again
              </button>
              <button
                onClick={handleDifferentAccount}
                className="flex-1 px-4 py-3 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 font-semibold text-sm transition-colors"
              >
                Different account
              </button>
            </div>
          </div>
        )}

        {/* Connected, idle — fallback manual sign-in */}
        {isConnected && !isAuthenticated && !isSigningIn && !error && (
          <div className="rounded-2xl bg-[#0f1219] border border-gray-800/50 p-6 shadow-2xl shadow-black/40 space-y-4">
            {address && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-800/50 w-fit mx-auto">
                <div className="w-2 h-2 rounded-full bg-green-400" />
                <span className="text-xs text-gray-400 font-mono">
                  {address.slice(0, 6)}…{address.slice(-4)}
                </span>
              </div>
            )}
            <div className="text-center">
              <p className="text-white font-medium mb-1">Wallet connected</p>
              <p className="text-gray-500 text-sm">Continue to verify ownership</p>
            </div>
            <button
              onClick={signIn}
              disabled={isSigningIn}
              className="w-full px-4 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-sm transition-colors"
            >
              Continue to Convexo
            </button>
            <button
              onClick={handleDifferentAccount}
              className="w-full px-4 py-2 text-sm text-gray-500 hover:text-gray-300 transition-colors"
            >
              Use a different account
            </button>
          </div>
        )}

        <p className="text-center text-xs text-gray-600">
          Protocol v2.1 · Powered by Alchemy Account Kit
        </p>
      </div>
    </div>
  );
}
