import { makeShareableReport, type LifecycleEvent } from '@sweepdock/core';
import { eventLabels } from '../../lib/simulation-copy';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Download,
  FileJson,
  ListChecks,
  Play,
  Stethoscope,
} from 'lucide-react';
import { SectionHeading } from '../../app/SectionHeading';

const explanations: Partial<Record<LifecycleEvent['kind'], string>> = {
  signature_requested: 'Waiting for the simulated wallet response.',
  signature_rejected:
    'The simulated wallet declined. No automatic retry is allowed.',
  message_returned:
    'The simulated wallet responded. We still need to check whether the expected tokens arrived.',
  transaction_found:
    'The sample transaction was found. Its result still needs to match this attempt.',
  status_unknown:
    'The result is not confirmed. Keep the attempt paused and do not send again.',
  partial_verified:
    'Only part of the expected result matched. The remaining sample swaps stay paused.',
  abort_verified:
    'The sample shows a full refund. The remaining swaps stay paused for review.',
  receipt_verified:
    'The sample result matches this attempt. No real tokens moved.',
};

export function Doctor({
  events,
  source = 'cleanup',
}: {
  events: LifecycleEvent[];
  source?: 'cleanup' | 'safety' | 'recovery';
}) {
  const report = makeShareableReport(events);
  const json = JSON.stringify(report, null, 2);
  return (
    <>
      <SectionHeading
        icon={Stethoscope}
        eyebrow="SWAP DOCTOR"
        title="Understand a simulated swap."
      >
        See what happened in your latest{' '}
        {source === 'safety'
          ? 'safety lab'
          : source === 'recovery'
            ? 'saved cleanup'
            : 'cleanup'}{' '}
        simulation.
      </SectionHeading>
      <div className="simulation-note">
        <strong>
          {source === 'safety'
            ? 'Safety lab · simulated events'
            : 'Simulation history only'}
        </strong>
        <span>
          These steps come from the demo on this device. They do not confirm a
          real blockchain transaction.
        </span>
      </div>
      {events.length ? (
        <div className="workspace-grid">
          <section className="asset-panel trace-panel">
            <div className="trace-heading">
              <div>
                <span className="eyebrow">SIMULATION RECORD</span>
                <h2>Event timeline</h2>
              </div>
              <span className="trace-count">{report.events.length} events</span>
            </div>
            <ol className="timeline">
              {report.events.map((event, index) => (
                <li key={index} className={`event-${event.stage}`}>
                  <span className="event-marker">{index + 1}</span>
                  <div>
                    <code>{eventLabels[event.stage]}</code>
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
            <span className="report-icon">
              <FileJson size={24} aria-hidden="true" />
            </span>
            <span className="eyebrow">LOCAL DIAGNOSTICS</span>
            <h2>Save the simulation report.</h2>
            <p className="muted-copy">
              The file lists the steps, time between events and anonymous token
              labels. It excludes wallet addresses and stays on your device
              unless you choose to share it.
            </p>
            <a
              className="primary"
              href={`data:application/json;charset=utf-8,${encodeURIComponent(json)}`}
              download="sweepdock-simulation-report.json"
            >
              Download report <Download size={16} aria-hidden="true" />
            </a>
            <details>
              <summary>Preview report contents</summary>
              <pre>{json}</pre>
            </details>
          </section>
        </div>
      ) : (
        <div className="doctor-empty-layout">
          <section className="empty-state doctor-empty">
            <span className="empty-orbit" aria-hidden="true">
              <Stethoscope size={39} strokeWidth={1.4} />
            </span>
            <span className="eyebrow">SIMULATION TIMELINE</span>
            <h2>No events yet.</h2>
            <p>
              Run a cleanup simulation, then return here to see each step and
              its result.
            </p>
            <Link
              className="primary"
              to={
                source === 'safety'
                  ? '/safety'
                  : source === 'recovery'
                    ? '/safety/cleanup'
                    : '/demo'
              }
            >
              {source === 'safety'
                ? 'Try the safety lab'
                : 'Try wallet cleanup'}{' '}
              <ArrowRight size={17} aria-hidden="true" />
            </Link>
          </section>
          <section
            className="doctor-guide"
            aria-labelledby="doctor-guide-title"
          >
            <span className="eyebrow">HOW TO USE SWAP DOCTOR</span>
            <h2 id="doctor-guide-title">Follow a sample swap.</h2>
            <ol>
              <li>
                <Play size={19} aria-hidden="true" />
                <div>
                  <h3>Run a simulation</h3>
                  <p>Choose a demo outcome and review each simulated swap.</p>
                </div>
              </li>
              <li>
                <ListChecks size={19} aria-hidden="true" />
                <div>
                  <h3>Read the timeline</h3>
                  <p>
                    Return here to follow the events and understand a paused
                    result.
                  </p>
                </div>
              </li>
              <li>
                <FileJson size={19} aria-hidden="true" />
                <div>
                  <h3>Inspect your report</h3>
                  <p>
                    Download a JSON file of the sample steps to inspect or
                    share. SweepDock does not upload it.
                  </p>
                </div>
              </li>
            </ol>
          </section>
        </div>
      )}
    </>
  );
}
