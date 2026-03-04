# Convexo Frontend

Next.js 16 frontend for the Convexo Protocol — reducing the funding gap for SMEs in Latin America using stablecoins, NFT-permissioned liquidity pools, and DeFi vaults.

---

## Architecture Overview

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

---

## Authentication Flow

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
```

---

## Tech Stack

| Layer           | Technology                              |
|-----------------|-----------------------------------------|
| Framework       | Next.js 16 (App Router) + TypeScript 5  |
| Wallet (social) | Account Kit v4 (`@account-kit/react`)   |
| Wallet (EOA)    | wagmi v2 + viem v2                      |
| Smart Account   | Alchemy LightAccount (Base mainnet)     |
| Auth            | SIWE (EIP-4361) + JWT Bearer            |
| State / Cache   | @tanstack/react-query v5                |
| Styling         | Tailwind CSS v3                         |
| ZK Identity     | @zkpassport/sdk                         |
| Bundler         | webpack (via Next.js)                   |

---

## Project Structure

```
convexo_frontend/
├── app/                              # Next.js App Router pages
│   ├── layout.tsx                    # Root layout + Account Kit SSR cookie
│   ├── providers.tsx                 # AlchemyProvider + WagmiProvider + QueryClient
│   ├── page.tsx                      # Landing / home
│   │
│   ├── admin/page.tsx                # Admin panel (requires admin role)
│   │
│   ├── digital-id/                   # Identity & verification hub
│   │   ├── page.tsx
│   │   ├── credit-score/
│   │   │   ├── page.tsx
│   │   │   └── verify/page.tsx       # ← AI credit scoring (3 docs + financials)
│   │   ├── humanity/
│   │   │   ├── page.tsx
│   │   │   └── verify/page.tsx       # ZKPassport flow
│   │   ├── limited-partner-individuals/page.tsx  # Veriff KYC
│   │   └── limited-partner-business/page.tsx     # Sumsub KYB
│   │
│   ├── funding/
│   │   ├── page.tsx                  # Funding overview
│   │   ├── e-contracts/page.tsx
│   │   └── e-loans/page.tsx
│   │
│   ├── investments/
│   │   ├── page.tsx
│   │   ├── vaults/page.tsx           # Tokenized bond vaults
│   │   ├── c-bonds/page.tsx
│   │   └── market-lps/page.tsx
│   │
│   ├── profile/
│   │   ├── page.tsx
│   │   ├── bank-accounts/page.tsx    # ← Full CRUD, encrypted, API-backed
│   │   ├── contacts/page.tsx         # ← Wallet address book, API-backed
│   │   └── wallet/page.tsx
│   │
│   └── treasury/
│       ├── page.tsx
│       ├── swaps/page.tsx            # ← Rate from GET /rates/USDC-ECOP
│       ├── convert-fast/page.tsx     # ← Rate from GET /rates/ECOP-USDC
│       ├── financial-accounts/page.tsx  # Links to /profile/bank-accounts
│       ├── fiat-to-stable/page.tsx
│       ├── otc/page.tsx              # OTC orders
│       └── monetization/page.tsx
│
├── lib/
│   ├── api/
│   │   └── client.ts                 # apiFetch(), getToken/setToken/clearToken, ApiError
│   ├── alchemy/
│   │   └── config.ts                 # Account Kit config (chains, connectors, OAuth)
│   ├── config/
│   │   ├── tokens.ts                 # Token symbol/address/decimals definitions
│   │   └── pinata.ts                 # Pinata IPFS gateway
│   ├── contexts/
│   │   └── NavigationContext.tsx
│   ├── contracts/
│   │   ├── addresses.ts              # Contract addresses by chainId
│   │   ├── abis.ts                   # All ABI definitions
│   │   └── ecopAbi.ts                # ECOP token ABI
│   ├── hooks/
│   │   ├── index.ts                  # Re-exports all hooks
│   │   ├── useAuth.ts                # SIWE sign-in/out + JWT storage
│   │   ├── useWalletAccount.ts       # Unified: AlchemySigner + external EOA
│   │   ├── useNFTBalance.ts          # NFT tier balances for access gating
│   │   ├── useSmartWalletActivation.ts
│   │   ├── useConvexoContracts.ts
│   │   ├── useTokenizedBondVault.ts
│   │   ├── useTreasury.ts
│   │   ├── useVerification.ts
│   │   ├── useContractSigner.ts
│   │   ├── useConvexoWrite.ts
│   │   ├── useSendToken.ts
│   │   ├── useUserReputation.ts
│   │   └── useVaults.ts
│   └── wagmi/
│       ├── config.ts                 # wagmi createConfig (Base, Mainnet, Unichain)
│       └── compat.ts                 # v2-compatible hook wrappers
│
├── components/
│   └── DashboardLayout.tsx           # Sidebar + page wrapper
│
├── public/
│   └── logo_convexo.png
│
├── .env.local.example
├── next.config.ts
├── tailwind.config.ts
└── tsconfig.json
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

### 3. Start the backend

