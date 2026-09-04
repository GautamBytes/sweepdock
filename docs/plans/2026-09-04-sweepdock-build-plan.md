# SweepDock Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a TON wallet-cleanup website/Telegram Mini App and the reusable, tested swap-integration toolkit used by that app.

**Architecture:** One React application, one small read-only API worker, a framework-independent domain package, an Omniston adapter and a deterministic testkit. All transaction approval stays in the user's wallet; session history and debugging reports stay local by default. The consumer app and developer example use the same public package interfaces.

**Tech Stack:** TypeScript, React, Vite, pnpm, Node.js 24 LTS, Tailwind CSS, selected shadcn/Radix primitives, React Router, TanStack Query, TON Connect, official Omniston SDK, TON primitives, Zod, IndexedDB/idb, Hono, Cloudflare Workers, Vitest, MSW, Playwright and axe-core.

## Global Constraints

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

---

## 1. How to use this plan

Product specification: [SweepDock design](../specs/2026-09-04-sweepdock-design.md).

This is a full project roadmap with component contracts, test cases, release gates and implementation order. It does not claim to contain a complete copy-paste implementation of the application. Before executing each task, expand its approved contracts into a short coding plan using the actual versions and route schemas established by Task 1. Do not guess SDK payload layouts or mainnet asset addresses from these notes.

No commands below were run as part of the planning request. No dependencies, repository, wallet, bot, deployment, package or grant application have been created. The current parent workspace is not itself a Git repository; planning documents are saved locally and are not committed.

The future repository root is named `sweepdock/` in this document. Every file path in a task is relative to that future repository. Keep the working product name provisional until the naming check passes.

### Work method

- Take one independently reviewable task at a time.
- Write the specified failing test or fixture assertion first.
- Run the smallest relevant check and verify it fails for the expected reason.
- Implement only the task's behavior; run the check again.
- Run all affected package checks and review security implications.
- Commit only explicitly listed task files in the new repository. Do not stage the parent workspace or unrelated projects.
- Public pushes, deployments, bot configuration, npm releases, provider purchases and real-money tests are separate external actions; obtain the needed user direction when reaching them.

### Planned root scripts

The scaffold task defines these stable command names:

| Command | Purpose |
|---|---|
| `pnpm dev` | Local web + worker, mock mode by default |
| `pnpm lint` | ESLint and formatting checks |
| `pnpm typecheck` | Strict TypeScript checks for all workspaces |
| `pnpm test` | All offline unit/component/worker tests |
| `pnpm test:contracts` | Fixed provider fixtures and normalization tests, no live funding |
| `pnpm test:e2e` | Playwright against a local mock build |
| `pnpm test:a11y` | Automated accessibility checks |
| `pnpm build` | Package, application and worker builds |
| `pnpm check:packages` | Pack packages and test separate consumer installation |
| `pnpm check:secrets` | Repository scan with an approved pinned scanner |
| `pnpm check` | Offline lint, types, tests, build and package checks |

No script named `test`, `check` or `dev` may require a live private key or send a mainnet transaction.

## 2. Delivery sequence

| Task | Deliverable | Suggested timing |
|---|---|---|
| 1 | Validation and integration feasibility evidence | Week 1 |
| 2 | Isolated workspace, CI and mock application shell | Week 2 |
| 3 | Exact amounts, asset identity and fee policy | Weeks 2–3 |
| 4 | Read-only data API and reviewed registry | Weeks 3–4 |
| 5 | Typed lifecycle and diagnostic event contracts | Week 4 |
| 6 | Official SDK adapter and quote preview | Week 5 |
| 7 | Wallet submission and correlated settlement evidence | Week 6 |
| 8 | Sequential queue, storage, locks and recovery | Week 7 |
| 9 | Complete cleanup/review/history screens | Week 8 |
| 10 | Swap Doctor, redaction and report import | Week 9 |
| 11 | Reusable testkit, example and package verification | Week 10 |
| 12 | Telegram/device compatibility and accessibility | Weeks 10–11 |
| 13 | Security/reliability review and controlled pilot | Week 11 |
| 14 | Documentation, honest demo and release evidence | Week 12 |

The timings are estimates for a focused beta and can change after Task 1. Passing a calendar date never overrides a safety gate.

## Task 1: Validate the need and prove the integration assumptions

**Files to create:**

- `docs/research/user-needs.md`
- `docs/research/competitors.md`
- `docs/research/quote-economics.csv`
- `docs/architecture/compatibility-matrix.md`
- `docs/architecture/provider-contracts.md`
- `docs/architecture/asset-registry-policy.md`

