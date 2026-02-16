import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { Package, Wallet, AlertTriangle, Search } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { MetricCard } from '@/design-system/components/MetricCard';
import { DataTable } from '@/design-system/components/DataTable';
import { Input } from '@/design-system/components/FormField';
import { warehouseApi } from '@/api/warehouse';
import { formatMoney, formatNumber } from '@/lib/format';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';
import type { StockEntry } from '@/types';

const LOW_STOCK_THRESHOLD = 0;

const StockPage: React.FC = () => {
  const [search, setSearch] = useState('');

  const { data: stockData, isLoading } = useQuery({
    queryKey: ['stock'],
    queryFn: () => warehouseApi.getStock(),
  });

  const stock = stockData?.content ?? [];

  const filteredStock = useMemo(() => {
    if (!search) return stock;
    const lower = search.toLowerCase();
    return stock.filter(
      (s) =>
        s.materialName.toLowerCase().includes(lower) ||
        s.locationName.toLowerCase().includes(lower),
    );
  }, [stock, search]);

  const totalPositions = stock.length;
  const totalValue = useMemo(() => stock.reduce((s, e) => s + e.totalValue, 0), [stock]);
  const lowStockCount = useMemo(() => stock.filter((s) => s.availableQuantity <= LOW_STOCK_THRESHOLD).length, [stock]);

  const columns = useMemo<ColumnDef<StockEntry, unknown>[]>(
    () => [
      {
        accessorKey: 'materialName',
        header: t('warehouse.stock.columnMaterial'),
        size: 240,
        cell: ({ getValue }) => (
          <span className="font-medium text-neutral-900 dark:text-neutral-100">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'locationName',
        header: t('warehouse.stock.columnWarehouse'),
        size: 180,
        cell: ({ getValue }) => (
          <span className="text-neutral-600">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'quantity',
        header: t('warehouse.stock.columnQuantity'),
        size: 120,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-right block">{formatNumber(getValue<number>())}</span>
        ),
      },
      {
        accessorKey: 'reservedQuantity',
        header: t('warehouse.stock.columnReserved'),
        size: 130,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-right block text-warning-600">{formatNumber(getValue<number>())}</span>
        ),
      },
      {
        accessorKey: 'availableQuantity',
        header: t('warehouse.stock.columnAvailable'),
        size: 120,
        cell: ({ row }) => {
          const available = row.original.availableQuantity;
          return (
            <span className={cn(
              'font-medium tabular-nums text-right block',
              available <= LOW_STOCK_THRESHOLD ? 'text-danger-600' : 'text-success-600',
            )}>
              {formatNumber(available)}
            </span>
          );
        },
      },
      {
        accessorKey: 'totalValue',
        header: t('warehouse.stock.columnValue'),
        size: 160,
        cell: ({ getValue }) => (
          <span className="font-medium tabular-nums text-right block">
            {formatMoney(getValue<number>())}
          </span>
        ),
      },
    ],
    [],
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('warehouse.stock.title')}
        subtitle={t('warehouse.stock.subtitle')}
        breadcrumbs={[
          { label: t('warehouse.stock.breadcrumbHome'), href: '/' },
          { label: t('warehouse.breadcrumbWarehouse') },
          { label: t('warehouse.stock.breadcrumbStock') },
        ]}
      />

      {/* Metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <MetricCard
          icon={<Package size={18} />}
          label={t('warehouse.stock.metricTotalPositions')}
          value={String(totalPositions)}
        />
        <MetricCard
          icon={<Wallet size={18} />}
          label={t('warehouse.stock.metricTotalValue')}
          value={formatMoney(totalValue)}
        />
        <MetricCard
          icon={<AlertTriangle size={18} />}
          label={t('warehouse.stock.metricBelowMinimum')}
          value={String(lowStockCount)}
          trend={lowStockCount > 0 ? { direction: 'down', value: t('warehouse.stock.metricBelowMinimumTrend', { count: lowStockCount }) } : undefined}
        />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input
            placeholder={t('warehouse.stock.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Table */}
      <DataTable<StockEntry>
        data={filteredStock}
        columns={columns}
        loading={isLoading}
        enableColumnVisibility
        enableDensityToggle
        enableExport
        pageSize={20}
        emptyTitle={t('warehouse.stock.emptyTitle')}
        emptyDescription={t('warehouse.stock.emptyDescription')}
      />
    </div>
  );
};

export default StockPage;
