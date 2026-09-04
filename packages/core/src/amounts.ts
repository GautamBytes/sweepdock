function validateDecimals(decimals: number): void {
  if (!Number.isInteger(decimals) || decimals < 0 || decimals > 255) {
    throw new Error('Invalid decimals');
  }
}

export function parseUnits(text: string, decimals: number): bigint {
  validateDecimals(decimals);
  if (
    text.length > 257 ||
    !/^\d+(?:\.\d+)?$/.test(text) ||
    text.replace('.', '').length > 256
  ) {
    throw new Error('Invalid amount');
  }
  const [whole = '', fraction = ''] = text.split('.');
  if (fraction.length > decimals)
    throw new Error('Invalid amount: excess precision');
  const units =
    BigInt(whole) * 10n ** BigInt(decimals) +
    BigInt(fraction.padEnd(decimals, '0') || '0');
  if (units.toString().length > 256)
    throw new Error('Invalid amount: integer too large');
  return units;
}

export function formatUnits(units: bigint, decimals: number): string {
  validateDecimals(decimals);
  if (units < 0n || units.toString().length > 256)
    throw new Error('Invalid units');
  if (decimals === 0) return units.toString();
  const padded = units.toString().padStart(decimals + 1, '0');
  const whole = padded.slice(0, -decimals);
  const fraction = padded.slice(-decimals).replace(/0+$/, '');
  return fraction ? `${whole}.${fraction}` : whole;
}
