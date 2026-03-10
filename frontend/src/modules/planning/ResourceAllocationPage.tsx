import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { Search, Users, Wrench, Package } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { DataTable } from '@/design-system/components/DataTable';
import { MetricCard } from '@/design-system/components/MetricCard';
import { Input, Select } from '@/design-system/components/FormField';
import { formatMoney } from '@/lib/format';
import { cn } from '@/lib/cn';
import { planningApi } from '@/api/planning';
import { t } from '@/i18n';
import type { ResourceAllocation } from './types';

const getResourceTypeLabels = (): Record<string, string> => ({
  LABOR: t('planning.resources.typeLabor'),
  EQUIPMENT: t('planning.resources.typeEquipment'),
  MATERIAL: t('planning.resources.typeMaterial'),
});


const ResourceAllocationPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const { data, isLoading } = useQuery<ResourceAllocation[]>({
    queryKey: ['resource-allocations', typeFilter],
    queryFn: () => planningApi.getResourceAllocations(typeFilter ? { resourceType: typeFilter } : undefined),
  });

  const allocations = data ?? [];

  const filtered = useMemo(() => {
    let result = allocations;
    if (typeFilter) result = result.filter((r) => r.resourceType === typeFilter);
    if (search) {
      const lower = search.toLowerCase();
      result = result.filter(
        (r) =>
          r.resourceName.toLowerCase().includes(lower) ||
          r.wbsName.toLowerCase().includes(lower) ||
          r.wbsCode.toLowerCase().includes(lower),
      );
    }
    return result;
  }, [allocations, typeFilter, search]);

  const avgUtilization = allocations.length > 0
    ? Math.round(allocations.reduce((s, r) => s + r.utilization, 0) / allocations.length)
    : 0;

  const totalPlannedCost = allocations.reduce((s, r) => s + r.plannedCost, 0);
  const totalActualCost = allocations.reduce((s, r) => s + r.actualCost, 0);

  const columns = useMemo<ColumnDef<ResourceAllocation, unknown>[]>(
    () => {
      const resourceTypeLabels = getResourceTypeLabels();
      return [
        {
          accessorKey: 'wbsCode',
          header: t('planning.resources.colWbsCode'),
          size: 100,
          cell: ({ getValue }) => (
            <span className="font-mono text-xs text-neutral-500 dark:text-neutral-400">{getValue<string>()}</span>
          ),
        },
        {
          accessorKey: 'wbsName',
          header: t('planning.resources.colWbsElement'),
          size: 220,
          cell: ({ getValue }) => (
            <span className="font-medium text-neutral-900 dark:text-neutral-100">{getValue<string>()}</span>
          ),
        },
        {
          accessorKey: 'resourceName',
          header: t('planning.resources.colResource'),
          size: 220,
          cell: ({ getValue }) => (
            <span className="text-neutral-700 dark:text-neutral-300">{getValue<string>()}</span>
          ),
        },
        {
          accessorKey: 'resourceType',
          header: t('planning.resources.colType'),
          size: 130,
          cell: ({ getValue }) => {
            const rt = getValue<string>();
            const icon = rt === 'LABOR' ? <Users size={13} /> : rt === 'EQUIPMENT' ? <Wrench size={13} /> : <Package size={13} />;
            return (
              <div className="flex items-center gap-1.5 text-neutral-600">
                {icon}
                <span className="text-xs">{resourceTypeLabels[rt]}</span>
              </div>
            );
          },
        },
        {
          accessorKey: 'plannedHours',
          header: t('planning.resources.colPlannedHours'),
          size: 100,
          cell: ({ getValue }) => {
            const v = getValue<number>();
            return v > 0 ? <span className="tabular-nums text-neutral-600">{v}</span> : <span className="text-neutral-400">---</span>;
          },
        },
        {
          accessorKey: 'actualHours',
          header: t('planning.resources.colActualHours'),
          size: 100,
          cell: ({ getValue }) => {
            const v = getValue<number>();
            return v > 0 ? <span className="tabular-nums text-neutral-600">{v}</span> : <span className="text-neutral-400">---</span>;
          },
        },
        {
          accessorKey: 'utilization',
          header: t('planning.resources.colUtilization'),
          size: 150,
          cell: ({ getValue }) => {
            const val = getValue<number>();
            return (
              <div className="flex items-center gap-2">
                <div className="w-16 h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full',
                      val >= 80 ? 'bg-success-500' : val >= 50 ? 'bg-warning-500' : 'bg-danger-400',
                    )}
                    style={{ width: `${val}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-neutral-600 tabular-nums">{val}%</span>
              </div>
            );
          },
        },
        {
          accessorKey: 'plannedCost',
          header: t('planning.resources.colPlannedCost'),
          size: 150,
          cell: ({ getValue }) => (
            <span className="tabular-nums text-right block">{formatMoney(getValue<number>())}</span>
          ),
        },
        {
          accessorKey: 'actualCost',
          header: t('planning.resources.colActualCost'),
          size: 150,
          cell: ({ getValue }) => (
            <span className="tabular-nums text-right block">{formatMoney(getValue<number>())}</span>
          ),
        },
      ];
    },
    [],
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('planning.resources.title')}
        subtitle={t('planning.resources.subtitle')}
        breadcrumbs={[
          { label: t('planning.resources.breadcrumbHome'), href: '/' },
          { label: t('planning.resources.breadcrumbPlanning') },
          { label: t('planning.resources.breadcrumbResources') },
        ]}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard icon={<Users size={18} />} label={t('planning.resources.totalResources')} value={allocations.length} />
        <MetricCard label={t('planning.resources.avgUtilization')} value={`${avgUtilization}%`} trend={{ direction: avgUtilization >= 70 ? 'up' : 'down', value: avgUtilization >= 70 ? t('planning.resources.normal') : t('planning.resources.underloaded') }} />
        <MetricCard label={t('planning.resources.plannedCost')} value={formatMoney(totalPlannedCost)} />
        <MetricCard label={t('planning.resources.actualCost')} value={formatMoney(totalActualCost)} />
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input
            placeholder={t('planning.resources.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          options={[
            { value: '', label: t('planning.resources.allTypes') },
            ...Object.entries(getResourceTypeLabels()).map(([v, l]) => ({ value: v, label: l })),
          ]}
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="w-48"
        />
      </div>

      <DataTable<ResourceAllocation>
        data={filtered}
        columns={columns}
        loading={isLoading}
        enableColumnVisibility
        enableExport
        enableDensityToggle
        pageSize={20}
        emptyTitle={t('planning.resources.emptyTitle')}
        emptyDescription={t('planning.resources.emptyDescription')}
      />
    </div>
  );
};

export default ResourceAllocationPage;
