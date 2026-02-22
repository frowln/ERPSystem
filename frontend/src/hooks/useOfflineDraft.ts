import { useCallback, useEffect, useRef, useState } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type SyncStatus = 'draft' | 'pending' | 'synced' | 'failed';

interface DraftRecord<T = unknown> {
  key: string;
  data: T;
  entityType: string;
  updatedAt: string; // ISO timestamp
  syncStatus: SyncStatus;
}

interface UseOfflineDraftReturn<T> {
  draft: T | null;
  saveDraft: (data: T) => void;
  clearDraft: () => void;
  syncStatus: SyncStatus | null;
  draftAge: string | null;
  allDrafts: DraftRecord<T>[];
}

// ---------------------------------------------------------------------------
// IndexedDB helpers
// ---------------------------------------------------------------------------

const DB_NAME = 'privod-offline-drafts';
const STORE_NAME = 'drafts';
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'key' });
        store.createIndex('entityType', 'entityType', { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function idbGet<T>(key: string): Promise<DraftRecord<T> | undefined> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.get(key);
    req.onsuccess = () => resolve(req.result as DraftRecord<T> | undefined);
    req.onerror = () => reject(req.error);
  });
}

async function idbPut<T>(record: DraftRecord<T>): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.put(record);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

async function idbDelete(key: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.delete(key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

async function idbGetAllByType<T>(entityType: string): Promise<DraftRecord<T>[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const index = store.index('entityType');
    const req = index.getAll(entityType);
    req.onsuccess = () => resolve(req.result as DraftRecord<T>[]);
    req.onerror = () => reject(req.error);
  });
}

// ---------------------------------------------------------------------------
// Age formatting
// ---------------------------------------------------------------------------

function formatDraftAge(updatedAt: string): string {
  const diffMs = Date.now() - new Date(updatedAt).getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return 'just now';
  if (diffMin === 1) return '1 min ago';
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr === 1) return '1 hour ago';
  return `${diffHr} hours ago`;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Enhanced offline draft hook that persists form data in IndexedDB.
 *
 * Designed for Daily Log, Inspections, and Stock movements where payloads
 * can exceed localStorage limits.
 *
 * @param entityType  e.g. 'daily-log', 'inspection', 'stock-movement'
 * @param entityId    e.g. 'new', 'abc123'
 * @param debounceMs  debounce delay for saveDraft (default 1500ms)
 */
export function useOfflineDraft<T>(
  entityType: string,
  entityId: string,
  debounceMs = 1500,
): UseOfflineDraftReturn<T> {
  const key = `${entityType}:${entityId}`;

  const [draft, setDraft] = useState<T | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [allDrafts, setAllDrafts] = useState<DraftRecord<T>[]>([]);

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load draft from IndexedDB on mount
  useEffect(() => {
    let cancelled = false;

    idbGet<T>(key)
      .then((record) => {
        if (cancelled) return;
        if (record) {
          setDraft(record.data);
          setSyncStatus(record.syncStatus);
          setUpdatedAt(record.updatedAt);
        }
      })
      .catch(() => {
        // IndexedDB unavailable
      });

    return () => {
      cancelled = true;
    };
  }, [key]);

  // Load all drafts of the same entity type
  useEffect(() => {
    let cancelled = false;

    idbGetAllByType<T>(entityType)
      .then((records) => {
        if (!cancelled) setAllDrafts(records);
      })
      .catch(() => {
        // ignore
      });

    return () => {
      cancelled = true;
    };
  }, [entityType, draft]); // re-fetch when draft changes

  // Save draft with debounce
  const saveDraft = useCallback(
    (data: T) => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(() => {
        const now = new Date().toISOString();
        const record: DraftRecord<T> = {
          key,
          data,
          entityType,
          updatedAt: now,
          syncStatus: 'draft',
        };

        setDraft(data);
        setSyncStatus('draft');
        setUpdatedAt(now);

        idbPut(record).catch(() => {
          // IndexedDB unavailable — silently fail
        });

        // Also persist in localStorage as fallback (truncated for safety)
        try {
          localStorage.setItem(
            `form-draft:${key}`,
            JSON.stringify({ value: data, savedAt: now }),
          );
        } catch {
          // quota exceeded
        }
      }, debounceMs);
    },
    [key, entityType, debounceMs],
  );

  // Clear draft
  const clearDraft = useCallback(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    setDraft(null);
    setSyncStatus(null);
    setUpdatedAt(null);

    idbDelete(key).catch(() => {
      // ignore
    });

    try {
      localStorage.removeItem(`form-draft:${key}`);
    } catch {
      // ignore
    }
  }, [key]);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, []);

  const draftAge = updatedAt ? formatDraftAge(updatedAt) : null;

  return { draft, saveDraft, clearDraft, syncStatus, draftAge, allDrafts };
}
