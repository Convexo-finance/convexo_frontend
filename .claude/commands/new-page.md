Scaffold a new authenticated dashboard page.

Ask me for:
1. Section (e.g. `treasury`, `investments`, `digital-id`, `profile`)
2. Page name / slug (e.g. `my-feature`)
3. Required tier (0 = public within dashboard, 1 = Passport, 2 = LP, 3 = Vault Creator)
4. Business only? (yes/no)
5. One-line description of what the page does

Then create `app/(dashboard)/[section]/[name]/page.tsx` following these rules:
- `'use client'` at top
- Import `useAccount` from `@/lib/wagmi/compat` (not wagmi)
- Import `useNavigation` from `@/lib/contexts/NavigationContext` if tier or accountType gating is needed
- Add a wallet connection guard at the top (`if (!isConnected) return <NotConnected />`)
- Add account type guard if businessOnly or individualOnly
- Add tier guard if requiredTier > 0
- Match the dark UI style: `bg-[#0f1219]`, `text-white`, `text-gray-400`, `card` class for panels
- No mock data — wire to real API or on-chain reads from the start

Also add the route to the `navItems` array in `components/Sidebar.tsx` with the correct `requiredTier` and `businessOnly` flags.
