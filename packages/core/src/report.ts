import type { LifecycleEvent } from './lifecycle';

export function makeShareableReport(events: readonly LifecycleEvent[]) {
  const aliases = new Map<string, string>();
  const start = events[0]?.observedAt ?? 0;
  return {
    schemaVersion: 1,
    environment: 'simulation',
    events: events.map((event) => {
      if (!aliases.has(event.itemId))
        aliases.set(event.itemId, `item-${aliases.size + 1}`);
      return {
        itemAlias: aliases.get(event.itemId)!,
        elapsedMs: Math.max(0, event.observedAt - start),
        stage: event.kind,
      };
    }),
  };
}