**Consumes:** Product scope, official sources listed in the design, prospective user/developer feedback.

**Produces:** Go/no-go decision; exact compatible package versions; verified environment/network mapping; supported initial route family; live registry sourcing policy; quotes/cost evidence. These are evidence documents, not guessed API contracts.

- [ ] Check name, domain, Telegram handle and npm namespace availability. Record findings without registering or purchasing anything automatically.
- [ ] Read current official SDK sources/types for quote requests, quote expiry, fee units, gas budget, transaction construction, message limits and tracking results. Record exact versions and schema names.
- [ ] Confirm the SDK's browser compatibility and public-versus-secret connection requirements using a small isolated read-only experiment once implementation is authorized.
- [ ] Record sandbox endpoint, actual chain, supported assets and whether any signing test requires funds. Do not equate “sandbox” with TON testnet.
- [ ] Identify one supported TON route whose transaction intent and receipt evidence can be decoded and correlated without creating a new indexer. Save sanitized fixtures from that exact route family.
- [ ] Verify current TonAPI and Toncenter read endpoints, authentication, quotas, field semantics and retention. Confirm message-to-transaction lookup and low-level trace evidence.
- [ ] Gather the five-user/three-developer feedback and competitor observations. User outreach requires authorization; until then prepare the questions and do read-only research.
- [ ] Produce a read-only quote matrix for realistic balance sizes and supported assets. Include time, quote result, cost-confidence and skipped reason; no fake filled trades.
- [ ] Review whether the target problem remains useful after fees and manual wallet approvals.
- [ ] Get a go/no-go review before adopting a new architecture or materially changing the combined product.

**Acceptance:** No unverified endpoint/network/asset assumption is allowed to flow into wallet signing. If stable receipt correlation or economic value cannot be established, remain mock/read-only and return a proposed scope change.

## Task 2: Create an independent workspace and a tested mock shell

**Files to create:**

- Root `package.json`, `pnpm-workspace.yaml`, `pnpm-lock.yaml`, `tsconfig.base.json`, `.node-version`, `.gitignore`, `.env.example`, `README.md`.
- `apps/web/package.json`, `apps/web/vite.config.ts`, `apps/web/src/app/router.tsx`, `apps/web/src/app/environment.ts`, `apps/web/src/app/providers.tsx`.
- `apps/api/package.json`, `apps/api/wrangler.jsonc`, `apps/api/src/index.ts`.
- Package manifests and `src/index.ts` for `packages/core`, `packages/omniston-adapter`, `packages/testkit`.
- `.github/workflows/checks.yml`, `tests/e2e/shell.spec.ts`.

**Consumes:** Task 1 compatibility decisions.

**Produces:** A local app with disabled live signing, test commands, typed package boundaries and an API health response.

- [ ] Initialize the new repository only after the user starts implementation; never initialize Git in the existing mixed-project parent folder.
- [ ] Pin compatible dependency versions and the pnpm version, save the lockfile, target Node 24 LTS and enable strict TypeScript with unchecked-index checks.
- [ ] Create the `/`, `/app`, `/demo`, `/developers` and `/security` shells. Other routes may land with their feature tasks rather than appearing as empty pages.
- [ ] Add a failing browser acceptance test for the default mode:

```ts
import { expect, test } from '@playwright/test';

test('local app is a visibly labelled simulation', async ({ page }) => {
  await page.goto('/demo');
  await expect(page.getByText('Simulation — no real funds')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Connect wallet' })).toHaveCount(0);
});
```

- [ ] Run `pnpm test:e2e --grep "local app is a visibly labelled simulation"`; verify the missing UI assertion fails, then implement the shell and verify it passes.
- [ ] Make missing/invalid environment configuration fail closed. No `?mainnet=true` override and no secrets in `VITE_*` values.
- [ ] Implement the planned root scripts and an offline CI workflow. Disable package publication and live deployment in the initial workflow.
- [ ] Run `pnpm check` and the shell test. Review and commit the isolated scaffold.

**Acceptance:** A fresh checkout runs with mock data and no credentials; missing API configuration does not enable a live fallback.

## Task 3: Exact amounts, asset identity and economic checks

**Files to create:**

- `packages/core/src/amounts.ts`, `packages/core/src/assets.ts`, `packages/core/src/policy.ts`.
- `packages/core/test/amounts.test.ts`, `packages/core/test/assets.test.ts`, `packages/core/test/policy.test.ts`.

