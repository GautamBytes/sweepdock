// @vitest-environment node
import { expect, it } from 'vitest';
import { boundedText, parseProviderJson } from '../src/bounded-json';

it('rejects a body over the byte budget and cancels the reader', async () => {
  let cancelled = false;
  const body = new ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode('12345'));
    },
    cancel() {
      cancelled = true;
    },
  });
  await expect(boundedText(new Response(body), 4)).rejects.toThrow(
    'REQUEST_TOO_LARGE',
  );
  expect(cancelled).toBe(true);
});
it('counts UTF-8 bytes, not JavaScript string characters', async () => {
  await expect(boundedText(new Response('éé'), 3)).rejects.toThrow(
    'REQUEST_TOO_LARGE',
  );
});
it('preserves int64 source digits and rejects negative or exponent balances', () => {
  expect(parseProviderJson('{"balance":9007199254740993001}')).toEqual({
    balance: '9007199254740993001',
  });
  expect(() => parseProviderJson('{"balance":-1}')).toThrow();
  expect(() => parseProviderJson('{"balance":1e9}')).toThrow();
});
