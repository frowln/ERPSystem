// =============================================================================
// PRIVOD NEXT -- useOfflineSync Hook
// Monitors connectivity and auto-processes the sync queue on reconnect.
// =============================================================================

import { useEffect, useState, useCallback, useRef } from 'react';
import {
  useSyncQueue,
  enqueuePendingRecords,
  type QueueSyncStatus,
  type SyncConflict,
} from '@/lib/syncQueue';

interface UseOfflineSyncReturn {
  /** Whether the browser reports being online */
  isOnline: boolean;
  /** Number of pending mutations in the queue */
  pendingCount: number;
  /** Current sync status: idle, syncing, or error */
  syncStatus: QueueSyncStatus;
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
 * @param autoSyncDelay - Delay in ms before auto-syncing on reconnect (default: 1500)
 */
export function useOfflineSync(autoSyncDelay = 1500): UseOfflineSyncReturn {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true,
  );

  const pendingCount = useSyncQueue((s) => s.queue.length);
  const syncStatus = useSyncQueue((s) => s.syncStatus);
  const conflictCount = useSyncQueue((s) => s.conflicts.length);
  const conflicts = useSyncQueue((s) => s.conflicts);
  const lastSyncAt = useSyncQueue((s) => s.lastSyncAt);
  const processSyncQueue = useSyncQueue((s) => s.processSyncQueue);

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
    syncStatus,
    conflictCount,
    conflicts,
    lastSyncAt,
    syncNow,
    forceSync: syncNow,
  };
}
