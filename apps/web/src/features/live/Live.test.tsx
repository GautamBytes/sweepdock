import { expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Live } from './Live';

it('keeps mainnet reads explicit and never opens a wallet', () => {
  render(<Live />);
  expect(screen.getByText('Mainnet data — read only')).toBeInTheDocument();
  expect(
    screen.getByRole('button', { name: 'Read wallet balances' }),
  ).toBeInTheDocument();
  expect(
    screen.queryByRole('button', { name: /connect wallet|approve|swap now/i }),
  ).not.toBeInTheDocument();
});
it('shows a useful API error without replacing it with demo balances', async () => {
  vi.stubGlobal(
    'fetch',
    async () =>
      new Response('{"error":"PROVIDER_UNAVAILABLE"}', { status: 503 }),
  );
  try {
    const user = userEvent.setup();
    render(<Live />);
    await user.type(
      screen.getByLabelText('Public TON wallet address'),
      '0:' + 'a'.repeat(64),
    );
    await user.click(
      screen.getByRole('button', { name: 'Read wallet balances' }),
    );
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(
        'The data provider is unavailable',
      ),
    );
    expect(screen.queryByText('Your token shelf')).not.toBeInTheDocument();
  } finally {
    vi.unstubAllGlobals();
  }
});
it('lets a user request a quote without sharing a wallet address', () => {
  render(<Live />);
  expect(
    screen.getByRole('heading', { name: 'Check a live quote' }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole('button', { name: 'Get live quote' }),
  ).toBeInTheDocument();
});
