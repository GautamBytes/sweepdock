import { expect, it } from 'vitest';
import {
  classifySettlement,
  type SettlementExpectation,
} from '../src/settlement';
const address = (s: string) => '0:' + s.repeat(64);
const expected: SettlementExpectation = {
  environment: 'testnet',
  chain: '-3',
  attemptId: 'attempt-1',
  wallet: address('a'),
  router: address('b'),
  inputMaster: address('c'),
  outputMaster: address('d'),
  inputUnits: '100',
  minimumOutputUnits: '90',
  queryId: '1',
  messageHash: 'e'.repeat(64),
};
const receipt = {
  ...expected,
  transactionHash: 'f'.repeat(64),
  recipient: expected.wallet,
  traceComplete: true,
  successful: true,
  outputUnits: '95',
  refundUnits: '0',
};
it('requires a complete matching successful outcome, not only a wallet response', () => {
  expect(classifySettlement(expected, receipt)).toBe('completed');
  expect(
    classifySettlement(expected, { ...receipt, traceComplete: false }),
  ).toBe('unknown');
  expect(classifySettlement(expected, { ...receipt, successful: false })).toBe(
    'unknown',
  );
  expect(
    classifySettlement(expected, { messageHash: expected.messageHash }),
  ).toBe('unknown');
});
it('rejects unrelated network, attempt, router, wallet, tokens, amount, query and message', () => {
  for (const key of [
    'environment',
    'chain',
    'attemptId',
    'wallet',
    'router',
    'inputMaster',
    'outputMaster',
    'inputUnits',
    'queryId',
    'messageHash',
    'recipient',
  ]) {
    expect(classifySettlement(expected, { ...receipt, [key]: 'wrong' })).toBe(
      'unknown',
    );
  }
});
it('distinguishes a full refund from partial delivery and cannot elevate short output', () => {
  expect(classifySettlement(expected, { ...receipt, outputUnits: '80' })).toBe(
    'partial',
  );
  expect(
    classifySettlement(expected, {
      ...receipt,
      outputUnits: '0',
      refundUnits: '100',
    }),
  ).toBe('aborted');
  expect(
    classifySettlement(expected, {
      ...receipt,
      outputUnits: '1',
      refundUnits: '50',
    }),
  ).toBe('partial');
  expect(
    classifySettlement(expected, {
      ...receipt,
      outputUnits: '0',
      refundUnits: '0',
    }),
  ).toBe('unknown');
  expect(classifySettlement(expected, { ...receipt, refundUnits: '101' })).toBe(
    'unknown',
  );
});
it('never admits a mainnet expectation or a fixture into testnet evidence', () => {
  expect(classifySettlement({ ...expected, chain: '-239' }, receipt)).toBe(
    'unknown',
  );
  expect(
    classifySettlement(expected, { ...receipt, environment: 'simulation' }),
  ).toBe('unknown');
});
