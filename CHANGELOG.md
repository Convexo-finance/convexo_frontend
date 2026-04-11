# Convexo Frontend — Changelog

Format: version → what changed → status.

---

## v3.18.2 — 2026-04-11 (route groups + admin app + onboarding fix)

### Route groups restructure
- All dashboard pages moved into `app/(dashboard)/` route group
- Shared `app/(dashboard)/layout.tsx` provides `DashboardLayout` for every child page
- `DashboardLayout` import removed from all 26 pages (no duplication)
- URLs unchanged — route groups have zero impact on routing
- `onboarding/` stays at root level (uses standalone layout, no sidebar)

### Onboarding infinite-loop fix
- `AuthGuard`: removed `hasRedirected.current` ref that was blocking recovery after first redirect
- `app/onboarding/page.tsx`: added `refetchAll()` calls after each step submission to keep `NavigationContext` in sync with backend state

### Funding module stats fix
- `funding/page.tsx`: replaced `useVaultCount()` (global factory count) with real user data from `GET /funding/requests`
- "Your Vaults" now shows VAULT_CREATED request count
- "Total Raised" now shows sum of approved vault amounts
- "Active Contracts" now shows APPROVED + VAULT_CREATED count

### Admin app scaffold (`convexo-admin/`)
- Separate Next.js app in the monorepo, intended for `admin.convexo.xyz`
- EOA-only SIWE auth (MetaMask → `personal_sign` → backend JWT stored as `convexo_admin_jwt`)
- No Account Kit, no smart accounts
- All admin components ported from `convexo_frontend/components/admin/` with corrected imports
- New `FundingManagement` component wired to `GET/PUT /admin/funding/requests`
- Sidebar navigation with 8 tabs: Dashboard, Users, Verifications, NFT Management, Vaults, Funding, Treasuries, Contracts
- Runs on port 3002 (`npm run dev`)

---

## v3.18.1 — 2026-04-10 (V4 swap wired)

### Uniswap V4 swap integration

**New hooks:**
- `lib/hooks/useV4Swap.ts` — full swap flow: ERC-20 approve → Permit2 approve → Universal Router execute
  - Handles 3-step approval chain automatically (ERC-20 → Permit2 → swap)
  - `hookData = abi.encode(userAddress)` passed on every swap (required by PassportGatedHook)
  - 5% slippage tolerance by default
  - Step state exposed: `idle | approving-usdc | approving-permit2 | swapping | success | error`
- `lib/hooks/useV4Quote.ts` — off-chain quote via V4 Quoter
  - `publicClient.simulateContract` on `quoteExactInputSingle`
  - 500ms debounce
  - Returns `amountOut` as bigint, handles `deltaAmounts` sign convention
- `lib/hooks/useContracts.ts` — simple wrapper: `getContractsForChain(useChainId())`

**Updated `lib/contracts/addresses.ts`:**
- Fixed typo on line 1
- Fixed Base Sepolia `PASSPORT_GATED_HOOK`: `0x6aCd36...` → `0xdCfF77e89904e9Bead3f456D04629Ca8Eb7e8a80`
- Added `UNIVERSAL_ROUTER`, `POSITION_MANAGER`, `QUOTER` for all 8 chains (from `docs/uniswapv4/Univ4_deployments.md`)
- Added `PERMIT2 = 0x000000000022D473030F116dDEE9F6B43aC78BA3` as exported constant
- Added `UNIVERSAL_ROUTER` + `POSITION_MANAGER` + `QUOTER` fields to `ChainContracts` interface

**Updated `app/treasury/swaps/page.tsx`:**
- Replaced static rate calculation with live `useV4Quote` on-chain quote
- Wired Swap button to `useV4Swap` with multi-step status indicators
- Removed mock TVL/APY pool info (replaced with real pool parameters)
- Direction toggle now resets form

**Updated `lib/contracts/abis.ts`:** Version comment updated to 3.18.

**Admin action pending:**
Run `convexo_contracts/scripts/allow-router.sh` to allowlist Universal Router on PassportGatedHook.
Without this, swaps revert with `RouterNotAllowed`.

---

## v3.18 — 2026-03 (Phase 5 complete — all core modules wired)

