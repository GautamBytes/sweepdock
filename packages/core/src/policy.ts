export interface CostAssessmentInput {
  comparableOutputUnits: bigint;
  incrementalNetworkCostUnits: bigint;
  nativeBalanceUnits: bigint;
  nativeUpfrontUnits: bigint;
  nativeReserveUnits: bigint;
  maxCostBps: number;
  costsKnown: boolean;
}

export type CostReason =
  'COST_DATA_UNAVAILABLE' | 'COST_TOO_HIGH' | 'INSUFFICIENT_NATIVE_BALANCE';
export type CostDecision =
  { executable: true } | { executable: false; reason: CostReason };

export function assessCost(input: CostAssessmentInput): CostDecision {
  const values = [
    input.comparableOutputUnits,
    input.incrementalNetworkCostUnits,
    input.nativeBalanceUnits,
    input.nativeUpfrontUnits,
    input.nativeReserveUnits,
  ];
  if (
    values.some((value) => value < 0n) ||
    !Number.isInteger(input.maxCostBps) ||
    input.maxCostBps < 0 ||
    input.maxCostBps > 10000
  ) {
    throw new Error('Invalid cost input');
  }
  if (!input.costsKnown)
    return { executable: false, reason: 'COST_DATA_UNAVAILABLE' };
  if (
    input.comparableOutputUnits <= input.incrementalNetworkCostUnits ||
    input.incrementalNetworkCostUnits * 10000n >
      input.comparableOutputUnits * BigInt(input.maxCostBps)
  ) {
    return { executable: false, reason: 'COST_TOO_HIGH' };
  }
  if (
    input.nativeBalanceUnits <
    input.nativeUpfrontUnits + input.nativeReserveUnits
  ) {
    return { executable: false, reason: 'INSUFFICIENT_NATIVE_BALANCE' };
  }
  return { executable: true };
}
