import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ArrowRight, Search, ShieldCheck } from 'lucide-react';
import { formatUnits, parseUnits } from '@sweepdock/core';
import {
  quoteInputSchema,
  type Balances,
  type QuoteInput,
  type QuotePreview,
} from '@sweepdock/core/read-models';
import { fetchBalances, fetchQuote, errorCopy } from '../../lib/read-api';
import { QuoteResult } from './QuoteResult';

export function Live({
  connectedAddress,
  walletPanel,
}: { connectedAddress?: string | undefined; walletPanel?: ReactNode } = {}) {
  const [address, setAddress] = useState(connectedAddress ?? '');
  const [balances, setBalances] = useState<Balances | null>(null);
  const [balanceError, setBalanceError] = useState('');
  const [quoteError, setQuoteError] = useState('');
  const [loadingBalances, setLoadingBalances] = useState(false);
  const [loadingQuote, setLoadingQuote] = useState(false);
  const [input, setInput] = useState<QuoteInput['input']>('STON');
  const [output, setOutput] = useState<QuoteInput['output']>('TON');
  const [amount, setAmount] = useState('1');
  const [quote, setQuote] = useState<QuotePreview | null>(null);
  const [now, setNow] = useState(Date.now);
  const balanceRequest = useRef<AbortController | null>(null);
  const quoteRequest = useRef<AbortController | null>(null);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      clearInterval(timer);
      balanceRequest.current?.abort();
      quoteRequest.current?.abort();
    };
  }, []);
  function invalidateQuote() {
    quoteRequest.current?.abort();
    setQuote(null);
    setQuoteError('');
    setLoadingQuote(false);
  }
  function changeAddress(value: string) {
    balanceRequest.current?.abort();
    invalidateQuote();
    setLoadingBalances(false);
    setBalances(null);
    setBalanceError('');
    setAddress(value);
  }
  async function loadBalances() {
    balanceRequest.current?.abort();
    invalidateQuote();
    const controller = new AbortController();
    balanceRequest.current = controller;
    setLoadingBalances(true);
    setBalanceError('');
    setBalances(null);
    try {
      const data = await fetchBalances(address.trim(), controller.signal);
      if (!controller.signal.aborted) setBalances(data);
    } catch (error) {
      if (!controller.signal.aborted) setBalanceError(errorCopy(error));
    } finally {
      if (!controller.signal.aborted) setLoadingBalances(false);
    }
  }
  async function loadQuote() {
    invalidateQuote();
    let request: QuoteInput;
    try {
      request = quoteInputSchema.parse({
        input,
        output,
        inputUnits: parseUnits(amount, input === 'USDT' ? 6 : 9).toString(),
      });
    } catch {
      setQuoteError(
        'Enter a positive amount using a dot for decimals. Input and output must differ.',
      );
      return;
    }
    const controller = new AbortController();
    quoteRequest.current = controller;
    setLoadingQuote(true);
    try {
      const data = await fetchQuote(request, controller.signal);
      if (!controller.signal.aborted) {
        setQuote(data);
      }
    } catch (error) {
      if (!controller.signal.aborted) setQuoteError(errorCopy(error));
    } finally {
      if (!controller.signal.aborted) setLoadingQuote(false);
    }
  }
  function selectBalance(asset: Balances['assets'][number]) {
    if (!asset.eligible || !asset.reviewedId || !balances?.complete) return;
    invalidateQuote();
    setInput(asset.reviewedId);
    setAmount(formatUnits(BigInt(asset.units), asset.decimals));
    if (asset.reviewedId === 'USDT') setOutput('TON');
  }
  const balanceFresh = balances !== null && now - balances.observedAtMs < 60000;
  const matchingBalance = balances?.assets.find(
    (asset) => asset.reviewedId === input && asset.eligible,
  );
  const nativeForQuote =
    balanceFresh &&
    balances?.complete &&
    matchingBalance &&
    quote &&
    BigInt(matchingBalance.units) >= BigInt(quote.request.inputUnits)
      ? balances.nativeBalanceUnits
      : null;
  return (
    <>
      <div className="page-heading">
        <span className="eyebrow">WALLET CLEANUP · LIVE PREVIEW</span>
        <h1>Real balances. Clear costs.</h1>
        <p>
          Read a wallet or check a swap quote. Nothing can be signed or sent.
        </p>
      </div>
      <div className="simulation-note live-note">
        <ShieldCheck size={16} />
        <strong>Mainnet data — read only</strong>
        <span>TonAPI balances + Omniston quotes. No signing or spending.</span>
      </div>
      {walletPanel}
      <div className="workspace-grid live-grid">
        <section className="asset-panel live-balances">
          <div className="panel-header">
            <div>
              <span className="eyebrow">START WITH A PUBLIC ADDRESS</span>
              <h2>Read your wallet</h2>
            </div>
            <Search size={19} />
          </div>
          <form
            className="wallet-form"
            onSubmit={(event) => {
              event.preventDefault();
              void loadBalances();
            }}
          >
            <label htmlFor="wallet-address">Public TON wallet address</label>
            <input
              id="wallet-address"
              value={address}
              readOnly={!!connectedAddress}
              onChange={(event) => changeAddress(event.target.value)}
              placeholder="EQ…, UQ… or 0:…"
              maxLength={70}
              spellCheck={false}
              autoComplete="off"
              required
            />
            <p id="wallet-privacy" className="fine-print">
              Only paste a public address—not a seed phrase. Clicking below
              shares the address with TonAPI. It is not saved in SweepDock.
            </p>
            <button
              className="primary"
              disabled={loadingBalances}
              type="submit"
            >
              {loadingBalances ? 'Reading balances…' : 'Read wallet balances'}
              <ArrowRight size={16} />
            </button>
          </form>
          {balanceError && (
            <p role="alert" className="notice inset-notice">
              {balanceError}
            </p>
          )}
          {balances ? (
            <div className="live-wallet-data">
              <div className="balance-strip">
                <div>
                  <span>Native balance</span>
                  <strong>
                    {formatUnits(BigInt(balances.nativeBalanceUnits), 9)}{' '}
                    <small>TON</small>
                  </strong>
                </div>
              </div>
              <p className="wallet-timestamp">
                Read at {new Date(balances.observedAtMs).toLocaleTimeString()}.{' '}
                {balanceFresh
                  ? 'Current read-only snapshot.'
                  : 'Balance snapshot is stale—read it again before assessing costs.'}
              </p>
              {!balances.complete && (
                <p role="status" className="notice inset-notice">
                  Balance results are incomplete or inconsistent. Cleanup
                  selection is disabled.
                </p>
              )}
              {balances.assets.length === 0 ? (
                <div className="live-empty">
                  <h3>No jetton balances returned.</h3>
                  <p>You can still check a quote on the right.</p>
                </div>
              ) : (
                <ul className="real-asset-list">
                  {balances.assets.map((asset) => (
                    <li key={asset.master}>
                      <div className="real-asset-title">
                        <strong>{asset.symbol || 'Unknown token'}</strong>
                        <span>
                          {formatUnits(BigInt(asset.units), asset.decimals)}
                        </span>
                      </div>
                      <small>{asset.name}</small>
                      <code title={asset.master}>{asset.master}</code>
                      <div className="real-asset-action">
                        <span>
                          {asset.reason === 'METADATA_MISMATCH'
                            ? 'Metadata changed · blocked'
                            : asset.reason === 'UNSUPPORTED_TOKEN'
                              ? 'Unsupported token features'
                              : asset.reviewedId
                                ? 'Reviewed contract identity'
                                : 'Unreviewed · quotes disabled'}
                        </span>
                        <button
                          className="text-button"
                          disabled={
                            !asset.eligible ||
                            !balances.complete ||
                            !balanceFresh
                          }
                          onClick={() => selectBalance(asset)}
                        >
                          Use balance
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : (
            !loadingBalances && (
              <div className="live-empty">
                <ShieldCheck size={26} />
                <h3>Just an address. No permissions.</h3>
                <p>
                  STON, NOT and USDT are reviewed for this first version. Other
                  tokens stay visible but cannot be selected.
                </p>
              </div>
            )
          )}
        </section>
        <aside className="review-panel live-quote">
          <span className="eyebrow">EXPLORE WITHOUT A WALLET</span>
          <h2>Check a live quote</h2>
          <p className="muted-copy">
            Try an amount before sharing a wallet address. This does not reserve
            a price.
          </p>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void loadQuote();
            }}
          >
            <div className="quote-fields">
              <div>
                <label htmlFor="quote-input">From</label>
                <select
                  id="quote-input"
                  value={input}
                  onChange={(event) => {
                    invalidateQuote();
                    const value = event.target.value as QuoteInput['input'];
                    setInput(value);
                    if (value === 'USDT') setOutput('TON');
                  }}
                >
                  {['STON', 'NOT', 'USDT'].map((id) => (
                    <option key={id}>{id}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="quote-output">To</label>
                <select
                  id="quote-output"
                  value={output}
                  onChange={(event) => {
                    invalidateQuote();
                    const value = event.target.value as QuoteInput['output'];
                    setOutput(value);
                    if (value === 'USDT' && input === 'USDT') setInput('STON');
                  }}
                >
                  <option>TON</option>
                  <option>USDT</option>
                </select>
              </div>
            </div>
            <label htmlFor="quote-amount">Amount to preview</label>
            <input
              id="quote-amount"
              value={amount}
              maxLength={80}
              inputMode="decimal"
              autoComplete="off"
              onChange={(event) => {
                invalidateQuote();
                setAmount(event.target.value);
              }}
              required
            />
            <button className="primary" disabled={loadingQuote} type="submit">
              {loadingQuote ? 'Getting a quote…' : 'Get live quote'}
            </button>
            {loadingQuote && (
              <button
                className="secondary"
                type="button"
                onClick={invalidateQuote}
              >
                Cancel request
              </button>
            )}
          </form>
          {quoteError && (
            <p role="alert" className="notice">
              {quoteError}
            </p>
          )}
          {quote && (
            <QuoteResult
              quote={quote}
              nativeBalance={nativeForQuote}
              now={now}
            />
          )}
          <p className="fine-print">
            Only swap routes using STON.fi V1 or V2 are accepted for these
            read-only previews. A quote is not proof of a successful swap.
          </p>
        </aside>
      </div>
    </>
  );
}
