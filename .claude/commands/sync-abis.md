Sync ABIs from the Convexo contracts repo into this frontend.

1. Run `bash ../convexo_contracts/scripts/extract-abis.sh` from the monorepo root.
2. Check `lib/contracts/abis.ts` — if any contracts in `abis/` have new or removed functions, update the exports there.
3. Run `npx tsc --noEmit` to verify nothing broke after the sync.
4. Report which ABIs changed and whether any TypeScript errors need fixing.
