'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiFetch, getToken } from '@/lib/api/client';

/**
 * Onboarding steps as returned by GET /onboarding/status.
 * The backend defines the progression:
 *   NOT_STARTED → TYPE_SELECTED → PROFILE_COMPLETE → HUMANITY_PENDING →
 *   HUMANITY_COMPLETE → KYC_PENDING / KYB_PENDING → LP_COMPLETE →
 *   CREDIT_SCORE_PENDING → COMPLETE
 */
export type OnboardingStep =
  | 'NOT_STARTED'
  | 'TYPE_SELECTED'
  | 'PROFILE_COMPLETE'
  | 'HUMANITY_PENDING'
  | 'HUMANITY_COMPLETE'
  | 'KYC_PENDING'
  | 'KYB_PENDING'
  | 'LP_COMPLETE'
  | 'CREDIT_SCORE_PENDING'
  | 'COMPLETE';

export type AccountType = 'INDIVIDUAL' | 'BUSINESS';

interface OnboardingStatusResponse {
  currentStep: OnboardingStep;
  accountType: AccountType | null;
  isComplete: boolean;
  nextAction?: {
    action: string;
    endpoint: string;
    description: string;
  };
}

interface UseOnboardingReturn {
  step: OnboardingStep | null;
  accountType: AccountType | null;
  isComplete: boolean;
  nextAction: { endpoint: string; description: string } | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Fetches GET /onboarding/status when a JWT exists.
 * Pass `enabled = true` once the user is authenticated so the hook knows
 * when to fetch / reset.  This prevents the old race condition where the
 * hook fired on mount (before sign-in) and then never re-fetched after
 * the JWT was stored.
 */
export function useOnboarding(enabled = true): UseOnboardingReturn {
  const [step, setStep] = useState<OnboardingStep | null>(null);
  const [accountType, setAccountType] = useState<AccountType | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [nextAction, setNextAction] = useState<{ endpoint: string; description: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await apiFetch<OnboardingStatusResponse>('/onboarding/status');
      setStep(data.currentStep);
      setAccountType(data.accountType);
      setIsComplete(data.isComplete);
      setNextAction(data.nextAction ?? null);
    } catch (err) {
      // 401 is auto-handled by apiFetch (clears token).
      // For other errors, default to NOT_STARTED so AuthGuard can redirect
      // to /onboarding instead of staying stuck on the spinner.
      if (err instanceof Error && err.message !== 'Session expired. Please sign in again.') {
        setError(err.message);
        setStep('NOT_STARTED');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch when enabled transitions to true (user just signed in)
  // Reset when enabled transitions to false (user signed out)
  useEffect(() => {
    if (enabled) {
      fetchStatus();
    } else {
      // Reset all state so the next sign-in starts clean
      setStep(null);
      setAccountType(null);
      setIsComplete(false);
      setNextAction(null);
      setIsLoading(true);
      setError(null);
    }
  }, [enabled, fetchStatus]);

  return {
    step,
    accountType,
    isComplete,
    nextAction,
    isLoading,
    error,
    refetch: fetchStatus,
  };
}
