import {
  buildCleanupPlan,
  makeShareableReport,
  reviewedAssets,
  transition,
} from '@sweepdock/core';
import { readPolicySchema } from '@sweepdock/core/providers';

// Synthetic, offline observations. This example performs no provider reads or signing.
const now = 100000;
const policy = readPolicySchema.parse({
  balanceSource: 'example-balances',
  quoteSource: 'example-quotes',
  supportedProtocols: ['ExamplePool'],
});
const balances = {
  network: 'ton-mainnet',
  readOnly: true,
  source: policy.balanceSource,
  address: '0:' + 'a'.repeat(64),
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
const quotes = ['STON', 'NOT'].map((input) => ({
  network: 'ton-mainnet',
  readOnly: true,
  source: policy.quoteSource,
  request: { input, output: 'TON', inputUnits: '1000000000' },
  quoteId: input,
  expectedOutputUnits: input === 'STON' ? '1000000000' : '20000000',
  minimumOutputUnits: input === 'STON' ? '990000000' : '19000000',
  protocolFeeUnits: '0',
  gasBudgetUnits: '260000000',
  gasConsumedUnits: '37500000',
  quotedAtMs: now,
  observedAtMs: now,
  previewStaleAtMs: now + 30000,
  providerExpiry: null,
  routes: ['ExamplePool'],
}));
const plan = buildCleanupPlan({
  policy,
  balances,
  selected: ['STON', 'NOT'],
  output: 'TON',
  quotes,
  failures: {},
  now,
});
const events = [
  'quote_requested',
  'quote_ready',
  'signature_requested',
  'status_unknown',
].map((kind, i) => ({
  id: `event-${i}`,
  itemId: 'private-fixture-identifier',
  kind,
  observedAt: now + i * 1000,
}));
const record = events.reduce(transition, {
  id: 'private-fixture-identifier',
  state: 'selected',
  acceptedEventIds: [],
});
console.log(
  JSON.stringify(
    {
      environment: 'offline-example',
      decisions: plan.rows.map(({ asset, reason }) => ({ asset, reason })),
      withinBudget: plan.withinBudget,
      requiredTonUnits: plan.totals.requiredTon.toString(),
      recoveryState: record.state,
      report: makeShareableReport(events),
    },
    null,
    2,
  ),
);
