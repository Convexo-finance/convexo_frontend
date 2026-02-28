'use client';

import {
  useAccount as useAlchemyAccount,
  useSignerStatus,
  useAlchemyAccountContext,
} from '@account-kit/react';
import { useAccount as wagmi_useAccount } from 'wagmi';

/**
 * Drop-in replacement for wagmi's useAccount.
 *
 * Account Kit has TWO separate connection modes that must both be handled:
 *
 * 1. AlchemySigner (email / passkey / Google OAuth)
 *    → useSignerStatus().isConnected = true
 *    → useAlchemyAccount({ type: 'LightAccount' }).address = smart-account address
 *
 * 2. External EOA wallet (MetaMask / WalletConnect / Coinbase / Rabby …)
 *    → wagmi_useAccount({ config: internalWagmiConfig }).isConnected = true
 *    → useSignerStatus().isConnected remains FALSE (by design in Account Kit v4)
 *    → The wallet address is the raw EOA address; no smart account is created
 *
 * This hook merges both states so the rest of the app works regardless of which
 * login method was used.
 */
export function useAccount() {
  // --- AlchemySigner (email / passkey / OAuth) ---
  const { address: smartAddress, isLoadingAccount } = useAlchemyAccount({ type: 'LightAccount' });
  const {
    isConnected: isSignerConnected,
    isDisconnected: isSignerDisconnected,
    isInitializing,
    isAuthenticating,
  } = useSignerStatus();

  // --- External EOA wallet ---
  // Account Kit creates its own internal wagmi instance that is separate from the
  // parent <WagmiProvider>. External wallets connect into this internal instance,
  // so we must read from it explicitly.
  const { config } = useAlchemyAccountContext();
  const { address: eoaAddress, isConnected: isEoaConnected } = wagmi_useAccount({
    config: config._internal.wagmiConfig,
  });

  // Merge: connected if EITHER the Alchemy signer OR an EOA wallet is active
  const isConnected = isSignerConnected || isEoaConnected;
  const isDisconnected = isSignerDisconnected && !isEoaConnected;

  // Prefer smart-account address (email/passkey), fall back to raw EOA address
  const address = smartAddress ?? eoaAddress;

  return {
    address,
    isConnected,
    isDisconnected,
    isConnecting: isAuthenticating,
    isReconnecting: isInitializing,
    isLoadingAccount,
  };
}
