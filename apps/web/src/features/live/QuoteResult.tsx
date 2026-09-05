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
      'Skip this swap: estimated network fees exceed 10% of the minimum receive amount.',
    INSUFFICIENT_NATIVE_BALANCE:
      'This wallet does not have enough TON for the upfront network budget plus the 0.05 TON reserve.',
    COST_DATA_UNAVAILABLE:
      quote.request.output === 'USDT'
        ? 'We cannot compare costs yet. The current USDT value of the network fees is missing. Request a new quote.'
        : 'Network fee data is missing, so we cannot check the cost. Request a new quote.',
    BALANCE_REQUIRED:
      'Read fresh wallet balances to check that you have enough of this token and enough TON for fees and the reserve.',
    STALE_QUOTE: 'This quote needs a refresh. Request a new quote.',
    WITHIN_COST_LIMIT:
      'This quote passes the cost and balance checks for this wallet. You can review it here, but you cannot send a swap.',
  };
  return (
    <section className="live-quote-result" aria-label="Live quote result">
      <span className="eyebrow">
        {providerLabels.quotes.toUpperCase()} · LATEST QUOTE
      </span>
      <h3>
        {formatUnits(BigInt(quote.expectedOutputUnits), decimals)}{' '}
        <span>{quote.request.output}</span>
      </h3>
      <p className="muted-copy">
        Estimated amount you would receive after provider fees. Network fees,
        also called gas, are separate.
      </p>
      <dl className="summary">
        <div>
          <dt>Minimum receive amount · 1% price tolerance</dt>
          <dd>
            {formatUnits(BigInt(quote.minimumOutputUnits), decimals)}{' '}
            {quote.request.output}
          </dd>
        </div>
        <div>
          <dt>Provider fee · already included</dt>
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
          <dt>TON needed upfront for the network</dt>
          <dd>
            {quote.gasBudgetUnits === null
              ? 'Unknown'
              : `${formatUnits(BigInt(quote.gasBudgetUnits), 9)} TON`}
          </dd>
        </div>
        <div>
          <dt>Estimated network fee</dt>
          <dd>
            {quote.gasConsumedUnits === null
              ? 'Unknown'
              : `${formatUnits(BigInt(quote.gasConsumedUnits), 9)} TON`}
          </dd>
        </div>
        <div>
          <dt>Swap protocol</dt>
          <dd>{quote.routes.join(', ')}</dd>
        </div>
        {quote.request.output === 'USDT' && (
          <div>
            <dt>Estimated network fee in USDT</dt>
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
          We estimate the USDT cost of gas using a separate USDT to TON quote.
          We use its minimum receive amount and round the cost up, then compare
          it with 10% of your minimum USDT receive amount. No extra swap takes
          place. Refresh this reference in{' '}
          {Math.max(0, Math.ceil((quote.gasValuation.staleAtMs - now) / 1000))}{' '}
          seconds.
        </p>
      )}
      <p role="status" className={status.acceptable ? 'success' : 'notice'}>
        {descriptions[status.reason]}
      </p>
      <p className="fine-print">
        Quoted at {new Date(quote.quotedAtMs).toLocaleTimeString()}. Refresh in{' '}
        {Math.max(0, Math.ceil((quote.previewStaleAtMs - now) / 1000))} seconds.
        This is our freshness limit, not a promise to hold the price. The
        upfront network budget can include TON that would be returned; the
        estimated fee is the amount expected to be spent. The minimum receive
        amount allows a 1% price change, often called slippage.
      </p>
    </section>
  );
}
