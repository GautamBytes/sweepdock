import { describe, expect, it } from 'vitest';
import { formatUnits, parseUnits } from '../src/amounts';

describe('exact token amounts', () => {
  it('preserves balances beyond the safe integer range', () => {
    expect(parseUnits('9007199254740993.000001', 6)).toBe(
      9007199254740993000001n,
    );
  });
  it('pads fractional digits without floating point', () => {
    expect(parseUnits('12.34', 6)).toBe(12340000n);
  });
  it('accepts zero and assets without fractional units', () => {
    expect(parseUnits('0', 9)).toBe(0n);
    expect(parseUnits('123', 0)).toBe(123n);
  });
  it.each([
    '',
    ' ',
    '-1',
    '+1',
    '1e6',
    'NaN',
    'Infinity',
    '.5',
    '1.',
    '1,000',
    '1.0000001',
  ])('rejects ambiguous or excessive precision: %s', (input) => {
    expect(() => parseUnits(input, 6)).toThrow('Invalid amount');
  });
  it.each([-1, 1.5, 256, Number.NaN])(
    'rejects invalid decimals: %s',
    (decimals) => {
      expect(() => parseUnits('1', decimals)).toThrow('Invalid decimals');
    },
  );
  it('limits input size before allocating large integers', () => {
    expect(() => parseUnits('1'.repeat(257), 6)).toThrow('Invalid amount');
  });
  it('applies the same integer size limit when parsing and formatting', () => {
    expect(() => parseUnits('9'.repeat(256), 1)).toThrow('Invalid amount');
    expect(formatUnits(parseUnits('9'.repeat(255), 1), 1)).toBe(
      '9'.repeat(255),
    );
  });
  it('formats exactly and removes insignificant fractional zeroes', () => {
    expect(formatUnits(12340000n, 6)).toBe('12.34');
    expect(formatUnits(1n, 9)).toBe('0.000000001');
    expect(formatUnits(0n, 6)).toBe('0');
    expect(formatUnits(120n, 0)).toBe('120');
  });
  it('rejects negative balances', () => {
    expect(() => formatUnits(-1n, 6)).toThrow('Invalid units');
  });
  it('round trips exact integer units', () => {
    for (const decimals of [0, 6, 9, 18, 255]) {
      for (const units of [0n, 1n, 9999n, 9007199254740993000001n]) {
        expect(parseUnits(formatUnits(units, decimals), decimals)).toBe(units);
      }
    }
  });
});
