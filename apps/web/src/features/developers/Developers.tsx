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
    title: 'Cost guardrails',
    detail:
      'Check estimated fees and the TON reserve before a swap can make sense.',
    source: 'packages/core · policy',
  },
  {
    icon: Radio,
    title: 'Read-only providers',
    detail: 'Read TonAPI balances and validate Omniston quote snapshots.',
    source: 'apps/api · omniston-adapter',
  },
  {
    icon: Route,
    title: 'Swap diagnostics',
    detail:
      'Track lifecycle events, pause uncertain outcomes, and project an allowlisted report.',
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
        title="Useful beyond this screen."
      >
        The shared rules behind wallet cleanup, fee checks, and swap
        diagnostics. Available as repository source.
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
          <h2 id="capabilities-title">What you can build with</h2>
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
            <h2 id="example-title">Small API. Exact values.</h2>
            <p>
              A source example for this workspace; no published SDK package yet.
            </p>
          </div>
          <pre>
            <code>{example}</code>
          </pre>
          <div className="code-example-foot">
            <ShieldCheck size={15} aria-hidden="true" />
            Pure amount conversion · No network calls
          </div>
        </section>
        <section className="lab-card" aria-labelledby="lab-title">
          <span className="capability-icon">
            <FlaskConical size={26} aria-hidden="true" />
          </span>
          <span className="eyebrow">OFFLINE SAFETY LAB</span>
          <h2 id="lab-title">Explore the difficult outcomes.</h2>
          <p>
            Practise an uncertain response, a refresh, or an interrupted
            attempt. Inspect the simulated events in Swap Doctor.
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
            Transaction tracking, signing, verified settlement, persistent live
            sessions, and independent security review still need to be built and
            checked. Read-only TON Connect is implemented; a physical-device
            connection check remains pending.
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
