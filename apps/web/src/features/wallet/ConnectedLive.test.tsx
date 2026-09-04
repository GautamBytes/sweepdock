import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';
import { ConnectedLive } from './ConnectedLive';
import type { ReadOnlyWalletSession, WalletSnapshot } from './connection';
import { StrictMode } from 'react';

function fakeSession() {
  let snapshot: WalletSnapshot = {
    account: { address: '0:' + 'a'.repeat(64), chain: '-239' },
    error: false,
  };
  const listeners = new Set<() => void>();
  const session: ReadOnlyWalletSession = {
    getSnapshot: () => snapshot,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    openPicker: async () => {},
    disconnect: async () => {
      change({ account: null, error: false });
    },
    resume: vi.fn(),
    pause: vi.fn(),
  };
  function change(next: WalletSnapshot) {
    snapshot = next;
    listeners.forEach((fn) => fn());
  }
  return { session, change };
}
it('fills the connected public address but waits for explicit balance-read consent', () => {
  const { session } = fakeSession();
  const fetcher = vi.fn();
  vi.stubGlobal('fetch', fetcher);
  try {
    render(<ConnectedLive session={session} />);
    expect(screen.getByLabelText('Public TON wallet address')).toHaveValue(
      '0:' + 'a'.repeat(64),
    );
    expect(screen.getByLabelText('Public TON wallet address')).toHaveAttribute(
      'readonly',
    );
    expect(fetcher).not.toHaveBeenCalled();
    expect(
      screen.queryByRole('button', { name: /approve|swap now|send/i }),
    ).not.toBeInTheDocument();
  } finally {
    vi.unstubAllGlobals();
  }
});
it('clears old reads and ignores an outstanding response when the wallet changes', async () => {
  const { session, change } = fakeSession();
  let resolveRead: (response: Response) => void = () => {};
  vi.stubGlobal(
    'fetch',
    () =>
      new Promise<Response>((resolve) => {
        resolveRead = resolve;
      }),
  );
  try {
    const user = userEvent.setup();
    render(<ConnectedLive session={session} />);
    await user.click(
      screen.getByRole('button', { name: 'Read wallet balances' }),
    );
    act(() =>
      change({
        account: { address: '0:' + 'b'.repeat(64), chain: '-239' },
        error: false,
      }),
    );
    act(() =>
      resolveRead(
        new Response(
          JSON.stringify({
            network: 'ton-mainnet',
            readOnly: true,
            source: 'tonapi',
            address: '0:' + 'a'.repeat(64),
            observedAtMs: Date.now(),
            nativeBalanceUnits: '1000000000',
            complete: true,
            assets: [],
          }),
        ),
      ),
    );
    await waitFor(() =>
      expect(screen.getByLabelText('Public TON wallet address')).toHaveValue(
        '0:' + 'b'.repeat(64),
      ),
    );
    expect(screen.queryByText('Native balance')).not.toBeInTheDocument();
  } finally {
    vi.unstubAllGlobals();
  }
});
it('blocks testnet account use and clears account data after disconnect', async () => {
  const { session, change } = fakeSession();
  const user = userEvent.setup();
  const view = render(<ConnectedLive session={session} />);
  act(() =>
    change({
      account: { address: '0:' + 'a'.repeat(64), chain: '-3' },
      error: false,
    }),
  );
  expect(screen.getByRole('alert')).toHaveTextContent('testnet');
  expect(screen.getByLabelText('Public TON wallet address')).toHaveValue('');
  await user.click(screen.getByRole('button', { name: 'Disconnect wallet' }));
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  expect(
    screen.getByLabelText('Public TON wallet address'),
  ).not.toHaveAttribute('readonly');
  view.unmount();
  expect(session.pause).toHaveBeenCalled();
});
it('opens the picker after mount and survives React strict-mode cleanup', async () => {
  const { session, change } = fakeSession();
  change({ account: null, error: false });
  let opened = false;
  session.openPicker = async () => {
    opened = true;
  };
  session.pause = () => {
    opened = false;
  };
  render(
    <StrictMode>
      <ConnectedLive session={session} />
    </StrictMode>,
  );
  await waitFor(() => expect(opened).toBe(true));
});
