import { expect, it } from 'vitest';
import { connectionState, manifestUrl, memoryStorage } from './connection';

it('only accepts mainnet raw wallet accounts for the live screen', () => {
  expect(
    connectionState({ address: '0:' + 'A'.repeat(64), chain: '-239' }),
  ).toMatchObject({ kind: 'connected', address: '0:' + 'a'.repeat(64) });
  expect(
    connectionState({ address: '0:' + 'a'.repeat(64), chain: '-3' }).kind,
  ).toBe('wrong-network');
  expect(connectionState({ address: '0:fake', chain: '-239' }).kind).toBe(
    'invalid',
  );
  expect(connectionState(null).kind).toBe('disconnected');
});
it('requires a public HTTPS manifest and does not invent a deployment URL', () => {
  expect(manifestUrl(undefined)).toBeNull();
  for (const value of [
    'http://app.example.com/manifest.json',
    'https://localhost/manifest.json',
    'https://127.0.0.1/x',
    'https://[::1]/x',
    'https://user:pass@app.example.com/x',
    'https://app.local/x',
    'https://app.example.com/x#fragment',
  ])
    expect(manifestUrl(value)).toBeNull();
  expect(manifestUrl('https://app.example.com/tonconnect-manifest.json')).toBe(
    'https://app.example.com/tonconnect-manifest.json',
  );
});
it('keeps SDK session storage in memory and isolated per instance', async () => {
  const first = memoryStorage();
  const second = memoryStorage();
  await first.setItem('connection', 'test-session');
  expect(await first.getItem('connection')).toBe('test-session');
  expect(await second.getItem('connection')).toBeNull();
  await first.removeItem('connection');
  expect(await first.getItem('connection')).toBeNull();
});
