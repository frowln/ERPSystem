import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  Bell, CheckCheck, Search, Trash2, ArrowLeft,
  ClipboardCheck, CheckCircle2, AtSign, UserCheck, FileText,
  AlertTriangle, Clock, Settings2, MessageSquare, FolderKanban,
  ArrowRight, X, ExternalLink, MailOpen, BellOff, Filter,
  Inbox, Star, Archive, MoreHorizontal,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { formatRelativeTime, formatDateTime } from '@/lib/format';
import { notificationsApi } from '@/api/notifications';
import { useNotificationStore } from '@/stores/notificationStore';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { t } from '@/i18n';
import type { Notification } from '@/api/notifications';

// ---- Notification type config ----

type InboxNotifType =
  | 'task_assigned'
  | 'task_completed'
  | 'comment_mention'
  | 'status_change'
  | 'approval_request'
  | 'document_shared'
  | 'deadline_approaching'
  | 'system';

const inboxTypeIcons: Record<InboxNotifType, React.ElementType> = {
  task_assigned: ClipboardCheck,
  task_completed: CheckCircle2,
  comment_mention: AtSign,
  status_change: FolderKanban,
  approval_request: UserCheck,
  document_shared: FileText,
  deadline_approaching: Clock,
  system: Settings2,
};

const inboxTypeColors: Record<InboxNotifType, string> = {
  task_assigned: 'text-purple-500 bg-purple-50 dark:bg-purple-900/30',
  task_completed: 'text-green-500 bg-green-50 dark:bg-green-900/30',
  comment_mention: 'text-blue-500 bg-blue-50 dark:bg-blue-900/30',
  status_change: 'text-amber-500 bg-amber-50 dark:bg-amber-900/30',
  approval_request: 'text-orange-500 bg-orange-50 dark:bg-orange-900/30',
  document_shared: 'text-cyan-500 bg-cyan-50 dark:bg-cyan-900/30',
  deadline_approaching: 'text-red-500 bg-red-50 dark:bg-red-900/30',
  system: 'text-neutral-500 bg-neutral-100 dark:bg-neutral-800',
};

const inboxTypeBorderColors: Record<InboxNotifType, string> = {
  task_assigned: 'border-l-purple-500',
  task_completed: 'border-l-green-500',
  comment_mention: 'border-l-blue-500',
  status_change: 'border-l-amber-500',
  approval_request: 'border-l-orange-500',
  document_shared: 'border-l-cyan-500',
  deadline_approaching: 'border-l-red-500',
  system: 'border-l-neutral-400',
};

/** Map backend notification types to inbox types */
function mapToInboxType(backendType: string): InboxNotifType {
  const map: Record<string, InboxNotifType> = {
    TASK: 'task_assigned',
    SUCCESS: 'task_completed',
    INFO: 'system',
    WARNING: 'deadline_approaching',
    ERROR: 'system',
    DOCUMENT: 'document_shared',
    PAYMENT: 'approval_request',
    PROJECT: 'status_change',
    MESSAGE: 'comment_mention',
  };
  return map[backendType] ?? 'system';
}

function getInboxTypeLabel(type: InboxNotifType): string {
  const labels: Record<InboxNotifType, string> = {
    task_assigned: t('inbox.taskAssigned'),
    task_completed: t('inbox.taskCompleted'),
    comment_mention: t('inbox.commentMention'),
    status_change: t('inbox.statusChange'),
    approval_request: t('inbox.approvalRequest'),
    document_shared: t('inbox.documentShared'),
    deadline_approaching: t('inbox.deadlineApproaching'),
    system: t('inbox.system'),
  };
  return labels[type];
}

/** Category group for type-based grouping */
type InboxCategory = 'mentions' | 'assignments' | 'approvals' | 'system';

function mapToCategory(type: InboxNotifType): InboxCategory {
  switch (type) {
    case 'comment_mention':
      return 'mentions';
    case 'task_assigned':
    case 'task_completed':
      return 'assignments';
    case 'approval_request':
      return 'approvals';
    default:
      return 'system';
  }
}

function getCategoryLabel(cat: InboxCategory): string {
  const labels: Record<InboxCategory, string> = {
    mentions: t('inbox.catMentions'),
    assignments: t('inbox.catAssignments'),
    approvals: t('inbox.catApprovals'),
    system: t('inbox.catSystem'),
  };
  return labels[cat];
}

