import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { Plus, Search, FileSignature, UserPlus, UserMinus, ArrowRightLeft, Palmtree } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { DataTable } from '@/design-system/components/DataTable';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { MetricCard } from '@/design-system/components/MetricCard';
import { Input, Select } from '@/design-system/components/FormField';
import { formatDate } from '@/lib/format';
import { hrRussianApi } from './api';
import type { PersonnelOrder } from './types';

const orderStatusColorMap: Record<string, 'gray' | 'blue' | 'green' | 'yellow' | 'red' | 'purple'> = {
  draft: 'gray',
  on_approval: 'yellow',
  approved: 'blue',
  executed: 'green',
  cancelled: 'red',
};

const orderStatusLabels: Record<string, string> = {
  draft: 'Черновик',
  on_approval: 'На согласовании',
  approved: 'Согласован',
  executed: 'Исполнен',
  cancelled: 'Отменён',
};

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

const orderTypeLabels: Record<string, string> = {
  hire: 'Приём',
  transfer: 'Перевод',
  dismissal: 'Увольнение',
  vacation: 'Отпуск',
  business_trip: 'Командировка',
  bonus: 'Премирование',
  discipline: 'Дисциплинарное',
  salary_change: 'Изменение оклада',
};

type TabId = 'all' | 'DRAFT' | 'ON_APPROVAL' | 'EXECUTED';

const typeFilterOptions = [
  { value: '', label: 'Все типы' },
  ...Object.entries(orderTypeLabels).map(([v, l]) => ({ value: v, label: l })),
];


const PersonnelOrderListPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

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

  const columns = useMemo<ColumnDef<PersonnelOrder, unknown>[]>(() => [
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
      header: 'Тип',
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
      header: 'Содержание',
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
      header: 'Подразделение',
      size: 160,
      cell: ({ getValue }) => (
        <span className="text-neutral-700 dark:text-neutral-300">{getValue<string>()}</span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Статус',
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
      header: 'Дата приказа',
      size: 110,
      cell: ({ getValue }) => (
        <span className="tabular-nums text-neutral-700 dark:text-neutral-300">{formatDate(getValue<string>())}</span>
      ),
    },
    {
      accessorKey: 'effectiveDate',
      header: 'Дата действия',
      size: 120,
      cell: ({ getValue }) => (
        <span className="tabular-nums text-neutral-700 dark:text-neutral-300">{formatDate(getValue<string>())}</span>
      ),
    },
  ], []);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Кадровые приказы"
        subtitle={`${orders.length} приказов`}
        breadcrumbs={[
          { label: 'Главная', href: '/' },
          { label: 'Кадры РФ' },
          { label: 'Приказы' },
        ]}
        actions={<Button iconLeft={<Plus size={16} />}>Новый приказ</Button>}
        tabs={[
          { id: 'all', label: 'Все', count: tabCounts.all },
          { id: 'DRAFT', label: 'Черновики', count: tabCounts.draft },
          { id: 'ON_APPROVAL', label: 'На согласовании', count: tabCounts.on_approval },
          { id: 'EXECUTED', label: 'Исполненные', count: tabCounts.executed },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as TabId)}
      />

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard icon={<FileSignature size={18} />} label="Всего приказов" value={metrics.total} />
        <MetricCard icon={<UserPlus size={18} />} label="Приём" value={metrics.hires} />
        <MetricCard icon={<UserMinus size={18} />} label="Увольнение" value={metrics.dismissals} />
        <MetricCard
          icon={<ArrowRightLeft size={18} />}
          label="На согласовании"
          value={metrics.pending}
          trend={{ direction: metrics.pending > 0 ? 'up' : 'neutral', value: metrics.pending > 0 ? 'Ожидают' : 'Нет' }}
        />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input
            placeholder="Поиск по номеру, ФИО, содержанию..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          options={typeFilterOptions}
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
        emptyTitle="Нет кадровых приказов"
        emptyDescription="Создайте первый приказ"
      />
    </div>
  );
};

export default PersonnelOrderListPage;
