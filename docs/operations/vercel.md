# SweepDock on Vercel

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
