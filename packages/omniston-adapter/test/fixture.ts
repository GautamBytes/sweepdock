import type { Quote } from '@ston-fi/omniston-sdk';
import { reviewedAssets } from '@sweepdock/core/assets';
export const asset = (value: string) => ({
  chain: {
    $case: 'ton' as const,
    value: { kind: { $case: 'jetton' as const, value } },
  },
});
// Shape recorded from a read-only SDK 0.8.9 response; IDs and time are replaced.
export function fixture(): Quote {
  return {
    rfqId: 'rfq',
    quoteId: 'quote',
    resolverId: 'resolver',
    resolverName: 'Omniston',
    inputAsset: asset(reviewedAssets[0].master),
    outputAsset: asset(reviewedAssets[2].master),
    inputUnits: '1000000000',
    outputUnits: '433907',
    integratorFeeUnits: '0',
    protocolFeeUnits: '100',
    quoteTimestamp: 1000,
    estimatedSettlementDuration: 1,
    settlementData: {
      $case: 'swap',
      value: {
        routes: [
          {
            steps: [
              {
                inputAsset: asset(reviewedAssets[0].master),
                outputAsset: asset(reviewedAssets[2].master),
                chunks: [
                  {
                    protocol: 'StonFiV2',
                    inputUnits: '1000000000',
                    outputUnits: '433907',
                  },
                ],
              },
            ],
          },
        ],
        minOutputAmount: '429568',
        recommendedMinOutputAmount: '429568',
        recommendedSlippagePips: 10000,
        priceImpactPips: 0,
      },
    },
    gasBudget: '260000000',
    estimatedGasConsumption: '37500000',
  };
}
