# Convexo Frontend — AI Context (CLAUDE.md)

Single source of truth for AI agents working on `convexo_frontend/`.
Read this before touching any file. Update it when you change architecture.

---

## Repository layout

```
convexo_frontend/
├── app/
│   ├── page.tsx            — Landing / sign-in (public, no auth)
│   ├── layout.tsx          — Root layout (providers)
│   ├── onboarding/         — 3-step account setup wizard (standalone, no DashboardLayout)
│   └── (dashboard)/        — Route group: ALL authenticated pages share DashboardLayout
│       ├── layout.tsx      — Provides DashboardLayout + AuthGuard for every child
│       ├── treasury/swaps/ — USDC↔ECOP swap (Uniswap V4, live)
│       ├── investments/vaults/ — Tokenized bond vaults (ERC-7540)
│       ├── digital-id/     — Identity + KYC/KYB/ZKPassport flows
│       ├── profile/        — Bank accounts, contacts, wallet
│       ├── funding/        — Business-only funding module (Tier 3)
│       └── admin/          — In-app admin view (legacy — full admin at convexo-admin/)
├── components/             — Shared UI (DashboardLayout, wallet/, ui/)
├── lib/
│   ├── api/client.ts       — apiFetch + JWT + silent refresh
│   ├── alchemy/config.ts   — Account Kit (MAv2, Gas Manager, connectors)
│   ├── config/             — network.ts, tokens.ts, pinata.ts
│   ├── contracts/
│   │   ├── addresses.ts    — All chain addresses (v3.18) + PERMIT2 constant
│   │   ├── abis.ts         — All contract ABIs
│   │   └── ecopAbi.ts      — ECOP token ABI
│   ├── hooks/
│   │   ├── useAuth.ts      — SIWE sign-in/out
│   │   ├── useWalletAccount.ts — Unified Account Kit + EOA
│   │   ├── useV4Swap.ts    — Full V4 swap (Permit2 → Universal Router)
│   │   ├── useV4Quote.ts   — Off-chain quote via V4 Quoter
│   │   ├── useContracts.ts — getContractsForChain(useChainId())
│   │   ├── useNFTBalance.ts
│   │   ├── useConvexoWrite.ts — UO for MAv2, raw tx for EOA
│   │   └── ...
│   ├── stubs/thread-stream.js — Empty stub for turbopack alias
│   └── wagmi/
│       ├── config.ts       — createConfig (read-only, all 8 chains)
│       └── compat.ts       — Overrides useAccount + useChainId
├── abis/                   — JSON ABIs (synced from convexo_contracts/out/)
├── next.config.js          — thread-stream alias for webpack + turbopack
├── SEQUENCES.md            — Mermaid diagrams for all 12 user flows
└── DEPLOY.md               — Local + Vercel deployment checklist
```

---

## Critical rules — read before editing anything

### 1. Always import wagmi hooks through the compat layer

```typescript
// ✅ Correct
import { useReadContract, useWriteContract, useAccount, useChainId } from '@/lib/wagmi/compat'

// ❌ Wrong — bypasses useWalletAccount bridge
import { useAccount } from 'wagmi'
```

`lib/wagmi/compat.ts` re-exports all of wagmi AND overrides `useAccount` → `useWalletAccount` and `useChainId` → `PRIMARY_CHAIN_ID`. The exception: `useWriteContract` can be imported from `'wagmi'` directly since compat re-exports it unchanged.

### 2. Always use webpack — never bare `next dev`

```bash
npm run dev        # ✅ aliases to next dev --webpack
npx next dev       # ❌ uses Turbopack, breaks thread-stream
npm run build      # ✅ aliases to next build --webpack
```

Turbopack can't handle non-JS files inside `node_modules/thread-stream`. The webpack config aliases `thread-stream → false`.

### 3. EOA signing — never use wagmi's `signMessage` or `getConnectorClient`

Both call `connector.getChainId()` internally. Account Kit wraps connectors in its internal wagmiConfig and those wrapped versions do NOT implement `getChainId`.

**Always use:** `connector.getProvider()` → `personal_sign` via EIP-1193 directly (see `useAuth.ts`).

### 4. Two wallet paths — both must work

1. `isSignerConnected && signer` → Alchemy signer: `signer.signMessage(message)` (30s timeout)
2. `eoaAddress && connector` → EOA: `connector.getProvider()` → `personal_sign` (60s timeout)

Backend verifies with viem `verifyMessage()` — handles EIP-191 prefix correctly.

