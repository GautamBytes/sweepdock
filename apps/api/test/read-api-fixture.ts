import { createReadApi } from '../src/index';
import { ReadError } from '@sweepdock/core/read-models';
import type { BalanceProvider, QuoteProvider } from '@sweepdock/core/providers';
const unavailable = async (): Promise<never> => {
  throw new ReadError('PROVIDER_UNAVAILABLE');
};
export function createFixtureReadApi(
  options: {
    balances?: BalanceProvider['read'];
    quotes?: QuoteProvider['read'];
    now?: () => number;
  } = {},
) {
  return createReadApi({
    policy: {
      balanceSource: 'tonapi',
      quoteSource: 'omniston',
      supportedProtocols: ['StonFiV1', 'StonFiV2'],
    },
    balances: { id: 'tonapi', read: options.balances ?? unavailable },
    quotes: { id: 'omniston', read: options.quotes ?? unavailable },
    ...(options.now ? { now: options.now } : {}),
  });
}
