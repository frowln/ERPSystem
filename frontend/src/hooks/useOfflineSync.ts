// =============================================================================
// PRIVOD NEXT -- useOfflineSync Hook
// Monitors connectivity and auto-processes the sync queue on reconnect.
// For each queued item, performs a version/timestamp check against the server.
// If a conflict is detected (409), the item is added to the conflict queue.
// =============================================================================

import { useEffect, useState, useCallback, useRef } from 'react';
import {
  useSyncQueue,
  enqueuePendingRecords,
  type QueueSyncStatus,
  type SyncConflict,
  type QueuedMutation,
} from '@/lib/syncQueue';

interface UseOfflineSyncReturn {
  /** Whether the browser reports being online */
  isOnline: boolean;
  /** Number of pending mutations in the queue */
  pendingCount: number;
  /** List of pending mutation items in the queue */
  pendingChanges: QueuedMutation[];
  /** Current sync status: idle, syncing, or error */
  syncStatus: QueueSyncStatus;
  /** Whether a sync operation is currently in progress */
  syncInProgress: boolean;
  /** Number of conflicts awaiting resolution */
  conflictCount: number;
  /** List of unresolved conflicts */
  conflicts: SyncConflict[];
  /** ISO timestamp of last successful sync, or null if never synced */
  lastSyncAt: string | null;
  /** Force a manual sync attempt */
  syncNow: () => Promise<void>;
  /** @deprecated Use syncNow instead */
  forceSync: () => Promise<void>;
}

/**
 * Hook that monitors `navigator.onLine`, auto-processes the sync queue when
 * the browser comes back online, and exposes status for the UI.
 *
 * On reconnect, scans IndexedDB for pending records, enqueues them, then
 * processes the queue. For each queued mutation, the sync queue checks
 * the server version (via ETag / Last-Modified) and raises a 409 conflict
 * if the server data has changed since the offline version was captured.
 *
 * @param autoSyncDelay - Delay in ms before auto-syncing on reconnect (default: 1500)
 */
export function useOfflineSync(autoSyncDelay = 1500): UseOfflineSyncReturn {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true,
  );

  const pendingChanges = useSyncQueue((s) => s.queue);
  const pendingCount = useSyncQueue((s) => s.queue.length);
  const syncStatus = useSyncQueue((s) => s.syncStatus);
  const conflictCount = useSyncQueue((s) => s.conflicts.length);
  const conflicts = useSyncQueue((s) => s.conflicts);
  const lastSyncAt = useSyncQueue((s) => s.lastSyncAt);
  const processSyncQueue = useSyncQueue((s) => s.processSyncQueue);

  const syncInProgress = syncStatus === 'syncing';

  const autoSyncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // -------------------------------------------------------------------------
  // Online/offline listeners
  // -------------------------------------------------------------------------
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);

      // When reconnecting, scan IndexedDB for pending records then process
      if (autoSyncTimerRef.current) clearTimeout(autoSyncTimerRef.current);
      autoSyncTimerRef.current = setTimeout(async () => {
        try {
          await enqueuePendingRecords();
        } catch {
          // Non-critical: queue may already contain these items
        }
        processSyncQueue();
      }, autoSyncDelay);
    };

    const handleOffline = () => {
      setIsOnline(false);
      // Cancel any pending auto-sync
      if (autoSyncTimerRef.current) {
        clearTimeout(autoSyncTimerRef.current);
        autoSyncTimerRef.current = null;
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (autoSyncTimerRef.current) clearTimeout(autoSyncTimerRef.current);
    };
  }, [autoSyncDelay, processSyncQueue]);

  // -------------------------------------------------------------------------
  // Listen for SW sync-complete messages
  // -------------------------------------------------------------------------
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'SYNC_COMPLETE') {
        // Re-process queue to pick up any items the SW handled
        processSyncQueue();
      }
    };

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleMessage);
      return () => navigator.serviceWorker.removeEventListener('message', handleMessage);
    }
  }, [processSyncQueue]);

  // -------------------------------------------------------------------------
  // Sync now
  // -------------------------------------------------------------------------
  const syncNow = useCallback(async () => {
    if (!navigator.onLine) return;
    try {
      await enqueuePendingRecords();
    } catch {
      // Non-critical
    }
    await processSyncQueue();
  }, [processSyncQueue]);

  return {
    isOnline,
    pendingCount,
    pendingChanges,
    syncStatus,
    syncInProgress,
    conflictCount,
    conflicts,
    lastSyncAt,
    syncNow,
    forceSync: syncNow,
  };
}
