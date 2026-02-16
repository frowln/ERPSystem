import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { Plus, Search, FileText, DollarSign, Clock, TrendingUp, Trash2 } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { useConfirmDialog } from '@/design-system/components/ConfirmDialog/provider';
import { DataTable } from '@/design-system/components/DataTable';
import { MetricCard } from '@/design-system/components/MetricCard';
import {
  StatusBadge,
  changeOrderStatusColorMap,
  changeOrderStatusLabels,
  changeOrderTypeColorMap,
  changeOrderTypeLabels,
} from '@/design-system/components/StatusBadge';
import { Input, Select } from '@/design-system/components/FormField';
import { changeManagementApi } from '@/api/changeManagement';
import { formatDate, formatMoney, formatMoneyCompact } from '@/lib/format';
import { t } from '@/i18n';
import toast from 'react-hot-toast';
import type { ChangeOrder } from './types';

type TabId = 'all' | 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'EXECUTED';

const getTypeFilterOptions = () => [
  { value: '', label: t('changeManagement.orderList.filterAllTypes') },
  { value: 'ADDITION', label: t('changeManagement.orderList.filterAddition') },
  { value: 'DEDUCTION', label: t('changeManagement.orderList.filterDeduction') },
  { value: 'NO_COST', label: t('changeManagement.orderList.filterNoCost') },
  { value: 'TIME_EXTENSION', label: t('changeManagement.orderList.filterTimeExtension') },
];

