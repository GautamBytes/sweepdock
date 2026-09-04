import { describe, expect, it } from 'vitest';
import * as core from '../src/index';

const now = 100_000;
const review = {
  id: 'sample-1',
  wallet: '0:' + 'a'.repeat(64),
  chain: '-3',
  quoteId: 'sample-quote',
  issuedAt: now,
  expiresAt: now + 60_000,
  inputMaster: '0:' + 'b'.repeat(64),
  outputMaster: '0:' + 'c'.repeat(64),
  units: '1000000',
};
const account = { address: review.wallet, chain: '-3' };

describe('testnet review guards', () => {
  it('accepts a matching fresh testnet review without authorizing signing', () => {
    expect(core.checkTestnetReview(review, account, now)).toBeNull();
  });
  it.each(['-239', '1', ''])('rejects account network %s', (chain) => {
    expect(core.checkTestnetReview(review, { ...account, chain }, now)).toBe(
      'NETWORK_MISMATCH',
    );
  });
  it('rejects a mainnet review even with a testnet account', () => {
    expect(
      core.checkTestnetReview({ ...review, chain: '-239' }, account, now),
    ).toBe('NETWORK_MISMATCH');
  });
  it('rejects a changed account', () => {
    expect(
      core.checkTestnetReview(
        review,
        { ...account, address: '0:' + 'd'.repeat(64) },
        now,
      ),
    ).toBe('WALLET_CHANGED');
  });
  it.each([0, 14_999])('rejects a quote with %s ms remaining', (remaining) => {
    expect(
      core.checkTestnetReview(
        { ...review, expiresAt: now + remaining },
        account,
        now,
      ),
    ).toBe('QUOTE_EXPIRED');
  });
  it('accepts exactly the 15-second safety margin', () => {
    expect(
      core.checkTestnetReview(
        { ...review, expiresAt: now + 15_000 },
        account,
        now,
      ),
    ).toBeNull();
  });
  it.each([NaN, Infinity, -1, now - 1])(
    'rejects an invalid or rolled-back clock: %s',
    (time) => {
      expect(core.checkTestnetReview(review, account, time)).toBe(
        'INVALID_REVIEW',
      );
    },
  );
  it.each(['0', '-1', '1.2', '1e9', '01', '9'.repeat(40)])(
    'rejects invalid units %s',
    (units) => {
      expect(core.checkTestnetReview({ ...review, units }, account, now)).toBe(
        'INVALID_REVIEW',
      );
    },
  );
  it('rejects identical input/output and malformed account data', () => {
    expect(
      core.checkTestnetReview(
        { ...review, outputMaster: review.inputMaster },
        account,
        now,
      ),
    ).toBe('INVALID_REVIEW');
    expect(core.checkTestnetReview(review, null, now)).toBe('INVALID_ACCOUNT');
  });
});

describe('simulation journal lifecycle', () => {
  const start = () => core.startSafetyAttempt(review, account, now);
  it('stores an explicit simulation marker and awaits a response', () => {
    expect(start().environment).toBe('simulation');
    expect(core.safetyState(start())).toBe('awaiting_signature');
  });
  it('never treats a wallet response as settlement', () => {
    const submitted = core.appendSafetyEvent(
      start(),
      'message_returned',
      now + 1,
    );
    expect(core.safetyState(submitted)).toBe('submitted');
    expect(
      core.safetyState(core.recoverSafetyAttempt(submitted, now + 2)),
    ).toBe('unknown');
  });
  it('persists uncertainty on reload and refuses another signature', () => {
    const recovered = core.recoverSafetyAttempt(start(), now + 1);
    expect(core.safetyState(recovered)).toBe('unknown');
    expect(() =>
      core.appendSafetyEvent(recovered, 'signature_requested', now + 2),
    ).toThrow();
    expect(core.recoverSafetyAttempt(recovered, now + 2)).toEqual(recovered);
  });
  it('distinguishes rejection from a transport timeout', () => {
    expect(
      core.safetyState(
        core.appendSafetyEvent(start(), 'signature_rejected', now + 1),
      ),
    ).toBe('rejected');
    expect(
      core.safetyState(
        core.appendSafetyEvent(start(), 'status_unknown', now + 1),
      ),
    ).toBe('unknown');
  });
  it('keeps rejection after refresh', () => {
    const rejected = core.appendSafetyEvent(
      start(),
      'signature_rejected',
      now + 1,
    );
    expect(core.recoverSafetyAttempt(rejected, now + 2)).toEqual(rejected);
  });
  it('allows only lifecycle-compatible simulated receipt results', () => {
    expect(() =>
      core.appendSafetyEvent(start(), 'receipt_verified', now + 1),
    ).toThrow();
    const unknown = core.recoverSafetyAttempt(start(), now + 1);
    const completed = core.appendSafetyEvent(
      unknown,
      'receipt_verified',
      now + 2,
    );
    expect(core.safetyState(completed)).toBe('completed');
    expect(core.recoverSafetyAttempt(completed, now + 3)).toEqual(completed);
  });
  it('validates persisted events by replay, not a trusted saved state', () => {
    const attempt = start();
    expect(
      core.parseSafetyAttempt(JSON.parse(JSON.stringify(attempt))),
    ).toEqual(attempt);
    expect(() =>
      core.parseSafetyAttempt({ ...attempt, environment: 'mainnet' }),
    ).toThrow();
    expect(() =>
      core.parseSafetyAttempt({ ...attempt, state: 'completed' }),
    ).toThrow();
    expect(() =>
      core.parseSafetyAttempt({ ...attempt, events: [attempt.events[2]] }),
    ).toThrow();
    expect(() =>
      core.parseSafetyAttempt({
        ...attempt,
        events: [...attempt.events, attempt.events[2]],
      }),
    ).toThrow();
    expect(() => core.parseSafetyAttempt({ ...attempt, events: [] })).toThrow();
  });
  it('rejects mismatched identity and out-of-order timestamps', () => {
    const attempt = start();
    expect(() =>
      core.parseSafetyAttempt({
        ...attempt,
        events: attempt.events.map((e) => ({ ...e, itemId: 'another' })),
      }),
    ).toThrow();
    expect(() =>
      core.appendSafetyEvent(attempt, 'status_unknown', now - 1),
    ).toThrow();
  });
  it('redacts the private review from shareable diagnostics', () => {
    const report = JSON.stringify(core.makeShareableReport(start().events));
    for (const value of [
      review.wallet,
      review.inputMaster,
      review.quoteId,
      review.id,
      review.units,
    ])
      expect(report).not.toContain(value);
    expect(report).toContain('simulation');
  });
});
