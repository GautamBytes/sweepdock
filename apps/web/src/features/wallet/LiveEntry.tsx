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
              Use the official TON Connect wallet picker, or keep using
              public-address lookup. No signature or payment is requested.
            </p>
            {!manifest && (
              <p className="fine-print">
                Connection needs this app’s public HTTPS manifest. It is not
                configured in this local preview yet. Address lookup and live
                quotes still work.
              </p>
            )}
            {error && (
              <p className="notice" role="alert">
                Wallet connection could not open. Check the app setup and try
                again. Nothing was signed or sent.
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
