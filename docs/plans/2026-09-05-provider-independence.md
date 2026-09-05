# Provider-independent cleanup

**Goal:** Keep STON.fi/Omniston as the first integration while making cleanup policy, previews and API orchestration usable with another reviewed provider.
**Architecture:** Core defines normalized data and typed balance/quote ports. A required `ReadPolicy` binds accepted source IDs and approved protocols. Concrete SDKs, credentials and endpoints are wired only in API composition; the browser shares deployment policy and provider labels, never SDK imports. A synthetic replacement runs through the same API, valuation and planner in tests. No second live provider is claimed or enabled.

- [x] Introduce bounded provider IDs, generic reverse-quote provenance and required explicit source/protocol policy. Preserve network, amount, freshness, gas, reserve and cancellation checks.
- [x] Inject `BalanceProvider` and `QuoteProvider` into the API. Move default TonAPI/Omniston wiring and secrets to composition. Validate source, wallet/request and protocol at server and browser boundaries.
- [x] Remove the planner's hard-coded STON allowlist; require deployment policy. Derive visible source labels from configuration. Test alternative providers and reject spoofed/mixed sources, unapproved protocols, changed amounts, stale/malformed responses and missing valuations. Preserve existing default-adapter tests.
- [x] Document the replacement procedure and honest limits: swapping providers still requires an adapter, reviewed routes and tests; no automatic provider failover or additional live execution support.
- [x] Grant work deferred at the user’s explicit request. The form was inspected only; no fields were filled and nothing was submitted. Finish project engineering and report back before later UI work.
- [x] Verify full checks, browser flows and captured-state contract tests, and review changes. Deliver through the existing PR; grant submission is outside the current scope.


## Validation — 2026-09-05

- `pnpm check`: 224 unit tests and five offline preflight tests passed, together with typecheck, production builds, standalone API artifact checks, lint and formatting.
- `E2E_PORT=5185 pnpm test:e2e`: all 64 browser tests passed.
- `pnpm test:contracts`: all seven captured-state TVM tests passed.
- The freshly built API returned HTTP 200 for real read-only 10 STON → TON and 10 STON → USDT previews through Omniston, with STON.fi V1/V2 routes respectively. The USDT preview included the new reverse-quote provider provenance. These are point-in-time connectivity checks, not execution evidence.
- No grant fields were filled, application submitted or public-network transaction sent. Website visual redesign is deferred to the user's later UI work.
