import { readPolicySchema, type ReadPolicy } from './providers';
import { reviewedAssets } from './asset-registry';
import { assessCost } from './policy';
import { gasValueInUsdt } from './preview-cost';
import {
  balancesSchema,
  quotePreviewSchema,
  type Balances,
  type QuoteInput,
  type QuotePreview,
} from './read-models';

export type CleanupAsset = QuoteInput['input'];
export const TON_RESERVE = 50_000_000n;
export function freshBalance(balances: Balances, now: number) {
  return (
    Number.isSafeInteger(now) &&
    now >= 0 &&
    balances.observedAtMs <= now + 5000 &&
    now - balances.observedAtMs < 60_000
  );
}
export function selectableAsset(balances: Balances, id: CleanupAsset) {
  const matches = balances.assets.filter((a) => a.reviewedId === id);
  const asset = matches[0];
  const identity = reviewedAssets.find((a) => a.id === id);
  return matches.length === 1 &&
    asset &&
    identity &&
    asset.eligible &&
    asset.reason === null &&
    asset.master === identity.master &&
    asset.decimals === identity.decimals &&
    BigInt(asset.units) > 0n
    ? asset
    : null;
}
export type PlanReason =
  | 'WITHIN_COST_LIMIT'
  | 'BALANCE_STALE'
  | 'BALANCE_INCOMPLETE'
  | 'ASSET_UNAVAILABLE'
  | 'ALREADY_OUTPUT'
  | 'NO_QUOTE'
  | 'QUOTE_MISMATCH'
  | 'STALE_QUOTE'
  | 'COST_TOO_HIGH'
  | 'COST_DATA_UNAVAILABLE'
  | 'INSUFFICIENT_NATIVE_BALANCE'
  | 'PROVIDER_UNAVAILABLE'
  | 'RATE_LIMITED'
  | 'PROVIDER_INVALID_RESPONSE';
export interface PlanRow {
  asset: CleanupAsset;
  reason: PlanReason;
  quote: QuotePreview | null;
}
export interface CleanupPlan {
  rows: PlanRow[];
  withinBudget: boolean;
  totals: {
    expectedOutput: bigint;
    minimumOutput: bigint;
    gasBudget: bigint;
    gasSpent: bigint;
    reserve: bigint;
    requiredTon: bigint;
  };
}

/** A read-only recommendation, never an executable quote or signing authorization. */
export function buildCleanupPlan({
  balances: rawBalances,
  policy: rawPolicy,
  selected,
  output,
  quotes,
  failures,
  now,
}: {
  balances: Balances;
  policy: ReadPolicy;
  selected: CleanupAsset[];
  output: QuoteInput['output'];
  quotes: QuotePreview[];
  failures: Partial<Record<CleanupAsset, PlanReason>>;
  now: number;
}): CleanupPlan {
  const balances = balancesSchema.parse(rawBalances);
  const policy = readPolicySchema.parse(rawPolicy);
  const rows = [...new Set(selected)].map((asset): PlanRow => {
    const found = quotes.filter((q) => q.request.input === asset);
    const checked =
      found.length === 1 ? quotePreviewSchema.safeParse(found[0]) : null;
    const quote = checked?.success ? checked.data : null;
    function row(reason: PlanReason): PlanRow {
      return { asset, reason, quote };
    }
    if (
      balances.source !== policy.balanceSource ||
      (quote && quote.source !== policy.quoteSource)
    )
      return row('PROVIDER_INVALID_RESPONSE');
    if (!balances.complete) return row('BALANCE_INCOMPLETE');
    if (!freshBalance(balances, now)) return row('BALANCE_STALE');
    const balance = selectableAsset(balances, asset);
    if (!balance) return row('ASSET_UNAVAILABLE');
    if (asset === output) return row('ALREADY_OUTPUT');
    if (!quote)
      return row(
        found.length
          ? 'PROVIDER_INVALID_RESPONSE'
          : (failures[asset] ?? 'NO_QUOTE'),
      );
    if (
      quote.request.output !== output ||
      quote.request.inputUnits !== balance.units
    )
      return row('QUOTE_MISMATCH');
    if (now >= quote.previewStaleAtMs || now - quote.quotedAtMs >= 30000)
      return row('STALE_QUOTE');
    if (
      quote.quotedAtMs > now + 5000 ||
      quote.observedAtMs > now + 5000 ||
      quote.observedAtMs < quote.quotedAtMs - 5000 ||
      quote.previewStaleAtMs > quote.quotedAtMs + 30000 ||
      quote.previewStaleAtMs <= quote.quotedAtMs ||
      !quote.routes.length ||
      quote.routes.some((r) => !policy.supportedProtocols.includes(r)) ||
      BigInt(quote.minimumOutputUnits) > BigInt(quote.expectedOutputUnits)
    )
      return row('PROVIDER_INVALID_RESPONSE');
    if (quote.gasBudgetUnits === null || quote.gasConsumedUnits === null)
      return row('COST_DATA_UNAVAILABLE');
    if (BigInt(quote.gasConsumedUnits) > BigInt(quote.gasBudgetUnits))
      return row('PROVIDER_INVALID_RESPONSE');
    const cost =
      output === 'TON'
        ? BigInt(quote.gasConsumedUnits)
        : gasValueInUsdt(quote, now);
    if (cost === null) return row('COST_DATA_UNAVAILABLE');
    const decision = assessCost({
      comparableOutputUnits: BigInt(quote.minimumOutputUnits),
      incrementalNetworkCostUnits: cost,
      nativeBalanceUnits: BigInt(balances.nativeBalanceUnits),
      nativeUpfrontUnits: BigInt(quote.gasBudgetUnits),
      nativeReserveUnits: TON_RESERVE,
      maxCostBps: 1000,
      costsKnown: true,
    });
    return row(decision.executable ? 'WITHIN_COST_LIMIT' : decision.reason);
  });
  const totals = {
    expectedOutput: 0n,
    minimumOutput: 0n,
    gasBudget: 0n,
    gasSpent: 0n,
    reserve: TON_RESERVE,
    requiredTon: TON_RESERVE,
  };
  const recommended = rows.filter((r) => r.reason === 'WITHIN_COST_LIMIT');
  for (const row of recommended) {
    const q = row.quote!;
    totals.expectedOutput += BigInt(q.expectedOutputUnits);
    totals.minimumOutput += BigInt(q.minimumOutputUnits);
    totals.gasBudget += BigInt(q.gasBudgetUnits!);
    totals.gasSpent += BigInt(q.gasConsumedUnits!);
  }
  totals.requiredTon += totals.gasBudget;
  return {
    rows,
    totals,
    withinBudget:
      recommended.length > 0 &&
      BigInt(balances.nativeBalanceUnits) >= totals.requiredTon,
  };
}
