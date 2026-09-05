import { readPolicy } from '../../../../shared/read-policy';
import { useEffect, useRef, useState } from 'react';
import { ArrowRight, RefreshCw, Layers2 } from 'lucide-react';
import {
  buildCleanupPlan,
  formatUnits,
  freshBalance,
  selectableAsset,
  type CleanupAsset,
  type PlanReason,
} from '@sweepdock/core';
import { reviewedAssets } from '@sweepdock/core';
import {
  ReadError,
  type Balances,
  type QuoteInput,
  type QuotePreview,
} from '@sweepdock/core/read-models';
import { errorCopy, fetchBalances, fetchQuote } from '../../lib/read-api';
import './planner.css';

const reasonCopy: Record<PlanReason, string> = {
  WITHIN_COST_LIMIT: 'Within the cost limit',
  BALANCE_STALE: 'Balances expired. Refresh the plan.',
  BALANCE_INCOMPLETE: 'Incomplete balances. Refresh before reviewing.',
  ASSET_UNAVAILABLE: 'This token is unavailable or its identity changed.',
  ALREADY_OUTPUT: 'Keep this token — it is already your output.',
  NO_QUOTE: 'No route for this amount right now.',
  QUOTE_MISMATCH: 'Quote does not match this selection. Refresh the plan.',
  STALE_QUOTE: 'Quote expired. Refresh the plan.',
  COST_TOO_HIGH: 'Skip — estimated gas exceeds 10% of minimum output.',
  COST_DATA_UNAVAILABLE: 'Cost information is missing. Refresh to recheck.',
  INSUFFICIENT_NATIVE_BALANCE: 'Not enough TON for this swap and the reserve.',
  PROVIDER_UNAVAILABLE: 'Provider unavailable. Refresh to try again.',
  RATE_LIMITED: 'Request limit reached. Wait a minute, then refresh.',
  PROVIDER_INVALID_RESPONSE:
    'Provider data could not be verified. Refresh to recheck.',
};
type Snapshot = {
  balances: Balances;
  quotes: QuotePreview[];
  failures: Partial<Record<CleanupAsset, PlanReason>>;
};
export function Planner({
  balances,
  onSnapshot,
}: {
  balances: Balances | null;
  onSnapshot: (value: Balances) => void;
}) {
  const [selected, setSelected] = useState<CleanupAsset[]>([]);
  const [output, setOutput] = useState<QuoteInput['output']>('TON');
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState('');
  const [now, setNow] = useState(Date.now);
  const request = useRef<AbortController | null>(null);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      clearInterval(timer);
      request.current?.abort();
    };
  }, []);
  function invalidate() {
    request.current?.abort();
    setSnapshot(null);
    setBusy(false);
    setError('');
    setProgress('');
  }
  async function review() {
    if (!balances || !selected.length) return;
    invalidate();
    const controller = new AbortController();
    request.current = controller;
    setBusy(true);
    setProgress('Refreshing wallet balances…');
    try {
      const fresh = await fetchBalances(balances.address, controller.signal);
      if (controller.signal.aborted) return;
      if (fresh.address !== balances.address)
        throw new ReadError('PROVIDER_INVALID_RESPONSE');
      onSnapshot(fresh);
      const next: Snapshot = { balances: fresh, quotes: [], failures: {} };
      if (fresh.complete && freshBalance(fresh, Date.now())) {
        // Sequential requests fit the shared API concurrency limit and can be cancelled.
        for (const id of selected) {
          const asset = selectableAsset(fresh, id);
          if (!asset || id === output) continue;
          setProgress(`Checking ${id} → ${output}…`);
          try {
            const quote = await fetchQuote(
              { input: id, output, inputUnits: asset.units },
              controller.signal,
            );
            if (controller.signal.aborted) return;
            next.quotes.push(quote);
          } catch (e) {
            if (controller.signal.aborted) return;
            next.failures[id] =
              e instanceof ReadError &&
              [
                'NO_QUOTE',
                'RATE_LIMITED',
                'PROVIDER_INVALID_RESPONSE',
              ].includes(e.code)
                ? (e.code as PlanReason)
                : 'PROVIDER_UNAVAILABLE';
          }
        }
      }
      if (!controller.signal.aborted) {
        setNow(Date.now());
        setSnapshot(next);
      }
    } catch (e) {
      if (!controller.signal.aborted) setError(errorCopy(e));
    } finally {
      if (!controller.signal.aborted) {
        setBusy(false);
        setProgress('');
      }
    }
  }
  const plan = snapshot
    ? buildCleanupPlan({
        ...snapshot,
        selected,
        output,
        now,
        policy: readPolicy,
      })
    : null;
  const available = balances?.complete && freshBalance(balances, now);
  const approved =
    plan?.rows.filter((r) => r.reason === 'WITHIN_COST_LIMIT').length ?? 0;
  const expired = plan?.rows.some((r) =>
    ['STALE_QUOTE', 'BALANCE_STALE'].includes(r.reason),
  );
  const units = (n: bigint) =>
    `${formatUnits(n, output === 'TON' ? 9 : 6)} ${output}`;
  return (
    <section
      className="cleanup-planner asset-panel"
      aria-labelledby="planner-title"
    >
      <div className="panel-header">
        <div>
          <span className="eyebrow">ONE WALLET · ONE CLEAR PLAN</span>
          <h2 id="planner-title">Plan your cleanup</h2>
        </div>
        <Layers2 aria-hidden="true" size={24} />
      </div>
      <div className="planner-body">
        <p className="muted-copy">
          Choose the tokens to review together. See what is worth swapping and
          how much TON the whole plan needs.
        </p>
        {!balances ? (
          <p className="notice">
            Read a wallet above to choose tokens. Your address and plan stay out
            of browser storage.
          </p>
        ) : (
          <>
            <fieldset className="planner-selection">
              <legend>Tokens to review</legend>
              {reviewedAssets.map((a) => {
                const asset = selectableAsset(balances, a.id);
                return (
                  <label className="planner-token" key={a.id}>
                    <input
                      type="checkbox"
                      aria-label={`Plan ${a.id}`}
                      checked={selected.includes(a.id)}
                      disabled={!asset || !available || a.id === output}
                      onChange={() => {
                        invalidate();
                        setSelected((s) =>
                          s.includes(a.id)
                            ? s.filter((id) => id !== a.id)
                            : [...s, a.id],
                        );
                      }}
                    />
                    <span>
                      <strong>{a.symbol}</strong>
                      <small>
                        {asset
                          ? formatUnits(BigInt(asset.units), asset.decimals)
                          : 'Unavailable'}
                        {a.id === output ? ' · Keep as output' : ''}
                      </small>
                    </span>
                  </label>
                );
              })}
            </fieldset>
            {!available && (
              <p className="notice">
                Balances need a fresh, complete read. Refresh a selected plan or
                read the wallet again above.
              </p>
            )}
            <div className="planner-controls">
              <div>
                <label htmlFor="plan-output">Receive in</label>
                <select
                  id="plan-output"
                  value={output}
                  onChange={(e) => {
                    invalidate();
                    const value = e.target.value as QuoteInput['output'];
                    setOutput(value);
                    setSelected((s) => s.filter((id) => id !== value));
                  }}
                >
                  <option>TON</option>
                  <option>USDT</option>
                </select>
              </div>
              <button
                className="primary"
                disabled={busy || selected.length === 0}
                onClick={() => void review()}
              >
                {busy
                  ? 'Checking your plan…'
                  : snapshot
                    ? 'Refresh balances & quotes'
                    : 'Review cleanup plan'}
                {snapshot ? (
                  <RefreshCw size={16} aria-hidden="true" />
                ) : (
                  <ArrowRight size={16} aria-hidden="true" />
                )}
              </button>
              {busy && (
                <button className="secondary" onClick={invalidate}>
                  Cancel plan
                </button>
              )}
            </div>
          </>
        )}
        {busy && <p role="status">{progress}</p>}
        {error && (
          <p role="alert" className="notice">
            {error}
          </p>
        )}
        {plan && (
          <div className="planner-result">
            <div className="planner-verdict" role="status">
              <span className="eyebrow">READ-ONLY REVIEW</span>
              <h3>
                {expired
                  ? 'Your plan needs a refresh'
                  : plan.withinBudget
                    ? `${approved} ${approved === 1 ? 'token fits' : 'tokens fit'} your cost limits`
                    : approved
                      ? 'The full plan needs more TON'
                      : 'No tokens cleared for cleanup'}
              </h3>
              <p>
                {expired
                  ? 'Fresh prices are required before relying on these estimates.'
                  : plan.withinBudget
                    ? 'The suggested tokens fit the combined upfront gas budget and reserve.'
                    : approved
                      ? 'Deselect a token or add TON, then refresh. Expected swap proceeds are not counted as available gas.'
                      : 'Review the reasons below. You can keep these tokens and check again later.'}
              </p>
            </div>
            <ul className="planner-rows">
              {plan.rows.map((row) => (
                <li key={row.asset}>
                  <div>
                    <strong>
                      {row.asset} <span aria-hidden="true">→</span> {output}
                    </strong>
                    <p
                      className={
                        row.reason === 'WITHIN_COST_LIMIT'
                          ? 'success'
                          : 'notice'
                      }
                    >
                      {reasonCopy[row.reason]}
                    </p>
                  </div>
                  {row.reason === 'WITHIN_COST_LIMIT' && row.quote && (
                    <dl>
                      <div>
                        <dt>Expected output</dt>
                        <dd>{units(BigInt(row.quote.expectedOutputUnits))}</dd>
                      </div>
                      <div>
                        <dt>Minimum output</dt>
                        <dd>{units(BigInt(row.quote.minimumOutputUnits))}</dd>
                      </div>
                      <div>
                        <dt>Estimated gas</dt>
                        <dd>
                          {formatUnits(BigInt(row.quote.gasConsumedUnits!), 9)}{' '}
                          TON
                        </dd>
                      </div>
                    </dl>
                  )}
                </li>
              ))}
            </ul>
            {approved > 0 && (
              <dl className="planner-totals">
                <div>
                  <dt>Expected output · included tokens</dt>
                  <dd>{units(plan.totals.expectedOutput)}</dd>
                </div>
                <div>
                  <dt>Minimum output · included tokens</dt>
                  <dd>{units(plan.totals.minimumOutput)}</dd>
                </div>
                <div>
                  <dt>Estimated gas spent</dt>
                  <dd>{formatUnits(plan.totals.gasSpent, 9)} TON</dd>
                </div>
                <div>
                  <dt>Total upfront gas budget</dt>
                  <dd>{formatUnits(plan.totals.gasBudget, 9)} TON</dd>
                </div>
                <div>
                  <dt>TON to keep untouched</dt>
                  <dd>0.05 TON</dd>
                </div>
                <div className="planner-total">
                  <dt>TON required before cleanup</dt>
                  <dd>{formatUnits(plan.totals.requiredTon, 9)} TON</dd>
                </div>
              </dl>
            )}
            <p className="fine-print">
              Totals include only tokens within their individual cost limits.
              Output includes provider fees; network gas is separate. Each swap
              would require a new quote and its own approval. This plan cannot
              sign or send transactions.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
