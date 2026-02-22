import { useEffect, useState } from 'react';
import { useOfflineQueue } from '@/stores/offlineQueue';

interface UseOfflineStatusReturn {
  isOnline: boolean;
  pendingCount: number;
  lastSyncAt: number | null;
}

/**
 * Tracks network connectivity and offline queue state.
 * Listens to `online` / `offline` window events and exposes pending-sync count.
 */
export function useOfflineStatus(): UseOfflineStatusReturn {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true,
  );
  const [lastSyncAt, setLastSyncAt] = useState<number | null>(null);

  const queue = useOfflineQueue((s) => s.queue);
  const pendingCount = queue.length;

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // When coming back online and queue is empty, record sync time
      if (useOfflineQueue.getState().queue.length === 0) {
        setLastSyncAt(Date.now());
      }
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Track when the queue becomes empty (sync completed)
  useEffect(() => {
    if (isOnline && pendingCount === 0) {
      setLastSyncAt(Date.now());
    }
  }, [isOnline, pendingCount]);

  return { isOnline, pendingCount, lastSyncAt };
}
