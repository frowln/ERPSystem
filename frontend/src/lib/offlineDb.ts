// =============================================================================
// PRIVOD NEXT -- IndexedDB Offline Storage
// Stores offline data for defects, quality checks, daily logs, work orders,
// and photos. Provides convenience helpers: saveOffline, getOffline,
// getAllPending, and clearExpired.
// =============================================================================

const DB_NAME = 'privod-offline';
const DB_VERSION = 2;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SyncStatus = 'pending' | 'synced' | 'conflict';

export interface OfflineRecord<T = unknown> {
  id: string;
  storeName: OfflineStoreName;
  data: T;
  syncStatus: SyncStatus;
  /** Server-side version for conflict detection (ETag, timestamp, or revision) */
  serverVersion: string | null;
  createdAt: string; // ISO
  updatedAt: string; // ISO
}

export type OfflineStoreName =
  | 'defects'
  | 'qualityChecks'
  | 'dailyLogs'
  | 'workOrders'
  | 'photos';

const STORE_NAMES: readonly OfflineStoreName[] = [
  'defects',
  'qualityChecks',
  'dailyLogs',
  'workOrders',
  'photos',
] as const;

// ---------------------------------------------------------------------------
// Database open / upgrade
// ---------------------------------------------------------------------------

let dbInstance: IDBDatabase | null = null;

function openDb(): Promise<IDBDatabase> {
  if (dbInstance) return Promise.resolve(dbInstance);

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      for (const name of STORE_NAMES) {
        if (!db.objectStoreNames.contains(name)) {
          const store = db.createObjectStore(name, { keyPath: 'id' });
          store.createIndex('syncStatus', 'syncStatus', { unique: false });
          store.createIndex('updatedAt', 'updatedAt', { unique: false });
        }
      }
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      // Reset cached instance when the database closes unexpectedly
      dbInstance.onclose = () => {
        dbInstance = null;
      };
      resolve(dbInstance);
    };

    request.onerror = () => reject(request.error);
  });
}

// ---------------------------------------------------------------------------
// CRUD operations
// ---------------------------------------------------------------------------

export async function putRecord<T>(
  storeName: OfflineStoreName,
  record: OfflineRecord<T>,
): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const req = store.put(record);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function getRecord<T>(
  storeName: OfflineStoreName,
  id: string,
): Promise<OfflineRecord<T> | undefined> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const req = store.get(id);
    req.onsuccess = () => resolve(req.result as OfflineRecord<T> | undefined);
    req.onerror = () => reject(req.error);
  });
}

export async function deleteRecord(
  storeName: OfflineStoreName,
  id: string,
): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function getAllRecords<T>(
  storeName: OfflineStoreName,
): Promise<OfflineRecord<T>[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result as OfflineRecord<T>[]);
    req.onerror = () => reject(req.error);
  });
}

export async function getRecordsByStatus<T>(
  storeName: OfflineStoreName,
  status: SyncStatus,
): Promise<OfflineRecord<T>[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const index = store.index('syncStatus');
    const req = index.getAll(status);
    req.onsuccess = () => resolve(req.result as OfflineRecord<T>[]);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Count all records with the given sync status across all stores.
 */
export async function countPendingAcrossStores(): Promise<number> {
  let total = 0;
  for (const name of STORE_NAMES) {
    const records = await getRecordsByStatus(name, 'pending');
    total += records.length;
  }
  return total;
}

/**
 * Mark a record as synced after successful server push.
 */
export async function markSynced(
  storeName: OfflineStoreName,
  id: string,
  newServerVersion: string,
): Promise<void> {
  const existing = await getRecord(storeName, id);
  if (!existing) return;

  await putRecord(storeName, {
    ...existing,
    syncStatus: 'synced',
    serverVersion: newServerVersion,
    updatedAt: new Date().toISOString(),
  });
}

/**
 * Mark a record as having a conflict.
 */
export async function markConflict(
  storeName: OfflineStoreName,
  id: string,
): Promise<void> {
  const existing = await getRecord(storeName, id);
  if (!existing) return;

  await putRecord(storeName, {
    ...existing,
    syncStatus: 'conflict',
    updatedAt: new Date().toISOString(),
  });
}

/**
 * Create a new offline record with 'pending' status.
 */
export function createOfflineRecord<T>(
  storeName: OfflineStoreName,
  id: string,
  data: T,
  serverVersion: string | null = null,
): OfflineRecord<T> {
  const now = new Date().toISOString();
  return {
    id,
    storeName,
    data,
    syncStatus: 'pending',
    serverVersion,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Clear all records from a specific store.
 */
export async function clearStore(storeName: OfflineStoreName): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const req = store.clear();
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// ---------------------------------------------------------------------------
// Convenience helpers
// ---------------------------------------------------------------------------

/**
 * Save data offline with 'pending' status.
 * Creates a new record or updates an existing one.
 */
export async function saveOffline<T>(
  storeName: OfflineStoreName,
  data: T & { id?: string },
  serverVersion: string | null = null,
): Promise<OfflineRecord<T>> {
  const id = data.id || `local-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const existing = await getRecord<T>(storeName, id);

  if (existing) {
    const updated: OfflineRecord<T> = {
      ...existing,
      data,
      syncStatus: 'pending',
      serverVersion: serverVersion ?? existing.serverVersion,
      updatedAt: new Date().toISOString(),
    };
    await putRecord(storeName, updated);
    return updated;
  }

  const record = createOfflineRecord(storeName, id, data, serverVersion);
  await putRecord(storeName, record);
  return record;
}

/**
 * Get a single offline record by store and id.
 * Returns just the data payload or undefined if not found.
 */
export async function getOffline<T>(
  storeName: OfflineStoreName,
  id: string,
): Promise<T | undefined> {
  const record = await getRecord<T>(storeName, id);
  return record?.data;
}

/**
 * Get all pending records across all stores.
 */
export async function getAllPending(): Promise<OfflineRecord[]> {
  const results: OfflineRecord[] = [];
  for (const name of STORE_NAMES) {
    const records = await getRecordsByStatus(name, 'pending');
    results.push(...records);
  }
  return results;
}

/**
 * Get all records with 'conflict' status across all stores.
 */
export async function getAllConflicts(): Promise<OfflineRecord[]> {
  const results: OfflineRecord[] = [];
  for (const name of STORE_NAMES) {
    const records = await getRecordsByStatus(name, 'conflict');
    results.push(...records);
  }
  return results;
}

/**
 * Clear expired synced records older than `maxAgeDays` from all stores.
 * Only removes records that have already been synced.
 */
export async function clearExpired(maxAgeDays = 30): Promise<number> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - maxAgeDays);
  const cutoffISO = cutoff.toISOString();

  let removed = 0;

  for (const name of STORE_NAMES) {
    const synced = await getRecordsByStatus(name, 'synced');
    for (const record of synced) {
      if (record.updatedAt < cutoffISO) {
        await deleteRecord(name, record.id);
        removed++;
      }
    }
  }

  return removed;
}
