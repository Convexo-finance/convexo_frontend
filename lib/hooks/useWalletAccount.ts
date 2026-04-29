'use client';

import { usePrivy, useWallets } from '@privy-io/react-auth';
import type { Address } from 'viem';
import { getToken } from '@/lib/api/client';

export function useAccount() {
  const { authenticated, ready } = usePrivy();
  const { wallets } = useWallets();
  const wallet = wallets[0];

  const address = wallet?.address as Address | undefined;

  // Bridge: treat as connected when a backend JWT exists.
  const hasJwt = Boolean(getToken());
  const isConnected = (authenticated && !!wallet) || hasJwt;
  const isDisconnected = ready && !authenticated && !hasJwt;
  const isLoadingAccount = authenticated && !wallet;

  return {
    address,
    isConnected,
    isDisconnected,
    isConnecting: false,
    isReconnecting: !ready,
    isLoadingAccount,
    isResolvingAddress: authenticated && !wallet,
    authMode: 'embedded' as const,
  };
}