### 5. No mock data

All data must come from the real backend API or on-chain reads. No hardcoded arrays, no localStorage stubs for business data.

---

## Contract addresses (v3.18)

See `lib/contracts/addresses.ts` for the full map. Key addresses:

**Deterministic (same on all chains via CREATE2 `convexo.v3.18`):**
- `CONVEXO_PASSPORT`: `0x648D128c117bC83aEAAd408ab69F0E5cb6291790`
- `LP_INDIVIDUALS`: `0xE244e4B2B37EA6f6453d3154da548e7f2e1e5Df3`
- `LP_BUSINESS`: `0x70cFe52560Dc2DD981d2374bB6b01c2170E5597B`
- `REPUTATION_MANAGER`: `0x50b81F36a95E1363288Ef44aD7E48A8CaCDFa349`

**ETH Sepolia (PRIMARY testnet — ZKPassport verifier deployed here):**
- `PASSPORT_GATED_HOOK`: `0xA4c7d0f1bb255460C7b3CBE9910318CB57Cb8A80` (redeployed 2026-04-11)
- `UNIVERSAL_ROUTER`: `0x3A9D48AB9751398BbFa63ad67599Bb04e4BdF98b` (allowed on hook ✅)
- `QUOTER`: `0x61b3f2011a92d183c7dbadbda940a7555ccf9227`
- USDC: `0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238`
- ECOP: `0x19ac2612e560b2bbedf88660a2566ef53c0a15a1`

**Base Sepolia (secondary testnet — no ZKPassport verifier, pool seeded):**
- `PASSPORT_GATED_HOOK`: `0xdCfF77e89904e9Bead3f456D04629Ca8Eb7e8a80`
- USDC: `0x036CbD53842c5426634e7929541eC2318f3dCF7e`
- ECOP: `0xb934dcb57fb0673b7bc0fca590c5508f1cde955d`

**All chains:** `PERMIT2 = 0x000000000022D473030F116dDEE9F6B43aC78BA3`

---

## Uniswap V4 swap architecture (v3.18)

Pool: USDC (currency0) / ECOP (currency1), fee=500, tickSpacing=10
Hook: `PassportGatedHook` — requires `hookData = abi.encode(userAddress)`

**Swap flow:**
1. `USDC.approve(Permit2, MaxUint256)` — one-time ERC-20 approval
2. `Permit2.approve(USDC, UniversalRouter, maxUint160, expiration)` — one-time
3. `UniversalRouter.execute(0x10, [v4SwapInput], deadline)` — actual swap

**hookData is mandatory** — PassportGatedHook decodes `abi.decode(hookData, (address))` as the real user. Without it, the call reverts with `UnauthorizedUser`.

**Admin prerequisite (done once):**
`hook.allowRouter(universalRouter)` — run `scripts/allow-router.sh` in `convexo_contracts/`.

**Hooks:**
- `useV4Quote` — calls `Quoter.quoteExactInputSingle` via `publicClient.simulateContract`, debounced 500ms
- `useV4Swap` — handles all 3 steps (approvals + swap), exposes `step: SwapStep` for UI

---

## Vault architecture (v3.18)

`TokenizedBondVault` is ERC-7540 async redemption:
- States: Pending → Funding → Funded → Active → Repaying → Completed / Defaulted
- Investor flow: `deposit(usdc, receiver)` → `requestRedeem(shares, controller, owner)` → `redeem(shares, receiver, controller)`
- Share economics: `getBaseSharePrice()` = principal / totalShares. `getExpectedFinalSharePrice()` includes interest.
- `getRedeemState(address)` → `{ originalLocked, remainingLocked, claimed, claimableNow }`

The vaults page (`app/investments/vaults/page.tsx`) fetches vault list from `GET /vaults` (backend), then reads on-chain state per vault via `useReadContract`. Deposit modal uses `writeContract` directly (not `useTokenizedBondVault` hook).

---

## Auth architecture

```
GET /auth/nonce?address=<wallet>
→ build EIP-4361 SIWE message
→ sign with wallet (Account Kit OR EOA via personal_sign)
→ POST /auth/verify { message, signature, address, chainId, authMethod }
→ store accessToken in localStorage('convexo_jwt')
→ auto-refresh via 401 interceptor in lib/api/client.ts
```

CORS is permissive (any origin) — access is controlled by JWT.

---

## NFT tier system