**Consumes:** Registry identity format and normalized cost meanings established in Task 1.

**Produces:**

```ts
export type Network = 'ton-mainnet' | 'ton-testnet';
export type AssetKey = string; // canonical network + normalized master identity

export function parseUnits(text: string, decimals: number): bigint;
export function formatUnits(units: bigint, decimals: number): string;

export interface CostAssessmentInput {
  comparableOutputUnits: bigint;
  incrementalNetworkCostUnits: bigint;
  nativeBalanceUnits: bigint;
  nativeUpfrontUnits: bigint;
  nativeReserveUnits: bigint;
  maxCostBps: number;
  costsKnown: boolean;
}

export type CostDecision =
  | { executable: true }
  | { executable: false; reason:
      'COST_DATA_UNAVAILABLE' | 'COST_TOO_HIGH' |
      'INSUFFICIENT_NATIVE_BALANCE' };

export function assessCost(input: CostAssessmentInput): CostDecision;
```

The two comparable-cost fields must be in the same valuation unit and must exclude fees already netted from the quote. Constructing these fields is the provider adapter's responsibility, not an assumption that all quote fields share units.

- [ ] Write the red tests, including exact values beyond JavaScript's safe integer range:

```ts
import { expect, it } from 'vitest';
import { parseUnits } from '../src/amounts';

it('preserves large token balances exactly', () => {
  expect(parseUnits('9007199254740993.000001', 6))
    .toBe(9007199254740993000001n);
});

it('rejects precision that would silently round', () => {
  expect(() => parseUnits('1.0000001', 6)).toThrow();
});
```

- [ ] Run `pnpm --filter @sweepdock/core test -- amounts`; verify failure, implement exact parsing/formatting, then rerun.
- [ ] Add asset tests for same symbol/different address, wrong network, changed decimals, unknown asset, and native-versus-jetton identity.
- [ ] Add policy tests for missing valuation, zero/negative net value, threshold equality, costs exceeding 10%, and insufficient native upfront-plus-reserve funds.
- [ ] Add tests proving attached native value is not treated as entirely spent and netted fees are not deducted twice.
- [ ] Keep a single definition of each default: maximum 5 swaps, 8 inputs, 1,000 cost basis points, 100 slippage basis points, 15-second deadline margin and 0.05 TON reserve.
- [ ] Run core tests and `pnpm typecheck`; review and commit.

**Acceptance:** No `Number`, `parseFloat` or floating-point multiplication decides an amount, minimum output, fee threshold or gas reserve.

## Task 4: Reviewed assets and a bounded read-only API

**Files to create:**

- `apps/api/src/config/assets.ts`, `apps/api/src/config/runtime.ts`.
- `apps/api/src/routes/config.ts`, `balances.ts`, `message-lookup.ts`, `receipt.ts`, `health.ts`.
- `apps/api/src/providers/tonapi.ts`, `toncenter.ts`.
- `apps/api/src/middleware/limits.ts`, `errors.ts`, `response-policy.ts`.
- `apps/api/test/routes.test.ts`, `providers.test.ts`, `privacy.test.ts`.
- `apps/web/src/lib/read-api.ts`.

**Consumes:** Asset normalization from Task 3 and verified upstream contracts from Task 1.

**Produces:** The five endpoint contracts in design section 11. Message/receipt reads can return typed `unknown` until the verified mapping is implemented; they must not fabricate evidence.

- [ ] Write worker tests that reject malformed addresses, wrong networks, oversized bodies, arbitrary upstream URLs and invalid hashes.
- [ ] Write a rate-limit test where request 31 within one minute is rejected for the same test client.
- [ ] Use fixed upstream hosts and Worker secret bindings; no token or key reaches the client bundle.
- [ ] Fetch all required balance pages within a bounded request budget. If the source is truncated or rate-limited, return an explicit incomplete result and block execution; do not treat missing entries as zero.
- [ ] Match canonical registry addresses against balances; provider tags alone do not approve an asset.
- [ ] Cache display reads briefly, support uncached pre-sign checks, and expose timestamps.
- [ ] Implement timeout, backoff, bounded concurrency and provider-unavailable responses; prevent automatic client retries from multiplying requests.
- [ ] Verify logs contain no body, wallet address, upstream credentials or raw response payload. Test logger inputs with planted secrets.
- [ ] Run `pnpm --filter @sweepdock/api test` and `pnpm build`; review and commit.

**Acceptance:** Public reads are usable without a user account; unknown, incomplete or stale data never passes a signing prerequisite.

## Task 5: Lifecycle reducer and event contracts

