import { makeShareableReport, type LifecycleEvent } from '@sweepdock/core';
import { Link } from 'react-router-dom';

export function Doctor({ events }: { events: LifecycleEvent[] }) {
  const report = makeShareableReport(events);
  const json = JSON.stringify(report, null, 2);
  return (
    <>
      <div className="page-heading">
        <span className="eyebrow">SWAP DOCTOR</span>
        <h1>Every step, explained.</h1>
        <p>See what happened in your latest cleanup simulation.</p>
      </div>
      <div className="simulation-note">
        <strong>Simulation trace only</strong>
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
          <p>Run a cleanup simulation to see its lifecycle here.</p>
          <Link className="primary" to="/demo">
            Try wallet cleanup
          </Link>
        </div>
      )}
    </>
  );
}
