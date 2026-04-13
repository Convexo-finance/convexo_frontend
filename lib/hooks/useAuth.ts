'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  useSignerStatus,
  useSigner,
  useLogout,
} from '@account-kit/react'
import { createSiweMessage } from 'viem/siwe'
import type { Address } from 'viem'
import { apiFetch, attemptTokenRefresh, setToken, setRefreshToken, getToken, getRefreshToken, clearToken } from '../api/client'
import { PRIMARY_CHAIN_ID } from '@/lib/config/network'

type AuthMethod = 'EMAIL' | 'PASSKEY' | 'GOOGLE'

export interface AuthUser {
  id: string
  walletAddress: string
  accountType: string | null
  onboardingStep: string | null
  isAdmin: boolean
}

interface VerifyResponse {
  accessToken: string
  refreshToken: string
  user: AuthUser
}

async function detectAuthMethod(signer: unknown): Promise<AuthMethod> {
  try {
    const details = await (signer as { getAuthDetails?(): Promise<{ type?: string }> }).getAuthDetails?.()
    if (details?.type === 'passkey') return 'PASSKEY'
    if (details?.type === 'oauth') return 'GOOGLE'
  } catch {
    // ignore — fallback to EMAIL
  }
  return 'EMAIL'
}

function withTimeout<T>(promise: Promise<T>, ms: number, msg: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(msg)), ms)),
  ])
}

// Decode JWT payload without verifying the signature.
// Backend signs all tokens — we just read the claims to restore UI state.
// Actual token validity is enforced server-side on every API call.
function decodeJwtPayload(token: string): AuthUser | null {
  try {
    const raw = token.split('.')[1]
    if (!raw) return null
    const json = atob(raw.replace(/-/g, '+').replace(/_/g, '/'))
    const p = JSON.parse(json) as {
      sub?: string; address?: string; accountType?: string | null;
      onboardingStep?: string | null; isAdmin?: boolean; exp?: number;
    }
    if (p.exp && Date.now() / 1000 > p.exp) return null
    if (!p.sub || !p.address) return null
    return {
      id: p.sub,
      walletAddress: p.address,
      accountType: p.accountType ?? null,
      onboardingStep: p.onboardingStep ?? null,
      isAdmin: !!p.isAdmin,
    }
  } catch {
    return null
  }
}

export function useAuth() {
  const { isConnected: isSignerConnected } = useSignerStatus()
  const signer = useSigner()
  const { logout: alchemyLogout } = useLogout()

  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isInitializing, setIsInitializing] = useState(true)
  const [isSigningIn, setIsSigningIn] = useState(false)
  const [user, setUser] = useState<AuthUser | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Restore session from JWT on mount — no network request needed.
  useEffect(() => {
    const token = getToken()
    if (!token) {
      setIsInitializing(false)
      return
    }

    const restored = decodeJwtPayload(token)
    if (restored) {
      setUser(restored)
      setIsAuthenticated(true)
      setIsInitializing(false)
      return
    }

    // Access token expired — try silent refresh before giving up
    if (getRefreshToken()) {
      attemptTokenRefresh()
        .then((ok) => {
          if (ok) {
            const newToken = getToken()
            const refreshedUser = newToken ? decodeJwtPayload(newToken) : null
            if (refreshedUser) {
              setUser(refreshedUser)
              setIsAuthenticated(true)
              return
            }
          }
          clearToken()
        })
        .finally(() => setIsInitializing(false))
    } else {
      clearToken()
      setIsInitializing(false)
    }
  }, [])

  const signIn = useCallback(async () => {
    if (!isSignerConnected || !signer) {
      setError('No wallet connected')
      return
    }

    setIsSigningIn(true)
    setError(null)

    try {
      const address = (await (signer as { getAddress(): Promise<string> }).getAddress()) as Address
      const authMethod = await detectAuthMethod(signer)

      // 1. Get nonce
      const { nonce } = await apiFetch<{ nonce: string }>(`/auth/nonce?address=${address}`)

      // 2. Build EIP-4361 SIWE message
      const message = createSiweMessage({
        domain: window.location.host,
        address,
        statement: 'Sign in to Convexo',
        uri: window.location.origin,
        version: '1',
        chainId: PRIMARY_CHAIN_ID,
        nonce,
      })

      // 3. Sign — Alchemy AlchemySigner handles EIP-191 prefix internally
      const signature = await withTimeout(
        (signer as { signMessage(msg: string): Promise<string> }).signMessage(message),
        30_000,
        'Signing timed out — try reloading the page',
      )

      // 4. Verify with backend — receive JWT
      const result = await apiFetch<VerifyResponse>('/auth/verify', {
        method: 'POST',
        body: JSON.stringify({ message, signature, address, chainId: PRIMARY_CHAIN_ID, authMethod }),
      })

      setToken(result.accessToken)
      setRefreshToken(result.refreshToken)
      setUser(result.user)
      setIsAuthenticated(true)

      // Fire-and-forget: warm the reputation cache after login
      apiFetch('/reputation/sync', { method: 'POST' }).catch(() => {})
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign-in failed')
    } finally {
      setIsSigningIn(false)
    }
  }, [isSignerConnected, signer])

  const signOut = useCallback(async () => {
    // 1. Backend logout (best-effort)
    if (getToken()) {
      await apiFetch('/auth/logout', { method: 'POST' }).catch(() => {})
    }

    // 2. Clear JWT tokens immediately
    clearToken()

    // 3. Reset React state
    setIsAuthenticated(false)
    setUser(null)

    // 4. Clear Alchemy session cookies
    if (typeof document !== 'undefined') {
      document.cookie.split(';').forEach((c) => {
        const name = c.split('=')[0].trim()
        if (name.startsWith('alchemy') || name.startsWith('aa-') || name.startsWith('wagmi')) {
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`
        }
      })
    }

    // 5. Disconnect embedded signer
    alchemyLogout()
  }, [alchemyLogout])

  return {
    isAuthenticated,
    isInitializing,
    isConnected: isSignerConnected,
    isSigningIn,
    user,
    error,
    clearError: () => setError(null),
    signIn,
    signOut,
  }
}
