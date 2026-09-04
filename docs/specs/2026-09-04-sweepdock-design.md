# SweepDock — Product and Technical Design

Date: 2026-09-04

Status: Proposed design for review. The combined product concept is approved; this name, stack and detailed scope are proposals. No implementation, repository creation, publishing, account setup, wallet connection or grant submission is authorized by this document.

## 1. Product in one sentence

SweepDock is a mobile-friendly website and Telegram Mini App that helps people convert selected, unwanted TON token balances, with an open-source toolkit that explains and tests the same swap workflow.

This is a new project, independent of PayOps, Solana and the Tether application.

## 2. Name and positioning

- Working product name: **SweepDock**.
- Consumer feature: **Wallet Cleanup**.
- Open-source package: **SweepDock Kit**.
- Developer screen: **Swap Doctor**.
- Tagline: **Clean up your TON wallet. Understand every swap.**
- Proposed repository slug: `sweepdock`.
- Proposed package namespace: `@sweepdock`; this is not registered or confirmed available.
- Domain, Telegram handle, npm namespace and trademark clearance must be checked before public branding. No availability or legal clearance is claimed.
- Alternative working names: **BalanceDock** (broader, less explicit about cleanup) and **TidyJet** (shorter, less obvious to non-crypto users).
- Do not imply endorsement by STON.fi or use its logo as our product identity.

Plain-language description:

> SweepDock lets people select supported tokens they no longer want, check the costs, and convert them into TON or USDT. Every swap shows a clear result. The same software is available to developers as an open-source toolkit for building and troubleshooting swap integrations.

Avoid claims such as “recover lost funds,” “remove every scam token,” “zero-risk,” “guaranteed savings,” “one signature for everything,” or “cheapest route guaranteed.”

## 3. Users and the problem to validate

### Primary user

A TON wallet owner with several unwanted but still economically meaningful token balances. This is not primarily a tool for microscopic dust: fees may exceed the value of very small balances.

### Secondary user

A developer adding swaps to a website or Telegram Mini App who needs predictable lifecycle handling, reproducible failure cases and a usable integration example.

### Validation before committing to a full build

1. Interview at least five prospective wallet users; confirm how they currently sell unwanted balances and where they get stuck.
2. Interview at least three TON developers; identify failures not adequately covered by the existing SDK and examples.
3. Inspect at least three existing wallet/aggregator experiences. Record their actual features, not assumed gaps.
4. Test quote economics on reviewed, liquid assets at illustrative amounts of $1, $5, $10 and $25 using read-only quotes. Do not spend funds for this experiment.
5. Continue with the cleanup positioning only if a usable subset of balances remains after realistic fees. Otherwise propose a scope revision to the user before building.

These are recruitment targets, not existing users, partnerships or proof of demand.

## 4. Product approaches considered

| Approach | Benefit | Cost/trade-off | Decision |
|---|---|---|---|
| Cleanup app with a shared, reusable toolkit | One real workflow exercises the package; clear consumer demonstration and developer contribution | Requires clean separation of UI, provider code and policy | Recommended |
| Full cleanup platform plus universal debugging SaaS | Two independent products and potential audiences | Too broad for the initial budget; requires accounts, storage and more support | Exclude from v1 |
| Developer toolkit with a sample cleanup page | Smallest user-facing scope | Less convincing as a consumer product | Fallback if user validation is weak |

## 5. Project-wide constraints

The following exact constraints are shared with the build plan:

- Planning only until the user explicitly starts implementation.
- New independent project; do not modify or reuse PayOps repositories without separate approval.
- One responsive website that also runs as a Telegram Mini App; no native mobile app in v1.
- TON-only execution through the official TON Connect integration.
- Maximum 8 reviewed input jettons and 5 selected swaps per cleanup session in v1.
- Output assets: TON or canonical USDT on TON; output and input cannot be the same asset.
- Native TON is reserved for network costs and is not an input cleanup asset in v1.
- One swap at a time, with a fresh review and explicit wallet approval for each swap.
- No custody, seed phrases, private-key import, custom on-chain contracts, leverage, yield or cross-chain execution.
- No automatic re-signing, rebroadcasting or retrying an uncertain transaction.
- No user accounts, central wallet-history database, automated Telegram messages or mandatory analytics in v1.
- Application/referral fee is 0 basis points in v1; network and protocol costs still apply.
- Integer base units for assets; never use floating-point arithmetic for monetary decisions.
- No mainnet signing in CI, unattended tests or demonstrations without separately approved live transactions.
- Mock, sandbox and mainnet environments are visibly distinct and have separate data namespaces.
- Proposed development request: $4,500 across three months; approval and payout are not guaranteed.

