// =============================================================================
// PRIVOD NEXT -- Offline Cache (IndexedDB)
// Pre-caches critical reference data (user profile, project list, task list,
// material catalog) for offline access. Integrates with TanStack Query as a
// fallback data source when the network is unavailable.
// =============================================================================

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DB_NAME = 'privod-offline-cache';
const DB_VERSION = 1;
const STORE_NAME = 'cache';

/** Maximum age for cached entries before they are considered stale (24h) */
const MAX_AGE_MS = 24 * 60 * 60 * 1000;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type OfflineCacheKey =
  | 'user-profile'
  | 'project-list'
  | 'task-list'
  | 'material-catalog';

interface CachedEntry<T = unknown> {
  key: OfflineCacheKey;
  data: T;
  cachedAt: number; // epoch ms
}

// ---------------------------------------------------------------------------
// IndexedDB helpers
// ---------------------------------------------------------------------------

let dbInstance: IDBDatabase | null = null;

function openDb(): Promise<IDBDatabase> {
  if (dbInstance) return Promise.resolve(dbInstance);

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'key' });
      }
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      dbInstance.onclose = () => {
        dbInstance = null;
      };
      resolve(dbInstance);
    };

    request.onerror = () => reject(request.error);
  });
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Store data in the offline cache.
 */
export async function setOfflineCache<T>(
  key: OfflineCacheKey,
  data: T,
): Promise<void> {
  try {
    const db = await openDb();
    const entry: CachedEntry<T> = { key, data, cachedAt: Date.now() };
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(entry);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    // IndexedDB unavailable (e.g. in incognito on older browsers)
  }
}

/**
 * Retrieve data from the offline cache.
 * Returns `undefined` if not found or if the entry has expired.
 */
export async function getFromOfflineCache<T>(
  key: OfflineCacheKey,
): Promise<T | undefined> {
  try {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);
      req.onsuccess = () => {
        const entry = req.result as CachedEntry<T> | undefined;
        if (!entry) {
          resolve(undefined);
          return;
        }
        // Check staleness
        if (Date.now() - entry.cachedAt > MAX_AGE_MS) {
          resolve(undefined);
          return;
        }
        resolve(entry.data);
      };
      req.onerror = () => reject(req.error);
    });
  } catch {
    return undefined;
  }
}

/**
 * Remove a specific entry from the cache.
 */
export async function removeOfflineCache(key: OfflineCacheKey): Promise<void> {
  try {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    // ignore
  }
}

/**
 * Clear all entries from the offline cache.
 */
export async function clearOfflineCache(): Promise<void> {
  try {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    // ignore
  }
}

// ---------------------------------------------------------------------------
// Pre-caching logic
// ---------------------------------------------------------------------------

/**
 * Pre-cache critical reference data when online.
 * Call this once on app load (after authentication).
 * Uses dynamic imports to avoid circular dependency issues with API modules.
 */
export async function preCacheCriticalData(): Promise<void> {
  if (!navigator.onLine) return;

  try {
    const [{ apiClient }, { useAuthStore }] = await Promise.all([
      import('@/api/client'),
      import('@/stores/authStore'),
    ]);

    const auth = useAuthStore.getState();
    if (!auth.isAuthenticated || !auth.token) return;

    // Pre-cache user profile
    try {
      const userProfile = auth.user;
      if (userProfile) {
        await setOfflineCache('user-profile', userProfile);
      }
    } catch {
      // Non-critical
    }

    // Pre-cache project list (names + IDs only, first page)
    try {
      const projectsRes = await apiClient.get('/projects', {
        params: { page: 0, size: 100 },
      });
      const projects = projectsRes.data;
      if (projects) {
        await setOfflineCache('project-list', projects);
      }
    } catch {
      // Non-critical
    }

    // Pre-cache task list (first page)
    try {
      const tasksRes = await apiClient.get('/tasks', {
        params: { page: 0, size: 50 },
      });
      const tasks = tasksRes.data;
      if (tasks) {
        await setOfflineCache('task-list', tasks);
      }
    } catch {
      // Non-critical
    }

    // Pre-cache material catalog (spec items for the current org)
    try {
      const materialsRes = await apiClient.get('/specifications', {
        params: { page: 0, size: 50 },
      });
      const materials = materialsRes.data;
      if (materials) {
        await setOfflineCache('material-catalog', materials);
      }
    } catch {
      // Non-critical
    }
  } catch {
    // Pre-caching failed entirely — non-critical, app works normally
  }
}

// ---------------------------------------------------------------------------
// TanStack Query integration
// ---------------------------------------------------------------------------

/**
 * Creates a query function wrapper that tries the network first, then
 * falls back to the offline cache when the network is unavailable.
 *
 * Usage with TanStack Query:
 * ```ts
 * const { data } = useQuery({
 *   queryKey: ['projects'],
 *   queryFn: withOfflineFallback(
 *     () => projectsApi.getProjects(),
 *     'project-list',
 *   ),
 * });
 * ```
 */
export function withOfflineFallback<T>(
  queryFn: () => Promise<T>,
  cacheKey: OfflineCacheKey,
): () => Promise<T> {
  return async () => {
    try {
      const data = await queryFn();
      // Update cache on successful fetch
      void setOfflineCache(cacheKey, data);
      return data;
    } catch (error) {
      // If offline, try the cache
      if (!navigator.onLine) {
        const cached = await getFromOfflineCache<T>(cacheKey);
        if (cached !== undefined) {
          return cached;
        }
      }
      throw error;
    }
  };
}
