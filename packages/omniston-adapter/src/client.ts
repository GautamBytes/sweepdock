import {
  Omniston,
  WebSocketTransport,
  type QuoteRequest,
} from '@ston-fi/omniston-sdk';
import {
  ReadError,
  type QuoteInput,
  type QuotePreview,
} from '@sweepdock/core/read-models';
import { makeQuoteRequest, normalizeQuote } from './quote';
export interface QuoteSource {
  requestForQuote(request: QuoteRequest): {
    subscribe(observer: {
      next(event: { $case: string; value?: unknown }): void;
      error(error: unknown): void;
      complete(): void;
    }): { unsubscribe(): void };
  };
  close(): void;
}
function createSource(): QuoteSource {
  const apiUrl = 'wss://omni-ws.ston.fi';
  const sdk = new Omniston({
    apiUrl,
    transport: new WebSocketTransport(apiUrl),
  });
  return {
    requestForQuote: sdk.requestForQuote.bind(sdk),
    close: () => sdk.transport.close(),
  };
}
export async function readQuote(
  request: QuoteInput,
  signal: AbortSignal,
  suppliedSource?: QuoteSource,
  now: () => number = Date.now,
): Promise<QuotePreview> {
  const sdkRequest = makeQuoteRequest(request);
  if (signal.aborted) throw new ReadError('CANCELLED');
  const source = suppliedSource ?? createSource();
  return new Promise((resolve, reject) => {
    let done = false;
    let subscription: { unsubscribe(): void } | undefined;
    const timer = setTimeout(
      () => finish(new ReadError('PROVIDER_UNAVAILABLE')),
      15000,
    );
    const abort = () => finish(new ReadError('CANCELLED'));
    function finish(error?: ReadError, quote?: QuotePreview) {
      if (done) return;
      done = true;
      clearTimeout(timer);
      signal.removeEventListener('abort', abort);
      subscription?.unsubscribe();
      source.close();
      if (error) reject(error);
      else resolve(quote!);
    }
    signal.addEventListener('abort', abort, { once: true });
    try {
      subscription = source.requestForQuote(sdkRequest).subscribe({
        next(event) {
          if (done) return;
          if (event.$case === 'quoteUpdated') {
            try {
              finish(undefined, normalizeQuote(event.value, request, now()));
            } catch (error) {
              finish(
                error instanceof ReadError
                  ? error
                  : new ReadError('PROVIDER_INVALID_RESPONSE'),
              );
            }
          } else if (event.$case === 'noQuote')
            finish(new ReadError('NO_QUOTE'));
          else if (event.$case === 'unsubscribed')
            finish(new ReadError('PROVIDER_UNAVAILABLE'));
        },
        error() {
          finish(new ReadError('PROVIDER_UNAVAILABLE'));
        },
        complete() {
          finish(new ReadError('PROVIDER_UNAVAILABLE'));
        },
      });
      if (done) subscription.unsubscribe();
    } catch {
      finish(new ReadError('PROVIDER_UNAVAILABLE'));
    }
  });
}
