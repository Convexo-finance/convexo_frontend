'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AuthCard,
  useLogout,
  useSignerStatus,
  useAlchemyAccountContext,
} from '@account-kit/react';
import { useDisconnect } from 'wagmi';
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

  // Page is ready once our JWT check and the Alchemy signer init both finish.
  // 3-second safety net in case the SDK hangs (network issue, stale cookie).
  const [pageReady, setPageReady] = useState(false);
  useEffect(() => {
    if (!isInitializing && !isSignerInitializing) {
      setPageReady(true);
      return;
    }
    const t = setTimeout(() => setPageReady(true), 3_000);
    return () => clearTimeout(t);
  }, [isInitializing, isSignerInitializing]);

  // Redirect once authenticated
  useEffect(() => {
    if (isAuthenticated) router.push('/profile');
  }, [isAuthenticated, router]);

  // Force-show the AuthCard immediately on click, then clean up async in background.
  // Without this, Alchemy's signer state update is async so isConnected stays true
  // for a tick after logout(), re-rendering the SIWE step and trapping the user.
  const [forceAuthCard, setForceAuthCard] = useState(false);
  useEffect(() => {
    if (!isConnected) setForceAuthCard(false);
  }, [isConnected]);

  const handleDifferentAccount = () => {
    setForceAuthCard(true);
    if (isSignerConnected) logout();
    disconnectEoa();
  };

  if (!pageReady || isSigningIn) {
    return (
      <div className="min-h-screen bg-[#0a0d14] flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
        {isSigningIn && <p className="text-gray-500 text-sm">Check your wallet to sign…</p>}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0d14] flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">

        {/* Branding */}
        <div className="text-center">
          <div className="flex justify-center mb-5">
            <Image
              src="/logo_convexo.png"
              alt="Convexo"
              width={80}
              height={80}
              className="object-contain"
              priority
            />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Convexo</h1>
          <p className="text-gray-400 text-sm">
            Reducing the funding gap for SMEs in Latin America
          </p>
        </div>

        {!isConnected || forceAuthCard ? (
          /* Step 1 — Choose auth method */
          <div className="rounded-2xl overflow-hidden shadow-2xl shadow-black/40">
            <AuthCard />
          </div>
        ) : (
          /* Step 2 — Sign to verify wallet ownership */
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
              <p className="text-white font-medium mb-1">Verify wallet ownership</p>
              <p className="text-gray-400 text-sm">
                Sign a message to prove you own this wallet and access Convexo.
              </p>
            </div>

            {error && (
              <p className="text-red-400 text-sm text-center bg-red-500/10 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              onClick={signIn}
              disabled={isSigningIn}
              className="w-full px-4 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2"
            >
              {isSigningIn ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  Signing…
                </>
              ) : (
                'Sign in to Convexo'
              )}
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
