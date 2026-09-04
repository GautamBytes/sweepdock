import { describe, expect, it } from 'vitest';
import { assessCost, type CostAssessmentInput } from '../src/policy';

const base: CostAssessmentInput = {
  comparableOutputUnits: 10000000n,
  incrementalNetworkCostUnits: 100000n,
  nativeBalanceUnits: 1000000000n,
  nativeUpfrontUnits: 200000000n,
  nativeReserveUnits: 50000000n,
  maxCostBps: 1000,
  costsKnown: true,
};

describe('fee-aware cleanup', () => {
  it('allows an economical conversion with enough native gas', () => {
    expect(assessCost(base)).toEqual({ executable: true });
  });
  it('does not treat the entire attached native amount as consumed fees', () => {
    expect(assessCost({ ...base, nativeUpfrontUnits: 900000000n })).toEqual({
      executable: true,
    });
  });
  it('blocks missing cost data', () => {
    expect(assessCost({ ...base, costsKnown: false })).toEqual({
      executable: false,
      reason: 'COST_DATA_UNAVAILABLE',
    });
  });
  it('skips costs above the configured ratio', () => {
    expect(
      assessCost({ ...base, incrementalNetworkCostUnits: 1000001n }),
    ).toEqual({ executable: false, reason: 'COST_TOO_HIGH' });
  });
  it('allows the exact threshold', () => {
    expect(
      assessCost({ ...base, incrementalNetworkCostUnits: 1000000n }),
    ).toEqual({ executable: true });
  });
  it.each([0n, 100000n])(
    'blocks zero or nonpositive net output %s',
    (output) => {
      expect(assessCost({ ...base, comparableOutputUnits: output })).toEqual({
        executable: false,
        reason: 'COST_TOO_HIGH',
      });
    },
  );
  it('requires native upfront cost plus reserve', () => {
    expect(assessCost({ ...base, nativeBalanceUnits: 249999999n })).toEqual({
      executable: false,
      reason: 'INSUFFICIENT_NATIVE_BALANCE',
    });
    expect(assessCost({ ...base, nativeBalanceUnits: 250000000n })).toEqual({
      executable: true,
    });
  });
  it('rejects corrupt negative costs instead of approving', () => {
    expect(() =>
      assessCost({ ...base, incrementalNetworkCostUnits: -1n }),
    ).toThrow('Invalid cost input');
  });
  it.each([-1, 10001, 1.5, Number.NaN])(
    'rejects invalid basis points %s',
    (maxCostBps) => {
      expect(() => assessCost({ ...base, maxCostBps })).toThrow(
        'Invalid cost input',
      );
    },
  );
});
