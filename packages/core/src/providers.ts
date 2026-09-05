import { z } from 'zod';
import {
  balancesSchema,
  providerIdSchema,
  quotePreviewSchema,
  ReadError,
  type Balances,
  type QuoteInput,
  type QuotePreview,
} from './read-models';

export const readPolicySchema = z
  .object({
    balanceSource: providerIdSchema,
    quoteSource: providerIdSchema,
    supportedProtocols: z
      .array(z.string().regex(/^[A-Za-z0-9_-]{1,64}$/))
      .min(1)
      .max(16),
  })
  .strict();
export type ReadPolicy = z.infer<typeof readPolicySchema>;
export interface BalanceProvider {
  readonly id: string;
  read(address: string, signal: AbortSignal): Promise<Balances>;
}
export interface QuoteProvider {
  readonly id: string;
  read(input: QuoteInput, signal: AbortSignal): Promise<QuotePreview>;
}
export interface ReadProviders {
  policy: ReadPolicy;
  balances: BalanceProvider;
  quotes: QuoteProvider;
}
export function validateBalanceSnapshot(
  value: unknown,
  address: string,
  policy: ReadPolicy,
): Balances {
  const parsed = balancesSchema.safeParse(value);
  if (
    !parsed.success ||
    parsed.data.source !== policy.balanceSource ||
    parsed.data.address !== address
  )
    throw new ReadError('PROVIDER_INVALID_RESPONSE');
  return parsed.data;
}
export function validateQuotePreview(
  value: unknown,
  input: QuoteInput,
  policy: ReadPolicy,
  now: number,
): QuotePreview {
  const parsed = quotePreviewSchema.safeParse(value);
  if (!parsed.success) throw new ReadError('PROVIDER_INVALID_RESPONSE');
  const q = parsed.data;
  if (
    q.source !== policy.quoteSource ||
    !q.routes.length ||
    q.routes.some((r) => !policy.supportedProtocols.includes(r)) ||
    q.request.input !== input.input ||
    q.request.output !== input.output ||
    q.request.inputUnits !== input.inputUnits ||
    BigInt(q.minimumOutputUnits) <= 0n ||
    BigInt(q.minimumOutputUnits) > BigInt(q.expectedOutputUnits) ||
    (q.gasBudgetUnits !== null &&
      q.gasConsumedUnits !== null &&
      BigInt(q.gasConsumedUnits) > BigInt(q.gasBudgetUnits)) ||
    (q.gasValuation && q.gasValuation.provider !== q.source)
  )
    throw new ReadError('PROVIDER_INVALID_RESPONSE');
  if (
    !Number.isSafeInteger(now) ||
    now < 0 ||
    now >= q.previewStaleAtMs ||
    now - q.quotedAtMs >= 30000 ||
    q.quotedAtMs - now > 5000 ||
    q.observedAtMs - now > 5000 ||
    q.observedAtMs < q.quotedAtMs - 5000 ||
    q.previewStaleAtMs > q.quotedAtMs + 30000 ||
    q.previewStaleAtMs <= q.quotedAtMs
  )
    throw new ReadError('STALE_QUOTE');
  return q;
}