**Files to create:**

- `packages/core/src/lifecycle.ts`, `packages/core/src/events.ts`, `packages/core/src/reasons.ts`.
- `packages/core/test/lifecycle.test.ts`, `packages/core/test/event-ordering.test.ts`.

**Consumes:** Design's lifecycle, reason codes and exact asset identities.

**Produces:**

```ts
export type SwapState =
  | 'selected' | 'quoting' | 'review_ready' | 'skipped'
  | 'awaiting_signature' | 'rejected' | 'submitted'
  | 'confirming' | 'completed' | 'partial' | 'aborted' | 'unknown';

export interface LifecycleEvent {
  id: string;
  itemId: string;
  kind: 'quote_ready' | 'quote_invalidated' | 'skip'
    | 'signature_requested' | 'signature_rejected' | 'message_returned'
    | 'transaction_found' | 'receipt_verified' | 'partial_verified'
    | 'abort_verified' | 'status_unknown';
  observedAt: number;
}

export interface SwapRecord {
  id: string;
  state: SwapState;
  acceptedEventIds: string[];
}

export function transition(record: SwapRecord, event: LifecycleEvent): SwapRecord;
```

Only the verified evidence adapter may emit `receipt_verified`, `partial_verified` or `abort_verified`; a JSON report importer cannot drive this reducer in a live session.

- [ ] Write explicit transition tests for every allowed and rejected transition in design section 11.
- [ ] Add this invariant test before implementation:

```ts
import { expect, it } from 'vitest';
import { transition, type SwapRecord } from '../src/lifecycle';

it('does not let an uncertain submission request another signature', () => {
  const record: SwapRecord = { id: 'item-1', state: 'unknown', acceptedEventIds: [] };
  expect(() => transition(record, {
    id: 'event-2', itemId: 'item-1',
    kind: 'signature_requested', observedAt: 200,
  })).toThrow();
});
```

- [ ] Implement an explicit transition table with item identity validation and event deduplication.
- [ ] Test wallet response versus completion, duplicated events, wrong item IDs, late pending events and conflicting evidence.
- [ ] Implement separate user copy for unsupported, skipped, rejected, aborted, partial and unknown states.
- [ ] Run core tests; review and commit.

**Acceptance:** No generic catch block converts all errors into “failed,” and no event order turns an unknown transaction into permission to send again.

## Task 6: Wrap Omniston and provide reliable quote previews

**Files to create:**

- `packages/omniston-adapter/src/client.ts`, `quote.ts`, `build.ts`, `track.ts`, `validate-transaction.ts`.
- `packages/omniston-adapter/test/quote.test.ts`, `build.test.ts`, `fixtures/quote.json`, `fixtures/transaction.json`.
- `apps/web/src/features/cleanup/use-quotes.ts`.
- `docs/architecture/supported-routes.md`.

**Consumes:** Verified SDK version/schema, exact amount/policy functions, wallet capability data and reviewed registry.

**Produces:** Framework-independent normalized quote, build and tracking interfaces. All names below are our interfaces, not copied upstream APIs.

```ts
export interface QuoteRequest {
  wallet: string;
  network: 'ton-mainnet' | 'ton-testnet';
  inputAsset: string;
  outputAsset: string;
  inputUnits: string;
  maxSlippageBps: number;
  maxMessages: number;
}

export interface NormalizedQuote {
  id: string;
  request: QuoteRequest;
  expectedOutputUnits: string;
  minimumOutputUnits: string;
  expiresAtSeconds: number;
  providerBinding: string;
}

export interface UnsignedMessage {
  address: string;
  amount: string;
  payload?: string;
  stateInit?: string;
}

export interface ReviewedTransfer {
  quoteId: string;
  request: QuoteRequest;
  validUntilSeconds: number;
  messages: UnsignedMessage[];
}

export interface SwapProvider {
  quote(request: QuoteRequest, signal: AbortSignal): Promise<NormalizedQuote>;
  build(quote: NormalizedQuote): Promise<ReviewedTransfer>;
}
```

Cost normalization is a separate typed result consumed by `assessCost`; never imply the abbreviated quote contract above contains all cost fields.

