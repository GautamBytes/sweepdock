import { createReadApi } from '../apps/api/src/index';

const api = createReadApi(
  process.env.TONAPI_KEY ? { apiKey: process.env.TONAPI_KEY } : {},
);

export default { fetch: api.fetch };
