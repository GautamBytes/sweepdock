import { TonConnect, TonConnectUI } from '@tonconnect/ui-react';
import {
  manifestUrl,
  memoryStorage,
  type ReadOnlyWalletSession,
  type WalletSnapshot,
} from './connection';

let cached: { manifest: string; session: ReadOnlyWalletSession } | null = null;

export async function createWalletSession(
  manifest: string,
): Promise<ReadOnlyWalletSession> {
  if (manifestUrl(manifest) !== manifest)
    throw new Error('Invalid wallet configuration');
  if (cached) {
    if (cached.manifest !== manifest)
      throw new Error('Reload before changing wallet configuration');
    return cached.session;
  }
  const connector = new TonConnect({
    manifestUrl: manifest,
    storage: memoryStorage(),
    analytics: { mode: 'off' },
    disableAutoPauseConnection: true,
  });
  const ui = new TonConnectUI({
    connector,
    restoreConnection: false,
    analytics: { mode: 'off' },
    enableAndroidBackHandler: false,
  });
  ui.setConnectionNetwork('-239');
  let snapshot: WalletSnapshot = { account: null, error: false };
  const listeners = new Set<() => void>();
  function notify(next: WalletSnapshot) {
    snapshot = next;
    listeners.forEach((listener) => listener());
  }
  ui.onStatusChange(
    (wallet) =>
      notify({
        account: wallet
          ? { address: wallet.account.address, chain: wallet.account.chain }
          : null,
        error: false,
      }),
    () => notify({ account: null, error: true }),
  );
  const session: ReadOnlyWalletSession = {
    getSnapshot: () => snapshot,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    openPicker: () => ui.openModal(),
    disconnect: () => ui.disconnect(),
    pause() {
      ui.closeModal();
      connector.pauseConnection();
    },
    resume() {
      void connector
        .unPauseConnection()
        .catch(() => notify({ account: null, error: true }));
    },
  };
  cached = { manifest, session };
  return session;
}
