# SweepDock

Local-first TON wallet cleanup and reusable swap diagnostics.

## Development status

Implementation has started. This repository is on the Mac's internal SSD at `/Users/gautammanch/Developer/sweepdock`, outside Documents and iCloud Drive.

The first two implementation batches are available: the labelled offline simulation and a separate read-only mainnet preview. Live wallet connections, signing, transaction building, deployments and grant submissions are not enabled.

## Run locally

Use Node 24.19.0 and pnpm 11.24.0 (pinned in the repository).

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Open http://127.0.0.1:5173/demo for the offline simulation or http://127.0.0.1:5173/app for explicit mainnet reads. No API key, account, wallet connection or environment file is required. The only supported `VITE_APP_MODE` setting remains `mock`; another value blocks the application. `/demo` never contacts a blockchain or quote provider. `/app` contacts the local read-only API only after a user requests balances or a quote.

The local Hono API is attached to Vite's development server. `pnpm build` produces the static frontend and core declarations, not a deployed API service. Hosting the frontend by itself will not enable live reads. Server packaging/deployment is a later task; do not expose this local development server publicly.

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

Values and events on `/demo` are fixtures, not market prices or settlement evidence. `/app` uses real provider reads; its quotes are previews, not executable offers. The SDK has no guaranteed quote-expiry field, so previews become locally stale after at most 30 seconds. USDT-output quotes show gas but are not cleared by the cost policy because this version has no trustworthy TON-to-USDT cost valuation. State lives in memory and clears on refresh. The scenario reset is not permission to resend an actual transaction.

## Checks

```sh
pnpm check
pnpm exec playwright install chromium
pnpm test:e2e
```

The browser suite covers sequential approvals, failure pauses, report download, a favicon regression, accessibility and viewport overflow at 360, 390, 768, 1024 and 1440 pixels. Browser screenshots stay in the ignored `output/playwright/` directory. CI is configured but has not run on a remote host.

## Structure

- `apps/web`: React/Vite interface and explicitly offline scenario runner.
- `apps/api`: local Hono read-only balance and quote endpoints, with no signing routes.
- `packages/core`: reusable domain rules, reviewed identity normalization and browser-safe response schemas. The main entry point has no network operations; TON primitives live in a separate assets entry point.
- `packages/omniston-adapter`: bounded, cancellable quote subscriptions using official SDK 0.8.9. No build/sign/track wrapper yet.
- `tests/e2e`: browser regression checks.
- `docs/specs` and `docs/plans`: approved design and original implementation plan.
- `docs/engineering/foundation-status.md`: completed scope, compatibility findings and remaining release gates.
- `docs/architecture/read-only-providers.md`: current provider contracts, real-read evidence and limitations.

No remote repository, package publication or deployment has been created. License selection remains open; the kit is not yet a published open-source package.
