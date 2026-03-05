const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

const TOKEN_KEY = 'convexo_jwt'
const REFRESH_TOKEN_KEY = 'convexo_refresh_token'

// ─── Token management ─────────────────────────────────────────────────────────

export function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(REFRESH_TOKEN_KEY)
}

export function setRefreshToken(token: string): void {
  localStorage.setItem(REFRESH_TOKEN_KEY, token)
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
}

// ─── API Error ────────────────────────────────────────────────────────────────

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

// ─── Silent token refresh ─────────────────────────────────────────────────────

let refreshPromise: Promise<boolean> | null = null

async function attemptTokenRefresh(): Promise<boolean> {
  // Deduplicate concurrent refresh requests (e.g., parallel 401s)
  if (refreshPromise) return refreshPromise

  refreshPromise = (async () => {
    const refreshToken = getRefreshToken()
    if (!refreshToken) return false

    try {
      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      })

      if (!res.ok) return false

      const data = await res.json()
      if (data.accessToken && data.refreshToken) {
        setToken(data.accessToken)
        setRefreshToken(data.refreshToken)
        return true
      }
      return false
    } catch {
      return false
    } finally {
      refreshPromise = null
    }
  })()

  return refreshPromise
}

// ─── Main API client ──────────────────────────────────────────────────────────

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  timeoutMs = 12_000,
): Promise<T> {
  const response = await rawFetch(path, options, timeoutMs)

  // On 401, attempt silent refresh and retry ONCE
  if (response.status === 401) {
    const refreshed = await attemptTokenRefresh()
    if (refreshed) {
      // Retry the original request with the new token
      const retryResponse = await rawFetch(path, options, timeoutMs)
      return handleResponse<T>(retryResponse)
    }

    // Refresh failed — clear tokens and throw
    clearToken()
    throw new ApiError(401, 'Session expired. Please sign in again.')
  }

  return handleResponse<T>(response)
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

async function rawFetch(
  path: string,
  options: RequestInit = {},
  timeoutMs: number,
): Promise<Response> {
  const token = getToken()
  const isFormData = options.body instanceof FormData

  const headers: Record<string, string> = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(!isFormData ? { 'Content-Type': 'application/json' } : {}),
    ...(options.headers as Record<string, string>),
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
      signal: controller.signal,
    })
    clearTimeout(timeoutId)
    return response
  } catch (err) {
    clearTimeout(timeoutId)
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('Request timed out — check your connection and try again.')
    }
    throw err
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (response.status === 204) return undefined as T

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new ApiError(
      response.status,
      (data as { message?: string }).message ?? `API error ${response.status}`,
      (data as { code?: string }).code,
    )
  }

  return data as T
}