| Tier | Contract | Access |
|------|----------|--------|
| 1 | `Convexo_Passport` | Investments + Pool swaps |
| 2 | `LP_Individuals` / `LP_Business` | Treasury + OTC + Credit Score |
| 3 | `Ecreditscoring` | Vault creation + Funding |

`useNFTBalance()` reads all 4 contracts on-chain and exposes `hasPassportNFT`, `hasActivePassport`, `hasAnyLPNFT`, `hasEcreditscoringNFT`, `tier`.

---

## Network mode

`NEXT_PUBLIC_NETWORK_MODE=mainnet|testnet` (build-time)
- `mainnet` → `PRIMARY_CHAIN_ID = 8453` (Base)
- `testnet` → `PRIMARY_CHAIN_ID = 11155111` (ETH Sepolia — ZKPassport verifier deployed here)

ETH Sepolia is the primary testnet because ZKPassport verifier (`0x1D000001000EFD9a6371f4d90bB8920D5431c0D8`) is NOT deployed on Base Sepolia. The USDC/ECOP pool is also live on ETH Sepolia (2026-04-11).

`useChainId()` (overridden in compat.ts) always returns `PRIMARY_CHAIN_ID`.
All contract calls target the primary chain. Wallet page reads balances on all chains separately.

---

## ABIs

`abis/` directory contains JSON ABIs synced from `convexo_contracts/out/`.
To re-sync after contract changes:
```bash
bash convexo_contracts/scripts/extract-abis.sh
```

Current ABIs: ContractSigner, Convexo_Passport, Ecreditscoring, HookDeployer, Limited_Partners_Business, Limited_Partners_Individuals, PassportGatedHook, PoolRegistry, PriceFeedManager, ReputationManager, SumsubVerifier, TokenizedBondVault, VaultFactory, VeriffVerifier.

---

## Backend API

Base URL: `NEXT_PUBLIC_API_URL` (default: `http://localhost:3001`)
Auth: `Authorization: Bearer <jwt>` on all protected routes.
Client: `lib/api/client.ts` — `apiFetch<T>(path, options?)` + silent refresh on 401.

Key endpoints used by frontend:
- `POST /auth/nonce`, `POST /auth/verify`, `POST /auth/refresh`, `POST /auth/logout`
- `GET/PUT /profile`
- `GET/POST/PUT/DELETE /bank-accounts`
- `GET/POST/PUT/DELETE /contacts`
- `GET /rates/USDC-ECOP`
- `GET /vaults`
- `POST /verification/credit-score/submit`
- `GET /onboarding/status`

---

## Phase status (as of v3.18.2, 2026-04-11)

| Phase | Status | Notes |
|-------|--------|-------|
| Auth (SIWE + JWT) | ✅ Complete | Both Account Kit + EOA paths |
| Onboarding | ✅ Complete | 3-step wizard wired to backend. Fixed infinite-loop 2026-04-11. |
| ZKPassport (Tier 1) | ✅ Complete | 130 tests, trustless on-chain |
| Veriff KYC (Tier 2) | ✅ Complete | Webhook → backend → NFT |
| Sumsub KYB (Tier 2) | ✅ Complete | Webhook → backend → NFT |
| Credit Score (Tier 3) | ✅ Complete | n8n AI → backend → NFT |
| Profile page | ✅ Complete | GET/PUT /profile wired |
| Bank accounts | ✅ Complete | Full CRUD |
| Contacts | ✅ Complete | Full CRUD |
| Wallet (portfolio) | ✅ Complete | Alchemy Portfolio API |
| Vault investments | ✅ Complete | GET /vaults + on-chain USDC approve → deposit. `useReadContract` for live vault state. |
| Pool swaps | ✅ Complete | `useV4Swap` + `useV4Quote` wired. ETH Sepolia pool LIVE, router allowed ✅ |
| Funding module | ✅ Complete | e-loans + e-contracts wired to real API. Business + Tier 3 gated. |
| Tier gating (sidebar) | ✅ Complete | `requiredTier` + lock icons in Sidebar. Business-only items hidden for individual accounts. |
| Route groups | ✅ Complete | All dashboard pages under `app/(dashboard)/`. Shared layout. |
| Admin panel (in-app) | ✅ Complete | `/admin` — legacy, for convenience. Full admin at `convexo-admin/`. |
| Admin app (standalone) | ✅ Scaffolded | `convexo-admin/` — EOA SIWE, all tabs, deploy as `admin.convexo.xyz`. |
| ConvexoPoolHook (oracle band) | 🔜 Phase 2 contracts | Not deployed. Phase 1 hook has no price band. |