- [ ] Build sanitized fixtures for current SDK success, no quote, stale quote, disconnection and malformed payload responses.
- [ ] Add tests for input/receiver/network mismatch, changed amount, too many messages, expiry and unsupported route structures.
- [ ] Implement quote subscription disposal, bounded parallelism and cancellation on selection change.
- [ ] Map SDK fee fields once, documenting which costs are netted and which are incremental.
- [ ] Build transactions only from a quote bound to the current reviewed request. Validate recipient/refund/source and route payload fields before returning `ReviewedTransfer`.
- [ ] Do not treat `providerBinding` as a security signature. It is a local correlation fingerprint; actual payload validation remains required.
- [ ] Run `pnpm test:contracts` offline, followed by separately selected sandbox read tests. Any live result goes in evidence, not in deterministic CI.
- [ ] Review and commit the supported adapter scope.

**Acceptance:** A provider or selection change invalidates review. No opaque SDK payload bypasses application policy.

## Task 7: TON Connect signing and actual receipt correlation

**Files to create:**

- `apps/web/src/features/wallet/connect.tsx`, `capabilities.ts`, `signer.ts`.
- `packages/omniston-adapter/src/message-lookup.ts`, `receipt-evidence.ts`.
- `apps/web/src/features/wallet/signer.test.ts`.
- `packages/omniston-adapter/test/message-lookup.test.ts`, `receipt-evidence.test.ts`.

**Consumes:** Validated transfer from Task 6, lifecycle from Task 5, read endpoints from Task 4.

**Produces:** A wallet adapter and trusted local evidence events.

```ts
export interface WalletSigner {
  currentAccount(): Promise<{ address: string; network: string; maxMessages: number }>;
  requestSignature(input: ReviewedTransfer): Promise<{ boc: string }>;
}

export type ReceiptEvidence =
  | { kind: 'pending' | 'unknown'; reason: string }
  | { kind: 'completed'; transactionHash: string; receivedUnits: string }
  | { kind: 'partial'; transactionHash: string; receivedUnits: string }
  | { kind: 'aborted'; transactionHash: string };
```

`ReviewedTransfer` is exported from Task 6. `ReceiptEvidence` is not accepted from arbitrary imported JSON; its creation is limited to validated provider evidence.

- [ ] Test that changing the connected address/network after review prevents the wallet call.
- [ ] Test that expired quotes and over-limit message counts are blocked before opening the wallet.
- [ ] Test that a returned BoC produces submitted/confirming, never completed.
- [ ] Implement normalized external-message lookup using the official algorithm and fixtures from Task 1. Never substitute a hash of arbitrary serialized bytes for the on-chain transaction hash.
- [ ] Verify originating account, reviewed intent, route identity, expected recipient and asset against correlated chain evidence.
- [ ] Test wrong receiver, wrong token with the same symbol, unrelated inbound transfer, incomplete trace, provider disagreement and partial output.
- [ ] Map explicit user rejection separately from wallet transport timeout. Unknown means no automatic retry.
- [ ] Run signer/receipt unit and contract tests. Record any unsupported routes as disabled.
- [ ] Review the signing boundary before enabling any user-approved live smoke test. Commit only after offline checks pass.

**Acceptance:** The app proves the result of the intended swap, not merely that the wallet signed or its balance changed.

## Task 8: Sequential sessions, local persistence and recovery

**Files to create:**

- `packages/core/src/session.ts`, `packages/core/src/executor.ts`.
- `apps/web/src/lib/session-store.ts`, `apps/web/src/lib/session-lock.ts`.
- `apps/web/src/features/history/recover.ts`.
- `packages/core/test/executor.test.ts`, `apps/web/src/lib/session-store.test.ts`.
- `tests/e2e/recovery.spec.ts`, `tests/e2e/concurrent-tabs.spec.ts`.

**Consumes:** Cost policy, provider, signer, receipt evidence and lifecycle interfaces.

**Produces:** A cleanup controller with `reviewNext`, `approveCurrent`, `pause` and `recheck` operations; no `retryUnknown` operation.

- [ ] Write a fake-wallet test counting requests across double clicks, repeated events, pause/resume and page reload.
- [ ] Test that only one of five selected items can await a signature at a time.
- [ ] Persist the intent marker before the wallet request; fail closed on a storage exception.
- [ ] Save message/transaction correlation immediately after receiving it; retain ambiguous in-flight intent if the app closes first.
- [ ] Reconcile unresolved items on reload and reconnect. Never assume that absence of a message pointer means the wallet did not send.
- [ ] Use verified same-origin cross-tab locking, with a safe unsupported-browser behavior. Re-check account and balances after acquiring the lock.
- [ ] Keep the review → user gesture → signature sequence explicit for each next item; no wallet modal appears automatically after a previous swap completes.
- [ ] Add storage expiry/capacity rules from the design and a warning before clearing unresolved history.
- [ ] Test that an outage, unknown state, changed account, rejected signature or partial result pauses the queue.
- [ ] Run executor, recovery and concurrent-tab tests; review and commit.

