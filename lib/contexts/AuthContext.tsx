'use client'

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
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
} from '@/lib/api/client'
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

function decodeJwtPayload(token: string): AuthUser | null {
  try {
    const raw = token.split('.')[1]
    if (!raw) return null
    const json = atob(raw.replace(/-/g, '+').replace(/_/g, '/'))
    const p = JSON.parse(json) as {
      sub?: string; address?: string; accountType?: string | null
      onboardingStep?: string | null; isAdmin?: boolean; exp?: number
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

interface AuthContextValue {
  isAuthenticated: boolean
  isInitializing: boolean
  isConnected: boolean
  isSigningIn: boolean
  signInStage: SignInStage
  user: AuthUser | null
  error: string | null
  clearError: () => void
  signIn: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const { isConnected: isSignerConnected } = useSignerStatus()
  const signer = useSigner()
  const { logout: alchemyLogout } = useLogout()

  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isInitializing, setIsInitializing] = useState(true)
  const [isSigningIn, setIsSigningIn] = useState(false)
  const [signInStage, setSignInStage] = useState<SignInStage>('idle')
  const [user, setUser] = useState<AuthUser | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Restore session from JWT on mount — no network request
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

    // Access token expired — try silent refresh
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

      const { nonce } = await apiFetch<{ nonce: string }>(`/auth/nonce?address=${address}`)
      setSignInStage('signing')

      const message = createSiweMessage({
        domain: window.location.host,
        address,
        statement: 'Sign in to Convexo',
        uri: window.location.origin,
        version: '1',
        chainId: PRIMARY_CHAIN_ID,
        nonce,
      })

      const signature = await withTimeout(
        (signer as { signMessage(msg: string): Promise<string> }).signMessage(message),
        30_000,
        'Signing timed out — try reloading',
      )

      setSignInStage('verifying')

      const result = await apiFetch<VerifyResponse>('/auth/verify', {
        method: 'POST',
        body: JSON.stringify({ message, signature, address, chainId: PRIMARY_CHAIN_ID }),
      })

      setToken(result.accessToken)
      setRefreshToken(result.refreshToken)
      setUser(result.user)
      setIsAuthenticated(true)

      // Fire-and-forget: warm reputation cache
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
    if (getToken()) {
      apiFetch('/auth/logout', { method: 'POST' }).catch(() => {})
    }
    clearToken()
    setIsAuthenticated(false)
    setUser(null)
    alchemyLogout()
  }, [alchemyLogout])

  return (
    <AuthContext.Provider value={{
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
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
