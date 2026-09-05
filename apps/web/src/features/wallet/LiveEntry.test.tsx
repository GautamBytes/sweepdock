import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';
import { LiveEntry } from './LiveEntry';

const factory = vi.hoisted(() => vi.fn());
vi.mock('./sdk', () => ({ createWalletSession: factory }));
it('does not initialize the SDK without a configured public manifest', () => {
  vi.stubEnv('VITE_TONCONNECT_MANIFEST_URL', '');
  try {
    render(<LiveEntry />);
    expect(
      screen.getByRole('button', { name: 'Connect wallet' }),
    ).toBeDisabled();
    expect(
      screen.getByText(/Wallet connection is not configured/i),
    ).toBeInTheDocument();
    expect(factory).not.toHaveBeenCalled();
  } finally {
    vi.unstubAllEnvs();
  }
});
it('loads the wallet adapter only after a user click and handles failure plainly', async () => {
  vi.stubEnv(
    'VITE_TONCONNECT_MANIFEST_URL',
    'https://app.example.com/tonconnect-manifest.json',
  );
  factory.mockRejectedValueOnce(new Error('provider private detail'));
  try {
    const user = userEvent.setup();
    render(<LiveEntry />);
    expect(factory).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Connect wallet' }));
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(
        'The wallet picker could not open',
      ),
    );
    expect(
      screen.queryByText(/provider private detail/),
    ).not.toBeInTheDocument();
  } finally {
    vi.unstubAllEnvs();
    factory.mockReset();
  }
});
