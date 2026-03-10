// =============================================================================
// PRIVOD NEXT -- TanStack Query Defaults
// Centralized configuration for cache freshness across data categories.
// =============================================================================

// ---------------------------------------------------------------------------
// Timing constants (ms)
// ---------------------------------------------------------------------------

/**
 * Predefined staleTime values for different categories of data.
 *
 * - `reference`  — Rarely-changing lookups: locations, units, cost codes, departments.
 * - `semiStatic` — Changes infrequently during a session: projects list, users list.
 * - `dynamic`    — Changes often: tasks, movements, budgets, invoices.
 * - `realtime`   — Must always be fresh: notifications, chat messages.
 */
export const QUERY_STALE_TIMES = {
  /** 30 min — справочники (locations, units, cost codes, departments) */
  reference: 30 * 60 * 1000,
  /** 5 min — projects list, users list, contracts */
  semiStatic: 5 * 60 * 1000,
  /** 30 sec — tasks, movements, budgets */
  dynamic: 30 * 1000,
  /** always fresh — notifications, chat */
  realtime: 0,
} as const;

/**
 * Garbage-collection times — how long inactive queries stay in memory.
 */
export const QUERY_GC_TIMES = {
  /** 30 min for reference data */
  reference: 30 * 60 * 1000,
  /** 10 min for standard queries */
  standard: 10 * 60 * 1000,
  /** 2 min for real-time data */
  realtime: 2 * 60 * 1000,
} as const;

// ---------------------------------------------------------------------------
// Pre-built option objects (spread into useQuery)
// ---------------------------------------------------------------------------

/**
 * Options for reference / lookup data (users list, departments,
 * status enums, cost codes, etc.).
 *
 * @example
 * useQuery({ queryKey: ['users'], queryFn: fetchUsers, ...referenceQueryOptions });
 */
export const referenceQueryOptions = {
  staleTime: QUERY_STALE_TIMES.reference,
  gcTime: QUERY_GC_TIMES.reference,
  refetchOnWindowFocus: false,
  refetchOnReconnect: false,
} as const;

/**
 * Options for form pages where we do NOT want background refetches
 * to overwrite user edits.
 *
 * @example
 * useQuery({ queryKey: ['budget', id], queryFn: () => fetchBudget(id), ...formPageQueryOptions });
 */
export const formPageQueryOptions = {
  staleTime: QUERY_STALE_TIMES.semiStatic,
  gcTime: QUERY_GC_TIMES.standard,
  refetchOnWindowFocus: false,
  refetchOnReconnect: false,
  refetchInterval: false as const,
} as const;

/**
 * Options for real-time / dashboard data that benefits from frequent updates.
 *
 * @example
 * useQuery({ queryKey: ['monitoring'], queryFn: fetchMonitoring, ...realtimeQueryOptions });
 */
export const realtimeQueryOptions = {
  staleTime: QUERY_STALE_TIMES.realtime,
  gcTime: QUERY_GC_TIMES.realtime,
  refetchOnWindowFocus: true,
} as const;

// ---------------------------------------------------------------------------
// QueryClient default options (used in main.tsx)
// ---------------------------------------------------------------------------

/**
 * Default options for the global QueryClient instance.
 */
export const queryClientDefaults = {
  queries: {
    staleTime: QUERY_STALE_TIMES.semiStatic,
    gcTime: QUERY_GC_TIMES.standard,
    retry: 1,
    refetchOnWindowFocus: false,
  },
} as const;
