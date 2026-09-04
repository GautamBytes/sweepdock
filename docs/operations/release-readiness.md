# Release readiness checklist

Updated 2026-09-05. This checklist separates local engineering evidence from work that still needs deployment, an owner's decision or real participants.

## Repository

- Remote `main`: `894dd7c`; GitHub Actions passed.
- Readiness fixes: isolated branch `fix/grant-readiness`.
- Fresh pinned dependency installation and baseline: 23 test files / 178 tests passed.
- README refreshed; contribution and security guidance added.
- License: owner decision pending. Do not describe the repository as licensed open source yet.
- Final local checks: typecheck, 180 unit tests, production build, standalone API check, ESLint and Prettier passed.
- Browser checks: 30 tests passed on a dedicated server at port 5183; one official TON Connect SDK no-funds fixture passed on port 5174. No physical wallet was used.
- Vercel local package: its actual function entry returned healthy read-only JSON; the packaged bundle passed outside the checkout.
- Production frontend build: stable manifest origin, embedded wallet URL and 180×180 icon verified.
- Local screenshots: ignored `output/playwright/demo-desktop.png` and `output/playwright/safety-desktop.png`; simulations only.
- Direct diff review performed. No independent reviewer or security audit is claimed.

## Hosting

The current public deployment is older than `main`, `/api/health` returns 500 and `/safety` returns 404. Logs identify an ESM packaging failure. Vercel has no GitHub link.

After reviewing the fixed branch and obtaining deployment approval:

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

The automated TON Connect fixture is complementary evidence, not a physical-device result.

## Remaining integration evidence

A [read-only quote sample](../testing/quote-economics-2026-09-05.md) records both accepted quotes and rejected/unavailable requests. This is local runtime evidence; repeat from the deployed app before calling the public quote flow verified.

The supported testnet/sandbox path remains unresolved. The existing support draft is unsent. Production signing, settlement verification, a reusable published kit, external review and physical-device results remain future work.
