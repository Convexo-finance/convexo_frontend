# Convexo Frontend — AI Context (CLAUDE.md)

Single source of truth for AI agents working on `convexo_frontend/`.
Read this before touching any file. Update it when you change architecture.

---

## Repository layout

```
convexo_frontend/
├── app/
│   ├── page.tsx            — Landing / sign-in (public, no auth)
│   ├── layout.tsx          — Root layout (WagmiProvider → QueryClient → PrivyProvider → MigrationProvider → AuthProvider → NavigationProvider)
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
│   ├── alchemy/config.ts   — DEAD CODE (alchemyConfig export unused — kept for reference only)
│   ├── config/             — network.ts, tokens.ts, pinata.ts
│   ├── contracts/
│   │   ├── addresses.ts    — All chain addresses (v3.18 deterministic / v3.19 ETH Sepolia) + PERMIT2
│   │   ├── abis.ts         — All contract ABIs
│   │   └── ecopAbi.ts      — ECOP token ABI
│   ├── contexts/
│   │   ├── AuthContext.tsx — AuthProvider + useAuth() (shared auth state — single source of truth)
│   │   └── NavigationContext.tsx — tier, onboardingStep, NFT status, access control
│   ├── privy/
│   │   ├── config.ts       — Privy app IDs, migrationAlchemyConfig, getViemChain(), getPolicyId()
│   │   └── usePrivySigner.ts — bridges Privy wallet → viem LocalAccount via toViemAccount()
│   ├── hooks/
│   │   ├── useAuth.ts      — re-exports useAuth from AuthContext (backward compat)
│   │   ├── useWalletAccount.ts — Privy usePrivy() + useWallets() bridge to wagmi-compatible shape
│   │   ├── useV4Swap.ts    — Full V4 swap (Permit2 → Universal Router)
│   │   ├── useV4Quote.ts   — Off-chain quote via V4 Quoter
│   │   ├── useContracts.ts — getContractsForChain(useChainId())
│   │   ├── useNFTBalance.ts — on-chain balanceOf reads for all 4 NFT contracts
│   │   ├── useNFTMetadata.ts — Alchemy getNFTsForOwner (correct chain + addresses)
│   │   ├── useConvexoWrite.ts — Gas-sponsored write via Privy signer + @alchemy/wallet-apis
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
// ✅ Correct — read-only hooks
import { useReadContract, useAccount, useChainId } from '@/lib/wagmi/compat'

// ✅ Correct — write hooks: always use useConvexoWrite (never useWriteContract)
import { useConvexoWrite } from '@/lib/hooks/useConvexoWrite'

// ❌ Wrong — bypasses useWalletAccount bridge
import { useAccount } from 'wagmi'

// ❌ Wrong — useWriteContract calls connector.getChainId() internally;
//            app-level wagmi has no connectors → runtime crash
import { useWriteContract } from 'wagmi'
import { useWriteContract } from '@/lib/wagmi/compat'
```

`lib/wagmi/compat.ts` re-exports wagmi AND overrides `useAccount` → `useWalletAccount` and `useChainId` → `PRIMARY_CHAIN_ID`. For writes, always use `useConvexoWrite` — it calls `createSmartWalletClient(...).sendCalls(...)` via `@alchemy/wallet-apis` using the Privy signer. For batched writes (approve + action in one tx), use `createSmartWalletClient` directly with an array of calls.

### 2. Always use webpack — never bare `next dev`

```bash
npm run dev        # ✅ aliases to next dev --webpack
npx next dev       # ❌ uses Turbopack, breaks thread-stream
npm run build      # ✅ aliases to next build --webpack
```

Turbopack can't handle non-JS files inside `node_modules/thread-stream`. The webpack config aliases `thread-stream → false`.

### 3. Signing — always use the Privy embedded wallet

Convexo uses embedded wallets only (email / passkey / Google OAuth via Privy). Never use wagmi's `signMessage`, `getConnectorClient`, or a raw `personal_sign` through the wagmi EIP-1193 path.

**Correct (SIWE):** `wallet.getEthereumProvider()` → `provider.request({ method: 'personal_sign', ... })` — Privy's embedded wallet handles EIP-191 prefix automatically. See `AuthContext.tsx`.

**Correct (contract writes):** `usePrivySigner()` → `createSmartWalletClient({ signer, ... })` → `client.sendCalls(...)` via `@alchemy/wallet-apis`. Gas stays sponsored by Alchemy Gas Manager. See `useConvexoWrite.ts`.

Backend verifies with viem `verifyMessage()`.

### 4. No mock data

All data must come from the real backend API or on-chain reads. No hardcoded arrays, no localStorage stubs for business data.

---

## Contract addresses (v3.18 deterministic | ETH Sepolia v3.19)

See `lib/contracts/addresses.ts` for the full map. Key addresses:

