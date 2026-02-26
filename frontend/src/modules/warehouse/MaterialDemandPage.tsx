import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import {
  Calculator,
  Search,
  ShoppingCart,
  AlertTriangle,
  CheckCircle,
  Package,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { t } from '@/i18n';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { DataTable } from '@/design-system/components/DataTable';
import { MetricCard } from '@/design-system/components/MetricCard';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { Input, Select } from '@/design-system/components/FormField';
import { warehouseApi } from '@/api/warehouse';
import { formatNumber } from '@/lib/format';
import type { MaterialDemand } from './types';

const demandStatusColorMap: Record<string, 'green' | 'yellow' | 'red'> = {
  sufficient: 'green',
  low: 'yellow',
  deficit: 'red',
};

const demandStatusLabels: Record<string, string> = {
  get sufficient() { return t('warehouse.materialDemand.statusSufficient'); },
  get low() { return t('warehouse.materialDemand.statusLow'); },
  get deficit() { return t('warehouse.materialDemand.statusDeficit'); },
};

const projectOptions = [
  { value: 'p1', label: 'ЖК Солнечный' },
  { value: 'p2', label: 'БЦ Кристалл' },
  { value: 'p3', label: 'ТЦ Метрополис' },
];

type TabId = 'all' | 'deficit' | 'low' | 'sufficient';

const MaterialDemandPage: React.FC = () => {
  const [projectId, setProjectId] = useState('p1');
  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [search, setSearch] = useState('');

  const { data: demands, isLoading } = useQuery({
    queryKey: ['material-demand', projectId],
    queryFn: () => warehouseApi.calculateDemand(projectId),
  });

  const items = demands ?? [];

  const filtered = useMemo(() => {
    let result = items;
    if (activeTab !== 'all') result = result.filter((d) => d.status === activeTab);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((d) => d.materialName.toLowerCase().includes(q));
    }
    return result;
  }, [items, activeTab, search]);

  const tabCounts = useMemo(
    () => ({
      all: items.length,
      deficit: items.filter((d) => d.status === 'deficit').length,
      low: items.filter((d) => d.status === 'low').length,
      sufficient: items.filter((d) => d.status === 'sufficient').length,
    }),
    [items],
  );

  const metrics = useMemo(() => ({
    total: items.length,
    deficitCount: tabCounts.deficit,
    lowCount: tabCounts.low,
    sufficientCount: tabCounts.sufficient,
  }), [items, tabCounts]);

  const columns = useMemo<ColumnDef<MaterialDemand, unknown>[]>(
    () => [
      {
        accessorKey: 'materialName',
        header: t('warehouse.materialDemand.columnMaterial'),
        size: 260,
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-neutral-900 dark:text-neutral-100">
              {row.original.materialName}
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">{row.original.unit}</p>
          </div>
        ),
      },
      {
        accessorKey: 'requiredQty',
        header: t('warehouse.materialDemand.columnRequired'),
        size: 120,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-neutral-700 dark:text-neutral-300">
            {formatNumber(getValue<number>())}
          </span>
        ),
      },
      {
        accessorKey: 'inStockQty',
        header: t('warehouse.materialDemand.columnInStock'),
        size: 120,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-neutral-700 dark:text-neutral-300">
            {formatNumber(getValue<number>())}
          </span>
        ),
      },
      {
        accessorKey: 'deficit',
        header: t('warehouse.materialDemand.columnDeficit'),
        size: 120,
        cell: ({ row }) => {
          const d = row.original.deficit;
          if (d <= 0) {
            return <span className="tabular-nums text-success-600">0</span>;
          }
          return (
            <span className="tabular-nums font-medium text-danger-600">
              -{formatNumber(d)}
            </span>
          );
        },
      },
      {
        accessorKey: 'status',
        header: t('warehouse.materialDemand.columnStatus'),
        size: 140,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={demandStatusColorMap}
            label={demandStatusLabels[getValue<string>()] ?? getValue<string>()}
          />
        ),
      },
      {
        id: 'orderSuggested',
        header: t('warehouse.materialDemand.columnOrderSuggested'),
        size: 130,
        cell: ({ row }) => {
          const d = row.original;
          if (d.status === 'sufficient') {
            return <span className="text-neutral-400 text-sm">---</span>;
          }
          return (
            <span className="tabular-nums font-medium text-primary-600 dark:text-primary-400">
              {formatNumber(d.deficit > 0 ? d.deficit : Math.ceil(d.requiredQty * 0.2))}
            </span>
          );
        },
      },
    ],
    [],
  );

  const handleGeneratePurchaseRequest = () => {
    toast.success(t('warehouse.materialDemand.purchaseRequestToast'));
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('warehouse.materialDemand.title')}
        subtitle={t('warehouse.materialDemand.subtitle')}
        breadcrumbs={[
          { label: t('warehouse.breadcrumbHome'), href: '/' },
          { label: t('warehouse.breadcrumbWarehouse'), href: '/warehouse/materials' },
          { label: t('warehouse.materialDemand.breadcrumb') },
        ]}
        actions={
          <Button
            iconLeft={<ShoppingCart size={16} />}
            onClick={handleGeneratePurchaseRequest}
            disabled={metrics.deficitCount === 0}
          >
            {t('warehouse.materialDemand.generatePurchaseBtn')}
          </Button>
        }
        tabs={[
          { id: 'all', label: t('warehouse.materialDemand.tabAll'), count: tabCounts.all },
          { id: 'deficit', label: t('warehouse.materialDemand.tabDeficit'), count: tabCounts.deficit },
          { id: 'low', label: t('warehouse.materialDemand.tabLow'), count: tabCounts.low },
          { id: 'sufficient', label: t('warehouse.materialDemand.tabSufficient'), count: tabCounts.sufficient },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as TabId)}
      />

      {/* Metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard
          icon={<Package size={18} />}
          label={t('warehouse.materialDemand.metricTotal')}
          value={metrics.total}
        />
        <MetricCard
          icon={<AlertTriangle size={18} />}
          label={t('warehouse.materialDemand.metricDeficit')}
          value={metrics.deficitCount}
          trend={
            metrics.deficitCount > 0
              ? { direction: 'down', value: t('warehouse.materialDemand.trendNeedOrder') }
              : { direction: 'neutral', value: t('warehouse.materialDemand.trendAllGood') }
          }
        />
        <MetricCard
          icon={<Calculator size={18} />}
          label={t('warehouse.materialDemand.metricLow')}
          value={metrics.lowCount}
        />
        <MetricCard
          icon={<CheckCircle size={18} />}
          label={t('warehouse.materialDemand.metricSufficient')}
          value={metrics.sufficientCount}
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <Select
          options={projectOptions}
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          className="w-56"
        />
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input
            placeholder={t('warehouse.materialDemand.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Table */}
      <DataTable<MaterialDemand>
        data={filtered}
        columns={columns}
        loading={isLoading}
        enableRowSelection
        enableColumnVisibility
        enableDensityToggle
        enableExport
        pageSize={30}
        emptyTitle={t('warehouse.materialDemand.emptyTitle')}
        emptyDescription={t('warehouse.materialDemand.emptyDescription')}
      />
    </div>
  );
};

export default MaterialDemandPage;
