import { expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QuoteResult } from './QuoteResult';
import type { QuotePreview } from '@sweepdock/core/read-models';
const quote: QuotePreview = {
  network: 'ton-mainnet',
  readOnly: true,
  source: 'omniston',
  request: { input: 'STON', output: 'USDT', inputUnits: '10000000000' },
  quoteId: 'primary',
  expectedOutputUnits: '5000000',
  minimumOutputUnits: '4950000',
  protocolFeeUnits: '0',
  gasBudgetUnits: '260000000',
  gasConsumedUnits: '37500000',
  quotedAtMs: 1000000,
  observedAtMs: 1000000,
  previewStaleAtMs: 1030000,
  providerExpiry: null,
  routes: ['StonFiV2'],
  gasValuation: {
    source: 'reverse-quote',
    provider: 'omniston',
    referenceQuoteId: 'reference',
    inputUsdtUnits: '5000000',
    minimumTonUnits: '2000000000',
    quotedAtMs: 1000000,
    staleAtMs: 1020000,
  },
};
it('shows USDT gas as an estimate with its reference source', () => {
  render(
    <QuoteResult quote={quote} nativeBalance="1000000000" now={1000001} />,
  );
  expect(screen.getByText('0.09375 USDT')).toBeInTheDocument();
  expect(
    screen.getByText(/separate USDT to TON quote.*No extra swap takes place/i),
  ).toBeInTheDocument();
});
it('hides a stale USDT gas estimate even when the primary quote is fresh', () => {
  render(
    <QuoteResult quote={quote} nativeBalance="1000000000" now={1020000} />,
  );
  expect(screen.queryByText('0.09375 USDT')).not.toBeInTheDocument();
  expect(screen.getByRole('status')).toHaveTextContent(
    'We cannot compare costs yet',
  );
});
