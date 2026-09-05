import {
  buildCleanupPlan,
  type CleanupPlan,
  type LifecycleEvent,
  transition,
} from '@sweepdock/core';
import { normalizeMainnetAddress } from '@sweepdock/core/assets';
import {
  type ReadPolicy,
  type BalanceProvider,
  type QuoteProvider,
} from '@sweepdock/core/providers';
import { type QuoteInput } from '@sweepdock/core/read-models';
export function review(
  policy: ReadPolicy,
  balances: Awaited<ReturnType<BalanceProvider['read']>>,
  quotes: Awaited<ReturnType<QuoteProvider['read']>>[],
  input: QuoteInput,
): CleanupPlan {
  normalizeMainnetAddress(balances.address);
  return buildCleanupPlan({
    policy,
    balances,
    quotes,
    selected: [input.input],
    output: input.output,
    failures: {},
    now: Date.now(),
  });
}
export function replay(events: LifecycleEvent[]) {
  return events.reduce(transition, {
    id: 'sample',
    state: 'selected' as const,
    acceptedEventIds: [] as string[],
  });
}
