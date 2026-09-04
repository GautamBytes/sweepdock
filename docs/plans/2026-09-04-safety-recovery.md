# Offline safety and recovery implementation plan

Approved by the user's request to build the three proposed safety/recovery pieces.

**Goal:** Exercise testnet account/expiry guards and durable uncertain-attempt recovery without a real signer or provider.

**Architecture:** Shared pure guards and lifecycle replay in the core package; a separate simulation-only IndexedDB journal; a browser safety lab that feeds the existing Swap Doctor. Atomic read/write transactions claim the single lab attempt before returning to the UI. Stored data is validated on every read. This is not a production transaction executor.

**Tech stack:** Existing TypeScript, React, Zod, native IndexedDB, Vitest and Playwright. No new dependency. Follow the existing teal/neutral layout and typography.

## Constraints

- Keep work on the existing `feat/testnet-swap-flow` SSD branch.
- No deployment, wallet calls, signing, provider reads, chain transactions or support messages.
- All records and exported reports remain explicitly simulated. No mainnet signer is added.
- Reject malformed account/review data, wrong chain/account and less than 15 seconds of quote validity.
- An unresolved journal cannot be replaced by a new attempt. Reload turns in-flight states into unknown, never completed.
- IndexedDB failure or corrupt records blocks new attempts; never fall back to volatile memory.
- Real on-chain receipt verification remains blocked by the recorded testnet preflight. Fixture receipts are labelled simulation controls.
- Cross-tab protection applies only to this browser/origin and this journal. Clearing browser data removes it.

## Execution checklist

- [x] Baseline: `pnpm test` (146 existing tests).
- [x] Write failing core tests in `packages/core/test/testnet-safety.test.ts` for chain/account/expiry guards, lifecycle replay, message versus settlement, recovery and corrupt journal validation.
- [x] Add `packages/core/src/testnet-safety.ts`, exported from the package entry point. Expose `checkTestnetReview`, `startSafetyAttempt`, `appendSafetyEvent`, `recoverSafetyAttempt`, `parseSafetyAttempt` and `safetyState`.
- [x] Write failing browser tests in `tests/e2e/safety.spec.ts` for refresh, two-tab claims, wrong-wallet/expiry errors, rejection, storage errors, redacted Doctor reports and mobile accessibility. Run the route test before implementing the UI.
- [x] Add `apps/web/src/features/safety/journal.ts`: a simulation-only IndexedDB store, validating reads and atomically checking/claiming one current attempt. Await transaction completion; abort on mutation errors. Stale event updates must not replace a newer state or attempt.
- [x] Add `SafetyLab.tsx` with fixed synthetic account/review, explicit simulated event buttons and recovery feedback. Keep rejected attempts visible until the user clears the finished sample. Unknown attempts cannot be cleared by the normal finished-sample action.
- [x] Route `/safety` and `/safety/doctor` to the lab, with navigation from Developer Kit. Reuse Doctor with a lab-specific source label and plain-language event explanations. Existing `/demo` and mainnet `/app` remain unchanged.
- [x] Run `pnpm check`, `pnpm test:e2e`, and `pnpm test:wallet`. Inspect local lab at mobile and desktop widths. Review code and record limitations.

## Test examples / acceptance

```ts
expect(checkTestnetReview(review, { address: review.wallet, chain: '-239' }, now))
  .toBe('NETWORK_MISMATCH');
expect(safetyState(recoverSafetyAttempt(startSafetyAttempt(review, account, now), now + 1)))
  .toBe('unknown');
```

```ts
await page.getByRole('button', { name: 'Start simulated attempt' }).click();
await page.reload();
await expect(page.getByText('Status not confirmed. Do not send again.', { exact: true })).toBeVisible();
await expect(page.getByRole('button', { name: 'Start simulated attempt' })).toBeDisabled();
```

Completion means the above local behaviours pass. It does not mean a testnet swap happened, that the blocked router was fixed, or that the hosted app includes this batch.

## Verification record

Verified locally on 2026-09-05:

- `pnpm check`: typecheck, 178 tests across 23 files, production build, ESLint and Prettier all passed.
- `pnpm exec playwright test --workers 2`: 30 browser tests passed, including the 360px safety lab and recovered Doctor accessibility/overflow check.
- `pnpm test:wallet`: the TON Connect SDK connected and disconnected a synthetic no-funds wallet without signing; 1 test passed.
- Desktop inspection covered attempt creation, reload recovery into `unknown`, duplicate-send blocking and the recovered Doctor timeline.
