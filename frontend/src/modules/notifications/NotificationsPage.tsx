import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  Bell, Check, CheckCheck, Info, AlertTriangle, AlertCircle, CheckCircle2,
  ClipboardList, FileText, CreditCard, FolderKanban, Search, Loader2,
} from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { Input, Select } from '@/design-system/components/FormField';
import { EmptyState } from '@/design-system/components/EmptyState';
import { cn } from '@/lib/cn';
import { formatRelativeTime } from '@/lib/format';
import { notificationsApi } from '@/api/notifications';
import { useNotificationStore } from '@/stores/notificationStore';
import type { Notification, NotificationType } from '@/api/notifications';

const typeIcons: Record<NotificationType, React.ElementType> = {
  INFO: Info,
  WARNING: AlertTriangle,
  ERROR: AlertCircle,
  SUCCESS: CheckCircle2,
  TASK: ClipboardList,
  DOCUMENT: FileText,
  PAYMENT: CreditCard,
  PROJECT: FolderKanban,
};
const typeColors: Record<NotificationType, string> = {
  INFO: 'bg-primary-50 text-primary-600',
  WARNING: 'bg-warning-50 text-warning-600',
  ERROR: 'bg-danger-50 text-danger-600',
  SUCCESS: 'bg-success-50 text-success-600',
  TASK: 'bg-purple-50 text-purple-600',
  DOCUMENT: 'bg-cyan-50 text-cyan-600',
  PAYMENT: 'bg-orange-50 text-orange-600',
  PROJECT: 'bg-primary-50 text-primary-600',
};
const typeLabels: Record<NotificationType, string> = {
  INFO: 'Информация',
  WARNING: 'Предупреждение',
  ERROR: 'Ошибка',
  SUCCESS: 'Успех',
  TASK: 'Задача',
  DOCUMENT: 'Документ',
  PAYMENT: 'Платёж',
  PROJECT: 'Проект',
};

type TabId = 'all' | 'UNREAD' | 'READ';

const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [typeFilter, setTypeFilter] = useState('');
  const [search, setSearch] = useState('');
  const markAllReadInStore = useNotificationStore((s) => s.markAllRead);

  // Fetch notifications from API
  const isReadFilter = activeTab === 'UNREAD' ? false : activeTab === 'READ' ? true : undefined;
  const { data: notificationsData, isLoading } = useQuery({
    queryKey: ['NOTIFICATIONS', { isRead: isReadFilter, type: typeFilter || undefined }],
    queryFn: () => notificationsApi.getNotifications({
      isRead: isReadFilter,
      type: (typeFilter || undefined) as NotificationType | undefined,
      page: 0,
      size: 50,
    }),
  });

  const notifications: Notification[] = notificationsData?.content ?? [];

  const filteredNotifications = useMemo(() => {
    if (!search) return notifications;
    const lower = search.toLowerCase();
    return notifications.filter(
      (n) =>
        n.title.toLowerCase().includes(lower) ||
        n.message.toLowerCase().includes(lower),
    );
  }, [notifications, search]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.isRead).length,
    [notifications],
  );

  const markAsRead = useCallback(async (id: string) => {
    try {
      await notificationsApi.markAsRead(id);
      queryClient.invalidateQueries({ queryKey: ['NOTIFICATIONS'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
    } catch {
      toast.error('Не удалось отметить уведомление как прочитанное');
    }
  }, [queryClient]);

  const markAllAsRead = useCallback(async () => {
    try {
      await notificationsApi.markAllAsRead();
      markAllReadInStore();
      queryClient.invalidateQueries({ queryKey: ['NOTIFICATIONS'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
      toast.success('Все уведомления отмечены как прочитанные');
    } catch {
      toast.error('Не удалось отметить все как прочитанные');
    }
  }, [queryClient, markAllReadInStore]);

  const handleClickNotification = useCallback((notif: Notification) => {
    if (!notif.isRead) {
      markAsRead(notif.id);
    }
    if (notif.sourceUrl) {
      navigate(notif.sourceUrl);
    }
  }, [markAsRead, navigate]);

  // Reset WS unread counter when the page is visited
  useEffect(() => {
    markAllReadInStore();
  }, [markAllReadInStore]);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Уведомления"
        subtitle={unreadCount > 0 ? `${unreadCount} непрочитанных` : 'Все прочитано'}
        breadcrumbs={[
          { label: 'Главная', href: '/' },
          { label: 'Уведомления' },
        ]}
        actions={
          unreadCount > 0 ? (
            <Button variant="secondary" iconLeft={<CheckCheck size={16} />} onClick={markAllAsRead}>
              Отметить все как прочитанные
            </Button>
          ) : undefined
        }
        tabs={[
          { id: 'all', label: 'Все', count: notifications.length },
          { id: 'UNREAD', label: 'Непрочитанные', count: unreadCount },
          { id: 'READ', label: 'Прочитанные', count: notifications.length - unreadCount },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as TabId)}
      />

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input
            placeholder="Поиск уведомлений..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          options={[
            { value: '', label: 'Все типы' },
            ...Object.entries(typeLabels).map(([v, l]) => ({ value: v, label: l })),
          ]}
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="w-44"
        />
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={24} className="animate-spin text-neutral-400" />
        </div>
      )}

      {/* Notifications list */}
      {!isLoading && filteredNotifications.length > 0 ? (
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 divide-y divide-neutral-100 overflow-hidden">
          {filteredNotifications.map((notif) => {
            const Icon = typeIcons[notif.type] ?? Bell;
            return (
              <div
                key={notif.id}
                onClick={() => handleClickNotification(notif)}
                className={cn(
                  'flex items-start gap-3 px-5 py-4 cursor-pointer transition-colors',
                  !notif.isRead ? 'bg-primary-50/30 hover:bg-primary-50/50' : 'hover:bg-neutral-50 dark:hover:bg-neutral-800',
                )}
              >
                {/* Icon */}
                <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5', typeColors[notif.type])}>
                  <Icon size={16} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={cn('text-sm', !notif.isRead ? 'font-semibold text-neutral-900 dark:text-neutral-100' : 'font-medium text-neutral-700 dark:text-neutral-300')}>
                      {notif.title}
                    </p>
                    {!notif.isRead && (
                      <span className="w-2 h-2 rounded-full bg-primary-500 flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5 line-clamp-1">{notif.message}</p>
                </div>

                {/* Time + actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs text-neutral-400 whitespace-nowrap">{formatRelativeTime(notif.createdAt)}</span>
                  {!notif.isRead && (
                    <button
                      onClick={(e) => { e.stopPropagation(); markAsRead(notif.id); }}
                      className="p-1 text-neutral-400 hover:text-primary-600 rounded"
                      title="Отметить как прочитанное"
                    >
                      <Check size={14} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        !isLoading && (
          <EmptyState
            variant="no-data"
            title="Нет уведомлений"
            description="Новые уведомления появятся здесь"
          />
        )
      )}
    </div>
  );
};

export default NotificationsPage;
