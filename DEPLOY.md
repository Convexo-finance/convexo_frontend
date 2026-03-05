# Convexo Frontend — Deployment Guide

> Updated: 2026-03-04

---

## Prerequisites

| Tool | Version |
|------|---------|
| Node.js | 20+ |
| npm / pnpm | latest |

---

## Local Development

### 1. Install Dependencies

```bash
cd convexo_frontend
npm install
```

### 2. Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_ALCHEMY_API_KEY=your_alchemy_key
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_wc_project_id
NEXT_PUBLIC_CHAIN_ID=84532
```

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Backend API base URL |
| `NEXT_PUBLIC_ALCHEMY_API_KEY` | Alchemy API key (Account Kit + RPC) |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | WalletConnect Cloud project ID |
| `NEXT_PUBLIC_CHAIN_ID` | Target chain (84532 = Base Sepolia, 8453 = Base Mainnet) |

### 3. Start Dev Server

```bash
npm run dev
# → App at http://localhost:3000
```

> **Prerequisite:** The backend must be running at `NEXT_PUBLIC_API_URL` (default `http://localhost:3001`).  
> See `convexo-backend/DEPLOY.md` for backend setup.

---

## Verify Onboarding Flow

After both frontend and backend are running:

1. **New wallet sign-in** → should redirect to `/onboarding`
2. **Step 1:** Pick INDIVIDUAL or BUSINESS → calls `POST /onboarding/type`
3. **Step 2:** Fill profile form → calls `POST /onboarding/profile`
4. **Step 3:** See verification roadmap → link to `/digital-id`
5. **Returning user:** Refresh page → lands on dashboard (no redirect)

Key routes:

| Route | Description |
|-------|-------------|
| `/onboarding` | Standalone wizard (no `DashboardLayout`) |
| `/digital-id` | NFT credential cards filtered by `accountType` |
| `/profile` | Read-only identity section + editable contact |
| `/dashboard` | Main dashboard (requires onboarding complete) |

> **Note:** The onboarding page does NOT use `DashboardLayout` / `AuthGuard`.  
> This prevents redirect loops. It handles its own auth check internally.

---

## Smart Contract Addresses

All chains use deterministic deployment (same addresses):

| Contract | Address |
|----------|---------|
| CONVEXO_PASSPORT | `0x2AD6aA7652C5167881b60C5bEa8713A0F0520cDD` |
| LP_INDIVIDUALS | `0xF4aA32C029CfFa6050107E65FFF6e25AA2E58554` |
| LP_BUSINESS | `0x147070275646d9Cab76Ae26e5Eb632f5A6e8024C` |
| ECREDITSCORING | `0x20Be7F2D32Ddaa7c056CC6C39415275401cdF9E7` |
| REPUTATION_MANAGER | `0x64DA6680046F15909413bc93a822FEFB342F5861` |

### Supported Chains

| Chain | Chain ID |
|-------|----------|
| Unichain Mainnet | 130 |
| Base Mainnet | 8453 |
| Unichain Sepolia | 1301 |
| Base Sepolia | 84532 |
| Ethereum Sepolia | 11155111 |

---

## Production Deployment (Vercel)

1. Connect GitHub repo to Vercel
2. Set environment variables:
   ```
   NEXT_PUBLIC_API_URL=https://api.convexo.io
   NEXT_PUBLIC_ALCHEMY_API_KEY=...
   NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=...
   NEXT_PUBLIC_CHAIN_ID=8453
   ```
3. Framework preset: **Next.js**
4. Build command: `npm run build`
5. Output directory: `.next`

---

## Checklist Before Production

- [ ] `NEXT_PUBLIC_API_URL` points to production backend
- [ ] `NEXT_PUBLIC_CHAIN_ID` set to mainnet (8453)
- [ ] Alchemy API key active for production
- [ ] WalletConnect project ID configured
- [ ] Smart contract addresses verified on target chain
- [ ] Onboarding flow tested: new wallet → type selection → profile → digital-id
- [ ] Profile page shows read-only identity for Individual and Business
- [ ] Digital-id page filters NFT cards by accountType
- [ ] OTC, Treasury, Funding pages gated by tier
