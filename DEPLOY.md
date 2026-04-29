# Convexo Frontend — Deployment Guide

> Updated: 2026-04-29 | Stack: Next.js 16 App Router + Privy + @alchemy/wallet-apis | Hosted: Vercel
> Active chains: **ETH Sepolia** (primary testnet, all contracts live) · **ETH Mainnet** (production target)

---

## Prerequisites

| Tool | Version |
|------|---------|
| Node.js | 20+ |
| npm | latest |

---

## Local Development

### 1. Install Dependencies

```bash
cd convexo_frontend
npm install
```

### 2. Environment Variables

Create `.env.local` (copy from `.env.example`):

```env
# Network mode — controls primary chain
# mainnet → ETH Mainnet (1) | testnet → ETH Sepolia (11155111)
NEXT_PUBLIC_NETWORK_MODE=testnet

# Privy Auth (get from Privy Dashboard → app cmok5banj000c0ckvotv8lgg7)
NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id
NEXT_PUBLIC_PRIVY_CLIENT_ID=your_privy_client_id

# Backend API
NEXT_PUBLIC_API_URL=http://localhost:3001

# Alchemy — Wallet APIs + RPC + NFT/Portfolio APIs
NEXT_PUBLIC_ALCHEMY_API_KEY=your_alchemy_api_key

# Gas Manager policy IDs
NEXT_PUBLIC_ALCHEMY_POLICY_ID_ETH=your_eth_mainnet_policy_id
NEXT_PUBLIC_ALCHEMY_POLICY_ID_SEPOLIA=your_eth_sepolia_policy_id

# RPC URLs — ETH Mainnet + ETH Sepolia (active chains)
NEXT_PUBLIC_ETHEREUM_MAINNET_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/...
NEXT_PUBLIC_ETHEREUM_SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/...

# Pinata IPFS (metadata display)
PINATA_JWT=...
PINATA_API_KEY=...
PINATA_SECRET_KEY=...
NEXT_PUBLIC_PINATA_GATEWAY=your-gateway.mypinata.cloud
```

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_NETWORK_MODE` | Yes | `mainnet` (ETH Mainnet 1) or `testnet` (ETH Sepolia 11155111) |
| `NEXT_PUBLIC_PRIVY_APP_ID` | Yes | Privy App ID — from Privy Dashboard |
| `NEXT_PUBLIC_PRIVY_CLIENT_ID` | Yes | Privy Client ID — from Privy Dashboard |
| `NEXT_PUBLIC_API_URL` | Yes | Backend base URL |
| `NEXT_PUBLIC_ALCHEMY_API_KEY` | Yes | Alchemy API key — Wallet APIs + NFT/Portfolio APIs + RPC |
| `NEXT_PUBLIC_ALCHEMY_POLICY_ID_ETH` | Mainnet | Gas Manager policy ID for ETH Mainnet |
| `NEXT_PUBLIC_ALCHEMY_POLICY_ID_SEPOLIA` | Testnet | Gas Manager policy ID for ETH Sepolia |
| `NEXT_PUBLIC_ETHEREUM_MAINNET_RPC_URL` | Yes | Alchemy RPC for ETH Mainnet |
| `NEXT_PUBLIC_ETHEREUM_SEPOLIA_RPC_URL` | Yes | Alchemy RPC for ETH Sepolia |
| `PINATA_JWT` | Yes | Pinata JWT for server-side uploads |
| `NEXT_PUBLIC_PINATA_GATEWAY` | Yes | Pinata gateway for IPFS metadata display |

### 3. Start Dev Server

```bash
npm run dev        # ← always use this, NOT npx next dev
# → App at http://localhost:3000
```

> **Critical:** `npm run dev` aliases `next dev --webpack`. Never use bare `npx next dev` — it defaults to Turbopack which cannot bundle `thread-stream` inside node_modules.

> **Prerequisite:** The backend must be running at `NEXT_PUBLIC_API_URL` (default `http://localhost:3001`). See `convexo-backend/DEPLOY.md`.

---

## Onboarding Flow (Local Verification)

After both services are running:

1. Sign in with email/passkey/Google OAuth → Privy embedded wallet connected (existing Alchemy users auto-migrated via MigrationProvider)
2. New wallet → redirects to `/onboarding`
3. Step 1: Pick INDIVIDUAL or BUSINESS → `POST /onboarding/type`
4. Step 2: Fill profile form → `POST /onboarding/profile`
5. Step 3: Verification roadmap → link to `/digital-id`
6. Returning user → JWT restored from `sessionStorage`, lands on dashboard

Key routes:

| Route | Description |
|-------|-------------|
| `/` | Landing / sign-in (public) |
| `/onboarding` | Standalone 3-step wizard (no DashboardLayout) |
| `/digital-id/humanity` | ZKPassport → Tier 1 (Convexo Passport NFT) |
| `/digital-id/kyc` | Veriff KYC → Tier 2 Individual (LP_Individuals NFT) |
| `/digital-id/kyb` | Sumsub KYB → Tier 2 Business (LP_Business NFT) |
| `/digital-id/credit-score` | n8n AI credit score → Tier 3 (Ecreditscoring NFT) |
| `/treasury/swaps` | USDC↔ECOP swap (Uniswap V4 live) |
| `/investments/vaults` | Tokenized bond vaults (ERC-7540) |
| `/funding` | Business-only vault funding |
| `/treasury/otc` | OTC trade orders |
| `/profile` | Bank accounts, contacts, wallet |
| `/admin` | In-app admin panel (admin role required) |

---

## Contract Addresses (v3.18 / v3.19)

Deterministic via `CREATE2` salt `convexo.v3.18` — same address on all chains **except** ETH Sepolia which uses v3.19.

