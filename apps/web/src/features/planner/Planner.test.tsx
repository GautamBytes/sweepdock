import { expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { reviewedAssets } from '@sweepdock/core/assets';
import type { Balances, QuotePreview } from '@sweepdock/core/read-models';
import { Planner } from './Planner';
import * as api from '../../lib/read-api';
const owner = '0:' + 'a'.repeat(64);
function balances(): Balances {
  return {
    network: 'ton-mainnet',
    readOnly: true,
    source: 'tonapi',
    address: owner,
    observedAtMs: Date.now(),
    nativeBalanceUnits: '600000000',
    complete: true,
    assets: reviewedAssets.map((a) => ({
      ...a,
      units: '1000000000',
      reviewedId: a.id,
      eligible: true,
      reason: null,
    })),
  };
}
function quote(
  input: 'STON' | 'NOT' | 'USDT',
  units = '1000000000',
): QuotePreview {
  const now = Date.now();
  return {
    network: 'ton-mainnet',
    readOnly: true,
    source: 'omniston',
    request: { input, output: 'TON', inputUnits: units },
    quoteId: input,
    expectedOutputUnits: '1000000000',
    minimumOutputUnits: '990000000',
    protocolFeeUnits: '0',
    gasBudgetUnits: '260000000',
    gasConsumedUnits: '37500000',
    quotedAtMs: now,
    observedAtMs: now,
    previewStaleAtMs: now + 30000,
    providerExpiry: null,
    routes: ['StonFiV2'],
  };
}
it('rereads balances before quoting, uses changed amounts, and invalidates on selection changes', async () => {
  const fresh = balances();
  fresh.assets[0]!.units = '2000000000';
  const reads = vi.spyOn(api, 'fetchBalances').mockResolvedValue(fresh);
  const quotes = vi
    .spyOn(api, 'fetchQuote')
    .mockImplementation(async (request) =>
      quote(request.input, request.inputUnits),
    );
  const user = userEvent.setup();
  render(<Planner balances={balances()} onSnapshot={() => {}} />);
  await user.click(screen.getByLabelText('Plan STON'));
  await user.click(screen.getByLabelText('Plan NOT'));
  await user.click(screen.getByRole('button', { name: 'Review cleanup plan' }));
  await waitFor(() => expect(screen.getByText('0.57 TON')).toBeInTheDocument());
  expect(reads).toHaveBeenCalledOnce();
  expect(quotes.mock.calls.map((c) => c[0].inputUnits)).toEqual([
    '2000000000',
    '1000000000',
  ]);
  expect(
    screen.queryByRole('button', { name: /sign|approve|send/i }),
  ).not.toBeInTheDocument();
  await user.click(screen.getByLabelText('Plan NOT'));
  expect(screen.queryByText('0.57 TON')).not.toBeInTheDocument();
});
it('reports quote failure for one asset while keeping the other result', async () => {
  vi.spyOn(api, 'fetchBalances').mockResolvedValue(balances());
  vi.spyOn(api, 'fetchQuote').mockImplementation(async (r) => {
    if (r.input === 'NOT') throw new Error('offline');
    return quote(r.input);
  });
  const user = userEvent.setup();
  render(<Planner balances={balances()} onSnapshot={() => {}} />);
  await user.click(screen.getByLabelText('Plan STON'));
  await user.click(screen.getByLabelText('Plan NOT'));
  await user.click(screen.getByRole('button', { name: 'Review cleanup plan' }));
  await waitFor(() =>
    expect(
      screen.getByText('Provider unavailable. Refresh to try again.'),
    ).toBeInTheDocument(),
  );
  expect(screen.getByText('Within the cost limit')).toBeInTheDocument();
});
it('never uses another wallet returned by the provider', async () => {
  vi.spyOn(api, 'fetchBalances').mockResolvedValue({
    ...balances(),
    address: '0:' + 'b'.repeat(64),
  });
  const quotes = vi.spyOn(api, 'fetchQuote');
  const user = userEvent.setup();
  render(<Planner balances={balances()} onSnapshot={() => {}} />);
  await user.click(screen.getByLabelText('Plan STON'));
  await user.click(screen.getByRole('button', { name: 'Review cleanup plan' }));
  await waitFor(() =>
    expect(screen.getByRole('alert')).toHaveTextContent('could not safely use'),
  );
  expect(quotes).not.toHaveBeenCalled();
});
