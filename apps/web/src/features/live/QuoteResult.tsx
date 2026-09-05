import { providerLabels } from '../../../../shared/read-policy';
import { formatUnits } from '@sweepdock/core';
import type { QuotePreview } from '@sweepdock/core/read-models';
import { assessPreview, gasValueInUsdt } from './economics';

export function QuoteResult({
  quote,
  nativeBalance,
  now,
}: {
  quote: QuotePreview;
  nativeBalance: string | null;
  now: number;
}) {
  const decimals = quote.request.output === 'TON' ? 9 : 6;
  const status = assessPreview(quote, nativeBalance, now);
  const usdtGas = gasValueInUsdt(quote, now);
  const descriptions: Record<string, string> = {
    COST_TOO_HIGH:
      'Skip this swap: estimated network cost exceeds the cleanup limit.',
    INSUFFICIENT_NATIVE_BALANCE:
      'Not enough TON for the upfront gas budget and the 0.05 TON reserve.',
    COST_DATA_UNAVAILABLE:
      quote.request.output === 'USDT'
        ? 'Cost check unavailable: a fresh USDT gas valuation is missing. Request a new quote. This quote is not cleared for cleanup.'
        : 'Gas information is missing. This quote is not cleared for cleanup.',
    BALANCE_REQUIRED:
      'Load a wallet to check its TON reserve. This quote alone does not prove affordability.',
    STALE_QUOTE: 'Preview is stale. Request a fresh quote.',
    WITHIN_COST_LIMIT:
      'Within the estimated cost limit for this wallet. Signing is still disabled.',
  };
  return (
    <section className="live-quote-result" aria-label="Live quote result">
      <span className="eyebrow">
        {providerLabels.quotes.toUpperCase()} · LIVE SNAPSHOT
      </span>
      <h3>
        {formatUnits(BigInt(quote.expectedOutputUnits), decimals)}{' '}
        <span>{quote.request.output}</span>
      </h3>
      <p className="muted-copy">
        Expected output after provider fees. Network gas is shown separately.
      </p>
      <dl className="summary">
        <div>
          <dt>Minimum output · 1% slippage</dt>
          <dd>
            {formatUnits(BigInt(quote.minimumOutputUnits), decimals)}{' '}
            {quote.request.output}
          </dd>
        </div>
        <div>
          <dt>Protocol fee · already included</dt>
          <dd>
            {formatUnits(BigInt(quote.protocolFeeUnits), decimals)}{' '}
            {quote.request.output}
          </dd>
        </div>
        <div>
          <dt>SweepDock fee</dt>
          <dd>0</dd>
        </div>
        <div>
          <dt>Upfront gas budget</dt>
          <dd>
            {quote.gasBudgetUnits === null
              ? 'Unknown'
              : `${formatUnits(BigInt(quote.gasBudgetUnits), 9)} TON`}
          </dd>
        </div>
        <div>
          <dt>Estimated gas spent</dt>
          <dd>
            {quote.gasConsumedUnits === null
              ? 'Unknown'
              : `${formatUnits(BigInt(quote.gasConsumedUnits), 9)} TON`}
          </dd>
        </div>
        <div>
          <dt>Route protocol</dt>
          <dd>{quote.routes.join(', ')}</dd>
        </div>
        {quote.request.output === 'USDT' && (
          <div>
            <dt>Gas value in USDT · estimate</dt>
            <dd>
              {usdtGas === null
                ? 'Unavailable'
                : `${formatUnits(usdtGas, 6)} USDT`}
            </dd>
          </div>
        )}
      </dl>
      {usdtGas !== null && quote.gasValuation && (
        <p className="fine-print">
          Based on a USDT→TON reference quote—not another swap. Uses its minimum
          output and rounds the gas value up. The 10% cost check uses your
          minimum USDT output. This is an estimate, not a guaranteed exchange
          rate. Reference freshness:{' '}
          {Math.max(0, Math.ceil((quote.gasValuation.staleAtMs - now) / 1000))}
          s.
        </p>
      )}
      <p role="status" className={status.acceptable ? 'success' : 'notice'}>
        {descriptions[status.reason]}
      </p>
      <p className="fine-print">
        Quoted at {new Date(quote.quotedAtMs).toLocaleTimeString()}. Preview
        freshness:{' '}
        {Math.max(0, Math.ceil((quote.previewStaleAtMs - now) / 1000))}s
        remaining. The provider does not publish a guaranteed expiry here; this
        is not an executable offer.
      </p>
    </section>
  );
}
