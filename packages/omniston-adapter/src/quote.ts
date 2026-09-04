import { z } from 'zod';
import type { AssetId, QuoteRequest } from '@ston-fi/omniston-sdk';
import {
  normalizeMainnetAddress,
  reviewedAssets,
} from '@sweepdock/core/assets';
import {
  quoteInputSchema,
  quotePreviewSchema,
  ReadError,
  unitsSchema,
  type QuoteInput,
  type QuotePreview,
} from '@sweepdock/core/read-models';

const tonAssetSchema = z.object({
  chain: z.object({
    $case: z.literal('ton'),
    value: z.object({
      kind: z.discriminatedUnion('$case', [
        z.object({ $case: z.literal('native'), value: z.object({}) }),
        z.object({ $case: z.literal('jetton'), value: z.string().max(70) }),
      ]),
    }),
  }),
});
const chunkSchema = z.object({
  protocol: z.enum(['StonFiV1', 'StonFiV2']),
  inputUnits: unitsSchema,
  outputUnits: unitsSchema,
});
const stepSchema = z.object({
  inputAsset: tonAssetSchema,
  outputAsset: tonAssetSchema,
  chunks: z.array(chunkSchema).min(1).max(1),
});
const rawQuoteSchema = z.object({
  quoteId: z.string().min(1).max(128),
  inputAsset: tonAssetSchema,
  outputAsset: tonAssetSchema,
  inputUnits: unitsSchema,
  outputUnits: unitsSchema,
  integratorFeeUnits: z.literal('0'),
  protocolFeeUnits: unitsSchema,
  quoteTimestamp: z.number().int().positive(),
  gasBudget: unitsSchema.optional(),
  estimatedGasConsumption: unitsSchema.optional(),
  settlementData: z.object({
    $case: z.literal('swap'),
    value: z.object({
      routes: z
        .array(z.object({ steps: z.array(stepSchema).min(1).max(3) }))
        .length(1),
      minOutputAmount: unitsSchema,
    }),
  }),
});
function asset(id: QuoteInput['input'] | QuoteInput['output']): AssetId {
  return {
    chain: {
      $case: 'ton',
      value: {
        kind:
          id === 'TON'
            ? { $case: 'native', value: {} }
            : {
                $case: 'jetton',
                value: reviewedAssets.find((asset) => asset.id === id)!.master,
              },
      },
    },
  };
}
function identity(value: z.infer<typeof tonAssetSchema>): string {
  return value.chain.value.kind.$case === 'native'
    ? 'TON'
    : normalizeMainnetAddress(value.chain.value.kind.value);
}
function expectedIdentity(
  id: QuoteInput['input'] | QuoteInput['output'],
): string {
  return id === 'TON'
    ? 'TON'
    : reviewedAssets.find((asset) => asset.id === id)!.master;
}
export function makeQuoteRequest(input: QuoteInput): QuoteRequest {
  const request = quoteInputSchema.parse(input);
  return {
    inputAsset: asset(request.input),
    outputAsset: asset(request.output),
    amount: { $case: 'inputUnits', value: request.inputUnits },
    integratorFeePips: 0,
    settlementParams: [
      {
        params: {
          $case: 'swap',
          value: {
            maxPriceSlippagePips: 10000,
            maxRoutes: 1,
            allowRiskyRoutes: false,
            flexibleIntegratorFee: false,
          },
        },
      },
    ],
  };
}
export function normalizeQuote(
  raw: unknown,
  request: QuoteInput,
  now: number,
): QuotePreview {
  try {
    quoteInputSchema.parse(request);
    const quote = rawQuoteSchema.parse(raw);
    const inputId = expectedIdentity(request.input);
    const outputId = expectedIdentity(request.output);
    const minimum = BigInt(quote.settlementData.value.minOutputAmount);
    const output = BigInt(quote.outputUnits);
    if (
      identity(quote.inputAsset) !== inputId ||
      identity(quote.outputAsset) !== outputId ||
      quote.inputUnits !== request.inputUnits ||
      output <= 0n ||
      minimum > output ||
      minimum < (output * 990000n + 999999n) / 1000000n
    )
      throw new Error();
    const steps = quote.settlementData.value.routes[0]!.steps;
    let previous = inputId;
    for (const step of steps) {
      const target = identity(step.outputAsset);
      if (
        identity(step.inputAsset) !== previous ||
        (target !== 'TON' &&
          !reviewedAssets.some((asset) => asset.master === target))
      )
        throw new Error();
      previous = target;
    }
    if (previous !== outputId) throw new Error();
    if (
      quote.gasBudget !== undefined &&
      quote.estimatedGasConsumption !== undefined &&
      BigInt(quote.estimatedGasConsumption) > BigInt(quote.gasBudget)
    )
      throw new Error();
    const quotedAtMs = quote.quoteTimestamp * 1000;
    if (now - quotedAtMs >= 30000 || quotedAtMs - now > 5000)
      throw new ReadError('STALE_QUOTE');
    return quotePreviewSchema.parse({
      network: 'ton-mainnet',
      readOnly: true,
      source: 'omniston',
      request,
      quoteId: quote.quoteId,
      expectedOutputUnits: quote.outputUnits,
      minimumOutputUnits: quote.settlementData.value.minOutputAmount,
      protocolFeeUnits: quote.protocolFeeUnits,
      gasBudgetUnits: quote.gasBudget ?? null,
      gasConsumedUnits: quote.estimatedGasConsumption ?? null,
      quotedAtMs,
      observedAtMs: now,
      previewStaleAtMs: Math.min(quotedAtMs, now) + 30000,
      providerExpiry: null,
      routes: [
        ...new Set(
          steps.flatMap((step) => step.chunks.map((chunk) => chunk.protocol)),
        ),
      ],
    });
  } catch (error) {
    if (error instanceof ReadError) throw error;
    throw new ReadError('PROVIDER_INVALID_RESPONSE');
  }
}
