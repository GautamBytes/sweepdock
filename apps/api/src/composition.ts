import { readQuote } from '@sweepdock/omniston-adapter';
import { readBalances } from './tonapi';
import { createReadApi } from './index';
import { readPolicy } from '../../shared/read-policy';

/** The only API composition point for concrete services and credentials. */
export function createDefaultReadApi(apiKey?: string) {
  return createReadApi({
    policy: readPolicy,
    quotes: { id: 'omniston', read: readQuote },
    balances: {
      id: 'tonapi',
      read: (address, signal) =>
        readBalances(address, { signal, ...(apiKey ? { apiKey } : {}) }),
    },
  });
}
