import { ArrowRight, Check, ShieldCheck } from 'lucide-react';
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
      <div className="page-heading">
        <span className="eyebrow">WALLET CLEANUP</span>
        <h1>A little less clutter.</h1>
        <p>Review small token balances. Keep the swaps that make sense.</p>
      </div>
      <div className="simulation-note">
        <span className="status-dot" />
        <strong>Simulation — no real funds</strong>
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
                Your token shelf <span className="count">6</span>
              </h2>
            </div>
            <span className="small-label">TON network · demo</span>
          </div>
          <div className="balance-strip">
            <div>
              <span>TON set aside for fees</span>
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
                        ? 'Already your output token'
                        : !asset.available
                          ? 'Not available for swapping'
                          : 'Illustrative value'}
                  </small>
                </div>
              </label>
            ))}
          </div>
          <div className="panel-foot">
            <ShieldCheck size={16} />
            <span>
              Unreviewed tokens stay out. STON is preselected only for this
              demo.
            </span>
          </div>
        </section>
        <aside className="review-panel" aria-label="Cleanup review">
          <span className="eyebrow">YOUR CLEANUP</span>
          <h2>
            {items.length
              ? 'Review your cleanup'
              : 'Small balances. One place.'}
          </h2>
          {!items.length ? (
            <>
              <p className="muted-copy">
                Choose a few tokens to explore how a cleanup works.
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
                Each swap needs its own review and approval. This is not a
                single batch transaction.
              </p>
            </>
          ) : (
            <>
              <ul className="session-items">
                {items.map((item) => (
                  <li key={item.record.id}>
                    <strong>{item.asset.symbol}</strong>
                    <span className={`state state-${item.record.state}`}>
                      {item.record.state.replaceAll('_', ' ')}
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
                    Partial result simulated. The remaining queue is paused for
                    review.
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
                      These are fixed scenario values, not executable quotes.
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
                Scenario controls only. A real pending transaction would need
                reconciliation before another attempt.
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
            <small>Try a failure case, too. It matters.</small>
          </div>
        </aside>
      </div>
      <div className="bottom-note">
        <span>01 — SELECT</span>
        <span>02 — CHECK COSTS</span>
        <span>03 — REVIEW EACH SWAP</span>
        <span>04 — FOLLOW THE RESULT</span>
      </div>
    </>
  );
}