| Contract | Address |
|----------|---------|
| `CONVEXO_PASSPORT` (all except ETH Sep) | `0x648D128c117bC83aEAAd408ab69F0E5cb6291790` |
| `CONVEXO_PASSPORT` (ETH Sepolia v3.19) | `0xCde95545f2446C2CfdDA7439493AD453014AC562` |
| `LP_INDIVIDUALS` | `0xE244e4B2B37EA6f6453d3154da548e7f2e1e5Df3` |
| `LP_BUSINESS` | `0x70cFe52560Dc2DD981d2374bB6b01c2170E5597B` |
| `ECREDITSCORING` | `0xa448Aa6bfd5bA16BBd756cAF8E2cd68b31b51D88` |
| `REPUTATION_MANAGER` (all except ETH Sep) | `0x50b81F36a95E1363288Ef44aD7E48A8CaCDFa349` |
| `REPUTATION_MANAGER` (ETH Sepolia v3.19) | `0x28a9b3bA5ddf3D7542a2BCC00Bc7eC72363bEB8b` |
| `PERMIT2` | `0x000000000022D473030F116dDEE9F6B43aC78BA3` |

### Pool (ETH Sepolia — Primary Testnet)

| Contract | Address |
|----------|---------|
| `PASSPORT_GATED_HOOK` (v3.20) | `0xd3f980f48638783a8324ff99301028f08bda8a80` |
| `UNIVERSAL_ROUTER` | `0x3A9D48AB9751398BbFa63ad67599Bb04e4BdF98b` |
| USDC | `0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238` |
| ECOP | `0x19ac2612e560b2bbedf88660a2566ef53c0a15a1` |

### Active Chains (wagmi + Privy)

| Chain | Chain ID | Role |
|-------|----------|------|
| ETH Mainnet | 1 | Production (wagmi + Privy `defaultChain` when `mainnet` mode) |
| ETH Sepolia | 11155111 | **Primary testnet** — all contracts live, ZKPassport ✅, pool live |

> Contracts are also deployed on Base (8453), Unichain (130), Arbitrum (42161) via CREATE2. Those chains can be re-added to wagmi/Privy config when needed.

---

## Production Deployment (Vercel)

### Steps

1. Connect GitHub repo to Vercel
2. Framework preset: **Next.js**
3. Build command: `npm run build` (uses `--webpack` flag)
4. Output directory: `.next`
5. Set all environment variables (see section above)

### Critical Vercel Env Var Rules

- **No inline comments** — Vercel strips everything after `#` on the same line. `VALUE=abc # comment` → stored as `abc # comment`, breaking the value.
- **No trailing spaces** in any value.

### Production Env Vars (Vercel)

```
NEXT_PUBLIC_NETWORK_MODE=mainnet
NEXT_PUBLIC_PRIVY_APP_ID=...
NEXT_PUBLIC_PRIVY_CLIENT_ID=...
NEXT_PUBLIC_API_URL=https://convexo-api-production.up.railway.app
NEXT_PUBLIC_ALCHEMY_API_KEY=...
NEXT_PUBLIC_ALCHEMY_POLICY_ID_ETH=...       (ETH Mainnet Gas Manager)
NEXT_PUBLIC_ALCHEMY_POLICY_ID_SEPOLIA=...   (ETH Sepolia Gas Manager)
NEXT_PUBLIC_ETHEREUM_MAINNET_RPC_URL=...
NEXT_PUBLIC_ETHEREUM_SEPOLIA_RPC_URL=...
PINATA_JWT=...
PINATA_API_KEY=...
PINATA_SECRET_KEY=...
NEXT_PUBLIC_PINATA_GATEWAY=...
```

---

## Checklist Before Production

### Auth & Privy
- [ ] **Privy Dashboard** → App → **Allowed Domains** includes `protocol.convexo.xyz`
- [ ] `NEXT_PUBLIC_PRIVY_APP_ID` and `NEXT_PUBLIC_PRIVY_CLIENT_ID` set in Vercel (no hardcoded values in code)
- [ ] Gas Manager policy for ETH Mainnet allows `protocol.convexo.xyz` as origin
- [ ] `NEXT_PUBLIC_ALCHEMY_POLICY_ID_ETH` set for mainnet (no trailing comments or spaces)
- [ ] `NEXT_PUBLIC_ALCHEMY_POLICY_ID_SEPOLIA` set for testnet

### Network
- [ ] `NEXT_PUBLIC_NETWORK_MODE=mainnet` for production
- [ ] All RPC URLs for mainnet chains populated

### Contracts
- [ ] Contract addresses in `lib/contracts/addresses.ts` match on-chain deployments for target chains
- [ ] ABIs in `abis/` are synced from latest `convexo_contracts/out/` (`bash scripts/extract-abis.sh`)

### Wallet
- [ ] No `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` — WalletConnect is fully removed (embedded wallets only)
- [ ] No EOA connectors — only Privy embedded wallet (email / passkey / Google OAuth)
- [ ] `@account-kit/react` hooks NOT imported in any app component (`AlchemyAccountProvider` is gone)

### Pool & Swaps
- [ ] `useV4Quote` uses `extsload` path (Quoter is broken on ETH Sepolia — do not re-enable)
- [ ] Hook router allowed: `allowRouter(universalRouter)` called on deployed hook

### General
- [ ] `npm run build` passes with zero TypeScript errors
- [ ] No mock data anywhere — all pages wire to real backend or on-chain reads
- [ ] OTC orders page reads `data.items` (not flat array)
- [ ] Reputation sync sends `{ chainId: PRIMARY_CHAIN_ID }` in body
