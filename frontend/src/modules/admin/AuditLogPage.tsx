import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/cn';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Input } from '@/design-system/components/FormField';
import { t } from '@/i18n';
import { adminApi } from '@/api/admin';
import { formatDateTime } from '@/lib/format';

/** Embeddable content component (no PageHeader) */
export const AuditLogContent: React.FC = () => {
  const [entityTypeFilter, setEntityTypeFilter] = useState('');
  const [page, setPage] = useState(0);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['audit-logs', entityTypeFilter, page],
    queryFn: () => adminApi.getAuditLogs({
      entityType: entityTypeFilter || undefined,
      page,
      size: 50,
    }),
  });

  const logs = data?.content ?? [];

  const actionColors: Record<string, string> = {
    CREATE: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    UPDATE: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    DELETE: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    STATUS_CHANGE: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400 z-10" />
          <Input
            value={entityTypeFilter}
            onChange={(e) => { setEntityTypeFilter(e.target.value); setPage(0); }}
            placeholder={t('auditLog.filterPlaceholder')}
            className="pl-9"
          />
        </div>
        <button onClick={() => refetch()} className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800">
          <RefreshCw className="h-4 w-4 text-neutral-500" />
        </button>
      </div>

      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50">
                <th className="text-left px-4 py-3 font-medium text-neutral-500 dark:text-neutral-400">{t('auditLog.colTime')}</th>
                <th className="text-left px-4 py-3 font-medium text-neutral-500 dark:text-neutral-400">{t('auditLog.colUser')}</th>
                <th className="text-left px-4 py-3 font-medium text-neutral-500 dark:text-neutral-400">{t('auditLog.colAction')}</th>
                <th className="text-left px-4 py-3 font-medium text-neutral-500 dark:text-neutral-400">{t('auditLog.colEntity')}</th>
                <th className="text-left px-4 py-3 font-medium text-neutral-500 dark:text-neutral-400">{t('auditLog.colField')}</th>
                <th className="text-left px-4 py-3 font-medium text-neutral-500 dark:text-neutral-400">{t('auditLog.colOldValue')}</th>
                <th className="text-left px-4 py-3 font-medium text-neutral-500 dark:text-neutral-400">{t('auditLog.colNewValue')}</th>
                <th className="text-left px-4 py-3 font-medium text-neutral-500 dark:text-neutral-400">{t('auditLog.colIp')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {isLoading ? (
                <tr><td colSpan={8} className="text-center py-8 text-neutral-400">{t('common.loading')}</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-8 text-neutral-400">{t('auditLog.empty')}</td></tr>
              ) : logs.map((log) => (
                <tr key={log.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                  <td className="px-4 py-2.5 text-xs text-neutral-500 dark:text-neutral-400 whitespace-nowrap">{formatDateTime(log.timestamp)}</td>
                  <td className="px-4 py-2.5 text-neutral-900 dark:text-neutral-100">{log.userName ?? '\u2014'}</td>
                  <td className="px-4 py-2.5">
                    <span className={cn('px-2 py-0.5 rounded text-xs font-medium', actionColors[log.action] ?? 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300')}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-neutral-700 dark:text-neutral-300">{log.entityType}</td>
                  <td className="px-4 py-2.5 text-neutral-500 text-xs">{log.field ?? '\u2014'}</td>
                  <td className="px-4 py-2.5 text-xs text-neutral-500 max-w-[120px] truncate">{log.oldValue ?? '\u2014'}</td>
                  <td className="px-4 py-2.5 text-xs text-neutral-500 max-w-[120px] truncate">{log.newValue ?? '\u2014'}</td>
                  <td className="px-4 py-2.5 text-xs text-neutral-400 font-mono">{log.ipAddress ?? '\u2014'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-neutral-200 dark:border-neutral-700">
            <span className="text-sm text-neutral-500">{t('auditLog.showing', { count: logs.length, total: data.totalElements })}</span>
            <div className="flex gap-1">
              <button disabled={page === 0} onClick={() => setPage(page - 1)} className="px-3 py-1 text-sm rounded border border-neutral-300 dark:border-neutral-600 disabled:opacity-30 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                {t('common.previous')}
              </button>
              <button disabled={page >= data.totalPages - 1} onClick={() => setPage(page + 1)} className="px-3 py-1 text-sm rounded border border-neutral-300 dark:border-neutral-600 disabled:opacity-30 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                {t('common.next')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/** Standalone page with PageHeader (direct route access) */
const AuditLogPage: React.FC = () => (
  <div className="space-y-6 animate-fade-in">
    <PageHeader
      title={t('auditLog.title')}
      subtitle={t('auditLog.subtitle')}
      breadcrumbs={[
        { label: t('navigation.items.dashboard'), href: '/' },
        { label: t('adminDashboard.title'), href: '/admin/dashboard' },
        { label: t('auditLog.title') },
      ]}
    />
    <AuditLogContent />
  </div>
);

export default AuditLogPage;
