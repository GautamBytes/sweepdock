// @vitest-environment node
import { expect, it, vi } from 'vitest';
import { readQuote, type QuoteSource } from '../src/client';
import { fixture } from './fixture';

function source() {
  let observer:
    | Parameters<ReturnType<QuoteSource['requestForQuote']>['subscribe']>[0]
    | undefined;
  let closed = 0;
  let unsubscribed = 0;
  let requested = 0;
  const client: QuoteSource = {
    requestForQuote() {
      requested++;
      return {
        subscribe(listener) {
          observer = listener;
          return {
            unsubscribe() {
              unsubscribed++;
            },
          };
        },
      };
    },
    close() {
      closed++;
    },
  };
  return {
    client,
    emit: (event: { $case: string; value?: unknown }) => observer!.next(event),
    fail: () => observer!.error(new Error('secret socket data')),
    counts: () => ({ closed, unsubscribed, requested }),
  };
}
const input = {
  input: 'STON' as const,
  output: 'USDT' as const,
  inputUnits: '1000000000',
};
it('disposes subscriptions and closes the socket after the first validated quote', async () => {
  const s = source();
  const result = readQuote(
    input,
    new AbortController().signal,
    s.client,
    () => 1001000,
  );
  s.emit({ $case: 'ack' });
  s.emit({ $case: 'quoteUpdated', value: fixture() });
  await expect(result).resolves.toMatchObject({
    expectedOutputUnits: '433907',
  });
  expect(s.counts()).toEqual({ closed: 1, unsubscribed: 1, requested: 1 });
});
it('cancels an in-flight stream without retrying', async () => {
  const s = source();
  const controller = new AbortController();
  const result = readQuote(input, controller.signal, s.client);
  controller.abort();
  await expect(result).rejects.toThrow('CANCELLED');
  expect(s.counts()).toEqual({ closed: 1, unsubscribed: 1, requested: 1 });
});
it('keeps no-route and network errors distinct and sanitized', async () => {
  const s = source();
  const result = readQuote(input, new AbortController().signal, s.client);
  s.emit({ $case: 'noQuote' });
  await expect(result).rejects.toThrow('NO_QUOTE');
  const t = source();
  const failed = readQuote(input, new AbortController().signal, t.client);
  t.fail();
  await expect(failed).rejects.toThrow('PROVIDER_UNAVAILABLE');
});
it('bounds a silent stream to fifteen seconds', async () => {
  vi.useFakeTimers();
  try {
    const s = source();
    const result = readQuote(input, new AbortController().signal, s.client);
    const assertion = expect(result).rejects.toThrow('PROVIDER_UNAVAILABLE');
    await vi.advanceTimersByTimeAsync(15000);
    await assertion;
    expect(s.counts()).toEqual({ closed: 1, unsubscribed: 1, requested: 1 });
  } finally {
    vi.useRealTimers();
  }
});
