import React, { useState, useMemo } from 'react';
import {
  MessageSquare,
  ArrowRightLeft,
  UserCheck,
  Paperclip,
  Mail,
  Phone,
  Users,
  CheckCircle2,
  PlusCircle,
  Pencil,
  Pin,
  Reply,
  ChevronDown,
  ChevronUp,
  Search,
  Inbox,
} from 'lucide-react';
import { parseISO, isValid, isToday, isYesterday, format } from 'date-fns';
import { ru as ruLocale } from 'date-fns/locale';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';
import { formatRelativeTime } from '@/lib/format';

// ─── Types ──────────────────────────────────────────────────────────────────

export type ActivityType =
  | 'comment'
  | 'status_change'
  | 'assignment'
  | 'file'
  | 'email'
  | 'call'
  | 'meeting'
  | 'approval'
  | 'creation'
  | 'edit';

export interface ActivityItem {
  id: string;
  type: ActivityType;
  title: string;
  description?: string;
  user: {
    name: string;
    avatar?: string;
  };
  timestamp: string; // ISO date
  metadata?: Record<string, string>;
  pinned?: boolean;
}

export interface ActivityTimelineProps {
  activities: ActivityItem[];
  loading?: boolean;
  emptyMessage?: string;
  onPin?: (id: string) => void;
  onReply?: (id: string) => void;
  maxItems?: number;
  filterTypes?: ActivityType[];
  searchable?: boolean;
  className?: string;
}

// ─── Icon & color config per type ───────────────────────────────────────────

const typeConfig: Record<ActivityType, { icon: React.ElementType; dotColor: string; label: () => string }> = {
  comment: {
    icon: MessageSquare,
    dotColor: 'bg-primary-500',
    label: () => t('activityTimeline.types.comment'),
  },
  status_change: {
    icon: ArrowRightLeft,
    dotColor: 'bg-warning-500',
    label: () => t('activityTimeline.types.statusChange'),
  },
  assignment: {
    icon: UserCheck,
    dotColor: 'bg-purple-500',
    label: () => t('activityTimeline.types.assignment'),
  },
  file: {
    icon: Paperclip,
    dotColor: 'bg-blue-500',
    label: () => t('activityTimeline.types.file'),
  },
  email: {
    icon: Mail,
    dotColor: 'bg-cyan-500',
    label: () => t('activityTimeline.types.email'),
  },
  call: {
    icon: Phone,
    dotColor: 'bg-cyan-500',
    label: () => t('activityTimeline.types.call'),
  },
  meeting: {
    icon: Users,
    dotColor: 'bg-cyan-500',
    label: () => t('activityTimeline.types.meeting'),
  },
  approval: {
    icon: CheckCircle2,
    dotColor: 'bg-success-500',
    label: () => t('activityTimeline.types.approval'),
  },
  creation: {
    icon: PlusCircle,
    dotColor: 'bg-success-500',
    label: () => t('activityTimeline.types.creation'),
  },
  edit: {
    icon: Pencil,
    dotColor: 'bg-neutral-500',
    label: () => t('activityTimeline.types.edit'),
  },
};

// ─── Date grouping helper ───────────────────────────────────────────────────

function getDateGroupLabel(dateStr: string): string {
  const parsed = parseISO(dateStr);
  if (!isValid(parsed)) return '—';
  if (isToday(parsed)) return t('activityTimeline.today');
  if (isYesterday(parsed)) return t('activityTimeline.yesterday');
  return format(parsed, 'd MMMM yyyy', { locale: ruLocale });
}

function getDateKey(dateStr: string): string {
  const parsed = parseISO(dateStr);
  if (!isValid(parsed)) return 'unknown';
  return format(parsed, 'yyyy-MM-dd');
}

// ─── User avatar ────────────────────────────────────────────────────────────

function UserAvatar({ name, avatar }: { name: string; avatar?: string }) {
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  if (avatar) {
    return (
      <img
        src={avatar}
        alt={name}
        className="h-6 w-6 rounded-full object-cover"
      />
    );
  }

  return (
    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-neutral-200 dark:bg-neutral-700 text-[10px] font-medium text-neutral-600 dark:text-neutral-300">
      {initials}
    </span>
  );
}

// ─── Metadata display ───────────────────────────────────────────────────────

function MetadataBadges({ metadata }: { metadata: Record<string, string> }) {
  const entries = Object.entries(metadata);
  if (entries.length === 0) return null;

  // Special case: status change with from/to
  if (metadata.from && metadata.to) {
    return (
      <span className="inline-flex items-center gap-1 text-xs">
        <span className="rounded bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 text-neutral-600 dark:text-neutral-400">
          {metadata.from}
        </span>
        <ArrowRightLeft className="h-3 w-3 text-neutral-400" />
        <span className="rounded bg-primary-50 dark:bg-primary-900/30 px-1.5 py-0.5 text-primary-700 dark:text-primary-300">
          {metadata.to}
        </span>
      </span>
    );
  }

  return (
    <span className="inline-flex flex-wrap gap-1">
      {entries.map(([key, val]) => (
        <span
          key={key}
          className="rounded bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 text-xs text-neutral-600 dark:text-neutral-400"
        >
          {key}: {val}
        </span>
      ))}
    </span>
  );
}

