# SweepDock

Local-first TON wallet cleanup and reusable swap diagnostics.

## Development status

Implementation has started. This repository is on the Mac's internal SSD at `/Users/gautammanch/Developer/sweepdock`, outside Documents and iCloud Drive.

The labelled offline simulation, read-only mainnet preview, quote-derived USDT gas checks and read-only TON Connect adapter are implemented. Wallet connection needs this app's own hosted HTTPS manifest; the default local build leaves that button disabled until configured. A separate offline safety lab exercises testnet preflight checks, durable browser recovery and cross-tab duplicate prevention. Real signing and transaction building remain disabled. The earlier read-only build is deployed; this safety-lab batch is local only.

## Run locally

Use Node 24.19.0 and pnpm 11.24.0 (pinned in the repository).

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Open http://127.0.0.1:5173/demo for the offline simulation or http://127.0.0.1:5173/app for explicit mainnet reads. No API key, account, wallet connection or environment file is required. The only supported `VITE_APP_MODE` setting remains `mock`; another value blocks the application. `/demo` never contacts a blockchain or quote provider. `/app` contacts the local read-only API only after a user requests balances or a quote.

The local Hono API is attached to Vite's development server. `pnpm build` produces the static frontend and core declarations. Vercel separately packages the read-only handler in `api/[...path].ts`; hosting only the static frontend does not enable live reads. See [deployment notes](docs/operations/vercel.md). Do not expose this local development server publicly.

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
```

The browser suite covers sequential approvals, failure pauses, report download, USDT reference expiry, accessibility and viewport overflow. The separate wallet suite runs the actual SDK against a no-funds protocol fixture, not a real wallet. Browser screenshots stay in the ignored `output/playwright/` directory. CI is configured but has not run on a remote host.

## Structure

- `apps/web`: React/Vite interface and explicitly offline scenario runner.
- `apps/api`: local Hono read-only balance and quote endpoints, with no signing routes.
- `packages/core`: reusable domain rules, reviewed identity normalization and browser-safe response schemas. The main entry point has no network operations; TON primitives live in a separate assets entry point.
- `packages/omniston-adapter`: bounded, cancellable quote subscriptions using official SDK 0.8.9. No build/sign/track wrapper yet.
- `tests/e2e`: browser regression checks.
- `docs/specs` and `docs/plans`: approved design and original implementation plan.
- `docs/engineering/foundation-status.md`: completed scope, compatibility findings and remaining release gates.
- `docs/architecture/read-only-providers.md`: current provider contracts, real-read evidence and limitations.

No remote repository or package publication has been created. The earlier read-only app is deployed to Vercel; see the deployment notes for scope. License selection remains open; the kit is not yet a published open-source package.
