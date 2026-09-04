# Wallet connection and USDT cost checks

Approved scope: the user's request to implement next steps 1–2 from the roadmap, with investigation of no-money testing. Work stays in `/Users/gautammanch/Developer/sweepdock` on `feat/wallet-cost-checks`; no deployment, signing, spending or new contracts.

## Execution checklist

- [x] Verify baseline: 117 tests passed at `8395fee`.
- [x] Check current TON Connect package and STON.fi testnet documentation.
- [x] Add failing valuation tests in `apps/web/src/features/live/economics.test.ts` and API orchestration tests in `apps/api/test/quote-preview.test.ts`.
- [x] Add an optional `gasValuation` snapshot to the shared quote schema. For USDT output only, request a second read-only quote selling the expected USDT output for TON. Use its minimum TON output as a conservative reference value, not a guaranteed exchange rate. Compute gas in USDT with integer ceiling division. Reject stale, mismatched, missing or zero reference data; never perform the reference swap.
- [x] Add `apps/api/src/quote-preview.ts`: primary quote, optional reference read, combined 20-second budget, cancellation and no retry. A failed valuation leaves the primary quote visible with unavailable costs. A stale primary quote is not returned as fresh.
- [x] Add tests for mainnet wallet state, testnet rejection, disconnect/account-change invalidation and opt-in SDK loading. Add a lazy wallet adapter under `apps/web/src/features/wallet/` using the official picker and memory-only session storage. No transaction or signing methods are exposed by the application adapter.
- [x] Keep address lookup available without wallet setup. A configured public HTTPS manifest is required for connection; no borrowed manifest, invented public origin or automatic tunnel. Add manifest preparation instructions for the eventual approved origin.
- [x] Keep the existing typography and teal/neutral layout. Add a compact wallet panel and USDT gas estimate, with plain source/freshness notes rather than changing the overall design.
- [x] Test existing simulation isolation and new UI at mobile/desktop sizes; run `pnpm check` and `pnpm test:e2e`.
- [x] Record what no-money tests prove and what remains unverified in `docs/testing/no-money-testing.md`. TON testnet coins exist, but testnet DEX pools require setup; Omniston sandbox is not assumed to be free testnet liquidity.
- [x] Review and save the verified batch locally. No push or deployment.

## Verification record

2026-09-04: `pnpm check` passed (140 tests, typecheck, build and lint); `pnpm test:e2e` passed all 17 tests; `pnpm test:wallet` passed its actual-SDK synthetic-wallet test. Manual source review performed; no independent reviewer was available. The new unsupported-first-offer fixture initially failed typecheck and was corrected with explicit union narrowing before the passing full run.

Live primary and reference quotes individually returned supported STON.fi routes during development. Combined reads also encountered unsupported DeDust reference offers, which remain rejected. After stream filtering was added, the final live request returned `PROVIDER_UNAVAILABLE`; a successful combined live valuation is not claimed. Fixtures verify the conditional valuation path. Public-manifest hosting, real wallet approval and on-chain testnet swaps remain unverified and outside this batch.

## Acceptance

USDT previews show a quote-derived gas estimate only while both quotes are fresh. Native upfront TON plus reserve remains a separate check. Unknown valuation never becomes zero cost. Account/network/disconnect changes clear earlier balances, requests and quote review. Demo mode does not initialize a wallet SDK or call live providers. A real wallet connection is not claimed until the user approves hosting its manifest and completes a wallet-owned approval.
