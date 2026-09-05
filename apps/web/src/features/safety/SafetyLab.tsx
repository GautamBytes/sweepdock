import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  checkTestnetReview,
  safetyState,
  type EventKind,
  type SafetyAttempt,
  type SafetyReview,
} from '@sweepdock/core';
import { Doctor } from '../doctor/Doctor';
import {
  JournalError,
  claimSafetyAttempt,
  clearFinishedSample,
  readSafetyJournal,
  recordSafetyEvent,
} from './journal';
import './safety.css';

const messages: Record<string, string> = {
  NETWORK_MISMATCH:
    'The sample expects a testnet account. The simulated mainnet account does not match.',
  WALLET_CHANGED:
    'The wallet changed after review. Review again with the right account.',
  QUOTE_EXPIRED: 'The quote is too old. Get a fresh quote and review it again.',
  INVALID_REVIEW:
    'The review is incomplete or invalid. No attempt was started.',
  INVALID_ACCOUNT: 'The wallet account is invalid. No attempt was started.',
  STORAGE_UNAVAILABLE:
    'Saved data could not be read or written safely. Attempts are blocked; existing data has not been cleared.',
  SESSION_UNRESOLVED:
    'An attempt is already saved, possibly from another tab. Recheck its status before doing anything else.',
  SESSION_CHANGED:
    'Another tab changed this attempt. Recheck the saved status.',
};
const stateCopy: Record<string, string> = {
  awaiting_signature: 'Waiting for a simulated wallet response.',
  submitted:
    'The simulated wallet responded. The swap result is not confirmed.',
  confirming: 'Waiting for a sample result that matches this attempt.',
  unknown: 'Status not confirmed. Do not send again.',
  rejected: 'The simulated wallet rejected this request.',
  completed: 'The sample result matched this attempt. No real swap took place.',
};

