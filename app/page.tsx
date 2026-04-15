'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AuthCard,
  useLogout,
  useSignerStatus,
} from '@account-kit/react';
import { useAuth } from '@/lib/hooks/useAuth';
import { useNavigation } from '@/lib/contexts/NavigationContext';
import Image from 'next/image';

export default function SignInPage() {
  const router = useRouter();
  const { isAuthenticated, isInitializing, isConnected, isSigningIn, error, clearError, signIn, user } = useAuth();
  const { isConnected: isSignerConnected, isInitializing: isSignerInitializing } = useSignerStatus();
  const { onboardingStep } = useNavigation();
  const { logout } = useLogout();

  // ── Refs ─────────────────────────────────────────────────────────
  const hasAutoSigned = useRef(false);
  // null = first render, not yet observed. Prevents auto-SIWE triggering
  // on a stale wallet connection left over from a previous logout.
  // Auto-SIWE only fires on a false→true transition observed AFTER mount.
  const prevConnected = useRef<boolean | null>(null);

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

    // First observation: record baseline.
    // If the wallet is already connected on mount (e.g. Google OAuth popup
    // just completed and Alchemy restored the session from cookie), we check
    // whether a JWT exists. No JWT = fresh OAuth return → trigger SIWE now.
    // If a JWT exists, useAuth already restored the session → isAuthenticated
    // will be true and this effect short-circuits at the top.
    // After logout: signOut() clears the JWT AND calls alchemyLogout() which
    // disconnects the signer, so isConnected will be false on next mount.
    if (prevConnected.current === null) {
      prevConnected.current = isConnected;
      if (isConnected) {
        const hasJwt = typeof window !== 'undefined' &&
          !!sessionStorage.getItem('convexo_jwt');
        if (!hasJwt) {
          hasAutoSigned.current = true;
          signIn();
        }
      }
      return;
    }

    if (!prevConnected.current && isConnected) {
      hasAutoSigned.current = true;
      signIn();
    }
    prevConnected.current = isConnected;
  }, [pageReady, isConnected, isAuthenticated, error, signIn]);

  // ── Redirect on auth ────────────────────────────────────────────
  // Uses replace() so sign-in is removed from browser history.
  // Fast path: user.onboardingStep from the JWT payload is available
  // immediately (no network fetch). NavigationContext's onboardingStep
  // requires a GET /onboarding/status call which can take 1-2 seconds.
  useEffect(() => {
    if (!isAuthenticated || !user) return;
    // JWT payload has onboardingStep encoded at sign-in time.
    // Fall back to NavigationContext value while it loads.
    const step = user.onboardingStep ?? onboardingStep;
    if (step === null) return; // both sources still loading
    if (step === 'NOT_STARTED' || step === 'TYPE_SELECTED') {
      router.replace('/onboarding');
    } else {
      router.replace('/profile');
    }
  }, [isAuthenticated, user, onboardingStep, router]);

  // ── Auto-reset on error: show message, then clear and go back to AuthCard ──
  useEffect(() => {
    if (!error) return;
    // Show the error card for 3 s so the user can read it, then clean up.
    const t = setTimeout(() => {
      clearError();
      hasAutoSigned.current = false;
      // Set baseline to false so the NEXT connection attempt triggers SIWE
      prevConnected.current = false;
      // Disconnect any stale wallet so the user sees a fresh AuthCard
      if (isSignerConnected) logout();
    }, 3_000);
    return () => clearTimeout(t);
  }, [error, clearError, isSignerConnected, logout]);



  // ── Loading / redirecting ────────────────────────────────────────
  // Show spinner while initializing OR while authenticated user waits
  // for the redirect to /profile or /onboarding. Never show the AuthCard
  // to an authenticated user — it would flash before the redirect fires.
  if (!pageReady || isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0a0d14] flex flex-col items-center justify-center gap-4">
        <Image src="/convexoblanco.png" alt="Convexo" width={200} height={80} className="object-contain opacity-80" />
        <div className="w-7 h-7 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  // ── Sign-in UI — only shown when NOT authenticated ───────────────
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

        {/* AuthCard — Alchemy's connect UI. Shown when wallet not yet connected. */}
        {!isConnected && (
          <div className="rounded-2xl overflow-hidden shadow-2xl shadow-black/40">
            <AuthCard />
          </div>
        )}

        {/* Signing in progress */}
        {isConnected && isSigningIn && (
          <div className="rounded-2xl bg-[#0f1219] border border-gray-800/50 p-6 shadow-2xl shadow-black/40">
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

        {/* SIWE error — visible for 3 s then auto-resets to AuthCard */}
        {error && (
          <div className="rounded-2xl bg-[#0f1219] border border-red-800/40 p-5 shadow-2xl shadow-black/40">
            <div className="flex flex-col items-center gap-2 text-center">
              <p className="text-red-400 font-medium text-sm">Sign-in failed</p>
              <p className="text-gray-500 text-xs">{error}</p>
            </div>
          </div>
        )}

        {/* Connected but not yet signing — waiting for auto-SIWE or manual retry */}
        {isConnected && !isSigningIn && !error && (
          <div className="flex flex-col items-center gap-3 py-4">
            <div className="w-5 h-5 rounded-full border-2 border-purple-500/40 border-t-purple-500 animate-spin" />
            <button
              onClick={() => { hasAutoSigned.current = false; signIn(); }}
              className="text-xs text-purple-400 hover:text-purple-300 underline underline-offset-2"
            >
              Try again
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
