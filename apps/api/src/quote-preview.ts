import { readQuote } from '@sweepdock/omniston-adapter';
import {
  quotePreviewSchema,
  ReadError,
  type QuoteInput,
  type QuotePreview,
} from '@sweepdock/core/read-models';

function validateRead(quote: QuotePreview, input: QuoteInput, now: number) {
  if (
    quote.request.input !== input.input ||
    quote.request.output !== input.output ||
    quote.request.inputUnits !== input.inputUnits ||
    BigInt(quote.minimumOutputUnits) <= 0n ||
    BigInt(quote.minimumOutputUnits) > BigInt(quote.expectedOutputUnits)
  )
    throw new ReadError('PROVIDER_INVALID_RESPONSE');
  if (
    now >= quote.previewStaleAtMs ||
    now - quote.quotedAtMs >= 30000 ||
    quote.quotedAtMs - now > 5000 ||
    quote.previewStaleAtMs > quote.quotedAtMs + 30000
  )
    throw new ReadError('STALE_QUOTE');
}

export async function readQuotePreview(
  input: QuoteInput,
  signal: AbortSignal,
  reader = readQuote,
  now = Date.now,
): Promise<QuotePreview> {
  const boundedSignal = AbortSignal.any([signal, AbortSignal.timeout(20000)]);
  const quote = quotePreviewSchema.parse(await reader(input, boundedSignal));
  validateRead(quote, input, now());
  quote.gasValuation = null;
  if (input.output === 'USDT' && quote.gasConsumedUnits !== null) {
    const referenceInput: QuoteInput = {
      input: 'USDT',
      output: 'TON',
      inputUnits: quote.expectedOutputUnits,
    };
    try {
      const reference = quotePreviewSchema.parse(
        await reader(referenceInput, boundedSignal),
      );
      validateRead(reference, referenceInput, now());
      quote.gasValuation = {
        source: 'omniston-reverse-quote',
        referenceQuoteId: reference.quoteId,
        inputUsdtUnits: referenceInput.inputUnits,
        minimumTonUnits: reference.minimumOutputUnits,
        quotedAtMs: reference.quotedAtMs,
        staleAtMs: Math.min(reference.previewStaleAtMs, quote.previewStaleAtMs),
      };
    } catch {
      // A missing reference must not turn an otherwise useful quote into free gas.
      quote.gasValuation = null;
    }
  }
  if (signal.aborted) throw new ReadError('CANCELLED');
  validateRead(quote, input, now());
  return quote;
}
