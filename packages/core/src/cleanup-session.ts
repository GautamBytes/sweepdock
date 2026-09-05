import { z } from 'zod';
import {
  appendSafetyEvent,
  parseSafetyAttempt,
  recoverSafetyAttempt,
  reviewSchema,
  safetyState,
  startSafetyAttempt,
} from './testnet-safety';
import {
  classifySettlement,
  type SettlementExpectation,
  type SettlementReceipt,
} from './settlement';

const symbols = ['STON', 'NOT', 'USDT'] as const;
const sampleWallet = '0:' + 'a'.repeat(64);
const sampleRouter = '0:' + 'e'.repeat(64);
const sampleOutput = '0:' + 'f'.repeat(64);
const masters = ['b', 'c', 'd'].map((c) => '0:' + c.repeat(64));
const sessionSchema = z.strictObject({
  schemaVersion: z.literal(1),
  environment: z.literal('simulation'),
  id: z.string().min(1).max(60),
  revision: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),
  items: z
    .array(
      z.strictObject({
        symbol: z.enum(symbols),
        review: reviewSchema,
        minimumOutputUnits: z.literal('990000000'),
        queryId: z.string().regex(/^[1-3]$/),
        messageHash: z
          .string()
          .regex(/^[a-f0-9]{64}$/)
          .nullable(),
        attempt: z
          .unknown()
          .transform((v) => (v === null ? null : parseSafetyAttempt(v))),
        receipt: z.unknown().transform((v) => (v === null ? null : v)),
      }),
    )
    .length(3),
});
export type CleanupSession = z.infer<typeof sessionSchema>;
export function cleanupStates(s: CleanupSession) {
  return s.items.map((i) =>
    i.attempt ? safetyState(i.attempt) : ('selected' as const),
  );
}
export function parseCleanupSession(value: unknown): CleanupSession {
  const s = sessionSchema.parse(value);
  let unfinished = false;
  s.items.forEach((item, index) => {
    if (
      item.symbol !== symbols[index] ||
      item.queryId !== String(index + 1) ||
      item.review.id !== `${s.id}:${index}` ||
      item.review.wallet !== sampleWallet ||
      item.review.chain !== '-3' ||
      item.review.inputMaster !== masters[index] ||
      item.review.outputMaster !== sampleOutput ||
      item.review.units !== '1000000000'
    )
      throw new Error('INVALID_SESSION');
    if (item.attempt) {
      if (
        unfinished ||
        JSON.stringify(item.attempt.review) !== JSON.stringify(item.review)
      )
        throw new Error('INVALID_SESSION');
      const state = safetyState(item.attempt);
      if (
        ['submitted', 'confirming', 'completed', 'partial', 'aborted'].includes(
          state,
        ) &&
        !item.messageHash
      )
        throw new Error('INVALID_SESSION');
      if (['completed', 'partial', 'aborted'].includes(state)) {
        if (classifySettlement(expectation(item), item.receipt) !== state)
          throw new Error('INVALID_RECEIPT');
      } else if (item.receipt !== null) throw new Error('INVALID_RECEIPT');
      if (state !== 'completed') unfinished = true;
    } else {
      if (item.messageHash || item.receipt !== null)
        throw new Error('INVALID_SESSION');
      unfinished = true;
    }
  });
  return s;
}
export function createCleanupSession(id: string, now: number): CleanupSession {
  return parseCleanupSession({
    schemaVersion: 1,
    environment: 'simulation',
    id,
    revision: 0,
    items: symbols.map((symbol, index) => ({
      symbol,
      queryId: String(index + 1),
      minimumOutputUnits: '990000000',
      messageHash: null,
      attempt: null,
      receipt: null,
      review: {
        id: `${id}:${index}`,
        wallet: sampleWallet,
        chain: '-3',
        quoteId: `fixture-${index}`,
        issuedAt: now,
        expiresAt: now + 60000,
        inputMaster: masters[index],
        outputMaster: sampleOutput,
        units: '1000000000',
      },
    })),
  });
}
function changed(s: CleanupSession) {
  s.revision++;
  return parseCleanupSession(s);
}
function assertNoPending(s: CleanupSession) {
  if (
    cleanupStates(s).some((state) => !['selected', 'completed'].includes(state))
  )
    throw new Error('SESSION_PAUSED');
}
export function refreshCleanupReviews(value: CleanupSession, now: number) {
  const s = parseCleanupSession(value);
  assertNoPending(s);
  for (const item of s.items)
    if (!item.attempt)
      item.review = { ...item.review, issuedAt: now, expiresAt: now + 60000 };
  return changed(s);
}
export function claimCleanupItem(value: CleanupSession, now: number) {
  const s = parseCleanupSession(value);
  assertNoPending(s);
  const item = s.items.find((i) => !i.attempt);
  if (!item) throw new Error('SESSION_FINISHED');
  item.attempt = startSafetyAttempt(
    item.review,
    { address: sampleWallet, chain: '-3' },
    now,
  );
  return changed(s);
}
function active(s: CleanupSession) {
  const item = s.items.find(
    (i) =>
      i.attempt &&
      !['completed', 'partial', 'aborted', 'rejected'].includes(
        safetyState(i.attempt),
      ),
  );
  if (!item?.attempt) throw new Error('NO_PENDING_ATTEMPT');
  return item;
}
export function respondCleanupItem(
  value: CleanupSession,
  result: 'submitted' | 'rejected' | 'unknown',
  now: number,
) {
  const s = parseCleanupSession(value),
    item = active(s),
    state = safetyState(item.attempt!);
  if (result === 'unknown')
    item.attempt = appendSafetyEvent(item.attempt!, 'status_unknown', now);
  else if (result === 'rejected')
    item.attempt = appendSafetyEvent(item.attempt!, 'signature_rejected', now);
  else {
    if (item.messageHash || !['awaiting_signature', 'unknown'].includes(state))
      throw new Error('DUPLICATE_RESPONSE');
    // A deterministic synthetic message identity. Never used as a blockchain message hash.
    item.messageHash = String(item.queryId).repeat(64);
    item.attempt = appendSafetyEvent(
      item.attempt!,
      state === 'unknown' ? 'transaction_found' : 'message_returned',
      now,
    );
  }
  return changed(s);
}
function expectation(
  item: CleanupSession['items'][number],
): SettlementExpectation {
  if (!item.messageHash) throw new Error('MESSAGE_REQUIRED');
  return {
    environment: 'simulation',
    chain: '-3',
    attemptId: item.review.id,
    wallet: item.review.wallet,
    router: sampleRouter,
    inputMaster: item.review.inputMaster,
    outputMaster: item.review.outputMaster,
    inputUnits: item.review.units,
    minimumOutputUnits: item.minimumOutputUnits,
    queryId: item.queryId,
    messageHash: item.messageHash,
  };
}
/** Only the offline UI can generate this fixture; it cannot establish real settlement. */
export function fixtureSettlement(
  value: CleanupSession,
  outcome: 'completed' | 'partial' | 'aborted',
): SettlementReceipt {
  const item = active(parseCleanupSession(value));
  return {
    ...expectation(item),
    transactionHash: '9'.repeat(64),
    recipient: sampleWallet,
    traceComplete: true,
    successful: true,
    outputUnits:
      outcome === 'completed'
        ? '1000000000'
        : outcome === 'partial'
          ? '500000000'
          : '0',
    refundUnits: outcome === 'aborted' ? item.review.units : '0',
  };
}
export function settleCleanupItem(
  value: CleanupSession,
  receipt: unknown,
  now: number,
) {
  const s = parseCleanupSession(value),
    item = active(s);
  const result = classifySettlement(expectation(item), receipt);
  if (result === 'unknown') throw new Error('EVIDENCE_MISMATCH');
  if (safetyState(item.attempt!) === 'submitted')
    item.attempt = appendSafetyEvent(item.attempt!, 'transaction_found', now);
  item.attempt = appendSafetyEvent(
    item.attempt!,
    result === 'completed'
      ? 'receipt_verified'
      : result === 'partial'
        ? 'partial_verified'
        : 'abort_verified',
    now,
  );
  item.receipt = receipt;
  return changed(s);
}
export function recoverCleanupSession(value: CleanupSession, now: number) {
  const s = parseCleanupSession(value);
  let mutated = false;
  for (const item of s.items)
    if (item.attempt) {
      const before = safetyState(item.attempt);
      item.attempt = recoverSafetyAttempt(item.attempt, now);
      if (before !== safetyState(item.attempt)) mutated = true;
    }
  return mutated ? changed(s) : s;
}
export function cleanupCanClear(value: CleanupSession) {
  const states = cleanupStates(parseCleanupSession(value));
  return !states.some((state) =>
    ['awaiting_signature', 'submitted', 'confirming', 'unknown'].includes(
      state,
    ),
  );
}
