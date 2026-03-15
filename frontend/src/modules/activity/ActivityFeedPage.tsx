import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Activity,
  FileText,
  ShieldAlert,
  DollarSign,
  User,
  Settings,
  Plus,
  Pencil,
  Trash2,
  Upload,
  MessageSquare,
  Filter,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { t } from '@/i18n';
import { formatDateShort } from '@/lib/format';
import { apiClient } from '@/api/client';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AuditLogEntry {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  field?: string;
  oldValue?: string;
  newValue?: string;
  userId?: string;
  userName?: string;
  timestamp: string;
  ipAddress?: string;
}

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------

async function fetchAuditLog(params: {
  page: number;
  size: number;
  action?: string;
  entityType?: string;
}): Promise<{ content: AuditLogEntry[]; totalElements: number; totalPages: number }> {
  const queryParams = { ...params };
  for (const path of ['/admin/audit-logs', '/audit-logs', '/audit-log']) {
    try {
      const response = await apiClient.get(path, {
        params: queryParams,
        _silentErrors: true,
      } as any);
      const data = response.data;
      if (data?.content) return data;
      if (Array.isArray(data))
        return { content: data, totalElements: data.length, totalPages: 1 };
    } catch {
      /* try next */
    }
  }
  return { content: [], totalElements: 0, totalPages: 0 };
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ACTION_TYPES = ['CREATE', 'UPDATE', 'DELETE', 'UPLOAD', 'COMMENT'] as const;

const MODULE_TYPES = [
  'PROJECT',
  'TASK',
  'DOCUMENT',
  'SAFETY',
  'WAREHOUSE',
  'FINANCE',
  'CONTRACT',
  'EMPLOYEE',
] as const;

const ACTION_ICON_MAP: Record<string, typeof Plus> = {
  CREATE: Plus,
  UPDATE: Pencil,
  DELETE: Trash2,
  UPLOAD: Upload,
  COMMENT: MessageSquare,
};

const MODULE_ICON_MAP: Record<string, typeof Activity> = {
  PROJECT: Activity,
  TASK: Activity,
  DOCUMENT: FileText,
  SAFETY: ShieldAlert,
  WAREHOUSE: Settings,
  FINANCE: DollarSign,
  CONTRACT: FileText,
  EMPLOYEE: User,
};

const ACTION_COLOR_MAP: Record<string, string> = {
  CREATE: 'bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400',
  UPDATE: 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400',
  DELETE: 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400',
  UPLOAD: 'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400',
  COMMENT: 'bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-400',
  STATUS_CHANGE:
    'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getInitials(name: string): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function formatRelativeTime(isoString: string): string {
  const now = Date.now();
  const then = new Date(isoString).getTime();
  const diffMs = now - then;

  if (Number.isNaN(diffMs) || diffMs < 0) return isoString;

  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return t('activity.timeJustNow');
  if (minutes < 60) return t('activity.timeMinutesAgo', { count: String(minutes) });
  if (hours < 24) return t('activity.timeHoursAgo', { count: String(hours) });
  if (days === 1) return t('activity.timeYesterday');
  if (days < 7) return t('activity.timeDaysAgo', { count: String(days) });

  return days > 365
    ? formatDateShort(isoString) + ' ' + new Date(isoString).getFullYear()
    : formatDateShort(isoString);
}

function getActionLabel(action: string): string {
  const key = action.toLowerCase();
  const map: Record<string, () => string> = {
    create: () => t('activity.types.created'),
    update: () => t('activity.types.updated'),
    delete: () => t('activity.types.deleted'),
    upload: () => t('activity.types.uploaded'),
    comment: () => t('activity.types.commented'),
    status_change: () => t('activity.types.updated'),
  };
  return (map[key] ?? (() => action))();
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const ActivityFeedPage: React.FC = () => {
  const [page, setPage] = useState(0);
  const [actionFilter, setActionFilter] = useState('');
  const [moduleFilter, setModuleFilter] = useState('');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['activity-feed', page, actionFilter, moduleFilter],
    queryFn: () =>
      fetchAuditLog({
        page,
        size: 50,
        action: actionFilter || undefined,
        entityType: moduleFilter || undefined,
      }),
  });

  const entries = data?.content ?? [];

  const filteredEntries = useMemo(() => {
    let result = entries;
    if (actionFilter) {
      result = result.filter(
        (e) => e.action.toUpperCase() === actionFilter.toUpperCase(),
      );
    }
    if (moduleFilter) {
      result = result.filter(
        (e) => e.entityType.toUpperCase() === moduleFilter.toUpperCase(),
      );
    }
    return result;
  }, [entries, actionFilter, moduleFilter]);

  const getActionTypeOptions = () =>
    ACTION_TYPES.map((a) => ({
      value: a,
      label: getActionLabel(a),
    }));

  const getModuleOptions = () =>
    MODULE_TYPES.map((m) => ({
      value: m,
      label: t(`activity.modules.${m.toLowerCase()}` as any),
    }));

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={t('activity.title')}
        subtitle={t('activity.description')}
        breadcrumbs={[
          { label: t('navigation.items.dashboard'), href: '/' },
          { label: t('activity.title') },
        ]}
        actions={
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            iconLeft={<RefreshCw className="h-4 w-4" />}
          >
            {t('common.refresh')}
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-neutral-400" />
          <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
            {t('activity.filterByType')}
          </span>
        </div>
        <select
          value={actionFilter}
          onChange={(e) => {
            setActionFilter(e.target.value);
            setPage(0);
          }}
          className="text-sm border border-neutral-300 dark:border-neutral-600 rounded-lg px-3 py-1.5 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="">{t('common.all')}</option>
          {getActionTypeOptions().map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <div className="flex items-center gap-2 ml-2">
          <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
            {t('activity.filterByModule')}
          </span>
        </div>
        <select
          value={moduleFilter}
          onChange={(e) => {
            setModuleFilter(e.target.value);
            setPage(0);
          }}
          className="text-sm border border-neutral-300 dark:border-neutral-600 rounded-lg px-3 py-1.5 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="">{t('common.all')}</option>
          {getModuleOptions().map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {(actionFilter || moduleFilter) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setActionFilter('');
              setModuleFilter('');
              setPage(0);
            }}
          >
            {t('common.reset')}
          </Button>
        )}
      </div>

      {/* Feed list */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700">
        {isLoading ? (
          <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3 px-4 py-3 animate-pulse">
                <div className="w-10 h-10 bg-neutral-200 dark:bg-neutral-700 rounded-full shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-3/4" />
                  <div className="h-3 bg-neutral-100 dark:bg-neutral-800 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="py-16 text-center">
            <Activity className="h-12 w-12 text-neutral-300 dark:text-neutral-600 mx-auto mb-3" />
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              {t('activity.noActivity')}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {filteredEntries.map((entry) => {
              const ActionIcon =
                ACTION_ICON_MAP[entry.action.toUpperCase()] ??
                MODULE_ICON_MAP[entry.entityType.toUpperCase()] ??
                Activity;
              const colorClass =
                ACTION_COLOR_MAP[entry.action.toUpperCase()] ??
                'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400';

              return (
                <div
                  key={entry.id}
                  className="flex items-start gap-3 px-4 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
                >
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-xs font-semibold text-primary-700 dark:text-primary-300">
                      {getInitials(entry.userName ?? '')}
                    </div>
                    <div
                      className={cn(
                        'absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full flex items-center justify-center border-2 border-white dark:border-neutral-900',
                        colorClass,
                      )}
                    >
                      <ActionIcon className="h-2.5 w-2.5" />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-neutral-900 dark:text-neutral-100">
                      <span className="font-medium">{entry.userName ?? t('activity.systemUser')}</span>{' '}
                      <span className="text-neutral-600 dark:text-neutral-400">
                        {getActionLabel(entry.action)}
                      </span>{' '}
                      <span className="font-medium text-neutral-700 dark:text-neutral-300">
                        {entry.entityType}
                      </span>
                      {entry.field && (
                        <span className="text-neutral-500 dark:text-neutral-400">
                          {' '}
                          ({entry.field})
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-0.5">
                      {formatRelativeTime(entry.timestamp)}
                    </p>
                  </div>

                  {/* Action badge */}
                  <span
                    className={cn(
                      'shrink-0 px-2 py-0.5 rounded text-xs font-medium',
                      colorClass,
                    )}
                  >
                    {entry.action}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-neutral-200 dark:border-neutral-700">
            <span className="text-sm text-neutral-500 dark:text-neutral-400">
              {t('activity.showing', {
                count: String(filteredEntries.length),
                total: String(data.totalElements),
              })}
            </span>
            <div className="flex gap-1">
              <button
                disabled={page === 0}
                onClick={() => setPage(page - 1)}
                className="px-3 py-1 text-sm rounded border border-neutral-300 dark:border-neutral-600 disabled:opacity-30 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
              >
                {t('common.previous')}
              </button>
              <button
                disabled={page >= data.totalPages - 1}
                onClick={() => setPage(page + 1)}
                className="px-3 py-1 text-sm rounded border border-neutral-300 dark:border-neutral-600 disabled:opacity-30 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
              >
                {t('common.next')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityFeedPage;