**Acceptance:** Crash/reload/repeated click tests cannot silently initiate a duplicate signature. Cross-device guarantees are not claimed.

## Task 9: Finish the consumer experience

**Files to create:**

- `apps/web/src/features/cleanup/balance-list.tsx`, `selection.tsx`, `review.tsx`, `progress.tsx`.
- `apps/web/src/features/history/history.tsx`, `export.ts`.
- `apps/web/src/app/styles.css`, `apps/web/src/components/status.tsx`.
- `tests/e2e/cleanup.spec.ts`, `tests/e2e/fee-preview.spec.ts`, `tests/e2e/history.spec.ts`.

**Consumes:** Real domain/controller interfaces; UI must not implement a second fee or lifecycle policy.

**Produces:** Complete supported-token discovery, review, progress and local-history journeys.

- [ ] Add failing journeys for empty wallet, unavailable provider, unsupported tokens, too many selections, no route and missing valuation.
- [ ] Build a mobile step flow and desktop list/side-panel flow using the approved visual direction.
- [ ] Display upfront native requirements separately from estimated consumed costs.
- [ ] Show expected output, any price changes, quote expiry and per-item approvals without hiding costs behind tooltips.
- [ ] Explain fee-based skips and show unknown tokens without offering to interact with them.
- [ ] Add “Recheck status” and “Technical details” links on unresolved sessions; no blanket “Try again” button.
- [ ] Implement local CSV export with safe escaping and formula-injection handling. Export is activity history, not accounting advice.
- [ ] Test long addresses, localized decimal input rejection/normalization policy, zero balances, delayed updates, disconnect and lost connection.
- [ ] Run consumer browser tests and component accessibility checks; review and commit.

**Acceptance:** A nontechnical pilot user can explain what they are converting, what costs are estimates, what they approved and which items remain unresolved.

## Task 10: Doctor, redaction and safe report import

**Files to create:**

- `packages/core/src/report.ts`, `packages/core/src/redact.ts`, `packages/core/src/report-schema.ts`.
- `packages/core/test/report.test.ts`, `packages/core/test/redact.test.ts`.
- `apps/web/src/features/doctor/timeline.tsx`, `report-preview.tsx`, `report-import.tsx`.
- `tests/e2e/doctor.spec.ts`.

**Consumes:** Lifecycle/reason events and private local session evidence.

**Produces:** Shareable diagnostic reports and a local-only viewer, separated from executable live state.

```ts
export interface ShareableEvent {
  itemAlias: string;
  elapsedMs: number;
  stage: string;
  reason?: string;
}

export interface ShareableReport {
  schemaVersion: 1;
  packageVersion: string;
  network: string;
  events: ShareableEvent[];
}
```

- [ ] Plant secrets, wallet addresses, BoCs, hash values, amounts and malicious upstream errors in private test events; assert none survive export.
- [ ] Construct the export from approved fields rather than copying the original and applying regular expressions.
- [ ] Keep stable per-report aliases so the timeline remains useful without real identity values.
- [ ] Validate imported size, schema and event count before rendering; do not execute HTML/JavaScript or follow imported URLs.
- [ ] Provide readable explanations and technical reason codes with separate “known” and “possible cause” language.
- [ ] Confirm imported reports cannot mutate a live session, select a wallet or request a signature.
- [ ] Test download/preview behavior on desktop; provide local copy/export fallback where mobile file handling differs without uploading private data.
- [ ] Run report leakage and browser tests; review and commit.

**Acceptance:** The developer tool helps explain supported integration failures without becoming a data-exfiltration or transaction-execution surface.

## Task 11: Testkit, isolated demo and independent package example

**Files to create:**

- `packages/testkit/src/fake-clock.ts`, `fake-wallet.ts`, `fake-provider.ts`, `scenarios.ts`.
- `packages/testkit/test/scenarios.test.ts`.
- `apps/web/src/features/demo/demo.tsx`.
- `examples/react/package.json`, `examples/react/src/app.tsx`, `examples/react/README.md`.
- `scripts/check-packages.mjs`, `tests/e2e/demo-isolation.spec.ts`.

**Consumes:** Public core/provider interfaces, not private internal file imports.

**Produces:** Reproducible integration fixtures and a minimal third-party-style consumer.

