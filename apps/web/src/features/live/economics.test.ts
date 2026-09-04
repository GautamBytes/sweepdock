import { expect, it } from 'vitest';
import type { QuotePreview } from '@sweepdock/core/read-models';
import { assessPreview } from './economics';

const quote: QuotePreview = {
  network: 'ton-mainnet',
  readOnly: true,
  source: 'omniston',
  request: { input: 'STON', output: 'TON', inputUnits: '1000000000' },
  quoteId: 'q',
  expectedOutputUnits: '1000000000',
  minimumOutputUnits: '990000000',
  protocolFeeUnits: '100000',
  gasBudgetUnits: '260000000',
  gasConsumedUnits: '37500000',
  quotedAtMs: 1000000,
  observedAtMs: 1000000,
  previewStaleAtMs: 1030000,
  providerExpiry: null,
  routes: ['StonFiV2'],
};
it('uses consumed gas, not the full gas budget, for the cost threshold', () => {
  expect(assessPreview(quote, '1000000000', 1000001)).toMatchObject({
    acceptable: true,
  });
});
it('skips a TON quote where estimated gas exceeds ten percent', () => {
  expect(
    assessPreview(
      {
        ...quote,
        expectedOutputUnits: '100000000',
        minimumOutputUnits: '99000000',
      },
      '1000000000',
      1000001,
    ).reason,
  ).toBe('COST_TOO_HIGH');
});
it('does not subtract the protocol fee twice', () => {
  expect(
    assessPreview(
      { ...quote, protocolFeeUnits: '900000000' },
      '1000000000',
      1000001,
    ).acceptable,
  ).toBe(true);
});
it('requires upfront budget plus reserve before calling the preview affordable', () => {
  expect(assessPreview(quote, '309999999', 1000001).reason).toBe(
    'INSUFFICIENT_NATIVE_BALANCE',
  );
  expect(assessPreview(quote, '310000000', 1000001).acceptable).toBe(true);
});
it('blocks missing cost data, unvalued USDT outputs and expired local previews', () => {
  expect(
    assessPreview({ ...quote, gasConsumedUnits: null }, '1000000000', 1000001)
      .reason,
  ).toBe('COST_DATA_UNAVAILABLE');
  expect(
    assessPreview(
      { ...quote, request: { ...quote.request, output: 'USDT' } },
      '1000000000',
      1000001,
    ).reason,
  ).toBe('COST_DATA_UNAVAILABLE');
  expect(assessPreview(quote, '1000000000', 1030000).reason).toBe(
    'STALE_QUOTE',
  );
});
it('does not imply affordability without a wallet balance', () => {
  expect(assessPreview(quote, null, 1000001).reason).toBe('BALANCE_REQUIRED');
});