function getCategoryIcon(cat: InboxCategory): React.ElementType {
  const icons: Record<InboxCategory, React.ElementType> = {
    mentions: AtSign,
    assignments: ClipboardCheck,
    approvals: UserCheck,
    system: Settings2,
  };
  return icons[cat];
}

// ---- Date grouping ----

function getDateGroup(dateStr: string): 'today' | 'yesterday' | 'thisWeek' | 'earlier' {
  const date = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  if (date >= today) return 'today';
  if (date >= yesterday) return 'yesterday';
  if (date >= weekAgo) return 'thisWeek';
  return 'earlier';
}

function getDateGroupLabel(group: string): string {
  const labels: Record<string, string> = {
    today: t('inbox.today'),
    yesterday: t('inbox.yesterday'),
    thisWeek: t('inbox.thisWeek'),
    earlier: t('inbox.earlier'),
  };
  return labels[group] ?? group;
}

// ---- Tab types ----

type InboxTab = 'all' | 'unread' | 'mentions' | 'assigned';

// ---- Grouping mode ----

type GroupMode = 'date' | 'type';

// ---- Skeleton ----

const ListSkeleton: React.FC = () => (
  <div className="animate-pulse space-y-1 p-2">
    {Array.from({ length: 8 }).map((_, i) => (
      <div key={i} className="flex items-start gap-3 px-3 py-3 rounded-lg">
        <div className="w-9 h-9 rounded-full bg-neutral-200 dark:bg-neutral-700 flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-3/4" />
          <div className="h-3 bg-neutral-100 dark:bg-neutral-800 rounded w-1/2" />
        </div>
        <div className="h-3 bg-neutral-100 dark:bg-neutral-800 rounded w-12 flex-shrink-0 mt-1" />
      </div>
    ))}
  </div>
);

const DetailSkeleton: React.FC = () => (
  <div className="animate-pulse px-6 py-5 space-y-4">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-full bg-neutral-200 dark:bg-neutral-700" />
      <div className="flex-1 space-y-2">
        <div className="h-5 bg-neutral-200 dark:bg-neutral-700 rounded w-2/3" />
        <div className="h-3 bg-neutral-100 dark:bg-neutral-800 rounded w-1/3" />
      </div>
    </div>
    <div className="h-px bg-neutral-200 dark:bg-neutral-700" />
    <div className="space-y-3">
      <div className="h-4 bg-neutral-100 dark:bg-neutral-800 rounded w-full" />
      <div className="h-4 bg-neutral-100 dark:bg-neutral-800 rounded w-5/6" />
      <div className="h-4 bg-neutral-100 dark:bg-neutral-800 rounded w-2/3" />
    </div>
    <div className="h-10 bg-neutral-100 dark:bg-neutral-800 rounded w-40 mt-6" />
  </div>
);

// ---- Empty State ----

const EmptyState: React.FC<{ tab: InboxTab; search: string }> = ({ tab, search }) => {
  const config: Record<InboxTab, { icon: React.ElementType; message: string }> = {
    all: { icon: Inbox, message: t('inbox.empty') },
    unread: { icon: MailOpen, message: t('inbox.emptyUnread') },
    mentions: { icon: AtSign, message: t('inbox.emptyMentions') },
    assigned: { icon: ClipboardCheck, message: t('inbox.emptyAssigned') },
  };

  const { icon: Icon, message } = config[tab];

  return (
    <div className="flex flex-col items-center justify-center py-20 text-neutral-400 dark:text-neutral-500">
      <div className="w-16 h-16 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mb-4">
        <Icon size={28} className="opacity-40" />
      </div>
      <p className="text-sm text-center px-6 font-medium">
        {search ? t('inbox.emptySearch') : message}
      </p>
      {search && (
        <p className="text-xs text-neutral-400 mt-1">
          {t('inbox.tryDifferentSearch')}
        </p>
      )}
    </div>
  );
};

// ---- Notification Item ----

interface NotifItemProps {
  notif: Notification;
  isSelected: boolean;
  onSelect: (n: Notification) => void;
  isFocused: boolean;
}

