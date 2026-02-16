import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { Plus, Search, Truck, Clock, CheckCircle, MapPin, Package } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { DataTable } from '@/design-system/components/DataTable';
import { MetricCard } from '@/design-system/components/MetricCard';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { Input, Select } from '@/design-system/components/FormField';
import { dispatchApi } from '@/api/dispatch';
import { formatDate } from '@/lib/format';
import { t } from '@/i18n';
import type { DispatchOrder, DispatchStatus } from './types';
import type { PaginatedResponse } from '@/types';

const dispatchStatusColorMap: Record<string, 'gray' | 'blue' | 'yellow' | 'orange' | 'cyan' | 'green' | 'purple'> = {
  draft: 'gray',
  scheduled: 'blue',
  dispatched: 'yellow',
  in_transit: 'orange',
  delivered: 'cyan',
  completed: 'green',
  cancelled: 'gray',
};

const getDispatchStatusLabels = (): Record<string, string> => ({
  draft: t('dispatch.orders.statusDraft'),
  scheduled: t('dispatch.orders.statusScheduled'),
  dispatched: t('dispatch.orders.statusDispatched'),
  in_transit: t('dispatch.orders.statusInTransit'),
  delivered: t('dispatch.orders.statusDelivered'),
  completed: t('dispatch.orders.statusCompleted'),
  cancelled: t('dispatch.orders.statusCancelled'),
});

const getStatusFilterOptions = () => [
  { value: '', label: t('dispatch.orders.allStatuses') },
  { value: 'DRAFT', label: t('dispatch.orders.statusDraft') },
  { value: 'SCHEDULED', label: t('dispatch.orders.statusScheduled') },
  { value: 'DISPATCHED', label: t('dispatch.orders.statusDispatched') },
  { value: 'IN_TRANSIT', label: t('dispatch.orders.statusInTransit') },
  { value: 'DELIVERED', label: t('dispatch.orders.statusDelivered') },
  { value: 'COMPLETED', label: t('dispatch.orders.statusCompleted') },
  { value: 'CANCELLED', label: t('dispatch.orders.statusCancelled') },
];

const nextStatusMap: Record<string, DispatchStatus> = {
  draft: 'SCHEDULED',
  scheduled: 'DISPATCHED',
  dispatched: 'IN_TRANSIT',
  in_transit: 'DELIVERED',
  delivered: 'COMPLETED',
};

const getNextStatusLabels = (): Record<string, string> => ({
  draft: t('dispatch.orders.actionSchedule'),
  scheduled: t('dispatch.orders.actionDispatch'),
  dispatched: t('dispatch.orders.actionInTransit'),
  in_transit: t('dispatch.orders.actionDelivered'),
  delivered: t('dispatch.orders.actionComplete'),
});

type TabId = 'all' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';


const DispatchOrderListPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { data: ordersData, isLoading } = useQuery<PaginatedResponse<DispatchOrder>>({
    queryKey: ['dispatch-orders'],
    queryFn: () => dispatchApi.getOrders(),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: DispatchStatus }) => dispatchApi.updateOrderStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['dispatch-orders'] }),
  });

  const orders = ordersData?.content ?? [];

  const filteredOrders = useMemo(() => {
    let filtered = orders;

    if (activeTab === 'ACTIVE') {
      filtered = filtered.filter((o) => [ 'SCHEDULED', 'DISPATCHED', 'IN_TRANSIT', 'DELIVERED'].includes(o.status));
    } else if (activeTab === 'COMPLETED') {
      filtered = filtered.filter((o) => o.status === 'COMPLETED');
    } else if (activeTab === 'CANCELLED') {
      filtered = filtered.filter((o) => o.status === 'CANCELLED');
    }

    if (statusFilter) {
      filtered = filtered.filter((o) => o.status === statusFilter);
    }

    if (search) {
      const lower = search.toLowerCase();
      filtered = filtered.filter(
        (o) =>
          o.number.toLowerCase().includes(lower) ||
          o.description.toLowerCase().includes(lower) ||
          (o.vehicleNumber ?? '').toLowerCase().includes(lower) ||
          (o.driverName ?? '').toLowerCase().includes(lower),
      );
    }

    return filtered;
  }, [orders, activeTab, statusFilter, search]);

  const tabCounts = useMemo(() => ({
    all: orders.length,
    active: orders.filter((o) => [ 'SCHEDULED', 'DISPATCHED', 'IN_TRANSIT', 'DELIVERED'].includes(o.status)).length,
    completed: orders.filter((o) => o.status === 'COMPLETED').length,
    cancelled: orders.filter((o) => o.status === 'CANCELLED').length,
  }), [orders]);

  const metrics = useMemo(() => {
    const inTransit = orders.filter((o) => o.status === 'IN_TRANSIT').length;
    const scheduled = orders.filter((o) => o.status === 'SCHEDULED').length;
    const delivered = orders.filter((o) => o.status === 'DELIVERED' || o.status === 'COMPLETED').length;
    return { total: orders.length, inTransit, scheduled, delivered };
  }, [orders]);

  const dispatchStatusLabels = getDispatchStatusLabels();
  const nextStatusLabels = getNextStatusLabels();

  const columns = useMemo<ColumnDef<DispatchOrder, unknown>[]>(
    () => [
      {
        accessorKey: 'number',
        header: '\u2116',
        size: 90,
        cell: ({ getValue }) => (
          <span className="font-mono text-neutral-500 dark:text-neutral-400 text-xs">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'description',
        header: t('dispatch.orders.colDescription'),
        size: 260,
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-neutral-900 dark:text-neutral-100 truncate max-w-[240px]">{row.original.description}</p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{row.original.projectName ?? '---'}</p>
          </div>
        ),
      },
      {
        accessorKey: 'status',
        header: t('dispatch.orders.colStatus'),
        size: 130,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={dispatchStatusColorMap}
            label={dispatchStatusLabels[getValue<string>()] ?? getValue<string>()}
          />
        ),
      },
      {
        accessorKey: 'vehicleNumber',
        header: t('dispatch.orders.colVehicleDriver'),
        size: 160,
        cell: ({ row }) => (
          <div>
            <p className="text-neutral-900 dark:text-neutral-100 text-sm">{row.original.vehicleNumber ?? '---'}</p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">{row.original.driverName ?? t('dispatch.orders.notAssigned')}</p>
          </div>
        ),
      },
      {
        accessorKey: 'originLocation',
        header: t('dispatch.orders.colRoute'),
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
        accessorKey: 'scheduledDate',
        header: t('dispatch.orders.colDate'),
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
          const nextStatus = nextStatusMap[row.original.status];
          const nextLabel = nextStatusLabels[row.original.status];
          if (!nextStatus) {
            return (
              <Button
                variant="ghost"
                size="xs"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/dispatch/orders/${row.original.id}`);
                }}
              >
                {t('dispatch.orders.actionOpen')}
              </Button>
            );
          }
          return (
            <Button
              variant="primary"
              size="xs"
              onClick={(e) => {
                e.stopPropagation();
                statusMutation.mutate({ id: row.original.id, status: nextStatus });
              }}
            >
              {nextLabel}
            </Button>
          );
        },
      },
    ],
    [navigate, statusMutation, dispatchStatusLabels, nextStatusLabels],
  );

  const handleRowClick = useCallback(
    (order: DispatchOrder) => navigate(`/dispatch/orders/${order.id}`),
    [navigate],
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('dispatch.orders.title')}
        subtitle={t('dispatch.orders.subtitle', { count: orders.length })}
        breadcrumbs={[
          { label: t('dispatch.orders.breadcrumbHome'), href: '/' },
          { label: t('dispatch.orders.breadcrumbDispatch') },
          { label: t('dispatch.orders.breadcrumbOrders') },
        ]}
        actions={
          <Button iconLeft={<Plus size={16} />}>
            {t('dispatch.orders.newOrder')}
          </Button>
        }
        tabs={[
          { id: 'all', label: t('dispatch.orders.tabAll'), count: tabCounts.all },
          { id: 'ACTIVE', label: t('dispatch.orders.tabActive'), count: tabCounts.active },
          { id: 'COMPLETED', label: t('dispatch.orders.tabCompleted'), count: tabCounts.completed },
          { id: 'CANCELLED', label: t('dispatch.orders.tabCancelled'), count: tabCounts.cancelled },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as TabId)}
      />

      {/* Metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard
          icon={<Package size={18} />}
          label={t('dispatch.orders.metricTotal')}
          value={metrics.total}
        />
        <MetricCard
          icon={<Clock size={18} />}
          label={t('dispatch.orders.metricScheduled')}
          value={metrics.scheduled}
        />
        <MetricCard
          icon={<Truck size={18} />}
          label={t('dispatch.orders.metricInTransit')}
          value={metrics.inTransit}
          trend={metrics.inTransit > 0 ? { direction: 'up', value: `${metrics.inTransit} ${t('dispatch.orders.pcsUnit')}` } : undefined}
        />
        <MetricCard
          icon={<CheckCircle size={18} />}
          label={t('dispatch.orders.metricDelivered')}
          value={metrics.delivered}
        />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input
            placeholder={t('dispatch.orders.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          options={getStatusFilterOptions()}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-44"
        />
      </div>

      {/* Table */}
      <DataTable<DispatchOrder>
        data={filteredOrders}
        columns={columns}
        loading={isLoading}
        onRowClick={handleRowClick}
        enableRowSelection
        enableColumnVisibility
        enableDensityToggle
        enableExport
        pageSize={20}
        emptyTitle={t('dispatch.orders.emptyTitle')}
        emptyDescription={t('dispatch.orders.emptyDescription')}
      />
    </div>
  );
};

export default DispatchOrderListPage;
