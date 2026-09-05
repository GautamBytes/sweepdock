import { z } from 'zod';

export const providerIdSchema = z.string().regex(/^[a-z][a-z0-9-]{0,39}$/);

export const unitsSchema = z.string().regex(/^(0|[1-9]\d{0,77})$/);
export const assetIdSchema = z.enum(['STON', 'NOT', 'USDT', 'TON']);
export const quoteInputSchema = z
  .object({
    input: z.enum(['STON', 'NOT', 'USDT']),
    output: z.enum(['TON', 'USDT']),
    inputUnits: unitsSchema.pipe(
      z.string().refine((value) => BigInt(value) > 0n),
    ),
  })
  .strict()
  .refine(
    (value) => value.input !== value.output,
    'Input and output must differ',
  );
export type QuoteInput = z.infer<typeof quoteInputSchema>;
export const balanceAssetSchema = z.object({
  master: z.string().regex(/^0:[a-f0-9]{64}$/),
  symbol: z.string().max(24),
  name: z.string().max(80),
  decimals: z.number().int().min(0).max(255),
  units: unitsSchema,
  reviewedId: z.enum(['STON', 'NOT', 'USDT']).nullable(),
  eligible: z.boolean(),
  reason: z
    .enum([
      'UNREVIEWED',
      'METADATA_MISMATCH',
      'UNSUPPORTED_TOKEN',
      'ZERO_BALANCE',
    ])
    .nullable(),
});
export const balancesSchema = z.object({
  network: z.literal('ton-mainnet'),
  readOnly: z.literal(true),
  source: providerIdSchema,
  address: z.string().regex(/^0:[a-f0-9]{64}$/),
  observedAtMs: z.number().int().nonnegative(),
  nativeBalanceUnits: unitsSchema,
  complete: z.boolean(),
  assets: z.array(balanceAssetSchema).max(300),
});
export type Balances = z.infer<typeof balancesSchema>;
export const gasValuationSchema = z.object({
  source: z.literal('reverse-quote'),
  provider: providerIdSchema,
  referenceQuoteId: z.string().min(1).max(128),
  inputUsdtUnits: unitsSchema.pipe(
    z.string().refine((value) => BigInt(value) > 0n),
  ),
  minimumTonUnits: unitsSchema.pipe(
    z.string().refine((value) => BigInt(value) > 0n),
  ),
  quotedAtMs: z.number().int().nonnegative(),
  staleAtMs: z.number().int().nonnegative(),
});
export const quotePreviewSchema = z.object({
  network: z.literal('ton-mainnet'),
  readOnly: z.literal(true),
  source: providerIdSchema,
  request: quoteInputSchema,
  quoteId: z.string().min(1).max(128),
  expectedOutputUnits: unitsSchema,
  minimumOutputUnits: unitsSchema,
  protocolFeeUnits: unitsSchema,
  gasBudgetUnits: unitsSchema.nullable(),
  gasConsumedUnits: unitsSchema.nullable(),
  quotedAtMs: z.number().int().nonnegative(),
  observedAtMs: z.number().int().nonnegative(),
  previewStaleAtMs: z.number().int().nonnegative(),
  providerExpiry: z.null(),
  routes: z.array(z.string().min(1).max(64)).max(8),
  gasValuation: gasValuationSchema.nullable().optional(),
});
export type QuotePreview = z.infer<typeof quotePreviewSchema>;
export const apiErrorCodes = [
  'INVALID_REQUEST',
  'PROVIDER_UNAVAILABLE',
  'PROVIDER_INVALID_RESPONSE',
  'RATE_LIMITED',
  'REQUEST_TOO_LARGE',
  'REQUEST_TIMEOUT',
  'NO_QUOTE',
  'STALE_QUOTE',
  'CANCELLED',
  'READ_ONLY_DISABLED',
] as const;
export type ApiErrorCode = (typeof apiErrorCodes)[number];
export class ReadError extends Error {
  constructor(readonly code: ApiErrorCode) {
    super(code);
  }
}
