import { Hono } from 'hono';
import { z } from 'zod';
import { readBalances } from './tonapi';
import { boundedText } from './bounded-json';
import { readQuote } from '@sweepdock/omniston-adapter';
import { readQuotePreview } from './quote-preview';
import {
  normalizeMainnetAddress,
  reviewedAssets,
} from '@sweepdock/core/assets';
import {
  balancesSchema,
  quoteInputSchema,
  quotePreviewSchema,
  ReadError,
  type ApiErrorCode,
} from '@sweepdock/core/read-models';

export function createReadApi(
  options: {
    balances?: typeof readBalances;
    quotes?: typeof readQuote;
    now?: () => number;
    apiKey?: string;
  } = {},
) {
  const app = new Hono();
  const now = options.now ?? Date.now;
  let windowStart = now();
  let requests = 0;
  let inFlight = 0;
  app.use('/api/*', async (c, next) => {
    c.header('Cache-Control', 'no-store');
    c.header('Referrer-Policy', 'no-referrer');
    c.header('X-Content-Type-Options', 'nosniff');
    const origin = c.req.header('origin');
    if (
      (origin && origin !== new URL(c.req.url).origin) ||
      c.req.header('sec-fetch-site') === 'cross-site'
    )
      return c.json({ error: 'INVALID_REQUEST' }, 403);
    await next();
  });
  app.get('/api/health', (c) =>
    c.json({ mode: 'read-only', signingEnabled: false }),
  );
  app.get('/api/config', (c) =>
    c.json({
      network: 'ton-mainnet',
      readOnly: true,
      assets: reviewedAssets,
      supportedProtocols: ['StonFiV1', 'StonFiV2'],
    }),
  );
  app.post('/api/:operation', async (c) => {
    const operation = c.req.param('operation');
    if (!['balances', 'quote'].includes(operation))
      return c.json({ error: 'NOT_FOUND' }, 404);
    if (now() - windowStart >= 60000) {
      requests = 0;
      windowStart = now();
    }
    if (requests >= 30 || inFlight >= 2) {
      c.header('Retry-After', '60');
      return c.json({ error: 'RATE_LIMITED' }, 429);
    }
    requests++;
    inFlight++;
    try {
      if (
        !c.req
          .header('content-type')
          ?.toLowerCase()
          .startsWith('application/json')
      )
        throw new ReadError('INVALID_REQUEST');
      const text = await boundedText(new Response(c.req.raw.body), 2048);
      let body: unknown;
      try {
        body = JSON.parse(text);
      } catch {
        throw new ReadError('INVALID_REQUEST');
      }
      if (operation === 'balances') {
        const parsed = z
          .object({ address: z.string().max(70) })
          .strict()
          .safeParse(body);
        if (!parsed.success) throw new ReadError('INVALID_REQUEST');
        let address: string;
        try {
          address = normalizeMainnetAddress(parsed.data.address);
        } catch {
          throw new ReadError('INVALID_REQUEST');
        }
        const result = await (options.balances ?? readBalances)(address, {
          signal: c.req.raw.signal,
          ...(options.apiKey ? { apiKey: options.apiKey } : {}),
        });
        return c.json(balancesSchema.parse(result));
      }
      const parsed = quoteInputSchema.safeParse(body);
      if (!parsed.success) throw new ReadError('INVALID_REQUEST');
      const quote = await readQuotePreview(
        parsed.data,
        c.req.raw.signal,
        options.quotes ?? readQuote,
        now,
      );
      return c.json(quotePreviewSchema.parse(quote));
    } finally {
      inFlight--;
    }
  });
  app.onError((error, c) => {
    const code: ApiErrorCode =
      error instanceof ReadError
        ? error.code
        : error instanceof z.ZodError
          ? 'PROVIDER_INVALID_RESPONSE'
          : 'PROVIDER_UNAVAILABLE';
    const status =
      code === 'INVALID_REQUEST'
        ? 400
        : code === 'REQUEST_TOO_LARGE'
          ? 413
          : code === 'RATE_LIMITED'
            ? 429
            : code === 'NO_QUOTE' || code === 'STALE_QUOTE'
              ? 422
              : 503;
    return c.json({ error: code }, status);
  });
  app.notFound((c) => c.json({ error: 'NOT_FOUND' }, 404));
  return app;
}
