import {
  assessCost,
  transition,
  type EventKind,
  type LifecycleEvent,
  type SwapRecord,
} from '@sweepdock/core';

export const assets = [
  {
    symbol: 'STON',
    name: 'STON',
    balance: '4.5',
    output: 13500000n,
    cost: 60000n,
    color: 'stone',
    available: true,
  },
  {
    symbol: 'NOT',
    name: 'Notcoin',
    balance: '800',
    output: 4000000n,
    cost: 80000n,
    color: 'ink',
    available: true,
  },
  {
    symbol: 'DOGS',
    name: 'Dogs',
    balance: '12,000',
    output: 1800000n,
    cost: 60000n,
    color: 'blue',
    available: true,
  },
  {
    symbol: 'REDO',
    name: 'Resistance Dog',
    balance: '0.1',
    output: 20000n,
    cost: 80000n,
    color: 'sand',
    available: true,
  },
  {
    symbol: 'USDT',
    name: 'Tether USD',
    balance: '25',
    output: 25000000n,
    cost: 0n,
    color: 'green',
    available: false,
  },
  {
    symbol: '???',
    name: 'Unreviewed token',
    balance: 'Unknown',
    output: 0n,
    cost: 0n,
    color: 'muted',
    available: false,
  },
] as const;
export type Asset = (typeof assets)[number];
export type DemoOutcome = 'completed' | 'unknown' | 'rejected' | 'partial';
export interface DemoItem {
  asset: Asset;
  record: SwapRecord;
  events: LifecycleEvent[];
}

function advance(item: DemoItem, kinds: EventKind[]): DemoItem {
  let record = item.record;
  const events = [...item.events];
  for (const kind of kinds) {
    const event = {
      id: `${record.id}:${events.length}`,
      itemId: record.id,
      kind,
      observedAt: Date.now(),
    };
    record = transition(record, event);
    events.push(event);
  }
  return { ...item, record, events };
}

export function reviewAssets(selected: string[]): DemoItem[] {
  return assets
    .filter((asset) => asset.available && selected.includes(asset.symbol))
    .slice(0, 5)
    .map((asset) => {
      const cost = assessCost({
        comparableOutputUnits: asset.output,
        incrementalNetworkCostUnits: asset.cost,
        nativeBalanceUnits: 1200000000n,
        nativeUpfrontUnits: 250000000n,
        nativeReserveUnits: 50000000n,
        maxCostBps: 1000,
        costsKnown: true,
      });
      return advance(
        {
          asset,
          record: { id: asset.symbol, state: 'selected', acceptedEventIds: [] },
          events: [],
        },
        ['quote_requested', cost.executable ? 'quote_ready' : 'skip'],
      );
    });
}

// Explicit offline scenarios, not an emulator of Omniston responses.
export function simulateApproval(
  item: DemoItem,
  outcome: DemoOutcome,
): DemoItem {
  if (outcome === 'rejected')
    return advance(item, ['signature_requested', 'signature_rejected']);
  const events: EventKind[] = ['signature_requested', 'message_returned'];
  if (outcome === 'unknown') events.push('status_unknown');
  else
    events.push(
      'transaction_found',
      outcome === 'partial' ? 'partial_verified' : 'receipt_verified',
    );
  return advance(item, events);
}
