// =============================================================================
// PRIVOD NEXT -- Sync Queue
// Queues failed/offline mutations and processes them when back online.
// Supports exponential backoff between retries.
// =============================================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiClient } from '@/api/client';
import {
  type OfflineStoreName,
  getRecordsByStatus,
  markSynced,
  markConflict,
  type OfflineRecord,
} from '@/lib/offlineDb';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface QueuedMutation {
  id: string;
  endpoint: string;
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  payload: unknown;
  /** Reference to the IndexedDB record, if applicable */
  offlineRecordRef?: {
    storeName: OfflineStoreName;
    recordId: string;
  };
  retryCount: number;
  maxRetries: number;
  /** Next retry timestamp (ISO). If set, the item is skipped until this time. */
  nextRetryAt: string | null;
  createdAt: string; // ISO
}

export type QueueSyncStatus = 'idle' | 'syncing' | 'error';

export interface SyncConflict {
  id: string;
  storeName: OfflineStoreName;
  recordId: string;
  localData: unknown;
  serverData: unknown;
  localVersion: string | null;
  serverVersion: string;
}

interface SyncQueueState {
  queue: QueuedMutation[];
  syncStatus: QueueSyncStatus;
  conflicts: SyncConflict[];
  /** Number of successfully synced items in the current/last sync run */
  syncedCount: number;
  /** ISO timestamp of last successful sync completion */
  lastSyncAt: string | null;
  addMutation: (mutation: Omit<QueuedMutation, 'id' | 'retryCount' | 'createdAt' | 'maxRetries' | 'nextRetryAt'> & { maxRetries?: number }) => void;
  removeMutation: (id: string) => void;
  clearQueue: () => void;
  getQueueSize: () => number;
  processSyncQueue: () => Promise<void>;
  addConflict: (conflict: SyncConflict) => void;
  resolveConflict: (conflictId: string) => void;
  clearConflicts: () => void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_RETRIES_DEFAULT = 5;

/** Base delay for exponential backoff in milliseconds */
const BACKOFF_BASE_MS = 1000;

/** Maximum delay cap for backoff (30 seconds) */
const BACKOFF_MAX_MS = 30_000;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Calculate exponential backoff delay with jitter.
 */
function getBackoffDelay(retryCount: number): number {
  const delay = Math.min(
    BACKOFF_BASE_MS * Math.pow(2, retryCount),
    BACKOFF_MAX_MS,
  );
  // Add +-25% jitter to prevent thundering herd
  const jitter = delay * 0.25 * (Math.random() * 2 - 1);
  return Math.round(delay + jitter);
}

/**
 * Pause execution for the given number of milliseconds.
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useSyncQueue = create<SyncQueueState>()(
  persist(
    (set, get) => ({
      queue: [],
      syncStatus: 'idle',
      conflicts: [],
      syncedCount: 0,
      lastSyncAt: null,

      addMutation: (mutation) => {
        const item: QueuedMutation = {
          ...mutation,
          id: `sync-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          retryCount: 0,
          maxRetries: mutation.maxRetries ?? MAX_RETRIES_DEFAULT,
          nextRetryAt: null,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ queue: [...state.queue, item] }));
      },

      removeMutation: (id) => {
        set((state) => ({ queue: state.queue.filter((m) => m.id !== id) }));
      },

      clearQueue: () => set({ queue: [], syncedCount: 0 }),

      getQueueSize: () => get().queue.length,

      processSyncQueue: async () => {
        const { queue } = get();
        if (queue.length === 0) return;
        if (!navigator.onLine) return;

        set({ syncStatus: 'syncing', syncedCount: 0 });
        let syncedCount = 0;
        const failedItems: QueuedMutation[] = [];
        const now = new Date().toISOString();

        for (const item of queue) {
          // Skip items that are scheduled for later retry
          if (item.nextRetryAt && item.nextRetryAt > now) {
            failedItems.push(item);
            continue;
          }

          try {
            const response = await apiClient.request({
              url: item.endpoint,
              method: item.method,
              data: item.payload,
            });

            // If the mutation was tied to an offline IndexedDB record, mark it synced
            if (item.offlineRecordRef) {
              const serverVersion =
                response.headers?.etag ||
                response.headers?.['last-modified'] ||
                new Date().toISOString();
              await markSynced(
                item.offlineRecordRef.storeName,
                item.offlineRecordRef.recordId,
                serverVersion,
              );
            }

            syncedCount++;
            set({ syncedCount });
          } catch (error: unknown) {
            const status = (error as { response?: { status?: number } })?.response?.status;

            // 409 Conflict: server has a newer version
            if (status === 409 && item.offlineRecordRef) {
              const serverData = (error as { response?: { data?: unknown } })?.response?.data;
              const serverVersion =
                (error as { response?: { headers?: Record<string, string> } })?.response?.headers?.etag ||
                new Date().toISOString();

              // Look up the local record for conflict resolution
              const localRecords = await getRecordsByStatus(
                item.offlineRecordRef.storeName,
                'pending',
              );
              const localRecord = localRecords.find(
                (r) => r.id === item.offlineRecordRef!.recordId,
              );

              if (localRecord) {
                await markConflict(
                  item.offlineRecordRef.storeName,
                  item.offlineRecordRef.recordId,
                );

                get().addConflict({
                  id: `conflict-${Date.now()}-${Math.random().toString(36).slice(2)}`,
                  storeName: item.offlineRecordRef.storeName,
                  recordId: item.offlineRecordRef.recordId,
                  localData: localRecord.data,
                  serverData,
                  localVersion: localRecord.serverVersion,
                  serverVersion,
                });
              }

              // Don't retry conflicts
              continue;
            }

            // Increment retry count; if exceeded, drop the mutation
            const newRetryCount = item.retryCount + 1;
            if (newRetryCount < item.maxRetries) {
              // Schedule next retry with exponential backoff
              const delayMs = getBackoffDelay(newRetryCount);
              const nextRetryAt = new Date(Date.now() + delayMs).toISOString();
              failedItems.push({
                ...item,
                retryCount: newRetryCount,
                nextRetryAt,
              });

              // Wait before processing the next item to avoid hammering the server
              await sleep(Math.min(delayMs, 2000));
            }
            // If maxRetries exceeded, item is silently dropped
          }
        }

        const lastSyncAt = new Date().toISOString();
        set({
          queue: failedItems,
          syncStatus: failedItems.length > 0 ? 'error' : 'idle',
          syncedCount,
          lastSyncAt,
        });
      },

      addConflict: (conflict) => {
        set((state) => ({ conflicts: [...state.conflicts, conflict] }));
      },

      resolveConflict: (conflictId) => {
        set((state) => ({
          conflicts: state.conflicts.filter((c) => c.id !== conflictId),
        }));
      },

      clearConflicts: () => set({ conflicts: [] }),
    }),
    {
      name: 'privod-sync-queue',
      partialize: (state) => ({
        queue: state.queue,
        conflicts: state.conflicts,
        lastSyncAt: state.lastSyncAt,
      }),
    },
  ),
);

// ---------------------------------------------------------------------------
// IndexedDB Pending Scanner
// ---------------------------------------------------------------------------

/**
 * Scan all offline stores for pending records and enqueue them.
 * This is called on reconnect to pick up records saved directly via offlineDb.
 */
export async function enqueuePendingRecords(): Promise<void> {
  const storeNames: OfflineStoreName[] = [
    'defects',
    'qualityChecks',
    'dailyLogs',
    'workOrders',
    'photos',
  ];
  const endpointMap: Record<OfflineStoreName, string> = {
    defects: '/defects',
    qualityChecks: '/quality-checks',
    dailyLogs: '/daily-logs',
    workOrders: '/work-orders',
    photos: '/photos',
  };

  const existingIds = new Set(
    useSyncQueue
      .getState()
      .queue.filter((m) => m.offlineRecordRef)
      .map((m) => m.offlineRecordRef!.recordId),
  );

  for (const storeName of storeNames) {
    try {
      const pendingRecords: OfflineRecord[] = await getRecordsByStatus(storeName, 'pending');
      for (const record of pendingRecords) {
        // Don't double-enqueue
        if (existingIds.has(record.id)) continue;

        useSyncQueue.getState().addMutation({
          endpoint: endpointMap[storeName],
          method: 'POST',
          payload: record.data,
          offlineRecordRef: {
            storeName,
            recordId: record.id,
          },
        });
      }
    } catch {
      // IndexedDB unavailable for this store — skip
    }
  }
}
