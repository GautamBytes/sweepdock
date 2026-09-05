// @vitest-environment node
import { expect, it } from 'vitest';
import { createReadApi } from '../src/index';
import { buildCleanupPlan } from '@sweepdock/core';
import { reviewedAssets } from '@sweepdock/core';
import type { QuoteInput, QuotePreview } from '@sweepdock/core/read-models';
const now = 100000;
const address = '0:' + 'a'.repeat(64);
const policy = {
  balanceSource: 'alternate-balances',
  quoteSource: 'alternate-quotes',
  supportedProtocols: ['ReviewedPool'],
};
const balances = {
  network: 'ton-mainnet' as const,
  readOnly: true as const,
  source: policy.balanceSource,
  address,
  observedAtMs: now,
  nativeBalanceUnits: '1000000000',
  complete: true,
  assets: reviewedAssets.map((a) => ({
    ...a,
    units: '1000000000',
    reviewedId: a.id,
    eligible: true,
    reason: null,
  })),
};
function quote(request: QuoteInput): QuotePreview {
  return {
    network: 'ton-mainnet',
    readOnly: true,
    source: policy.quoteSource,
    request,
    quoteId: request.input,
    expectedOutputUnits: '1000000000',
    minimumOutputUnits: '990000000',
    protocolFeeUnits: '0',
    gasBudgetUnits: '200000000',
    gasConsumedUnits: '10000000',
    quotedAtMs: now,
    observedAtMs: now,
    previewStaleAtMs: now + 30000,
    providerExpiry: null,
    routes: ['ReviewedPool'],
  };
}
const input: QuoteInput = {
  input: 'STON',
  output: 'TON',
  inputUnits: '1000000000',
};
function app(
  read = async (request: QuoteInput) => quote(request),
  readBalances = async () => balances,
) {
  return createReadApi({
    policy,
    balances: { id: policy.balanceSource, read: readBalances },
    quotes: { id: policy.quoteSource, read },
    now: () => now,
  });
}
function post(path: string, data: unknown) {
  return new Request('http://localhost/api/' + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}
it('runs a replacement through API and planner without core changes', async () => {
  const api = app();
  const b = await api.request(post('balances', { address }));
  const q = await api.request(post('quote', input));
  expect(b.status).toBe(200);
  expect(q.status).toBe(200);
  const result = buildCleanupPlan({
    policy,
    balances: await b.json(),
    quotes: [await q.json()],
    selected: ['STON'],
    output: 'TON',
    failures: {},
    now,
  });
  expect(result.withinBudget).toBe(true);
  expect(result.rows[0]?.reason).toBe('WITHIN_COST_LIMIT');
  expect(await (await api.request('/api/config')).json()).toMatchObject({
    providers: policy,
    supportedProtocols: ['ReviewedPool'],
  });
});
it.each(['spoof-source', 'unapproved-route', 'wrong-amount'])(
  'rejects %s at the provider boundary',
  async (kind) => {
    const api = app(async (request) => ({
      ...quote(request),
      ...(kind === 'spoof-source'
        ? { source: 'omniston' }
        : kind === 'unapproved-route'
          ? { routes: ['UnreviewedPool'] }
          : { request: { ...request, inputUnits: '1' } }),
    }));
    const response = await api.request(post('quote', input));
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({
      error: 'PROVIDER_INVALID_RESPONSE',
    });
  },
);
it('rejects a different balance owner or source', async () => {
  for (const changed of [
    { address: '0:' + 'b'.repeat(64) },
    { source: 'tonapi' },
  ]) {
    const response = await app(undefined, async () => ({
      ...balances,
      ...changed,
    })).request(post('balances', { address }));
    expect(response.status).toBe(503);
  }
});
it('binds reverse gas valuation to the selected provider', async () => {
  const response = await app().request(
    post('quote', { ...input, output: 'USDT' }),
  );
  expect(response.status).toBe(200);
  expect(await response.json()).toMatchObject({
    gasValuation: { source: 'reverse-quote', provider: policy.quoteSource },
  });
  const mixed = app(async (request) => ({
    ...quote(request),
    source: request.input === 'USDT' ? 'other-source' : policy.quoteSource,
  }));
  expect(
    await (
      await mixed.request(post('quote', { ...input, output: 'USDT' }))
    ).json(),
  ).toMatchObject({ gasValuation: null });
});
it('does not approve alternate data under the original deployment policy', () => {
  const result = buildCleanupPlan({
    policy: {
      balanceSource: 'tonapi',
      quoteSource: 'omniston',
      supportedProtocols: ['StonFiV2'],
    },
    balances,
    quotes: [quote(input)],
    selected: ['STON'],
    output: 'TON',
    failures: {},
    now,
  });
  expect(result.withinBudget).toBe(false);
  expect(result.rows[0]?.reason).toBe('PROVIDER_INVALID_RESPONSE');
});
it('rejects mismatched deployment wiring before accepting requests', () => {
  expect(() =>
    createReadApi({
      policy,
      balances: { id: 'wrong-provider', read: async () => balances },
      quotes: {
        id: policy.quoteSource,
        read: async (request) => quote(request),
      },
    }),
  ).toThrow('Provider configuration');
});
it('keeps unknown outcomes and signing unavailable under replacement configuration', async () => {
  const api = app();
  expect(await (await api.request('/api/health')).json()).toEqual({
    mode: 'read-only',
    signingEnabled: false,
  });
  for (const operation of ['sign', 'build', 'track'])
    expect((await api.request(post(operation, {}))).status).toBe(404);
  const response = await api.request(
    post('quote', { ...input, provider: 'other' }),
  );
  expect(response.status).toBe(400);
});
it('requires fresh data and does not turn missing gas into a free swap', async () => {
  const stale = app(async (request) => ({
    ...quote(request),
    quotedAtMs: now - 30001,
  }));
  expect((await stale.request(post('quote', input))).status).toBe(422);
  const q = { ...quote(input), gasConsumedUnits: null };
  const result = buildCleanupPlan({
    policy,
    balances,
    quotes: [q],
    selected: ['STON'],
    output: 'TON',
    failures: {},
    now,
  });
  expect(result.withinBudget).toBe(false);
  expect(result.rows[0]?.reason).toBe('COST_DATA_UNAVAILABLE');
});
it.each(['not-an-integer', '-1', '1.2', '9'.repeat(79)])(
  'rejects malformed units before contacting a provider (%s)',
  async (inputUnits) => {
    let calls = 0;
    const api = app(async (request) => {
      calls++;
      return quote(request);
    });
    const response = await api.request(post('quote', { ...input, inputUnits }));
    expect(response.status).toBe(400);
    expect(calls).toBe(0);
  },
);
