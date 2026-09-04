import { expect, it } from 'vitest';
import { asset, fixture } from './fixture';
import { makeQuoteRequest, normalizeQuote } from '../src/quote';

const input = {
  input: 'STON' as const,
  output: 'USDT' as const,
  inputUnits: '1000000000',
};
it('requests swap-only TON routes, exact input, zero app fee and 1% slippage', () => {
  expect(makeQuoteRequest(input)).toMatchObject({
    amount: { $case: 'inputUnits', value: '1000000000' },
    integratorFeePips: 0,
    settlementParams: [
      {
        params: {
          $case: 'swap',
          value: {
            maxPriceSlippagePips: 10000,
            maxRoutes: 1,
            allowRiskyRoutes: false,
          },
        },
      },
    ],
  });
});
it('uses native TON as output and rejects same-asset or native input', () => {
  expect(
    makeQuoteRequest({ ...input, output: 'TON' }).outputAsset.chain,
  ).toEqual({ $case: 'ton', value: { kind: { $case: 'native', value: {} } } });
  expect(() =>
    makeQuoteRequest({ input: 'USDT', output: 'USDT', inputUnits: '1' }),
  ).toThrow();
});
it('keeps net output, minimum, consumed gas and upfront budget separate', () => {
  const result = normalizeQuote(fixture(), input, 1001000);
  expect(result).toMatchObject({
    expectedOutputUnits: '433907',
    minimumOutputUnits: '429568',
    protocolFeeUnits: '100',
    gasBudgetUnits: '260000000',
    gasConsumedUnits: '37500000',
    providerExpiry: null,
    previewStaleAtMs: 1030000,
  });
});
it('does not substitute zero for unknown gas fields', () => {
  const raw = fixture();
  delete raw.gasBudget;
  delete raw.estimatedGasConsumption;
  expect(normalizeQuote(raw, input, 1001000)).toMatchObject({
    gasBudgetUnits: null,
    gasConsumedUnits: null,
  });
});
it('accepts the observed STON.fi V1 native-TON read-only route', () => {
  const raw = fixture();
  const native = {
    chain: {
      $case: 'ton' as const,
      value: { kind: { $case: 'native' as const, value: {} } },
    },
  };
  raw.outputAsset = native;
  raw.outputUnits = '318910071';
  raw.protocolFeeUnits = '0';
  raw.gasBudget = '185000000';
  raw.estimatedGasConsumption = '35000000';
  if (raw.settlementData.$case === 'swap') {
    raw.settlementData.value.minOutputAmount = '315720971';
    const step = raw.settlementData.value.routes[0]!.steps[0]!;
    step.outputAsset = native;
    step.chunks[0]!.protocol = 'StonFiV1';
    step.chunks[0]!.outputUnits = raw.outputUnits;
  }
  expect(
    normalizeQuote(raw, { ...input, output: 'TON' }, 1001000),
  ).toMatchObject({ expectedOutputUnits: '318910071', routes: ['StonFiV1'] });
});
it.each([
  'inputUnits',
  'inputAsset',
  'outputAsset',
  'minimum',
  'integratorFee',
  'route',
])('rejects a mismatched or unsafe %s', (field) => {
  const raw = fixture();
  if (field === 'inputUnits') raw.inputUnits = '10';
  if (field === 'inputAsset') raw.inputAsset = asset('0:' + '1'.repeat(64));
  if (field === 'outputAsset') raw.outputAsset = asset('0:' + '1'.repeat(64));
  if (field === 'integratorFee') raw.integratorFeeUnits = '1';
  if (raw.settlementData.$case === 'swap') {
    if (field === 'minimum') raw.settlementData.value.minOutputAmount = '1';
    if (field === 'route')
      raw.settlementData.value.routes[0]!.steps[0]!.chunks[0]!.protocol =
        'UnreviewedDex';
  }
  expect(() => normalizeQuote(raw, input, 1001000)).toThrow(
    'PROVIDER_INVALID_RESPONSE',
  );
});
it('rejects stale and future-dated snapshots', () => {
  expect(() => normalizeQuote(fixture(), input, 1040000)).toThrow(
    'STALE_QUOTE',
  );
  expect(() => normalizeQuote(fixture(), input, 900000)).toThrow('STALE_QUOTE');
});
