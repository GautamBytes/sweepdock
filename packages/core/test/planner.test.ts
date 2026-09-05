import { describe, expect, it } from 'vitest';
import { reviewedAssets } from '../src/assets';
import type { Balances, QuotePreview } from '../src/read-models';
import { buildCleanupPlan } from '../src/planner';

const policy = {
  balanceSource: 'tonapi',
  quoteSource: 'omniston',
  supportedProtocols: ['StonFiV1', 'StonFiV2'],
};
const now = 100_000;
const owner = '0:' + 'a'.repeat(64);
export function sampleBalances(): Balances {
  return {
    network: 'ton-mainnet',
    readOnly: true,
    source: 'tonapi',
    address: owner,
    observedAtMs: now,
    nativeBalanceUnits: '600000000',
    complete: true,
    assets: reviewedAssets.map((a) => ({
      ...a,
      units: '1000000000',
      reviewedId: a.id,
      eligible: true,
      reason: null,
    })),
  };
}
export function sampleQuote(
  input: 'STON' | 'NOT' | 'USDT' = 'STON',
): QuotePreview {
  return {
    network: 'ton-mainnet',
    readOnly: true,
    source: 'omniston',
    request: { input, output: 'TON', inputUnits: '1000000000' },
    quoteId: input,
    expectedOutputUnits: '1000000000',
    minimumOutputUnits: '990000000',
    protocolFeeUnits: '0',
    gasBudgetUnits: '260000000',
    gasConsumedUnits: '37500000',
    quotedAtMs: now,
    observedAtMs: now,
    previewStaleAtMs: now + 30000,
    providerExpiry: null,
    routes: ['StonFiV2'],
  };
}
function plan(
  balances = sampleBalances(),
  quotes = [sampleQuote(), sampleQuote('NOT')],
  at = now,
) {
  return buildCleanupPlan({
    policy,
    balances,
    selected: ['STON', 'NOT'],
    output: 'TON',
    quotes,
    failures: {},
    now: at,
  });
}
describe('cleanup plan', () => {
  it('sums minimum returns and gas, reserving TON without counting unsettled proceeds', () => {
    const result = plan();
    expect(result.withinBudget).toBe(true);
    expect(result.totals).toEqual({
      expectedOutput: 2000000000n,
      minimumOutput: 1980000000n,
      gasBudget: 520000000n,
      gasSpent: 75000000n,
      reserve: 50000000n,
      requiredTon: 570000000n,
    });
    expect(result.rows.map((r) => r.reason)).toEqual([
      'WITHIN_COST_LIMIT',
      'WITHIN_COST_LIMIT',
    ]);
  });
  it('rejects combined insufficiency although either item alone fits', () => {
    const b = sampleBalances();
    b.nativeBalanceUnits = '500000000';
    expect(plan(b).withinBudget).toBe(false);
  });
  it('excludes expensive tokens from totals, using minimum rather than optimistic output', () => {
    const q = sampleQuote('NOT');
    q.minimumOutputUnits = '100000000';
    const result = plan(sampleBalances(), [sampleQuote(), q]);
    expect(result.rows[1]?.reason).toBe('COST_TOO_HIGH');
    expect(result.totals.gasBudget).toBe(260000000n);
  });
  it.each([60000, -6000])('rejects stale/future balances (%d)', (offset) => {
    const b = sampleBalances();
    b.observedAtMs = now - offset;
    expect(plan(b).rows.every((r) => r.reason === 'BALANCE_STALE')).toBe(true);
  });
  it('rejects incomplete balances and duplicate identities', () => {
    const b = sampleBalances();
    b.complete = false;
    expect(plan(b).withinBudget).toBe(false);
    b.complete = true;
    b.assets.push(b.assets[0]!);
    expect(plan(b).rows[0]?.reason).toBe('ASSET_UNAVAILABLE');
  });
  it('does not trust the reviewedId or eligibility boolean over contract identity', () => {
    const b = sampleBalances();
    b.assets[0]!.master = '0:' + 'f'.repeat(64);
    expect(plan(b).rows[0]?.reason).toBe('ASSET_UNAVAILABLE');
  });
  it('binds each quote to the exact current amount and target', () => {
    const q = sampleQuote();
    q.request.inputUnits = '1';
    expect(plan(sampleBalances(), [q]).rows[0]?.reason).toBe('QUOTE_MISMATCH');
    q.request.inputUnits = '1000000000';
    q.request.output = 'USDT';
    expect(plan(sampleBalances(), [q]).rows[0]?.reason).toBe('QUOTE_MISMATCH');
  });
  it('requires fresh bounded quote timestamps and sensible amounts', () => {
    for (const q of [
      { ...sampleQuote(), previewStaleAtMs: now + 31000 },
      { ...sampleQuote(), quotedAtMs: now + 6000 },
      { ...sampleQuote(), minimumOutputUnits: '2000000000' },
      { ...sampleQuote(), gasBudgetUnits: '1' },
    ]) {
      expect(plan(sampleBalances(), [q]).withinBudget).toBe(false);
    }
    expect(
      plan(sampleBalances(), [sampleQuote()], now + 30000).rows[0]?.reason,
    ).toBe('STALE_QUOTE');
  });
  it('keeps provider failures specific without approving a partial plan', () => {
    const result = buildCleanupPlan({
      policy,
      balances: sampleBalances(),
      selected: ['STON', 'NOT'],
      output: 'TON',
      quotes: [sampleQuote()],
      failures: { NOT: 'NO_QUOTE' },
      now,
    });
    expect(result.rows[1]?.reason).toBe('NO_QUOTE');
    expect(result.rows[0]?.reason).toBe('WITHIN_COST_LIMIT');
  });
  it('never quotes the output token, deduplicates selection, and requires USDT gas valuation', () => {
    const result = buildCleanupPlan({
      policy,
      balances: sampleBalances(),
      selected: ['USDT', 'STON', 'STON'],
      output: 'USDT',
      quotes: [
        {
          ...sampleQuote(),
          request: { ...sampleQuote().request, output: 'USDT' },
        },
      ],
      failures: {},
      now,
    });
    expect(result.rows.map((r) => r.reason)).toEqual([
      'ALREADY_OUTPUT',
      'COST_DATA_UNAVAILABLE',
    ]);
    expect(result.withinBudget).toBe(false);
  });
});
