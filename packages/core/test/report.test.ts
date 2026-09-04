import { expect, it } from 'vitest';
import { makeShareableReport } from '../src/report';

it('exports only approved fields and local aliases', () => {
  const events = [
    {
      id: 'secret-id',
      itemId: 'private-wallet',
      kind: 'quote_requested' as const,
      observedAt: 1000,
      apiKey: 'secret-key',
      amount: '9000',
      boc: 'secret-boc',
    },
  ];
  const report = makeShareableReport(events);
  expect(report.events).toEqual([
    { itemAlias: 'item-1', elapsedMs: 0, stage: 'quote_requested' },
  ]);
  expect(JSON.stringify(report)).not.toMatch(/secret|private-wallet|9000|1000/);
});

it('keeps aliases stable and times relative', () => {
  const report = makeShareableReport([
    { id: 'a', itemId: 'wallet-a', kind: 'quote_requested', observedAt: 1000 },
    { id: 'b', itemId: 'wallet-b', kind: 'quote_requested', observedAt: 1002 },
    { id: 'c', itemId: 'wallet-a', kind: 'quote_ready', observedAt: 1010 },
  ]);
  expect(report.events.map((e) => e.itemAlias)).toEqual([
    'item-1',
    'item-2',
    'item-1',
  ]);
  expect(report.events.map((e) => e.elapsedMs)).toEqual([0, 2, 10]);
});

it('returns a labelled empty simulation report', () => {
  expect(makeShareableReport([])).toEqual({
    schemaVersion: 1,
    environment: 'simulation',
    events: [],
  });
});
