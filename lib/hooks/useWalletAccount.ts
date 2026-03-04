'use client';

import {
  useAccount as useAlchemyAccount,
  useSignerStatus,
  useAlchemyAccountContext,
  useSigner,
} from '@account-kit/react';
import { useAccount as wagmi_useAccount } from 'wagmi';
import { useState, useEffect } from 'react';
import type { Address } from 'viem';
import { getToken } from '@/lib/api/client';

/**
 * Drop-in replacement for wagmi's useAccount.
 *
 * Convexo supports TWO connection modes:
 *
 * 1. AlchemySigner — email / passkey / Google OAuth  ("embedded")
 *    → Account Kit provisions a Modular Account V2 (MAv2) smart wallet.
 *    → EIP-7702: the signer's EOA IS the smart wallet (same address).
 *      Delegation to MAv2 (0x69007702764179f14F51cdce752f4f775d74E139)
 *      is AUTOMATIC — Account Kit detects it on the first sendUserOperation
 *      and bundles the EIP-7702 authorization with the UO in one tx.
 *      No manual "activation" step is needed.
 *    → Features: gas sponsorship (via Gas Manager), batching, session keys.
 *
 * 2. External EOA — MetaMask / WalletConnect / Coinbase / Rabby  ("external")
 *    → Connects into Account Kit's internal wagmi instance.
 *    → Raw EOA — no smart wallet, no EIP-7702, no gas sponsorship.
 *    → MetaMask blocks signing arbitrary EIP-7702 authorizations by design.
 *
 * This hook merges both states so the rest of the app works regardless of
 * which login method was used.
 */
export function useAccount() {
  // --- AlchemySigner (embedded: email / passkey / OAuth) ---
  // MAv2 with EIP-7702: signer EOA address = smart wallet address
  const { address: smartAddress, isLoadingAccount } = useAlchemyAccount({ type: 'MultiOwnerModularAccount' });
  const signer = useSigner();
  const {
    isConnected: isSignerConnected,
    isDisconnected: isSignerDisconnected,
    isInitializing,
    isAuthenticating,
  } = useSignerStatus();

  // Resolve the signer's EOA address (= the smart wallet address with EIP-7702)
  const [signerAddress, setSignerAddress] = useState<Address | undefined>();
  useEffect(() => {
    if (!isSignerConnected || !signer) {
      setSignerAddress(undefined);
      return;
    }
    (signer as { getAddress(): Promise<string> })
      .getAddress()
      .then((addr) => setSignerAddress(addr as Address))
      .catch(() => setSignerAddress(undefined));
  }, [isSignerConnected, signer]);

  // --- External EOA wallet ---
  // Account Kit uses its own internal wagmi instance — external wallets
  // connect there, not into the parent <WagmiProvider>.
  const { config } = useAlchemyAccountContext();
  const { address: eoaAddress, isConnected: isEoaConnected } = wagmi_useAccount({
    config: config._internal.wagmiConfig,
  });

  // Merge: connected if EITHER the Alchemy signer OR an EOA wallet is active.
  // Also treat as connected when a backend JWT exists — this bridges the gap
  // when Account Kit's cookieStorage session expires before the JWT does.
  // Without this, the pages flash "Connect Your Wallet" even though the user
  // is still authenticated with the backend (address shown in sidebar, APIs work).
  const hasJwt = Boolean(getToken()); // synchronous localStorage read; null on server
  const isConnected = isSignerConnected || isEoaConnected || hasJwt;
  const isDisconnected = isSignerDisconnected && !isEoaConnected && !hasJwt;

  // Prefer resolved signer EOA → MAv2 counterfactual → external EOA
  const address = signerAddress ?? smartAddress ?? eoaAddress;

  // True while the embedded signer is connected but its EOA hasn't resolved yet.
  // Suppress balance / contract queries during this window to avoid stale data.
  const isResolvingAddress = isSignerConnected && !signerAddress;

  // Tells the UI which mode the user is in
  const authMode: 'embedded' | 'external' | null =
    isSignerConnected ? 'embedded' :
    isEoaConnected    ? 'external' :
    null;

  return {
    address,
    isConnected,
    isDisconnected,
    isConnecting: isAuthenticating,
    // isInitializing = Account Kit reading its stored session on page load
    // isAuthenticating = user actively going through OTP / passkey / OAuth
    // Both are "loading" states — keep spinner showing for both to avoid
    // flashing "Connect Your Wallet" mid-auth-flow
    isReconnecting: isInitializing || isAuthenticating,
    isLoadingAccount,
    /** True while embedded signer EOA address is still resolving */
    isResolvingAddress,
    /** 'embedded' = email/passkey/Google (MAv2 + EIP-7702 auto). 'external' = MetaMask/WC/Coinbase */
    authMode,
  };
}
