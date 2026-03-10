import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ShieldAlert, Search, Users, AlertTriangle, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/cn';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Input } from '@/design-system/components/FormField';
import { t } from '@/i18n';
import { adminApi, type LoginStats } from '@/api/admin';
import { formatDateTime, formatRelativeTime } from '@/lib/format';

const getActionLabels = (): Record<string, string> => ({
  LOGIN_SUCCESS: t('admin.loginAudit.actionLoginSuccess'),
  LOGIN_FAILED: t('admin.loginAudit.actionLoginFailed'),
  LOGOUT: t('admin.loginAudit.actionLogout'),
  PASSWORD_RESET: t('admin.loginAudit.actionPasswordReset'),
  ACCOUNT_LOCKED: t('admin.loginAudit.actionAccountLocked'),
});

const actionColors: Record<string, string> = {
  LOGIN_SUCCESS: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400',
  LOGIN_FAILED: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400',
  LOGOUT: 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400',
  PASSWORD_RESET: 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400',
  ACCOUNT_LOCKED: 'bg-red-200 text-red-800 dark:bg-red-900/30 dark:text-red-300',
};

type FilterTab = 'all' | 'failed';

/** Embeddable content component (no PageHeader) */
export const LoginAuditContent: React.FC = () => {
  const [filterTab, setFilterTab] = useState<FilterTab>('all');
  const [emailFilter, setEmailFilter] = useState('');
  const [page, setPage] = useState(0);

  const { data: stats } = useQuery<LoginStats>({
    queryKey: ['login-stats'],
    queryFn: adminApi.getLoginStats,
    refetchInterval: 30000,
  });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['login-audit', filterTab, emailFilter, page],
    queryFn: () => adminApi.getLoginAudit({
      failedOnly: filterTab === 'failed' ? true : undefined,
      email: emailFilter || undefined,
      page,
      size: 50,
    }),
  });

  const logs = data?.content ?? [];
  const actionLabels = getActionLabels();

  return (
    <div className="space-y-6">
      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: t('admin.loginAudit.statUniqueLogins24h'), value: stats?.uniqueLogins24h ?? 0, icon: Users, color: 'text-primary-600 dark:text-primary-400', bg: 'bg-primary-50 dark:bg-primary-900/20' },
          { label: t('admin.loginAudit.statUniqueLogins7d'), value: stats?.uniqueLogins7d ?? 0, icon: Users, color: 'text-success-600 dark:text-success-400', bg: 'bg-success-50 dark:bg-success-900/20' },
          { label: t('admin.loginAudit.statActiveSessions'), value: stats?.activeSessions ?? 0, icon: CheckCircle, color: 'text-success-600 dark:text-success-400', bg: 'bg-success-50 dark:bg-success-900/20' },
          { label: t('admin.loginAudit.statFailed24h'), value: stats?.actions24h?.LOGIN_FAILED ?? 0, icon: AlertTriangle, color: (stats?.actions24h?.LOGIN_FAILED ?? 0) > 0 ? 'text-danger-600 dark:text-danger-400' : 'text-neutral-500', bg: 'bg-danger-50 dark:bg-danger-900/20' },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4">
              <div className="flex items-center gap-3">
                <div className={cn('p-2 rounded-lg', s.bg)}><Icon className={cn('h-5 w-5', s.color)} /></div>
                <div>
                  <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 tabular-nums">{s.value}</p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">{s.label}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="flex rounded-lg border border-neutral-200 dark:border-neutral-700 overflow-hidden">
          {(['all', 'failed'] as FilterTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => { setFilterTab(tab); setPage(0); }}
              className={cn(
                'px-4 py-2 text-sm font-medium transition-colors',
                filterTab === tab
                  ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400'
                  : 'bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800',
              )}
            >
              {tab === 'all' ? t('admin.loginAudit.tabAll') : t('admin.loginAudit.tabFailedOnly')}
            </button>
          ))}
        </div>

        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400 z-10" />
          <Input
            value={emailFilter}
            onChange={(e) => { setEmailFilter(e.target.value); setPage(0); }}
            placeholder={t('admin.loginAudit.filterByEmail')}
            className="pl-9"
          />
        </div>

        <button
          onClick={() => refetch()}
          className="p-2 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800"
        >
          <RefreshCw className="h-4 w-4 text-neutral-500" />
        </button>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50">
                <th className="text-left px-4 py-3 font-medium text-neutral-500 dark:text-neutral-400">{t('admin.loginAudit.colTime')}</th>
                <th className="text-left px-4 py-3 font-medium text-neutral-500 dark:text-neutral-400">{t('admin.loginAudit.colEmail')}</th>
                <th className="text-left px-4 py-3 font-medium text-neutral-500 dark:text-neutral-400">{t('admin.loginAudit.colAction')}</th>
                <th className="text-left px-4 py-3 font-medium text-neutral-500 dark:text-neutral-400">{t('admin.loginAudit.colIp')}</th>
                <th className="text-left px-4 py-3 font-medium text-neutral-500 dark:text-neutral-400">{t('admin.loginAudit.colBrowser')}</th>
                <th className="text-left px-4 py-3 font-medium text-neutral-500 dark:text-neutral-400">{t('admin.loginAudit.colStatus')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {isLoading ? (
                <tr><td colSpan={6} className="text-center py-8 text-neutral-400">{t('common.loading')}</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-neutral-400">
                  <ShieldAlert className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  {t('admin.loginAudit.emptyState')}
                </td></tr>
              ) : logs.map((entry) => (
                <tr key={entry.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="text-neutral-900 dark:text-neutral-100">{formatDateTime(entry.createdAt)}</span>
                    <br />
                    <span className="text-[10px] text-neutral-400">{formatRelativeTime(entry.createdAt)}</span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-neutral-700 dark:text-neutral-300">{entry.email}</td>
                  <td className="px-4 py-3">
                    <span className={cn('text-[10px] px-2 py-0.5 rounded font-medium', actionColors[entry.action] ?? 'bg-neutral-100 text-neutral-600')}>
                      {actionLabels[entry.action] ?? entry.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-neutral-500">{entry.ipAddress ?? '—'}</td>
                  <td className="px-4 py-3 text-xs text-neutral-500 max-w-[200px] truncate">{entry.userAgent ?? '—'}</td>
                  <td className="px-4 py-3">
                    {entry.success ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <div className="flex items-center gap-1">
                        <XCircle className="h-4 w-4 text-red-500" />
                        {entry.failureReason && <span className="text-[10px] text-red-500">{entry.failureReason}</span>}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {(data?.totalPages ?? 0) > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-neutral-200 dark:border-neutral-700">
            <span className="text-xs text-neutral-500">{t('admin.loginAudit.totalRecords', { count: String(data?.totalElements ?? 0) })}</span>
            <div className="flex gap-2">
              <button disabled={page === 0} onClick={() => setPage(page - 1)} className="px-3 py-1 text-sm rounded border border-neutral-300 dark:border-neutral-600 disabled:opacity-30 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300">{t('common.previous')}</button>
              <button disabled={page >= (data?.totalPages ?? 1) - 1} onClick={() => setPage(page + 1)} className="px-3 py-1 text-sm rounded border border-neutral-300 dark:border-neutral-600 disabled:opacity-30 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300">{t('common.next')}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/** Standalone page with PageHeader (direct route access) */
const LoginAuditPage: React.FC = () => (
  <div className="space-y-6 animate-fade-in">
    <PageHeader
      title={t('admin.loginAudit.title')}
      subtitle={t('admin.loginAudit.subtitle')}
      breadcrumbs={[
        { label: t('navigation.items.dashboard'), href: '/' },
        { label: t('adminDashboard.title'), href: '/admin/dashboard' },
        { label: t('admin.loginAudit.title') },
      ]}
    />
    <LoginAuditContent />
  </div>
);

export default LoginAuditPage;
