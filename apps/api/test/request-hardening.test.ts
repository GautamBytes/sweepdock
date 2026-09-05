// @vitest-environment node
import { afterEach, expect, it, vi } from 'vitest';
import { createFixtureReadApi } from './read-api-fixture';
const address = '0:' + 'a'.repeat(64);
function request(
  body: BodyInit,
  headers: Record<string, string> = {},
  signal?: AbortSignal,
) {
  return new Request('http://localhost/api/balances', {
    method: 'POST',
    body,
    headers: { 'content-type': 'application/json', ...headers },
    signal,
    duplex: 'half',
  } as RequestInit);
}
afterEach(() => vi.useRealTimers());
it('rejects lookalike media types and oversized declared bodies without reading providers', async () => {
  const balances = vi.fn();
  const api = createFixtureReadApi({ balances });
  expect(
    (
      await api.fetch(
        request('{}', { 'content-type': 'application/json-evil' }),
      )
    ).status,
  ).toBe(400);
  expect(
    (await api.fetch(request('{}', { 'content-length': '4096' }))).status,
  ).toBe(413);
  expect(balances).not.toHaveBeenCalled();
});
it('releases both concurrency slots when body uploads stall', async () => {
  vi.useFakeTimers();
  const cancel = vi.fn();
  const balances = vi.fn(async () => ({
    address,
    network: 'ton-mainnet' as const,
    readOnly: true as const,
    source: 'tonapi',
    observedAtMs: Date.now(),
    nativeBalanceUnits: '0',
    complete: true,
    assets: [],
  }));
  const api = createFixtureReadApi({ balances });
  const uploads = [0, 1].map(() =>
    api.fetch(request(new ReadableStream({ cancel }))),
  );
  const completed = Promise.all(uploads);
  await vi.advanceTimersByTimeAsync(5001);
  for (const response of await completed) {
    expect(response.status).toBe(408);
    expect(await response.json()).toEqual({ error: 'REQUEST_TIMEOUT' });
  }
  expect(cancel).toHaveBeenCalledTimes(2);
  expect(balances).not.toHaveBeenCalled();
  expect((await api.fetch(request(JSON.stringify({ address })))).status).toBe(
    200,
  );
});
it('cancels a disconnected upload and never calls its provider', async () => {
  const abort = new AbortController();
  const cancel = vi.fn();
  const balances = vi.fn();
  const pending = createFixtureReadApi({ balances }).fetch(
    request(new ReadableStream({ cancel }), {}, abort.signal),
  );
  abort.abort();
  expect(await (await pending).json()).toEqual({ error: 'CANCELLED' });
  expect(cancel).toHaveBeenCalledOnce();
  expect(balances).not.toHaveBeenCalled();
});
it('rejects invalid UTF-8, empty bodies and malformed JSON as client errors', async () => {
  const api = createFixtureReadApi();
  for (const body of [new Uint8Array([0xff]), '', '{'])
    expect((await api.fetch(request(body))).status).toBe(400);
});
