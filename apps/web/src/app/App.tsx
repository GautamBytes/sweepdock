import { useEffect, useState } from 'react';
import { Landing } from '../features/landing/Landing';
import { Docs } from '../features/docs/Docs';
import { Developers } from '../features/developers/Developers';
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
  ChevronRight,
  ShieldCheck,
  BookOpen,
} from 'lucide-react';
import { Cleanup } from '../features/cleanup/Cleanup';
import { Doctor } from '../features/doctor/Doctor';
import { LiveEntry } from '../features/wallet/LiveEntry';
import { Recovery } from '../features/recovery/Recovery';
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
  const docs =
    location.pathname === '/docs' || location.pathname.startsWith('/docs/');
  useEffect(() => {
    const section = location.hash
      ? document.getElementById(location.hash.slice(1))
      : null;
    if (section) section.scrollIntoView();
    else {
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }
  }, [location.pathname, location.hash]);
  const safety = location.pathname.startsWith('/safety');
  const workspaceSections = [
    {
      to: '/demo',
      label: 'Wallet Cleanup',
      detail: 'Review tokens & costs',
      Icon: Layers2,
      active: live || location.pathname === '/demo',
    },
    {
      to: '/doctor',
      label: 'Swap Doctor',
      detail: 'Understand the outcome',
      Icon: Stethoscope,
      active: location.pathname === '/doctor' || safety,
    },
    {
      to: '/developers',
      label: 'Developer Kit',
      detail: 'Explore the building blocks',
      Icon: Code2,
      active: location.pathname === '/developers',
    },
    {
      to: '/docs',
      label: 'Docs',
      detail: 'Learn & get started',
      Icon: BookOpen,
      active: docs,
    },
  ];
  const currentSection = workspaceSections.find((section) => section.active);

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
    <div className="app-shell" data-workspace={currentSection?.to.slice(1)}>
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
          {workspaceSections.map(({ to, label, detail, Icon, active }) => (
            <Link
              key={to}
              to={to}
              aria-label={label}
              aria-current={active ? 'page' : undefined}
              className={`workspace-nav-link${active ? ' active' : ''}`}
            >
              <span className="workspace-nav-icon">
                <Icon size={20} aria-hidden="true" />
              </span>
              <span className="workspace-nav-copy">
                <strong>{label}</strong>
                <small>{detail}</small>
              </span>
              <ChevronRight
                className="workspace-nav-arrow"
                size={15}
                aria-hidden="true"
              />
            </Link>
          ))}
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
          READ-ONLY PROTOTYPE <span>v0.1</span>
        </span>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="workspace-breadcrumb">
            <Link to="/">SweepDock</Link>
            <ChevronRight size={13} aria-hidden="true" />
            <span>{safety ? 'Safety lab' : currentSection?.label}</span>
          </div>
          <span className="local-badge">
            <span className="status-dot" />
            {docs
              ? 'Product documentation'
              : live
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
            <Route path="/docs/*" element={<Docs />} />
            <Route path="/safety/cleanup/*" element={<Recovery />} />
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
            <Route path="/developers" element={<Developers />} />
            <Route path="*" element={<Navigate replace to="/demo" />} />
          </Routes>
        </main>
        <footer>
          Built for a calmer TON wallet.
          <span>
            {docs
              ? 'Read-only prototype · Signing disabled'
              : safety
                ? 'Safety lab saved in this browser'
                : 'Cleanup data clears on refresh'}{' '}
            · No analytics
          </span>
        </footer>
      </div>
    </div>
  );
}
