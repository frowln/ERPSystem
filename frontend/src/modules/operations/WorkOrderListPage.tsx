import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { Plus, Search, Wrench, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { DataTable } from '@/design-system/components/DataTable';
import { MetricCard } from '@/design-system/components/MetricCard';
import {
  StatusBadge,
  workOrderStatusColorMap,
  workOrderStatusLabels,
  workOrderPriorityColorMap,
  workOrderPriorityLabels,
} from '@/design-system/components/StatusBadge';
import { Input, Select } from '@/design-system/components/FormField';
import { operationsApi } from '@/api/operations';
import { formatDate } from '@/lib/format';
import { t } from '@/i18n';
import type { WorkOrder } from './types';

type TabId = 'all' | 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'ON_HOLD';

const getPriorityFilterOptions = () => [
  { value: '', label: t('operations.workOrderList.allPriorities') },
  { value: 'LOW', label: t('operations.workOrderList.priorityLow') },
  { value: 'MEDIUM', label: t('operations.workOrderList.priorityMedium') },
  { value: 'HIGH', label: t('operations.workOrderList.priorityHigh') },
  { value: 'URGENT', label: t('operations.workOrderList.priorityUrgent') },
];

const WorkOrderListPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  const { data: woData, isLoading } = useQuery({
    queryKey: ['work-orders'],
    queryFn: () => operationsApi.getWorkOrders(),
  });

  const orders = woData?.content ?? [];

  const filteredOrders = useMemo(() => {
    let filtered = orders;
    if (activeTab !== 'all') filtered = filtered.filter((o) => o.status === activeTab);
    if (priorityFilter) filtered = filtered.filter((o) => o.priority === priorityFilter);
    if (search) {
      const lower = search.toLowerCase();
      filtered = filtered.filter(
        (o) =>
          o.number.toLowerCase().includes(lower) ||
          o.title.toLowerCase().includes(lower) ||
          o.assignedToName.toLowerCase().includes(lower),
      );
    }
    return filtered;
  }, [orders, activeTab, priorityFilter, search]);

  const tabCounts = useMemo(() => ({
    all: orders.length,
    planned: orders.filter((o) => o.status === 'PLANNED').length,
    in_progress: orders.filter((o) => o.status === 'IN_PROGRESS').length,
    completed: orders.filter((o) => o.status === 'COMPLETED').length,
    on_hold: orders.filter((o) => o.status === 'ON_HOLD').length,
  }), [orders]);

  const metrics = useMemo(() => ({
    total: orders.length,
    inProgress: orders.filter((o) => o.status === 'IN_PROGRESS').length,
    completed: orders.filter((o) => o.status === 'COMPLETED').length,
    onHold: orders.filter((o) => o.status === 'ON_HOLD').length,
  }), [orders]);

  const columns = useMemo<ColumnDef<WorkOrder, unknown>[]>(
    () => [
      {
        accessorKey: 'number',
        header: '\u2116',
        size: 100,
        cell: ({ getValue }) => (
          <span className="font-mono text-neutral-500 dark:text-neutral-400 text-xs">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'title',
        header: t('operations.workOrderList.columnTitle'),
        size: 280,
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-neutral-900 dark:text-neutral-100 truncate max-w-[260px]">{row.original.title}</p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{row.original.workArea} — {row.original.projectName}</p>
          </div>
        ),
      },
      {
        accessorKey: 'status',
        header: t('operations.workOrderList.columnStatus'),
        size: 130,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={workOrderStatusColorMap}
            label={workOrderStatusLabels[getValue<string>()] ?? getValue<string>()}
          />
        ),
      },
      {
        accessorKey: 'priority',
        header: t('operations.workOrderList.columnPriority'),
        size: 110,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={workOrderPriorityColorMap}
            label={workOrderPriorityLabels[getValue<string>()] ?? getValue<string>()}
          />
        ),
      },
      {
        accessorKey: 'assignedToName',
        header: t('operations.workOrderList.columnAssignee'),
        size: 150,
        cell: ({ getValue }) => (
          <span className="text-neutral-700 dark:text-neutral-300">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'percentComplete',
        header: t('operations.workOrderList.columnProgress'),
        size: 120,
        cell: ({ getValue }) => {
          const pct = getValue<number>();
          return (
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-neutral-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary-500 rounded-full transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-xs tabular-nums text-neutral-600 w-8">{pct}%</span>
            </div>
          );
        },
      },
      {
        accessorKey: 'plannedEndDate',
        header: t('operations.workOrderList.columnDeadline'),
        size: 110,
        cell: ({ row }) => {
          const endDate = row.original.plannedEndDate;
          const isOverdue = endDate && new Date(endDate) < new Date() && !['COMPLETED', 'CANCELLED'].includes(row.original.status);
          return (
            <span className={isOverdue ? 'text-danger-600 font-medium tabular-nums' : 'tabular-nums text-neutral-700 dark:text-neutral-300'}>
              {formatDate(endDate)}
            </span>
          );
        },
      },
    ],
    [],
  );

  const handleRowClick = useCallback(
    (order: WorkOrder) => navigate(`/operations/work-orders/${order.id}`),
    [navigate],
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('operations.workOrderList.title')}
        subtitle={t('operations.workOrderList.subtitle', { count: orders.length })}
        breadcrumbs={[
          { label: t('operations.workOrderList.breadcrumbHome'), href: '/' },
          { label: t('operations.workOrderList.breadcrumbOperations'), href: '/operations' },
          { label: t('operations.workOrderList.breadcrumbWorkOrders') },
        ]}
        actions={
          <Button iconLeft={<Plus size={16} />} onClick={() => navigate('/operations/work-orders/new')}>
            {t('operations.workOrderList.newOrder')}
          </Button>
        }
        tabs={[
          { id: 'all', label: t('operations.workOrderList.tabAll'), count: tabCounts.all },
          { id: 'PLANNED', label: t('operations.workOrderList.tabPlanned'), count: tabCounts.planned },
          { id: 'IN_PROGRESS', label: t('operations.workOrderList.tabInProgress'), count: tabCounts.in_progress },
          { id: 'COMPLETED', label: t('operations.workOrderList.tabCompleted'), count: tabCounts.completed },
          { id: 'ON_HOLD', label: t('operations.workOrderList.tabOnHold'), count: tabCounts.on_hold },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as TabId)}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard icon={<Wrench size={18} />} label={t('operations.workOrderList.metricTotal')} value={metrics.total} />
        <MetricCard icon={<Clock size={18} />} label={t('operations.workOrderList.metricInProgress')} value={metrics.inProgress} />
        <MetricCard icon={<CheckCircle2 size={18} />} label={t('operations.workOrderList.metricCompleted')} value={metrics.completed} />
        <MetricCard icon={<AlertCircle size={18} />} label={t('operations.workOrderList.metricOnHold')} value={metrics.onHold} />
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input placeholder={t('operations.workOrderList.searchPlaceholder')} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select options={getPriorityFilterOptions()} value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} className="w-48" />
      </div>

      <DataTable<WorkOrder>
        data={filteredOrders}
        columns={columns}
        loading={isLoading}
        onRowClick={handleRowClick}
        enableRowSelection
        enableColumnVisibility
        enableDensityToggle
        enableExport
        pageSize={20}
        emptyTitle={t('operations.workOrderList.emptyTitle')}
        emptyDescription={t('operations.workOrderList.emptyDescription')}
      />
    </div>
  );
};

export default WorkOrderListPage;
