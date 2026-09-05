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
import { HeroArtwork } from './HeroArtwork';
import { ReachOut } from './ReachOut';
import './landing.css';

const tools = [
  {
    title: 'Wallet Cleanup',
    description:
      'Try a cleanup with sample tokens. Compare fees and skip swaps that cost too much.',
    to: '/demo',
    Icon: Layers2,
  },
  {
    title: 'Swap Doctor',
    description:
      'See what happened in a simulated swap and why an uncertain result stays paused.',
    to: '/doctor',
    Icon: Stethoscope,
  },
  {
    title: 'Developer Kit',
    description:
      'Use the shared code for token amounts, cost checks and swap reports. Try the developer example.',
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
          <span className="landing-brand-mark">
            <Layers2 size={23} strokeWidth={1.5} aria-hidden="true" />
          </span>
          SweepDock
        </Link>
        <nav aria-label="Main navigation">
          <Link to="/#how-it-works">How it works</Link>
          <Link to="/#tools">Tools</Link>
          <Link to="/docs">Docs</Link>
          <Link to="/developers">For developers</Link>
        </nav>
        <Link className="landing-nav-cta" to="/demo">
          Try the demo <ArrowUpRight size={16} aria-hidden="true" />
        </Link>
      </header>
      <main id="main" className="landing-main">
        <section className="landing-hero" aria-labelledby="landing-title">
          <HeroArtwork />
          <div className="landing-hero-content">
            <span className="landing-eyebrow hero-eyebrow">
              <span className="hero-network-dot" aria-hidden="true" />
              Wallet cleanup for TON
            </span>
            <h1 id="landing-title">
              <span>See which tokens</span>
              <em>are worth swapping.</em>
            </h1>
            <p>
              Small token balances can cost more to swap than they’re worth.
              SweepDock helps you compare what you’d receive with the fees, so
              you can decide what to keep.
            </p>
            <div className="landing-actions">
              <Link className="landing-primary" to="/demo">
                Try the demo <ArrowRight size={23} aria-hidden="true" />
              </Link>
              <Link className="landing-secondary" to="/app">
                Compare live quotes{' '}
                <ArrowUpRight size={17} aria-hidden="true" />
              </Link>
            </div>
            <div className="landing-status">
              <ShieldCheck size={17} aria-hidden="true" />
              <span>No wallet needed for the demo. No real transactions.</span>
            </div>
          </div>
        </section>
        <section
          className="landing-how"
          id="how-it-works"
          aria-labelledby="how-title"
        >
          <div className="landing-section-heading">
            <span className="landing-eyebrow">How it works</span>
            <h2 id="how-title">Check the cost before you swap.</h2>
          </div>
          <ol>
            <li>
              <span className="landing-step" aria-hidden="true">
                01
              </span>
              <div>
                <h3>Review your tokens</h3>
                <p>
                  Try sample balances, or read your TON wallet. You can connect
                  a wallet or paste its public address.
                </p>
              </div>
            </li>
            <li>
              <span className="landing-step" aria-hidden="true">
                02
              </span>
              <div>
                <h3>Compare the fees</h3>
                <p>
                  Choose a token and amount. Compare the estimated receive
                  amount, network fees and TON you’d need upfront.
                </p>
              </div>
            </li>
            <li>
              <span className="landing-step" aria-hidden="true">
                03
              </span>
              <div>
                <h3>Decide what’s worth it</h3>
                <p>
                  Review which tokens fit the cost limits and which to keep.
                  This version lets you plan and practise; it cannot send swaps.
                </p>
              </div>
            </li>
          </ol>
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
                    Your token balances <span>3</span>
                  </h2>
                  <p>Compare the sample balances.</p>
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
                  <span>Sample reserve</span>
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
                  <p>Follow a sample swap from review to result.</p>
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
                    Check the original result<small>No automatic retry</small>
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
                  This example uses sample data.
                </p>
              </div>
            </section>
          </div>
        </section>
        <section
          id="tools"
          className="landing-tools-section"
          aria-labelledby="tools-title"
        >
          <div className="landing-section-heading">
            <span className="landing-eyebrow">Explore the tools</span>
            <h2 id="tools-title">Start with what you need.</h2>
          </div>
          <div className="landing-tools">
            {tools.map(({ title, description, to, Icon }) => (
              <Link key={to} className="landing-tool" to={to}>
                <Icon size={65} strokeWidth={1.25} aria-hidden="true" />
                <h3>{title}</h3>
                <p>{description}</p>
                <ArrowRight size={29} aria-hidden="true" />
              </Link>
            ))}
          </div>
        </section>
        <section className="landing-docs" aria-labelledby="landing-docs-title">
          <div>
            <h2 id="landing-docs-title">New to SweepDock? Start here.</h2>
            <p>
              Learn why we’re building it, what it can do today, and how to use
              it. Guides for wallet owners and developers.
            </p>
          </div>
          <Link className="landing-secondary" to="/docs">
            Read the guides <ArrowRight size={18} aria-hidden="true" />
          </Link>
        </section>
        <ReachOut />
      </main>
      <footer className="landing-footer">
        <p>
          <Leaf size={31} strokeWidth={1.3} aria-hidden="true" />
          <em>You control your wallet.</em>
        </p>
        <span>
          <a
            className="landing-github"
            href="https://github.com/GautamBytes/sweepdock"
            target="_blank"
            rel="noreferrer"
          >
            <Globe2 size={17} aria-hidden="true" /> Source on GitHub
            <ArrowUpRight size={14} aria-hidden="true" />
          </a>
        </span>
      </footer>
    </div>
  );
}