const ChangeOrderListPage: React.FC = () => {
  const navigate = useNavigate();
  const confirm = useConfirmDialog();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const deleteOrderMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      for (const id of ids) {
        await changeManagementApi.deleteChangeOrder(id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['change-orders'] });
      toast.success(t('changeManagement.orderList.toastDeleted'));
    },
    onError: () => {
      toast.error(t('changeManagement.orderList.toastDeleteError'));
    },
  });

  const { data: orderData, isLoading } = useQuery({
    queryKey: ['change-orders'],
    queryFn: () => changeManagementApi.getChangeOrders(),
  });

  const orders = orderData?.content ?? [];

  const filteredOrders = useMemo(() => {
    let filtered = orders;
    if (activeTab !== 'all') {
      filtered = filtered.filter((o) => o.status === activeTab);
    }
    if (typeFilter) {
      filtered = filtered.filter((o) => o.type === typeFilter);
    }
    if (search) {
      const lower = search.toLowerCase();
      filtered = filtered.filter(
        (o) =>
          o.number.toLowerCase().includes(lower) ||
          o.title.toLowerCase().includes(lower) ||
          (o.contractName ?? '').toLowerCase().includes(lower),
      );
    }
    return filtered;
  }, [orders, activeTab, typeFilter, search]);

  const tabCounts = useMemo(() => ({
    all: orders.length,
    draft: orders.filter((o) => o.status === 'DRAFT').length,
    submitted: orders.filter((o) => o.status === 'SUBMITTED').length,
    under_review: orders.filter((o) => o.status === 'UNDER_REVIEW').length,
    approved: orders.filter((o) => o.status === 'APPROVED').length,
    executed: orders.filter((o) => o.status === 'EXECUTED').length,
  }), [orders]);

  const metrics = useMemo(() => {
    const totalAmount = orders.reduce((s, o) => s + o.amount, 0);
    const approvedAmount = orders
      .filter((o) => [ 'APPROVED', 'EXECUTED'].includes(o.status))
      .reduce((s, o) => s + o.amount, 0);
    const pendingCount = orders.filter((o) => [ 'SUBMITTED', 'UNDER_REVIEW'].includes(o.status)).length;
    return { total: orders.length, totalAmount, approvedAmount, pendingCount };
  }, [orders]);

  const columns = useMemo<ColumnDef<ChangeOrder, unknown>[]>(
    () => [
      {
        accessorKey: 'number',
        header: t('changeManagement.orderList.colNumber'),
        size: 100,
        cell: ({ getValue }) => (
          <span className="font-mono text-neutral-500 dark:text-neutral-400 text-xs">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'title',
        header: t('changeManagement.orderList.colTitle'),
        size: 280,
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-neutral-900 dark:text-neutral-100 truncate max-w-[260px]">{row.original.title}</p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{row.original.contractName ?? row.original.projectName}</p>
          </div>
        ),
      },
      {
        accessorKey: 'status',
        header: t('changeManagement.orderList.colStatus'),
        size: 140,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={changeOrderStatusColorMap}
            label={changeOrderStatusLabels[getValue<string>()] ?? getValue<string>()}
          />
        ),
      },
      {
        accessorKey: 'type',
        header: t('changeManagement.orderList.colType'),
        size: 140,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={changeOrderTypeColorMap}
            label={changeOrderTypeLabels[getValue<string>()] ?? getValue<string>()}
          />
        ),
      },
      {
        accessorKey: 'amount',
        header: t('changeManagement.orderList.colAmount'),
        size: 160,
        cell: ({ getValue }) => {
          const val = getValue<number>();
          return (
            <span className={`tabular-nums text-sm font-medium ${val > 0 ? 'text-danger-600' : val < 0 ? 'text-success-600' : 'text-neutral-500 dark:text-neutral-400'}`}>
              {val !== 0 ? formatMoney(val) : '---'}
            </span>
          );
        },
      },
      {
        accessorKey: 'scheduleImpactDays',
        header: t('changeManagement.orderList.colSchedule'),
        size: 100,
        cell: ({ getValue }) => {
          const days = getValue<number>();
          return (
            <span className={`tabular-nums text-sm ${days > 0 ? 'text-warning-600' : 'text-neutral-500 dark:text-neutral-400'}`}>
              {days > 0 ? `+${days} ${t('changeManagement.orderList.days')}` : '---'}
            </span>
          );
        },
      },
      {
        accessorKey: 'submittedByName',
        header: t('changeManagement.orderList.colSubmittedBy'),
        size: 150,
        cell: ({ getValue }) => (
          <span className="text-neutral-700 dark:text-neutral-300">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'createdAt',
        header: t('changeManagement.orderList.colDate'),
        size: 110,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-neutral-600 text-xs">{formatDate(getValue<string>())}</span>
        ),
      },
    ],
    [],
  );

  const handleRowClick = useCallback(
    (order: ChangeOrder) => navigate(`/change-management/orders/${order.id}`),
    [navigate],
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('changeManagement.orderList.title')}
        subtitle={`${orders.length} ${t('changeManagement.orderList.subtitleOrders')}`}
        breadcrumbs={[
          { label: t('changeManagement.orderList.breadcrumbHome'), href: '/' },
          { label: t('changeManagement.orderList.breadcrumbChangeManagement') },
          { label: t('changeManagement.orderList.breadcrumbOrders') },
        ]}
        actions={
          <Button iconLeft={<Plus size={16} />} onClick={() => navigate('/change-management/orders/new')}>
            {t('changeManagement.orderList.newOrder')}
          </Button>
        }
        tabs={[
          { id: 'all', label: t('changeManagement.orderList.tabAll'), count: tabCounts.all },
          { id: 'DRAFT', label: t('changeManagement.orderList.tabDrafts'), count: tabCounts.draft },
          { id: 'SUBMITTED', label: t('changeManagement.orderList.tabSubmitted'), count: tabCounts.submitted },
          { id: 'UNDER_REVIEW', label: t('changeManagement.orderList.tabUnderReview'), count: tabCounts.under_review },
          { id: 'APPROVED', label: t('changeManagement.orderList.tabApproved'), count: tabCounts.approved },
          { id: 'EXECUTED', label: t('changeManagement.orderList.tabExecuted'), count: tabCounts.executed },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as TabId)}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard icon={<FileText size={18} />} label={t('changeManagement.orderList.metricTotal')} value={metrics.total} />
        <MetricCard
          icon={<DollarSign size={18} />}
          label={t('changeManagement.orderList.metricTotalAmount')}
          value={formatMoneyCompact(metrics.totalAmount)}
        />
        <MetricCard
          icon={<TrendingUp size={18} />}
          label={t('changeManagement.orderList.metricApproved')}
          value={formatMoneyCompact(metrics.approvedAmount)}
        />
        <MetricCard
          icon={<Clock size={18} />}
          label={t('changeManagement.orderList.metricPending')}
          value={metrics.pendingCount}
          subtitle={t('changeManagement.orderList.metricPendingSubtitle')}
        />
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input
            placeholder={t('changeManagement.orderList.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          options={getTypeFilterOptions()}
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="w-52"
        />
      </div>

      <DataTable<ChangeOrder>
        data={filteredOrders}
        columns={columns}
        loading={isLoading}
        onRowClick={handleRowClick}
        enableRowSelection
        enableColumnVisibility
        enableDensityToggle
        enableExport
        pageSize={20}
        bulkActions={[
          {
            label: t('changeManagement.orderList.bulkDelete'),
            icon: <Trash2 size={13} />,
            variant: 'danger',
            onClick: async (rows) => {
              const ids = rows.map((r) => r.id);
              const isConfirmed = await confirm({
                title: t('changeManagement.orderList.confirmDeleteTitle', { count: String(ids.length) }),
                description: t('changeManagement.orderList.confirmDeleteDescription'),
                confirmLabel: t('changeManagement.orderList.confirmDeleteConfirm'),
                cancelLabel: t('changeManagement.orderList.confirmDeleteCancel'),
              });
              if (!isConfirmed) return;
              deleteOrderMutation.mutate(ids);
            },
          },
        ]}
        emptyTitle={t('changeManagement.orderList.emptyTitle')}
        emptyDescription={t('changeManagement.orderList.emptyDescription')}
      />
    </div>
  );
};

export default ChangeOrderListPage;