**Deterministic (same on all chains via CREATE2 `convexo.v3.18`):**
- `CONVEXO_PASSPORT`: `0x648D128c117bC83aEAAd408ab69F0E5cb6291790`
- `LP_INDIVIDUALS`: `0xE244e4B2B37EA6f6453d3154da548e7f2e1e5Df3`
- `LP_BUSINESS`: `0x70cFe52560Dc2DD981d2374bB6b01c2170E5597B`
- `REPUTATION_MANAGER`: `0x50b81F36a95E1363288Ef44aD7E48A8CaCDFa349`

**ETH Sepolia (PRIMARY testnet — ZKPassport verifier deployed here):**
- `PASSPORT_GATED_HOOK`: `0xd3f980f48638783a8324ff99301028f08bda8a80` (redeployed 2026-04-22, new pool seeded 6,250 USDC)
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

Pool: ECOP (currency0) / USDC (currency1) on ETH Sepolia (ECOP 0x19ac < USDC 0x1c7D), fee=500, tickSpacing=10
Currency ordering is determined dynamically by address comparison — never hardcode.
Hook: `PassportGatedHook` — requires `hookData = abi.encode(userAddress)`

**Swap flow (all steps batched into one UserOperation):**
1. Read ERC-20 allowance → include `USDC.approve(Permit2, MaxUint256)` call if needed
2. Read Permit2 allowance → include `Permit2.approve(USDC, UniversalRouter, maxUint160, expiry)` call if needed
3. Always include `UniversalRouter.execute(0x10, [v4SwapInput], deadline)` call
4. Send all needed calls as a single batched UO via `sendUserOperationAsync`

**hookData is mandatory** — PassportGatedHook decodes `abi.decode(hookData, (address))` as the real user. Without it, the call reverts with `UnauthorizedUser`.

**Admin prerequisite (done once):**
`hook.allowRouter(universalRouter)` — run `scripts/allow-router.sh` in `convexo_contracts/`.

**V4 Quoter note (known issue):** The official Uniswap V4 Quoter (`0x61b3f...`) returns `PoolNotInitialized` (0x6190b2b0) for this pool even though it IS initialized. Root cause: compatibility mismatch between Quoter and PoolManager version on ETH Sepolia. **Do NOT use the Quoter for price quotes on ETH Sepolia.** Instead use the extsload-based approach implemented in `useV4Quote.ts` — reads sqrtPriceX96 directly from PoolManager storage and computes output off-chain. One Quoter is deployed per chain by Uniswap; addresses are at developers.uniswap.org/contracts/v4/deployments.

**Hooks:**
- `useV4Quote` — reads sqrtPriceX96 via PoolManager.extsload (bypasses broken Quoter), computes spot price off-chain, debounced 500ms
- `useV4Swap` — checks allowances then sends batched UO; `SwapStep`: `idle` → `swapping` → `success`/`error`

---

## Vault architecture (v3.18)

`TokenizedBondVault` is ERC-7540 async redemption:
- States: Pending → Funding → Funded → Active → Repaying → Completed / Defaulted
- Investor flow: `deposit(usdc, receiver)` → `requestRedeem(shares, controller, owner)` → `redeem(shares, receiver, controller)`
- Share economics: `getBaseSharePrice()` = principal / totalShares. `getExpectedFinalSharePrice()` includes interest.
- `getRedeemState(address)` → `{ originalLocked, remainingLocked, claimed, claimableNow }`

The vaults page (`app/investments/vaults/page.tsx`) fetches vault list from `GET /vaults` (backend), then reads on-chain state per vault via `useReadContract`. Deposit modal batches `USDC.approve` + `vault.deposit` into a single `client.sendCalls([...])` call via `createSmartWalletClient` from `@alchemy/wallet-apis`.

---

## Auth architecture

Auth state is a **shared React Context** — `lib/contexts/AuthContext.tsx` exports `AuthProvider` and `useAuth()`. `AuthProvider` sits inside `MigrationProvider` (inside `PrivyProvider`) in `app/providers.tsx`, wrapping `NavigationProvider` and all children. Every component that calls `useAuth()` reads from the **same single instance**.

This was the fix for the stuck-spinner bug (v3.25): `useAuth` was a plain hook, so `NavigationContext`, `AuthGuard`, and `page.tsx` each had isolated state. After sign-in in `page.tsx`, the others never knew → `useOnboarding` was never enabled → `onboardingStep` stayed `null` forever → AuthGuard spinner never resolved (until refresh).

