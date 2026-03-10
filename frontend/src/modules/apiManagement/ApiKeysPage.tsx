import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { Search, Plus, Key, Shield, Activity, Clock } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { DataTable } from '@/design-system/components/DataTable';
import { MetricCard } from '@/design-system/components/MetricCard';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { Input } from '@/design-system/components/FormField';
import { apiManagementApi } from '@/api/apiManagement';
import { formatDate, formatNumber } from '@/lib/format';
import type { ApiKey } from './types';
import { t } from '@/i18n';

const apiKeyStatusColorMap: Record<string, 'gray' | 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'orange' | 'cyan'> = {
  active: 'green',
  expired: 'orange',
  revoked: 'red',
  suspended: 'yellow',
};

const getApiKeyStatusLabels = (): Record<string, string> => ({
  active: t('apiManagement.keys.statusActive'),
  expired: t('apiManagement.keys.statusExpired'),
  revoked: t('apiManagement.keys.statusRevoked'),
  suspended: t('apiManagement.keys.statusSuspended'),
});

type TabId = 'all' | 'ACTIVE' | 'REVOKED';

const ApiKeysPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [search, setSearch] = useState('');

  const navigate = useNavigate();
  const { data, isLoading } = useQuery({
    queryKey: ['api-keys'],
    queryFn: () => apiManagementApi.getApiKeys(),
  });

  const keys = data?.content ?? [];

  const filtered = useMemo(() => {
    let result = keys;
    if (activeTab === 'ACTIVE') result = result.filter((k) => k.status === 'ACTIVE');
    else if (activeTab === 'REVOKED') result = result.filter((k) => k.status === 'REVOKED' || k.status === 'EXPIRED');
    if (search) {
      const lower = search.toLowerCase();
      result = result.filter(
        (k) =>
          k.name.toLowerCase().includes(lower) ||
          k.keyPrefix.toLowerCase().includes(lower) ||
          k.createdByName.toLowerCase().includes(lower),
      );
    }
    return result;
  }, [keys, activeTab, search]);

  const tabCounts = useMemo(() => ({
    all: keys.length,
    active: keys.filter((k) => k.status === 'ACTIVE').length,
    revoked: keys.filter((k) => k.status === 'REVOKED' || k.status === 'EXPIRED').length,
  }), [keys]);

  const metrics = useMemo(() => {
    const totalRequests = keys.reduce((s, k) => s + k.requestCount, 0);
    const activeKeys = keys.filter((k) => k.status === 'ACTIVE');
    return {
      total: keys.length,
      active: activeKeys.length,
      totalRequests,
      avgRateLimit: activeKeys.length > 0 ? activeKeys.reduce((s, k) => s + k.rateLimit, 0) / activeKeys.length : 0,
    };
  }, [keys]);

  const apiKeyStatusLabels = getApiKeyStatusLabels();

  const columns = useMemo<ColumnDef<ApiKey, unknown>[]>(
    () => [
      {
        accessorKey: 'name',
        header: t('apiManagement.keys.colName'),
        size: 220,
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-neutral-900 dark:text-neutral-100">{row.original.name}</p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 font-mono">{row.original.keyPrefix}...</p>
          </div>
        ),
      },
      {
        accessorKey: 'status',
        header: t('apiManagement.keys.colStatus'),
        size: 120,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={apiKeyStatusColorMap}
            label={apiKeyStatusLabels[getValue<string>()] ?? getValue<string>()}
          />
        ),
      },
      {
        accessorKey: 'scopes',
        header: t('apiManagement.keys.colPermissions'),
        size: 200,
        cell: ({ getValue }) => {
          const scopes = getValue<string[]>();
          return (
            <div className="flex flex-wrap gap-1">
              {scopes.slice(0, 3).map((s) => (
                <span key={s} className="text-[10px] bg-neutral-100 dark:bg-neutral-800 text-neutral-600 px-1.5 py-0.5 rounded font-mono">
                  {s}
                </span>
              ))}
              {scopes.length > 3 && (
                <span className="text-[10px] text-neutral-400">+{scopes.length - 3}</span>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: 'requestCount',
        header: t('apiManagement.keys.colRequests'),
        size: 100,
        cell: ({ getValue }) => <span className="tabular-nums text-neutral-700 dark:text-neutral-300">{formatNumber(getValue<number>())}</span>,
      },
      {
        accessorKey: 'rateLimit',
        header: t('apiManagement.keys.colRateLimit'),
        size: 100,
        cell: ({ getValue }) => <span className="tabular-nums text-neutral-500 dark:text-neutral-400">{getValue<number>()}{t('apiManagement.keys.perMinute')}</span>,
      },
      {
        accessorKey: 'lastUsedAt',
        header: t('apiManagement.keys.colLastUsed'),
        size: 160,
        cell: ({ getValue }) => {
          const val = getValue<string>();
          return val ? <span className="tabular-nums text-neutral-700 dark:text-neutral-300 text-xs">{formatDate(val)}</span> : <span className="text-neutral-400">{t('apiManagement.keys.notUsed')}</span>;
        },
      },
      {
        accessorKey: 'expiresAt',
        header: t('apiManagement.keys.colExpires'),
        size: 110,
        cell: ({ row }) => {
          const val = row.original.expiresAt;
          if (!val) return <span className="text-neutral-400">{t('apiManagement.keys.unlimited')}</span>;
          const isExpiringSoon = new Date(val).getTime() - Date.now() < 90 * 24 * 60 * 60 * 1000;
          return <span className={`tabular-nums ${isExpiringSoon ? 'text-warning-600 font-medium' : 'text-neutral-700 dark:text-neutral-300'}`}>{formatDate(val)}</span>;
        },
      },
      {
        accessorKey: 'createdByName',
        header: t('apiManagement.keys.colCreatedBy'),
        size: 130,
        cell: ({ getValue }) => <span className="text-neutral-500 dark:text-neutral-400">{getValue<string>()}</span>,
      },
      {
        id: 'actions',
        header: '',
        size: 100,
        cell: ({ row }) => (
          row.original.status === 'ACTIVE' ? (
            <Button variant="ghost" size="xs" className="text-danger-600">{t('apiManagement.keys.revokeButton')}</Button>
          ) : null
        ),
      },
    ],
    [],
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('apiManagement.keys.title')}
        subtitle={t('apiManagement.keys.subtitle', { count: String(keys.length) })}
        breadcrumbs={[
          { label: t('apiManagement.keys.breadcrumbHome'), href: '/' },
          { label: t('apiManagement.keys.breadcrumbApiManagement') },
          { label: t('apiManagement.keys.breadcrumbApiKeys') },
        ]}
        actions={
          <Button iconLeft={<Plus size={16} />} onClick={() => navigate('/api-management/keys/new')}>{t('apiManagement.keys.createKey')}</Button>
        }
        tabs={[
          { id: 'all', label: t('apiManagement.keys.tabAll'), count: tabCounts.all },
          { id: 'ACTIVE', label: t('apiManagement.keys.tabActive'), count: tabCounts.active },
          { id: 'REVOKED', label: t('apiManagement.keys.tabRevoked'), count: tabCounts.revoked },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as TabId)}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard icon={<Key size={18} />} label={t('apiManagement.keys.metricTotal')} value={metrics.total} />
        <MetricCard icon={<Shield size={18} />} label={t('apiManagement.keys.metricActive')} value={metrics.active} />
        <MetricCard icon={<Activity size={18} />} label={t('apiManagement.keys.metricTotalRequests')} value={formatNumber(metrics.totalRequests)} />
        <MetricCard icon={<Clock size={18} />} label={t('apiManagement.keys.metricAvgRateLimit')} value={`${metrics.avgRateLimit.toFixed(0)}${t('apiManagement.keys.perMinute')}`} />
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input placeholder={t('apiManagement.keys.searchPlaceholder')} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>

      <DataTable<ApiKey>
        data={filtered ?? []}
        columns={columns}
        loading={isLoading}
        enableColumnVisibility
        enableDensityToggle
        enableExport
        pageSize={20}
        emptyTitle={t('apiManagement.keys.emptyTitle')}
        emptyDescription={t('apiManagement.keys.emptyDescription')}
      />
    </div>
  );
};

export default ApiKeysPage;