- [ ] Implement scenarios for success, fee skip, missing route, expired quote, rejection, wallet switch, timeout after signing, partial fill, RPC outage and redacted export.
- [ ] Use a fake clock so tests do not wait on wall time.
- [ ] Add a browser network assertion that `/demo` never contacts live wallet bridges, mainnet RPCs or live quote services.
- [ ] Keep simulated outcomes visibly labelled, including in screenshots/recordings.
- [ ] Pack packages into a temporary directory and install them into an independent example. Validate exports, type declarations and runtime behavior.
- [ ] Confirm examples do not depend on workspace aliases or unpublished source files.
- [ ] Add README install/use instructions, a compatibility matrix, license notices and limitations. Resolve namespace availability before any public publish.
- [ ] Run `pnpm check:packages`, testkit tests and demo isolation E2E; review and commit.

**Acceptance:** Another developer can consume the packed package without our monorepo, and a mock demonstration cannot masquerade as live evidence.

## Task 12: Telegram integration, real devices and accessibility

**Files to create:**

- `apps/web/src/app/telegram.ts`, `apps/web/src/features/wallet/return-flow.ts`.
- `apps/web/public/tonconnect-manifest.json` when the actual deployment origin is authorized.
- `docs/testing/device-matrix.md`, `docs/operations/telegram-setup.md`.
- `tests/e2e/responsive.spec.ts`, `tests/e2e/accessibility.spec.ts`.

**Consumes:** Complete browser app and local recovery.

**Produces:** One app that works in browser and Telegram; no extra custodial bot service.

- [ ] Feature-detect Telegram APIs; ordinary browser use must not require Telegram identity or installation.
- [ ] Apply theme, safe-area, back-button and visibility handling. Remove event listeners on teardown.
- [ ] Do not trust `initDataUnsafe` for backend authentication. V1 has no authenticated Telegram server operations and does not need to send identity data to the API.
- [ ] Prepare BotFather setup instructions; create/configure the bot and HTTPS origin only with authorization at execution time.
- [ ] Test wallet connect → wallet approval/rejection → return to Telegram → status recovery on actual iOS and Android devices where available.
- [ ] Record unsupported or untested devices honestly; Playwright mobile emulation is not evidence of Telegram in-app behavior.
- [ ] Test widths 360/390/768/1440, keyboard navigation, focus after dialogs, long content, light/dark theme, screen-reader status updates and reduced motion.
- [ ] Verify permitted wallet selection and TON-only behavior against current Telegram rules before public launch.
- [ ] Run automated accessibility/browser checks, complete the manual matrix and commit.

**Acceptance:** No mainnet beta launch on a platform whose approval-return/recovery path has not been tested successfully.

## Task 13: Security review and a controlled pilot

**Files to create:**

- `docs/security/threat-model.md`, `docs/security/review.md`.
- `docs/testing/acceptance-results.md`, `docs/research/pilot-feedback.md`.
- `docs/operations/incident-response.md`, `docs/operations/provider-budget.md`.

**Consumes:** Working code, complete tests, supported route registry and verified device evidence.

**Produces:** Recorded release decision, actual pilot findings and operational controls.

- [ ] Review trust boundaries: metadata, quote provider, API worker, wallet, receipt provider, local storage and report import.
- [ ] Test manipulated recipients/amounts, unknown payload structures, quote drift, negative cost values, duplicate events, stale configuration and storage failure.
- [ ] Verify CSP, exact provider hosts, API limits, log redaction, secret scanning and dependency/license reports.
- [ ] Confirm a remote/configuration kill switch prevents new signatures while still permitting read-only recovery of submitted transactions.
- [ ] Run the complete offline checks. No public claims of “audited” or “secure” arise solely from passing them.
- [ ] Request explicit approval for any live smoke test: network, exact assets, maximum amounts/fees and user's signing action. A mainnet test is never an automatic fallback from a broken sandbox.
- [ ] Record transaction evidence only after correlation succeeds; otherwise mark mainnet acceptance unverified and keep signing disabled for public users.
- [ ] Conduct consenting pilot sessions and developer example trials. Do not fabricate adoption if recruitment is incomplete.
- [ ] Review operating costs against the $50/month provisional ceiling before purchasing provider plans.
- [ ] Resolve release-blocking findings; commit evidence and the release decision.

**Acceptance:** No unresolved signing/receipt/privacy issue and no fabricated device, adoption or transaction evidence. A blocked live release can still leave a complete mock/read-only demonstration.

## Task 14: Documentation, demonstration and grant-ready evidence

**Files to create:**

