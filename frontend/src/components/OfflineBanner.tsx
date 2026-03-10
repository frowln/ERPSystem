// =============================================================================
// PRIVOD NEXT -- Offline Banner
// Fixed top banner displayed when the browser is offline.
// Shows pending queue count and auto-hides with a green toast on reconnect.
// =============================================================================

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { WifiOff, X, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import toast from 'react-hot-toast';

/**
 * Fixed top banner shown when the browser loses network connectivity.
 * Displays pending mutation count and syncing state.
 * On reconnect, shows a green "Reconnected" toast via react-hot-toast.
 */
export const OfflineBanner: React.FC = () => {
  const { isOnline, pendingCount, syncStatus } = useOfflineSync();
  const [dismissed, setDismissed] = useState(false);
  const [visible, setVisible] = useState(false);
  const wasOfflineRef = useRef(false);
  const initialRef = useRef(true);

  // Track offline -> online transition for reconnection toast
  useEffect(() => {
    // Skip the very first render (initial mount)
    if (initialRef.current) {
      initialRef.current = false;
      wasOfflineRef.current = !isOnline;
      if (!isOnline) {
        setVisible(true);
        setDismissed(false);
      }
      return;
    }

    if (!isOnline) {
      // Going offline
      wasOfflineRef.current = true;
      setVisible(true);
      setDismissed(false);
    } else if (wasOfflineRef.current) {
      // Coming back online
      wasOfflineRef.current = false;
      setVisible(false);
      toast.success(t('pwa.reconnected'), {
        duration: 3000,
        icon: '\u{2705}',
      });
    }
  }, [isOnline]);

  const handleDismiss = useCallback(() => {
    setDismissed(true);
  }, []);

  // Don't render when online, dismissed, or not visible
  if (isOnline || dismissed || !visible) return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={cn(
        'fixed top-0 left-0 right-0 z-toast',
        'animate-slide-down',
      )}
    >
      <div
        className={cn(
          'flex items-center justify-between gap-3 px-4 py-3',
          'bg-amber-500 dark:bg-amber-600',
          'text-white text-sm font-medium',
          'shadow-lg',
        )}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <WifiOff className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
          <div className="flex flex-col min-w-0">
            <span className="truncate">{t('pwa.offlineMessage')}</span>
            {pendingCount > 0 && (
              <span className="text-xs text-amber-100 mt-0.5 flex items-center gap-1">
                {syncStatus === 'syncing' ? (
                  <>
                    <RefreshCw className="h-3 w-3 animate-spin" aria-hidden="true" />
                    {t('pwa.syncing')}
                  </>
                ) : (
                  t('pwa.queueCount', { count: String(pendingCount) })
                )}
              </span>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          aria-label={t('common.close')}
          className={cn(
            'flex-shrink-0 p-1 rounded-md',
            'text-amber-100 hover:text-white',
            'hover:bg-amber-600 dark:hover:bg-amber-700',
            'transition-colors',
          )}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
