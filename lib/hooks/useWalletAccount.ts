'use client';

import {
  useAccount as useAlchemyAccount,
  useSignerStatus,
} from '@account-kit/react';
import type { Address } from 'viem';
import { getToken } from '@/lib/api/client';

/**
 * Drop-in replacement for wagmi's useAccount.
 *
 * Convexo uses Alchemy Account Kit embedded wallets exclusively:
 * email / passkey / Google OAuth → MultiOwnerModularAccount (MAv2 / EIP-7702)
 *
 * EIP-7702: the signer's EOA IS the smart wallet (same address).
 * Delegation to MAv2 (0x69007702764179f14F51cdce752f4f775d74E139)
 * is automatic — Account Kit bundles the EIP-7702 authorization with
 * the first sendUserOperation in one tx. No manual "activation" needed.
 *
 * Features: gas sponsorship (Gas Manager), batching, session keys.
 */
export function useAccount() {
  const { address, isLoadingAccount } = useAlchemyAccount({ type: 'MultiOwnerModularAccount' });
  const {
    isConnected: isSignerConnected,
    isDisconnected: isSignerDisconnected,
    isInitializing,
    isAuthenticating,
  } = useSignerStatus();

  // Bridge: treat as connected when a backend JWT exists.
  // This prevents "Connect Your Wallet" flash when Account Kit's
  // cookieStorage session expires before the JWT does.
  const hasJwt = Boolean(getToken());
  const isConnected = isSignerConnected || hasJwt;
  const isDisconnected = isSignerDisconnected && !hasJwt;

  return {
    address: address as Address | undefined,
    isConnected,
    isDisconnected,
    isConnecting: isAuthenticating,
    isReconnecting: isInitializing || isAuthenticating,
    isLoadingAccount,
    /** True while the embedded signer address is still resolving from stored state */
    isResolvingAddress: isSignerConnected && isLoadingAccount,
    authMode: 'embedded' as const,
  };
}