- `README.md`, `LICENSE`, `SECURITY.md`, `CONTRIBUTING.md`.
- `docs/user-guide.md`, `docs/developer-guide.md`, `docs/reason-codes.md`.
- `docs/release/checklist.md`, `docs/release/known-limitations.md`.
- `docs/demo/script.md`.
- Private grant narrative/budget notes outside the public source tree unless the user approves their inclusion.

**Consumes:** Actual test/pilot results and proposed milestone budget.

**Produces:** Reproducible release candidate and honest application evidence; not an automatic grant submission.

- [ ] Explain the two connected outputs in simple language: cleanup for users, reusable integration tooling for developers.
- [ ] Document supported assets/routes/wallets, same-device history limitations, manual per-swap approvals and fees.
- [ ] Make setup reproducible from a clean checkout; run documented commands as written.
- [ ] Prepare a demo showing a complete cleanup workflow, fee-based skip, failed/unknown state handling, developer timeline and redacted report.
- [ ] Label every simulated sequence. Show real swaps only with separately approved and verified evidence.
- [ ] Include the $1,200 / $1,800 / $1,500 development milestones as a proposal, not a confirmed STON.fi payment schedule.
- [ ] Separate any pre-application prototype from the remaining funded work; revise milestone descriptions and budget instead of presenting completed work as future delivery.
- [ ] Record real user/developer feedback with permission and distinguish it from targets.
- [ ] Check current grant terms and questions again immediately before preparing an application.
- [ ] Ask the user to review any public deployment/package release and all application answers before those external actions.
- [ ] Commit public documentation and release notes only after review; keep private grant details separate.

**Acceptance:** A reviewer can understand the problem, use the demo, inspect real code and reproduce the checks without relying on unsupported claims.

## 3. Test coverage matrix

| Requirement | Primary tasks | Minimum evidence |
|---|---|---|
| Exact amounts and token identity | 3, 4 | Unit/boundary tests, canonical registry fixtures |
| Fee-aware cleanup | 3, 6, 9 | Netted-fee/gas-budget tests and user preview |
| Quote/network/account binding | 6, 7 | Negative provider/wallet tests |
| Real submission and receipt correlation | 7 | Normalized message lookup and low-level evidence fixtures |
| No accidental duplicate sends | 5, 8 | Double click, reload, unknown and concurrent-tab tests |
| Clear mixed/partial outcomes | 5, 8, 9 | Lifecycle and browser scenarios |
| Local private history | 8, 9 | Persistence, clear, capacity and CSV tests |
| Safe developer diagnostics | 10 | Leakage, import-size and render-injection tests |
| Actual reusable package | 11 | Packed independent consumer |
| Isolated mock mode | 2, 11 | No-live-network assertion |
| Browser and Telegram UX | 12 | Automated browser tests plus real-device records |
| Public beta safeguards | 13 | Review, kill switch, approved live-test evidence |
| Honest grant/demo materials | 14 | Evidence-linked claims and visible simulation labels |

## 4. Milestone acceptance and budget

### M1 — $1,200, end of month 1

- Need and feasibility reviewed.
- Working mock/browser shell and bounded read API.
- Reviewed asset identity and cost-aware previews.
- Domain policy/lifecycle tests available.

### M2 — $1,800, end of month 2

- Supported SDK route integrated.
- Wallet approvals and correlated evidence working in the verified environment.
- Sequential session handling and safe recovery.
- Consumer screens complete for agreed scope.

### M3 — $1,500, end of month 3

- Developer toolkit, independent example and doctor.
- Device/accessibility/reliability review.
- Pilot findings, docs and labelled demonstration.
- Mainnet beta only if its additional acceptance gates pass.

Total: **$4,500**. These are planning allocations for development, not a guarantee that the grant will be approved or paid in those installments. If scope needs to shrink, remove secondary visual/report conveniences before weakening amount, signing, recovery or receipt verification.

## 5. Final review before execution

- [ ] User has approved the proposed name or supplied another.
- [ ] Scope remains cleanup + reusable integration toolkit, with no unrelated financial features.
- [ ] A fresh repository location is agreed; no existing repository is modified accidentally.
- [ ] Compatible versions and provider contracts will be verified before SDK coding.
- [ ] Mock mode, read-only work and real-money tests remain separate.
- [ ] No wallet, domain, bot, paid API, npm namespace or deployment is assumed to exist.
- [ ] Reviewers understand that task contracts are planning artifacts, not completed implementation or passed tests.

Implementation is intentionally deferred. The next action, when the user asks to start, is Task 1—not a live wallet connection, public deployment or grant application.
