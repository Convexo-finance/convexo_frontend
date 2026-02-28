'use client';

import { useAccount as useAlchemyAccount, useSignerStatus } from '@account-kit/react';

/**
 * Drop-in replacement for wagmi's useAccount.
 * Bridges Account Kit's auth state to the wagmi-compatible shape used across the app.
 */
export function useAccount() {
  const { address, isLoadingAccount } = useAlchemyAccount({ type: 'LightAccount' });
  const { isConnected, isDisconnected, isInitializing, isAuthenticating } = useSignerStatus();

  return {
    address,
    isConnected,
    isDisconnected,
    isConnecting: isAuthenticating,
    isReconnecting: isInitializing,
    isLoadingAccount,
  };
}
