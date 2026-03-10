import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { Search, Bell, AlertTriangle, CheckCircle, Eye } from 'lucide-react';
import { t } from '@/i18n';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { DataTable } from '@/design-system/components/DataTable';
import { MetricCard } from '@/design-system/components/MetricCard';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { Input, Select } from '@/design-system/components/FormField';
import { stockLimitsApi } from '@/api/stockLimits';
import { formatDate, formatNumber } from '@/lib/format';
import type { StockLimitAlert } from './types';
import toast from 'react-hot-toast';

const alertSeverityColorMap: Record<string, 'blue' | 'yellow' | 'red'> = {
  info: 'blue',
  warning: 'yellow',
  critical: 'red',
};

const alertSeverityLabels: Record<string, string> = {
  info: t('warehouse.stockAlerts.severityInfo'),
  warning: t('warehouse.stockAlerts.severityWarning'),
  critical: t('warehouse.stockAlerts.severityCritical'),
};

const alertStatusColorMap: Record<string, 'red' | 'yellow' | 'green'> = {
  active: 'red',
  acknowledged: 'yellow',
  resolved: 'green',
};

const alertStatusLabels: Record<string, string> = {
  active: t('warehouse.stockAlerts.statusActive'),
  acknowledged: t('warehouse.stockAlerts.statusAcknowledged'),
  resolved: t('warehouse.stockAlerts.statusResolved'),
};

const limitTypeLabels: Record<string, string> = {
  min: t('warehouse.stockAlerts.typeMin'),
  max: t('warehouse.stockAlerts.typeMax'),
  reorder_point: t('warehouse.stockAlerts.typeReorderPoint'),
  safety_stock: t('warehouse.stockAlerts.typeSafetyStock'),
};

const severityFilterOptions = [
  { value: '', label: t('warehouse.stockAlerts.allSeverities') },
  { value: 'INFO', label: t('warehouse.stockAlerts.severityInfo') },
  { value: 'WARNING', label: t('warehouse.stockAlerts.severityWarning') },
  { value: 'CRITICAL', label: t('warehouse.stockAlerts.severityCritical') },
];

const statusFilterOptions = [
  { value: '', label: t('warehouse.stockAlerts.allStatuses') },
  { value: 'ACTIVE', label: t('warehouse.stockAlerts.statusActive') },
  { value: 'ACKNOWLEDGED', label: t('warehouse.stockAlerts.statusAcknowledged') },
  { value: 'RESOLVED', label: t('warehouse.stockAlerts.statusResolved') },
];

type TabId = 'all' | 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED';

const StockAlertsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { data: alertsData, isLoading } = useQuery({
    queryKey: ['stock-alerts'],
    queryFn: () => stockLimitsApi.getAlerts(),
  });

  const acknowledgeMutation = useMutation({
    mutationFn: (id: string) => stockLimitsApi.acknowledgeAlert(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['stock-alerts'] }),
    onError: () => {
      toast.error(t('common.operationError'));
    },
  });

  const resolveMutation = useMutation({
    mutationFn: (id: string) => stockLimitsApi.resolveAlert(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['stock-alerts'] }),
    onError: () => {
      toast.error(t('common.operationError'));
    },
  });

  const alerts = alertsData?.content ?? [];

  const filteredAlerts = useMemo(() => {
    let filtered = alerts;

    if (activeTab !== 'all') {
      filtered = filtered.filter((a) => a.status === activeTab);
    }

    if (severityFilter) {
      filtered = filtered.filter((a) => a.severity === severityFilter);
    }

    if (statusFilter) {
      filtered = filtered.filter((a) => a.status === statusFilter);
    }

    if (search) {
      const lower = search.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.materialName.toLowerCase().includes(lower) ||
          a.locationName.toLowerCase().includes(lower) ||
          a.message.toLowerCase().includes(lower),
      );
    }

    return filtered;
  }, [alerts, activeTab, severityFilter, statusFilter, search]);

  const tabCounts = useMemo(() => ({
    all: alerts.length,
    active: alerts.filter((a) => a.status === 'ACTIVE').length,
    acknowledged: alerts.filter((a) => a.status === 'ACKNOWLEDGED').length,
    resolved: alerts.filter((a) => a.status === 'RESOLVED').length,
  }), [alerts]);

  const metrics = useMemo(() => {
    const active = alerts.filter((a) => a.status === 'ACTIVE').length;
    const critical = alerts.filter((a) => a.severity === 'CRITICAL' && a.status !== 'RESOLVED').length;
    const resolved = alerts.filter((a) => a.status === 'RESOLVED').length;
    return { total: alerts.length, active, critical, resolved };
  }, [alerts]);

  const columns = useMemo<ColumnDef<StockLimitAlert, unknown>[]>(
    () => [
      {
        accessorKey: 'severity',
        header: t('warehouse.stockAlerts.columnSeverity'),
        size: 130,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={alertSeverityColorMap}
            label={alertSeverityLabels[getValue<string>()] ?? getValue<string>()}
          />
        ),
      },
      {
        accessorKey: 'materialName',
        header: t('warehouse.stockAlerts.columnMaterial'),
        size: 220,
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-neutral-900 dark:text-neutral-100">{row.original.materialName}</p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{row.original.locationName}</p>
          </div>
        ),
      },
      {
        accessorKey: 'message',
        header: t('warehouse.stockAlerts.columnMessage'),
        size: 300,
        cell: ({ getValue }) => (
          <span className="text-neutral-700 dark:text-neutral-300 text-sm">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'limitType',
        header: t('warehouse.stockAlerts.columnLimitType'),
        size: 130,
        cell: ({ getValue }) => (
          <span className="text-neutral-600">{limitTypeLabels[getValue<string>()] ?? getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'status',
        header: t('warehouse.stockAlerts.columnStatus'),
        size: 110,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={alertStatusColorMap}
            label={alertStatusLabels[getValue<string>()] ?? getValue<string>()}
          />
        ),
      },
      {
        accessorKey: 'createdAt',
        header: t('warehouse.stockAlerts.columnDate'),
        size: 110,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-neutral-700 dark:text-neutral-300">{formatDate(getValue<string>())}</span>
        ),
      },
      {
        id: 'actions',
        header: '',
        size: 140,
        cell: ({ row }) => {
          if (row.original.status === 'ACTIVE') {
            return (
              <Button
                variant="secondary"
                size="xs"
                iconLeft={<Eye size={12} />}
                onClick={(e) => {
                  e.stopPropagation();
                  acknowledgeMutation.mutate(row.original.id);
                }}
              >
                {t('warehouse.stockAlerts.btnAcknowledge')}
              </Button>
            );
          }
          if (row.original.status === 'ACKNOWLEDGED') {
            return (
              <Button
                variant="primary"
                size="xs"
                iconLeft={<CheckCircle size={12} />}
                onClick={(e) => {
                  e.stopPropagation();
                  resolveMutation.mutate(row.original.id);
                }}
              >
                {t('warehouse.stockAlerts.btnResolve')}
              </Button>
            );
          }
          return (
            <span className="text-xs text-neutral-400">{t('warehouse.stockAlerts.statusResolved')}</span>
          );
        },
      },
    ],
    [acknowledgeMutation, resolveMutation],
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('warehouse.stockAlerts.title')}
        subtitle={t('warehouse.stockAlerts.subtitle', { count: alerts.length })}
        breadcrumbs={[
          { label: t('warehouse.stockAlerts.breadcrumbHome'), href: '/' },
          { label: t('warehouse.breadcrumbWarehouse') },
          { label: t('warehouse.stockAlerts.breadcrumbLimits'), href: '/warehouse/stock-limits' },
          { label: t('warehouse.stockAlerts.breadcrumbAlerts') },
        ]}
        tabs={[
          { id: 'all', label: t('warehouse.stockAlerts.tabAll'), count: tabCounts.all },
          { id: 'ACTIVE', label: t('warehouse.stockAlerts.tabActive'), count: tabCounts.active },
          { id: 'ACKNOWLEDGED', label: t('warehouse.stockAlerts.tabAcknowledged'), count: tabCounts.acknowledged },
          { id: 'RESOLVED', label: t('warehouse.stockAlerts.tabResolved'), count: tabCounts.resolved },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as TabId)}
      />

      {/* Metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard
          icon={<Bell size={18} />}
          label={t('warehouse.stockAlerts.metricTotal')}
          value={metrics.total}
        />
        <MetricCard
          icon={<AlertTriangle size={18} />}
          label={t('warehouse.stockAlerts.metricActive')}
          value={metrics.active}
          trend={metrics.active > 0 ? { direction: 'up', value: t('warehouse.stockAlerts.trendNeedAction') } : undefined}
        />
        <MetricCard
          icon={<AlertTriangle size={18} />}
          label={t('warehouse.stockAlerts.metricCritical')}
          value={metrics.critical}
          trend={metrics.critical > 0 ? { direction: 'down', value: t('warehouse.stockAlerts.trendUrgent') } : undefined}
        />
        <MetricCard
          icon={<CheckCircle size={18} />}
          label={t('warehouse.stockAlerts.metricResolved')}
          value={metrics.resolved}
        />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input
            placeholder={t('warehouse.stockAlerts.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          options={severityFilterOptions}
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value)}
          className="w-44"
        />
        <Select
          options={statusFilterOptions}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-40"
        />
      </div>

      {/* Table */}
      <DataTable<StockLimitAlert>
        data={filteredAlerts}
        columns={columns}
        loading={isLoading}
        enableRowSelection
        enableColumnVisibility
        enableDensityToggle
        enableExport
        pageSize={20}
        emptyTitle={t('warehouse.stockAlerts.emptyTitle')}
        emptyDescription={t('warehouse.stockAlerts.emptyDescription')}
      />
    </div>
  );
};

export default StockAlertsPage;
