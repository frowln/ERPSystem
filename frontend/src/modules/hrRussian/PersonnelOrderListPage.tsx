import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { Plus, Search, FileSignature, UserPlus, UserMinus, ArrowRightLeft } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { DataTable } from '@/design-system/components/DataTable';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { MetricCard } from '@/design-system/components/MetricCard';
import { Input, Select } from '@/design-system/components/FormField';
import { formatDate } from '@/lib/format';
import { hrRussianApi } from './api';
import { t } from '@/i18n';
import type { PersonnelOrder } from './types';

const orderStatusColorMap: Record<string, 'gray' | 'blue' | 'green' | 'yellow' | 'red' | 'purple'> = {
  draft: 'gray',
  on_approval: 'yellow',
  approved: 'blue',
  executed: 'green',
  cancelled: 'red',
};

const getOrderStatusLabels = (): Record<string, string> => ({
  draft: t('hrRussian.orders.statusDraft'),
  on_approval: t('hrRussian.orders.statusOnApproval'),
  approved: t('hrRussian.orders.statusApproved'),
  executed: t('hrRussian.orders.statusExecuted'),
  cancelled: t('hrRussian.orders.statusCancelled'),
});

const orderTypeColorMap: Record<string, 'gray' | 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'orange' | 'cyan'> = {
  hire: 'green',
  transfer: 'blue',
  dismissal: 'red',
  vacation: 'cyan',
  business_trip: 'purple',
  bonus: 'yellow',
  discipline: 'orange',
  salary_change: 'blue',
};

const getOrderTypeLabels = (): Record<string, string> => ({
  hire: t('hrRussian.orders.typeHire'),
  transfer: t('hrRussian.orders.typeTransfer'),
  dismissal: t('hrRussian.orders.typeDismissal'),
  vacation: t('hrRussian.orders.typeVacation'),
  business_trip: t('hrRussian.orders.typeBusinessTrip'),
  bonus: t('hrRussian.orders.typeBonus'),
  discipline: t('hrRussian.orders.typeDiscipline'),
  salary_change: t('hrRussian.orders.typeSalaryChange'),
});

type TabId = 'all' | 'DRAFT' | 'ON_APPROVAL' | 'EXECUTED';

const getTypeFilterOptions = () => [
  { value: '', label: t('hrRussian.orders.allTypes') },
  ...Object.entries(getOrderTypeLabels()).map(([v, l]) => ({ value: v, label: l })),
];


const PersonnelOrderListPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const navigate = useNavigate();
  const { data, isLoading } = useQuery({
    queryKey: ['personnel-orders'],
    queryFn: () => hrRussianApi.getOrders({ size: 1000 }),
  });

  const orders = data?.content ?? [];

  const filtered = useMemo(() => {
    let result = orders;

    if (activeTab === 'DRAFT') {
      result = result.filter((o) => o.status === 'DRAFT');
    } else if (activeTab === 'ON_APPROVAL') {
      result = result.filter((o) => [ 'ON_APPROVAL', 'APPROVED'].includes(o.status));
    } else if (activeTab === 'EXECUTED') {
      result = result.filter((o) => o.status === 'EXECUTED');
    }

    if (typeFilter) result = result.filter((o) => o.orderType === typeFilter);

    if (search) {
      const lower = search.toLowerCase();
      result = result.filter(
        (o) =>
          o.number.toLowerCase().includes(lower) ||
          o.employeeName.toLowerCase().includes(lower) ||
          o.subject.toLowerCase().includes(lower),
      );
    }

    return result;
  }, [orders, activeTab, typeFilter, search]);

  const tabCounts = useMemo(() => ({
    all: orders.length,
    draft: orders.filter((o) => o.status === 'DRAFT').length,
    on_approval: orders.filter((o) => [ 'ON_APPROVAL', 'APPROVED'].includes(o.status)).length,
    executed: orders.filter((o) => o.status === 'EXECUTED').length,
  }), [orders]);

  const metrics = useMemo(() => ({
    total: orders.length,
    hires: orders.filter((o) => o.orderType === 'HIRE').length,
    dismissals: orders.filter((o) => o.orderType === 'DISMISSAL').length,
    pending: orders.filter((o) => o.status === 'ON_APPROVAL').length,
  }), [orders]);

  const columns = useMemo<ColumnDef<PersonnelOrder, unknown>[]>(() => {
    const orderStatusLabels = getOrderStatusLabels();
    const orderTypeLabels = getOrderTypeLabels();
    return [
      {
        accessorKey: 'number',
        header: '\u2116',
        size: 120,
        cell: ({ getValue }) => (
          <span className="font-mono text-neutral-500 dark:text-neutral-400 text-xs">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'orderType',
        header: t('hrRussian.orders.colType'),
        size: 140,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={orderTypeColorMap}
            label={orderTypeLabels[getValue<string>()] ?? getValue<string>()}
          />
        ),
      },
      {
        accessorKey: 'subject',
        header: t('hrRussian.orders.colSubject'),
        size: 280,
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-neutral-900 dark:text-neutral-100 truncate max-w-[260px]">{row.original.subject}</p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{row.original.employeeName}</p>
          </div>
        ),
      },
      {
        accessorKey: 'department',
        header: t('hrRussian.orders.colDepartment'),
        size: 160,
        cell: ({ getValue }) => (
          <span className="text-neutral-700 dark:text-neutral-300">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'status',
        header: t('hrRussian.orders.colStatus'),
        size: 140,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={orderStatusColorMap}
            label={orderStatusLabels[getValue<string>()] ?? getValue<string>()}
          />
        ),
      },
      {
        accessorKey: 'orderDate',
        header: t('hrRussian.orders.colOrderDate'),
        size: 110,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-neutral-700 dark:text-neutral-300">{formatDate(getValue<string>())}</span>
        ),
      },
      {
        accessorKey: 'effectiveDate',
        header: t('hrRussian.orders.colEffectiveDate'),
        size: 120,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-neutral-700 dark:text-neutral-300">{formatDate(getValue<string>())}</span>
        ),
      },
    ];
  }, []);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('hrRussian.orders.title')}
        subtitle={t('hrRussian.orders.subtitleOrders', { count: String(orders.length) })}
        breadcrumbs={[
          { label: t('hrRussian.orders.breadcrumbHome'), href: '/' },
          { label: t('hrRussian.orders.breadcrumbHr') },
          { label: t('hrRussian.orders.breadcrumbOrders') },
        ]}
        actions={<Button iconLeft={<Plus size={16} />} onClick={() => navigate('/hr-russian/orders/new')}>{t('hrRussian.orders.newOrder')}</Button>}
        tabs={[
          { id: 'all', label: t('hrRussian.orders.tabAll'), count: tabCounts.all },
          { id: 'DRAFT', label: t('hrRussian.orders.tabDrafts'), count: tabCounts.draft },
          { id: 'ON_APPROVAL', label: t('hrRussian.orders.tabOnApproval'), count: tabCounts.on_approval },
          { id: 'EXECUTED', label: t('hrRussian.orders.tabExecuted'), count: tabCounts.executed },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as TabId)}
      />

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard icon={<FileSignature size={18} />} label={t('hrRussian.orders.metricTotal')} value={metrics.total} />
        <MetricCard icon={<UserPlus size={18} />} label={t('hrRussian.orders.metricHires')} value={metrics.hires} />
        <MetricCard icon={<UserMinus size={18} />} label={t('hrRussian.orders.metricDismissals')} value={metrics.dismissals} />
        <MetricCard
          icon={<ArrowRightLeft size={18} />}
          label={t('hrRussian.orders.metricPending')}
          value={metrics.pending}
          trend={{ direction: metrics.pending > 0 ? 'up' : 'neutral', value: metrics.pending > 0 ? t('hrRussian.orders.trendAwaiting') : t('hrRussian.orders.trendNone') }}
        />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input
            placeholder={t('hrRussian.orders.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          options={getTypeFilterOptions()}
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="w-48"
        />
      </div>

      {/* Table */}
      <DataTable<PersonnelOrder>
        data={filtered}
        columns={columns}
        loading={isLoading}
        enableRowSelection
        enableColumnVisibility
        enableDensityToggle
        enableExport
        pageSize={20}
        emptyTitle={t('hrRussian.orders.emptyTitle')}
        emptyDescription={t('hrRussian.orders.emptyDescription')}
      />
    </div>
  );
};

export default PersonnelOrderListPage;