const NotifItem: React.FC<NotifItemProps> = React.memo(({ notif, isSelected, onSelect, isFocused }) => {
  const inboxType = mapToInboxType(notif.type);
  const Icon = inboxTypeIcons[inboxType];
  const colorClass = inboxTypeColors[inboxType];
  const borderColor = inboxTypeBorderColors[inboxType];

  return (
    <button
      onClick={() => onSelect(notif)}
      data-notification-id={notif.id}
      className={cn(
        'w-full flex items-start gap-3 px-3 py-3 rounded-lg transition-all duration-150 text-left group relative',
        'border-l-[3px]',
        isSelected
          ? 'bg-primary-50 dark:bg-primary-900/20 border-l-primary-500'
          : !notif.isRead
            ? cn('hover:bg-neutral-50 dark:hover:bg-neutral-800/70', borderColor)
            : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/70 border-l-transparent',
        isFocused && !isSelected && 'ring-2 ring-primary-300 dark:ring-primary-700 ring-inset',
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          'w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 transition-transform group-hover:scale-105',
          colorClass,
        )}
      >
        <Icon size={16} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p
            className={cn(
              'text-sm truncate flex-1',
              notif.isRead
                ? 'text-neutral-600 dark:text-neutral-400'
                : 'text-neutral-900 dark:text-neutral-100 font-semibold',
            )}
          >
            {notif.title}
          </p>
          {!notif.isRead && (
            <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 animate-pulse" />
          )}
        </div>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 line-clamp-1">
          {notif.message}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[10px] text-neutral-400 dark:text-neutral-500">
            {formatRelativeTime(notif.createdAt)}
          </span>
          <span className="text-[10px] text-neutral-300 dark:text-neutral-600">&middot;</span>
          <span className={cn(
            'text-[10px] px-1.5 py-0.5 rounded-full',
            notif.isRead
              ? 'text-neutral-400 dark:text-neutral-500 bg-neutral-100 dark:bg-neutral-800'
              : 'text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800',
          )}>
            {getInboxTypeLabel(inboxType)}
          </span>
        </div>
      </div>

      {/* Hover arrow */}
      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-2">
        <ArrowRight size={14} className="text-neutral-300 dark:text-neutral-600" />
      </div>
    </button>
  );
});

NotifItem.displayName = 'NotifItem';

// ---- Stats Bar ----

const StatsBar: React.FC<{ notifications: Notification[] }> = React.memo(({ notifications }) => {
  const stats = useMemo(() => {
    const counts: Record<InboxCategory, number> = { mentions: 0, assignments: 0, approvals: 0, system: 0 };
    for (const n of notifications) {
      if (!n.isRead) {
        const cat = mapToCategory(mapToInboxType(n.type));
        counts[cat]++;
      }
    }
    return counts;
  }, [notifications]);

  const categories: InboxCategory[] = ['mentions', 'assignments', 'approvals', 'system'];
  const hasAny = Object.values(stats).some((v) => v > 0);

  if (!hasAny) return null;

  return (
    <div className="flex items-center gap-1.5 px-4 py-2 border-b border-neutral-100 dark:border-neutral-800 overflow-x-auto scrollbar-none">
      {categories.map((cat) => {
        if (stats[cat] === 0) return null;
        const CatIcon = getCategoryIcon(cat);
        return (
          <div
            key={cat}
            className="flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 whitespace-nowrap"
          >
            <CatIcon size={12} />
            <span>{getCategoryLabel(cat)}</span>
            <span className="ml-0.5 min-w-[16px] h-4 px-1 text-[10px] font-bold leading-4 text-center rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">
              {stats[cat]}
            </span>
          </div>
        );
      })}
    </div>
  );
});

StatsBar.displayName = 'StatsBar';

// ---- Main Component ----

const InboxPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const markAllReadInStore = useNotificationStore((s) => s.markAllRead);

  const [activeTab, setActiveTab] = useState<InboxTab>('all');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [groupMode, setGroupMode] = useState<GroupMode>('date');
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [showActions, setShowActions] = useState(false);

  const listRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Fetch notifications
  const { data: notifData, isLoading } = useQuery({
    queryKey: ['inbox-notifications'],
    queryFn: () => notificationsApi.getNotifications({ page: 0, size: 100 }),
  });

  const allNotifications: Notification[] = notifData?.content ?? [];

  // Filter by tab + search
  const filtered = useMemo(() => {
    let items = allNotifications;

    if (activeTab === 'unread') {
      items = items.filter((n) => !n.isRead);
    } else if (activeTab === 'mentions') {
      items = items.filter((n) => {
        const tp = mapToInboxType(n.type);
        return tp === 'comment_mention';
      });
    } else if (activeTab === 'assigned') {
      items = items.filter((n) => {
        const tp = mapToInboxType(n.type);
        return tp === 'task_assigned' || tp === 'approval_request';
      });
    }

    if (search) {
      const lower = search.toLowerCase();
      items = items.filter(
        (n) =>
          n.title.toLowerCase().includes(lower) ||
          n.message.toLowerCase().includes(lower),
      );
    }

    return items;
  }, [allNotifications, activeTab, search]);

  // Group by date
  const groupedByDate = useMemo(() => {
    const groups: { key: string; items: Notification[] }[] = [];
    const map = new Map<string, Notification[]>();

    for (const n of filtered) {
      const group = getDateGroup(n.createdAt);
      if (!map.has(group)) map.set(group, []);
      map.get(group)!.push(n);
    }

    const order = ['today', 'yesterday', 'thisWeek', 'earlier'];
    for (const key of order) {
      const items = map.get(key);
      if (items && items.length > 0) {
        groups.push({ key, items });
      }
    }
    return groups;
  }, [filtered]);

  // Group by type
  const groupedByType = useMemo(() => {
    const groups: { key: InboxCategory; items: Notification[] }[] = [];
    const map = new Map<InboxCategory, Notification[]>();

    for (const n of filtered) {
      const cat = mapToCategory(mapToInboxType(n.type));
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(n);
    }

    const order: InboxCategory[] = ['mentions', 'assignments', 'approvals', 'system'];
    for (const key of order) {
      const items = map.get(key);
      if (items && items.length > 0) {
        groups.push({ key, items });
      }
    }
    return groups;
  }, [filtered]);

  const grouped = groupMode === 'date' ? groupedByDate : groupedByType;

  // Flat list for keyboard nav
  const flatFiltered = useMemo(() => {
    const result: Notification[] = [];
    for (const g of grouped) {
      result.push(...g.items);
    }
    return result;
  }, [grouped]);

  const selectedNotif = useMemo(
    () => allNotifications.find((n) => n.id === selectedId) ?? null,
    [allNotifications, selectedId],
  );

  const unreadCount = useMemo(
    () => allNotifications.filter((n) => !n.isRead).length,
    [allNotifications],
  );

  // Reset WS unread on mount
  useEffect(() => {
    markAllReadInStore();
  }, [markAllReadInStore]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Cmd+K or Ctrl+K to focus search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchRef.current?.focus();
        return;
      }

      // Escape to deselect
      if (e.key === 'Escape') {
        if (selectedId) {
          setSelectedId(null);
          setFocusedIndex(-1);
        } else if (search) {
          setSearch('');
        }
        return;
      }

      // Arrow up/down for list navigation when not in search input
      if (document.activeElement === searchRef.current) return;

      if (e.key === 'ArrowDown' || e.key === 'j') {
        e.preventDefault();
        setFocusedIndex((prev) => Math.min(prev + 1, flatFiltered.length - 1));
      } else if (e.key === 'ArrowUp' || e.key === 'k') {
        e.preventDefault();
        setFocusedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter' && focusedIndex >= 0 && focusedIndex < flatFiltered.length) {
        e.preventDefault();
        const notif = flatFiltered[focusedIndex];
        handleSelectNotif(notif);
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selectedId, search, flatFiltered, focusedIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  // Scroll focused item into view
  useEffect(() => {
    if (focusedIndex >= 0 && focusedIndex < flatFiltered.length) {
      const notif = flatFiltered[focusedIndex];
      const el = listRef.current?.querySelector(`[data-notification-id="${notif.id}"]`);
      el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [focusedIndex, flatFiltered]);

  // Actions
  const markAsRead = useCallback(
    async (id: string) => {
      try {
        await notificationsApi.markAsRead(id);
        queryClient.invalidateQueries({ queryKey: ['inbox-notifications'] });
        queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
        queryClient.invalidateQueries({ queryKey: ['notifications-dropdown'] });
      } catch {
        toast.error(t('notificationsPage.markReadError'));
      }
    },
    [queryClient],
  );

  const markAllAsRead = useCallback(async () => {
    try {
      await notificationsApi.markAllAsRead();
      markAllReadInStore();
      queryClient.invalidateQueries({ queryKey: ['inbox-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-dropdown'] });
      toast.success(t('notificationsPage.allMarkedRead'));
    } catch {
      toast.error(t('notificationsPage.markAllReadError'));
    }
  }, [queryClient, markAllReadInStore]);

  const deleteRead = useCallback(async () => {
    try {
      const readItems = allNotifications.filter((n) => n.isRead);
      if (readItems.length === 0) {
        toast(t('inbox.noReadToDelete'));
        return;
      }
      await Promise.all(readItems.map((n) => notificationsApi.deleteNotification(n.id)));
      queryClient.invalidateQueries({ queryKey: ['inbox-notifications'] });
      toast.success(t('inbox.readDeleted'));
    } catch {
      toast.error(t('common.error'));
    }
  }, [allNotifications, queryClient]);

  const deleteNotification = useCallback(async (id: string) => {
    try {
      await notificationsApi.deleteNotification(id);
      if (selectedId === id) setSelectedId(null);
      queryClient.invalidateQueries({ queryKey: ['inbox-notifications'] });
      toast.success(t('inbox.notificationDeleted'));
    } catch {
      toast.error(t('common.error'));
    }
  }, [queryClient, selectedId]);

  const handleSelectNotif = useCallback(
    (notif: Notification) => {
      setSelectedId(notif.id);
      setFocusedIndex(flatFiltered.indexOf(notif));
      if (!notif.isRead) {
        markAsRead(notif.id);
      }
    },
    [markAsRead, flatFiltered],
  );

  const handleNavigateToEntity = useCallback(
    (notif: Notification) => {
      if (notif.sourceUrl) {
        navigate(notif.sourceUrl);
      }
    },
    [navigate],
  );

  // Tab config
  const tabs: { id: InboxTab; label: string; icon: React.ElementType; count?: number }[] = [
    { id: 'all', label: t('inbox.all'), icon: Inbox, count: allNotifications.length },
    { id: 'unread', label: t('inbox.unread'), icon: Bell, count: unreadCount },
    { id: 'mentions', label: t('inbox.mentions'), icon: AtSign },
    { id: 'assigned', label: t('inbox.assignedToMe'), icon: ClipboardCheck },
  ];

  // Detail panel for selected notification
  const renderDetail = () => {
    if (isLoading) {
      return (
        <div className="flex-1 flex flex-col">
          <DetailSkeleton />
        </div>
      );
    }

    if (!selectedNotif) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center text-neutral-400 dark:text-neutral-500 px-6">
          <div className="w-20 h-20 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mb-4">
            <Bell size={32} className="opacity-20" />
          </div>
          <p className="text-sm font-medium">{t('inbox.selectToPreview')}</p>
          <p className="text-xs mt-1 text-neutral-300 dark:text-neutral-600">
            {t('inbox.selectHint')}
          </p>
        </div>
      );
    }

    const inboxType = mapToInboxType(selectedNotif.type);
    const Icon = inboxTypeIcons[inboxType];
    const colorClass = inboxTypeColors[inboxType];
    const category = mapToCategory(inboxType);

    // Find prev/next for navigation
    const currentIndex = flatFiltered.findIndex((n) => n.id === selectedNotif.id);
    const prevNotif = currentIndex > 0 ? flatFiltered[currentIndex - 1] : null;
    const nextNotif = currentIndex < flatFiltered.length - 1 ? flatFiltered[currentIndex + 1] : null;

    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Detail header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900">
          {isMobile && (
            <button
              onClick={() => setSelectedId(null)}
              className="p-1.5 text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              <ArrowLeft size={18} />
            </button>
          )}
          <div className={cn('w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0', colorClass)}>
            <Icon size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 truncate">
              {selectedNotif.title}
            </h2>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <span className={cn(
                'text-[10px] px-2 py-0.5 rounded-full font-medium',
                colorClass,
              )}>
                {getInboxTypeLabel(inboxType)}
              </span>
              <span className="text-xs text-neutral-400">
                {formatRelativeTime(selectedNotif.createdAt)}
              </span>
            </div>
          </div>

          {/* Header actions */}
          <div className="flex items-center gap-1">
            {!selectedNotif.isRead && (
              <button
                onClick={() => markAsRead(selectedNotif.id)}
                className="p-1.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                title={t('inbox.markRead')}
              >
                <CheckCheck size={16} />
              </button>
            )}
            <button
              onClick={() => deleteNotification(selectedNotif.id)}
              className="p-1.5 text-neutral-400 hover:text-red-500 dark:hover:text-red-400 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              title={t('inbox.deleteNotification')}
            >
              <Trash2 size={16} />
            </button>
            <button
              onClick={() => setSelectedId(null)}
              className="p-1.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Detail body */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-6 py-5">
            {/* Metadata */}
            <div className="flex flex-wrap gap-3 mb-5">
              <div className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400">
                <Clock size={12} />
                <span>{formatDateTime(selectedNotif.createdAt)}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400">
                <FolderKanban size={12} />
                <span>{getCategoryLabel(category)}</span>
              </div>
              {selectedNotif.isRead && selectedNotif.readAt && (
                <div className="flex items-center gap-1.5 text-xs text-neutral-400 dark:text-neutral-500">
                  <CheckCircle2 size={12} />
                  <span>{t('inbox.readAtLabel')} {formatRelativeTime(selectedNotif.readAt)}</span>
                </div>
              )}
              {selectedNotif.sourceType && (
                <div className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400">
                  <FileText size={12} />
                  <span>{selectedNotif.sourceType}</span>
                </div>
              )}
            </div>

            {/* Message content */}
            <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-xl p-4 border border-neutral-200 dark:border-neutral-700">
              <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed whitespace-pre-wrap">
                {selectedNotif.message}
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-2 mt-6">
              {selectedNotif.sourceUrl && (
                <button
                  onClick={() => handleNavigateToEntity(selectedNotif)}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 rounded-lg transition-colors shadow-sm"
                >
                  <ExternalLink size={14} />
                  {t('inbox.goToEntity')}
                </button>
              )}
              {!selectedNotif.isRead && (
                <button
                  onClick={() => markAsRead(selectedNotif.id)}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-lg transition-colors"
                >
                  <MailOpen size={14} />
                  {t('inbox.markRead')}
                </button>
              )}
            </div>
          </div>

          {/* Navigation between notifications */}
          <div className="px-6 py-4 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
            <button
              onClick={() => prevNotif && handleSelectNotif(prevNotif)}
              disabled={!prevNotif}
              className={cn(
                'inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors',
                prevNotif
                  ? 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                  : 'text-neutral-300 dark:text-neutral-600 cursor-not-allowed',
              )}
            >
              <ArrowLeft size={12} />
              {t('inbox.prevNotification')}
            </button>
            <span className="text-[10px] text-neutral-400 dark:text-neutral-500">
              {currentIndex + 1} / {flatFiltered.length}
            </span>
            <button
              onClick={() => nextNotif && handleSelectNotif(nextNotif)}
              disabled={!nextNotif}
              className={cn(
                'inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors',
                nextNotif
                  ? 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                  : 'text-neutral-300 dark:text-neutral-600 cursor-not-allowed',
              )}
            >
              {t('inbox.nextNotification')}
              <ArrowRight size={12} />
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Mobile: show detail instead of list when selected
  if (isMobile && selectedId) {
    return (
      <div className="h-[calc(100vh-64px)] flex flex-col bg-white dark:bg-neutral-900">
        {renderDetail()}
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-64px)] flex bg-white dark:bg-neutral-900 animate-fade-in">
      {/* Left panel -- notification list */}
      <div
        className={cn(
          'flex flex-col border-r border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900',
          isMobile ? 'w-full' : 'w-[380px] flex-shrink-0',
        )}
      >
        {/* Header */}
        <div className="px-4 pt-4 pb-2 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                {t('inbox.title')}
              </h1>
              {unreadCount > 0 && (
                <span className="min-w-[20px] h-5 px-1.5 text-[11px] font-bold leading-5 text-center rounded-full bg-blue-500 text-white">
                  {unreadCount}
                </span>
              )}
            </div>
            <div className="flex items-center gap-0.5 relative">
              {/* Group toggle */}
              <button
                onClick={() => setGroupMode((m) => (m === 'date' ? 'type' : 'date'))}
                className={cn(
                  'p-1.5 rounded-lg transition-colors',
                  'text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800',
                )}
                title={t('inbox.toggleGrouping')}
              >
                <Filter size={14} />
              </button>

              {/* More actions */}
              <button
                onClick={() => setShowActions((v) => !v)}
                className="p-1.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              >
                <MoreHorizontal size={14} />
              </button>

              {/* Actions dropdown */}
              {showActions && (
                <>
                  <div className="fixed inset-0 z-20" onClick={() => setShowActions(false)} />
                  <div className="absolute right-0 top-8 z-30 w-48 py-1 bg-white dark:bg-neutral-800 rounded-lg shadow-lg border border-neutral-200 dark:border-neutral-700">
                    {unreadCount > 0 && (
                      <button
                        onClick={() => { markAllAsRead(); setShowActions(false); }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
                      >
                        <CheckCheck size={14} />
                        {t('inbox.markAllRead')}
                      </button>
                    )}
                    <button
                      onClick={() => { deleteRead(); setShowActions(false); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
                    >
                      <Trash2 size={14} />
                      {t('inbox.deleteRead')}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-3">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
            />
            <input
              ref={searchRef}
              type="text"
              placeholder={t('inbox.search')}
              value={search}
              onChange={(e) => { setSearch(e.target.value); setFocusedIndex(-1); }}
              className="w-full h-8 pl-8 pr-8 text-sm bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg outline-none placeholder:text-neutral-400 focus:border-primary-300 focus:ring-2 focus:ring-primary-100 dark:focus:ring-primary-900/50 transition-all text-neutral-900 dark:text-neutral-100"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Tabs */}
          <div className="flex gap-1 overflow-x-auto scrollbar-none">
            {tabs.map((tab) => {
              const TabIcon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => { setActiveTab(tab.id); setFocusedIndex(-1); }}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors',
                    activeTab === tab.id
                      ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                      : 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800',
                  )}
                >
                  <TabIcon size={12} />
                  {tab.label}
                  {tab.count !== undefined && tab.count > 0 && (
                    <span
                      className={cn(
                        'min-w-[18px] h-[18px] px-1 text-[10px] font-semibold leading-[18px] text-center rounded-full',
                        activeTab === tab.id
                          ? 'bg-primary-100 text-primary-700 dark:bg-primary-800 dark:text-primary-200'
                          : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-700 dark:text-neutral-400',
                      )}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Stats bar */}
        <StatsBar notifications={allNotifications} />

        {/* Notification list */}
        <div ref={listRef} className="flex-1 overflow-y-auto px-2 pb-2">
          {isLoading ? (
            <ListSkeleton />
          ) : filtered.length === 0 ? (
            <EmptyState tab={activeTab} search={search} />
          ) : (
            grouped.map((group) => {
              const label = groupMode === 'date'
                ? getDateGroupLabel(group.key)
                : getCategoryLabel(group.key as InboxCategory);
              const GroupIcon = groupMode === 'type' ? getCategoryIcon(group.key as InboxCategory) : null;

              return (
                <div key={group.key}>
                  <div className="sticky top-0 z-10 px-3 py-2 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-sm flex items-center gap-2">
                    {GroupIcon && <GroupIcon size={12} className="text-neutral-400" />}
                    <span className="text-[11px] font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
                      {label}
                    </span>
                    <span className="text-[10px] text-neutral-300 dark:text-neutral-600">
                      ({group.items.length})
                    </span>
                  </div>
                  <div className="space-y-0.5">
                    {group.items.map((notif) => (
                      <NotifItem
                        key={notif.id}
                        notif={notif}
                        isSelected={selectedId === notif.id}
                        onSelect={handleSelectNotif}
                        isFocused={flatFiltered[focusedIndex]?.id === notif.id}
                      />
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Keyboard hints (desktop only) */}
        {!isMobile && filtered.length > 0 && (
          <div className="px-4 py-2 border-t border-neutral-100 dark:border-neutral-800 flex items-center gap-3 text-[10px] text-neutral-400 dark:text-neutral-500">
            <span><kbd className="px-1 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded text-[10px] font-mono">j/k</kbd> {t('inbox.kbdNavigate')}</span>
            <span><kbd className="px-1 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded text-[10px] font-mono">Enter</kbd> {t('inbox.kbdOpen')}</span>
            <span><kbd className="px-1 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded text-[10px] font-mono">Esc</kbd> {t('inbox.kbdClose')}</span>
          </div>
        )}
      </div>

      {/* Right panel -- detail (desktop only) */}
      {!isMobile && (
        <div className="flex-1 flex flex-col bg-neutral-50 dark:bg-neutral-950">
          {renderDetail()}
        </div>
      )}
    </div>
  );
};

export default InboxPage;