export function SafetyLab() {
  const doctor = useLocation().pathname === '/safety/doctor';
  const [attempt, setAttempt] = useState<SafetyAttempt | null>(null);
  const [busy, setBusy] = useState(true);
  const [blocked, setBlocked] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scenario, setScenario] = useState('valid');
  useEffect(() => {
    let active = true;
    readSafetyJournal()
      .then((value) => {
        if (active) setAttempt(value);
      })
      .catch(() => {
        if (active) {
          setError('STORAGE_UNAVAILABLE');
          setBlocked(true);
        }
      })
      .finally(() => {
        if (active) setBusy(false);
      });
    return () => {
      active = false;
    };
  }, []);

  async function perform(action: () => Promise<SafetyAttempt | null>) {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      setAttempt(await action());
      setBlocked(false);
    } catch (error) {
      const code =
        error instanceof JournalError ? error.code : 'STORAGE_UNAVAILABLE';
      setError(code);
      setBlocked(true);
    } finally {
      setBusy(false);
    }
  }
  function start() {
    const now = Date.now();
    const review: SafetyReview = {
      id: crypto.randomUUID(),
      wallet: '0:' + 'a'.repeat(64),
      chain: '-3',
      quoteId: 'sample-quote',
      issuedAt: now - 60_000,
      expiresAt: scenario === 'expired' ? now - 1 : now + 60_000,
      inputMaster: '0:' + 'b'.repeat(64),
      outputMaster: '0:' + 'c'.repeat(64),
      units: '1000000',
    };
    const account = {
      address:
        scenario === 'changed-wallet' ? '0:' + 'd'.repeat(64) : review.wallet,
      chain: scenario === 'mainnet' ? '-239' : '-3',
    };
    const reason = checkTestnetReview(review, account, now);
    if (reason) {
      setError(reason);
      return;
    }
    void perform(() => claimSafetyAttempt(review, account));
  }
  const state = attempt ? safetyState(attempt) : null;
  function event(kind: EventKind) {
    if (attempt) void perform(() => recordSafetyEvent(attempt, kind));
  }
  if (doctor)
    return (
      <>
        <Link className="text-link" to="/safety">
          Back to safety lab
        </Link>
        {error && (
          <p role="alert">
            {messages[error]} <code>{error}</code>
          </p>
        )}
        <Doctor events={attempt?.events ?? []} source="safety" />
      </>
    );
  return (
    <>
      <div className="page-heading">
        <span className="eyebrow">OFFLINE SAFETY LAB</span>
        <h1>Test what happens after an interruption.</h1>
        <p>
          Start a sample swap and refresh before it finishes. See how the app
          remembers the unfinished attempt and blocks another one.
        </p>
      </div>
      <div className="simulation-note">
        <strong>Safety lab · simulated events</strong>
        <span>
          Made-up wallet and quote data. This lab does not connect to a wallet
          or blockchain, and it cannot send transactions.
        </span>
      </div>
      <p>
        <Link className="text-link" to="/safety/cleanup">
          Try a saved three-token cleanup →
        </Link>
      </p>
      <div className="workspace-grid safety-lab">
        <section className="asset-panel safety-panel">
          <h2>Check before starting</h2>
          <p>
            Choose a scenario to test the checks. The sample account and network
            must match the review, and the quote must have at least 15 seconds
            left.
          </p>
          <label htmlFor="safety-scenario">Safety check scenario</label>
          <select
            id="safety-scenario"
            value={scenario}
            disabled={busy || !!attempt}
            onChange={(e) => {
              setScenario(e.target.value);
              setError(null);
            }}
          >
            <option value="valid">Matching testnet wallet</option>
            <option value="mainnet">Wrong network: mainnet wallet</option>
            <option value="changed-wallet">Wallet changed after review</option>
            <option value="expired">Expired quote</option>
          </select>
          <button
            className="primary"
            disabled={busy || blocked || !!attempt}
            onClick={start}
          >
            Start simulated attempt
          </button>
          <p className="muted-copy">
            The app saves this attempt before you can simulate a wallet
            response. Another tab on this site cannot start a second attempt
            over it.
          </p>
          {error && (
            <div className="safety-error" role="alert">
              <p>{messages[error]}</p>
              <code>{error}</code>
            </div>
          )}
        </section>
        <section
          className="review-panel safety-panel"
          aria-label="Saved attempt"
        >
          <span className="eyebrow">SAVED ON THIS BROWSER</span>
          <h2>Your latest attempt</h2>
          <p role="status">
            {busy
              ? 'Checking saved data…'
              : state
                ? (stateCopy[state] ?? 'Attempt is paused.')
                : 'No saved attempt.'}
          </p>
          <div className="safety-actions">
            {state === 'awaiting_signature' && (
              <>
                <button
                  disabled={busy || blocked}
                  onClick={() => event('message_returned')}
                >
                  Simulate wallet response
                </button>
                <button
                  disabled={busy || blocked}
                  onClick={() => event('signature_rejected')}
                >
                  Simulate wallet rejection
                </button>
              </>
            )}
            {state === 'submitted' && (
              <button
                disabled={busy || blocked}
                onClick={() => event('transaction_found')}
              >
                Simulate transaction found
              </button>
            )}
            {state &&
              ['awaiting_signature', 'submitted', 'confirming'].includes(
                state,
              ) && (
                <button
                  disabled={busy || blocked}
                  onClick={() => event('status_unknown')}
                >
                  Simulate timeout
                </button>
              )}
            {state && ['confirming', 'unknown'].includes(state) && (
              <button
                disabled={busy || blocked}
                onClick={() => event('receipt_verified')}
              >
                Simulate matching receipt
              </button>
            )}
            <button
              disabled={busy}
              onClick={() => void perform(readSafetyJournal)}
            >
              Recheck saved status
            </button>
            {attempt &&
              state &&
              ['rejected', 'completed', 'aborted'].includes(state) && (
                <button
                  disabled={busy || blocked}
                  onClick={() =>
                    void perform(() => clearFinishedSample(attempt))
                  }
                >
                  Clear finished sample
                </button>
              )}
          </div>
          <Link className="text-link" to="/safety/doctor">
            Inspect in Swap Doctor
          </Link>
        </section>
      </div>
      <p className="safety-footnote">
        Recheck saved status reads this browser’s saved sample. It does not
        contact a blockchain. Refreshing an unfinished attempt marks its result
        as unknown. Use the simulation buttons to test what happens next. The
        record exists only in this browser on this site; clearing site data
        removes it.
      </p>
    </>
  );
}
