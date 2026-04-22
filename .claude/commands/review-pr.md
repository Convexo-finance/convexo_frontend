Review the current branch before opening a PR.

1. Run `git log main..HEAD --oneline` to see all commits on this branch.
2. Run `git diff main...HEAD --stat` to see changed files.
3. Run `npx tsc --noEmit` — must be zero errors.
4. Grep for: `console.log`, `TODO`, `FIXME`, `localhost`, `useWriteContract` (banned — use useConvexoWrite), `import { useAccount } from 'wagmi'` (banned — use compat layer).
5. Check that every new page under `app/(dashboard)/` has:
   - A wallet connection guard
   - Correct tier/accountType gating
   - No mock data
6. Check that any new contract calls use `useConvexoWrite` or `useSendUserOperation`, never `useWriteContract`.
7. Draft a PR title (under 70 chars) and body (summary + test plan).

Report findings, then ask if I want to open the PR.
