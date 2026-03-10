import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, Check, CheckCheck, ExternalLink, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { notificationsApi, type Notification } from '@/api/notifications';
import { useNotificationStore } from '@/stores/notificationStore';
import { t } from '@/i18n';

interface NotificationDropdownProps {
  open: boolean;
  onClose: () => void;
  unreadCount: number;
}

/**
 * Maps a notification source model / type to a route path the user can navigate to.
 */
function getNotificationRoute(notification: Notification): string | null {
  const { sourceType, sourceId } = notification;
  if (!sourceType || !sourceId) return null;

  const routeMap: Record<string, string> = {
    task: `/tasks/${sourceId}`,
    project: `/projects/${sourceId}`,
    document: `/documents/${sourceId}`,
    budget: `/finance/budgets/${sourceId}`,
    invoice: `/finance/invoices/${sourceId}`,
    issue: `/issues/${sourceId}`,
    rfi: `/rfis/${sourceId}`,
    defect: `/quality/defects/${sourceId}`,
    safety_inspection: `/safety/inspections/${sourceId}`,
    submittal: `/submittals/${sourceId}`,
  };

  return routeMap[sourceType.toLowerCase()] ?? null;
}

/**
 * Returns a Tailwind color class based on the notification type.
 */
function getTypeColor(type: string): string {
  switch (type) {
    case 'ERROR':
    case 'SAFETY_ALERT':
      return 'bg-danger-100 text-danger-700 dark:bg-danger-900/30 dark:text-danger-400';
    case 'WARNING':
    case 'BUDGET_THRESHOLD':
      return 'bg-warning-100 text-warning-700 dark:bg-warning-900/30 dark:text-warning-400';
    case 'SUCCESS':
      return 'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-400';
    case 'TASK':
    case 'TASK_ASSIGNED':
    case 'APPROVAL':
    case 'APPROVAL_REQUIRED':
      return 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400';
    default:
      return 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-400';
  }
}

/**
 * Format a relative time string (e.g. "5m ago", "2h ago", "Yesterday").
 */
function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diffMs = now - date;
  const diffMin = Math.floor(diffMs / 60_000);
  const diffHr = Math.floor(diffMs / 3_600_000);
  const diffDay = Math.floor(diffMs / 86_400_000);

  if (diffMin < 1) return t('notificationDropdown.justNow');
  if (diffMin < 60) return t('notificationDropdown.minutesAgo', { count: String(diffMin) });
  if (diffHr < 24) return t('notificationDropdown.hoursAgo', { count: String(diffHr) });
  if (diffDay === 1) return t('notificationDropdown.yesterday');
  return t('notificationDropdown.daysAgo', { count: String(diffDay) });
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  open,
  onClose,
  unreadCount,
}) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const wsMarkAllRead = useNotificationStore((s) => s.markAllRead);

  // Fetch recent notifications when dropdown is open
  const { data: notificationsData } = useQuery({
    queryKey: ['notifications-dropdown'],
    queryFn: () => notificationsApi.getNotifications({ page: 0, size: 10 }),
    enabled: open,
    refetchInterval: open ? 30_000 : false,
  });

  const notifications = notificationsData?.content ?? [];

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    // Delay adding listener to avoid closing immediately on the click that opens it
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open, onClose]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  const handleMarkAllRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      wsMarkAllRead();
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-dropdown'] });
    } catch {
      // silently ignore
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read
    if (!notification.isRead) {
      try {
        await notificationsApi.markAsRead(notification.id);
        queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
        queryClient.invalidateQueries({ queryKey: ['notifications-dropdown'] });
      } catch {
        // silently ignore
      }
    }

    // Navigate to the entity
    const route = notification.sourceUrl || getNotificationRoute(notification);
    if (route) {
      navigate(route);
      onClose();
    }
  };

  const handleViewAll = () => {
    navigate('/notifications');
    onClose();
  };

  if (!open) return null;

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 top-full mt-1 w-96 max-h-[480px] bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-xl z-50 flex flex-col animate-slide-up"
      role="dialog"
      aria-label={t('notificationDropdown.title')}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100 dark:border-neutral-700">
        <div className="flex items-center gap-2">
          <Bell size={16} className="text-neutral-500" />
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            {t('notificationDropdown.title')}
          </h3>
          {unreadCount > 0 && (
            <span className="min-w-[20px] h-5 px-1.5 bg-danger-500 text-white text-[11px] font-semibold leading-5 text-center rounded-full">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="flex items-center gap-1 px-2 py-1 text-xs text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-md transition-colors"
              title={t('notificationDropdown.markAllRead')}
            >
              <CheckCheck size={14} />
              <span className="hidden sm:inline">{t('notificationDropdown.markAllRead')}</span>
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 rounded transition-colors"
            aria-label={t('common.close')}
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Notification list */}
      <div className="flex-1 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-neutral-400">
            <Bell size={32} className="mb-2 opacity-50" />
            <p className="text-sm">{t('notificationDropdown.empty')}</p>
          </div>
        ) : (
          <ul className="divide-y divide-neutral-100 dark:divide-neutral-700">
            {notifications.map((notification) => (
              <li key={notification.id}>
                <button
                  onClick={() => handleNotificationClick(notification)}
                  className={cn(
                    'w-full text-left px-4 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-750 transition-colors flex gap-3',
                    !notification.isRead && 'bg-primary-50/50 dark:bg-primary-900/10',
                  )}
                >
                  {/* Unread indicator */}
                  <div className="flex-shrink-0 mt-1.5">
                    {!notification.isRead ? (
                      <div className="w-2 h-2 rounded-full bg-primary-500" />
                    ) : (
                      <div className="w-2 h-2 rounded-full bg-transparent" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span
                        className={cn(
                          'inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium',
                          getTypeColor(notification.type),
                        )}
                      >
                        {notification.type}
                      </span>
                      <span className="text-[11px] text-neutral-400 dark:text-neutral-500">
                        {formatRelativeTime(notification.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">
                      {notification.title}
                    </p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2 mt-0.5">
                      {notification.message}
                    </p>
                  </div>

                  {/* Arrow */}
                  {(notification.sourceUrl || notification.sourceType) && (
                    <div className="flex-shrink-0 mt-1">
                      <ExternalLink size={12} className="text-neutral-300 dark:text-neutral-600" />
                    </div>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-neutral-100 dark:border-neutral-700 px-4 py-2">
        <button
          onClick={handleViewAll}
          className="w-full text-center text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium py-1 rounded-md hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
        >
          {t('notificationDropdown.viewAll')}
        </button>
      </div>
    </div>
  );
};
