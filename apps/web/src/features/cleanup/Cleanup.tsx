import { ArrowRight, Check, ShieldCheck, Layers2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SectionHeading } from '../../app/SectionHeading';
import { stateLabels } from '../../lib/simulation-copy';
import { formatUnits } from '@sweepdock/core';
import { assets, type DemoItem, type DemoOutcome } from '../demo/model';

interface Props {
  selected: string[];
  items: DemoItem[];
  outcome: DemoOutcome;
  onSelect: (symbol: string) => void;
  onReview: () => void;
  onApprove: () => void;
  onReset: () => void;
  onOutcome: (outcome: DemoOutcome) => void;
}

export function Cleanup({
  selected,
  items,
  outcome,
  onSelect,
  onReview,
  onApprove,
  onReset,
  onOutcome,
}: Props) {
  const paused = items.some((item) =>
    ['unknown', 'partial', 'rejected'].includes(item.record.state),
  );
  const current = paused
    ? undefined
    : items.find((item) => item.record.state === 'review_ready');
  const completed = items.filter((item) => item.record.state === 'completed');
  const total = assets
    .filter((asset) => selected.includes(asset.symbol))
    .reduce((sum, asset) => sum + asset.output, 0n);
  return (
    <>
      <SectionHeading
        icon={Layers2}
        eyebrow="WALLET CLEANUP"
        title="Decide which tokens to keep."
      >
        Select sample tokens, compare their costs and practise each swap. This
        demo uses made-up balances and never connects to a wallet.
      </SectionHeading>
      <div className="simulation-note">
        <span className="status-dot" />
        <strong>Simulation · no real funds</strong>
        <span>
          Sample balances and prices. No wallet connection or live quotes.
        </span>
      </div>
      <div className="workspace-grid">
        <section className="asset-panel" aria-labelledby="balances-title">
          <div className="panel-header">
            <div>
              <span className="eyebrow">SAMPLE WALLET</span>
              <h2 id="balances-title">
                Your token balances <span className="count">6</span>
              </h2>
            </div>
            <span className="small-label">TON network · demo</span>
          </div>
          <div className="balance-strip">
            <div>
              <span>Sample TON balance</span>
              <strong>
                1.20 <small>TON</small>
              </strong>
            </div>
            <ShieldCheck size={21} />
            <p>
              Keep a little TON.
              <br />
              Swaps still need network fees.
            </p>
          </div>
          <div className="table-header">
            <span>ASSET</span>
            <span>BALANCE</span>
            <span>SAMPLE VALUE</span>
          </div>
          <div className="asset-list">
            {assets.map((asset) => (
              <label
                className={`asset-row ${!asset.available ? 'unavailable' : ''}`}
                key={asset.symbol}
              >
                <div className="asset-name">
                  <input
                    type="checkbox"
                    aria-label={`Select ${asset.symbol}`}
                    checked={selected.includes(asset.symbol)}
                    disabled={!asset.available || items.length > 0}
                    onChange={() => onSelect(asset.symbol)}
                  />
                  <span className={`coin ${asset.color}`} aria-hidden="true">
                    {asset.symbol === '???' ? '?' : asset.symbol.charAt(0)}
                  </span>
                  <div>
                    <strong>{asset.symbol}</strong>
                    <small>{asset.name}</small>
                  </div>
                </div>
                <span className="numeric">{asset.balance}</span>
                <div className="asset-value">
                  <span className="numeric">
                    {asset.symbol === '???'
                      ? 'Unknown'
                      : `${formatUnits(asset.output, 6)} USDT`}
                  </span>
                  <small>
                    {asset.symbol === 'REDO'
                      ? 'Likely too small to swap'
                      : asset.symbol === 'USDT'
                        ? 'Keeping USDT in this demo'
                        : !asset.available
                          ? 'Not available for swapping'
                          : 'Sample value'}
                  </small>
                </div>
              </label>
            ))}
          </div>
          <div className="panel-foot">
            <ShieldCheck size={16} />
            <span>
              Tokens we have not reviewed cannot be selected. STON is selected
              to help you start the demo.
            </span>
          </div>
        </section>
        <aside className="review-panel" aria-label="Cleanup review">
          <span className="eyebrow">YOUR CLEANUP</span>
          <h2>
            {items.length ? 'Review your cleanup' : 'Choose tokens to compare.'}
          </h2>
          {!items.length ? (
            <>
              <p className="muted-copy">
                Select tokens, then review their estimated costs. Try REDO to
                see why a small balance may be worth keeping.
              </p>
              <div className="output-token">
                <span>Convert to</span>
                <strong>
                  <span className="mini-coin">₮</span> USDT
                </strong>
              </div>
              <dl className="summary">
                <div>
                  <dt>Selected tokens</dt>
                  <dd>{selected.length} / 5</dd>
                </div>
                <div>
                  <dt>Sample value before costs</dt>
                  <dd>{formatUnits(total, 6)} USDT</dd>
                </div>
                <div>
                  <dt>Minimum TON reserve</dt>
                  <dd>0.05 TON</dd>
                </div>
              </dl>
              <button
                className="primary"
                disabled={!selected.length}
                onClick={onReview}
              >
                Review selection <ArrowRight size={18} />
              </button>
              <p className="fine-print">
                Keep at least 0.05 TON aside in addition to the network budget.
                In this demo, you review and approve each sample swap on its
                own.
              </p>
            </>
          ) : (
            <>
              <ul className="session-items">
                {items.map((item) => (
                  <li key={item.record.id}>
                    <strong>{item.asset.symbol}</strong>
                    <span className={`state state-${item.record.state}`}>
                      {stateLabels[item.record.state]}
                    </span>
                  </li>
                ))}
              </ul>
              <div role="status" className="result-messages">
                {items
                  .filter((item) => item.record.state === 'skipped')
                  .map((item) => (
                    <p className="notice" key={item.record.id}>
                      {item.asset.symbol} skipped: estimated cost is too high.
                    </p>
                  ))}
                {completed.length > 0 && (
                  <p className="success">
                    <Check size={16} />
                    Simulated swap completed
                  </p>
                )}
                {items.some((item) => item.record.state === 'unknown') && (
                  <p className="notice">
                    Status not confirmed. Do not send again.
                  </p>
                )}
                {items.some((item) => item.record.state === 'partial') && (
                  <p className="notice">
                    Only part of the expected result matched in this simulation.
                    The remaining swaps are paused.
                  </p>
                )}
                {items.some((item) => item.record.state === 'rejected') && (
                  <p className="notice">
                    Approval declined. No simulated transaction was sent.
                  </p>
                )}
              </div>
              {current && (
                <>
                  <div className="quote-card">
                    <span>NEXT SIMULATED SWAP</span>
                    <strong>
                      {current.asset.balance} {current.asset.symbol}{' '}
                      <ArrowRight size={17} />{' '}
                      {formatUnits(current.asset.output, 6)} USDT
                    </strong>
                    <p>
                      Estimated network cost:{' '}
                      {formatUnits(current.asset.cost, 6)} USDT equivalent.
                    </p>
                    <small>
                      These are sample amounts. You cannot trade at these
                      prices.
                    </small>
                  </div>
                  <button className="primary" onClick={onApprove}>
                    Approve simulation
                  </button>
                </>
              )}
              <button className="secondary" onClick={onReset}>
                Start new simulation
              </button>
              <p className="fine-print">
                Resetting starts a new practice scenario. For a real pending
                swap, you would need to check the original result before trying
                again.
              </p>
            </>
          )}
          <div className="demo-controls">
            <label htmlFor="demo-outcome">Demo outcome</label>
            <select
              id="demo-outcome"
              value={outcome}
              disabled={items.length > 0}
              onChange={(event) => onOutcome(event.target.value as DemoOutcome)}
            >
              <option value="completed">Successful swap</option>
              <option value="unknown">Unconfirmed transaction</option>
              <option value="rejected">Wallet rejection</option>
              <option value="partial">Partial result</option>
            </select>
            <small>
              Choose a different outcome to see why the demo pauses.
            </small>
          </div>
        </aside>
      </div>
      <p>
        <Link className="text-link" to="/safety/cleanup">
          Try saving a cleanup and returning after refresh →
        </Link>
      </p>
      <div className="bottom-note">
        <span>01 · SELECT</span>
        <span>02 · CHECK COSTS</span>
        <span>03 · REVIEW EACH SWAP</span>
        <span>04 · FOLLOW THE RESULT</span>
      </div>
    </>
  );
}
