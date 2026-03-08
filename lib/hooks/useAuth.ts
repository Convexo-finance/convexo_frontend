'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAlchemyAccountContext, useSignerStatus, useSigner } from '@account-kit/react'
import { useAccount as wagmiUseAccount, useSignMessage } from 'wagmi'
import { createSiweMessage } from 'viem/siwe'
import type { Address } from 'viem'
import { apiFetch, setToken, setRefreshToken, getToken, clearToken } from '../api/client'

type AuthMethod =
  | 'EMAIL'
  | 'PASSKEY'
  | 'GOOGLE'
  | 'WALLET_CONNECT'
  | 'METAMASK'
  | 'COINBASE'
  | 'EXTERNAL_EOA'

export interface AuthUser {
  id: string
  walletAddress: string
  accountType: string | null
  onboardingStep: string | null
  isAdmin: boolean
}

// Raw shape returned by GET /users/me (includes extra nested objects)
interface UserMeResponse {
  id: string
  walletAddress: string
  accountType: string | null
  onboardingStep: string | null
  adminRole: { role: string; grantedBy: string } | null
  [key: string]: unknown
}

interface VerifyResponse {
  accessToken: string
  refreshToken: string
  user: AuthUser
}

function detectEoaAuthMethod(connectorName?: string): AuthMethod {
  if (!connectorName) return 'EXTERNAL_EOA'
  const name = connectorName.toLowerCase()
  if (name.includes('metamask')) return 'METAMASK'
  if (name.includes('coinbase')) return 'COINBASE'
  if (name.includes('walletconnect') || name.includes('wallet connect')) return 'WALLET_CONNECT'
  return 'EXTERNAL_EOA'
}

async function detectSignerAuthMethod(signer: unknown): Promise<AuthMethod> {
  try {
    const details = await (signer as { getAuthDetails?(): Promise<{ type?: string }> }).getAuthDetails?.()
    if (details?.type === 'passkey') return 'PASSKEY'
    if (details?.type === 'oauth') return 'GOOGLE'
  } catch {
    // ignore — fallback to EMAIL
  }
  return 'EMAIL'
}

export function useAuth() {
  const { isConnected: isSignerConnected } = useSignerStatus()
  const { config } = useAlchemyAccountContext()
  const signer = useSigner()

  // External EOA wallet connected via Account Kit's internal wagmi instance
  const {
    address: eoaAddress,
    isConnected: isEoaConnected,
    connector,
  } = wagmiUseAccount({ config: config._internal.wagmiConfig })

  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isInitializing, setIsInitializing] = useState(true)
  const [isSigningIn, setIsSigningIn] = useState(false)
  const [user, setUser] = useState<AuthUser | null>(null)
  const [error, setError] = useState<string | null>(null)

  const { signMessageAsync } = useSignMessage({ config: config._internal.wagmiConfig })

  // Validate JWT on mount — call /users/me to restore user object
  useEffect(() => {
    async function restoreAuth() {
      const token = getToken()
      if (!token) {
        setIsInitializing(false)
        return
      }
      try {
        const me = await apiFetch<UserMeResponse>('/users/me')
        setUser({
          id: me.id,
          walletAddress: me.walletAddress,
          accountType: me.accountType,
          onboardingStep: me.onboardingStep,
          isAdmin: !!me.adminRole,
        })
        setIsAuthenticated(true)
      } catch {
        clearToken()
        setIsAuthenticated(false)
      } finally {
        setIsInitializing(false)
      }
    }
    restoreAuth()
  }, [])

  const isConnected = isSignerConnected || isEoaConnected

  const signIn = useCallback(async () => {
    setIsSigningIn(true)
    setError(null)

    try {
      let signerAddress: Address
      let authMethod: AuthMethod

      if (isSignerConnected && signer) {
        // AlchemySigner (email / passkey / Google) — sign with embedded EOA
        signerAddress = (await (signer as { getAddress(): Promise<string> }).getAddress()) as Address
        authMethod = await detectSignerAuthMethod(signer)
      } else if (eoaAddress) {
        // External wallet (MetaMask, WalletConnect, Coinbase, etc.)
        signerAddress = eoaAddress as Address
        // Defensive: connector may be undefined or not have .name
        let connectorName: string | undefined = undefined;
        if (connector && typeof connector === 'object' && 'name' in connector) {
          connectorName = (connector as { name?: string }).name;
        }
        authMethod = detectEoaAuthMethod(connectorName);
      } else {
        throw new Error('No wallet connected')
      }

      // 1. Get nonce from backend
      const { nonce } = await apiFetch<{ nonce: string }>(
        `/auth/nonce?address=${signerAddress}`,
      )

      // 2. Build EIP-4361 SIWE message
      const message = createSiweMessage({
        domain: window.location.host,
        address: signerAddress,
        statement: 'Sign in to Convexo',
        uri: window.location.origin,
        version: '1',
        chainId: 8453, // Base mainnet
        nonce,
      })

      // 3. Sign the message
      const withTimeout = <T,>(promise: Promise<T>, ms: number, msg: string): Promise<T> =>
        Promise.race([promise, new Promise<T>((_, reject) => setTimeout(() => reject(new Error(msg)), ms))])

      let signature: string
      if (isSignerConnected && signer) {
        signature = await withTimeout(
          (signer as { signMessage(msg: string): Promise<string> }).signMessage(message),
          30_000,
          'Signing timed out — try reloading the page',
        )
      } else {
        signature = await withTimeout(
          signMessageAsync({ message }),
          60_000,
          'Wallet sign request timed out — check your wallet and try again',
        )
      }

      // 4. Verify with backend and receive JWT
      const result = await apiFetch<VerifyResponse>('/auth/verify', {
        method: 'POST',
        body: JSON.stringify({
          message,
          signature,
          address: signerAddress,
          chainId: 8453,
          authMethod,
          // With EIP-7702, the signer EOA delegates to a smart account at the
          // same address — no separate smartAccount field needed. The backend
          // uses signerAddress as the canonical wallet identity.
        }),
      })

      setToken(result.accessToken)
      setRefreshToken(result.refreshToken)
      setUser(result.user)
      setIsAuthenticated(true)

      // Fire-and-forget: warm the backend reputation cache after login.
      // We do NOT await this — it must never block or delay sign-in.
      apiFetch('/reputation/sync', { method: 'POST' }).catch(() => {})
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign-in failed')
    } finally {
      setIsSigningIn(false)
    }
  }, [isSignerConnected, signer, eoaAddress, connector, signMessageAsync])

  const signOut = useCallback(async () => {
    try {
      if (getToken()) {
        await apiFetch('/auth/logout', { method: 'POST' }).catch(() => {})
      }
    } finally {
      clearToken()
      setIsAuthenticated(false)
      setUser(null)

      // Clear stale Alchemy / wagmi cookies so next visit starts fresh
      document.cookie.split(';').forEach((c) => {
        const name = c.split('=')[0].trim()
        if (
          name.startsWith('alchemy') ||
          name.startsWith('aa-') ||
          name.startsWith('wagmi')
        ) {
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`
        }
      })
    }
  }, [])

  return {
    isAuthenticated,
    isInitializing,
    isConnected,
    isSigningIn,
    user,
    error,
    clearError: () => setError(null),
    signIn,
    signOut,
  }
}
