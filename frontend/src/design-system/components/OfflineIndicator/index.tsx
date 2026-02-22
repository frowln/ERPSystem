import React, { useEffect, useState, useRef } from 'react';
import { WifiOff, Wifi, RefreshCw } from 'lucide-react';
import { t } from '@/i18n';
import { useOfflineStatus } from '@/hooks/useOfflineStatus';
import { cn } from '@/lib/cn';

/**
 * Fixed-position offline indicator banner.
 *
 * - Yellow warning when offline
 * - Blue info when there are pending items in the queue
 * - Green success flash when sync completes (auto-hides after 3s)
 */
export const OfflineIndicator: React.FC = () => {
  const { isOnline, pendingCount } = useOfflineStatus();
  const [showSynced, setShowSynced] = useState(false);
  const prevPendingRef = useRef(pendingCount);
  const prevOnlineRef = useRef(isOnline);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Detect when sync completes: was offline or had pending, now online with 0 pending
  useEffect(() => {
    const hadPending = prevPendingRef.current > 0;
    const wasOffline = !prevOnlineRef.current;

    if (
      isOnline &&
      pendingCount === 0 &&
      (hadPending || wasOffline) &&
      prevPendingRef.current !== pendingCount
    ) {
      setShowSynced(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setShowSynced(false), 3000);
    }

    prevPendingRef.current = pendingCount;
    prevOnlineRef.current = isOnline;
  }, [isOnline, pendingCount]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  // Nothing to show
  if (isOnline && pendingCount === 0 && !showSynced) return null;

  // Offline banner
  if (!isOnline) {
    return (
      <div
        role="alert"
        className={cn(
          'fixed top-0 left-0 right-0 z-toast',
          'flex items-center justify-center gap-2 px-4 py-2.5',
          'bg-amber-500 text-white text-sm font-medium shadow-lg',
          'animate-in slide-in-from-top duration-300',
        )}
      >
        <WifiOff className="h-4 w-4 flex-shrink-0" />
        <span>{t('offline.indicatorOffline')}</span>
      </div>
    );
  }

  // Pending sync banner
  if (pendingCount > 0) {
    return (
      <div
        role="status"
        className={cn(
          'fixed top-0 left-0 right-0 z-toast',
          'flex items-center justify-center gap-2 px-4 py-2.5',
          'bg-blue-500 text-white text-sm font-medium shadow-lg',
          'animate-in slide-in-from-top duration-300',
        )}
      >
        <RefreshCw className="h-4 w-4 flex-shrink-0 animate-spin" />
        <span>{t('offline.indicatorPending').replace('{count}', String(pendingCount))}</span>
      </div>
    );
  }

  // Sync completed flash
  if (showSynced) {
    return (
      <div
        role="status"
        className={cn(
          'fixed top-0 left-0 right-0 z-toast',
          'flex items-center justify-center gap-2 px-4 py-2.5',
          'bg-emerald-500 text-white text-sm font-medium shadow-lg',
          'animate-in slide-in-from-top duration-300',
        )}
      >
        <Wifi className="h-4 w-4 flex-shrink-0" />
        <span>{t('offline.indicatorSynced')}</span>
      </div>
    );
  }

  return null;
};
