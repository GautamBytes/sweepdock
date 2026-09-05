import { expect, it, vi } from 'vitest';
import { fetchBalances, fetchQuote } from './read-api';
import { ReadError } from '@sweepdock/core/read-models';
const now = Date.now();
const input = {
  input: 'STON' as const,
  output: 'TON' as const,
  inputUnits: '1000000000',
};
const quote = {
  network: 'ton-mainnet',
  readOnly: true,
  source: 'omniston',
  request: input,
  quoteId: 'q',
  expectedOutputUnits: '1000000000',
  minimumOutputUnits: '990000000',
  protocolFeeUnits: '0',
  gasBudgetUnits: '200000000',
  gasConsumedUnits: '10000000',
  quotedAtMs: now,
  observedAtMs: now,
  previewStaleAtMs: now + 30000,
  providerExpiry: null,
  routes: ['StonFiV2'],
};
it('accepts configured quote provenance and rejects source or protocol spoofing', async () => {
  for (const change of [
    {},
    { source: 'imposter' },
    { routes: ['UnapprovedPool'] },
  ]) {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ ...quote, ...change }), {
        headers: { 'content-type': 'application/json' },
      }),
    );
    const read = fetchQuote(input, new AbortController().signal);
    if (Object.keys(change).length)
      await expect(read).rejects.toMatchObject({
        code: 'PROVIDER_INVALID_RESPONSE',
      });
    else await expect(read).resolves.toMatchObject({ source: 'omniston' });
  }
});
it('rejects balance provenance changes in the browser', async () => {
  const address = '0:' + 'a'.repeat(64);
  vi.spyOn(globalThis, 'fetch').mockResolvedValue(
    new Response(
      JSON.stringify({
        network: 'ton-mainnet',
        readOnly: true,
        source: 'imposter',
        address,
        observedAtMs: now,
        nativeBalanceUnits: '0',
        complete: true,
        assets: [],
      }),
    ),
  );
  await expect(
    fetchBalances(address, new AbortController().signal),
  ).rejects.toBeInstanceOf(ReadError);
});
