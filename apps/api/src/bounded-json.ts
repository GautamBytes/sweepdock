import { ReadError } from '@sweepdock/core/read-models';

export async function boundedText(
  response: Response,
  maxBytes: number,
): Promise<string> {
  if (!response.body) throw new ReadError('PROVIDER_INVALID_RESPONSE');
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let size = 0;
  let text = '';
  try {
    while (true) {
      const part = await reader.read();
      if (part.done) break;
      size += part.value.byteLength;
      if (size > maxBytes) {
        await reader.cancel();
        throw new ReadError('REQUEST_TOO_LARGE');
      }
      text += decoder.decode(part.value, { stream: true });
    }
    return text + decoder.decode();
  } finally {
    reader.releaseLock();
  }
}

// TonAPI's native balance is an int64 JSON number. Capture its source text
// before it can be rounded by JavaScript; all browser-facing units are strings.
export function parseProviderJson(text: string): unknown {
  return JSON.parse(
    text,
    (key: string, value: unknown, context?: { source?: string }) => {
      if (key === 'balance' && typeof value === 'number') {
        if (!context?.source || !/^(0|[1-9]\d*)$/.test(context.source))
          throw new ReadError('PROVIDER_INVALID_RESPONSE');
        return context.source;
      }
      return value;
    },
  );
}
