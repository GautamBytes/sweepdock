export type SwapState =
  | 'selected'
  | 'quoting'
  | 'review_ready'
  | 'skipped'
  | 'awaiting_signature'
  | 'rejected'
  | 'submitted'
  | 'confirming'
  | 'completed'
  | 'partial'
  | 'aborted'
  | 'unknown';
export type EventKind =
  | 'quote_requested'
  | 'quote_ready'
  | 'quote_invalidated'
  | 'skip'
  | 'signature_requested'
  | 'signature_rejected'
  | 'message_returned'
  | 'transaction_found'
  | 'receipt_verified'
  | 'partial_verified'
  | 'abort_verified'
  | 'status_unknown';
export interface LifecycleEvent {
  id: string;
  itemId: string;
  kind: EventKind;
  observedAt: number;
}
export interface SwapRecord {
  id: string;
  state: SwapState;
  acceptedEventIds: string[];
}

const transitions: Partial<
  Record<SwapState, Partial<Record<EventKind, SwapState>>>
> = {
  selected: { quote_requested: 'quoting' },
  quoting: { quote_ready: 'review_ready', skip: 'skipped' },
  review_ready: {
    quote_invalidated: 'quoting',
    signature_requested: 'awaiting_signature',
    skip: 'skipped',
  },
  awaiting_signature: {
    message_returned: 'submitted',
    signature_rejected: 'rejected',
    status_unknown: 'unknown',
  },
  submitted: { transaction_found: 'confirming', status_unknown: 'unknown' },
  confirming: {
    receipt_verified: 'completed',
    partial_verified: 'partial',
    abort_verified: 'aborted',
    status_unknown: 'unknown',
  },
  unknown: {
    transaction_found: 'confirming',
    receipt_verified: 'completed',
    partial_verified: 'partial',
    abort_verified: 'aborted',
  },
};

const evidenceStates: Partial<Record<EventKind, SwapState>> = {
  receipt_verified: 'completed',
  partial_verified: 'partial',
  abort_verified: 'aborted',
};

export function transition(
  record: SwapRecord,
  event: LifecycleEvent,
): SwapRecord {
  if (event.itemId !== record.id) throw new Error('Wrong item');
  if (!event.id || !Number.isFinite(event.observedAt) || event.observedAt < 0)
    throw new Error('Invalid event');
  if (record.acceptedEventIds.includes(event.id)) return record;
  if (['completed', 'partial', 'aborted'].includes(record.state)) {
    const finalState = evidenceStates[event.kind];
    if (finalState && finalState !== record.state)
      throw new Error('Conflicting evidence');
    if (
      finalState ||
      ['transaction_found', 'message_returned', 'status_unknown'].includes(
        event.kind,
      )
    )
      return record;
  }
  const state = transitions[record.state]?.[event.kind];
  if (!state)
    throw new Error(`Invalid transition: ${record.state} + ${event.kind}`);
  return {
    ...record,
    state,
    acceptedEventIds: [...record.acceptedEventIds, event.id],
  };
}
