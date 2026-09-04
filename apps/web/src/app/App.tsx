import { useEffect, useState } from 'react';
import { Landing } from '../features/landing/Landing';
import {
  NavLink,
  Navigate,
  Route,
  Routes,
  useLocation,
  Link,
} from 'react-router-dom';
import {
  Layers2,
  Stethoscope,
  Code2,
  ArrowUpRight,
  ShieldCheck,
} from 'lucide-react';
import { Cleanup } from '../features/cleanup/Cleanup';
import { Doctor } from '../features/doctor/Doctor';
import { LiveEntry } from '../features/wallet/LiveEntry';
import { SafetyLab } from '../features/safety/SafetyLab';
import {
  reviewAssets,
  simulateApproval,
  type DemoItem,
  type DemoOutcome,
} from '../features/demo/model';

export function App() {
  const location = useLocation();
  const live = location.pathname === '/app';
  useEffect(() => {
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [location.pathname]);
  const safety = location.pathname.startsWith('/safety');
  const [selected, setSelected] = useState<string[]>(['STON']);
  const [items, setItems] = useState<DemoItem[]>([]);
  const [outcome, setOutcome] = useState<DemoOutcome>('completed');
  if (
    import.meta.env.VITE_APP_MODE &&
    import.meta.env.VITE_APP_MODE !== 'mock'
  ) {
    return (
      <main>
        <h1>Signing mode is not available.</h1>
        <p>
          This build supports the demo and explicit read-only previews only.
        </p>
      </main>
    );
  }
  function approve() {
    setItems((previous) => {
      if (
        previous.some((item) =>
          ['unknown', 'partial', 'rejected'].includes(item.record.state),
        )
      )
        return previous;
      const next = previous.findIndex(
        (item) => item.record.state === 'review_ready',
      );
      return previous.map((item, index) =>
        index === next ? simulateApproval(item, outcome) : item,
      );
    });
  }
  if (location.pathname === '/') return <Landing />;
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <aside className="sidebar">
        <NavLink className="brand" to="/" aria-label="SweepDock home">
          <span className="brand-mark">
            <Layers2 size={23} />
          </span>
          SweepDock
        </NavLink>
        <span className="nav-label">WORKSPACE</span>
        <nav aria-label="Main navigation">
          <NavLink to="/demo">
            <Layers2 size={18} />
            Wallet Cleanup
          </NavLink>
          <NavLink to="/doctor">
            <Stethoscope size={18} />
            Swap Doctor
          </NavLink>
          <NavLink to="/developers">
            <Code2 size={18} />
            Developer Kit
          </NavLink>
        </nav>
        <div className="sidebar-note">
          <ShieldCheck size={22} />
          <strong>Your wallet stays yours.</strong>
          <p>
            No keys. No custody.
            <br />
            No real transactions in this build.
          </p>
        </div>
        <span className="sidebar-version">
          LOCAL PROTOTYPE <span>v0.1</span>
        </span>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <span>Less clutter. More clarity.</span>
          <span className="local-badge">
            <span className="status-dot" />
            {live
              ? 'Mainnet · read only'
              : location.pathname === '/developers'
                ? 'Toolkit · in development'
                : 'Offline simulation'}
          </span>
        </header>
        <main id="main">
          {(live || location.pathname === '/demo') && (
            <nav className="mode-tabs" aria-label="Data mode">
              <NavLink to="/demo">Practice with sample data</NavLink>
              <NavLink to="/app">Read live data</NavLink>
            </nav>
          )}
          <Routes>
            <Route path="/safety/*" element={<SafetyLab />} />
            <Route path="/app" element={<LiveEntry />} />
            <Route
              path="/demo"
              element={
                <Cleanup
                  selected={selected}
                  items={items}
                  outcome={outcome}
                  onSelect={(symbol) =>
                    setSelected((previous) =>
                      previous.includes(symbol)
                        ? previous.filter((item) => item !== symbol)
                        : previous.length < 5
                          ? [...previous, symbol]
                          : previous,
                    )
                  }
                  onReview={() => setItems(reviewAssets(selected))}
                  onApprove={approve}
                  onReset={() => setItems([])}
                  onOutcome={setOutcome}
                />
              }
            />
            <Route
              path="/doctor"
              element={
                <Doctor
                  events={items
                    .flatMap((item) => item.events)
                    .sort((a, b) => a.observedAt - b.observedAt)}
                />
              }
            />
            <Route
              path="/developers"
              element={
                <>
                  <div className="page-heading">
                    <span className="eyebrow">
                      SWEEPDOCK KIT · IN DEVELOPMENT
                    </span>
                    <h1>Useful beyond this screen.</h1>
                    <p>
                      The same tested core powers cleanup and its diagnostics.
                    </p>
                  </div>
                  <section className="asset-panel developer-panel">
                    <Link className="text-link" to="/safety">
                      Open offline safety lab
                    </Link>
                    <h2>Available in this local repository</h2>
                    <ul>
                      <li>Exact integer token parsing and formatting.</li>
                      <li>Fee and TON reserve checks.</li>
                      <li>
                        Read-only TonAPI balances and validated Omniston quote
                        snapshots.
                      </li>
                      <li>
                        A guarded swap lifecycle with uncertain-state handling.
                      </li>
                      <li>
                        Allowlisted simulation reports without wallet addresses
                        or payloads.
                      </li>
                    </ul>
                    <h2>Before live use</h2>
                    <p>
                      Transaction tracking, wallet signing, verified settlement
                      evidence, persistent sessions and independent security
                      review still need to be built and checked. No SDK package
                      has been published. TON Connect read-only connection is
                      implemented but requires this app’s hosted manifest and a
                      real-device connection check.
                    </p>
                    <a
                      className="text-link"
                      href="https://docs.ston.fi/developer-section/omniston/sdk"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Omniston documentation <ArrowUpRight size={16} />
                    </a>
                  </section>
                </>
              }
            />
            <Route path="*" element={<Navigate replace to="/demo" />} />
          </Routes>
        </main>
        <footer>
          Built for a calmer TON wallet.
          <span>
            {safety
              ? 'Safety lab saved in this browser'
              : 'Cleanup data clears on refresh'}{' '}
            · No analytics
          </span>
        </footer>
      </div>
    </div>
  );
}
