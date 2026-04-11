'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { useNavigation } from '@/lib/contexts/NavigationContext';
import { useSignerStatus } from '@account-kit/react';
import Image from 'next/image';

/**
 * AuthGuard — gates dashboard pages.
 *
 * Responsibilities (ONLY these):
 *   1. Block rendering while auth / signer are still initializing.
 *   2. Redirect to `/` if the user is NOT authenticated.
 *   3. Redirect to `/onboarding` if onboarding is incomplete.
 *   4. Render children once the user is authenticated + onboarded.
 *
 * All redirects use `router.replace` so the guarded URL is removed from
 * browser history (prevents back-button bounce loops).
 *
 * No hasRedirected ref — router.replace is idempotent and AuthGuard
 * unmounts entirely when navigating to /onboarding (different layout),
 * so there is no risk of the effect firing in a loop.
 */
export default function AuthGuard({ children }: { children: ReactNode }) {
  const { isAuthenticated, isInitializing } = useAuth();
  const { isInitializing: isSignerInit } = useSignerStatus();
  const { onboardingStep } = useNavigation();
  const router = useRouter();

  const loading = isInitializing || isSignerInit;

  // Redirect unauthenticated users to sign-in
  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) {
      router.replace('/');
    }
  }, [isAuthenticated, loading, router]);

  // Redirect users who haven't completed onboarding.
  // /onboarding uses a standalone layout — AuthGuard is never mounted
  // there, so there is no risk of this effect causing a loop.
  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) return;
    if (onboardingStep === null) return; // still loading from backend
    if (onboardingStep === 'NOT_STARTED' || onboardingStep === 'TYPE_SELECTED') {
      router.replace('/onboarding');
    }
  }, [loading, isAuthenticated, onboardingStep, router]);

  // ── Render gates ───────────────────────────────────────────────

  // Still initializing auth or signer → spinner
  if (loading) {
    return <FullScreenSpinner />;
  }

  // Not authenticated → null (redirect is in-flight)
  if (!isAuthenticated) return null;

  // Waiting for onboarding API → spinner
  if (onboardingStep === null) {
    return <FullScreenSpinner />;
  }

  // Needs onboarding → spinner (redirect is in-flight)
  if (onboardingStep === 'NOT_STARTED' || onboardingStep === 'TYPE_SELECTED') {
    return <FullScreenSpinner text="Setting up your account…" />;
  }

  return <>{children}</>;
}

/* Shared spinner to avoid repetition */
function FullScreenSpinner({ text }: { text?: string }) {
  return (
    <div className="min-h-screen bg-[#0a0d14] flex flex-col items-center justify-center gap-4">
      <Image src="/logo_convexo.png" alt="Convexo" width={48} height={48} className="object-contain opacity-70" />
      <div className="w-6 h-6 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
      {text && <p className="text-sm text-gray-500">{text}</p>}
    </div>
  );
}
