import type { QuotePreview } from './read-models';
import { assessCost } from './policy';
export function gasValueInUsdt(
  quote: QuotePreview,
  now: number,
): bigint | null {
  const rate = quote.gasValuation;
  if (
    !rate ||
    rate.provider !== quote.source ||
    quote.request.output !== 'USDT' ||
    quote.gasConsumedUnits === null ||
    now >= quote.previewStaleAtMs ||
    now >= rate.staleAtMs ||
    now - rate.quotedAtMs >= 30000 ||
    rate.quotedAtMs - now > 5000 ||
    rate.staleAtMs > rate.quotedAtMs + 30000 ||
    rate.inputUsdtUnits !== quote.expectedOutputUnits ||
    BigInt(rate.minimumTonUnits) <= 0n
  )
    return null;
  const numerator =
    BigInt(quote.gasConsumedUnits) * BigInt(rate.inputUsdtUnits);
  const denominator = BigInt(rate.minimumTonUnits);
  return (numerator + denominator - 1n) / denominator;
}
export function assessPreview(
  quote: QuotePreview,
  nativeBalance: string | null,
  now: number,
): { reason: string; acceptable: boolean } {
  if (now >= quote.previewStaleAtMs)
    return { reason: 'STALE_QUOTE', acceptable: false };
  if (quote.gasBudgetUnits === null || quote.gasConsumedUnits === null)
    return { reason: 'COST_DATA_UNAVAILABLE', acceptable: false };
  const cost =
    quote.request.output === 'TON'
      ? BigInt(quote.gasConsumedUnits)
      : gasValueInUsdt(quote, now);
  if (cost === null)
    return { reason: 'COST_DATA_UNAVAILABLE', acceptable: false };
  const decision = assessCost({
    comparableOutputUnits: BigInt(
      quote.request.output === 'USDT'
        ? quote.minimumOutputUnits
        : quote.expectedOutputUnits,
    ),
    incrementalNetworkCostUnits: cost,
    nativeBalanceUnits:
      BigInt(nativeBalance ?? quote.gasBudgetUnits) +
      (nativeBalance === null ? 50000000n : 0n),
    nativeUpfrontUnits: BigInt(quote.gasBudgetUnits),
    nativeReserveUnits: 50000000n,
    maxCostBps: 1000,
    costsKnown: true,
  });
  if (!decision.executable)
    return { reason: decision.reason, acceptable: false };
  if (nativeBalance === null)
    return { reason: 'BALANCE_REQUIRED', acceptable: false };
  return { reason: 'WITHIN_COST_LIMIT', acceptable: true };
}
