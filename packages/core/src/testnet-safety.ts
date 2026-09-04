import { z } from 'zod';
import { transition, type EventKind, type SwapRecord } from './lifecycle';

const address = z
  .string()
  .regex(/^0:[a-fA-F0-9]{64}$/)
  .transform((v) => v.toLowerCase());
const identifier = z.string().min(1).max(100);
const time = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
const reviewSchema = z
  .strictObject({
    id: identifier,
    wallet: address,
    chain: z.string().max(10),
    quoteId: identifier,
    issuedAt: time,
    expiresAt: time,
    inputMaster: address,
    outputMaster: address,
    units: z
      .string()
      .refine((v) => /^[1-9][0-9]{0,38}$/.test(v) && BigInt(v) < 1n << 128n),
  })
  .refine((v) => v.inputMaster !== v.outputMaster && v.expiresAt >= v.issuedAt);
const accountSchema = z.strictObject({ address, chain: z.string().max(10) });
export type SafetyReview = z.infer<typeof reviewSchema>;
export type SafetyAccount = z.infer<typeof accountSchema>;
export type SafetyReason =
  | 'INVALID_REVIEW'
  | 'INVALID_ACCOUNT'
  | 'NETWORK_MISMATCH'
  | 'WALLET_CHANGED'
  | 'QUOTE_EXPIRED';

/** Preflight checks only. Passing is NOT authorization to build or sign a transaction. */
export function checkTestnetReview(
  review: unknown,
  account: unknown,
  now: number,
): SafetyReason | null {
  const r = reviewSchema.safeParse(review);
  if (!r.success || !time.safeParse(now).success || now < r.data.issuedAt)
    return 'INVALID_REVIEW';
  const a = accountSchema.safeParse(account);
  if (!a.success) return 'INVALID_ACCOUNT';
  if (r.data.chain !== '-3' || a.data.chain !== '-3') return 'NETWORK_MISMATCH';
  if (r.data.wallet !== a.data.address) return 'WALLET_CHANGED';
  if (r.data.expiresAt - now < 15_000) return 'QUOTE_EXPIRED';
  return null;
}

const eventSchema = z.strictObject({
  id: identifier,
  itemId: identifier,
  observedAt: time,
  kind: z.enum([
    'quote_requested',
    'quote_ready',
    'quote_invalidated',
    'skip',
    'signature_requested',
    'signature_rejected',
    'message_returned',
    'transaction_found',
    'receipt_verified',
    'partial_verified',
    'abort_verified',
    'status_unknown',
  ]),
});
const attemptSchema = z.strictObject({
  schemaVersion: z.literal(1),
  environment: z.literal('simulation'),
  review: reviewSchema,
  events: z.array(eventSchema).min(3).max(64),
});
export type SafetyAttempt = z.infer<typeof attemptSchema>;

export function safetyState(attempt: SafetyAttempt) {
  let record: SwapRecord = {
    id: attempt.review.id,
    state: 'selected',
    acceptedEventIds: [],
  };
  for (const event of attempt.events) record = transition(record, event);
  return record.state;
}

/** Browser storage is untrusted; replay every event rather than trust a stored state. */
export function parseSafetyAttempt(value: unknown): SafetyAttempt {
  const attempt = attemptSchema.parse(value);
  if (attempt.review.chain !== '-3') throw new Error('Invalid journal network');
  let last = attempt.review.issuedAt;
  const seen = new Set<string>();
  for (const event of attempt.events) {
    if (
      event.itemId !== attempt.review.id ||
      event.observedAt < last ||
      seen.has(event.id)
    )
      throw new Error('Invalid journal event');
    seen.add(event.id);
    last = event.observedAt;
  }
  if (
    attempt.events
      .slice(0, 3)
      .map((e) => e.kind)
      .join(',') !== 'quote_requested,quote_ready,signature_requested'
  )
    throw new Error('Invalid journal start');
  safetyState(attempt);
  return attempt;
}

export function startSafetyAttempt(
  review: SafetyReview,
  account: SafetyAccount,
  now: number,
): SafetyAttempt {
  const reason = checkTestnetReview(review, account, now);
  if (reason) throw new Error(reason);
  const validated = reviewSchema.parse(review);
  return parseSafetyAttempt({
    schemaVersion: 1,
    environment: 'simulation',
    review: validated,
    events: (
      ['quote_requested', 'quote_ready', 'signature_requested'] as const
    ).map((kind, index) => ({
      id: `event-${index}`,
      itemId: validated.id,
      kind,
      observedAt: now,
    })),
  });
}

/** Used exclusively by the offline lab; callers must not treat fixture events as chain evidence. */
export function appendSafetyEvent(
  attempt: SafetyAttempt,
  kind: EventKind,
  now: number,
): SafetyAttempt {
  parseSafetyAttempt(attempt);
  return parseSafetyAttempt({
    ...attempt,
    events: [
      ...attempt.events,
      {
        id: `event-${attempt.events.length}`,
        itemId: attempt.review.id,
        kind,
        observedAt: now,
      },
    ],
  });
}

export function recoverSafetyAttempt(
  value: SafetyAttempt,
  now: number,
): SafetyAttempt {
  const attempt = parseSafetyAttempt(value);
  if (
    !['awaiting_signature', 'submitted', 'confirming'].includes(
      safetyState(attempt),
    )
  )
    return attempt;
  return appendSafetyEvent(
    attempt,
    'status_unknown',
    Math.max(time.parse(now), attempt.events.at(-1)!.observedAt),
  );
}
