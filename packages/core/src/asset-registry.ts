export const reviewedAssets = [
  {
    id: 'STON',
    symbol: 'STON',
    name: 'STON',
    decimals: 9,
    master:
      '0:3690254dc15b2297610cda60744a45f2b710aa4234b89adb630e99d79b01bd4f',
    input: true,
  },
  {
    id: 'NOT',
    symbol: 'NOT',
    name: 'Notcoin',
    decimals: 9,
    master:
      '0:2f956143c461769579baef2e32cc2d7bc18283f40d20bb03e432cd603ac33ffc',
    input: true,
  },
  {
    id: 'USDT',
    symbol: 'USDT',
    name: 'Tether USD',
    decimals: 6,
    master:
      '0:b113a994b5024a16719f69139328eb759596c38a25f59028b146fecdc3621dfe',
    input: true,
  },
] as const;
export type ReviewedAsset = (typeof reviewedAssets)[number];
export type AssetId = ReviewedAsset['id'] | 'TON';
