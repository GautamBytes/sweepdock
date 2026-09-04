import type { QuotePreview } from '@sweepdock/core/read-models';
import { assessCost } from '@sweepdock/core';
export function assessPreview(
  quote: QuotePreview,
  nativeBalance: string | null,
  now: number,
): { reason: string; acceptable: boolean } {
  if (now >= quote.previewStaleAtMs)
    return { reason: 'STALE_QUOTE', acceptable: false };
  if (
    quote.gasBudgetUnits === null ||
    quote.gasConsumedUnits === null ||
    quote.request.output !== 'TON'
  )
    return { reason: 'COST_DATA_UNAVAILABLE', acceptable: false };
  const decision = assessCost({
    comparableOutputUnits: BigInt(quote.expectedOutputUnits),
    incrementalNetworkCostUnits: BigInt(quote.gasConsumedUnits),
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
