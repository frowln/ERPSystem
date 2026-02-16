import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { Search, Plus, Webhook, CheckCircle, XCircle, Activity, Zap } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { DataTable } from '@/design-system/components/DataTable';
import { MetricCard } from '@/design-system/components/MetricCard';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { Input } from '@/design-system/components/FormField';
import { apiManagementApi } from '@/api/apiManagement';
import { formatDate, formatNumber } from '@/lib/format';
import type { WebhookConfig } from './types';
import { t } from '@/i18n';

const webhookStatusColorMap: Record<string, 'gray' | 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'orange' | 'cyan'> = {
  active: 'green',
  inactive: 'gray',
  failed: 'red',
};

const getWebhookStatusLabels = (): Record<string, string> => ({
  active: t('apiManagement.webhooks.statusActive'),
  inactive: t('apiManagement.webhooks.statusInactive'),
  failed: t('apiManagement.webhooks.statusFailed'),
});

type TabId = 'all' | 'ACTIVE' | 'FAILED' | 'INACTIVE';

const WebhooksPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['webhooks'],
    queryFn: () => apiManagementApi.getWebhooks(),
  });

  const webhooks = data?.content ?? [];

  const filtered = useMemo(() => {
    let result = webhooks;
    if (activeTab !== 'all') result = result.filter((w) => w.status === activeTab);
    if (search) {
      const lower = search.toLowerCase();
      result = result.filter(
        (w) => w.name.toLowerCase().includes(lower) || w.url.toLowerCase().includes(lower),
      );
    }
    return result;
  }, [webhooks, activeTab, search]);

  const tabCounts = useMemo(() => ({
    all: webhooks.length,
    active: webhooks.filter((w) => w.status === 'ACTIVE').length,
    failed: webhooks.filter((w) => w.status === 'FAILED').length,
    inactive: webhooks.filter((w) => w.status === 'INACTIVE').length,
  }), [webhooks]);

  const metrics = useMemo(() => {
    const totalSuccess = webhooks.reduce((s, w) => s + w.successCount, 0);
    const totalFailure = webhooks.reduce((s, w) => s + w.failureCount, 0);
    const successRate = (totalSuccess + totalFailure) > 0
      ? (totalSuccess / (totalSuccess + totalFailure) * 100)
      : 100;
    return {
      total: webhooks.length,
      active: webhooks.filter((w) => w.status === 'ACTIVE').length,
      totalDeliveries: totalSuccess + totalFailure,
      successRate,
    };
  }, [webhooks]);

  const webhookStatusLabels = getWebhookStatusLabels();

  const columns = useMemo<ColumnDef<WebhookConfig, unknown>[]>(
    () => [
      {
        accessorKey: 'name',
        header: t('apiManagement.webhooks.colWebhook'),
        size: 220,
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-neutral-900 dark:text-neutral-100">{row.original.name}</p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 font-mono truncate max-w-[200px]">{row.original.url}</p>
          </div>
        ),
      },
      {
        accessorKey: 'status',
        header: t('apiManagement.webhooks.colStatus'),
        size: 120,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={webhookStatusColorMap}
            label={webhookStatusLabels[getValue<string>()] ?? getValue<string>()}
          />
        ),
      },
      {
        accessorKey: 'events',
        header: t('apiManagement.webhooks.colEvents'),
        size: 220,
        cell: ({ getValue }) => {
          const events = getValue<string[]>();
          return (
            <div className="flex flex-wrap gap-1">
              {events.slice(0, 3).map((e) => (
                <span key={e} className="text-[10px] bg-neutral-100 dark:bg-neutral-800 text-neutral-600 px-1.5 py-0.5 rounded font-mono">
                  {e}
                </span>
              ))}
              {events.length > 3 && (
                <span className="text-[10px] text-neutral-400">+{events.length - 3}</span>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: 'successCount',
        header: t('apiManagement.webhooks.colSuccess'),
        size: 90,
        cell: ({ getValue }) => <span className="tabular-nums text-success-600">{formatNumber(getValue<number>())}</span>,
      },
      {
        accessorKey: 'failureCount',
        header: t('apiManagement.webhooks.colErrors'),
        size: 80,
        cell: ({ getValue }) => {
          const val = getValue<number>();
          return <span className={`tabular-nums ${val > 0 ? 'text-danger-600 font-medium' : 'text-neutral-500 dark:text-neutral-400'}`}>{val}</span>;
        },
      },
      {
        accessorKey: 'lastDeliveryStatus',
        header: t('apiManagement.webhooks.colHttpCode'),
        size: 90,
        cell: ({ getValue }) => {
          const val = getValue<number>();
          if (!val) return <span className="text-neutral-400">---</span>;
          const color = val >= 200 && val < 300 ? 'text-success-600' : 'text-danger-600';
          return <span className={`tabular-nums font-mono ${color}`}>{val}</span>;
        },
      },
      {
        accessorKey: 'lastDeliveryAt',
        header: t('apiManagement.webhooks.colLastDelivery'),
        size: 150,
        cell: ({ getValue }) => {
          const val = getValue<string>();
          return val ? <span className="tabular-nums text-neutral-700 dark:text-neutral-300 text-xs">{formatDate(val)}</span> : <span className="text-neutral-400">---</span>;
        },
      },
      {
        id: 'actions',
        header: '',
        size: 100,
        cell: ({ row }) => (
          <Button
            variant="ghost"
            size="xs"
            iconLeft={<Zap size={14} />}
            disabled={row.original.status === 'INACTIVE'}
          >
            {t('apiManagement.webhooks.testButton')}
          </Button>
        ),
      },
    ],
    [],
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('apiManagement.webhooks.title')}
        subtitle={t('apiManagement.webhooks.subtitle', { count: String(webhooks.length) })}
        breadcrumbs={[
          { label: t('apiManagement.webhooks.breadcrumbHome'), href: '/' },
          { label: t('apiManagement.webhooks.breadcrumbApiManagement') },
          { label: t('apiManagement.webhooks.breadcrumbWebhooks') },
        ]}
        actions={
          <Button iconLeft={<Plus size={16} />}>{t('apiManagement.webhooks.createWebhook')}</Button>
        }
        tabs={[
          { id: 'all', label: t('apiManagement.webhooks.tabAll'), count: tabCounts.all },
          { id: 'ACTIVE', label: t('apiManagement.webhooks.tabActive'), count: tabCounts.active },
          { id: 'FAILED', label: t('apiManagement.webhooks.tabFailed'), count: tabCounts.failed },
          { id: 'INACTIVE', label: t('apiManagement.webhooks.tabInactive'), count: tabCounts.inactive },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as TabId)}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard icon={<Webhook size={18} />} label={t('apiManagement.webhooks.metricTotal')} value={metrics.total} />
        <MetricCard icon={<CheckCircle size={18} />} label={t('apiManagement.webhooks.metricActive')} value={metrics.active} />
        <MetricCard icon={<Activity size={18} />} label={t('apiManagement.webhooks.metricDeliveries')} value={formatNumber(metrics.totalDeliveries)} />
        <MetricCard
          icon={<XCircle size={18} />}
          label={t('apiManagement.webhooks.metricSuccessRate')}
          value={`${metrics.successRate.toFixed(1)}%`}
          trend={{ direction: metrics.successRate >= 99 ? 'up' : 'down', value: `${metrics.successRate.toFixed(1)}%` }}
        />
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input placeholder={t('apiManagement.webhooks.searchPlaceholder')} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>

      <DataTable<WebhookConfig>
        data={filtered ?? []}
        columns={columns}
        loading={isLoading}
        enableColumnVisibility
        enableDensityToggle
        enableExport
        pageSize={20}
        emptyTitle={t('apiManagement.webhooks.emptyTitle')}
        emptyDescription={t('apiManagement.webhooks.emptyDescription')}
      />
    </div>
  );
};

export default WebhooksPage;
