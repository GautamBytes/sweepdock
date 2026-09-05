# Contract execution and testnet diagnostics

**Goal:** Resolve the unexplained router failure and keep the approved execution work moving with real, offline TVM tests.
**Architecture:** A public-read-only preflight inspects both router and pool library references and checks two providers. A separate Node test suite runs the official STON SDK against captured public contract state in `@ton/sandbox`, using a disposable local Wallet V4 and hash-checked libraries. Neither module is imported into the website or API.
**Scope:** This implements executable diagnostics and local contract integration evidence. It does not enable public testnet signing, authenticate public-chain receipts, or turn the browser simulation journal into a live journal.

- [x] Add pinned development dependencies and a read-only capture command. Contract bytecode stays in ignored local output, with provider provenance; no third-party bytecode is redistributed in the repository.
- [x] Write tests for missing and mismatched library code; reproduce exit 9 and require the exact library hash to restore local getters.
- [x] Execute signed TON/token round trips; assert recipient/master/query/message linkage, actual balance delivery, full refunds on an impossible minimum, expiry rejection and duplicate external-message rejection after restoring state.
- [x] Add `pnpm check:testnet` with bounded public reads, current timestamps, explicit missing dependency results, no transaction endpoints and no automatic mainnet fallback. A healthy library check must not claim full route readiness.
- [x] Add offline preflight tests to `pnpm check`; run the captured-state contract suite separately with no network; run full checks, review the diff, update the existing PR and document the remaining external repair.

## Confirmed diagnosis

Both Toncenter and TonAPI resolve the pTON library on testnet but cannot resolve the router library. Toncenter also cannot resolve the pool library. Exact hashes resolve on mainnet. The local VM reproduces `failed to load library cell` (exit 9); mounting the same-hash code locally makes router version and pool getters work. Read-only state was sampled independently, not as an atomic historical block snapshot. The local chain uses sandbox configuration, not a proof of public testnet consensus or finality.

## Verification

`pnpm check` passed: 207 existing unit tests, five offline preflight tests, typecheck, frontend/core/API builds, API artifact check and lint/format. `pnpm test:contracts` passed all seven real TVM checks. `pnpm check:testnet` exited 2, confirming the two unavailable libraries without a mainnet fallback. Public signing, provider-authenticated settlement and live browser recovery remain unimplemented; this work establishes the precise infrastructure blocker and real local contract integration evidence.