### All mocks and localStorage stubs removed

**Auth:**
- SIWE + JWT auth fully wired (both Account Kit embedded signer + external EOA)
- Silent refresh on 401 via interceptor in `lib/api/client.ts`
- EIP-7702 delegation automatic — no activation step needed

**Profile:**
- `GET/PUT /profile` wired — Individual + Business profile forms
- `GET/POST/PUT/DELETE /bank-accounts` wired
- `GET/POST/PUT/DELETE /contacts` wired
- All `localStorage` profile/bank/contact stubs removed

**Onboarding:**
- 3-step wizard (`/onboarding`) wired to `POST /onboarding/type`, `POST /onboarding/profile`
- `AuthGuard` reads `onboardingStep` from JWT user payload

**Identity (Digital-ID):**
- ZKPassport flow (`/digital-id/humanity/verify`) — `claimPassport()` + Pinata IPFS upload
- Veriff KYC (`/digital-id/limited-partner-individuals`) — polling `GET /verification/kyc/status`
- Sumsub KYB (`/digital-id/limited-partner-business`) — polling `GET /verification/kyb/status`
- AI Credit Score (`/digital-id/credit-score/verify`) — 3 PDFs + 9 numeric fields → `POST /verification/credit-score/submit`

**Investments:**
- Vault list: `GET /vaults` → on-chain state reads per vault
- Deposit modal: approve USDC → `deposit(amount, receiver)` on-chain
- `useTokenizedBondVault` hook — comprehensive read/write hooks for all vault states

**Wallet:**
- `usePortfolioBalances` — Alchemy Portfolio API replaces 7 separate balance calls
- `useNFTMetadata` — real IPFS images from Alchemy NFT API
- `useSendToken` — unified ETH + ERC-20 transfer with chain switching
- QR scanner (`BarcodeDetector` API), receive QR, send modal all complete

**Rates:**
- `GET /rates/USDC-ECOP` rate display in swaps page

**Infrastructure:**
- `lib/wagmi/compat.ts` — overrides `useAccount` + `useChainId`
- `useConvexoWrite` — automatically uses UserOperation (MAv2) for Account Kit, raw tx for EOA
- `NEXT_PUBLIC_NETWORK_MODE` — build-time mainnet/testnet switching
- All 8 chains configured in `lib/contracts/addresses.ts`
- Framer Motion page transitions in `DashboardLayout`

---

## v3.17 — 2025-12 (ZKPassport + identity overhaul)

- ZKPassport integration upgraded to trustless on-chain verification (`claimPassport`)
  - No admin mint path — proof verified on-chain by `IZKPassportVerifier`
  - Proof binds `msg.sender` + `chainId` — anti-replay
  - Age ≥ 18, sanctions, nationality, expiry, sybil resistance all enforced on-chain
- NFT tier system restructured: None / Passport / LimitedPartner / VaultCreator
- Account Kit upgraded to v4 (MAv2, EIP-7702)
- `useWalletAccount` bridge for unified Account Kit + EOA address
- WalletConnect v2 integration
- Alchemy Gas Manager wired (Base + Ethereum mainnet policies)

---

## v3.11 — 2025

- Arbitrum chain support added (42161, 421614)
- Multi-chain portfolio view
- Basic onboarding wizard
- Initial Veriff + Sumsub KYC/KYB flows

---

## v3.0 — 2025

- Initial Next.js 14 App Router setup
- Account Kit v3 (smart account)
- Basic identity contracts integration
- Base + Unichain testnets

---

## Pending

### Phase 7 — Funding module frontend
- `app/funding/` pages wired to backend funding module
- Business-only (Tier 3): funding requests, e-contracts, e-loans

### Phase 8 — Reputation cache sync
- On-chain tier changes reflected in UI without manual refresh
- Backend event listener → frontend cache invalidation

### Phase 9 — Admin panel
- `app/admin/` — user management, vault management, rate overrides

### Phase 2 contracts — ConvexoPoolHook
- Oracle price band for USDC/ECOP pool
- Frontend pool status display, keeper rebalance indicator
- Wires to `ManualPriceAggregator.setPrice()` via backend keeper
