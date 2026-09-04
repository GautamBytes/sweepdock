import { useEffect, useState, useSyncExternalStore } from 'react';
import { Live } from '../live/Live';
import { connectionState, type ReadOnlyWalletSession } from './connection';

export function ConnectedLive({ session }: { session: ReadOnlyWalletSession }) {
  const snapshot = useSyncExternalStore(session.subscribe, session.getSnapshot);
  const account = connectionState(snapshot.account);
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let active = true;
    function visibility() {
      if (document.visibilityState === 'hidden') session.pause();
      else session.resume();
    }
    session.resume();
    // Wait until after React's mount/cleanup probe before opening the user's picker.
    void Promise.resolve().then(async () => {
      if (!active || session.getSnapshot().account) return;
      try {
        await session.openPicker();
      } catch {
        if (active) setError(true);
      }
    });
    document.addEventListener('visibilitychange', visibility);
    return () => {
      active = false;
      document.removeEventListener('visibilitychange', visibility);
      session.pause();
    };
  }, [session]);
  async function action() {
    setError(false);
    setBusy(true);
    try {
      if (snapshot.account) await session.disconnect();
      else await session.openPicker();
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }
  const key = `${snapshot.account?.chain ?? ''}:${snapshot.account?.address ?? ''}:${snapshot.error}`;
  return (
    <Live
      key={key}
      connectedAddress={account.address ?? undefined}
      walletPanel={
        <section className="wallet-connection" aria-label="Wallet connection">
          <div>
            <h2>
              {account.kind === 'connected'
                ? 'Wallet connected · mainnet'
                : 'Connect your wallet'}
            </h2>
            {account.kind === 'connected' && (
              <code title={account.address}>
                {account.address.slice(0, 9)}…{account.address.slice(-6)}
              </code>
            )}
            <p>
              Connection shares your public account, not spending permission.
              Click “Read wallet balances” to share it with TonAPI.
            </p>
            <p className="fine-print">
              Session keys stay in this page’s memory. Refreshing forgets the
              session. SDK analytics are off.
            </p>
            {account.kind === 'wrong-network' && (
              <p className="notice" role="alert">
                This wallet is on testnet or an unsupported network. This screen
                reads mainnet only. Disconnect before choosing a mainnet wallet;
                test coins cannot be used here.
              </p>
            )}
            {account.kind === 'invalid' && (
              <p className="notice" role="alert">
                The wallet returned an unsupported account. Disconnect and
                choose another wallet.
              </p>
            )}
            {(error || snapshot.error) && (
              <p className="notice" role="alert">
                Wallet connection could not be updated. No transaction was
                requested. Check the wallet and try connecting again.
              </p>
            )}
          </div>
          <button
            className="secondary"
            disabled={busy}
            onClick={() => void action()}
          >
            {busy
              ? 'Please wait…'
              : snapshot.account
                ? 'Disconnect wallet'
                : 'Connect wallet'}
          </button>
        </section>
      }
    />
  );
}
