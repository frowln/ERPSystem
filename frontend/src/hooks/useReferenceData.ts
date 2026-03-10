// =============================================================================
// PRIVOD NEXT -- Reference Data Hook
// Wraps useQuery with long staleTime + localStorage fallback for offline use.
// =============================================================================

import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { QUERY_STALE_TIMES } from '@/lib/queryDefaults';

const LS_PREFIX = 'privod-ref:';

/**
 * Read a cached value from localStorage.
 * Returns `undefined` if the key does not exist or parsing fails.
 */
function readLocalStorage<T>(key: string): T | undefined {
  try {
    const raw = localStorage.getItem(`${LS_PREFIX}${key}`);
    if (raw === null) return undefined;
    return JSON.parse(raw) as T;
  } catch {
    return undefined;
  }
}

/**
 * Persist a value to localStorage for offline fallback.
 */
function writeLocalStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(`${LS_PREFIX}${key}`, JSON.stringify(value));
  } catch {
    // Silently ignore — quota exceeded or private browsing.
  }
}

/**
 * React hook for reference/lookup data that changes very rarely.
 *
 * Features:
 * - 30 min staleTime (from `QUERY_STALE_TIMES.reference`)
 * - localStorage persistence for offline-friendly fallback
 * - On mount, serves localStorage data as `initialData` while the network
 *   fetch is in progress, so the UI is never empty.
 *
 * @param key   Unique cache key (also used as the localStorage key)
 * @param fetcher  Async function that returns the data
 * @param options  Optional overrides for useQuery
 *
 * @example
 *   const { data: locations } = useReferenceData('locations', () => warehouseApi.getLocations());
 */
export function useReferenceData<T>(
  key: string,
  fetcher: () => Promise<T>,
  options?: {
    enabled?: boolean;
    staleTime?: number;
  },
): UseQueryResult<T> {
  const localFallback = readLocalStorage<T>(key);

  return useQuery<T>({
    queryKey: ['reference', key],
    queryFn: async () => {
      const data = await fetcher();
      // Persist to localStorage after a successful fetch
      writeLocalStorage(key, data);
      return data;
    },
    staleTime: options?.staleTime ?? QUERY_STALE_TIMES.reference,
    gcTime: 60 * 60 * 1000, // Keep unused data in memory for 1 hour
    enabled: options?.enabled,
    // Use localStorage data as placeholder while fetching
    ...(localFallback !== undefined ? { initialData: localFallback } : {}),
  });
}