// ─── Single activity item ───────────────────────────────────────────────────

interface TimelineItemProps {
  item: ActivityItem;
  onPin?: (id: string) => void;
  onReply?: (id: string) => void;
  isLast: boolean;
}

function TimelineItem({ item, onPin, onReply, isLast }: TimelineItemProps) {
  const [expanded, setExpanded] = useState(false);
  const config = typeConfig[item.type];
  const Icon = config.icon;
  const hasLongDescription = !!item.description && item.description.length > 120;
  const displayDescription =
    item.description && !expanded && hasLongDescription
      ? item.description.slice(0, 120) + '...'
      : item.description;

  return (
    <div className="relative flex gap-3 pb-6 last:pb-0 group">
      {/* Connecting line segment */}
      {!isLast && (
        <div className="absolute left-[11px] top-6 bottom-0 w-0.5 bg-neutral-200 dark:bg-neutral-700" />
      )}

      {/* Dot */}
      <div className="relative z-10 flex-shrink-0">
        <span
          className={cn(
            'flex h-6 w-6 items-center justify-center rounded-full ring-4 ring-white dark:ring-neutral-900',
            config.dotColor,
          )}
        >
          <Icon className="h-3 w-3 text-white" />
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 -mt-0.5">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <UserAvatar name={item.user.name} avatar={item.user.avatar} />
            <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">
              {item.user.name}
            </span>
            {item.pinned && (
              <Pin className="h-3 w-3 text-warning-500 flex-shrink-0" />
            )}
          </div>
          <span className="text-xs text-neutral-400 dark:text-neutral-500 whitespace-nowrap flex-shrink-0">
            {formatRelativeTime(item.timestamp)}
          </span>
        </div>

        {/* Title */}
        <p className="mt-1 text-sm text-neutral-700 dark:text-neutral-300">
          {item.title}
        </p>

        {/* Metadata */}
        {item.metadata && Object.keys(item.metadata).length > 0 && (
          <div className="mt-1.5">
            <MetadataBadges metadata={item.metadata} />
          </div>
        )}

        {/* Description (expandable) */}
        {item.description && (
          <div className="mt-1.5">
            <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed whitespace-pre-line">
              {displayDescription}
            </p>
            {hasLongDescription && (
              <button
                type="button"
                onClick={() => setExpanded(!expanded)}
                className="mt-1 inline-flex items-center gap-0.5 text-xs text-primary-600 dark:text-primary-400 hover:underline"
              >
                {expanded ? (
                  <>
                    {t('common.showLess')}
                    <ChevronUp className="h-3 w-3" />
                  </>
                ) : (
                  <>
                    {t('common.more')}
                    <ChevronDown className="h-3 w-3" />
                  </>
                )}
              </button>
            )}
          </div>
        )}

        {/* Action buttons (visible on hover) */}
        {(onPin || onReply) && (
          <div className="mt-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            {onPin && (
              <button
                type="button"
                onClick={() => onPin(item.id)}
                className={cn(
                  'inline-flex items-center gap-1 rounded px-2 py-1 text-xs',
                  'text-neutral-500 dark:text-neutral-400',
                  'hover:bg-neutral-100 dark:hover:bg-neutral-800',
                  'transition-colors',
                )}
                title={t('activityTimeline.pin')}
              >
                <Pin className="h-3 w-3" />
                {t('activityTimeline.pin')}
              </button>
            )}
            {onReply && (
              <button
                type="button"
                onClick={() => onReply(item.id)}
                className={cn(
                  'inline-flex items-center gap-1 rounded px-2 py-1 text-xs',
                  'text-neutral-500 dark:text-neutral-400',
                  'hover:bg-neutral-100 dark:hover:bg-neutral-800',
                  'transition-colors',
                )}
                title={t('activityTimeline.reply')}
              >
                <Reply className="h-3 w-3" />
                {t('activityTimeline.reply')}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Skeleton loading ───────────────────────────────────────────────────────

function TimelineSkeleton() {
  return (
    <div className="space-y-6" aria-hidden>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex gap-3 animate-pulse">
          <div className="flex-shrink-0">
            <div className="h-6 w-6 rounded-full bg-neutral-200 dark:bg-neutral-700" />
          </div>
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <div className="h-4 w-24 rounded bg-neutral-200 dark:bg-neutral-700" />
              <div className="h-3 w-16 rounded bg-neutral-100 dark:bg-neutral-800" />
            </div>
            <div className="h-4 w-3/4 rounded bg-neutral-100 dark:bg-neutral-800" />
            <div className="h-3 w-1/2 rounded bg-neutral-100 dark:bg-neutral-800" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Filter pills ───────────────────────────────────────────────────────────

interface FilterBarProps {
  availableTypes: ActivityType[];
  activeTypes: Set<ActivityType>;
  onToggle: (type: ActivityType) => void;
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchable: boolean;
}

function FilterBar({ availableTypes, activeTypes, onToggle, searchValue, onSearchChange, searchable }: FilterBarProps) {
  return (
    <div className="space-y-2 mb-4">
      {searchable && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <input
            type="text"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={t('activityTimeline.searchPlaceholder')}
            className={cn(
              'w-full rounded-lg border border-neutral-200 dark:border-neutral-700',
              'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100',
              'pl-9 pr-3 py-2 text-sm',
              'placeholder:text-neutral-400 dark:placeholder:text-neutral-500',
              'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
            )}
          />
        </div>
      )}
      {availableTypes.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {availableTypes.map((type) => {
            const config = typeConfig[type];
            const active = activeTypes.has(type);
            return (
              <button
                key={type}
                type="button"
                onClick={() => onToggle(type)}
                className={cn(
                  'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-colors',
                  active
                    ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300'
                    : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700',
                )}
              >
                <span className={cn('h-1.5 w-1.5 rounded-full', config.dotColor)} />
                {config.label()}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Main component ─────────────────────────────────────────────────────────

export const ActivityTimeline: React.FC<ActivityTimelineProps> = ({
  activities,
  loading = false,
  emptyMessage,
  onPin,
  onReply,
  maxItems = 10,
  filterTypes,
  searchable = false,
  className,
}) => {
  const [visibleCount, setVisibleCount] = useState(maxItems);
  const [activeFilters, setActiveFilters] = useState<Set<ActivityType>>(
    () => new Set(filterTypes ?? []),
  );
  const [searchQuery, setSearchQuery] = useState('');

  const showFilterBar = searchable || (filterTypes && filterTypes.length > 0);

  const handleToggleFilter = (type: ActivityType) => {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  };

  // Filter, search, and sort activities
  const processedActivities = useMemo(() => {
    let items = [...activities];

    // Apply type filters (if any are active)
    if (activeFilters.size > 0) {
      items = items.filter((a) => activeFilters.has(a.type));
    }

    // Apply text search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.description?.toLowerCase().includes(q) ||
          a.user.name.toLowerCase().includes(q),
      );
    }

    // Sort: pinned first, then by timestamp desc
    items.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });

    return items;
  }, [activities, activeFilters, searchQuery]);

  // Visible slice
  const visibleActivities = processedActivities.slice(0, visibleCount);
  const hasMore = processedActivities.length > visibleCount;

  // Group by date
  const groups = useMemo(() => {
    const map = new Map<string, { label: string; items: ActivityItem[] }>();
    for (const item of visibleActivities) {
      const key = getDateKey(item.timestamp);
      if (!map.has(key)) {
        map.set(key, { label: getDateGroupLabel(item.timestamp), items: [] });
      }
      map.get(key)!.items.push(item);
    }
    return Array.from(map.values());
  }, [visibleActivities]);

  // ─── Loading state ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className={cn('', className)}>
        <TimelineSkeleton />
      </div>
    );
  }

  // ─── Empty state ────────────────────────────────────────────────────────
  if (processedActivities.length === 0) {
    return (
      <div className={cn('', className)}>
        {showFilterBar && (
          <FilterBar
            availableTypes={filterTypes ?? []}
            activeTypes={activeFilters}
            onToggle={handleToggleFilter}
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
            searchable={searchable}
          />
        )}
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Inbox className="h-10 w-10 text-neutral-300 dark:text-neutral-600 mb-3" />
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            {emptyMessage ?? t('activityTimeline.empty')}
          </p>
        </div>
      </div>
    );
  }

  // ─── Timeline ───────────────────────────────────────────────────────────
  return (
    <div className={cn('', className)}>
      {showFilterBar && (
        <FilterBar
          availableTypes={filterTypes ?? []}
          activeTypes={activeFilters}
          onToggle={handleToggleFilter}
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          searchable={searchable}
        />
      )}

      <div className="space-y-6">
        {groups.map((group, gi) => (
          <div key={gi}>
            {/* Date group header */}
            <div className="sticky top-0 z-10 mb-3">
              <span
                className={cn(
                  'inline-flex items-center rounded-full px-3 py-1 text-xs font-medium',
                  'bg-neutral-100 dark:bg-neutral-800',
                  'text-neutral-600 dark:text-neutral-400',
                  'shadow-sm',
                )}
              >
                {group.label}
              </span>
            </div>

            {/* Items in this group */}
            <div className="ml-0">
              {group.items.map((item, idx) => (
                <TimelineItem
                  key={item.id}
                  item={item}
                  onPin={onPin}
                  onReply={onReply}
                  isLast={gi === groups.length - 1 && idx === group.items.length - 1}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Show more button */}
      {hasMore && (
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => setVisibleCount((c) => c + maxItems)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium',
              'text-primary-600 dark:text-primary-400',
              'bg-primary-50 dark:bg-primary-900/20',
              'hover:bg-primary-100 dark:hover:bg-primary-900/30',
              'transition-colors',
            )}
          >
            <ChevronDown className="h-4 w-4" />
            {t('activityTimeline.showMore', {
              count: String(Math.min(maxItems, processedActivities.length - visibleCount)),
            })}
          </button>
        </div>
      )}
    </div>
  );
};
