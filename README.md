# Convexo Frontend

Next.js 16 App Router frontend for the Convexo Protocol — connecting international investors and Latin American SMEs through compliant, on-chain DeFi infrastructure.

[![Next.js](https://img.shields.io/badge/Next.js-16.1.6-black)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org)
[![Privy](https://img.shields.io/badge/Privy-3.22.2-purple)](https://privy.io)
[![Build](https://img.shields.io/badge/Build-passing-brightgreen)](#quick-start)
[![Network](https://img.shields.io/badge/Testnet-ETH%20Sepolia-blue)](#environment-variables)

> ⚠️ **Critical — always use webpack:** `npm run dev` is aliased to `next dev --webpack`. Never use bare `npx next dev` — Turbopack breaks with the `thread-stream` dependency pulled in by pino/Alchemy.  
> If you see chunk errors after many file changes: `rm -rf .next && npm run dev`

---

## Table of Contents

- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Smart Wallet (MAv2 / EIP-7702)](#smart-wallet-mav2--eip-7702)
- [Project Structure](#project-structure)
- [Quick Start](#quick-start)
- [Environment Variables](#environment-variables)
- [Authentication](#authentication)
- [Onboarding](#onboarding)
- [NFT Tier Access Control](#nft-tier-access-control)
- [Key Hooks](#key-hooks)
- [Wallet Components](#wallet-components)
- [Key Pages](#key-pages)
- [Design System](#design-system)
- [Deployment](#deployment)
- [Codebase Health](#codebase-health)
- [Troubleshooting](#troubleshooting)

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                        Convexo Frontend                          │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                  Next.js 16  App Router                  │    │
│  └──────────┬──────────────────┬──────────────────┬────────┘    │
│             │                  │                  │              │
│  ┌──────────▼──────┐  ┌────────▼──────┐  ┌───────▼──────────┐  │
│  │  Privy          │  │ @alchemy/     │  │   REST API       │  │
│  │  (auth/signer)  │  │ wallet-apis   │  │  (convexo-backend│  │
│  │                 │  │ (tx layer)    │  │   + JWT auth)    │  │
│  │ Email / Passkey │  │               │  │                  │  │
│  │ Google OAuth    │  │ sendCalls()   │  │  apiFetch() +    │  │
│  │ Embedded wallet │  │ Gas Manager   │  │  useAuth() SIWE  │  │
│  └─────────────────┘  └───────────────┘  └──────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │            On-Chain Reads  (viem + wagmi)                 │   │
│  │  NFT balances · Contract reads · Reputation tier sync    │   │
│  └──────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
```

### Auth Flow

```
User clicks "Sign In" → Privy modal (email OTP / passkey / Google OAuth)
        │
        ▼ Privy sets authenticated=true, wallets[0] ready (embedded wallet)
        │
        ▼ Auto-SIWE fires in page.tsx (useEffect watches isConnected)
        │
        GET /auth/nonce?address=<wallet>
        │
        ▼ Build EIP-4361 SIWE message (viem/siwe)
        │
        ▼ wallet.getEthereumProvider().request({ method: 'personal_sign' })
        │
        POST /auth/verify { message, signature, address, chainId }
        │
        ▼ Store JWT in sessionStorage('convexo_jwt')
        │
        ▼ AuthContext sets isAuthenticated = true (shared across all components)
        │
        ▼ NavigationContext enables useOnboarding → fetches /onboarding/status
        │
        ▼ router.replace('/profile') — AuthGuard handles onboarding redirect
```

Auth state lives in `lib/contexts/AuthContext.tsx` (React Context Provider). All components share one instance — `page.tsx`, `AuthGuard`, `NavigationContext`, and every page all read from the same state.

---

## Tech Stack

| Layer           | Technology                                               |
|-----------------|----------------------------------------------------------|
| Framework       | Next.js 14 (App Router) + TypeScript 5.3                 |
| Bundler         | webpack (required — Turbopack breaks thread-stream)      |
| Auth / Signer   | Privy (`@privy-io/react-auth`) — email / passkey / Google OAuth |
| Smart Account   | `@alchemy/wallet-apis` — MAv2 · EIP-7702 · Gas Manager   |
| Auth            | AuthContext (React) + SIWE (EIP-4361) + JWT + silent refresh |
| On-chain reads  | wagmi 2 + viem 2 (read-only; writes via MAv2 UO)         |
| State / Cache   | TanStack React Query v5                                  |
| Styling         | Tailwind CSS v3                                          |
| Animations      | Framer Motion v12 (page transitions via AnimatePresence) |
| ZK Identity     | @zkpassport/sdk 0.12.4                                   |
| QR Codes        | qrcode.react                                             |
| Icons           | @heroicons/react                                         |

---

## Smart Wallet (Privy + Alchemy Wallet APIs)

Convexo uses **Privy** for auth/signing and **`@alchemy/wallet-apis`** for smart contract transactions. Privy manages the embedded wallet (email / passkey / Google). Alchemy Wallet APIs wrap that signer in a `SmartWalletClient` that sends EIP-7702-delegated UserOperations through the Gas Manager.

### Architecture

```
Privy embedded wallet  →  usePrivySigner()  →  createSmartWalletClient()
    (auth + keys)              (viem LocalAccount)   (@alchemy/wallet-apis)
                                                          │
                                                   client.sendCalls([...])
                                                   Gas Manager sponsored ✅
```

### Embedded wallet only

MetaMask, WalletConnect, and Coinbase Wallet connectors were removed (2026-04-13). Only email OTP, passkey, and Google OAuth via Privy are supported.

### EIP-7702 delegation is automatic

On the user's first transaction `createSmartWalletClient` bundles the EIP-7702 authorization + the call into a single on-chain submission. The EOA address **is** the smart account address.

### Gas Manager (sponsorship)

| Chain | Env var |
|-------|---------|
| Base mainnet | `NEXT_PUBLIC_ALCHEMY_POLICY_ID` |
| ETH Sepolia | `NEXT_PUBLIC_ALCHEMY_POLICY_ID_SEPOLIA` |
| Ethereum mainnet | `NEXT_PUBLIC_ALCHEMY_POLICY_ID_ETH` |

### Import rules (enforced)

```typescript
// ✅ Always import wagmi hooks through the compat layer
import { useReadContract, useAccount, useChainId } from '@/lib/wagmi/compat'

// ✅ For writes — use useConvexoWrite (single call) or createSmartWalletClient directly (batched)
import { useConvexoWrite } from '@/lib/hooks/useConvexoWrite'

// ❌ Never import directly from wagmi
import { useAccount } from 'wagmi'

// ❌ Never use useWriteContract — it calls connector.getChainId() which crashes (no connectors)
```

`lib/wagmi/compat.ts` re-exports everything from `wagmi` and overrides `useAccount` → `useWalletAccount` (Privy bridge) and `useChainId` → `PRIMARY_CHAIN_ID`.

---

## Project Structure

```
convexo_frontend/
├── app/
│   ├── layout.tsx                    # Root layout
│   ├── providers.tsx                 # WagmiProvider → QueryClient → PrivyProvider → MigrationProvider → AuthProvider → NavigationProvider
│   ├── globals.css                   # Tailwind + design system utility classes
│   ├── page.tsx                      # Home / landing
│   ├── error.tsx                     # Root error boundary
│   │
│   ├── admin/                        # Admin panel (SUPER_ADMIN only)
│   ├── onboarding/                   # Full-screen 3-step wizard
│   │
│   ├── digital-id/                   # Identity & verification hub
│   │   ├── credit-score/verify/      # AI credit score (3 PDFs + 9 fields)
│   │   ├── humanity/verify/          # ZKPassport flow
│   │   ├── limited-partner-individuals/  # Veriff KYC
│   │   └── limited-partner-business/     # Sumsub KYB
│   │
│   ├── funding/                      # Tier 3 (vault creators)
│   │   ├── e-contracts/
│   │   └── e-loans/
│   │
│   ├── investments/                  # Tier 1+
│   │   ├── vaults/                   # Tokenized bond vaults
│   │   ├── c-bonds/
│   │   └── market-lps/
│   │
│   ├── profile/
│   │   ├── bank-accounts/            # Full CRUD, country-first adaptive form (CO/US/EU), SWIFT/IBAN/routing
│   │   ├── contacts/                 # Wallet address book
│   │   └── wallet/                   # Multi-chain portfolio view
│   │
│   └── treasury/                     # Tier 1+
│       ├── swaps/                    # ECOP↔USDC Uniswap V4 pool
│       └── otc/                      # OTC desk orders (Telegram + email notifications)
│
├── components/
│   ├── DashboardLayout.tsx           # Sidebar + AnimatePresence page transitions
│   ├── Sidebar.tsx
│   ├── AuthGuard.tsx                 # Redirects unauthenticated / not-onboarded users
│   ├── NFTDisplayCard.tsx
│   ├── VaultCard.tsx
│   ├── ui/                           # Shared primitives
│   │   ├── Skeleton.tsx
│   │   ├── Spinner.tsx
│   │   ├── EmptyState.tsx
│   │   ├── Modal.tsx
│   │   └── PageTransition.tsx
│   └── wallet/                       # Wallet page components
│       ├── TokenLogo.tsx             # Token icon with gradient fallback
│       ├── PriceChange.tsx           # 24h ▲/▼ indicator
│       ├── QRScanner.tsx             # Camera QR code scanner (BarcodeDetector API)
│       ├── CollapsibleTokenRow.tsx   # Expandable row with per-chain breakdown
│       ├── SendModal.tsx             # Full send flow with QR scanner
│       ├── ReceiveModal.tsx          # QR display + address copy
│       ├── WalletSkeleton.tsx        # Loading skeleton (5 token rows)
│       └── index.ts
│
├── lib/
│   ├── api/
│   │   └── client.ts                 # apiFetch(), JWT token helpers, ApiError, silent refresh
│   ├── privy/
│   │   ├── config.ts                 # Privy app IDs, migrationAlchemyConfig, getViemChain(), getPolicyId()
│   │   └── usePrivySigner.ts         # Privy wallet → viem LocalAccount bridge
│   ├── config/
│   │   ├── tokens.ts                 # Token metadata (symbol, address, decimals, logo)
│   │   └── pinata.ts                 # Pinata IPFS gateway helpers
│   ├── contexts/
│   │   ├── AuthContext.tsx            # Shared auth state (AuthProvider + useAuth hook)
│   │   └── NavigationContext.tsx     # accountType, onboardingStep, isLoading, tier
│   ├── contracts/
│   │   ├── addresses.ts              # Contract addresses by chainId
│   │   ├── abis.ts                   # All ABI definitions
│   │   └── ecopAbi.ts                # ECOP local stablecoin ABI
│   ├── hooks/
│   │   ├── useAuth.ts                # Re-exports useAuth from AuthContext (backward compat)
│   │   ├── useOnboarding.ts          # GET /onboarding/status
│   │   ├── useWalletAccount.ts       # Privy wallet → wagmi-compatible useAccount shape
│   │   ├── useNFTBalance.ts          # Live on-chain NFT balances for access gating
│   │   ├── useNFTMetadata.ts         # Alchemy NFT API — real IPFS metadata for NFT cards
│   │   ├── usePortfolioBalances.ts   # Alchemy Portfolio API — replaces 7 calls with 1
│   │   ├── useConvexoWrite.ts        # Drop-in useWriteContract (UO for MAv2, raw tx for EOA)
│   │   ├── useSendToken.ts           # Unified ETH/ERC-20 transfer
│   │   ├── useUserReputation.ts
│   │   ├── useVaults.ts
│   │   └── ...
│   ├── stubs/
│   │   └── thread-stream.js          # Empty stub — turbopack alias for thread-stream
│   └── wagmi/
│       ├── config.ts                 # wagmi createConfig (Base, Mainnet, Unichain)
│       └── compat.ts                 # Overrides useAccount → useWalletAccount
│
├── next.config.js                    # webpack alias: thread-stream → false
├── tailwind.config.ts
├── tsconfig.json
└── .env.local.example
```

---

## Quick Start

### 1. Install dependencies

```bash
cd convexo_frontend
npm install
```

### 2. Configure environment

```bash
cp .env.local.example .env.local
# Edit .env.local — see Environment Variables below
```

### 3. Start the backend first

```bash
cd ../convexo-backend
npm install && npm run db:migrate && npm run dev
# → API at http://localhost:3001, docs at http://localhost:3001/docs
```

### 4. Start the dev server

```bash
# From convexo_frontend/
npm run dev
# → http://localhost:3000
```

### 5. Verify

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/
# → 200
```

---

## NPM Scripts

| Script          | Command              | Description                          |
|-----------------|----------------------|--------------------------------------|
| `npm run dev`   | `next dev --webpack` | Dev server (**webpack required**)    |
| `npm run build` | `next build --webpack` | Production build                   |
| `npm run start` | `next start`         | Start production server              |
| `npm run lint`  | `next lint`          | ESLint                               |

---

## Environment Variables

```env
# Network mode — controls primary chain (build-time)
# 'mainnet' → Base (8453) | 'testnet' → ETH Sepolia (11155111, default)
NEXT_PUBLIC_NETWORK_MODE=testnet

# Backend API
NEXT_PUBLIC_API_URL=http://localhost:3001

# Alchemy (Wallet APIs + NFT API + Portfolio API + Gas Manager)
NEXT_PUBLIC_ALCHEMY_API_KEY=your_alchemy_api_key
NEXT_PUBLIC_ALCHEMY_POLICY_ID=your_base_gas_manager_policy_id
NEXT_PUBLIC_ALCHEMY_POLICY_ID_SEPOLIA=your_sepolia_gas_manager_policy_id
NEXT_PUBLIC_ALCHEMY_POLICY_ID_ETH=your_eth_gas_manager_policy_id

# Pinata IPFS
PINATA_JWT=your_pinata_jwt
NEXT_PUBLIC_PINATA_GATEWAY=your-gateway.mypinata.cloud
```

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_NETWORK_MODE` | | `mainnet` or `testnet` (default: testnet = ETH Sepolia) |
| `NEXT_PUBLIC_API_URL` | ✅ | Backend API base URL |
| `NEXT_PUBLIC_ALCHEMY_API_KEY` | ✅ | Alchemy key — Wallet APIs + NFT + Portfolio APIs |
| `NEXT_PUBLIC_ALCHEMY_POLICY_ID` | ✅ | Gas Manager policy for Base mainnet |
| `NEXT_PUBLIC_ALCHEMY_POLICY_ID_SEPOLIA` | ✅ | Gas Manager policy for ETH Sepolia |
| `NEXT_PUBLIC_ALCHEMY_POLICY_ID_ETH` | | Gas Manager policy for Ethereum mainnet |
| `PINATA_JWT` | | Pinata JWT for server-side IPFS uploads |
| `NEXT_PUBLIC_PINATA_GATEWAY` | | Pinata gateway subdomain |

---

## Authentication

Auth state is a **shared React Context** (`lib/contexts/AuthContext.tsx`). All components — `page.tsx`, `AuthGuard`, `NavigationContext`, every page — read from one `AuthProvider` instance. Sign-in propagates globally in a single re-render.

```typescript
import { useAuth } from '@/lib/hooks/useAuth'

const { isAuthenticated, isInitializing, isConnected, isSigningIn, signInStage, user, error, signIn, signOut } = useAuth()
// isAuthenticated  → JWT is in sessionStorage('convexo_jwt')
// isConnected      → Privy authenticated + wallet ready (embedded wallet only)
// user             → { id, walletAddress, accountType, onboardingStep, isAdmin }
// signInStage      → 'nonce' | 'signing' | 'verifying' | 'idle'
```

**JWT storage:** `sessionStorage` — cleared automatically on tab close (banking-grade session).

**Silent refresh:** `lib/api/client.ts` automatically calls `POST /auth/refresh` on 401 before retrying. No manual token management required.

**Embedded wallet only:** MetaMask, WalletConnect, and Coinbase Wallet connectors were removed (2026-04-13). Only email OTP, passkey, and Google OAuth via Privy are supported.

---

## Onboarding

After SIWE sign-in, `AuthGuard` checks `onboardingStep`. Steps `NOT_STARTED` or `TYPE_SELECTED` redirect to `/onboarding`.

### Wizard (`/onboarding`) — no `DashboardLayout` to avoid redirect loops

| Step | UI | API |
|---|---|---|
| 1 — Account Type | Individual / Business cards | `POST /onboarding/type` |
| 2 — Profile Form | Individual: name/email/DOB. Business: company/taxId/rep | `POST /onboarding/profile` |
| 3 — Path Guide | Visual roadmap → link to `/digital-id` | — |

### Account type gating

| Page | Individual | Business |
|---|---|---|
| `/digital-id` | Humanity + LP Individuals | Humanity + LP Business + Credit Score |
| `/profile` | Personal Info card | Company Info card |
| `/funding` | Hidden | Visible (Tier 3) |

---

## NFT Tier Access Control

| Tier | Contract | Unlocks |
|---|---|---|
| 0 | — | Basic access + onboarding |
| 1 | `Convexo_Passport` | Investments + Wallet |
| 2 | `LP_Individuals` / `LP_Business` | Treasury · OTC · Monetization · Credit Score |
| 3 | `Ecreditscoring` | Vault creation · Funding |

```typescript
import { useNFTBalance } from '@/lib/hooks/useNFTBalance'

const { hasPassportNFT, hasAnyLPNFT, hasEcreditscoringNFT, tier } = useNFTBalance()
```

---

## Key Hooks

| Hook | Purpose |
|---|---|
| `useAuth` | SIWE sign-in/out, JWT storage, user object |
| `useWalletAccount` | Unified address from Privy embedded wallet |
| `useOnboarding` | Onboarding step + account type from backend |
| `useNFTBalance` | Live on-chain `balanceOf` for all 4 NFT contracts |
| `useNFTMetadata` | Alchemy NFT API — real IPFS image + name per NFT |
| `usePortfolioBalances` | Alchemy Portfolio API — all token balances in 1 request |
| `useConvexoWrite` | Gas-sponsored contract write via Privy signer + `@alchemy/wallet-apis` |
| `useSendToken` | Unified ETH/ERC-20 transfer with chain switching |
| `useUserReputation` | Cached tier from backend + manual sync trigger |
| `useVaults` | Tokenized bond vault reads |
| `useV4Quote` | Reads sqrtPriceX96 from `PoolManager.extsload` (bypasses broken ETH Sepolia Quoter), computes spot-price off-chain — debounced 500ms |
| `useV4Swap` | Full V4 swap: ERC-20 approve → Permit2 approve → Universal Router execute |
| `useContracts` | Returns contract addresses for the current chain (`getContractsForChain`) |

### `usePortfolioBalances` (Alchemy Portfolio API)

Replaces 7 separate wagmi/CoinGecko calls with a single Alchemy Portfolio API request:

```typescript
import { usePortfolioBalances } from '@/lib/hooks/usePortfolioBalances'

const { tokens, knownTokens, otherTokens, totalPortfolioUsd } = usePortfolioBalances()
// knownTokens  → ETH/USDC/USDT/EURC/WBTC/cbBTC pinned at top
// otherTokens  → all remaining tokens
// staleTime: 60s, gcTime: 5min
```

### `useNFTMetadata` (Alchemy NFT API)

Fetches real IPFS metadata for all 4 Convexo NFT contracts:

```typescript
import { useNFTMetadata } from '@/lib/hooks/useNFTMetadata'

const { passport, lpIndividual, lpBusiness, creditScore } = useNFTMetadata()
// Each: { imageUrl, name, tokenId } | null
// staleTime: 5min, gcTime: 15min
```

---

## Wallet Components

The `components/wallet/` directory contains the full wallet page UI:

| Component | Purpose |
|---|---|
| `TokenLogo` | Token icon with gradient color fallback per symbol |
| `PriceChange` | 24h price change with ▲/▼ color indicator |
| `QRScanner` | Camera-based QR scanner using `BarcodeDetector` API |
| `CollapsibleTokenRow` | Expandable token row with per-chain balance breakdown |
| `SendModal` | Full send flow: token/chain/address/amount selector + QR scanner + success state |
| `ReceiveModal` | QR code display (via `qrcode.react`) + address copy |
| `WalletSkeleton` | Loading skeleton for wallet page (5 token rows) |

---

## Key Pages

| Route | Description | Min Tier |
|---|---|---|
| `/` | Home / landing | — |
| `/onboarding` | 3-step account setup wizard | — |
| `/profile` | User profile — Individual or Business | — |
| `/profile/wallet` | Multi-chain portfolio view | — |
| `/profile/bank-accounts` | Bank accounts — full CRUD, AES-256 encrypted | — |
| `/profile/contacts` | Wallet address book | — |
| `/digital-id` | Identity hub | — |
| `/digital-id/humanity/verify` | ZKPassport proof-of-humanity | — |
| `/digital-id/limited-partner-individuals` | Veriff KYC | — |
| `/digital-id/limited-partner-business` | Sumsub KYB | — |
| `/digital-id/credit-score/verify` | AI credit score (3 PDFs + 9 fields) | 2 |
| `/treasury/swaps` | USDC ↔ ECOP swap — extsload spot-price quote + Universal Router | 1 |
| `/treasury/otc` | OTC orders — Telegram + Resend email notifications, 4-step form | 1 |
| `/investments/vaults` | Tokenized bond vaults | 1 |
| `/investments/market-lps` | LP market | 1 |
| `/funding` | Funding requests (Business only) | 3 |
| `/funding/e-contracts` | Electronic contracts | 3 |
| `/admin` | Admin panel | Admin |

---

## Design System

The app uses a **dark theme**. Global utility classes in `app/globals.css`:

| Class | Description |
|---|---|
| `.card` | Dark card — `bg-gray-800` border + padding |
| `.btn-primary` | Blue filled button |
| `.btn-secondary` | Gray outlined button |
| `.btn-ghost` | Transparent text button |
| `.input` | Styled text input |

Colors: `bg-gray-900` page background · `bg-gray-800` cards · `white` primary text · `gray-400` muted.

Page transitions use **Framer Motion `AnimatePresence`** in `DashboardLayout.tsx`.

---

## Deployment

```bash
# 1. Verify locally
npm run build      # 0 errors, 28 routes
npx tsc --noEmit   # 0 TypeScript errors

# 2. Deploy to Vercel
# Push to GitHub → import in vercel.com
# Set all environment variables in Vercel dashboard
```

**Required in Vercel:**
```
NEXT_PUBLIC_API_URL
NEXT_PUBLIC_ALCHEMY_API_KEY
NEXT_PUBLIC_ALCHEMY_POLICY_ID
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID
PINATA_JWT
NEXT_PUBLIC_PINATA_GATEWAY
```

See [DEPLOY.md](./DEPLOY.md) for the full production checklist.

---

## Codebase Health

| Check | Status | Notes |
|---|---|---|
| TypeScript errors | ✅ 0 | `npx tsc --noEmit` clean |
| Production build | ✅ passing | `npm run build --webpack` |
| Primary testnet | ✅ ETH Sepolia (11155111) | ZKPassport verifier + pool LIVE — `NEXT_PUBLIC_NETWORK_MODE=testnet` |
| V4 swap wired (v3.20) | ✅ | `useV4Swap` + `useV4Quote` — hook v3.20, pool seeded 6,250 USDC, Universal Router allowed |
| V4 quote (v3.20) | ✅ | extsload-based spot-price (Quoter bypass) — see `useV4Quote.ts` + CLAUDE.md for rationale |
| V4 addresses (v3.18+) | ✅ | UNIVERSAL_ROUTER, POSITION_MANAGER, PERMIT2 all chains |
| Vault investments | ✅ | `GET /vaults` backend + on-chain `useReadContract` for live state |
| ZKPassport flow | ✅ | Age ≥18, sanctions (20 ISO alpha-3), nationality, expiry — `devMode` OFF for prod |
| Auth (JWT decode) | ✅ | Instant session restore from JWT payload — no network call on mount |
| Privy migration | ✅ Complete | `PrivyProvider` + `MigrationProvider` — `@account-kit/react` auth hooks fully removed |
| EIP-7702 delegation | ✅ Automatic | `@alchemy/wallet-apis` bundles auth + sendCalls on first tx — no activation step |
| Raw `from 'wagmi'` imports | ✅ Removed | All use `from '@/lib/wagmi/compat'` |
| Auth race condition | ✅ Fixed | `AuthGuard` waits for JWT init + `usePrivy().ready` |
| Silent refresh | ✅ Active | `POST /auth/refresh` on 401 in `lib/api/client.ts` |
| Error boundaries | ✅ Added | Root `error.tsx` + `loading.tsx` files throughout |
| Page transitions | ✅ Active | Framer Motion `AnimatePresence` in `DashboardLayout` |
| Gas Manager — Base | ✅ Active | Policy `f09c26c8-7567-478d-861a-ace75dec3f28` |
| Gas Manager — Ethereum | ✅ Active | Policy `063c2de8-1e92-4e84-b1ee-0444523e27c1` |

---

## Troubleshooting

| Problem | Solution |
|---|---|
| `ChunkLoadError` in browser | Stale webpack cache — `rm -rf .next && npm run dev` |
| Dev server starts but 500 errors | Not using webpack — use `npm run dev`, not `npx next dev` |
| `401 Session expired` on all API calls | Sign in again via `useAuth().signIn()` |
| Privy modal not showing | Verify Privy App ID in `lib/privy/config.ts` + Privy Dashboard allowed domains |
| Rate shows "unavailable" | Admin must set rate via `POST /admin/rates` |
| Credit score form won't submit | All 3 PDFs + all 9 numeric fields are required |
| UserOperation fails "Add ETH on Base" | Gas Manager not applied — check `NEXT_PUBLIC_ALCHEMY_POLICY_ID` |
| First tx doesn't delegate to MAv2 | Delegation is automatic — `@alchemy/wallet-apis` bundles EIP-7702 on first tx |
| `useAccount` returns wrong address | Import `from '@/lib/wagmi/compat'`, not `from 'wagmi'` |
| Digital-id cards all visible | `accountType` is null — user hasn't finished onboarding type step |
| Onboarding redirect loop | `/onboarding` must NOT use `DashboardLayout` (which wraps `AuthGuard`) |
| Existing Alchemy users not migrating | Ensure `MigrationProvider` wraps the app and `migrationAlchemyConfig` uses correct chain |
