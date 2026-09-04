# SweepDock on Vercel

## Current audit — 2026-09-05

Remote `main` is `894dd7c`; GitHub Actions passed. The public alias still points at the first deployment below. The Vercel project has no Git repository link (`link: null`), so merging a PR currently does not deploy it.

The public `/api/health` returns 500 (`FUNCTION_INVOCATION_FAILED`) and `/safety` returns 404. Vercel logs show `ERR_MODULE_NOT_FOUND` for `/var/task/apps/api/src/index`: the packager preserved an extensionless ESM import. A local Vercel build reproduced the same failure in plain Node. Workspace package exports also target TypeScript source, so merely changing the first import extension would not establish a standalone runtime.

The repair branch bundles the existing read-only handler and dependencies with pinned esbuild into `apps/api/dist/handler.mjs`, imported by `api/[...path].js`. `pnpm check` loads that bundle outside the checkout and checks health/config, cross-origin rejection, invalid input and disabled signing. The Vercel install command uses version-pinned `npx` instead of replacing a global pnpm launcher.

Production manifests use `VERCEL_PROJECT_PRODUCTION_URL`; previews use `VERCEL_URL`. Both are validated Vercel hostnames. Missing production identity blocks the build. Local builds remain unconfigured. Verify the emitted production URL equals the actual public alias before deploying; never use a synthetic local-build hostname for a public deployment.

These fixes need a new deployment and hosted verification. No deployment, GitHub link change, signing, transaction or real-phone test is implied by the local build. Follow the [release checklist](release-readiness.md).

## Historical first deployment — 2026-09-04

The following is a dated record of the first deployment, not current readiness evidence.

Created in the user's existing Hobby scope on 2026-09-04. No domain purchase, paid service, GitHub repository or Git push was made.

- Project: `sweepdock`, ID `prj_z2mcP8cQWzy5xeZQOt2TuxGPjHh0`.
- Scope: `manchandanigautam-gmailcoms-projects`.
- Alias: `https://sweepdock.vercel.app`.
- First deployment: `dpl_4ySGNzVf9ZtSGn4aKNx6UrJ9uAfF`.
- Deployment URL: `https://sweepdock-ptlnlqvro-manchandanigautam-gmailcoms-projects.vercel.app`.
- Vercel returned `READY`. Although the CLI was invoked with `--target preview`, Vercel assigned this first deployment to production. No existing project was replaced.

## Build and routes

Node 24, pinned pnpm 11.24.0, frozen lockfile. The root `vercel.json` builds `apps/web/dist`. The Node Web Standard handler at `api/[...path].ts` runs the existing Hono read API. Explicit SPA rewrites cover `/app`, `/demo`, `/doctor` and `/developers`.

On Vercel builds only, a validated `VERCEL_URL` emits `tonconnect-manifest.json` and configures the wallet picker against that exact deployment. A 180×180 PNG converted from the existing favicon is bundled. Local builds retain their explicit manifest requirement. The manifest and icon have public CORS headers; API routes retain same-origin and no-store checks.

The upload excludes environment files, recordings, test outputs, tests and planning documents. `.vercel/` and `.env.local` are ignored. `vercel link` generated a local OIDC environment file; its contents were not inspected or uploaded. No TonAPI key was configured on Vercel. Additional CLI-generated environment ignore rules are retained.

## Limits and verification

`pnpm check` passed: 146 tests, typecheck, production build and lint. A local Vercel-style build verified the emitted manifest and PNG dimensions. Vercel's cloud build completed successfully and reported `READY`. Hosted API behavior and real-wallet connection have not yet been exercised.

At deployment, Vercel Authentication was enabled with `all_except_custom_domains`. The user was asked about removing that gate for SweepDock only and delegated the choice; public visitor access was selected for the demo and wallet manifest. Account security, other projects and source-file visibility are not changed.

This is the current simulation and mainnet read-only build, not a testnet swap implementation. No signer, testnet pool provisioning or verified settlement path was added. The API's rate/concurrency counters are per warm function instance, not a distributed global quota. Public beta use needs further operational and security review. No mainnet transaction is enabled.
