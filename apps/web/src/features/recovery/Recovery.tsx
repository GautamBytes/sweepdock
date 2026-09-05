import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { RotateCcw, ArrowRight } from 'lucide-react';
import {
  claimCleanupItem,
  cleanupCanClear,
  cleanupStates,
  createCleanupSession,
  fixtureSettlement,
  refreshCleanupReviews,
  respondCleanupItem,
  settleCleanupItem,
  type CleanupSession,
} from '@sweepdock/core';
import { stateLabels } from '../../lib/simulation-copy';
import { SectionHeading } from '../../app/SectionHeading';
import { Doctor } from '../doctor/Doctor';
import { readCleanupSession, saveCleanupSession } from './store';
import './recovery.css';

const messages: Record<string, string> = {
  STORAGE_UNAVAILABLE:
    'Saved data could not be read or written safely. No new attempt can start. Existing records have not been cleared.',
  SESSION_CHANGED:
    'Another tab changed this session. Load the latest saved status before continuing.',
  SESSION_UNRESOLVED:
    'An outcome is still uncertain. Resolve the original attempt before clearing this session.',
  SESSION_PAUSED:
    'This session is paused. Review its outcome before starting another session.',
  QUOTE_EXPIRED:
    'The sample review expired. Refresh the remaining reviews before approval.',
  EVIDENCE_MISMATCH:
    'The receipt does not match this attempt. Its status is unchanged.',
};
const statesCopy: Record<string, string> = {
  selected: 'Waiting for your review',
  awaiting_signature: 'Waiting for a simulated wallet response',
  submitted: 'Wallet responded · result unconfirmed',
  confirming: 'Checking the sample result',
  unknown: 'Uncertain · do not send again',
  completed: 'Completed · sample result matched',
  partial: 'Partial result · queue paused',
  aborted: 'Refunded · queue paused',
  rejected: 'Rejected · queue paused',
};
export function Recovery() {
  const doctor = useLocation().pathname === '/safety/cleanup/doctor';
  const [session, setSession] = useState<CleanupSession | null>(null);
  const [busy, setBusy] = useState(true),
    [blocked, setBlocked] = useState(false),
    [error, setError] = useState('');
  const [now, setNow] = useState(Date.now);
  const lock = useRef(false);
  useEffect(() => {
    let active = true;
    readCleanupSession(true)
      .then((s) => {
        if (active) setSession(s);
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
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);
  async function perform(action: () => Promise<CleanupSession | null>) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError('');
    try {
      setSession(await action());
      setBlocked(false);
      setNow(Date.now());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'STORAGE_UNAVAILABLE');
      setBlocked(true);
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  function change(action: (current: CleanupSession) => CleanupSession) {
    void perform(() =>
      saveCleanupSession(session, (current) => {
        if (!current) throw new Error('SESSION_CHANGED');
        return action(current);
      }),
    );
  }
  const states = session ? cleanupStates(session) : [];
  const activeIndex = states.findIndex((s) =>
    ['awaiting_signature', 'submitted', 'confirming', 'unknown'].includes(s),
  );
  const item = activeIndex >= 0 ? session?.items[activeIndex] : null;
  const state = activeIndex >= 0 ? states[activeIndex] : null;
  const pending = session?.items.find((i) => !i.attempt);
  const paused = states.some((s) => !['selected', 'completed'].includes(s));
  const expired = !!pending && pending.review.expiresAt - now < 15000;
  const events =
    session?.items
      .flatMap((i) => i.attempt?.events ?? [])
      .sort((a, b) => a.observedAt - b.observedAt) ?? [];
  if (doctor)
    return (
      <>
        <Link className="text-link" to="/safety/cleanup">
          Back to cleanup recovery
        </Link>
        {error && (
          <p role="alert">{messages[error] ?? messages.STORAGE_UNAVAILABLE}</p>
        )}
        <Doctor events={events} source="recovery" />
      </>
    );
  return (
    <>
      <SectionHeading
        icon={RotateCcw}
        eyebrow="CLEANUP RECOVERY · OFFLINE LAB"
        title="Return to an unfinished cleanup."
      >
        Practise with three sample tokens. Close or refresh the page, then
        return to the saved steps and check why an unfinished swap stays paused.
      </SectionHeading>
      <div className="simulation-note">
        <strong>Simulation only · no transactions</strong>
        <span>
          Sample tokens, wallet responses and receipts. Nothing is signed or
          sent.
        </span>
      </div>
      <div className="workspace-grid recovery-grid">
        <section className="asset-panel recovery-panel">
          <span className="eyebrow">THREE TOKENS · SEPARATE APPROVALS</span>
          <h2>Your saved cleanup</h2>
          <p className="muted-copy">
            STON, NOT and USDT → TON. Each sample swap returns an estimated 1
            TON, needs a 0.26 TON upfront budget, and keeps a 0.05 TON reserve.
            The sample wallet holds 1.20 TON.
          </p>
          {!session ? (
            <div className="recovery-empty">
              <h3>Create a saved practice session.</h3>
              <p>
                Approve one item, simulate the wallet response, then test
                success, a refund, or an uncertain result.
              </p>
              <button
                className="primary"
                disabled={busy || blocked}
                onClick={() =>
                  void perform(() =>
                    saveCleanupSession(null, () =>
                      createCleanupSession(crypto.randomUUID(), Date.now()),
                    ),
                  )
                }
              >
                Create sample cleanup{' '}
                <ArrowRight size={17} aria-hidden="true" />
              </button>
            </div>
          ) : (
            <>
              <ol className="recovery-items">
                {session.items.map((i, index) => (
                  <li key={i.review.id} data-state={states[index]}>
                    <span className="recovery-number">{index + 1}</span>
                    <div>
                      <strong>{i.symbol} → TON</strong>
                      <small>{statesCopy[states[index]!]}</small>
                    </div>
                    <span className="state">{stateLabels[states[index]!]}</span>
                  </li>
                ))}
              </ol>
              <p className="fine-print">
                Saved locally in this browser. No wallet connection or real
                address is stored. Clearing site data removes the saved sample.
              </p>
            </>
          )}
          <Link className="text-link" to="/safety/cleanup/doctor">
            Inspect this session in Swap Doctor{' '}
            <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </section>
        <section
          className="review-panel recovery-panel"
          aria-label="Recovery controls"
        >
          <span className="eyebrow">REVIEW · SIMULATE · CHECK THE RESULT</span>
          <h2>
            {item ? `${item.symbol}: follow the result` : 'One step at a time'}
          </h2>
          <p role="status" className={paused ? 'notice' : 'muted-copy'}>
            {busy
              ? 'Reading saved session…'
              : state
                ? statesCopy[state]!
                : paused
                  ? 'The queue is paused. No remaining token will be approved automatically.'
                  : session
                    ? pending
                      ? expired
                        ? 'The sample review expired. Refresh it before approval.'
                        : 'Ready for the next sample approval.'
                      : 'All three sample outcomes are matched.'
                    : 'Create a sample session to begin.'}
          </p>
          {error && (
            <p role="alert" className="notice">
              {messages[error] ?? messages.STORAGE_UNAVAILABLE}
            </p>
          )}
          <div className="recovery-actions">
            {session && pending && !paused && (
              <>
                <button
                  className="primary"
                  disabled={busy || blocked || expired}
                  onClick={() => change((s) => claimCleanupItem(s, Date.now()))}
                >
                  Approve {pending.symbol} simulation
                </button>
                <button
                  className="secondary"
                  disabled={busy || blocked}
                  onClick={() =>
                    change((s) => refreshCleanupReviews(s, Date.now()))
                  }
                >
                  Refresh remaining reviews
                </button>
              </>
            )}
            {state === 'awaiting_signature' && (
              <>
                <button
                  disabled={busy || blocked}
                  onClick={() =>
                    change((s) =>
                      respondCleanupItem(s, 'submitted', Date.now()),
                    )
                  }
                >
                  Simulate wallet response
                </button>
                <button
                  disabled={busy || blocked}
                  onClick={() =>
                    change((s) => respondCleanupItem(s, 'rejected', Date.now()))
                  }
                >
                  Simulate wallet rejection
                </button>
              </>
            )}
            {state === 'unknown' && item && !item.messageHash && (
              <button
                disabled={busy || blocked}
                onClick={() =>
                  change((s) => respondCleanupItem(s, 'submitted', Date.now()))
                }
              >
                Simulate late wallet response
              </button>
            )}
            {state &&
              ['awaiting_signature', 'submitted', 'confirming'].includes(
                state,
              ) && (
                <button
                  disabled={busy || blocked}
                  onClick={() =>
                    change((s) => respondCleanupItem(s, 'unknown', Date.now()))
                  }
                >
                  Simulate timeout
                </button>
              )}
            {item?.messageHash && (
              <>
                <button
                  disabled={busy || blocked}
                  onClick={() =>
                    change((s) =>
                      settleCleanupItem(
                        s,
                        fixtureSettlement(s, 'completed'),
                        Date.now(),
                      ),
                    )
                  }
                >
                  Simulate matching success
                </button>
                <button
                  disabled={busy || blocked}
                  onClick={() =>
                    change((s) =>
                      settleCleanupItem(
                        s,
                        fixtureSettlement(s, 'partial'),
                        Date.now(),
                      ),
                    )
                  }
                >
                  Simulate partial result
                </button>
                <button
                  disabled={busy || blocked}
                  onClick={() =>
                    change((s) =>
                      settleCleanupItem(
                        s,
                        fixtureSettlement(s, 'aborted'),
                        Date.now(),
                      ),
                    )
                  }
                >
                  Simulate full refund
                </button>
              </>
            )}
            <button
              className="secondary"
              disabled={busy}
              onClick={() => void perform(() => readCleanupSession())}
            >
              Load latest saved status
            </button>
            {session && (
              <button
                className="text-button"
                disabled={busy || blocked || !cleanupCanClear(session)}
                onClick={() =>
                  void perform(() => saveCleanupSession(session, () => null))
                }
              >
                Clear finished or unstarted sample
              </button>
            )}
          </div>
          <p className="fine-print">
            The app saves your sample approval before the next step. Refreshing
            an unfinished attempt pauses it because the result is unknown.
            Loading saved status reads the sample; it cannot confirm or send a
            real swap.
          </p>
        </section>
      </div>
      <aside className="recovery-boundary">
        <strong>Real test swaps are not enabled.</strong>
        <p>
          The documented testnet contracts have not passed our checks. This lab
          uses made-up wallet responses and results to test recovery. It does
          not show that a real testnet swap works.
        </p>
        <Link className="text-link" to="/docs/status">
          Read implementation status
        </Link>
      </aside>
    </>
  );
}
