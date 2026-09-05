import type { ReadPolicy } from '../../packages/core/src/providers';

// Deployment-owned choices. A replacement requires a reviewed adapter and matching
// policy/labels here; request bodies cannot select providers, URLs or protocols.
export const readPolicy: ReadPolicy = {
  balanceSource: 'tonapi',
  quoteSource: 'omniston',
  supportedProtocols: ['StonFiV1', 'StonFiV2'],
};
export const providerLabels = {
  balances: 'TonAPI',
  quotes: 'Omniston',
  protocols: 'STON.fi V1 or V2',
};
