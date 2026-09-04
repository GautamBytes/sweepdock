import { makeShareableReport, type LifecycleEvent } from '@sweepdock/core';
import { Link } from 'react-router-dom';

const explanations: Partial<Record<LifecycleEvent['kind'], string>> = {
  signature_requested: 'Waiting for the simulated wallet response.',
  signature_rejected:
    'The simulated wallet declined. No automatic retry is allowed.',
  message_returned: 'The wallet responded. This does not prove settlement.',
  transaction_found:
    'The simulated transaction was located. Its result still needs matching evidence.',
  status_unknown:
    'The result is not confirmed. Keep the attempt paused and do not send again.',
  receipt_verified:
    'A matching receipt was simulated. This is not a real on-chain result.',
};

export function Doctor({
  events,
  source = 'cleanup',
}: {
  events: LifecycleEvent[];
  source?: 'cleanup' | 'safety';
}) {
  const report = makeShareableReport(events);
  const json = JSON.stringify(report, null, 2);
  return (
    <>
      <div className="page-heading">
        <span className="eyebrow">SWAP DOCTOR</span>
        <h1>Every step, explained.</h1>
        <p>
          See what happened in your latest{' '}
          {source === 'safety' ? 'safety lab' : 'cleanup'} simulation.
        </p>
      </div>
      <div className="simulation-note">
        <strong>
          {source === 'safety'
            ? 'Safety lab — simulated events'
            : 'Simulation trace only'}
        </strong>
        <span>
          These events are generated locally. They are not on-chain evidence.
        </span>
      </div>
      {events.length ? (
        <div className="workspace-grid">
          <section className="asset-panel trace-panel">
            <h2>Event timeline</h2>
            <ol className="timeline">
              {report.events.map((event, index) => (
                <li key={index}>
                  <span className="event-marker">{index + 1}</span>
                  <div>
                    <code>{event.stage}</code>
                    {explanations[event.stage] && (
                      <p>{explanations[event.stage]}</p>
                    )}
                    <small>
                      {event.itemAlias} · +{event.elapsedMs} ms
                    </small>
                  </div>
                </li>
              ))}
            </ol>
          </section>
          <section className="review-panel">
            <span className="eyebrow">LOCAL DIAGNOSTICS</span>
            <h2>A report you can inspect.</h2>
            <p className="muted-copy">
              Only event stages, relative times and anonymous item labels are
              included. Nothing is uploaded.
            </p>
            <a
              className="primary"
              href={`data:application/json;charset=utf-8,${encodeURIComponent(json)}`}
              download="sweepdock-simulation-report.json"
            >
              Download report
            </a>
            <details>
              <summary>Preview report contents</summary>
              <pre>{json}</pre>
            </details>
          </section>
        </div>
      ) : (
        <div className="empty-state">
          <h2>No events yet.</h2>
          <p>Run a simulation to see its lifecycle here.</p>
          <Link
            className="primary"
            to={source === 'safety' ? '/safety' : '/demo'}
          >
            {source === 'safety' ? 'Try the safety lab' : 'Try wallet cleanup'}
          </Link>
        </div>
      )}
    </>
  );
}
