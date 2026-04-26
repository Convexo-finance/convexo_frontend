'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSignerStatus, useSigner, useLogout } from '@account-kit/react'
import { createSiweMessage } from 'viem/siwe'
import type { Address } from 'viem'
import {
  apiFetch,
  attemptTokenRefresh,
  setToken,
  setRefreshToken,
  getToken,
  getRefreshToken,
  clearToken,
} from '../api/client'
import { PRIMARY_CHAIN_ID } from '@/lib/config/network'

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

export type SignInStage = 'idle' | 'nonce' | 'signing' | 'verifying'

// Decode JWT payload without verifying the signature.
// Backend signs all tokens — we just read the claims to restore UI state.
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

function withTimeout<T>(promise: Promise<T>, ms: number, msg: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(msg)), ms)),
  ])
}

export function useAuth() {
  const { isConnected: isSignerConnected } = useSignerStatus()
  const signer = useSigner()
  const { logout: alchemyLogout } = useLogout()

  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isInitializing, setIsInitializing] = useState(true)
  const [isSigningIn, setIsSigningIn] = useState(false)
  const [signInStage, setSignInStage] = useState<SignInStage>('idle')
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
    setSignInStage('nonce')
    setError(null)

    try {
      const address = (await (signer as { getAddress(): Promise<string> }).getAddress()) as Address

      // 1. Get nonce
      const { nonce } = await apiFetch<{ nonce: string }>(`/auth/nonce?address=${address}`)
      setSignInStage('signing')

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

      // 3. Sign — AlchemySigner handles EIP-191 prefix internally
      const signature = await withTimeout(
        (signer as { signMessage(msg: string): Promise<string> }).signMessage(message),
        30_000,
        'Signing timed out — try reloading',
      )

      setSignInStage('verifying')

      // 4. Verify with backend — receive JWT
      const result = await apiFetch<VerifyResponse>('/auth/verify', {
        method: 'POST',
        body: JSON.stringify({ message, signature, address, chainId: PRIMARY_CHAIN_ID }),
      })

      setToken(result.accessToken)
      setRefreshToken(result.refreshToken)
      setUser(result.user)
      setIsAuthenticated(true)

      // Fire-and-forget: warm the reputation cache
      apiFetch('/reputation/sync', {
        method: 'POST',
        body: JSON.stringify({ chainId: PRIMARY_CHAIN_ID }),
      }).catch(() => {})
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign-in failed')
    } finally {
      setIsSigningIn(false)
      setSignInStage('idle')
    }
  }, [isSignerConnected, signer])

  const signOut = useCallback(async () => {
    // Backend logout (best-effort)
    if (getToken()) {
      apiFetch('/auth/logout', { method: 'POST' }).catch(() => {})
    }
    clearToken()
    setIsAuthenticated(false)
    setUser(null)
    // Alchemy SDK clears its session cookies
    alchemyLogout()
  }, [alchemyLogout])

  return {
    isAuthenticated,
    isInitializing,
    isConnected: isSignerConnected,
    isSigningIn,
    signInStage,
    user,
    error,
    clearError: () => setError(null),
    signIn,
    signOut,
  }
}
