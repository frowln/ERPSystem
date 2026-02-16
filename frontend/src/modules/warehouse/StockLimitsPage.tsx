import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { Plus, Search, Gauge, AlertTriangle, CheckCircle, TrendingDown } from 'lucide-react';
import { t } from '@/i18n';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { DataTable } from '@/design-system/components/DataTable';
import { MetricCard } from '@/design-system/components/MetricCard';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { Input, Select } from '@/design-system/components/FormField';
import { stockLimitsApi } from '@/api/stockLimits';
import { formatNumber } from '@/lib/format';
import type { StockLimit } from './types';

const limitTypeColorMap: Record<string, 'red' | 'orange' | 'blue' | 'green'> = {
  min: 'red',
  max: 'orange',
  reorder_point: 'blue',
  safety_stock: 'green',
};

const limitTypeLabels: Record<string, string> = {
  min: t('warehouse.stockLimits.typeMin'),
  max: t('warehouse.stockLimits.typeMax'),
  reorder_point: t('warehouse.stockLimits.typeReorderPoint'),
  safety_stock: t('warehouse.stockLimits.typeSafetyStock'),
};

const breachedColorMap: Record<string, 'red' | 'green'> = {
  true: 'red',
  false: 'green',
};

const breachedLabels: Record<string, string> = {
  true: t('warehouse.stockLimits.breached'),
  false: t('warehouse.stockLimits.normal'),
};

const limitTypeFilterOptions = [
  { value: '', label: t('warehouse.stockLimits.allTypes') },
  { value: 'MIN', label: t('warehouse.stockLimits.typeMin') },
  { value: 'MAX', label: t('warehouse.stockLimits.typeMax') },
  { value: 'REORDER_POINT', label: t('warehouse.stockLimits.typeReorderPoint') },
  { value: 'SAFETY_STOCK', label: t('warehouse.stockLimits.typeSafetyStock') },
];

const breachedFilterOptions = [
  { value: '', label: t('warehouse.stockLimits.allStates') },
  { value: 'true', label: t('warehouse.stockLimits.filterBreached') },
  { value: 'false', label: t('warehouse.stockLimits.filterNormal') },
];

type TabId = 'all' | 'BREACHED' | 'NORMAL';

const StockLimitsPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [search, setSearch] = useState('');
  const [limitTypeFilter, setLimitTypeFilter] = useState('');
  const [breachedFilter, setBreachedFilter] = useState('');

  const { data: limitsData, isLoading } = useQuery({
    queryKey: ['stock-limits'],
    queryFn: () => stockLimitsApi.getLimits(),
  });

  const limits = limitsData?.content ?? [];

  const filteredLimits = useMemo(() => {
    let filtered = limits;

    if (activeTab === 'BREACHED') {
      filtered = filtered.filter((l) => l.isBreached);
    } else if (activeTab === 'NORMAL') {
      filtered = filtered.filter((l) => !l.isBreached);
    }

    if (limitTypeFilter) {
      filtered = filtered.filter((l) => l.limitType === limitTypeFilter);
    }

    if (breachedFilter) {
      filtered = filtered.filter((l) => String(l.isBreached) === breachedFilter);
    }

    if (search) {
      const lower = search.toLowerCase();
      filtered = filtered.filter(
        (l) =>
          l.materialName.toLowerCase().includes(lower) ||
          l.locationName.toLowerCase().includes(lower),
      );
    }

    return filtered;
  }, [limits, activeTab, limitTypeFilter, breachedFilter, search]);

  const tabCounts = useMemo(() => ({
    all: limits.length,
    breached: limits.filter((l) => l.isBreached).length,
    normal: limits.filter((l) => !l.isBreached).length,
  }), [limits]);

  const metrics = useMemo(() => {
    const breached = limits.filter((l) => l.isBreached).length;
    const normal = limits.filter((l) => !l.isBreached).length;
    return { total: limits.length, breached, normal };
  }, [limits]);

  const columns = useMemo<ColumnDef<StockLimit, unknown>[]>(
    () => [
      {
        accessorKey: 'materialName',
        header: t('warehouse.stockLimits.columnMaterial'),
        size: 240,
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-neutral-900 dark:text-neutral-100">{row.original.materialName}</p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{row.original.locationName}</p>
          </div>
        ),
      },
      {
        accessorKey: 'limitType',
        header: t('warehouse.stockLimits.columnLimitType'),
        size: 140,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={limitTypeColorMap}
            label={limitTypeLabels[getValue<string>()] ?? getValue<string>()}
          />
        ),
      },
      {
        accessorKey: 'limitValue',
        header: t('warehouse.stockLimits.columnLimit'),
        size: 120,
        cell: ({ row }) => (
          <span className="tabular-nums text-neutral-700 dark:text-neutral-300">
            {formatNumber(row.original.limitValue)} {row.original.unitOfMeasure}
          </span>
        ),
      },
      {
        accessorKey: 'currentStock',
        header: t('warehouse.stockLimits.columnCurrentStock'),
        size: 140,
        cell: ({ row }) => (
          <span className={`font-medium tabular-nums ${row.original.isBreached ? 'text-danger-600' : 'text-success-600'}`}>
            {formatNumber(row.original.currentStock)} {row.original.unitOfMeasure}
          </span>
        ),
      },
      {
        accessorKey: 'isBreached',
        header: t('warehouse.stockLimits.columnState'),
        size: 120,
        cell: ({ getValue }) => (
          <StatusBadge
            status={String(getValue<boolean>())}
            colorMap={breachedColorMap}
            label={breachedLabels[String(getValue<boolean>())]}
          />
        ),
      },
      {
        accessorKey: 'projectName',
        header: t('warehouse.stockLimits.columnProject'),
        size: 180,
        cell: ({ getValue }) => (
          <span className="text-neutral-600">{getValue<string>() ?? '---'}</span>
        ),
      },
    ],
    [],
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('warehouse.stockLimits.title')}
        subtitle={t('warehouse.stockLimits.subtitle', { count: limits.length })}
        breadcrumbs={[
          { label: t('warehouse.stockLimits.breadcrumbHome'), href: '/' },
          { label: t('warehouse.breadcrumbWarehouse') },
          { label: t('warehouse.stockLimits.breadcrumbLimits') },
        ]}
        actions={
          <div className="flex gap-2">
            <Button variant="secondary" iconLeft={<AlertTriangle size={16} />} onClick={() => navigate('/warehouse/stock-alerts')}>
              {t('warehouse.stockLimits.btnAlerts')}
            </Button>
            <Button iconLeft={<Plus size={16} />}>
              {t('warehouse.stockLimits.newLimit')}
            </Button>
          </div>
        }
        tabs={[
          { id: 'all', label: t('warehouse.stockLimits.tabAll'), count: tabCounts.all },
          { id: 'BREACHED', label: t('warehouse.stockLimits.tabBreached'), count: tabCounts.breached },
          { id: 'NORMAL', label: t('warehouse.stockLimits.tabNormal'), count: tabCounts.normal },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as TabId)}
      />

      {/* Metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <MetricCard
          icon={<Gauge size={18} />}
          label={t('warehouse.stockLimits.metricTotal')}
          value={metrics.total}
        />
        <MetricCard
          icon={<AlertTriangle size={18} />}
          label={t('warehouse.stockLimits.metricBreached')}
          value={metrics.breached}
          trend={metrics.breached > 0 ? { direction: 'down', value: t('warehouse.stockLimits.trendNeedAttention') } : { direction: 'neutral', value: t('warehouse.stockLimits.trendAllNormal') }}
        />
        <MetricCard
          icon={<CheckCircle size={18} />}
          label={t('warehouse.stockLimits.metricNormal')}
          value={metrics.normal}
        />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input
            placeholder={t('warehouse.stockLimits.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          options={limitTypeFilterOptions}
          value={limitTypeFilter}
          onChange={(e) => setLimitTypeFilter(e.target.value)}
          className="w-44"
        />
        <Select
          options={breachedFilterOptions}
          value={breachedFilter}
          onChange={(e) => setBreachedFilter(e.target.value)}
          className="w-40"
        />
      </div>

      {/* Table */}
      <DataTable<StockLimit>
        data={filteredLimits}
        columns={columns}
        loading={isLoading}
        enableRowSelection
        enableColumnVisibility
        enableDensityToggle
        enableExport
        pageSize={20}
        emptyTitle={t('warehouse.stockLimits.emptyTitle')}
        emptyDescription={t('warehouse.stockLimits.emptyDescription')}
      />
    </div>
  );
};

export default StockLimitsPage;
