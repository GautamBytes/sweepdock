// @vitest-environment node
import { expect, it } from 'vitest';
import { reviewedAssets } from '@sweepdock/core/assets';
import { readBalances } from '../src/tonapi';

const owner = '0:' + 'a'.repeat(64);
const native = `{"address":"${owner}","balance":9007199254740993001,"status":"active","last_activity":1720860269,"get_methods":[],"is_wallet":true}`;
function row(master: string, balance = '1000000000', decimals = 9) {
  return {
    balance,
    wallet_address: {
      address: '0:' + 'b'.repeat(64),
      is_scam: false,
      is_wallet: false,
    },
    jetton: {
      address: master,
      name: 'Provider supplied',
      symbol: 'STON',
      decimals,
      verification: 'whitelist',
      image: 'https://untrusted.example/image',
      score: 100,
    },
  };
}
function fetchPages(pages: unknown[], account = native) {
  const requests: string[] = [];
  const fetcher: typeof fetch = async (input) => {
    const url = String(input);
    requests.push(url);
    return new Response(
      url.includes('/jettons?')
        ? JSON.stringify({ balances: pages.shift() ?? [] })
        : account,
      { headers: { 'content-type': 'application/json' } },
    );
  };
  return { fetcher, requests };
}
it('keeps large native units exact and matches token identity instead of symbols', async () => {
  const { fetcher } = fetchPages([
    [row(reviewedAssets[0].master), row('0:' + 'c'.repeat(64))],
  ]);
  const result = await readBalances(owner, { fetcher, now: () => 1234 });
  expect(result.nativeBalanceUnits).toBe('9007199254740993001');
  expect(result.assets[0]).toMatchObject({
    reviewedId: 'STON',
    eligible: true,
    name: 'STON',
  });
  expect(result.assets[1]).toMatchObject({
    reviewedId: null,
    eligible: false,
    reason: 'UNREVIEWED',
  });
  expect(JSON.stringify(result)).not.toContain('untrusted.example');
  expect(result.observedAtMs).toBe(1234);
});
it('disables changed decimals, custom payloads and locked balances', async () => {
  const { fetcher } = fetchPages([
    [
      row(reviewedAssets[0].master, '100', 6),
      { ...row(reviewedAssets[1].master), extensions: ['custom_payload'] },
      {
        ...row(reviewedAssets[2].master, '100', 6),
        lock: { amount: '100', till: 9999999999 },
      },
    ],
  ]);
  const result = await readBalances(owner, { fetcher });
  expect(result.assets.map((asset) => asset.eligible)).toEqual([
    false,
    false,
    false,
  ]);
});
it('pages balances and marks a bounded full result incomplete', async () => {
  const rows = Array.from({ length: 100 }, (_, index) =>
    row('0:' + (index + 1).toString(16).padStart(64, '0')),
  );
  const { fetcher, requests } = fetchPages([rows, rows, rows]);
  const result = await readBalances(owner, { fetcher });
  expect(requests).toHaveLength(4);
  expect(requests.at(-1)).toContain('offset=200');
  expect(result.complete).toBe(false);
});
it('fetches the next page before declaring the wallet complete', async () => {
  const rows = Array.from({ length: 100 }, (_, index) =>
    row('0:' + (index + 1).toString(16).padStart(64, '0')),
  );
  const { fetcher, requests } = fetchPages([
    rows,
    [row(reviewedAssets[0].master)],
  ]);
  const result = await readBalances(owner, { fetcher });
  expect(requests).toHaveLength(3);
  expect(result.complete).toBe(true);
  expect(result.assets.at(-1)?.reviewedId).toBe('STON');
});
it('rejects wrong-account and invalid-unit responses', async () => {
  const wrong = fetchPages([], native.replace(owner, '0:' + 'b'.repeat(64)));
  await expect(readBalances(owner, wrong)).rejects.toThrow(
    'PROVIDER_INVALID_RESPONSE',
  );
  const invalid = fetchPages([[row(reviewedAssets[0].master, '1e9')]]);
  await expect(readBalances(owner, invalid)).rejects.toThrow(
    'PROVIDER_INVALID_RESPONSE',
  );
});
it('does not leak provider bodies or secrets on failure', async () => {
  const fetcher: typeof fetch = async () =>
    new Response('secret private-address', { status: 429 });
  await expect(
    readBalances(owner, { fetcher, apiKey: 'secret' }),
  ).rejects.toThrow('RATE_LIMITED');
});
it('rejects an invalid address before contacting a provider', async () => {
  const { fetcher, requests } = fetchPages([]);
  await expect(
    readBalances('https://evil.example', { fetcher }),
  ).rejects.toThrow('Invalid mainnet address');
  expect(requests).toEqual([]);
});
it('honors cancellation before a provider request', async () => {
  const { fetcher, requests } = fetchPages([]);
  const controller = new AbortController();
  controller.abort();
  await expect(
    readBalances(owner, { fetcher, signal: controller.signal }),
  ).rejects.toThrow('CANCELLED');
  expect(requests).toEqual([]);
});
