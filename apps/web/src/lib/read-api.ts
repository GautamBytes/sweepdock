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
  // The edge may return HTML; status is authoritative for throttling/timeouts.
  if (response.status === 429) throw new ReadError('RATE_LIMITED');
  if (response.status === 408) throw new ReadError('REQUEST_TIMEOUT');
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
      'Check the address and amount. Live quotes support STON, NOT and USDT on TON mainnet.',
    PROVIDER_UNAVAILABLE:
      'The data provider is unavailable. Please check again later.',
    PROVIDER_INVALID_RESPONSE:
      'The data provider returned information that did not pass our checks. Please try reading again.',
    RATE_LIMITED:
      'The request limit was reached. Wait a minute before checking again.',
    REQUEST_TIMEOUT:
      'The request took too long. Check your connection and try again.',
    REQUEST_TOO_LARGE:
      'There is too much data to process. Try a smaller request.',
    NO_QUOTE: 'No quote is available for this pair and amount right now.',
    STALE_QUOTE: 'That quote is too old to preview. Request a fresh quote.',
    CANCELLED: 'The request was cancelled.',
    READ_ONLY_DISABLED:
      'Live balance and quote reads are not enabled on this server.',
  };
  return copy[error.code];
}
