import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { Search, Plus, FileText, Clock, CheckCircle, XCircle } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { DataTable } from '@/design-system/components/DataTable';
import { MetricCard } from '@/design-system/components/MetricCard';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { Input } from '@/design-system/components/FormField';
import { materialAnalogsApi } from '@/api/materialAnalogs';
import { formatDate } from '@/lib/format';
import type { AnalogRequest } from './types';

const analogRequestStatusColorMap: Record<string, 'gray' | 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'orange' | 'cyan'> = {
  draft: 'gray',
  submitted: 'blue',
  under_review: 'yellow',
  approved: 'green',
  rejected: 'red',
  implemented: 'purple',
};

const analogRequestStatusLabels: Record<string, string> = {
  draft: 'Черновик',
  submitted: 'Подана',
  under_review: 'На рассмотрении',
  approved: 'Утверждена',
  rejected: 'Отклонена',
  implemented: 'Внедрена',
};

type TabId = 'all' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED';

const AnalogRequestsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['analog-requests'],
    queryFn: () => materialAnalogsApi.getRequests(),
  });

  const requests = data?.content ?? [];

  const filtered = useMemo(() => {
    let result = requests;
    if (activeTab !== 'all') result = result.filter((r) => r.status === activeTab);
    if (search) {
      const lower = search.toLowerCase();
      result = result.filter(
        (r) =>
          r.number.toLowerCase().includes(lower) ||
          r.originalMaterialName.toLowerCase().includes(lower) ||
          r.projectName.toLowerCase().includes(lower),
      );
    }
    return result;
  }, [requests, activeTab, search]);

  const tabCounts = useMemo(() => ({
    all: requests.length,
    submitted: requests.filter((r) => r.status === 'SUBMITTED').length,
    under_review: requests.filter((r) => r.status === 'UNDER_REVIEW').length,
    approved: requests.filter((r) => r.status === 'APPROVED').length,
    rejected: requests.filter((r) => r.status === 'REJECTED').length,
  }), [requests]);

  const metrics = useMemo(() => ({
    total: requests.length,
    pending: requests.filter((r) => ['SUBMITTED', 'UNDER_REVIEW'].includes(r.status)).length,
    approved: requests.filter((r) => r.status === 'APPROVED' || r.status === 'IMPLEMENTED').length,
    rejected: requests.filter((r) => r.status === 'REJECTED').length,
  }), [requests]);

  const columns = useMemo<ColumnDef<AnalogRequest, unknown>[]>(
    () => [
      {
        accessorKey: 'number',
        header: '\u2116',
        size: 130,
        cell: ({ getValue }) => <span className="font-mono text-neutral-500 dark:text-neutral-400 text-xs">{getValue<string>()}</span>,
      },
      {
        accessorKey: 'originalMaterialName',
        header: 'Материал',
        size: 220,
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-neutral-900 dark:text-neutral-100 truncate max-w-[200px]">{row.original.originalMaterialName}</p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{row.original.projectName}</p>
          </div>
        ),
      },
      {
        accessorKey: 'reason',
        header: 'Причина',
        size: 260,
        cell: ({ getValue }) => (
          <p className="text-neutral-700 dark:text-neutral-300 truncate max-w-[240px]">{getValue<string>()}</p>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Статус',
        size: 140,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={analogRequestStatusColorMap}
            label={analogRequestStatusLabels[getValue<string>()] ?? getValue<string>()}
          />
        ),
      },
      {
        accessorKey: 'requestedByName',
        header: 'Инициатор',
        size: 150,
        cell: ({ getValue }) => <span className="text-neutral-700 dark:text-neutral-300">{getValue<string>()}</span>,
      },
      {
        accessorKey: 'proposedAnalogCount',
        header: 'Аналогов',
        size: 90,
        cell: ({ getValue }) => <span className="tabular-nums text-neutral-500 dark:text-neutral-400">{getValue<number>()}</span>,
      },
      {
        accessorKey: 'dueDate',
        header: 'Срок',
        size: 110,
        cell: ({ row }) => {
          const val = row.original.dueDate;
          if (!val) return <span className="text-neutral-400">---</span>;
          const isOverdue = new Date(val) < new Date() && !['APPROVED', 'REJECTED', 'IMPLEMENTED'].includes(row.original.status);
          return <span className={`tabular-nums ${isOverdue ? 'text-danger-600 font-medium' : 'text-neutral-700 dark:text-neutral-300'}`}>{formatDate(val)}</span>;
        },
      },
      {
        accessorKey: 'selectedAnalogName',
        header: 'Выбранный аналог',
        size: 200,
        cell: ({ getValue }) => {
          const val = getValue<string>();
          return val ? <span className="text-neutral-700 dark:text-neutral-300 truncate">{val}</span> : <span className="text-neutral-400">---</span>;
        },
      },
    ],
    [],
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Запросы на аналоги"
        subtitle={`${requests.length} запросов`}
        breadcrumbs={[
          { label: 'Главная', href: '/' },
          { label: 'Спецификации', href: '/specifications' },
          { label: 'Запросы на аналоги' },
        ]}
        actions={
          <Button iconLeft={<Plus size={16} />}>Новый запрос</Button>
        }
        tabs={[
          { id: 'all', label: 'Все', count: tabCounts.all },
          { id: 'SUBMITTED', label: 'Поданные', count: tabCounts.submitted },
          { id: 'UNDER_REVIEW', label: 'На рассмотрении', count: tabCounts.under_review },
          { id: 'APPROVED', label: 'Утверждённые', count: tabCounts.approved },
          { id: 'REJECTED', label: 'Отклонённые', count: tabCounts.rejected },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as TabId)}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard icon={<FileText size={18} />} label="Всего запросов" value={metrics.total} />
        <MetricCard icon={<Clock size={18} />} label="В обработке" value={metrics.pending} />
        <MetricCard icon={<CheckCircle size={18} />} label="Утверждено" value={metrics.approved} />
        <MetricCard icon={<XCircle size={18} />} label="Отклонено" value={metrics.rejected} />
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input placeholder="Поиск по номеру, материалу, проекту..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>

      <DataTable<AnalogRequest>
        data={filtered ?? []}
        columns={columns}
        loading={isLoading}
        enableRowSelection
        enableColumnVisibility
        enableDensityToggle
        enableExport
        pageSize={20}
        emptyTitle="Нет запросов на аналоги"
        emptyDescription="Создайте первый запрос для подбора аналогов материалов"
      />
    </div>
  );
};

export default AnalogRequestsPage;
