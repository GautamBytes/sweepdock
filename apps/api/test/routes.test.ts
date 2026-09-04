// @vitest-environment node
import { expect, it } from 'vitest';
import { createReadApi } from '../src/index';
import type { Balances } from '@sweepdock/core/read-models';

const address = '0:' + 'a'.repeat(64);
const result: Balances = {
  address,
  network: 'ton-mainnet',
  readOnly: true,
  source: 'tonapi',
  observedAtMs: 1000,
  nativeBalanceUnits: '0',
  complete: true,
  assets: [],
};
function post(path: string, body: unknown, extra: Record<string, string> = {}) {
  return new Request(`http://localhost${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...extra },
    body: JSON.stringify(body),
  });
}
it('returns validated read-only balances with no-store privacy headers', async () => {
  const api = createReadApi({ balances: async () => result });
  const response = await api.fetch(post('/api/balances', { address }));
  expect(response.status).toBe(200);
  expect(response.headers.get('cache-control')).toBe('no-store');
  expect(await response.json()).toEqual(result);
});
it('rejects wrong network, extra upstream URLs, invalid addresses and non-json requests', async () => {
  let calls = 0;
  const api = createReadApi({
    balances: async () => {
      calls++;
      return result;
    },
  });
  for (const body of [
    { address, network: 'testnet' },
    { address, url: 'https://evil.example' },
    { address: 'invalid' },
  ]) {
    expect((await api.fetch(post('/api/balances', body))).status).toBe(400);
  }
  expect(
    (
      await api.fetch(
        new Request('http://localhost/api/balances', {
          method: 'POST',
          body: 'bad',
        }),
      )
    ).status,
  ).toBe(400);
  expect(calls).toBe(0);
});
it('rejects cross-origin browser calls and oversized request bodies', async () => {
  const api = createReadApi();
  expect(
    (
      await api.fetch(
        post('/api/balances', { address }, { origin: 'https://evil.example' }),
      )
    ).status,
  ).toBe(403);
  expect(
    (await api.fetch(post('/api/balances', { address: 'x'.repeat(3000) })))
      .status,
  ).toBe(413);
});
it('limits the local client to thirty requests per minute without trusting IP headers', async () => {
  const api = createReadApi({ balances: async () => result, now: () => 1000 });
  for (let i = 0; i < 30; i++)
    expect(
      (
        await api.fetch(
          post('/api/balances', { address }, { 'x-forwarded-for': String(i) }),
        )
      ).status,
    ).toBe(200);
  expect((await api.fetch(post('/api/balances', { address }))).status).toBe(
    429,
  );
});
it('does not expose upstream errors, account data or secret configuration', async () => {
  const api = createReadApi({
    balances: async () => {
      throw new Error('secret-key ' + address);
    },
    apiKey: 'secret-key',
  });
  const response = await api.fetch(post('/api/balances', { address }));
  expect(response.status).toBe(503);
  expect(await response.text()).toBe('{"error":"PROVIDER_UNAVAILABLE"}');
});
it('never exposes transaction building or signing routes', async () => {
  const api = createReadApi();
  expect((await api.fetch(post('/api/sign', {}))).status).toBe(404);
  expect((await api.fetch(post('/api/build', {}))).status).toBe(404);
});
it('caps simultaneous reads at two and releases slots after completion', async () => {
  const releases: (() => void)[] = [];
  const api = createReadApi({
    balances: async () => {
      await new Promise<void>((resolve) => releases.push(resolve));
      return result;
    },
  });
  const a = api.fetch(post('/api/balances', { address }));
  const b = api.fetch(post('/api/balances', { address }));
  expect((await api.fetch(post('/api/balances', { address }))).status).toBe(
    429,
  );
  await new Promise((resolve) => setTimeout(resolve, 0));
  releases.forEach((release) => release());
  expect((await a).status).toBe(200);
  expect((await b).status).toBe(200);
});
