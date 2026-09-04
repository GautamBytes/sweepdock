import {
  appendSafetyEvent,
  checkTestnetReview,
  parseSafetyAttempt,
  recoverSafetyAttempt,
  safetyState,
  startSafetyAttempt,
  type EventKind,
  type SafetyAccount,
  type SafetyAttempt,
  type SafetyReview,
  type SafetyReason,
} from '@sweepdock/core';

export class JournalError extends Error {
  constructor(
    public readonly code:
      | 'STORAGE_UNAVAILABLE'
      | 'SESSION_UNRESOLVED'
      | 'SESSION_CHANGED'
      | SafetyReason,
  ) {
    super(code);
  }
}

// This database only holds offline fixtures. It must never be used for live transactions.
const databaseName = 'sweepdock-safety-lab-v1';
function openJournal(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    let settled = false;
    const fail = () => {
      settled = true;
      clearTimeout(timer);
      reject(new JournalError('STORAGE_UNAVAILABLE'));
    };
    const timer = setTimeout(fail, 5_000);
    try {
      const request = indexedDB.open(databaseName, 1);
      request.onupgradeneeded = () => {
        if (settled) {
          request.transaction?.abort();
          return;
        }
        request.result.createObjectStore('attempts');
      };
      request.onerror = fail;
      request.onblocked = fail;
      request.onsuccess = () => {
        if (settled) {
          request.result.close();
          return;
        }
        settled = true;
        clearTimeout(timer);
        request.result.onversionchange = () => request.result.close();
        resolve(request.result);
      };
    } catch {
      fail();
    }
  });
}

/** Serialize read/check/write in ONE transaction, including claims from another tab. */
async function updateJournal(
  mutate: (current: SafetyAttempt | null) => SafetyAttempt | null,
) {
  const db = await openJournal();
  return new Promise<SafetyAttempt | null>((resolve, reject) => {
    let next: SafetyAttempt | null = null;
    let failure: Error = new JournalError('STORAGE_UNAVAILABLE');
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      const tx = db.transaction('attempts', 'readwrite', {
        durability: 'strict',
      });
      const finish = () => {
        clearTimeout(timer);
        db.close();
      };
      tx.oncomplete = () => {
        finish();
        resolve(next);
      };
      tx.onabort = () => {
        finish();
        reject(failure);
      };
      timer = setTimeout(() => {
        try {
          tx.abort();
        } catch {
          finish();
          reject(failure);
        }
      }, 5_000);
      const store = tx.objectStore('attempts');
      const get = store.get('current');
      get.onsuccess = () => {
        try {
          const current =
            get.result === undefined ? null : parseSafetyAttempt(get.result);
          next = mutate(current);
          if (next) store.put(parseSafetyAttempt(next), 'current');
          else if (current) store.delete('current');
        } catch (error) {
          if (error instanceof JournalError) failure = error;
          tx.abort();
        }
      };
    } catch {
      clearTimeout(timer);
      db.close();
      reject(failure);
    }
  });
}

export function readSafetyJournal() {
  return updateJournal((current) =>
    current ? recoverSafetyAttempt(current, Date.now()) : null,
  );
}

export function claimSafetyAttempt(
  review: SafetyReview,
  account: SafetyAccount,
) {
  return updateJournal((current) => {
    if (current) throw new JournalError('SESSION_UNRESOLVED');
    const now = Date.now();
    const reason = checkTestnetReview(review, account, now);
    if (reason) throw new JournalError(reason);
    return startSafetyAttempt(review, account, now);
  });
}

function checkRevision(
  current: SafetyAttempt | null,
  expected: SafetyAttempt,
): SafetyAttempt {
  if (
    !current ||
    current.review.id !== expected.review.id ||
    current.events.length !== expected.events.length
  )
    throw new JournalError('SESSION_CHANGED');
  return current;
}

export function recordSafetyEvent(expected: SafetyAttempt, kind: EventKind) {
  return updateJournal((current) =>
    appendSafetyEvent(checkRevision(current, expected), kind, Date.now()),
  );
}

export function clearFinishedSample(expected: SafetyAttempt) {
  return updateJournal((current) => {
    const latest = checkRevision(current, expected);
    if (!['rejected', 'completed', 'aborted'].includes(safetyState(latest)))
      throw new JournalError('SESSION_UNRESOLVED');
    return null;
  });
}
