import {
  cleanupCanClear,
  parseCleanupSession,
  recoverCleanupSession,
  type CleanupSession,
} from '@sweepdock/core';

const databaseName = 'sweepdock-cleanup-simulation-v1';
function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    let done = false;
    const fail = () => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      reject(new Error('STORAGE_UNAVAILABLE'));
    };
    const timer = setTimeout(fail, 5000);
    try {
      const request = indexedDB.open(databaseName, 1);
      request.onupgradeneeded = () => {
        if (done) {
          request.transaction?.abort();
          return;
        }
        request.result.createObjectStore('sessions');
      };
      request.onerror = fail;
      request.onblocked = fail;
      request.onsuccess = () => {
        if (done) {
          request.result.close();
          return;
        }
        done = true;
        clearTimeout(timer);
        const db = request.result;
        db.onversionchange = () => db.close();
        resolve(db);
      };
    } catch {
      fail();
    }
  });
}
/** Claim, validate revision, and write atomically across tabs; never call a wallet inside this transaction. */
async function update(
  mutate: (current: CleanupSession | null) => CleanupSession | null,
): Promise<CleanupSession | null> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    let next: CleanupSession | null = null;
    let failure = new Error('STORAGE_UNAVAILABLE');
    let timer: ReturnType<typeof setTimeout> | undefined;
    const finish = () => {
      clearTimeout(timer);
      db.close();
    };
    try {
      const tx = db.transaction('sessions', 'readwrite', {
        durability: 'strict',
      });
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
      }, 5000);
      const store = tx.objectStore('sessions'),
        get = store.get('current');
      get.onsuccess = () => {
        try {
          const current =
            get.result === undefined ? null : parseCleanupSession(get.result);
          next = mutate(current);
          if (next) store.put(parseCleanupSession(next), 'current');
          else if (current) store.delete('current');
        } catch (e) {
          failure = e instanceof Error ? e : failure;
          tx.abort();
        }
      };
    } catch {
      finish();
      reject(failure);
    }
  });
}
export function readCleanupSession(recover = false) {
  return update((s) =>
    s && recover ? recoverCleanupSession(s, Date.now()) : s,
  );
}
export function saveCleanupSession(
  expected: CleanupSession | null,
  mutate: (value: CleanupSession | null) => CleanupSession | null,
) {
  return update((current) => {
    if (
      expected
        ? !current ||
          current.id !== expected.id ||
          current.revision !== expected.revision
        : current !== null
    )
      throw new Error('SESSION_CHANGED');
    const next = mutate(current);
    if (current && next === null && !cleanupCanClear(current))
      throw new Error('SESSION_UNRESOLVED');
    return next;
  });
}