The frontend calls `convexo-backend` for auth and all data operations. See `../convexo-backend/README.md`.

```bash
# In a separate terminal:
cd ../convexo-backend
npm run dev
# → API at http://localhost:3001, Swagger at http://localhost:3001/docs
```

### 4. Start the dev server

```bash
npm run dev
# → http://localhost:3000
```

---

## NPM Scripts

| Script         | Description                |
|----------------|----------------------------|
| `npm run dev`  | Dev server (webpack mode)  |
| `npm run build`| Production build           |
| `npm run start`| Start production server    |
| `npm run lint` | ESLint                     |

---

## Environment Variables

```env
# Backend
NEXT_PUBLIC_API_URL=http://localhost:3001

# Alchemy Account Kit
NEXT_PUBLIC_ALCHEMY_API_KEY=your_alchemy_api_key
NEXT_PUBLIC_ALCHEMY_POLICY_ID=your_gas_manager_policy_id

# WalletConnect
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id

# RPC endpoints (optional — defaults to public endpoints)
NEXT_PUBLIC_BASE_MAINNET_RPC_URL=https://mainnet.base.org
NEXT_PUBLIC_ETHEREUM_MAINNET_RPC_URL=https://eth.llamarpc.com
NEXT_PUBLIC_UNICHAIN_MAINNET_RPC_URL=https://mainnet.unichain.org

# Pinata (used by Next.js API routes for client-side uploads)
PINATA_JWT=your_pinata_jwt
NEXT_PUBLIC_PINATA_GATEWAY=your-gateway.mypinata.cloud
```

| Variable                                | Required | Description                                     |
|-----------------------------------------|----------|-------------------------------------------------|
| `NEXT_PUBLIC_API_URL`                   | ✅       | Backend API base URL                            |
| `NEXT_PUBLIC_ALCHEMY_API_KEY`           | ✅       | Alchemy API key for Account Kit                 |
| `NEXT_PUBLIC_ALCHEMY_POLICY_ID`         | ✅       | Gas Manager policy (sponsored transactions)     |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`  | ✅       | WalletConnect v2 project ID                     |
| `NEXT_PUBLIC_BASE_MAINNET_RPC_URL`      |          | Base mainnet RPC (fallback to public)           |
| `NEXT_PUBLIC_ETHEREUM_MAINNET_RPC_URL`  |          | Ethereum mainnet RPC                            |
| `NEXT_PUBLIC_UNICHAIN_MAINNET_RPC_URL`  |          | Unichain mainnet RPC                            |
| `PINATA_JWT`                            |          | Pinata JWT for server-side uploads              |
| `NEXT_PUBLIC_PINATA_GATEWAY`            |          | Pinata gateway subdomain for IPFS links         |

---

## API Client

All backend requests use `lib/api/client.ts`:

```typescript
import { apiFetch, ApiError } from '@/lib/api/client'

// Authenticated GET
const accounts = await apiFetch<BankAccount[]>('/bank-accounts')

// Authenticated POST with JSON
const contact = await apiFetch<Contact>('/contacts', {
  method: 'POST',
  body: JSON.stringify({ name, address, type }),
})

// File upload — pass FormData; Content-Type is set automatically by the browser
const form = new FormData()
form.append('income_statement', file1)
form.append('balance_sheet', file2)
form.append('cash_flow', file3)
form.append('annualRevenue', '500000')
// ... other fields
const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/verification/credit-score/submit`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${getToken()}` },
  body: form,
})
```

`ApiError` has `.statusCode` and `.code`. A **401 response** automatically clears the stored JWT and throws `ApiError(401, 'Session expired')`.

---

## Authentication

```typescript
import { useAuth } from '@/lib/hooks/useAuth'

const { isAuthenticated, isConnected, isSigningIn, user, signIn, signOut } = useAuth()

// isAuthenticated  JWT is stored in localStorage('convexo_jwt')
// isConnected      Wallet is connected (Account Kit OR external EOA)
// user             { id, walletAddress, accountType, onboardingStep, isAdmin }
```

**Flow:** `signIn()` → fetch nonce → build EIP-4361 message (`viem/siwe`) → sign → POST `/auth/verify` → store `accessToken`.

Both connection modes are handled:
- **Account Kit (email/passkey/Google):** sign with `AlchemySigner.signMessage()` using the underlying embedded EOA
- **External EOA (MetaMask etc.):** sign with wagmi `signMessageAsync` via Account Kit's internal wagmi instance

---

## Wallet Account

```typescript
import { useAccount } from '@/lib/hooks/useWalletAccount'

const { address, isConnected } = useAccount()
// Works for both Account Kit (smart account address) and external EOA wallets
```

For EOA-only reads or writes, use `@/lib/wagmi/compat`:

```typescript
import { useAccount, useReadContract, useWriteContract } from '@/lib/wagmi/compat'
```

---

## NFT Tier Access Control

| Tier | Contract           | Unlocks                               |
|------|--------------------|---------------------------------------|
| 0    | —                  | Basic access, onboarding              |
| 1    | ConvexoPassport    | Treasury, Investments, Contacts       |
| 2    | LP Individuals     | LP pools (individual path)            |
| 2    | LP Business        | LP pools (business path)              |
| 3    | Ecreditscoring     | Vault creation, Funding requests      |

```typescript
import { useNFTBalance } from '@/lib/hooks/useNFTBalance'

