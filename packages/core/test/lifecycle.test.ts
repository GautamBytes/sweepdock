import { describe, expect, it } from 'vitest';
import {
  transition,
  type EventKind,
  type SwapRecord,
  type SwapState,
} from '../src/lifecycle';

function event(kind: EventKind, id = kind) {
  return { id, itemId: 'item-1', kind, observedAt: 100 };
}
function record(state: SwapState): SwapRecord {
  return { id: 'item-1', state, acceptedEventIds: [] };
}

describe('swap lifecycle', () => {
  it.each([
    ['selected', 'quote_requested', 'quoting'],
    ['quoting', 'quote_ready', 'review_ready'],
    ['quoting', 'skip', 'skipped'],
    ['review_ready', 'quote_invalidated', 'quoting'],
    ['review_ready', 'signature_requested', 'awaiting_signature'],
    ['awaiting_signature', 'message_returned', 'submitted'],
    ['submitted', 'transaction_found', 'confirming'],
    ['confirming', 'receipt_verified', 'completed'],
    ['confirming', 'partial_verified', 'partial'],
    ['confirming', 'abort_verified', 'aborted'],
    ['awaiting_signature', 'signature_rejected', 'rejected'],
    ['awaiting_signature', 'status_unknown', 'unknown'],
    ['unknown', 'receipt_verified', 'completed'],
  ] as const)('%s + %s → %s', (start, kind, expected) => {
    expect(transition(record(start), event(kind)).state).toBe(expected);
  });
  it('never calls a returned wallet message completion', () => {
    expect(
      transition(record('awaiting_signature'), event('message_returned')).state,
    ).toBe('submitted');
  });
  it('rejects requesting a new signature for an uncertain item', () => {
    expect(() =>
      transition(record('unknown'), event('signature_requested')),
    ).toThrow('Invalid transition');
  });
  it('rejects events belonging to another item', () => {
    expect(() =>
      transition(record('selected'), {
        ...event('quote_requested'),
        itemId: 'other',
      }),
    ).toThrow('Wrong item');
  });
  it('deduplicates an already applied event', () => {
    const once = transition(record('selected'), event('quote_requested'));
    expect(transition(once, event('quote_requested'))).toEqual(once);
  });
  it('does not regress completion when an older pending event arrives', () => {
    expect(
      transition(record('completed'), event('transaction_found')).state,
    ).toBe('completed');
  });
  it('rejects contradictory final evidence', () => {
    expect(() =>
      transition(record('completed'), event('abort_verified')),
    ).toThrow('Conflicting evidence');
  });
  it('does not mutate caller-owned records', () => {
    const original = record('selected');
    transition(original, event('quote_requested'));
    expect(original).toEqual(record('selected'));
  });
});
