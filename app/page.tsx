'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { usePrivy } from '@privy-io/react-auth';
import { useAuth } from '@/lib/hooks/useAuth';
import Image from 'next/image';

export default function SignInPage() {
  const router = useRouter();
  const { ready, authenticated, login } = usePrivy();
  const { isAuthenticated, isInitializing, isConnected, isSigningIn, signInStage, error, clearError, signIn } = useAuth();

  const signInAttempted = useRef(false);

  // Auto-SIWE: fires as soon as Privy wallet is connected
  useEffect(() => {
    if (!ready || isInitializing) return;
    if (isAuthenticated) { signInAttempted.current = false; return; }
    if (!isConnected) { signInAttempted.current = false; return; }
    if (isSigningIn || error) return;
    if (signInAttempted.current) return;

    signInAttempted.current = true;
    signIn();
  }, [ready, isInitializing, isAuthenticated, isConnected, isSigningIn, error, signIn]);

  useEffect(() => {
    if (isAuthenticated) router.replace('/profile');
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (!error) return;
    const t = setTimeout(clearError, 3_000);
    return () => clearTimeout(t);
  }, [error, clearError]);

  const isReady = ready && !isInitializing;

  if (!isReady || isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0a0d14] flex flex-col items-center justify-center gap-4">
        <Image src="/convexoblanco.png" alt="Convexo" width={200} height={80} className="object-contain opacity-80" />
        <div className="w-7 h-7 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0d14] flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">

        <div className="text-center">
          <div className="flex justify-center mb-5">
            <Image src="/convexoblanco.png" alt="Convexo" width={200} height={80} className="object-contain" priority />
          </div>
          <p className="text-gray-400 text-sm">Reducing the funding gap for SMEs in Latin America</p>
        </div>

        {/* Login button — shown until Privy authenticated */}
        {!authenticated && !error && (
          <div className="rounded-2xl overflow-hidden shadow-2xl shadow-black/40">
            <button
              onClick={login}
              className="w-full bg-purple-600 hover:bg-purple-500 transition-colors text-white font-semibold py-4 px-6 rounded-2xl text-base"
            >
              Sign In
            </button>
          </div>
        )}

        {/* Signing in progress */}
        {isConnected && isSigningIn && (
          <div className="rounded-2xl bg-[#0f1219] border border-gray-800/50 p-6 shadow-2xl shadow-black/40">
            <div className="flex flex-col items-center gap-4">
              <div className="w-7 h-7 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
              <div className="text-center space-y-1">
                <p className="text-white font-medium text-sm">
                  {signInStage === 'nonce'     && 'Preparing sign-in…'}
                  {signInStage === 'signing'   && 'Authenticating…'}
                  {signInStage === 'verifying' && 'Almost done…'}
                </p>
                <p className="text-gray-500 text-xs">
                  {signInStage === 'nonce'     && 'Fetching a one-time code'}
                  {signInStage === 'signing'   && 'Signing with your embedded wallet'}
                  {signInStage === 'verifying' && 'Confirming with server'}
                </p>
              </div>
              <div className="flex gap-2">
                {(['nonce', 'signing', 'verifying'] as const).map((s) => (
                  <div
                    key={s}
                    className={`h-1 w-8 rounded-full transition-colors ${signInStage === s ? 'bg-purple-500' : 'bg-gray-700'}`}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Connected, waiting for SIWE */}
        {isConnected && !isSigningIn && !error && (
          <div className="rounded-2xl bg-[#0f1219] border border-gray-800/50 p-5 shadow-2xl shadow-black/40 text-center">
            <div className="w-5 h-5 rounded-full border-2 border-purple-500/40 border-t-purple-500 animate-spin mx-auto mb-3" />
            <p className="text-gray-400 text-xs">Wallet connected — signing in…</p>
            <button
              onClick={() => { signInAttempted.current = false; signIn(); }}
              className="mt-2 text-xs text-purple-400 hover:text-purple-300 underline underline-offset-2"
            >
              Taking too long? Retry
            </button>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="rounded-2xl bg-[#0f1219] border border-red-800/40 p-5 shadow-2xl shadow-black/40 text-center space-y-2">
            <p className="text-red-400 font-medium text-sm">Sign-in failed</p>
            <p className="text-gray-500 text-xs">{error}</p>
            <button
              onClick={() => { clearError(); signInAttempted.current = false; signIn(); }}
              className="text-xs text-purple-400 hover:text-purple-300 underline underline-offset-2"
            >
              Retry
            </button>
          </div>
        )}

        <p className="text-center text-xs text-gray-600">
          Protocol v2.1 · Powered by Privy
        </p>
      </div>
    </div>
  );
}
