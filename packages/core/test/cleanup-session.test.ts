import { describe, expect, it } from 'vitest';
import {
  createCleanupSession,
  claimCleanupItem,
  recoverCleanupSession,
  respondCleanupItem,
  settleCleanupItem,
  cleanupStates,
  parseCleanupSession,
  refreshCleanupReviews,
  cleanupCanClear,
  fixtureSettlement,
} from '../src/cleanup-session';
const now = 100000;
const create = () => createCleanupSession('session-1', now);
describe('durable cleanup session', () => {
  it('claims only one item at a time and persists the claim before wallet return', () => {
    const s = claimCleanupItem(create(), now);
    expect(cleanupStates(s)).toEqual([
      'awaiting_signature',
      'selected',
      'selected',
    ]);
    expect(() => claimCleanupItem(s, now)).toThrow();
    expect(cleanupStates(respondCleanupItem(s, 'submitted', now))).toEqual([
      'submitted',
      'selected',
      'selected',
    ]);
  });
  it('reload and redirect recovery never resubmit an uncertain attempt', () => {
    for (const s of [
      claimCleanupItem(create(), now),
      respondCleanupItem(claimCleanupItem(create(), now), 'submitted', now),
    ]) {
      const recovered = recoverCleanupSession(s, now + 1000);
      expect(cleanupStates(recovered)[0]).toBe('unknown');
      expect(() => claimCleanupItem(recovered, now + 1000)).toThrow();
      expect(cleanupCanClear(recovered)).toBe(false);
    }
  });
  it('matches settlement before unlocking the next item; ignores unrelated evidence', () => {
    let s = respondCleanupItem(
      claimCleanupItem(create(), now),
      'submitted',
      now,
    );
    expect(() =>
      settleCleanupItem(
        s,
        { ...fixtureSettlement(s, 'completed'), queryId: '999' },
        now,
      ),
    ).toThrow();
    s = settleCleanupItem(s, fixtureSettlement(s, 'completed'), now);
    expect(cleanupStates(s)[0]).toBe('completed');
    s = claimCleanupItem(s, now);
    expect(cleanupStates(s)[1]).toBe('awaiting_signature');
  });
  it.each(['partial', 'aborted'] as const)(
    'pauses remaining items for %s',
    (outcome) => {
      let s = respondCleanupItem(
        claimCleanupItem(create(), now),
        'submitted',
        now,
      );
      s = settleCleanupItem(s, fixtureSettlement(s, outcome), now);
      expect(() => claimCleanupItem(s, now)).toThrow();
      expect(cleanupCanClear(s)).toBe(true);
    },
  );
  it('rejection pauses without retrying; a fresh review is needed after quote expiry', () => {
    const s = respondCleanupItem(
      claimCleanupItem(create(), now),
      'rejected',
      now,
    );
    expect(() => claimCleanupItem(s, now)).toThrow();
    expect(() => claimCleanupItem(create(), now + 60000)).toThrow(
      'QUOTE_EXPIRED',
    );
    expect(
      cleanupStates(
        claimCleanupItem(
          refreshCleanupReviews(create(), now + 60000),
          now + 60000,
        ),
      )[0],
    ).toBe('awaiting_signature');
  });
  it('rejects forged stored identities and impossible concurrent state histories', () => {
    const s = claimCleanupItem(create(), now);
    expect(() =>
      parseCleanupSession({ ...s, environment: 'testnet' }),
    ).toThrow();
    const duplicate = structuredClone(s);
    duplicate.items[1] = structuredClone(duplicate.items[0]!);
    expect(() => parseCleanupSession(duplicate)).toThrow();
    const forged = structuredClone(s);
    forged.items[0]!.review.wallet = '0:' + 'f'.repeat(64);
    expect(() => parseCleanupSession(forged)).toThrow();
  });
  it('late wallet evidence can resolve an uncertain claim without a second approval', () => {
    let s = recoverCleanupSession(claimCleanupItem(create(), now), now + 1);
    s = respondCleanupItem(s, 'submitted', now + 2);
    s = settleCleanupItem(s, fixtureSettlement(s, 'completed'), now + 3);
    expect(cleanupStates(s)[0]).toBe('completed');
    expect(
      s.items[0]!.attempt!.events.filter(
        (e) => e.kind === 'signature_requested',
      ),
    ).toHaveLength(1);
  });
});
