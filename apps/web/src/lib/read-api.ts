import { validateQuotePreview } from '@sweepdock/core/providers';
import { readPolicy } from '../../../shared/read-policy';
import { balancesSchema } from '@sweepdock/core/read-models';
import {
  apiErrorCodes,
  ReadError,
  type QuoteInput,
} from '@sweepdock/core/read-models';

async function post(
  path: string,
  body: unknown,
  signal: AbortSignal,
): Promise<unknown> {
  const response = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal,
    cache: 'no-store',
    referrerPolicy: 'no-referrer',
  });
  let result: unknown;
  try {
    result = await response.json();
  } catch {
    throw new ReadError('PROVIDER_INVALID_RESPONSE');
  }
  if (!response.ok) {
    const error =
      typeof result === 'object' && result !== null && 'error' in result
        ? result.error
        : null;
    const code = apiErrorCodes.find((code) => code === error);
    throw new ReadError(code ?? 'PROVIDER_UNAVAILABLE');
  }
  return result;
}
export async function fetchBalances(address: string, signal: AbortSignal) {
  const result = balancesSchema.parse(
    await post('/api/balances', { address }, signal),
  );
  if (result.source !== readPolicy.balanceSource)
    throw new ReadError('PROVIDER_INVALID_RESPONSE');
  return result;
}
export async function fetchQuote(input: QuoteInput, signal: AbortSignal) {
  return validateQuotePreview(
    await post('/api/quote', input, signal),
    input,
    readPolicy,
    Date.now(),
  );
}

export function errorCopy(error: unknown): string {
  if (!(error instanceof ReadError))
    return 'The data provider is unavailable. Please check again later.';
  const copy = {
    INVALID_REQUEST:
      'Check the address or amount. Only reviewed TON mainnet assets are supported.',
    PROVIDER_UNAVAILABLE:
      'The data provider is unavailable. Please check again later.',
    PROVIDER_INVALID_RESPONSE:
      'The provider returned data we could not safely use. No quote is approved.',
    RATE_LIMITED:
      'The request limit was reached. Wait a minute before checking again.',
    REQUEST_TOO_LARGE:
      'The response or request is too large to process safely.',
    NO_QUOTE: 'No quote is available for this pair and amount right now.',
    STALE_QUOTE: 'That quote is too old to preview. Request a fresh quote.',
    CANCELLED: 'The request was cancelled.',
    READ_ONLY_DISABLED: 'The read-only API is not enabled on this server.',
  };
  return copy[error.code];
}
