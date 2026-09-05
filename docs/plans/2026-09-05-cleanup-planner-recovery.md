# Cleanup planning and execution readiness

**Goal:** Implement the approved multi-token planner, revalidation, durable sequential recovery and outcome checks. Verify a no-money STON route before enabling a signer.
**Architecture:** Pure integer planner consumes validated balance/quote snapshots. React planner fetches bounded reviewed assets and invalidates on wallet/selection/target changes. Separate persistent simulation queue exercises review, wallet response, settlement correlation, pause and reload. Its records and reports remain explicitly simulated; no mainnet signer exists.
**Tech stack:** Existing TypeScript, React, Zod, IndexedDB, Vitest and Playwright.

## Constraints
- Mainnet remains read-only. No seeds, real transactions, new liquidity, or outreach.
- Current supported inputs STON/NOT/USDT. Choose TON or USDT output; skip same-token input.
- 10% cost ceiling calculated against minimum output; reserve 0.05 TON. Aggregate upfront gas cannot depend on unsettled proceeds or refunds.
- Snapshot lifetime 60 seconds; quote lifetime at most 30 seconds. Failed, mismatched, stale and incomplete data fail closed.
- Persist no live addresses/balances/quotes. Simulation storage separated from wallet SDK and existing one-attempt lab.
- No client fixture or normalized event is represented as verified chain evidence.

## Execution plan
- [x] Planner model and tests: deterministic selection and request binding, validated identity, fresh complete snapshots, explicit skip reasons, per-item costs and aggregate gas/reserve/output totals. Cover mismatch, duplicates, excessive costs, stale/future observations, USDT valuation and combined insufficiency.
- [x] Live planner UI: explicit token selection and common output; cancellable quote loading; independent per-item failures; review summary; manual refresh rereads balance before quotes and uses changed balances; invalidation and accessible/mobile layouts. Existing single-quote explorer remains.
- [x] Durable simulation session: bounded schema and replayed lifecycle; sequential claim before wallet response; immutable attempt identity; transactional revision checks across tabs; uncertain/rejected/partial pause; reload enters recovery without replaying approvals. Outcome matching requires matching attempt/query/message, wallet, token, amounts and terminal evidence.
- [x] Recovery UI and Doctor integration: separate simulation route, explicit phase controls, persisted timeline and redacted report, matching success/refund/partial fixtures, blocked duplicate submissions and unresolved reset. Clear final records explicitly.
- [ ] Environment preflight: repeat both independent public getters and seek official supported alternatives. Record evidence. Enable real transaction construction/signing/chain receipt ingestion only after a supported route is verified. No invented transaction payloads.
- [x] Verify: focused red/green unit tests, full check, browser tests including reload/cross-tab/stale cancellation/accessibility. Review diff and update grant/readiness docs with accurate implemented versus blocked scope. Create reviewable PR; keep release evidence honest.

## Current external dependency
2026-09-05 TonAPI testnet `get_router_version` for the documented router returns success:false, exit_code:9. A full live testnet route is not established; repeat Toncenter independently. Real provider integration remains blocked if no supported route can be verified. This does not block implementation/testing of the other features.

## Verified result

`pnpm check`: 207 unit tests, typecheck, production frontend/core/API builds, API artifact checks and lint/format passed. `E2E_PORT=5185 pnpm test:e2e`: all 64 browser checks passed. Desktop and mobile recovery views were visually inspected. Real testnet signing, provider trace verification and live-session persistence remain blocked by the unverified route; they are not represented as implemented.
