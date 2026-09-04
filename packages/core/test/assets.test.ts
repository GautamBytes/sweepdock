import { expect, it } from 'vitest';
import { Address } from '@ton/core';
import {
  normalizeMainnetAddress,
  matchReviewedAsset,
  reviewedAssets,
} from '../src/assets';

const ston = reviewedAssets[0];
it('normalizes raw and both friendly formats to the same master', () => {
  const address = Address.parse(ston.master);
  expect(normalizeMainnetAddress(address.toString())).toBe(ston.master);
  expect(normalizeMainnetAddress(address.toString({ bounceable: false }))).toBe(
    ston.master,
  );
  expect(normalizeMainnetAddress(ston.master.toUpperCase())).toBe(ston.master);
});
it.each([
  '',
  'ston.ton',
  'https://evil.example',
  '0:abc',
  '0:' + 'g'.repeat(64),
  '-1:' + '0'.repeat(64),
  '0:' + '0'.repeat(65),
])('rejects malformed or unsupported address %s', (address) => {
  expect(() => normalizeMainnetAddress(address)).toThrow(
    'Invalid mainnet address',
  );
});
it('rejects test-only friendly addresses and broken checksums', () => {
  expect(() =>
    normalizeMainnetAddress(
      Address.parse(ston.master).toString({ testOnly: true }),
    ),
  ).toThrow();
  expect(() =>
    normalizeMainnetAddress('EQA2kCVNwVsil2EM2mB0SkXytxCqQjS4mttjDpnXmwG9T6bA'),
  ).toThrow();
});
it('matches only the reviewed identity and decimals, never a symbol', () => {
  expect(matchReviewedAsset(ston.master, 9)?.id).toBe('STON');
  expect(matchReviewedAsset(ston.master, 6)).toBeUndefined();
  expect(matchReviewedAsset('0:' + '1'.repeat(64), 9)).toBeUndefined();
});
