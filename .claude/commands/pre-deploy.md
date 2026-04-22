Run the pre-deployment checklist for Convexo Frontend.

Check each item and report pass/fail:

**Code quality**
- [ ] `npx tsc --noEmit` — zero TypeScript errors
- [ ] No `console.log` left in production paths (grep for it, exclude node_modules and .next)
- [ ] No hardcoded `localhost` or testnet addresses in non-testnet code paths

**Environment**
- [ ] `NEXT_PUBLIC_NETWORK_MODE` is set to the correct value (`mainnet` or `testnet`)
- [ ] `NEXT_PUBLIC_API_URL` points to the deployed backend, not localhost
- [ ] `NEXT_PUBLIC_ALCHEMY_API_KEY` and `NEXT_PUBLIC_ALCHEMY_POLICY_ID` are set
- [ ] OG image meta tags use absolute `https://` URLs (not relative paths)
- [ ] No inline comments in `.env` values (Vercel strips everything after `#`)

**Contracts**
- [ ] Contract addresses in `lib/contracts/addresses.ts` match the target network
- [ ] ABIs in `abis/` are in sync with deployed contracts

**Routes**
- [ ] All dashboard pages are under `app/(dashboard)/`
- [ ] No broken links to deleted routes (check for old `/digital-id/humanity/verify` style paths)

Report a summary table: ✅ passed / ❌ failed / ⚠️ needs manual check.