const { hasPassportNFT, hasAnyLPNFT, hasEcreditscoringNFT, tier } = useNFTBalance()
```

Tier is read from live on-chain `balanceOf` calls. Use `POST /reputation/sync` to update the backend cache.

---

## Key Pages

| Route                               | Description                                                         |
|-------------------------------------|---------------------------------------------------------------------|
| `/`                                 | Landing page                                                        |
| `/profile/bank-accounts`            | Bank account management — full CRUD, API-backed, AES-256 at rest   |
| `/profile/contacts`                 | Wallet address book — API-backed with server-side search            |
| `/treasury/swaps`                   | Token swap — live rate from `GET /rates/USDC-ECOP`                  |
| `/treasury/convert-fast`            | ECOP ↔ USDC conversion — live rate from `GET /rates/ECOP-USDC`      |
| `/treasury/otc`                     | OTC order submission                                                |
| `/digital-id/humanity/verify`       | ZKPassport proof-of-humanity flow                                   |
| `/digital-id/limited-partner-individuals` | Veriff KYC (Individual onboarding)                          |
| `/digital-id/limited-partner-business`    | Sumsub KYB (Business onboarding)                            |
| `/digital-id/credit-score/verify`   | AI credit scoring — 3 financial docs + 9 business fields            |
| `/investments/vaults`               | Tokenized bond vaults (Tier 2 required)                             |
| `/funding`                          | Funding requests for businesses (Tier 3 required)                   |
| `/admin`                            | Admin panel (requires admin role from backend)                      |

---

## Credit Score Submission

The page at `/digital-id/credit-score/verify` submits:

```
POST /verification/credit-score/submit
Content-Type: multipart/form-data
Authorization: Bearer <JWT>

Required files (PDF/XLSX/JPG/PNG, max 20 MB each):
  income_statement, balance_sheet, cash_flow

Required fields:
  period            — e.g. "2024" or "Q3-2024"
  annualRevenue     — number as string
  netProfit         — number as string
  totalAssets       — number as string
  totalLiabilities  — number as string
  employeeCount     — integer
  yearsOperating    — integer
  existingDebt      — number as string
  monthlyExpenses   — number as string

Optional:
  additionalContext — max 2000 chars
```

Files are pinned to IPFS by the backend. n8n processes the analysis and calls back `/webhooks/n8n/credit-score` asynchronously.

---

## Supported Chains

| Chain            | Chain ID | Used For                         |
|------------------|----------|----------------------------------|
| Base Mainnet     | 8453     | Smart accounts, NFTs, default    |
| Ethereum Mainnet | 1        | On-chain reads                   |
| Unichain Mainnet | 130      | Additional on-chain reads        |

---

## Contract Addresses (Base Mainnet)

| Contract            | Address                                      |
|---------------------|----------------------------------------------|
| ConvexoPassport NFT | `0x2AD6aA7652C5167881b60C5bEa8713A0F0520cDD` |
| LP Individuals NFT  | `0xF4aA32C029CfFa6050107E65FFF6e25AA2E58554` |
| LP Business NFT     | `0x147070275646d9Cab76Ae26e5Eb632f5A6e8024C` |
| Ecreditscoring NFT  | `0x20Be7F2D32Ddaa7c056CC6C39415275401cdF9E7` |

---

## Design System

Global Tailwind utility classes (defined in `app/globals.css`):

| Class          | Description                          |
|----------------|--------------------------------------|
| `.card`        | Dark card with border and padding    |
| `.btn-primary` | Blue filled button                   |
| `.btn-secondary`| Gray outlined button                |
| `.btn-ghost`   | Transparent text button              |
| `.input`       | Styled text input                    |

The app uses a **dark theme**: `gray-900` background, `gray-800` card surfaces, `white` primary text, `gray-400` muted text.

---

## Deployment (Vercel)

```bash
# Build check locally
npm run build

# Push to GitHub → import in vercel.com
# Set environment variables in Vercel dashboard
```

**Required in production:**

```
NEXT_PUBLIC_API_URL
NEXT_PUBLIC_ALCHEMY_API_KEY
NEXT_PUBLIC_ALCHEMY_POLICY_ID
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID
PINATA_JWT
NEXT_PUBLIC_PINATA_GATEWAY
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `401 Session expired` on API calls | Sign in again via `useAuth().signIn()` |
| Wallet not connecting | Check `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` is set |
| Account Kit modal not showing | Verify `NEXT_PUBLIC_ALCHEMY_API_KEY` is valid |
| Rate shows "unavailable" | Admin must set the rate via `POST /admin/rates` |
| Credit score form won't submit | All 3 files and all 9 numeric fields are required |
| Build error `.next` stale | `rm -rf .next && npm run build` |
