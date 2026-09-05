import {
  ArrowRight,
  ArrowUpRight,
  Braces,
  Code2,
  FileCode2,
  FlaskConical,
  Gauge,
  Radio,
  Route,
  ShieldCheck,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { SectionHeading } from '../../app/SectionHeading';

const capabilities = [
  {
    icon: Braces,
    title: 'Exact token amounts',
    detail: 'Parse and format integer amounts without floating-point rounding.',
    source: 'packages/core · amounts',
  },
  {
    icon: Gauge,
    title: 'Cost and reserve checks',
    detail:
      'Compare estimated fees with the receive amount and keep enough TON aside.',
    source: 'packages/core · policy',
  },
  {
    icon: Radio,
    title: 'Read-only providers',
    detail: 'Read balances through TonAPI and check quotes from Omniston.',
    source: 'apps/api · omniston-adapter',
  },
  {
    icon: Route,
    title: 'Swap diagnostics',
    detail:
      'Follow swap states, pause unresolved attempts and export selected event fields.',
    source: 'packages/core · lifecycle & report',
  },
];
const example = `import { parseUnits, formatUnits } from '@sweepdock/core';

// Work in exact base units.
const amount = parseUnits('1.25', 9);
// 1250000000n

formatUnits(amount, 9);
// '1.25'`;

export function Developers() {
  return (
    <div className="developer-workspace">
      <SectionHeading
        icon={Code2}
        eyebrow="SWEEPDOCK KIT · IN DEVELOPMENT"
        title="Build with the same cost checks."
      >
        Explore the TypeScript code used by SweepDock. Run the example to check
        token amounts, costs and simulated swap results in your own project.
      </SectionHeading>
      <div className="section-actions">
        <Link className="primary" to="/docs/developers">
          Read the developer guide <ArrowRight size={17} aria-hidden="true" />
        </Link>
        <a
          className="text-link"
          href="https://github.com/GautamBytes/sweepdock/tree/main/packages"
          target="_blank"
          rel="noreferrer"
        >
          Explore source <ArrowUpRight size={16} aria-hidden="true" />
        </a>
      </div>
      <section
        aria-labelledby="capabilities-title"
        className="developer-capabilities"
      >
        <div className="workspace-section-title">
          <h2 id="capabilities-title">Available tools</h2>
          <span>Available in the repository</span>
        </div>
        <div className="capability-grid">
          {capabilities.map(({ icon: Icon, title, detail, source }) => (
            <article className="capability-card" key={title}>
              <span className="capability-icon">
                <Icon size={23} aria-hidden="true" />
              </span>
              <h3>{title}</h3>
              <p>{detail}</p>
              <small>{source}</small>
            </article>
          ))}
        </div>
      </section>
      <div className="developer-detail-grid">
        <section className="code-example" aria-labelledby="example-title">
          <div className="code-example-bar">
            <FileCode2 size={17} aria-hidden="true" />
            <span>amounts.ts</span>
            <span>TypeScript</span>
          </div>
          <div className="code-example-heading">
            <h2 id="example-title">
              Convert token amounts without rounding errors.
            </h2>
            <p>
              This example uses the workspace package. The developer guide also
              covers the standalone package test.
            </p>
          </div>
          <pre>
            <code>{example}</code>
          </pre>
          <div className="code-example-foot">
            <ShieldCheck size={15} aria-hidden="true" />
            Runs locally without network calls
          </div>
        </section>
        <section className="lab-card" aria-labelledby="lab-title">
          <span className="capability-icon">
            <FlaskConical size={26} aria-hidden="true" />
          </span>
          <span className="eyebrow">OFFLINE SAFETY LAB</span>
          <h2 id="lab-title">Test an interrupted swap.</h2>
          <p>
            Start a sample attempt and refresh the page before it finishes. See
            why it stays paused, then inspect the steps in Swap Doctor.
          </p>
          <Link className="secondary" to="/safety">
            Open offline safety lab <ArrowRight size={17} aria-hidden="true" />
          </Link>
          <small>Local simulation. No wallet or funds required.</small>
        </section>
      </div>
      <section className="release-boundary" aria-labelledby="boundary-title">
        <ShieldCheck size={24} aria-hidden="true" />
        <div>
          <h2 id="boundary-title">Before live use</h2>
          <p>
            Real swaps still need transaction building, wallet signing, proof of
            received funds and recovery after interruptions. An independent
            security review is also pending. The owner tested read-only
            connection and balance reading with Tonkeeper in Android Chrome.
            Broader device testing is still needed.
          </p>
        </div>
        <a
          className="text-link"
          href="https://docs.ston.fi/developer-section/omniston/sdk"
          target="_blank"
          rel="noreferrer"
        >
          Omniston docs <ArrowUpRight size={16} aria-hidden="true" />
        </a>
      </section>
    </div>
  );
}
