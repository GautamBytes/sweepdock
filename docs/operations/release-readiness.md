# Release readiness checklist

## Cleanup planner and recovery feature branch — 5 September 2026

The new branch passes `pnpm check` with 207 unit tests and all 64 browser checks. It adds the live multi-token planner and a durable, explicit three-token simulation at `/safety/cleanup`. Production transaction construction, signing, real trace ingestion and live execution recovery remain unimplemented. Both fresh public testnet version getters returned exit code 9; [evidence](../testing/testnet-preflight-2026-09-05.json) and [feature boundaries](../testing/cleanup-planner-recovery.md) describe the remaining dependency. A PR or preview is not a production release.

## Earlier release checkpoint

The release observations below describe the earlier PR #2/#3 checkpoint. Later UI releases and this feature branch have their own verification; the old test counts are historical.

Updated 2026-09-05. This checklist separates local engineering evidence from work that still needs deployment, an owner's decision or real participants.

## Repository

- Application release: `0cc0e05`, merged to `main` through PR #2 after both GitHub Actions checks passed.
- Readiness fixes are merged; this checklist records the deployed application revision.
- Fresh pinned dependency installation and baseline: 23 test files / 178 tests passed.
- README refreshed; contribution and security guidance added.
- License: MIT, selected by the owner on 2026-09-05; root license and package metadata added.
- Final local checks: typecheck, 180 unit tests, production build, standalone API check, ESLint and Prettier passed.
- Browser checks: 30 tests passed on a dedicated server at port 5183; one official TON Connect SDK no-funds fixture passed on port 5174. No physical wallet was used.
- Vercel local package: its actual function entry returned healthy read-only JSON; the packaged bundle passed outside the checkout.
- Production frontend build: stable manifest origin, embedded wallet URL and 180×180 icon verified.
- Local screenshots: ignored `output/playwright/demo-desktop.png` and `output/playwright/safety-desktop.png`; simulations only.
- Direct diff review performed. No independent reviewer or security audit is claimed.

## Hosting

The repaired read-only build is live at [sweepdock.vercel.app](https://sweepdock.vercel.app). All page routes, health/config, real provider reads, canonical manifest, icon and configured security headers passed hosted checks. Production safety-lab reload recovery also passed. See [release evidence](release-verification-2026-09-05.json). Vercel releases remain manual.

For future releases, repeat this procedure with the new revision:

1. Deploy a preview to the existing SweepDock Vercel project. Do not deploy a local build containing synthetic verification hostnames.
2. Verify `/`, `/demo`, `/app`, `/doctor`, `/developers`, `/safety` and `/safety/doctor`, including direct navigation and reload.
3. Check `/api/health` returns `{"mode":"read-only","signingEnabled":false}`; `/api/config` is read-only. API responses must use `Cache-Control: no-store` and reject cross-origin reads.
4. Verify real balance and quote requests from `/app`; record failures and provider limitations.
5. Check manifest and 180×180 icon are public and CORS-readable; their hostname must match the intended app identity. Check `nosniff`, `no-referrer`, frame protection and HTTPS headers.
6. After approval, deploy/promote a production build using the stable public origin, then repeat hosted checks. A successful preview does not verify the production manifest.
7. Decide separately whether to link GitHub for automatic deployments. It is not required for a deliberate manual release.

## Physical phone test — not yet performed

The owner operates their own wallet. Connecting shares a public account; it does not authorize signing. No funds or seed phrase are needed for this test.

1. Open the final public `/app` on a phone. Record date, phone OS/version, browser and wallet/version.
2. Tap Connect; verify the wallet identifies SweepDock at the intended public origin and requests a connection only. Cancel any unexpected transaction request.
3. Approve connection and return to the same browser page. Confirm the account is displayed and the UI remains read-only.
4. Explicitly request balances. Confirm old results clear on account/network changes or disconnect.
5. Disconnect, reconnect and test returning after briefly switching apps. Record any browser/Telegram difference without generalizing to untested devices.
6. Record pass/fail and a redacted screenshot. Do not publish a wallet address or account history without consent.

The automated TON Connect fixture is complementary evidence, not a physical-device result. The preview picker rendered, with third-party directory/bridge errors recorded in the deployment notes. The owner has been asked to perform the real-phone test; no result is recorded yet.

## Remaining integration evidence

A [read-only quote sample](../testing/quote-economics-2026-09-05.md) records both accepted quotes and rejected/unavailable requests. Additional production balance and quote requests succeeded; their results are recorded in the release evidence. Neither sample proves reliable availability across every asset or amount.

The supported testnet/sandbox path remains unresolved. The existing support draft is unsent. Production signing, settlement verification, a reusable published kit, external review and physical-device results remain future work.

## Testnet library diagnosis and local contract execution — 5 September 2026

The documented router and pool both reference unavailable public testnet code libraries. The failure is reproduced locally as `failed to load library cell` (exit 9). Hash-matched code restores execution inside the local VM. See [contract evidence](../testing/contract-execution.md). Five dependency/hash tests now run in `pnpm check` alongside the 207 existing unit tests. Seven additional captured-state TVM tests pass for real signatures, swaps, delivery, refunds, expiry, tampering and replay after serialized-state restoration. These tests are local, not public-chain or physical-wallet validation. No production signer or live journal has been added.
