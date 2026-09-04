# Foundation checkpoint — 2026-09-04

## Storage and branch

Project root: `/Users/gautammanch/Developer/sweepdock`.

Verified a normal directory on the internal APFS solid-state Data volume, outside Documents, Desktop and iCloud Drive. Approximately 91 GiB was free at initialization. No external SSD was mounted. Source, dependencies, builds and project QA artifacts are local; no iCloud project directory was created. Original plan documents were copied, not moved or deleted.

Branch: `feat/foundation`, a new local repository with no remote.

## Scope of this checkpoint

This is the first implementation batch, not completion of the three-month plan. Scaffold and initial amount/cost/lifecycle logic are implemented, plus a thin offline cleanup-to-diagnostics flow so the domain rules can be exercised through the UI. The provider adapter, persistence and transaction verification are not implemented. Do not present the simulation as a live STON.fi integration or a grant-ready product.

The mock runner intentionally does not mimic Omniston's wire format. It drives the real core transition and policy functions using named local scenarios. Production adapters must generate events only after appropriate evidence validation.

## Feasibility research: important API change

The live official Node.js SDK documentation retrieved on September 4 describes **v1beta8**. Older cached examples and early plan sketches are not implementation contracts.

Source: https://docs.ston.fi/developer-section/omniston/sdk/nodejs.md

- Documented main endpoint: `wss://omni-ws.ston.fi`; sandbox: `wss://omni-ws-sandbox.ston.fi`.
- Input/output assets use the nested TON chain/jetton tagged structure; quote amount uses `inputUnits`.
- `settlementParams` is an array with a `params` swap branch. Slippage is expressed in **PIPS**, not basis points: `10_000` PIPS is 1% in the current examples.
- Quote streams use discriminated events such as `ack`, `quoteUpdated`, `noQuote` and `unsubscribed`. Branch handling must match installed TypeScript declarations.
- The documented build call is `tonBuildSwap`, with source transfer/refund, excess-gas and destination addresses.
- Tracking is `swapTrack` with quote ID, trader address and outgoing transaction query. Transaction hash, message hash and BOC are different evidence types.
- Order/HTLC examples are outside SweepDock's initial swap scope.

Registry metadata found `@ston-fi/omniston-sdk` 0.8.9 and `@tonconnect/ui-react` 3.0.2. Neither is installed yet. Verify the chosen SDK's declarations and read-only quote behavior before committing an adapter; docs alone do not prove package compatibility, liquidity or fee economics.

Additional primary references:

- https://docs.ton.org/applications/ton-connect/how-to/message-lookup
- https://docs.tonapi.io/tonapi/rest-api/accounts
- https://core.telegram.org/bots/blockchain-guidelines
- https://vite.dev/guide/

## Gates still open

1. Validate user demand through the planned interviews. No outreach has happened.
2. Run read-only quote experiments, establish reviewed jetton master addresses and verify fees on supported routes. Sample symbols in the demo are not a security allowlist.
3. Build the read-only provider boundary with runtime schemas, request limits, timeout/cancellation and conservative fail-closed behavior.
4. Integrate current Omniston quotes and TON Connect. Requote and revalidate immediately before each approval; never reuse the fixed scenario quotes for real swaps.
5. Verify receipt amount/token/recipient and bounced/refunded/partial outcomes independently. A returned wallet BOC is not completion.
6. Add bounded persistent local sessions, deduplication, cross-tab locks and reconciliation after refresh. Current session memory and event IDs are simulation-scoped only.
7. Add TON output, real reserve accounting across a session, live fee breakdown and privacy-tested production reports. Current comparison uses synthetic USDT equivalents.
8. Add Telegram integration and test the actual wallet return flow on physical devices. Mobile responsive web QA is not Telegram certification.
9. Obtain a bounded, explicit user authorization for any mainnet spend; run independent security review and a small pilot before release.

## Verification and review

Core and component tests were written and observed failing before their initial implementations. Browser checks exercise the actual interface rather than mocked React components. A missing favicon was reproduced and fixed with a regression test. Manual review also found a parse/format size-limit inconsistency; its failing boundary test preceded the correction.

The review covered numeric precision, state transitions, cost thresholds, simulation labeling, no automatic retry, report fields, local-only network behavior, dependency pins and responsive screenshots. No independent reviewer/subagent was available; this is a self-review, not a security audit.

The original plan's live feasibility task is **not complete**. This batch intentionally advances the isolated offline foundation while those external gates remain open. No claims of production safety, live successful swaps, grant selection likelihood or measured user traction are supported yet.

## Dependency decisions

Pinned Node 24.19.0, pnpm 11.24.0, React 19.2.8, Vite 8.2.2 and TypeScript 6.0.3. TypeScript 6 was selected for compatibility with the installed ESLint tooling. A 24-hour package minimum age is enforced; older compatible ESLint/lucide versions and an override for `@eslint/plugin-kit` 0.7.2 avoid bypassing that policy. The lockfile is checked in; no broad dependency upgrades were applied elsewhere on the machine.
