import {
  validateQuotePreview,
  type QuoteProvider,
  type ReadPolicy,
} from '@sweepdock/core/providers';
import {
  ReadError,
  type QuoteInput,
  type QuotePreview,
} from '@sweepdock/core/read-models';

export async function readQuotePreview(
  input: QuoteInput,
  signal: AbortSignal,
  provider: QuoteProvider,
  policy: ReadPolicy,
  now = Date.now,
): Promise<QuotePreview> {
  const boundedSignal = AbortSignal.any([signal, AbortSignal.timeout(20000)]);
  if (provider.id !== policy.quoteSource)
    throw new ReadError('PROVIDER_INVALID_RESPONSE');
  const quote = validateQuotePreview(
    await provider.read(input, boundedSignal),
    input,
    policy,
    now(),
  );
  quote.gasValuation = null;
  if (input.output === 'USDT' && quote.gasConsumedUnits !== null) {
    const referenceInput: QuoteInput = {
      input: 'USDT',
      output: 'TON',
      inputUnits: quote.expectedOutputUnits,
    };
    try {
      const reference = validateQuotePreview(
        await provider.read(referenceInput, boundedSignal),
        referenceInput,
        policy,
        now(),
      );
      quote.gasValuation = {
        source: 'reverse-quote',
        provider: provider.id,
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
  validateQuotePreview(quote, input, policy, now());
  return quote;
}
