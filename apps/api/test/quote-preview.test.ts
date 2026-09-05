import { expect, it } from 'vitest';
import { createFixtureReadApi as createReadApi } from './read-api-fixture';
import {
  ReadError,
  type QuoteInput,
  type QuotePreview,
} from '@sweepdock/core/read-models';

const now = 1000000;
const request: QuoteInput = {
  input: 'STON',
  output: 'USDT',
  inputUnits: '10000000000',
};
function preview(input: QuoteInput): QuotePreview {
  return {
    network: 'ton-mainnet',
    readOnly: true,
    source: 'omniston',
    request: input,
    quoteId: input.input === 'USDT' ? 'reference' : 'primary',
    expectedOutputUnits: input.output === 'USDT' ? '5000000' : '2000000000',
    minimumOutputUnits: input.output === 'USDT' ? '4950000' : '1980000000',
    gasBudgetUnits: '260000000',
    gasConsumedUnits: '37500000',
    protocolFeeUnits: '0',
    quotedAtMs: now,
    observedAtMs: now,
    previewStaleAtMs: now + 30000,
    providerExpiry: null,
    routes: ['StonFiV2'],
  };
}
function post(input = request) {
  return new Request('http://localhost/api/quote', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
}
it('adds a size-bound USDT gas valuation from a second validated quote', async () => {
  const app = createReadApi({
    now: () => now,
    quotes: async (input) => preview(input),
  });
  const response = await app.request(post());
  expect(response.status).toBe(200);
  expect(await response.json()).toMatchObject({
    gasValuation: {
      source: 'reverse-quote',
      provider: 'omniston',
      inputUsdtUnits: '5000000',
      minimumTonUnits: '1980000000',
      referenceQuoteId: 'reference',
      staleAtMs: now + 30000,
    },
  });
});
it('keeps the primary quote visible when reference liquidity is unavailable', async () => {
  const app = createReadApi({
    now: () => now,
    quotes: async (input) => {
      if (input.input === 'USDT') throw new ReadError('NO_QUOTE');
      return preview(input);
    },
  });
  expect(await (await app.request(post())).json()).toMatchObject({
    quoteId: 'primary',
    gasValuation: null,
  });
});
it('does not accept a reference with a different input amount', async () => {
  const app = createReadApi({
    now: () => now,
    quotes: async (input) =>
      preview(input.input === 'USDT' ? { ...input, inputUnits: '1' } : input),
  });
  expect(await (await app.request(post())).json()).toMatchObject({
    gasValuation: null,
  });
});
it('rejects a primary quote that became stale while the reference was read', async () => {
  let clock = now;
  const app = createReadApi({
    now: () => clock,
    quotes: async (input) => {
      if (input.input === 'USDT') clock += 31000;
      return preview(input);
    },
  });
  expect((await app.request(post())).status).toBe(422);
});
it('does not request a reference for TON outputs', async () => {
  let calls = 0;
  const app = createReadApi({
    now: () => now,
    quotes: async (input) => {
      calls++;
      return preview(input);
    },
  });
  expect((await app.request(post({ ...request, output: 'TON' }))).status).toBe(
    200,
  );
  expect(calls).toBe(1);
});