## 6. MVP features

### A. Wallet connection and asset discovery

- Standard TON Connect wallet picker; filter only by necessary capabilities, not commercial preference.
- Show shortened connected address, network and disconnect control.
- Re-check account and network before every signature, not only on initial connection.
- Fetch native balance and jetton balances through a read-only backend proxy.
- Identify assets by normalized master contract address plus network, never symbol alone.
- Intersect balances with a versioned, reviewed registry of at most 8 input jettons.
- Show supported balances separately from excluded/unknown assets; do not request interaction with unknown tokens.
- Display snapshot time and provider-unavailable states.
- Use bundled reviewed icons and plain-text metadata. Never render arbitrary token HTML or fetch arbitrary token image URLs.

### B. Cleanup selection and quote preview

- User selects up to 5 supported balances and a single target asset: TON or USDT.
- Default to the available selected balance, with an optional smaller exact amount.
- Obtain quotes per asset; keep parallel quote requests bounded to 2.
- Display expected output, minimum output where supported, quote expiry, estimated network costs, and upfront native balance required.
- Distinguish the native amount attached to a transaction from the amount expected to be consumed as fees; some attached value may return.
- Do not subtract protocol fees a second time if already included in the quoted receive amount.
- Default policy: skip an item if estimated incremental network costs exceed 10% of its gross output value or if estimated net value is non-positive.
- If comparable valuation or cost data is missing, show “Cost could not be checked” and disable execution; do not invent a dollar estimate.
- Preserve a configurable native gas reserve. Initial product reserve is 0.05 TON in addition to the validated next transaction's upfront requirements; confirm this policy during the feasibility work before live release.
- Expose a plain-language reason for every disabled or skipped item.
- Amount, recipient, token, quote, or network changes invalidate the previous review.

### C. Reviewed, sequential execution

- The selection is a plan, not an atomic batch transaction.
- Before each item, refresh balances, quote, native budget, token registry status and wallet identity.
- Start with 1% maximum slippage policy. If a route cannot honor the policy, do not silently increase it.
- Keep quote safety margin of at least 15 seconds before its start deadline at the moment of requesting a signature; a route that cannot provide this margin is not submitted.
- Use official SDK transaction construction behind a provider adapter. Validate supported route, recipient, refund destination, source account, token identities and amounts before the wallet call.
- The destination, refund and gas-excess addresses are the same connected wallet in v1. No third-party receiver feature.
- Respect the wallet's advertised message limit for the messages needed by ONE swap. Do not confuse this with bundling five swaps together.
- Persist an intent marker before calling the wallet.
- Treat a returned signed-message BoC as submission evidence, not settlement or the on-chain transaction hash.
- Correlate the message with the actual originating on-chain transaction using the official message-lookup approach.
- Track swap completion; validate expected receiver/asset and attributable receipt evidence. A broad balance increase is not sufficient evidence.
- Pause on rejected signature, partial fill, aborted trade, evidence disagreement or unknown state. The user explicitly decides whether to review another unaffected item.
- Stop closes the queue for future signatures; it cannot cancel an already broadcast transaction.

