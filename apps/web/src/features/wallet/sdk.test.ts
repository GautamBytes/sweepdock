import { expect, it, vi } from 'vitest';

const sdk = vi.hoisted(() => ({
  options: {} as Record<string, unknown>,
  uiOptions: {} as Record<string, unknown>,
  notify: null as
    | null
    | ((
        wallet: { account: { address: string; chain: string } } | null,
      ) => void),
  open: vi.fn(async () => {}),
  disconnect: vi.fn(async () => {}),
  pause: vi.fn(),
  resume: vi.fn(async () => {}),
  network: vi.fn(),
  close: vi.fn(),
}));
vi.mock('@tonconnect/ui-react', () => ({
  TonConnect: class {
    constructor(options: Record<string, unknown>) {
      sdk.options = options;
    }
    pauseConnection = sdk.pause;
    unPauseConnection = sdk.resume;
  },
  TonConnectUI: class {
    constructor(options: Record<string, unknown>) {
      sdk.uiOptions = options;
    }
    setConnectionNetwork = sdk.network;
    onStatusChange(callback: typeof sdk.notify) {
      sdk.notify = callback;
      return () => {};
    }
    openModal = sdk.open;
    closeModal = sdk.close;
    disconnect = sdk.disconnect;
  },
}));
it('wraps the official picker with analytics off, memory storage, network binding and no signer', async () => {
  const { createWalletSession } = await import('./sdk');
  const session = await createWalletSession(
    'https://app.example.com/tonconnect-manifest.json',
  );
  expect(sdk.options).toMatchObject({
    analytics: { mode: 'off' },
    disableAutoPauseConnection: true,
  });
  expect(sdk.uiOptions).toMatchObject({
    analytics: { mode: 'off' },
    restoreConnection: false,
  });
  expect(sdk.network).toHaveBeenCalledWith('-239');
  expect(session).not.toHaveProperty('sendTransaction');
  expect(session).not.toHaveProperty('signData');
  const listener = vi.fn();
  const off = session.subscribe(listener);
  sdk.notify?.({ account: { address: '0:' + 'a'.repeat(64), chain: '-239' } });
  expect(session.getSnapshot().account?.address).toBe('0:' + 'a'.repeat(64));
  expect(listener).toHaveBeenCalledOnce();
  await session.openPicker();
  expect(sdk.open).toHaveBeenCalledOnce();
  session.pause();
  expect(sdk.close).toHaveBeenCalled();
  expect(sdk.pause).toHaveBeenCalled();
  session.resume();
  expect(sdk.resume).toHaveBeenCalled();
  await session.disconnect();
  expect(sdk.disconnect).toHaveBeenCalled();
  off();
});
