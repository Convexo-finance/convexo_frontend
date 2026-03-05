# Convexo Frontend

Next.js 16 App Router frontend for the Convexo Protocol — connecting international investors and Latin American SMEs through compliant, on-chain DeFi infrastructure.

[![Next.js](https://img.shields.io/badge/Next.js-16.1.6-black)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org)
[![Account Kit](https://img.shields.io/badge/Alchemy%20Account%20Kit-4.84.1-purple)](https://accountkit.alchemy.com)
[![Build](https://img.shields.io/badge/Build-28%20routes%20passing-brightgreen)](#quick-start)

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
│  │  Account Kit v4 │  │   wagmi v2    │  │   REST API       │  │
│  │   (Alchemy)     │  │  (EOA wallets)│  │  (convexo-backend│  │
│  │                 │  │               │  │   + JWT auth)    │  │
│  │ Email / Passkey │  │ MetaMask      │  │                  │  │
│  │ Google OAuth    │  │ WalletConnect │  │  apiFetch() +    │  │
│  │ Smart Account   │  │ Coinbase      │  │  useAuth() SIWE  │  │
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
User connects wallet
        │
        ├── Email / Passkey / Google ──▶ Alchemy AlchemySigner (embedded EOA)
        │
        └── MetaMask / WalletConnect / Coinbase ──▶ External EOA
                        │
                        ▼
        GET /auth/nonce?address=<signer_address>
                        │
                        ▼
        Build EIP-4361 SIWE message (viem/siwe)
                        │
                        ▼
        Sign with wallet (AlchemySigner or wagmi signMessage)
                        │
                        ▼
        POST /auth/verify { message, signature, address, chainId, authMethod }
                        │
                        ▼
        Store accessToken in localStorage('convexo_jwt')
                        │
                        ▼
        All API calls ── Authorization: Bearer <accessToken>
        Silent refresh ── POST /auth/refresh (automatic, via axios interceptor)
```

---

## Tech Stack

| Layer           | Technology                                               |
|-----------------|----------------------------------------------------------|
| Framework       | Next.js 16.1.6 (App Router) + TypeScript 5.3             |
| Bundler         | webpack (required — Turbopack breaks thread-stream)      |
| Wallet (social) | Alchemy Account Kit v4 (`@account-kit/react`)            |
| Wallet (EOA)    | wagmi 2.19.3 + viem 2.46.3                               |
| Smart Account   | Modular Account V2 — MAv2 (ERC-6900 · EIP-7702, Base)   |
| Auth            | SIWE (EIP-4361) + JWT Bearer + silent refresh            |
| State / Cache   | TanStack React Query v5                                  |
| Styling         | Tailwind CSS v3                                          |
| Animations      | Framer Motion v12 (page transitions via AnimatePresence) |
| ZK Identity     | @zkpassport/sdk 0.12.4                                   |
| QR Codes        | qrcode.react                                             |
| Icons           | @heroicons/react                                         |

---

## Smart Wallet (MAv2 / EIP-7702)

Convexo uses **Alchemy Modular Account V2 (MAv2)** as its smart wallet layer. MAv2 is an ERC-6900 account with EIP-7702 support, audited by ChainLight and Quantstamp, and ~40% cheaper to deploy than alternatives like Safe.

### Two wallet modes

| User type | Wallet mode | Smart account? | Gas sponsorship? |
|-----------|-------------|----------------|------------------|
| Email / Passkey / Google | Alchemy embedded signer → MAv2 via EIP-7702 | ✅ EOA address = smart wallet address | ✅ Gas Manager |
| MetaMask / WalletConnect / Coinbase | External EOA (raw wagmi) | ❌ No UserOperations | ❌ Not supported |

### EIP-7702 delegation is automatic

No manual "activation" step is required. When an embedded-signer user sends their **first transaction**, Account Kit automatically:

1. Detects that EIP-7702 delegation is needed
2. Bundles the EIP-7702 authorization signature + the UserOperation into a **single on-chain submission**
3. Delegates the signer's EOA to the MAv2 implementation contract at the same address

```
Delegation target: 0x69007702764179f14F51cdce752f4f775d74E139 (MAv2 on Base)
```

### Gas Manager (sponsorship)

| Chain | Env var | Policy ID |
|-------|---------|-----------|
| Base mainnet | `NEXT_PUBLIC_ALCHEMY_POLICY_ID` | `f09c26c8-7567-478d-861a-ace75dec3f28` |
| Ethereum mainnet | `NEXT_PUBLIC_ALCHEMY_POLICY_ID_ETH` | `063c2de8-1e92-4e84-b1ee-0444523e27c1` |

### Import rules (enforced)

```typescript
// ✅ Always import wagmi hooks through the compat layer
import { useReadContract, useWriteContract, useAccount } from '@/lib/wagmi/compat'

// ❌ Never import directly
import { useAccount } from 'wagmi'
```

`lib/wagmi/compat.ts` re-exports everything from `wagmi` and overrides `useAccount` with `useWalletAccount` so all components transparently handle both wallet modes.

---

## Project Structure

```
convexo_frontend/
├── app/
│   ├── layout.tsx                    # Root layout — Account Kit SSR cookie init
│   ├── providers.tsx                 # WagmiProvider + QueryClient + AlchemyAccountProvider
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
│   │   ├── bank-accounts/            # Full CRUD, AES-256 encrypted at rest
│   │   ├── contacts/                 # Wallet address book
│   │   └── wallet/                   # Multi-chain portfolio view
│   │
│   └── treasury/                     # Tier 2+
│       ├── swaps/
│       ├── convert-fast/
│       ├── otc/
│       ├── monetization/
│       └── fiat-to-stable/
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
│   ├── alchemy/
│   │   └── config.ts                 # Account Kit config (chains, connectors, OAuth, Gas Manager)
│   ├── config/
│   │   ├── tokens.ts                 # Token metadata (symbol, address, decimals, logo)
│   │   └── pinata.ts                 # Pinata IPFS gateway helpers
│   ├── contexts/
│   │   └── NavigationContext.tsx     # accountType, onboardingStep, isLoading, tier
│   ├── contracts/
│   │   ├── addresses.ts              # Contract addresses by chainId
│   │   ├── abis.ts                   # All ABI definitions
│   │   └── ecopAbi.ts                # ECOP local stablecoin ABI
│   ├── hooks/
│   │   ├── useAuth.ts                # SIWE sign-in/out + JWT storage
│   │   ├── useOnboarding.ts          # GET /onboarding/status
│   │   ├── useWalletAccount.ts       # Unified: AlchemySigner + external EOA
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
# Backend API
NEXT_PUBLIC_API_URL=http://localhost:3001

# Alchemy (Account Kit + NFT API + Portfolio API)
NEXT_PUBLIC_ALCHEMY_API_KEY=your_alchemy_api_key
NEXT_PUBLIC_ALCHEMY_POLICY_ID=your_base_gas_manager_policy_id
NEXT_PUBLIC_ALCHEMY_POLICY_ID_ETH=your_eth_gas_manager_policy_id

# WalletConnect
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id

# RPC endpoints (optional — public fallbacks exist)
NEXT_PUBLIC_BASE_MAINNET_RPC_URL=https://mainnet.base.org
NEXT_PUBLIC_ETHEREUM_MAINNET_RPC_URL=https://eth.llamarpc.com
NEXT_PUBLIC_UNICHAIN_MAINNET_RPC_URL=https://mainnet.unichain.org

# Pinata IPFS
PINATA_JWT=your_pinata_jwt
NEXT_PUBLIC_PINATA_GATEWAY=your-gateway.mypinata.cloud
```

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | ✅ | Backend API base URL |
| `NEXT_PUBLIC_ALCHEMY_API_KEY` | ✅ | Alchemy key — Account Kit + NFT + Portfolio APIs |
| `NEXT_PUBLIC_ALCHEMY_POLICY_ID` | ✅ | Gas Manager policy for Base mainnet |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | ✅ | WalletConnect v2 project ID |
| `NEXT_PUBLIC_ALCHEMY_POLICY_ID_ETH` | | Gas Manager policy for Ethereum mainnet |
| `PINATA_JWT` | | Pinata JWT for server-side IPFS uploads |
| `NEXT_PUBLIC_PINATA_GATEWAY` | | Pinata gateway subdomain |

---

## Authentication

```typescript
import { useAuth } from '@/lib/hooks/useAuth'

const { isAuthenticated, isConnected, isSigningIn, user, signIn, signOut } = useAuth()
// isAuthenticated  → JWT is in localStorage('convexo_jwt')
// isConnected      → wallet connected (Account Kit OR external EOA)
// user             → { id, walletAddress, accountType, onboardingStep, isAdmin }
```

**Silent refresh:** `lib/api/client.ts` has a request interceptor that automatically calls `POST /auth/refresh` on 401 responses before retrying the original request. No manual token management required.

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
| `useWalletAccount` | Unified address for Account Kit + EOA wallets |
| `useOnboarding` | Onboarding step + account type from backend |
| `useNFTBalance` | Live on-chain `balanceOf` for all 4 NFT contracts |
| `useNFTMetadata` | Alchemy NFT API — real IPFS image + name per NFT |
| `usePortfolioBalances` | Alchemy Portfolio API — all token balances in 1 request |
| `useConvexoWrite` | Drop-in `useWriteContract` — UO for smart accounts, raw tx for EOA |
| `useSendToken` | Unified ETH/ERC-20 transfer with chain switching |
| `useUserReputation` | Cached tier from backend + manual sync trigger |
| `useVaults` | Tokenized bond vault reads |

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
| `/treasury/swaps` | Token swap — live rate from `GET /rates/USDC-ECOP` | 2 |
| `/treasury/convert-fast` | ECOP ↔ USDC — live rate from `GET /rates/ECOP-USDC` | 2 |
| `/treasury/otc` | OTC orders | 2 |
| `/treasury/monetization` | Yield tools | 2 |
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
| Production build | ✅ 28 routes | `npm run build --webpack` passes |
| Account type | ✅ `MultiOwnerModularAccount` everywhere | `useWalletAccount`, `useConvexoWrite`, `useSendToken` |
| EIP-7702 delegation | ✅ Automatic | Account Kit bundles auth + UO on first tx — no activation step |
| Deprecated `useContractRead` | ✅ Removed | All replaced with `useReadContract` (wagmi v2) |
| Raw `from 'wagmi'` imports | ✅ Removed | All use `from '@/lib/wagmi/compat'` |
| `useSmartWalletActivation` | ✅ Removed | Activation is automatic via SDK |
| Auth race condition | ✅ Fixed | `AuthGuard` waits for JWT init + Account Kit signer reconnection |
| Profile page flash | ✅ Fixed | Shows spinner during `isReconnecting` |
| Silent refresh | ✅ Active | `POST /auth/refresh` on 401 in `lib/api/client.ts` |
| console.log statements | ✅ Purged | 30+ removed across pages |
| Error boundaries | ✅ Added | Root `error.tsx` + 20+ `loading.tsx` / `error.tsx` files |
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
| Wallet not connecting | Verify `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` |
| Account Kit modal not showing | Verify `NEXT_PUBLIC_ALCHEMY_API_KEY` is valid |
| Rate shows "unavailable" | Admin must set rate via `POST /admin/rates` |
| Credit score form won't submit | All 3 PDFs + all 9 numeric fields are required |
| UserOperation fails "Add ETH on Base" | Gas Manager not applied — check `NEXT_PUBLIC_ALCHEMY_POLICY_ID` |
| First tx doesn't delegate to MAv2 | Delegation is automatic — Account Kit bundles EIP-7702 on first tx |
| `useAccount` returns wrong address | Import `from '@/lib/wagmi/compat'`, not `from 'wagmi'` |
| Digital-id cards all visible | `accountType` is null — user hasn't finished onboarding type step |
| Onboarding redirect loop | `/onboarding` must NOT use `DashboardLayout` (which wraps `AuthGuard`) |
| TypeScript error `MultiOwnerModularAccount` | `npm install @account-kit/smart-contracts@4.84.1` |
