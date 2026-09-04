import { getRequestListener } from '@hono/node-server';
import { createReadApi } from './index';

export function createLocalApiMiddleware(apiKey?: string) {
  const api = createReadApi(apiKey ? { apiKey } : {});
  return getRequestListener(api.fetch, { overrideGlobalObjects: false });
}
