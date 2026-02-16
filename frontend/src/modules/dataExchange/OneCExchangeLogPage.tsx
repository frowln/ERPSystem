import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { Search, ArrowUpDown, CheckCircle, XCircle, Clock, Activity } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { DataTable } from '@/design-system/components/DataTable';
import { MetricCard } from '@/design-system/components/MetricCard';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { Input, Select } from '@/design-system/components/FormField';
import { onecApi } from '@/api/onec';
import { formatDate } from '@/lib/format';
import { t } from '@/i18n';
import type { OneCExchangeLog } from './types';
import type { PaginatedResponse } from '@/types';

const exchangeStatusColorMap: Record<string, 'gray' | 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'orange' | 'cyan'> = {
  pending: 'gray',
  in_progress: 'blue',
  completed: 'green',
  failed: 'red',
  partial: 'orange',
};

const getExchangeStatusLabels = (): Record<string, string> => ({
  pending: t('dataExchange.exchangeStatusPending'),
  in_progress: t('dataExchange.exchangeStatusInProgress'),
  completed: t('dataExchange.exchangeStatusCompleted'),
  failed: t('dataExchange.exchangeStatusFailed'),
  partial: t('dataExchange.exchangeStatusPartial'),
});

const getDirectionLabels = (): Record<string, string> => ({
  import: t('dataExchange.directionImport'),
  export: t('dataExchange.directionExport'),
  bidirectional: t('dataExchange.directionBidirectional'),
});

const getEntityTypeLabels = (): Record<string, string> => ({
  contracts: t('dataExchange.onecEntityContracts'),
  invoices: t('dataExchange.onecEntityInvoices'),
  payments: t('dataExchange.onecEntityPayments'),
  materials: t('dataExchange.onecEntityMaterials'),
  employees: t('dataExchange.onecEntityEmployees'),
  cost_items: t('dataExchange.onecEntityCostItems'),
  organizations: t('dataExchange.onecEntityOrganizations'),
});

type TabId = 'all' | 'COMPLETED' | 'FAILED' | 'PARTIAL';

const getStatusFilterOptions = () => [
  { value: '', label: t('dataExchange.logFilterAllStatuses') },
  { value: 'PENDING', label: t('dataExchange.logFilterPending') },
  { value: 'IN_PROGRESS', label: t('dataExchange.logFilterInProgress') },
  { value: 'COMPLETED', label: t('dataExchange.logFilterCompleted') },
  { value: 'FAILED', label: t('dataExchange.logFilterFailed') },
  { value: 'PARTIAL', label: t('dataExchange.logFilterPartial') },
];


const OneCExchangeLogPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery<PaginatedResponse<OneCExchangeLog>>({
    queryKey: ['onec-exchange-logs'],
    queryFn: () => onecApi.getExchangeLogs(),
  });

  const logs = data?.content ?? [];

  const filtered = useMemo(() => {
    let result = logs;
    if (activeTab !== 'all') result = result.filter((l) => l.status === activeTab);
    if (search) {
      const lower = search.toLowerCase();
      result = result.filter(
        (l) => l.configName.toLowerCase().includes(lower) || l.triggeredByName.toLowerCase().includes(lower),
      );
    }
    return result;
  }, [logs, activeTab, search]);

  const tabCounts = useMemo(() => ({
    all: logs.length,
    completed: logs.filter((l) => l.status === 'COMPLETED').length,
    failed: logs.filter((l) => l.status === 'FAILED').length,
    partial: logs.filter((l) => l.status === 'PARTIAL').length,
  }), [logs]);

  const metrics = useMemo(() => {
    const totalRecords = logs.reduce((s, l) => s + l.totalRecords, 0);
    const totalErrors = logs.reduce((s, l) => s + l.errorCount, 0);
    const avgDuration = logs.length > 0 ? logs.reduce((s, l) => s + (l.duration ?? 0), 0) / logs.length : 0;
    return { total: logs.length, totalRecords, totalErrors, avgDuration };
  }, [logs]);

  const columns = useMemo<ColumnDef<OneCExchangeLog, unknown>[]>(
    () => [
      {
        accessorKey: 'startedAt',
        header: t('dataExchange.colTime'),
        size: 150,
        cell: ({ getValue }) => <span className="tabular-nums text-neutral-700 dark:text-neutral-300 text-xs">{formatDate(getValue<string>())}</span>,
      },
      {
        accessorKey: 'configName',
        header: t('dataExchange.colConnectionLog'),
        size: 200,
        cell: ({ getValue }) => <span className="font-medium text-neutral-900 dark:text-neutral-100">{getValue<string>()}</span>,
      },
      {
        accessorKey: 'status',
        header: t('dataExchange.colStatus'),
        size: 120,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={exchangeStatusColorMap}
            label={getExchangeStatusLabels()[getValue<string>()] ?? getValue<string>()}
          />
        ),
      },
      {
        accessorKey: 'direction',
        header: t('dataExchange.colDirectionLog'),
        size: 130,
        cell: ({ getValue }) => <span className="text-neutral-600 text-xs">{getDirectionLabels()[getValue<string>()] ?? getValue<string>()}</span>,
      },
      {
        accessorKey: 'entityType',
        header: t('dataExchange.colDataTypeLog'),
        size: 130,
        cell: ({ getValue }) => <span className="text-neutral-600">{getEntityTypeLabels()[getValue<string>()] ?? getValue<string>()}</span>,
      },
      {
        id: 'progress',
        header: t('dataExchange.colProcessed'),
        size: 120,
        cell: ({ row }) => (
          <span className="tabular-nums text-neutral-700 dark:text-neutral-300">{row.original.processedRecords}/{row.original.totalRecords}</span>
        ),
      },
      {
        accessorKey: 'errorCount',
        header: t('dataExchange.colErrors'),
        size: 80,
        cell: ({ getValue }) => {
          const val = getValue<number>();
          return <span className={`tabular-nums ${val > 0 ? 'text-danger-600 font-medium' : 'text-neutral-500 dark:text-neutral-400'}`}>{val}</span>;
        },
      },
      {
        accessorKey: 'duration',
        header: t('dataExchange.colDuration'),
        size: 100,
        cell: ({ getValue }) => {
          const val = getValue<number>();
          return val ? <span className="tabular-nums text-neutral-500 dark:text-neutral-400">{val} {t('dataExchange.secondsAbbrev')}</span> : <span className="text-neutral-400">---</span>;
        },
      },
      {
        accessorKey: 'triggeredByName',
        header: t('dataExchange.colInitiator'),
        size: 140,
        cell: ({ getValue }) => <span className="text-neutral-500 dark:text-neutral-400 text-xs">{getValue<string>()}</span>,
      },
    ],
    [],
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('dataExchange.exchangeLogTitle')}
        subtitle={t('dataExchange.exchangeLogSubtitle', { count: String(logs.length) })}
        breadcrumbs={[
          { label: t('dataExchange.breadcrumbHome'), href: '/' },
          { label: t('dataExchange.breadcrumbDataExchange'), href: '/data-exchange' },
          { label: t('dataExchange.breadcrumbExchangeLog') },
        ]}
        tabs={[
          { id: 'all', label: t('dataExchange.tabAll'), count: tabCounts.all },
          { id: 'COMPLETED', label: t('dataExchange.tabSuccessful'), count: tabCounts.completed },
          { id: 'FAILED', label: t('dataExchange.tabErrors'), count: tabCounts.failed },
          { id: 'PARTIAL', label: t('dataExchange.tabPartial'), count: tabCounts.partial },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as TabId)}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard icon={<ArrowUpDown size={18} />} label={t('dataExchange.metricTotalExchanges')} value={metrics.total} />
        <MetricCard icon={<Activity size={18} />} label={t('dataExchange.metricRecordsProcessed')} value={metrics.totalRecords} />
        <MetricCard
          icon={<XCircle size={18} />}
          label={t('dataExchange.metricErrors')}
          value={metrics.totalErrors}
          trend={{ direction: metrics.totalErrors > 0 ? 'down' : 'neutral', value: metrics.totalErrors > 0 ? t('dataExchange.trendNeedAttention') : t('dataExchange.trendNoErrors') }}
        />
        <MetricCard icon={<Clock size={18} />} label={t('dataExchange.metricAvgTime')} value={`${metrics.avgDuration.toFixed(0)} ${t('dataExchange.secondsAbbrev')}`} />
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input placeholder={t('dataExchange.searchLogPlaceholder')} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>

      <DataTable<OneCExchangeLog>
        data={filtered}
        columns={columns}
        loading={isLoading}
        enableColumnVisibility
        enableDensityToggle
        enableExport
        pageSize={20}
        emptyTitle={t('dataExchange.emptyLogTitle')}
        emptyDescription={t('dataExchange.emptyLogDescription')}
      />
    </div>
  );
};

export default OneCExchangeLogPage;
