import { useEffect, useRef, useState } from 'react';
import { Live } from '../live/Live';
import { ConnectedLive } from './ConnectedLive';
import { manifestUrl, type ReadOnlyWalletSession } from './connection';

export function LiveEntry() {
  const manifest = manifestUrl(import.meta.env.VITE_TONCONNECT_MANIFEST_URL);
  const [session, setSession] = useState<ReadOnlyWalletSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const active = useRef(false);
  const pending = useRef(false);
  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
    };
  }, []);
  async function connect() {
    if (!manifest || pending.current) return;
    pending.current = true;
    setLoading(true);
    setError(false);
    let next: ReadOnlyWalletSession | null = null;
    try {
      const { createWalletSession } = await import('./sdk');
      if (!active.current) return;
      next = await createWalletSession(manifest);
      if (!active.current) {
        next.pause();
        return;
      }
      setSession(next);
    } catch {
      next?.pause();
      if (active.current) setError(true);
    } finally {
      pending.current = false;
      if (active.current) setLoading(false);
    }
  }
  if (session) return <ConnectedLive session={session} />;
  return (
    <Live
      walletPanel={
        <section className="wallet-connection" aria-label="Wallet connection">
          <div>
            <h2>Connect or paste an address</h2>
            <p>
              Choose your wallet to share its public address, or paste an
              address below. Connecting does not allow SweepDock to spend your
              funds.
            </p>
            {!manifest && (
              <p className="fine-print">
                Wallet connection is not configured for this preview. You can
                still paste a public address or check a quote.
              </p>
            )}
            {error && (
              <p className="notice" role="alert">
                The wallet picker could not open. Try again, or paste a public
                address below. No transaction was requested.
              </p>
            )}
          </div>
          <button
            className="secondary"
            disabled={!manifest || loading}
            onClick={() => void connect()}
          >
            {loading ? 'Opening wallet picker…' : 'Connect wallet'}
          </button>
        </section>
      }
    />
  );
}
