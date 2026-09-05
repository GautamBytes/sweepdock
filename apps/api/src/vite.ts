import { getRequestListener } from '@hono/node-server';
import { createDefaultReadApi } from './composition';

export function createLocalApiMiddleware(apiKey?: string) {
  const api = createDefaultReadApi(apiKey);
  return getRequestListener(api.fetch, { overrideGlobalObjects: false });
}
