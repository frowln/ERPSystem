import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { RefreshCw, ChevronDown, ChevronRight, AlertTriangle, XCircle } from 'lucide-react';
import { cn } from '@/lib/cn';
import { PageHeader } from '@/design-system/components/PageHeader';
import { t } from '@/i18n';
import { apiClient } from '@/api/client';
import { formatDateTime } from '@/lib/format';

interface ErrorLogEntry {
  id: string;
  timestamp: string;
  level: string;
  message: string;
  source?: string;
  stackTrace?: string;
}

const ErrorLogPage: React.FC = () => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data, isLoading, refetch, dataUpdatedAt } = useQuery<ErrorLogEntry[]>({
    queryKey: ['admin-error-log'],
    queryFn: async () => {
      try {
        const res = await apiClient.get('/admin/events/recent-errors', { _silentErrors: true } as any);
        return res.data ?? [];
      } catch {
        return [];
      }
    },
    refetchInterval: 30000,
  });

  const errors = data ?? [];

  const levelBadge = (level: string) => {
    const isError = level === 'ERROR';
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium',
          isError
            ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
            : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
        )}
      >
        {isError ? <XCircle className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
        {level}
      </span>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={t('admin.errorLog.title')}
        subtitle={t('admin.errorLog.subtitle')}
        breadcrumbs={[
          { label: t('navigation.items.dashboard'), href: '/' },
          { label: t('adminDashboard.title'), href: '/admin/dashboard' },
          { label: t('admin.errorLog.title') },
        ]}
      />

      <div className="flex items-center justify-between">
        <p className="text-xs text-neutral-500 dark:text-neutral-400">
          {t('admin.errorLog.autoRefresh')}
          {dataUpdatedAt ? ` — ${t('admin.errorLog.lastUpdated')}: ${formatDateTime(new Date(dataUpdatedAt))}` : ''}
        </p>
        <button
          onClick={() => refetch()}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          {t('admin.errorLog.refresh')}
        </button>
      </div>

      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50">
                <th className="w-8 p-3" />
                <th className="text-left px-4 py-3 font-medium text-neutral-500 dark:text-neutral-400">
                  {t('admin.errorLog.colTimestamp')}
                </th>
                <th className="text-left px-4 py-3 font-medium text-neutral-500 dark:text-neutral-400">
                  {t('admin.errorLog.colLevel')}
                </th>
                <th className="text-left px-4 py-3 font-medium text-neutral-500 dark:text-neutral-400">
                  {t('admin.errorLog.colMessage')}
                </th>
                <th className="text-left px-4 py-3 font-medium text-neutral-500 dark:text-neutral-400">
                  {t('admin.errorLog.colSource')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-neutral-400">
                    {t('common.loading')}
                  </td>
                </tr>
              ) : errors.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-neutral-400">
                    <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    <p>{t('admin.errorLog.empty')}</p>
                  </td>
                </tr>
              ) : (
                errors.map((entry) => {
                  const isExpanded = expandedId === entry.id;
                  return (
                    <React.Fragment key={entry.id}>
                      <tr
                        className={cn(
                          'hover:bg-neutral-50 dark:hover:bg-neutral-800/50 cursor-pointer transition-colors',
                          isExpanded && 'bg-neutral-50 dark:bg-neutral-800/30',
                        )}
                        onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                      >
                        <td className="p-3 text-neutral-400">
                          {entry.stackTrace ? (
                            isExpanded ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )
                          ) : null}
                        </td>
                        <td className="px-4 py-2.5 text-xs text-neutral-500 dark:text-neutral-400 whitespace-nowrap">
                          {formatDateTime(entry.timestamp)}
                        </td>
                        <td className="px-4 py-2.5">{levelBadge(entry.level)}</td>
                        <td className="px-4 py-2.5 text-neutral-900 dark:text-neutral-100 max-w-[400px] truncate">
                          {entry.message}
                        </td>
                        <td className="px-4 py-2.5 text-xs text-neutral-500 dark:text-neutral-400 font-mono">
                          {entry.source ?? '\u2014'}
                        </td>
                      </tr>
                      {isExpanded && entry.stackTrace && (
                        <tr>
                          <td colSpan={5} className="bg-neutral-50 dark:bg-neutral-800/30 px-6 py-4">
                            <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-2">
                              {t('admin.errorLog.stackTrace')}
                            </p>
                            <pre className="text-xs text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 rounded-lg p-4 overflow-x-auto max-h-64 whitespace-pre-wrap break-words">
                              {entry.stackTrace}
                            </pre>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ErrorLogPage;
