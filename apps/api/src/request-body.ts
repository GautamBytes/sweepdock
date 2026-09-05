import { ReadError } from '@sweepdock/core/read-models';

/** A byte limit alone cannot stop a client holding both local slots with a stalled stream. */
export async function readRequestJson(request: Request): Promise<unknown> {
  if (
    request.headers
      .get('content-type')
      ?.split(';', 1)[0]
      ?.trim()
      .toLowerCase() !== 'application/json'
  )
    throw new ReadError('INVALID_REQUEST');
  const length = request.headers.get('content-length');
  if (length !== null && (!/^\d+$/.test(length) || Number(length) > 2048))
    throw new ReadError('REQUEST_TOO_LARGE');
  if (!request.body) throw new ReadError('INVALID_REQUEST');
  const reader = request.body.getReader();
  let rejectStop: (reason: ReadError) => void;
  const stopped = new Promise<never>((_, reject) => {
    rejectStop = reject;
  });
  const stop = (code: 'CANCELLED' | 'REQUEST_TIMEOUT') => {
    rejectStop(new ReadError(code));
    void reader.cancel().catch(() => {});
  };
  const cancel = () => stop('CANCELLED');
  request.signal.addEventListener('abort', cancel, { once: true });
  const timer = setTimeout(() => stop('REQUEST_TIMEOUT'), 5000);
  try {
    if (request.signal.aborted) cancel();
    const decoder = new TextDecoder('utf-8', { fatal: true });
    let text = '',
      size = 0;
    while (true) {
      const part = await Promise.race([reader.read(), stopped]);
      if (request.signal.aborted) throw new ReadError('CANCELLED');
      if (part.done) break;
      size += part.value.byteLength;
      if (size > 2048) throw new ReadError('REQUEST_TOO_LARGE');
      text += decoder.decode(part.value, { stream: true });
    }
    return JSON.parse(text + decoder.decode());
  } catch (error) {
    void reader.cancel().catch(() => {});
    if (error instanceof ReadError) throw error;
    throw new ReadError('INVALID_REQUEST');
  } finally {
    clearTimeout(timer);
    request.signal.removeEventListener('abort', cancel);
    reader.releaseLock();
  }
}
