import { createReadApi } from './index';

const api = createReadApi(
  process.env.TONAPI_KEY ? { apiKey: process.env.TONAPI_KEY } : {},
);

export default { fetch: api.fetch };
