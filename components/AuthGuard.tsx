'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { useSignerStatus } from '@account-kit/react';
import Image from 'next/image';

export default function AuthGuard({ children }: { children: ReactNode }) {
  const { isAuthenticated, isInitializing } = useAuth();
  // isInitializing from Account Kit — true while the signer is reconnecting
  // from a previous session (cookie restore). We must NOT redirect during this
  // window or users who refresh the page will be kicked back to login.
  const { isInitializing: isSignerInit } = useSignerStatus();
  const router = useRouter();

  const loading = isInitializing || isSignerInit;

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, loading, router]);

  // Show a centered logo spinner while any init is in progress
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0d14] flex flex-col items-center justify-center gap-4">
        <Image src="/logo_convexo.png" alt="Convexo" width={48} height={48} className="object-contain opacity-70" />
        <div className="w-6 h-6 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return <>{children}</>;
}
