import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { Plus, Search, Warehouse, MapPin, Package, BarChart3 } from 'lucide-react';
import { t } from '@/i18n';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { DataTable } from '@/design-system/components/DataTable';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { MetricCard } from '@/design-system/components/MetricCard';
import { Input, Select } from '@/design-system/components/FormField';
import { formatNumber, formatPercent } from '@/lib/format';
import { cn } from '@/lib/cn';
import { warehouseApi } from '@/api/warehouse';
import type { WarehouseLocation } from './types';

// ---------------------------------------------------------------------------
// Types & constants
// ---------------------------------------------------------------------------

const typeColorMap: Record<string, 'blue' | 'green' | 'orange' | 'gray'> = {
  warehouse: 'blue',
  site: 'green',
  zone: 'orange',
};

const typeLabels: Record<string, string> = {
  warehouse: t('warehouse.locations.typeWarehouse'),
  site: t('warehouse.locations.typeSite'),
  zone: t('warehouse.locations.typeZone'),
};

const statusColorMap: Record<string, 'green' | 'gray' | 'red'> = {
  active: 'green',
  inactive: 'gray',
  full: 'red',
};

const statusLabels: Record<string, string> = {
  active: t('warehouse.locations.statusActive'),
  inactive: t('warehouse.locations.statusInactive'),
  full: t('warehouse.locations.statusFull'),
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const WarehouseLocationsPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const { data: locData, isLoading } = useQuery({
    queryKey: ['warehouse-locations'],
    queryFn: () => warehouseApi.getLocations(),
  });

  const locations = locData?.content ?? [];

  const filtered = useMemo(() => {
    let result = locations;
    if (typeFilter) result = result.filter((l) => l.type === typeFilter);
    if (search) {
      const lower = search.toLowerCase();
      result = result.filter(
        (l) => l.code.toLowerCase().includes(lower) || l.name.toLowerCase().includes(lower) || l.responsible.toLowerCase().includes(lower),
      );
    }
    return result;
  }, [locations, search, typeFilter]);

  const totalCapacity = locations.reduce((s, l) => s + l.capacity, 0);
  const totalLoad = locations.reduce((s, l) => s + l.currentLoad, 0);
  const activeCount = locations.filter((l) => l.status === 'ACTIVE').length;
  const totalLoadPercent = totalCapacity > 0 ? (totalLoad / totalCapacity) * 100 : 0;

  const columns = useMemo<ColumnDef<WarehouseLocation, unknown>[]>(() => [
    { accessorKey: 'code', header: t('warehouse.locations.columnCode'), size: 90, cell: ({ getValue }) => <span className="font-mono text-xs text-neutral-500 dark:text-neutral-400">{getValue<string>()}</span> },
    {
      accessorKey: 'name',
      header: t('warehouse.locations.columnName'),
      size: 220,
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-neutral-900 dark:text-neutral-100">{row.original.name}</p>
          {row.original.projectName && <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{row.original.projectName}</p>}
        </div>
      ),
    },
    { accessorKey: 'type', header: t('warehouse.locations.columnType'), size: 110, cell: ({ getValue }) => <StatusBadge status={getValue<string>()} colorMap={typeColorMap} label={typeLabels[getValue<string>()] ?? getValue<string>()} /> },
    {
      accessorKey: 'loadPercent',
      header: t('warehouse.locations.columnLoad'),
      size: 140,
      cell: ({ row }) => {
        const pct = row.original.loadPercent;
        return (
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
              <div
                className={cn('h-full rounded-full', pct >= 90 ? 'bg-danger-500' : pct >= 70 ? 'bg-warning-500' : 'bg-success-500')}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-xs tabular-nums font-medium w-8 text-right">{pct}%</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'capacity',
      header: t('warehouse.locations.columnCapacity'),
      size: 100,
      cell: ({ row }) => <span className="tabular-nums text-neutral-600">{formatNumber(row.original.currentLoad)} / {formatNumber(row.original.capacity)}</span>,
    },
    { accessorKey: 'materialsCount', header: t('warehouse.locations.columnMaterials'), size: 100, cell: ({ getValue }) => <span className="tabular-nums">{getValue<number>()}</span> },
    { accessorKey: 'responsible', header: t('warehouse.locations.columnResponsible'), size: 150 },
    { accessorKey: 'status', header: t('warehouse.locations.columnStatus'), size: 110, cell: ({ getValue }) => <StatusBadge status={getValue<string>()} colorMap={statusColorMap} label={statusLabels[getValue<string>()] ?? getValue<string>()} /> },
  ], []);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('warehouse.locations.title')}
        subtitle={t('warehouse.locations.subtitle')}
        breadcrumbs={[{ label: t('warehouse.locations.breadcrumbHome'), href: '/' }, { label: t('warehouse.breadcrumbWarehouse'), href: '/warehouse/materials' }, { label: t('warehouse.locations.breadcrumbLocations') }]}
        actions={<Button iconLeft={<Plus size={16} />}>{t('warehouse.locations.createLocation')}</Button>}
      />

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard icon={<Warehouse size={18} />} label={t('warehouse.locations.metricTotal')} value={locations.length} />
        <MetricCard icon={<MapPin size={18} />} label={t('warehouse.locations.metricActive')} value={activeCount} />
        <MetricCard icon={<Package size={18} />} label={t('warehouse.locations.metricLoad')} value={formatPercent(totalLoadPercent)} />
        <MetricCard icon={<BarChart3 size={18} />} label={t('warehouse.locations.metricCapacity')} value={`${formatNumber(totalLoad)} / ${formatNumber(totalCapacity)}`} />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input placeholder={t('warehouse.locations.searchPlaceholder')} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select
          options={[{ value: '', label: t('warehouse.locations.allTypes') }, ...Object.entries(typeLabels).map(([v, l]) => ({ value: v, label: l }))]}
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="w-40"
        />
      </div>

      <DataTable<WarehouseLocation>
        data={filtered}
        columns={columns}
        loading={isLoading}
        enableRowSelection
        enableColumnVisibility
        enableExport
        pageSize={20}
        emptyTitle={t('warehouse.locations.emptyTitle')}
        emptyDescription={t('warehouse.locations.emptyDescription')}
      />
    </div>
  );
};

export default WarehouseLocationsPage;
