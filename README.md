# SweepDock

Website: https://sweepdock.online

Local-first TON wallet cleanup and reusable swap diagnostics.

## Development status

SweepDock has a [public repository](https://github.com/GautamBytes/sweepdock). The offline cleanup simulation, real read-only mainnet quotes, fee checks, read-only TON Connect adapter and offline safety/recovery lab are merged into `main`. Signing and transaction construction remain disabled.

Current release, verification links and unfinished manual gates are recorded in [current release status](docs/operations/current-release.md). Earlier dated deployment files remain historical observations, not evidence for later commits.

Wallet connection requires a public HTTPS manifest. Local builds leave Connect disabled unless explicitly configured. The safety lab is a simulation, not a testnet swap or proof of settlement.

## Cleanup planner and saved recovery

The new `/app` planner selects reviewed tokens, rereads balances before quoting, shows individual skip reasons, and checks the total upfront gas budget plus the 0.05 TON reserve. Quotes expire locally and changing the selection or wallet discards the review. Only included tokens contribute to totals; the plan cannot sign or send.

`/safety/cleanup` exercises a saved three-token simulation with atomic approval claims, sequential progression, timeout/reload recovery, matching synthetic receipts and a persisted Doctor report at `/safety/cleanup/doctor`. No live wallet data or connection keys are persisted. The original quick `/demo` remains in memory.

Real testnet construction/signing, chain receipt ingestion, and live-session recovery are **not implemented**. Both independent testnet getters still returned exit code 9 on 5 September; [fresh evidence](docs/testing/testnet-preflight-2026-09-05.json) and [feature boundaries](docs/testing/cleanup-planner-recovery.md) distinguish implemented behavior from that external dependency. A normalized receipt matcher is not a blockchain verifier.

## Website documentation

The website includes a Docs section at `/docs`, with the product intention, approach and trade-offs, wallet-user instructions, developer setup, safety/privacy boundaries and implementation status. Documentation links appear on the landing page and in the workspace navigation. These pages describe implemented behaviour and label future work; they do not establish grant approval or live execution readiness.

## Run locally

Use Node 24.19.0 and pnpm 11.24.0 (pinned in the repository).

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Open http://127.0.0.1:5173/demo for the offline simulation or http://127.0.0.1:5173/app for explicit mainnet reads. No API key, account, wallet connection or environment file is required. The only supported `VITE_APP_MODE` setting remains `mock`; another value blocks the application. `/demo` never contacts a blockchain or quote provider. `/app` contacts the local read-only API only after a user requests balances or a quote.

The local Hono API is attached to Vite's development server. `pnpm build` produces the static frontend and core declarations. The build also bundles the server into `apps/api/dist/handler.mjs`; Vercel packages it through `api/[...path].js`; hosting only the static frontend does not enable live reads. See [deployment notes](docs/operations/vercel.md). Do not expose this local development server publicly.

Open http://127.0.0.1:5173/safety for the new offline safety lab. Start a simulated attempt, refresh, then inspect its preserved unknown state in Swap Doctor. The lab never connects a wallet or calls a provider. Unlike `/demo`, its single sample attempt stays in IndexedDB until the user clears a finished sample. See [safety and recovery testing](docs/testing/safety-recovery.md).

If the public TonAPI quota is insufficient, supply your own `TONAPI_KEY` in a root `.env.local` file. This is optional, server-only, and ignored by Git. Do not prefix it with `VITE_`. No paid plan or key has been created.

## What works now

- Select illustrative balances, review costs and skip an uneconomical token.
- Approve each simulated swap separately; unknown, partial and rejected outcomes pause the queue.
- Inspect the event timeline in Swap Doctor and download an allowlisted local JSON report.
- Responsive desktop/phone layouts and semantic keyboard controls.
- Shared TypeScript core: exact amounts, fee/reserve policy, guarded lifecycle and report projection.
- Read real mainnet balances with exact native int64 amounts, bounded pagination and reviewed contract identity checks for STON, NOT and USDT.
- Preview real Omniston STON.fi V1/V2 swap quotes into TON or USDT. No transaction is constructed or signed.
- Show net output, minimum output, already-included protocol fees, upfront TON gas budget and estimated consumed gas separately.
- Screen TON-output previews against a 10% gas-cost ceiling and a 0.05 TON reserve; reject incomplete or stale balance snapshots for affordability checks.
- Value gas in USDT using a fresh, size-bound reverse quote, with integer rounding and fail-closed reference checks.
- Connect a mainnet public account through the official wallet picker when a hosted manifest is configured; clear old reads on wallet changes or disconnect. No signer is exposed.

Values and events on `/demo` and `/safety` are fixtures, not market prices or settlement evidence. `/app` uses real provider reads; its quotes are previews, not executable offers. The SDK has no guaranteed quote-expiry field, so previews become locally stale after at most 30 seconds. USDT cost checks require a supported, fresh reference quote; if unavailable, the app does not clear the quote for cleanup. `/demo` and `/app` state lives in memory and clears on refresh; `/safety` has an isolated simulation journal. The scenario reset is not permission to resend an actual transaction.

Wallet setup and valuation details: [architecture notes](docs/architecture/wallet-and-usdt-costs.md). No-money testing, including TON testnet limitations: [testing guide](docs/testing/no-money-testing.md).

## Checks

```sh
pnpm check
pnpm exec playwright install chromium
pnpm test:e2e
pnpm test:wallet
pnpm example:core
# Separate public-read integration check:
pnpm verify:contracts
```

The browser suite covers sequential approvals, failure pauses, report download, USDT reference expiry, accessibility and viewport overflow. The separate wallet suite runs the actual SDK against a no-funds protocol fixture, not a real wallet. Browser screenshots stay in the ignored `output/playwright/` directory. Per-PR CI runs the full check, browser suite, official wallet protocol fixture, and a packed core consumer outside the monorepo. Public contract capture/execution runs in a separate manually dispatched workflow because it depends on external read services. `pnpm check` includes a plain-Node test of the standalone API bundle outside the repository.

## Structure

- `apps/web`: React/Vite interface and explicitly offline scenario runner.
- `apps/api`: local Hono read-only balance and quote endpoints, with no signing routes.
- `packages/core`: reusable domain rules, reviewed identity normalization and browser-safe response schemas. The main entry point has no network operations; TON primitives live in a separate assets entry point.
- `packages/omniston-adapter`: bounded, cancellable quote subscriptions using official SDK 0.8.9. No build/sign/track wrapper yet.
- `tests/e2e`: browser regression checks.
- `docs/specs`: product design. Historical implementation checkpoints describe their own dates; they are not current deployment evidence.
- `docs/engineering/foundation-status.md`: completed scope, compatibility findings and remaining release gates.
- `docs/architecture/read-only-providers.md`: current provider contracts, real-read evidence and limitations.

No npm package has been published. Source code is available under the [MIT License](LICENSE). Third-party dependencies retain their own licenses. See [contributing](CONTRIBUTING.md), [security](SECURITY.md), and the [release checklist](docs/operations/release-readiness.md).

### Contract execution checks

`pnpm check:testnet` diagnoses public testnet contract dependencies without a wallet. The documented router and pool currently reference unavailable testnet libraries. `pnpm capture:contracts` explicitly captures public state and hash-matched code for local emulation; `pnpm test:contracts` then tests real signed swaps, actual delivery, refunds, expiry and replay without network access. This is separate from public execution and the browser simulation journal. See [evidence, commands and limits](docs/testing/contract-execution.md).

### Provider independence

The cleanup planner and API orchestration use explicit balance/quote interfaces and a deployment-owned source/route policy. TonAPI and Omniston remain the only configured live integrations; synthetic replacement tests prove the core can consume another reviewed adapter. This does not add live execution or automatic failover. See [provider boundaries and replacement steps](docs/architecture/provider-independence.md).

### Standalone consumer and review evidence

Run `pnpm example:core` to build and consume a private local tarball in plain Node with strict NodeNext type checks. See the [consumer example](examples/core-consumer/README.md), [security self-review](docs/security/readiness-review.md), [physical-device checklist](docs/testing/physical-device.md), and [participant study](docs/validation/participant-study.md). Device and participant results remain pending until actual observations are recorded.
