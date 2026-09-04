# SweepDock

Local-first TON wallet cleanup and reusable swap diagnostics.

## Development status

Implementation has started. This repository is on the Mac's internal SSD at `/Users/gautammanch/Developer/sweepdock`, outside Documents and iCloud Drive.

The first milestone is an offline, clearly labelled simulation plus tested domain logic. Live wallet connections, transactions, deployments and grant submissions are not enabled.

## Run locally

Use Node 24.19.0 and pnpm 11.24.0 (pinned in the repository).

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Open http://127.0.0.1:5173/demo. No API key, account, wallet or environment file is required. The only supported mode is `mock`; another `VITE_APP_MODE` value blocks the application. No request to a blockchain or quote service is made.

## What works now

- Select illustrative balances, review costs and skip an uneconomical token.
- Approve each simulated swap separately; unknown, partial and rejected outcomes pause the queue.
- Inspect the event timeline in Swap Doctor and download an allowlisted local JSON report.
- Responsive desktop/phone layouts and semantic keyboard controls.
- Shared TypeScript core: exact amounts, fee/reserve policy, guarded lifecycle and report projection.

All values are fixtures, not market prices. Events are synthetic, not settlement evidence. State lives in memory and clears on refresh or when starting a new simulation. The scenario reset is not permission to resend an actual transaction.

## Checks

```sh
pnpm check
pnpm exec playwright install chromium
pnpm test:e2e
```

The browser suite covers sequential approvals, failure pauses, report download, a favicon regression, accessibility and viewport overflow at 360, 390, 768, 1024 and 1440 pixels. Browser screenshots stay in the ignored `output/playwright/` directory. CI is configured but has not run on a remote host.

## Structure

- `apps/web`: React/Vite interface and explicitly offline scenario runner.
- `packages/core`: reusable domain rules, with no wallet or network dependencies.
- `tests/e2e`: browser regression checks.
- `docs/specs` and `docs/plans`: approved design and original implementation plan.
- `docs/engineering/foundation-status.md`: completed scope, compatibility findings and remaining release gates.

No remote repository, package publication or deployment has been created. License selection remains open; the kit is not yet a published open-source package.
