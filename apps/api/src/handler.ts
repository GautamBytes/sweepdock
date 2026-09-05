import { createDefaultReadApi } from './composition';

const api = createDefaultReadApi(process.env.TONAPI_KEY);

export default { fetch: api.fetch };
