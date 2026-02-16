import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { Plus, Search, Route, MapPin, Truck } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { DataTable } from '@/design-system/components/DataTable';
import { MetricCard } from '@/design-system/components/MetricCard';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { Input, Select } from '@/design-system/components/FormField';
import { dispatchApi } from '@/api/dispatch';
import { formatNumber } from '@/lib/format';
import { t } from '@/i18n';
import type { DispatchRoute } from './types';
import type { PaginatedResponse } from '@/types';

const routeActiveColorMap: Record<string, 'green' | 'gray'> = {
  true: 'green',
  false: 'gray',
};

const getRouteActiveLabels = (): Record<string, string> => ({
  true: t('dispatch.routes.statusActive'),
  false: t('dispatch.routes.statusInactive'),
});

const getActiveFilterOptions = () => [
  { value: '', label: t('dispatch.routes.allRoutes') },
  { value: 'true', label: t('dispatch.routes.filterActive') },
  { value: 'false', label: t('dispatch.routes.filterInactive') },
];


const DispatchRouteListPage: React.FC = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('');

  const { data: routesData, isLoading } = useQuery<PaginatedResponse<DispatchRoute>>({
    queryKey: ['dispatch-routes'],
    queryFn: () => dispatchApi.getRoutes(),
  });

  const routes = routesData?.content ?? [];

  const filteredRoutes = useMemo(() => {
    let filtered = routes;

    if (activeFilter === 'true') {
      filtered = filtered.filter((r) => r.isActive);
    } else if (activeFilter === 'false') {
      filtered = filtered.filter((r) => !r.isActive);
    }

    if (search) {
      const lower = search.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.name.toLowerCase().includes(lower) ||
          r.code.toLowerCase().includes(lower) ||
          r.originLocation.toLowerCase().includes(lower) ||
          r.destinationLocation.toLowerCase().includes(lower),
      );
    }

    return filtered;
  }, [routes, activeFilter, search]);

  const activeCount = useMemo(() => routes.filter((r) => r.isActive).length, [routes]);
  const totalDistance = useMemo(() => routes.reduce((s, r) => s + r.distance, 0), [routes]);
  const totalActiveOrders = useMemo(() => routes.reduce((s, r) => s + r.activeOrderCount, 0), [routes]);

  const routeActiveLabels = getRouteActiveLabels();

  const columns = useMemo<ColumnDef<DispatchRoute, unknown>[]>(
    () => [
      {
        accessorKey: 'code',
        header: t('dispatch.routes.colCode'),
        size: 90,
        cell: ({ getValue }) => (
          <span className="font-mono text-neutral-500 dark:text-neutral-400 text-xs">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'name',
        header: t('dispatch.routes.colName'),
        size: 250,
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-neutral-900 dark:text-neutral-100">{row.original.name}</p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{row.original.projectName ?? '---'}</p>
          </div>
        ),
      },
      {
        accessorKey: 'originLocation',
        header: t('dispatch.routes.colRoute'),
        size: 220,
        cell: ({ row }) => (
          <div className="text-xs">
            <p className="text-neutral-600">{row.original.originLocation}</p>
            <p className="text-neutral-400 my-0.5">&#8595;</p>
            <p className="text-neutral-800 dark:text-neutral-200 font-medium">{row.original.destinationLocation}</p>
          </div>
        ),
      },
      {
        accessorKey: 'isActive',
        header: t('dispatch.routes.colStatus'),
        size: 110,
        cell: ({ getValue }) => (
          <StatusBadge
            status={String(getValue<boolean>())}
            colorMap={routeActiveColorMap}
            label={routeActiveLabels[String(getValue<boolean>())]}
          />
        ),
      },
      {
        accessorKey: 'distance',
        header: t('dispatch.routes.colDistance'),
        size: 110,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-neutral-700 dark:text-neutral-300">{formatNumber(getValue<number>())} {t('dispatch.routes.kmUnit')}</span>
        ),
      },
      {
        accessorKey: 'estimatedDuration',
        header: t('dispatch.routes.colTime'),
        size: 100,
        cell: ({ getValue }) => {
          const minutes = getValue<number>();
          const hours = Math.floor(minutes / 60);
          const mins = minutes % 60;
          return (
            <span className="tabular-nums text-neutral-700 dark:text-neutral-300">
              {hours > 0 ? `${hours} ${t('dispatch.routes.hourUnit')} ` : ''}{mins} {t('dispatch.routes.minUnit')}
            </span>
          );
        },
      },
      {
        accessorKey: 'activeOrderCount',
        header: t('dispatch.routes.colOrders'),
        size: 90,
        cell: ({ getValue }) => {
          const count = getValue<number>();
          return (
            <span className={count > 0 ? 'font-medium text-primary-600' : 'text-neutral-400'}>
              {count}
            </span>
          );
        },
      },
    ],
    [routeActiveLabels],
  );

  const handleRowClick = useCallback(
    (route: DispatchRoute) => navigate(`/dispatch/routes/${route.id}`),
    [navigate],
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('dispatch.routes.title')}
        subtitle={t('dispatch.routes.subtitle', { count: routes.length })}
        breadcrumbs={[
          { label: t('dispatch.routes.breadcrumbHome'), href: '/' },
          { label: t('dispatch.routes.breadcrumbDispatch') },
          { label: t('dispatch.routes.breadcrumbRoutes') },
        ]}
        actions={
          <Button iconLeft={<Plus size={16} />}>
            {t('dispatch.routes.newRoute')}
          </Button>
        }
      />

      {/* Metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <MetricCard
          icon={<Route size={18} />}
          label={t('dispatch.routes.metricActiveRoutes')}
          value={`${activeCount} / ${routes.length}`}
        />
        <MetricCard
          icon={<MapPin size={18} />}
          label={t('dispatch.routes.metricTotalDistance')}
          value={`${formatNumber(totalDistance)} ${t('dispatch.routes.kmUnit')}`}
        />
        <MetricCard
          icon={<Truck size={18} />}
          label={t('dispatch.routes.metricActiveOrders')}
          value={totalActiveOrders}
        />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input
            placeholder={t('dispatch.routes.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          options={getActiveFilterOptions()}
          value={activeFilter}
          onChange={(e) => setActiveFilter(e.target.value)}
          className="w-44"
        />
      </div>

      {/* Table */}
      <DataTable<DispatchRoute>
        data={filteredRoutes}
        columns={columns}
        loading={isLoading}
        onRowClick={handleRowClick}
        enableColumnVisibility
        enableDensityToggle
        enableExport
        pageSize={20}
        emptyTitle={t('dispatch.routes.emptyTitle')}
        emptyDescription={t('dispatch.routes.emptyDescription')}
      />
    </div>
  );
};

export default DispatchRouteListPage;
