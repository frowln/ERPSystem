import React, { useEffect, useState, useRef, useMemo } from 'react';
import { WifiOff, Wifi, RefreshCw, AlertTriangle, Clock } from 'lucide-react';
import { t } from '@/i18n';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { cn } from '@/lib/cn';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatRelativeTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const seconds = Math.floor(diff / 1000);

  if (seconds < 60) return t('offline.queue.justNow');
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return t('offline.queue.minutesAgo', { count: String(minutes) });
  const hours = Math.floor(minutes / 60);
  return t('offline.queue.hoursAgo', { count: String(hours) });
}

/**
 * Fixed bottom-right offline/sync indicator.
 *
 * States:
 * - Online, idle, no pending          -> hidden
 * - Offline                           -> amber bar with pending count
 * - Online, syncing                   -> blue bar with spinner
 * - Online, pending (not yet syncing) -> amber badge with count + sync button
 * - Sync error                        -> red badge
 * - Sync completed flash              -> green flash (auto-hides 3s)
 */
export const OfflineIndicator: React.FC = () => {
  const { isOnline, pendingCount, syncStatus, conflictCount, lastSyncAt, syncNow } =
    useOfflineSync();

  const [showSynced, setShowSynced] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const prevPendingRef = useRef(pendingCount);
  const prevOnlineRef = useRef(isOnline);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Detect when sync completes: had pending -> now 0
  useEffect(() => {
    const hadPending = prevPendingRef.current > 0;
    const wasOffline = !prevOnlineRef.current;

    if (
      isOnline &&
      pendingCount === 0 &&
      syncStatus === 'idle' &&
      (hadPending || wasOffline) &&
      prevPendingRef.current !== pendingCount
    ) {
      setShowSynced(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setShowSynced(false), 3000);
    }

    prevPendingRef.current = pendingCount;
    prevOnlineRef.current = isOnline;
  }, [isOnline, pendingCount, syncStatus]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const lastSyncFormatted = useMemo(
    () => (lastSyncAt ? formatRelativeTime(lastSyncAt) : null),
    [lastSyncAt],
  );

  // Nothing to show
  if (isOnline && pendingCount === 0 && conflictCount === 0 && syncStatus === 'idle' && !showSynced) {
    return null;
  }

  // Offline banner - fixed bottom right
  if (!isOnline) {
    return (
      <div
        role="alert"
        className={cn(
          'fixed bottom-4 right-4 z-toast',
          'flex items-center gap-2.5 px-4 py-3 rounded-lg',
          'bg-amber-500 text-white text-sm font-medium shadow-lg',
          'animate-slide-up',
        )}
      >
        <WifiOff className="h-4 w-4 flex-shrink-0" />
        <div className="flex flex-col">
          <span>{t('offline.indicatorOffline')}</span>
          {pendingCount > 0 && (
            <span className="text-xs text-amber-100">
              {t('offline.pendingMutations', { count: String(pendingCount) })}
            </span>
          )}
          {lastSyncFormatted && (
            <span className="text-xs text-amber-100 flex items-center gap-1 mt-0.5">
              <Clock className="h-3 w-3" />
              {t('offline.lastSync', { time: lastSyncFormatted })}
            </span>
          )}
        </div>
      </div>
    );
  }

  // Syncing spinner
  if (syncStatus === 'syncing') {
    return (
      <div
        role="status"
        className={cn(
          'fixed bottom-4 right-4 z-toast',
          'flex items-center gap-2.5 px-4 py-3 rounded-lg',
          'bg-blue-500 text-white text-sm font-medium shadow-lg',
          'animate-slide-up',
        )}
      >
        <RefreshCw className="h-4 w-4 flex-shrink-0 animate-spin" />
        <span>{t('offline.indicatorSyncing', { count: String(pendingCount) })}</span>
      </div>
    );
  }

  // Sync error
  if (syncStatus === 'error') {
    return (
      <div
        role="alert"
        className={cn(
          'fixed bottom-4 right-4 z-toast',
          'flex items-center gap-2.5 px-4 py-3 rounded-lg',
          'bg-red-500 text-white text-sm font-medium shadow-lg',
          'animate-slide-up',
        )}
      >
        <AlertTriangle className="h-4 w-4 flex-shrink-0" />
        <div className="flex flex-col">
          <span>{t('offline.syncError')}</span>
          {lastSyncFormatted && (
            <span className="text-xs text-red-100 flex items-center gap-1 mt-0.5">
              <Clock className="h-3 w-3" />
              {t('offline.lastSync', { time: lastSyncFormatted })}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => syncNow()}
          className="ml-2 px-2.5 py-1 rounded-md bg-red-600 hover:bg-red-700 text-xs font-semibold transition-colors"
        >
          {t('offline.syncNowButton')}
        </button>
      </div>
    );
  }

  // Pending items (online but not yet synced)
  if (pendingCount > 0) {
    return (
      <div
        role="status"
        className={cn(
          'fixed bottom-4 right-4 z-toast',
          'animate-slide-up',
        )}
      >
        <div
          className={cn(
            'flex items-center gap-2.5 px-4 py-3 rounded-lg',
            'bg-amber-500 text-white text-sm font-medium shadow-lg',
            'cursor-pointer',
            'hover:bg-amber-600 transition-colors',
          )}
          onClick={() => setShowDetails((prev) => !prev)}
        >
          <RefreshCw className="h-4 w-4 flex-shrink-0" />
          <div className="flex flex-col">
            <span>{t('offline.indicatorPending', { count: String(pendingCount) })}</span>
            {lastSyncFormatted && (
              <span className="text-xs text-amber-100 flex items-center gap-1 mt-0.5">
                <Clock className="h-3 w-3" />
                {t('offline.lastSync', { time: lastSyncFormatted })}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              syncNow();
            }}
            className="ml-2 px-2.5 py-1 rounded-md bg-amber-600 hover:bg-amber-700 text-xs font-semibold transition-colors"
          >
            {t('offline.syncNowButton')}
          </button>
        </div>

        {showDetails && (
          <div className={cn(
            'mt-2 p-3 rounded-lg shadow-lg text-xs',
            'bg-white dark:bg-neutral-800',
            'border border-neutral-200 dark:border-neutral-700',
            'text-neutral-700 dark:text-neutral-300',
          )}>
            <div className="flex justify-between">
              <span>{t('offline.queue.metricQueued')}:</span>
              <span className="font-semibold">{pendingCount}</span>
            </div>
            {conflictCount > 0 && (
              <div className="flex justify-between mt-1">
                <span>{t('offline.conflictsLabel')}:</span>
                <span className="font-semibold text-orange-500">{conflictCount}</span>
              </div>
            )}
            {lastSyncAt && (
              <div className="flex justify-between mt-1">
                <span>{t('offline.lastSyncLabel')}:</span>
                <span className="font-semibold">{lastSyncFormatted}</span>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Conflict indicator
  if (conflictCount > 0) {
    return (
      <div
        role="alert"
        className={cn(
          'fixed bottom-4 right-4 z-toast',
          'flex items-center gap-2.5 px-4 py-3 rounded-lg',
          'bg-orange-500 text-white text-sm font-medium shadow-lg',
          'animate-slide-up',
        )}
      >
        <AlertTriangle className="h-4 w-4 flex-shrink-0" />
        <span>{t('offline.conflictsDetected', { count: String(conflictCount) })}</span>
      </div>
    );
  }

  // Sync completed flash
  if (showSynced) {
    return (
      <div
        role="status"
        className={cn(
          'fixed bottom-4 right-4 z-toast',
          'flex items-center gap-2.5 px-4 py-3 rounded-lg',
          'bg-emerald-500 text-white text-sm font-medium shadow-lg',
          'animate-slide-up',
        )}
      >
        <Wifi className="h-4 w-4 flex-shrink-0" />
        <span>{t('offline.indicatorSynced')}</span>
      </div>
    );
  }

  return null;
};
