'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAlchemyAccountContext, useSignerStatus, useSigner } from '@account-kit/react'
import { useAccount as wagmiUseAccount } from 'wagmi'
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

// Raw EIP-1193 provider interface
type Eip1193Provider = {
  request(args: { method: string; params?: unknown[] }): Promise<unknown>
}

function detectEoaAuthMethod(connectorName?: string): AuthMethod {
  if (!connectorName) return 'EXTERNAL_EOA'
  const n = connectorName.toLowerCase()
  if (n.includes('metamask')) return 'METAMASK'
  if (n.includes('coinbase')) return 'COINBASE'
  if (n.includes('walletconnect') || n.includes('wallet connect')) return 'WALLET_CONNECT'
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

function withTimeout<T>(promise: Promise<T>, ms: number, msg: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(msg)), ms)),
  ])
}

// Encode string to hex bytes for EIP-1193 personal_sign
function toMsgHex(str: string): `0x${string}` {
  return `0x${Array.from(new TextEncoder().encode(str))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')}` as `0x${string}`
}

export function useAuth() {
  const { isConnected: isSignerConnected } = useSignerStatus()
  const { config } = useAlchemyAccountContext()
  const signer = useSigner()

  // External EOA wallet (MetaMask / WalletConnect / Coinbase) connected via
  // Account Kit's internal wagmi instance — NOT the app-level WagmiProvider.
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

  // Restore session from JWT on mount
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
        // ── Alchemy embedded signer (email / passkey / Google) ─────────────
        signerAddress = (await (signer as { getAddress(): Promise<string> }).getAddress()) as Address
        authMethod = await detectSignerAuthMethod(signer)
      } else if (eoaAddress && connector) {
        // ── External EOA (MetaMask / WalletConnect / Coinbase) ─────────────
        signerAddress = eoaAddress as Address
        authMethod = detectEoaAuthMethod((connector as { name?: string }).name)
      } else {
        throw new Error('No wallet connected')
      }

      // 1. Get nonce from backend
      const { nonce } = await apiFetch<{ nonce: string }>(`/auth/nonce?address=${signerAddress}`)

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
      let signature: string

      if (isSignerConnected && signer) {
        // Alchemy AlchemySigner handles the EIP-191 prefix internally
        signature = await withTimeout(
          (signer as { signMessage(msg: string): Promise<string> }).signMessage(message),
          30_000,
          'Signing timed out — try reloading the page',
        )
      } else {
        // EOA: sign via EIP-1193 personal_sign directly.
        //
        // wagmi's signMessage AND getConnectorClient both call connector.getChainId()
        // which Account Kit's internal connectors don't implement (plain state objects,
        // not class instances). connector.getProvider() on the state object also fails.
        //
        // Fix: look up the *live* connector instance from Account Kit's wagmi registry
        // (which retains prototype methods), then fall back to window.ethereum.
        const akConfig = config._internal.wagmiConfig
        const uid = akConfig.state.current
        const connId = uid
          ? (akConfig.state.connections as Map<string, { connector: { id: string } }>)
              .get(uid)?.connector?.id
          : connector?.id

        const live = connId
          ? (akConfig.connectors as unknown as Array<{ id: string; getProvider?(): Promise<Eip1193Provider> }>)
              .find((c) => c.id === connId)
          : undefined

        const provider: Eip1193Provider =
          (live?.getProvider ? await live.getProvider() : null) ??
          (typeof window !== 'undefined' ? (window as { ethereum?: Eip1193Provider }).ethereum ?? null : null) ??
          (() => { throw new Error('No wallet provider — please reconnect your wallet') })()

        signature = await withTimeout(
          provider.request({ method: 'personal_sign', params: [toMsgHex(message), signerAddress] })
            .then((s) => s as string),
          60_000,
          'Wallet sign request timed out — check your wallet and try again',
        )
      }

      // 4. Verify with backend — receive JWT
      const result = await apiFetch<VerifyResponse>('/auth/verify', {
        method: 'POST',
        body: JSON.stringify({ message, signature, address: signerAddress, chainId: 8453, authMethod }),
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
  }, [isSignerConnected, signer, eoaAddress, connector])

  const signOut = useCallback(async () => {
    try {
      if (getToken()) await apiFetch('/auth/logout', { method: 'POST' }).catch(() => {})
    } finally {
      clearToken()
      setIsAuthenticated(false)
      setUser(null)
      // Clear stale Alchemy / wagmi cookies
      document.cookie.split(';').forEach((c) => {
        const name = c.split('=')[0].trim()
        if (name.startsWith('alchemy') || name.startsWith('aa-') || name.startsWith('wagmi')) {
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
