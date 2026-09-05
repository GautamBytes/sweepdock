import { z } from 'zod';
import { unitsSchema } from './read-models';
const address = z.string().regex(/^0:[a-f0-9]{64}$/);
const hash = z.string().regex(/^[a-f0-9]{64}$/);
const positive = unitsSchema.pipe(z.string().refine((v) => BigInt(v) > 0n));
const expectationSchema = z.object({
  environment: z.enum(['simulation', 'testnet']),
  chain: z.literal('-3'),
  attemptId: z.string().min(1).max(100),
  wallet: address,
  router: address,
  inputMaster: address,
  outputMaster: address,
  inputUnits: positive,
  minimumOutputUnits: positive,
  queryId: unitsSchema.pipe(z.string().refine((v) => BigInt(v) < 1n << 64n)),
  messageHash: hash,
});
export type SettlementExpectation = z.infer<typeof expectationSchema>;
const receiptSchema = expectationSchema
  .extend({
    transactionHash: hash,
    recipient: address,
    traceComplete: z.boolean(),
    successful: z.boolean(),
    outputUnits: unitsSchema,
    refundUnits: unitsSchema,
  })
  .strict();
export type SettlementReceipt = z.infer<typeof receiptSchema>;

/** Correlation of normalized observations only. This does not authenticate chain evidence.
 * A future provider adapter must verify the full trace and token wallet identities before calling.
 * Fixture observations cannot be used with a testnet expectation. Mainnet is unsupported.
 */
export function classifySettlement(
  expected: unknown,
  observation: unknown,
): 'completed' | 'partial' | 'aborted' | 'unknown' {
  const e = expectationSchema.safeParse(expected),
    r = receiptSchema.safeParse(observation);
  if (!e.success || !r.success) return 'unknown';
  const a = e.data,
    b = r.data;
  const keys = [
    'environment',
    'chain',
    'attemptId',
    'wallet',
    'router',
    'inputMaster',
    'outputMaster',
    'inputUnits',
    'minimumOutputUnits',
    'queryId',
    'messageHash',
  ] as const;
  if (
    keys.some((k) => a[k] !== b[k]) ||
    b.recipient !== a.wallet ||
    !b.traceComplete ||
    !b.successful ||
    a.inputMaster === a.outputMaster
  )
    return 'unknown';
  const output = BigInt(b.outputUnits),
    refund = BigInt(b.refundUnits),
    input = BigInt(a.inputUnits);
  if (refund > input) return 'unknown';
  if (refund === 0n && output >= BigInt(a.minimumOutputUnits))
    return 'completed';
  if (refund === input && output === 0n) return 'aborted';
  if (output > 0n || refund > 0n) return 'partial';
  return 'unknown';
}
