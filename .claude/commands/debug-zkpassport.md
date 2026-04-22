Debug a ZKPassport / Convexo Passport mint failure.

Systematically check each of these known failure modes in order:

**1. Proof staleness (most common)**
Check if `passportTraits.proofDateUTC` matches today's UTC date (`new Date().toISOString().slice(0,10)`).
If not, the proof was generated on a previous UTC day — contract reverts with `PassportExpired()`.
Fix: clear traits and return to idle so user re-scans.

**2. Error decoding**
Confirm simulation error is read from `simErr?.message`, NOT `simErr?.name`.
`simErr.name` is always `"ContractFunctionExecutionError"` (viem class) — never the Solidity error.

**3. devMode flag**
On testnet (`NEXT_PUBLIC_NETWORK_MODE=testnet`), `devMode=true` skips the on-chain expiry check.
On mainnet, `devMode=false` — physical passport must not be expired AND proof must be from today UTC.

**4. hookData**
`hookData` must be `abi.encode(['address'], [userAddress])` — PassportGatedHook decodes it as the real user.
Missing or wrong hookData → `UnauthorizedUser` revert.

**5. UniversalRouter allowance on hook**
Run `hook.allowedRouters(universalRouter)` — must return true.
If false, run `scripts/allow-router.sh` from `convexo_contracts/`.

**6. Currency ordering**
Pool key must have ECOP as currency0 (lower address on ETH Sepolia).
Always derive dynamically: `ecopIsC0 = contracts.ECOP.toLowerCase() < contracts.USDC.toLowerCase()`.

Show me the error message or revert reason and I will identify which step failed.
