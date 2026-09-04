import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Code2,
  Globe2,
  Layers2,
  Leaf,
  LockKeyhole,
  Pause,
  ShieldCheck,
  Stethoscope,
  Circle,
  Coins,
} from 'lucide-react';
import { formatUnits } from '@sweepdock/core';
import { assets } from '../demo/model';
import './landing.css';

const tools = [
  {
    title: 'Wallet Cleanup',
    description:
      'Explore small balances and estimate cleanup costs before you act.',
    to: '/demo',
    Icon: Layers2,
  },
  {
    title: 'Swap Doctor',
    description:
      'Understand simulated swaps and outcomes with a clear timeline.',
    to: '/doctor',
    Icon: Stethoscope,
  },
  {
    title: 'Developer Kit',
    description: 'Build with SweepDock tools. Toolkit in development.',
    to: '/developers',
    Icon: Code2,
  },
];
const previewAssets = assets.filter((asset) =>
  ['STON', 'NOT', 'USDT'].includes(asset.symbol),
);

export function Landing() {
  return (
    <div className="landing">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="landing-header">
        <Link to="/" className="landing-brand" aria-label="SweepDock home">
          SweepDock
        </Link>
        <nav aria-label="Main navigation">
          {tools.map((tool) => (
            <Link key={tool.to} to={tool.to}>
              {tool.title}
            </Link>
          ))}
          <Link to="/docs">Docs</Link>
        </nav>
        <a
          className="landing-github"
          href="https://github.com/GautamBytes/sweepdock"
          target="_blank"
          rel="noreferrer"
        >
          <Globe2 size={20} aria-hidden="true" />
          <span>GitHub</span>
          <ArrowUpRight size={14} aria-hidden="true" />
        </a>
      </header>
      <main id="main" className="landing-main">
        <section className="landing-hero" aria-labelledby="landing-title">
          <h1 id="landing-title">
            Make room
            <br />
            for <em>clarity.</em>
          </h1>
          <p>
            A considered way to explore small balances
            <br className="desktop-break" /> and understand every swap.
          </p>
          <div className="landing-actions">
            <Link className="landing-primary" to="/demo">
              Explore demo <ArrowRight size={23} aria-hidden="true" />
            </Link>
            <Link className="landing-secondary" to="/app">
              Read live quotes <ArrowUpRight size={17} aria-hidden="true" />
            </Link>
          </div>
          <div className="landing-status">
            <span className="status-dot" />
            Read-only prototype <span aria-hidden="true">·</span> Signing
            disabled
          </div>
        </section>
        <section className="ledger-preview" aria-label="Sample cleanup preview">
          <span className="preview-label">Sample data</span>
          <div className="preview-grid">
            <section
              className="preview-shelf"
              aria-labelledby="preview-shelf-title"
            >
              <div className="preview-heading">
                <div>
                  <h2 id="preview-shelf-title">
                    Your token shelf <span>3</span>
                  </h2>
                  <p>Small balances, one place.</p>
                </div>
                <small>TON network · demo</small>
              </div>
              <table className="preview-table">
                <caption className="sr-only">
                  Illustrative balances from the offline demo. These are not
                  live prices.
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Asset</th>
                    <th scope="col">Balance</th>
                    <th scope="col">Sample value</th>
                    <th scope="col">Next step</th>
                  </tr>
                </thead>
                <tbody>
                  {previewAssets.map((asset) => (
                    <tr key={asset.symbol}>
                      <th scope="row">
                        <span className={`preview-token ${asset.color}`}>
                          <Coins size={20} aria-hidden="true" />
                        </span>
                        <span>
                          {asset.symbol}
                          <small>{asset.name}</small>
                        </span>
                      </th>
                      <td>{asset.balance}</td>
                      <td>
                        {formatUnits(asset.output, 6)} <span>USDT</span>
                      </td>
                      <td>
                        {asset.available ? (
                          <Link
                            to="/demo"
                            aria-label={`Open cleanup demo from ${asset.symbol} sample`}
                          >
                            Review <ArrowUpRight size={14} aria-hidden="true" />
                          </Link>
                        ) : (
                          <span className="preview-keep">Keep</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="preview-reserve">
                <ShieldCheck size={19} aria-hidden="true" />
                <p>
                  Keep a little TON.
                  <br />
                  Swaps still need network fees.
                </p>
                <div>
                  <span>Min. reserve</span>
                  <strong>0.05 TON</strong>
                </div>
              </div>
            </section>
            <section
              className="preview-timeline"
              aria-labelledby="preview-timeline-title"
            >
              <div className="preview-heading">
                <div>
                  <h2 id="preview-timeline-title">Cleanup timeline</h2>
                  <p>Review before you act.</p>
                </div>
              </div>
              <ol>
                <li>
                  <span className="preview-marker">
                    <Check size={20} aria-hidden="true" />
                  </span>
                  <div>
                    Simulation created<small>Sample wallet loaded</small>
                  </div>
                  <span className="preview-time">Step 01</span>
                </li>
                <li>
                  <span className="preview-marker">
                    <Check size={20} aria-hidden="true" />
                  </span>
                  <div>
                    Costs reviewed<small>Each token checked separately</small>
                  </div>
                  <span className="preview-time">Step 02</span>
                </li>
                <li className="preview-paused">
                  <span className="preview-marker">
                    <Pause size={20} aria-hidden="true" />
                  </span>
                  <strong>
                    Unconfirmed.
                    <br />
                    Keep this attempt paused.
                  </strong>
                </li>
                <li className="preview-pending">
                  <Circle size={25} aria-hidden="true" />
                  <div>
                    Await matching evidence<small>No automatic retry</small>
                  </div>
                </li>
                <li className="preview-pending">
                  <Circle size={25} aria-hidden="true" />
                  <div>Review the outcome</div>
                </li>
              </ol>
              <div className="preview-lock">
                <LockKeyhole size={19} aria-hidden="true" />
                <p>
                  No transactions are made.
                  <br />
                  This is an illustrative simulation.
                </p>
              </div>
            </section>
          </div>
        </section>
        <section className="landing-tools" aria-label="Explore SweepDock tools">
          {tools.map(({ title, description, to, Icon }) => (
            <Link key={to} className="landing-tool" to={to}>
              <Icon size={65} strokeWidth={1.25} aria-hidden="true" />
              <h2>{title}</h2>
              <p>{description}</p>
              <ArrowRight size={29} aria-hidden="true" />
            </Link>
          ))}
        </section>
        <section className="landing-docs" aria-labelledby="landing-docs-title">
          <div>
            <h2 id="landing-docs-title">
              Understand the why. Find your next step.
            </h2>
            <p>
              Read the thinking behind SweepDock, explore its current limits,
              and follow a guide for wallet users or developers.
            </p>
          </div>
          <Link className="landing-secondary" to="/docs">
            Explore the docs <ArrowRight size={18} aria-hidden="true" />
          </Link>
        </section>
      </main>
      <footer className="landing-footer">
        <p>
          <Leaf size={31} strokeWidth={1.3} aria-hidden="true" />
          <em>Your wallet stays yours.</em>
        </p>
        <span>
          No custody <span aria-hidden="true">·</span> Open source
        </span>
      </footer>
    </div>
  );
}
