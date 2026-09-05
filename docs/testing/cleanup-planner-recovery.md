# Cleanup planner and recovery readiness

Updated 5 September 2026. This document describes the feature branch, not proof of a production release.

## Implemented

- `/app`: select reviewed STON/NOT/USDT, choose TON or USDT, reread a complete fresh wallet snapshot, then fetch quotes sequentially. Address/selection/target changes cancel obsolete work. Changed balances change quote input amounts. Failures remain per-token with no synthetic fallback.
- Pure integer plan: bind quote input/target/amount; check reviewed contract identity, bounded freshness, minimum output, gas data and the existing USDT reference valuation. Compare gas against 10% of minimum output. Sum eligible-token upfront budgets plus 0.05 TON, excluding unsettled proceeds and expected refunds. Group insufficiency blocks a favorable group verdict even when individual items fit.
- `/safety/cleanup`: three explicit synthetic tokens; claim each approval atomically before accepting a simulated wallet response. Only a matching completed fixture unlocks the next token. Rejected, refunded and partial outcomes pause the queue.
- Isolated IndexedDB simulation database: strict schema, lifecycle replay, immutable identities, revision checks in a single read/write transaction, fail-closed writes, no memory fallback. Reload turns in-flight attempts uncertain, never resubmits, and never clears unresolved attempts. Completed records and reports survive reload.
- `/safety/cleanup/doctor`: persisted simulation timeline and allowlisted report with relative time and anonymous item labels. No addresses, message hashes, query IDs or provider payloads are exported.
- `classifySettlement`: correlation of bounded normalized observations against environment, testnet chain, attempt, wallet, router, assets, input amount, minimum output, query and message identities. A complete successful observation distinguishes completion, partial delivery and full refund. This does **not** authenticate data, inspect a real chain trace, or verify token-wallet ownership.

The current wallet adapter remains read-only. No signer, transaction endpoint, signing feature flag, or fake live receipt button was added. Fixture helpers are explicitly simulation-only.

## External execution gate — not complete

The documented testnet router `kQALh-JBBIKK7gr0o4AVf9JZnEsFndqO0qTCyT-D-yBsWk0v` returned exit code 9 from `get_router_version` through both Toncenter and TonAPI on 5 September 2026. [Machine-readable observations](testnet-preflight-2026-09-05.json) include time and Toncenter block identity. This does not prove all STON testnet routes unavailable.

A supported no-money router/pool/liquidity combination or a documented equivalent sandbox still needs verification. Once established, remaining implementation includes a separate-origin testnet transaction builder, network-bound official wallet signing adapter, real trace ingestion with independent contract/message/recipient/token/amount checks, and a live journal distinct from fixtures. Then owner-operated phone approval and actual settlement E2E can be tested. No contacts were messaged, contracts deployed, tokens minted, liquidity provisioned or transactions sent.

## Verification

Run `pnpm check` and `E2E_PORT=5185 pnpm test:e2e`. New unit coverage includes combined budget failures, stale/future quotes and balances, mismatches, identity spoofing, sequential claims, recovery, full refunds, partial outcomes and malformed receipts. Browser coverage exercises the rendered plan, cancellation, refresh, changed balances, late wallet response, three-item completion, cross-tab conflicts, storage failure, quote expiry, redacted reports and 360/1440px accessibility.

These tests validate the application with mocked provider responses and explicit offline fixtures. They do not establish real testnet execution or physical-device QA.
