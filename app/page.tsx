'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AuthCard,
  useLogout,
  useSignerStatus,
  useAlchemyAccountContext,
} from '@account-kit/react';
import { useDisconnect } from '@/lib/wagmi/compat';
import { useAuth } from '@/lib/hooks/useAuth';
import { useNavigation } from '@/lib/contexts/NavigationContext';
import Image from 'next/image';

export default function SignInPage() {
  const router = useRouter();
  const { isAuthenticated, isInitializing, isConnected, isSigningIn, error, signIn } = useAuth();
  const { isConnected: isSignerConnected, isInitializing: isSignerInitializing } = useSignerStatus();
  const { onboardingStep } = useNavigation();
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
  // This is the SINGLE source of truth for post-login routing.
  // Uses replace() so the sign-in page is removed from browser history
  // (prevents back-button bouncing).
  useEffect(() => {
    if (!isAuthenticated) return;
    // Wait until we know the onboarding step (null = still loading)
    if (onboardingStep === null) return;
    if (onboardingStep === 'NOT_STARTED' || onboardingStep === 'TYPE_SELECTED') {
      router.replace('/onboarding');
    } else {
      router.replace('/profile');
    }
  }, [isAuthenticated, onboardingStep, router]);

  // ── Auto-reset on error: go back to AuthCard silently ───────────
  useEffect(() => {
    if (!error) return;
    // Give a brief moment so the failure is logged, then reset
    const t = setTimeout(() => {
      hasAutoSigned.current = false;
      wasConnectedBefore.current = false;
      if (isSignerConnected) logout();
      disconnectEoa();
    }, 600);
    return () => clearTimeout(t);
  }, [error, isSignerConnected, logout, disconnectEoa]);



  // ── Loading ─────────────────────────────────────────────────────
  if (!pageReady) {
    return (
      <div className="min-h-screen bg-[#0a0d14] flex flex-col items-center justify-center gap-4">
        <Image src="/convexoblanco.png" alt="Convexo" width={200} height={80} className="object-contain opacity-80" />
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
            <Image src="/convexoblanco.png" alt="Convexo" width={200} height={80} className="object-contain" priority />
          </div>
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

        {/* Error → auto-resets to AuthCard (handled by useEffect above) */}

        {/* Connected, idle — auto-SIWE will kick in */}

        <p className="text-center text-xs text-gray-600">
          Protocol v2.1 · Powered by Alchemy Account Kit
        </p>
      </div>
    </div>
  );
}