```
Privy login (email OTP / passkey / Google OAuth) → PrivyProvider sets authenticated=true, wallets[0] ready
→ AuthContext auto-fires signIn() via useEffect
→ GET /auth/nonce?address=<wallet>
→ build EIP-4361 SIWE message (viem/siwe)
→ wallet.getEthereumProvider().request({ method: 'personal_sign' })  ← Privy handles EIP-191
→ POST /auth/verify { message, signature, address, chainId }
→ store JWT in sessionStorage('convexo_jwt')   ← sessionStorage, NOT localStorage
→ AuthContext.setIsAuthenticated(true)          ← propagates to ALL consumers instantly
→ NavigationContext enables useOnboarding → GET /onboarding/status
→ page.tsx: router.replace('/profile')
→ AuthGuard at /profile: renders children (onboardingStep resolved)
→ auto-refresh via 401 interceptor in lib/api/client.ts
```

`lib/hooks/useAuth.ts` is a 4-line re-export from `AuthContext` — all existing imports keep working unchanged.

CORS is permissive (any origin) — access is controlled by JWT.

---

## NFT tier system

| Tier | Contract | Access |
|------|----------|--------|
| 1 | `Convexo_Passport` | Investments + Pool swaps |
| 2 | `LP_Individuals` / `LP_Business` | Treasury + OTC + Credit Score |
| 3 | `Ecreditscoring` | Vault creation + Funding |

`useNFTBalance()` reads all 4 contracts on-chain and exposes `hasPassportNFT`, `hasActivePassport`, `hasAnyLPNFT`, `hasEcreditscoringNFT`, `tier`.

`useNFTMetadata()` calls Alchemy `getNFTsForOwner` on the correct chain (`eth-sepolia` testnet / `base-mainnet` mainnet) using addresses from `getContractsForChain`. Returns `passport[]`, `lpIndividual[]`, `lpBusiness[]`, `creditScore[]` arrays with tokenId, name, imageUrl, and attributes. **Do NOT hardcode contract addresses here** — always derive from `getContractsForChain`.

`NFTDisplayCard` (in `components/`) uses `useNFTMetadata` to get tokenId + attributes. If Alchemy hasn't cached the IPFS metadata yet (common right after minting on testnet), it falls back to fetching the tokenURI IPFS JSON directly via Pinata gateway. Note: `Convexo_Passport` is **not** ERC721Enumerable — `tokenOfOwnerByIndex` does not exist in the ABI.

---

## Network mode

`NEXT_PUBLIC_NETWORK_MODE=mainnet|testnet` (build-time)
- `mainnet` → `PRIMARY_CHAIN_ID = 8453` (Base)
- `testnet` → `PRIMARY_CHAIN_ID = 11155111` (ETH Sepolia — ZKPassport verifier deployed here)

ETH Sepolia is the primary testnet because ZKPassport verifier (`0x1D000001000EFD9a6371f4d90bB8920D5431c0D8`) is NOT deployed on Base Sepolia. The USDC/ECOP pool is live on ETH Sepolia (reseeded 2026-04-22, hook v3.20, LP tokenId 26391, 6,250 USDC concentrated + 500 USDC full-range backstop).

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
- `GET/POST/PUT/DELETE /bank-accounts` + `POST /bank-accounts/:id/default`
- `GET/POST/PUT/DELETE /contacts`
- `GET /rates/:pair` (e.g. `USDC-ECOP`)
- `GET /vaults`
- `GET/POST /onboarding/type`, `GET/POST /onboarding/profile`, `GET /onboarding/status`
- `GET/POST /otc/orders` — OTC order history + creation (persisted from Next.js API route)
- `POST /verification/kyc/submit` — LP Individual: multipart form (governmentId, rutDocument?, proofOfAddress files)
- `POST /verification/kyb/submit` — LP Business: multipart form (company info + rep + shareholders JSON + 5 files)
- `GET /verification/credit-score/status`
- `POST /reputation/sync` — fire-and-forget warm on login

---

## Phase status (as of v3.25, 2026-04-27)