The official SDK exposes quotes, transaction construction and lifecycle events; this proposal adds conservative application policy and recovery around those interfaces, not a replacement liquidity protocol. [Omniston SDK](https://docs.ston.fi/developer-section/omniston/sdk/nodejs)

### D. Session history and recovery

- Store locally on the same browser/device using IndexedDB.
- Preserve wallet/network, session ID, item intent, reviewed quote identity, submission marker, message hash, transaction hash when found, timestamps and evidence state.
- Keep at most 100 completed sessions for 30 days. Keep unresolved session markers until resolved or explicitly cleared after a warning; never silently evict them to make space.
- If local persistence is unavailable or full, permit read-only preview but disable starting new swaps.
- On reload, reconnect the same wallet and reconcile unresolved items before enabling another cleanup session for it on that device.
- Use a cross-tab ownership lock. If the browser cannot support the verified locking strategy, disable execution rather than claim duplicate-send protection.
- This is NOT a global wallet lock. Another device or application can still transact; re-read balances and warn that the user must not repeat uncertain swaps elsewhere.
- Clearing site data loses local recovery evidence. Explain this plainly.
- Export a local activity CSV with a warning that it contains financial information. Do not call it a tax report.
- Provide “Recheck status,” not “Retry payment,” for ambiguous submissions.

### E. Swap Doctor screen

- Accessible from a session's “Technical details” control and a dedicated developer route.
- Timeline: validation → quote → review → wallet request → submission lookup → settlement evidence.
- Show stable machine-readable reason codes and separate human explanations.
- Separate a confirmed reason from a possible cause: an outage is not proof a swap failed.
- Include a local report preview and download; no automatic upload.
- Default shareable report includes only a strict allowlist of fields: schema version, app/package version, network, event types, relative times, policy/reason codes, support classification and pseudonymous local correlation IDs.
- Strip wallet addresses, raw transaction/message hashes, balances, amounts, raw BoCs, wallet session payloads, Telegram identity/init data, request headers, API keys and free-form upstream errors from shareable reports.
- Privately retained history may include transaction pointers for recovery; it is not the public debugging export.
- Imported reports are treated as untrusted JSON: max 256 KB, max 1,000 events, validated schema, rendered as escaped text, no URLs executed and no transaction operations triggered.

### F. SweepDock Kit

- Framework-independent TypeScript core and a separate Omniston adapter.
- Public interfaces for exact amounts, quote assessment, normalized states, diagnostic events and redacted report generation.
- The app consumes the actual package entry points; no duplicated private implementation.
- Deterministic fake quote provider, fake wallet and fake clock for integration tests.
- A small React example importing a packed build, with mock mode on by default.
- Documentation showing supported scenarios and explicit limitations.
- Suggested open-source license: Apache-2.0 for our own code, respecting dependency licenses and notices.
- Initially supports integrations using this kit. It is not a scanner that can diagnose arbitrary websites or recover funds from a transaction hash.
- No claim of detecting all wallet problems, scam tokens or contract vulnerabilities.

### G. Demo mode

- Available without connecting a real wallet.
- Separate route and provider configuration with a persistent “Simulation — no real funds” label.
- Show a successful swap, fee-based skip, quote expiry, explicit wallet rejection, partial completion and an unresolved submission.
- Doctor displays the same event schema used by the real app.
- Mock mode cannot import a live wallet signer or contact mainnet providers.
- Developer simulation does not count as live transaction evidence in grant materials.

## 7. Deliberately excluded from v1

- Native iOS/Android builds, app-store releases, PWA offline signing or service-worker caching of transaction requests.
- New wallets, seed generation, custodial balances or custodial recovery.
- Token issuance, memecoin launchpad, staking, investment advice, yield claims or trading signals.
- Gasless sponsorship, flash loans, leverage, cross-chain routes or automatic recurring conversions.
- Automatic token burning/deletion, arbitrary token support or importing private keys to bypass wallet approvals.
- An AI chatbot, universal debugger, central analytics warehouse, subscriptions or a referral system.
- Persistent notification bot, email login, cloud session sync, multi-wallet team accounts or administrative user dashboards.
- A professional smart-contract audit, which is not included in a $4,500 development proposal.

## 8. Screens and visual direction

### Routes

| Route | Purpose |
|---|---|
| `/` | Short explanation, limitations, launch button, developer link |
| `/app` | Wallet, supported balances and selection |
| `/app/review` | Costs, individual item review, approval control |
| `/app/session/:id` | Live progress and recovery state |
| `/app/history` | Local history, export and clear controls |
| `/doctor` | Local diagnostic report viewer |
| `/demo` | Isolated, labelled simulation |
| `/developers` | Package overview and example |
| `/docs/*` | Setup, lifecycle, reason codes, integration and security notes |
| `/privacy`, `/terms`, `/security` | Plain-language operational disclosures |

### UI direction

- Calm utility app, not a trading terminal: light neutral background, deep teal accent, clear amber warnings and restrained red errors.
- Browser colors: background `#F7F8F6`, text `#172A28`, accent `#0B756E`; verify actual component contrast during implementation.
- Adapt to Telegram light/dark theme and safe areas. The browser supports light/dark selection without Telegram.
- Clean typography; monospaced values only where amounts and technical details benefit.
- Bottom navigation on narrow screens: Cleanup, History, Help. Developer tools remain secondary.
- Desktop uses a balance list and a side review panel; mobile presents them as separate steps.
- User-facing language: “Estimated cost,” “Waiting for your wallet,” “Checking on-chain,” “Skipped,” “Partly completed,” and “Status not confirmed.”
- Never show green completion while receipt evidence remains unresolved.
- Minimum 44 CSS pixel touch targets, keyboard navigation, visible focus, readable labels, screen-reader announcements and reduced-motion support.
- Test widths: 360, 390, 768 and 1440 CSS pixels; long addresses and errors must wrap.

Telegram's official guidance requires mobile-friendly layouts and handling themes/safe areas. Its blockchain guidance requires TON Connect for ordinary Mini App wallet interactions; we do not fork the wallet picker or add other chains. [Mini App UI guidance](https://core.telegram.org/bots/webapps), [blockchain guidance](https://core.telegram.org/bots/blockchain-guidelines)

## 9. Recommended tech stack

| Area | Choice | Reason |
|---|---|---|
| Language | TypeScript, strict mode | One language across app, tests and reusable packages |
| Runtime/build | Node.js 24 LTS, pnpm workspace, Vite | Small monorepo and straightforward client build |
| Frontend | React, React Router | One interactive app for browser and Telegram |
| UI | Tailwind CSS and selected shadcn/Radix primitives | Fast accessible basics, customized product design |
| Remote data | TanStack Query | Bounded caching, refresh and error states |
| Domain state | Typed reducer/state machine in the core package | Explicit lifecycle; no global state framework needed initially |
| Wallet | Official `@tonconnect/ui-react` | User-owned signing and supported wallet flow |
| Swaps | `@ston-fi/omniston-sdk`, isolated adapter | Quotes, transaction construction and tracking |
| Assets | STON.fi asset metadata plus a reviewed address registry | Provider discovery is not our security allowlist |
| Chain reads | TonAPI for balances/traces; Toncenter for message/transaction lookup | Separate presentation data from transaction evidence |
| TON primitives | `@ton/core` and the minimum required TON client modules | Address, BoC and integer-safe operations |
| Validation | Zod at API/import boundaries | Reject malformed or mismatched data |
| Local history | IndexedDB through `idb` | Browser-local state without a wallet-history server |
| Minimal backend | Hono on Cloudflare Workers | Protect provider API keys and enforce bounded read endpoints |
| Hosting | Cloudflare Workers with static assets | App and `/api/*` on one origin |
| Tests | Vitest, Testing Library, MSW, Playwright, axe-core | Domain tests, provider fixtures, browser and accessibility checks |
| Code quality | ESLint, Prettier, TypeScript checks, dependency/license checks | Repeatable review gates |
| CI/releases | GitHub Actions; package tarball smoke tests | Reproducible builds without wallet secrets |
| Documentation | Markdown content in the same app/repository | Avoid a separate docs platform initially |

Vite supports a React/TypeScript app and Cloudflare documents serving React/Vite apps with Workers. Node.js lists 24 as LTS at the research date. These choices are proposed; exact compatible dependency versions must be resolved and locked at implementation kickoff, not invented here. [Vite](https://vite.dev/guide/), [Cloudflare](https://developers.cloudflare.com/workers/framework-guides/web-apps/react/), [Node releases](https://nodejs.org/en/about/previous-releases)

### Alternatives considered

- Next.js: useful for extensive server-rendered marketing or authenticated dashboards, but adds unnecessary server/client boundaries for this wallet-heavy MVP.
- Native React Native/Flutter: additional platforms, distribution and device work; outside scope.
- PostgreSQL/Supabase: introduce accounts, privacy/security and server-history obligations without a v1 requirement. Add only after a real cloud-sync need is approved.

## 10. Architecture and module boundaries

```text
Browser / Telegram Mini App
  ├─ React screens
  ├─ local session store + signing lock
  └─ SweepDock core
       ├─ exact amounts / policy / lifecycle / diagnostic export
       ├─ Omniston adapter → official quote/build/tracking services
       └─ wallet adapter → TON Connect → user approves in wallet

Read-only API worker
  ├─ reviewed asset registry / feature flags
  ├─ TonAPI account reads
  └─ Toncenter / trace lookup reads

No server signer. No hosted wallet balances. No custom swap contract.
```

The frontend connects directly to the documented Omniston WebSocket service if its supported browser/auth model permits. Do not put permanent secrets in public build variables. If the current integration requires a secret, resolve that architecture in the feasibility gate before implementation; do not expose it to maintain the diagram.

### Proposed repository layout

```text
sweepdock/
  apps/
    web/src/
      app/                 routing, providers, environment
      features/wallet/     account and capability handling
      features/cleanup/    discovery, review and sequential execution
      features/history/    local sessions, exports, recovery
      features/doctor/     local diagnostic viewer
      features/demo/       simulated providers and scenarios
      lib/                 API client and IndexedDB adapter
      content/             developer/help documentation
    api/src/
      routes/              config, balances, message/trace reads
      providers/           fixed upstream clients
      middleware/          validation, rate limits, response policy
  packages/
    core/src/              domain types, policy, lifecycle, reports
    omniston-adapter/src/  verified SDK mapping, transaction validation
    testkit/src/           fake provider, wallet, clock and scenarios
  examples/react/          imports built public packages
  tests/e2e/               offline journeys and regressions
  docs/                    architecture, evidence, contribution, release
  .github/workflows/      checks and separately approved release jobs
```

This tree is a plan, not an existing scaffold.

## 11. Data and interfaces

### Core records

| Record | Required information |
|---|---|
| Asset | network, canonical master address/native sentinel, decimals, reviewed registry revision |
| Balance snapshot | wallet, network, exact units, native balance, fetched timestamp |
| Quote assessment | input/output asset, exact units, expiry, route binding, costs, policy result |
| Cleanup session | schema version, local ID, wallet/network, ordered item IDs, created time |
| Swap item | intent fingerprint, amount, reviewed quote, lifecycle, submission pointers, evidence |
| Diagnostic event | schema version, item ID, relative timestamp, stage and reason code |
| Shareable report | version, public event fields and per-report pseudonyms only |

Strings store integer base units at JSON/storage boundaries. Convert to `bigint` for arithmetic. Decimals must come from the reviewed registry and agree with provider data. Reject excess decimal places rather than silently round.

### Core lifecycle

```text
selected → quoting → review_ready → awaiting_signature → submitted
                  ↘ skipped                           ↓
                                                   confirming
                                         ┌────────────┼─────────────┐
                                      completed   partial        aborted
```

Additional transitions:

- `review_ready → quoting` on expiry, input changes or stale balances.
- `awaiting_signature → rejected` only on an explicit wallet rejection.
- `awaiting_signature/submitted/confirming → unknown` on ambiguous timeout, reload or missing evidence.
- `unknown → confirming/completed/partial/aborted` only on correlated evidence.
- `unknown` never transitions directly to a new signing attempt.
- A new, explicitly approved attempt after a confirmed aborted trade is a separate item and requires refreshed balances and a new quote.
- Repeated or out-of-order provider events cannot undo a stronger, verified outcome. Conflicting evidence freezes the item as a conflict requiring review.

### Stable diagnostic reasons

`UNSUPPORTED_ASSET`, `INVALID_AMOUNT`, `NETWORK_MISMATCH`, `WALLET_CHANGED`, `NO_ROUTE`, `QUOTE_EXPIRED`, `COST_DATA_UNAVAILABLE`, `COST_TOO_HIGH`, `INSUFFICIENT_NATIVE_BALANCE`, `MESSAGE_LIMIT`, `USER_REJECTED`, `SUBMISSION_UNKNOWN`, `TRACKING_UNAVAILABLE`, `PARTIAL_FILL`, `TRADE_ABORTED`, `RECEIPT_MISMATCH`, `STORAGE_UNAVAILABLE`, `SESSION_LOCKED`, `SERVICE_PAUSED`.

Reason codes are our proposed application API, not claims that upstream SDKs use these exact strings.

### Backend endpoints

| Endpoint | Contract |
|---|---|
| `GET /api/config` | Network, reviewed registry revision, allowlist and execution-enabled flag |
| `POST /api/balances` | Accept one normalized public wallet address and supported network; return bounded balance snapshot |
| `POST /api/message-lookup` | Accept wallet/network and external-message hash; return matched transaction or pending/unknown |
| `POST /api/receipt` | Accept wallet/network, transaction hash and expected asset identity; return validated evidence or unknown |
| `GET /api/health` | Build version and service status; never credentials or provider payloads |

Read operations use POST where identifiers would otherwise leak into URL logs. They still access public blockchain data; they are not authenticated account operations. No server write endpoints for user history.

Restrict upstream hosts in code, limit request bodies to 8 KB, validate all addresses and hash lengths, bound upstream concurrency, use 10-second provider timeouts, and enforce an initial 30 requests/minute/IP limit. Return 429/503 without falling back to unbounded public requests. Never log request bodies, address paths, wallet payloads or upstream authorization headers.

Initial caching: config/registry 60 seconds; balance displays at most 10 seconds, with an uncached refresh before signing. Submission/evidence responses are never treated as final solely because they were cached.

## 12. Security and reliability release gates

1. Validate wallet, chain, asset identity, exact amount, reviewed quote and destination immediately before signing.
2. Review supported route payloads rather than trusting an opaque remote transaction merely because it came from an SDK. Unknown route structures are disabled until supported and tested.
3. Distinguish signed-message hash from actual transaction hash. Use the official normalized message lookup, then independently bind evidence to the expected swap. [TON message lookup](https://docs.ton.org/applications/ton-connect/how-to/message-lookup)
4. A wallet response is not settlement. The TON Connect API returns a BoC for the broadcast message; transactions still need on-chain lookup. [TON transaction sending](https://docs.ton.org/applications/ton-connect/how-to/send-transaction)
5. Do not use mutable, human-friendly TonAPI “actions” as the sole financial state machine. TonAPI advises against building logic on those actions; use documented low-level traces/transactions with explicit mapping. [TonAPI accounts](https://docs.tonapi.io/tonapi/rest-api/accounts)
6. If receipt matching cannot be verified for a route in the feasibility work, keep that route read-only. Do not expand scope into a new indexer to hide the problem.
7. Validate untrusted API data; escaped rendering; no arbitrary redirects, HTML or image fetching.
8. Enforce a least-privilege CSP and exact network host allowlist. Permit only wallet/Telegram origins actually required by tested integrations.
9. Public asset configuration has a versioned registry, kill switch and monitored changes. No editable dashboard is needed for v1; changes go through reviewed configuration updates.
10. Closing Telegram pauses execution. No new transaction is signed in the background.
11. Developer reports are local and redacted by construction; upstream error text is not copied into public logs.
12. No mainnet secret in repository, deployment environment or CI. User signs any approved mainnet smoke test themselves.
13. Dependency licenses, secrets scans, lockfile review and release provenance are part of the release checklist.
14. Small controlled beta first. Security review and tests do not equal an independent audit or guarantee safety.

## 13. Environments

| Environment | Behavior |
|---|---|
| Mock | Offline deterministic fixtures, fake wallet, no funds; default local/CI/demo mode |
| Integration sandbox | Official Omniston sandbox where supported; validate actual network/assets separately |
| Mainnet read-only | Public reads and quotes; signing disabled |
| Mainnet beta | Explicitly enabled after review and separately authorized live tests |

Sandbox is not assumed to be TON testnet, free to use with arbitrary mainnet assets, or equivalent to production. Record supported endpoints, chain, tokens and wallet flow in the feasibility evidence before any signing. The official documentation describes sandbox as integration-testing infrastructure. [Omniston sandbox documentation](https://docs.ston.fi/developer-section/omniston/sdk/nodejs)

Use separate origins/configuration for mock and live deployment. Persist environment IDs with every record. No query parameter may change an existing live session into mock success.

## 14. Delivery schedule and budget

Time is relative to an agreed kickoff, not a December deadline. Proposed duration: 12 weeks / three months. This is an initial estimate for a focused solo-builder beta; validate effort after the first two weeks.

| Milestone | Weeks | Deliverable | Development allocation |
|---|---|---|---:|
| M1 | 1–4 | Validation, compatibility evidence, product shell, reviewed assets, balances and fee-aware preview | $1,200 |
| M2 | 5–8 | Wallet execution, verified lifecycle, sequential queue and local recovery | $1,800 |
| M3 | 9–12 | Public toolkit, doctor, fixtures, docs, accessibility, pilot evidence and demo | $1,500 |
| Total | 12 | Focused beta, not an audited financial platform | $4,500 |

These are proposed development allocations, not STON.fi's confirmed payout schedule. Grant funds are not assumed to cover swap principal, user rewards or token purchases. Hosting, API plans, domain charges and transaction costs require separate quotes/approval; do not promise free production hosting. Set a provisional operating-spend ceiling of $50/month and revisit before buying anything.

If a prototype is built before applying, label that as existing work and update the funding request to describe the remaining deliverables. Do not present already completed work as future grant work or assume retrospective reimbursement is allowed.

The official program currently lists grants up to $10,000 paid in USDT for development work. A $4,500 request is within that limit, not a funding promise. [Grant program](https://ston.fi/grant-program)

## 15. Success criteria and evidence

### Engineering

- Exact amount/fee decisions pass unit and property-style boundary tests.
- The full normal user flow works in browser and Telegram on actual tested devices.
- Every failed/unknown state has a distinct explanation and safe next action.
- Reloading during a signing request cannot silently produce a new request.
- No SDK “success” response alone produces a confirmed-complete UI.
- Shared packages run in an independent consumer example installed from a tarball.
- Public report export passes leakage tests with planted sensitive fields.
- No critical/serious automated accessibility findings on core screens; manual keyboard and screen-reader checks also recorded.
- No horizontal scrolling at 360 CSS pixels caused by addresses, tables or errors.

### Adoption targets

- Five consenting pilot users complete usability sessions; live swaps only where separately authorized and economical.
- Three developers try the package/example; target at least one independent successful integration.
- Record attempts, skips, confirmed completions, failures and developer feedback separately.
- Do not promise minimum transaction volume or funded selection. Do not manufacture activity to improve metrics.

### Grant evidence pack

- Public source and license, reproducible setup, screenshots and a concise demo.
- Demo clearly separates live evidence and simulated failures.
- Three-month milestones and itemized development budget.
- Known limitations, supported wallet/asset matrix, API assumptions and test report.
- Genuine pilot feedback shared only with consent.
- No invented users, partner logos, audits, revenue, live results or funding history.

## 16. Dependencies and stop conditions

| Risk | Early check | Required response |
|---|---|---|
| Cleanup balances are uneconomical | Read-only quote matrix | Narrow target balances or ask to revise positioning |
| Existing tools already cover the need | User/dev interviews and competitor walkthroughs | Find a demonstrable unmet need before building |
| Unsupported SDK/browser combination | Browser build and sandbox compatibility check | Resolve versions before signing work |
| Sandbox behavior differs from assumed network | Verify network, assets and wallet flow | Keep mocks/read-only mode; do not move to mainnet as a shortcut |
| Route output cannot be reliably correlated | Message/trace evidence fixture | Disable route; ask before new infrastructure scope |
| Telegram wallet return/reload unreliable | Real-device connection test | Fix recovery before public execution |
| Provider costs exceed ceiling | Written current quota/cost check | Reduce scope/rate or request approval |
| User declines live-test spending | No live signature | Finish offline/read-only work and mark mainnet acceptance unverified |
| Independent security issue remains | Review evidence | Keep signing disabled |

## 17. Planning handoff

This spec and the linked roadmap are the only outputs for this planning request. They are not evidence that the app works. Implementation starts only after the user reviews the name, scope and stack and explicitly asks to begin.

Read next: [Build roadmap](../plans/2026-09-04-sweepdock-build-plan.md).
