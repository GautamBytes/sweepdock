import { reviewedAssets, type ReviewedAsset } from './asset-registry';
export {
  reviewedAssets,
  type ReviewedAsset,
  type AssetId,
} from './asset-registry';
export function normalizeMainnetAddress(address: string): string {
  try {
    if (address.length > 70 || address !== address.trim()) throw new Error();
    if (/^0:[a-fA-F0-9]{64}$/.test(address)) return address.toLowerCase();
    if (!/^[A-Za-z0-9_+/=-]{48}$/.test(address)) throw new Error();
    const parsed = Address.parseFriendly(address);
    if (parsed.isTestOnly || parsed.address.workChain !== 0) throw new Error();
    return parsed.address.toRawString();
  } catch {
    throw new Error('Invalid mainnet address');
  }
}
export function matchReviewedAsset(
  master: string,
  decimals: number,
): ReviewedAsset | undefined {
  const canonical = normalizeMainnetAddress(master);
  return reviewedAssets.find(
    (asset) => asset.master === canonical && asset.decimals === decimals,
  );
}
import { Address } from '@ton/core';