| Phase | Status | Notes |
|-------|--------|-------|
| Auth (SIWE + JWT) | ✅ Complete | **AuthContext** (shared React Context). sessionStorage JWT (tab-close logout). Sign-in stages: nonce/signing/verifying with animated UI. No stuck spinner. Privy as signer (v3.26). |
| Privy migration | ✅ Complete | `@account-kit/react` auth layer replaced with `@privy-io/react-auth` + `MigrationProvider`. Alchemy stays as transaction layer (`@alchemy/wallet-apis`). Existing users migrated via `@privy-io/alchemy-migration`. |
| Onboarding | ✅ Complete | 3-step wizard wired to backend. Business form pre-fills KYB from onboarding profile data. |
| ZKPassport (Tier 1) | ✅ Complete | Trustless onchain. Proof staleness (UTC day boundary) detected + handled. |
| KYC — LP Individuals (Tier 2) | ✅ Complete | Inline form: gov ID + RUT + proof of address → `POST /verification/kyc/submit` (manual review) |
| KYB — LP Business (Tier 2) | ✅ Complete | Inline form: company info + address + rep + shareholders + 5 doc uploads → `POST /verification/kyb/submit` |
| Credit Score (Tier 3) | ✅ Complete | n8n AI → backend → NFT |
| NFT display | ✅ Complete | `useNFTMetadata` (Alchemy getNFTsForOwner, correct chain+addresses) + `NFTDisplayCard` IPFS fallback |
| Profile page | ✅ Complete | GET/PUT /profile wired |
| Bank accounts | ✅ Complete | Full CRUD |
| Contacts | ✅ Complete | Full CRUD |
| Wallet (portfolio) | ✅ Complete | Alchemy Portfolio API |
| Vault investments | ✅ Complete | GET /vaults + batched UO (approve + deposit). `useReadContract` for live vault state. |
| Pool swaps | ✅ Complete | `useV4Swap` (batched UO: approve(s) + swap) + `useV4Quote`. ETH Sepolia pool LIVE ✅. Swap history via Alchemy getAssetTransfers. |
| OTC trading | ✅ Complete | Wizard flow (buy/sell + bank accounts). Order history tab → `GET /otc/orders`. Notifications via Telegram + email. |
| Funding module | ✅ Complete | e-loans + e-contracts wired to real API. Business + Tier 3 gated. |
| Tier gating (sidebar) | ✅ Complete | `requiredTier` + lock icons in Sidebar. Business-only items hidden for individual accounts. |
| Route groups | ✅ Complete | All dashboard pages under `app/(dashboard)/`. Shared layout. |
| Admin panel (in-app) | ✅ Complete | `/admin` — legacy, for convenience. Full admin at `convexo-admin/`. |
| Admin app (standalone) | ✅ Scaffolded | `convexo-admin/` — EOA SIWE, all tabs, deploy as `admin.convexo.xyz`. |
| ConvexoPoolHook (oracle band) | 🔜 Phase 2 contracts | Not deployed. Phase 1 hook has no price band. |

---

## Frontend rules (mandatory — apply to every feature change)

### 1. V4 pool key — always derive currency ordering dynamically
Never hardcode which token is `currency0`/`currency1`. On ETH Sepolia ECOP < USDC by address, so ECOP is currency0.
The wrong ordering sends the swap to a non-existent pool (silent revert).

```typescript
const ecopIsC0 = contracts.ECOP.toLowerCase() < contracts.USDC.toLowerCase();
const currency0 = (ecopIsC0 ? contracts.ECOP : contracts.USDC) as `0x${string}`;
const currency1 = (ecopIsC0 ? contracts.USDC : contracts.ECOP) as `0x${string}`;
// zeroForOne = true means selling currency0
const zeroForOne = ecopIsC0 ? fromSymbol === 'ECOP' : fromSymbol === 'USDC';
```

### 2. Writes — always use UserOperation batching, never split approve + action
`@alchemy/wallet-apis` batches approve + swap into a single `sendCalls` call. No approval cooldown window, no double-click risk.
See `useV4Swap.ts` — reads allowances first, adds approve calls only if needed, then appends the swap call, sends all as one `sendUserOperationAsync`.

### 3. Token decimal handling
USDC = 6 decimals, ECOP = 18 decimals. Always use `parseUnits(amount, token.decimals)`.
Never pass a raw number where a bigint is expected.

### 4. pollingInterval is set to 3000ms
Set in `lib/wagmi/config.ts`. Keeps balance/read hooks fast. Do not remove it.

### 5. No mock data anywhere
Every data source must be a real backend API call or on-chain read. No hardcoded arrays, no localStorage stubs for business data.

### 6. OG image metadata — use absolute URL
Any `<meta property="og:image">` must use the full `https://protocol.convexo.xyz/...` URL, not a relative path. Relative paths break social unfurling.

### 7. Vercel env var format — no inline comments
Vercel strips everything after `#` on the same line. `NEXT_PUBLIC_X=value  # comment` becomes `value  # comment` — breaks the value. Always use bare values.

### 8. ZKPassport proofs expire at UTC midnight — detect staleness before minting
The ZKPassport proof commits to today's UTC calendar date (YYYYMMDD). The onchain helper converts `block.timestamp` to the same YYYYMMDD format for comparison. If the user generated the proof on a previous UTC day and tries to mint the next day, the contract reverts with `PassportExpired()` — even if their physical passport is valid.

Always stamp `proofDateUTC: new Date().toISOString().slice(0, 10)` on the proof and check it before simulation:

```typescript
const todayUTC = new Date().toISOString().slice(0, 10);
if (passportTraits.proofDateUTC !== todayUTC) {
  // stale proof — reset to idle so user re-verifies
}
```

Also: when decoding simulation errors, use `simErr?.message` not `simErr?.name`. The `.name` field is always the viem error class (`"ContractFunctionExecutionError"`), not the Solidity error name.
