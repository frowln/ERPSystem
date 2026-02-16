import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { Plus, Search, FileQuestion, Clock, AlertTriangle, Timer, Trash2 } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { useConfirmDialog } from '@/design-system/components/ConfirmDialog/provider';
import { DataTable } from '@/design-system/components/DataTable';
import { MetricCard } from '@/design-system/components/MetricCard';
import {
  StatusBadge,
  rfiStatusColorMap,
  rfiStatusLabels,
  rfiPriorityColorMap,
  rfiPriorityLabels,
} from '@/design-system/components/StatusBadge';
import { Input, Select } from '@/design-system/components/FormField';
import { rfiApi } from '@/api/rfi';
import { formatDate } from '@/lib/format';
import toast from 'react-hot-toast';
import type { Rfi } from './types';
import { RfiCreateModal } from './RfiCreateModal';

type TabId = 'all' | 'OPEN' | 'ANSWERED' | 'OVERDUE' | 'CLOSED';

const statusFilterOptions = [
  { value: '', label: 'Все статусы' },
  { value: 'DRAFT', label: 'Черновик' },
  { value: 'OPEN', label: 'Открыт' },
  { value: 'ANSWERED', label: 'Отвечен' },
  { value: 'CLOSED', label: 'Закрыт' },
  { value: 'OVERDUE', label: 'Просрочен' },
];

const priorityFilterOptions = [
  { value: '', label: 'Все приоритеты' },
  { value: 'LOW', label: 'Низкий' },
  { value: 'MEDIUM', label: 'Средний' },
  { value: 'HIGH', label: 'Высокий' },
  { value: 'CRITICAL', label: 'Критический' },
];

const RfiListPage: React.FC = () => {
  const navigate = useNavigate();
  const confirm = useConfirmDialog();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const deleteRfiMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      for (const id of ids) {
        await rfiApi.deleteRfi(id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rfis'] });
      toast.success('RFI удалён(ы)');
    },
    onError: () => {
      toast.error('Ошибка при удалении');
    },
  });

  const { data: rfiData, isLoading } = useQuery({
    queryKey: ['rfis'],
    queryFn: () => rfiApi.getRfis(),
  });

  const rfis = rfiData?.content ?? [];

  const filteredRfis = useMemo(() => {
    let filtered = rfis;

    if (activeTab === 'OPEN') {
      filtered = filtered.filter((r) => r.status === 'OPEN');
    } else if (activeTab === 'ANSWERED') {
      filtered = filtered.filter((r) => r.status === 'ANSWERED');
    } else if (activeTab === 'OVERDUE') {
      filtered = filtered.filter((r) => r.status === 'OVERDUE');
    } else if (activeTab === 'CLOSED') {
      filtered = filtered.filter((r) => r.status === 'CLOSED');
    }

    if (priorityFilter) {
      filtered = filtered.filter((r) => r.priority === priorityFilter);
    }

    if (search) {
      const lower = search.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.number.toLowerCase().includes(lower) ||
          r.subject.toLowerCase().includes(lower) ||
          (r.assignedToName ?? '').toLowerCase().includes(lower),
      );
    }

    return filtered;
  }, [rfis, activeTab, priorityFilter, search]);

  const tabCounts = useMemo(() => ({
    all: rfis.length,
    open: rfis.filter((r) => r.status === 'OPEN').length,
    answered: rfis.filter((r) => r.status === 'ANSWERED').length,
    overdue: rfis.filter((r) => r.status === 'OVERDUE').length,
    closed: rfis.filter((r) => r.status === 'CLOSED').length,
  }), [rfis]);

  const metrics = useMemo(() => {
    const openCount = rfis.filter((r) => r.status === 'OPEN' || r.status === 'OVERDUE').length;
    const overdueCount = rfis.filter((r) => r.status === 'OVERDUE').length;
    const answeredRfis = rfis.filter((r) => r.answeredDate && r.createdAt);
    const avgResponseDays = answeredRfis.length > 0
      ? answeredRfis.reduce((sum, r) => {
          const created = new Date(r.createdAt).getTime();
          const answered = new Date(r.answeredDate!).getTime();
          return sum + (answered - created) / (1000 * 60 * 60 * 24);
        }, 0) / answeredRfis.length
      : 0;

    return { total: rfis.length, open: openCount, overdue: overdueCount, avgResponse: avgResponseDays };
  }, [rfis]);

  const columns = useMemo<ColumnDef<Rfi, unknown>[]>(
    () => [
      {
        accessorKey: 'number',
        header: '\u2116',
        size: 110,
        cell: ({ getValue }) => (
          <span className="font-mono text-neutral-500 dark:text-neutral-400 text-xs">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'subject',
        header: 'Тема',
        size: 300,
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-neutral-900 dark:text-neutral-100 truncate max-w-[280px]">{row.original.subject}</p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{row.original.specSection ?? '---'}</p>
          </div>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Статус',
        size: 130,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={rfiStatusColorMap}
            label={rfiStatusLabels[getValue<string>()] ?? getValue<string>()}
          />
        ),
      },
      {
        accessorKey: 'priority',
        header: 'Приоритет',
        size: 120,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={rfiPriorityColorMap}
            label={rfiPriorityLabels[getValue<string>()] ?? getValue<string>()}
          />
        ),
      },
      {
        accessorKey: 'assignedToName',
        header: 'Ответственный',
        size: 160,
        cell: ({ getValue }) => (
          <span className="text-neutral-700 dark:text-neutral-300">{getValue<string>() ?? '---'}</span>
        ),
      },
      {
        accessorKey: 'dueDate',
        header: 'Срок',
        size: 120,
        cell: ({ row }) => {
          const dueDate = row.original.dueDate;
          const isOverdue = dueDate && new Date(dueDate) < new Date() && !['CLOSED', 'ANSWERED'].includes(row.original.status);
          return (
            <span className={isOverdue ? 'text-danger-600 font-medium tabular-nums' : 'tabular-nums text-neutral-700 dark:text-neutral-300'}>
              {formatDate(dueDate)}
            </span>
          );
        },
      },
      {
        id: 'actions',
        header: '',
        size: 80,
        cell: ({ row }) => (
          <Button
            variant="ghost"
            size="xs"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/rfis/${row.original.id}`);
            }}
          >
            Открыть
          </Button>
        ),
      },
    ],
    [navigate],
  );

  const handleRowClick = useCallback(
    (rfi: Rfi) => navigate(`/rfis/${rfi.id}`),
    [navigate],
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Запросы информации (RFI)"
        subtitle={`${rfis.length} запросов в системе`}
        breadcrumbs={[
          { label: 'Главная', href: '/' },
          { label: 'RFI' },
        ]}
        actions={
          <Button iconLeft={<Plus size={16} />} onClick={() => setCreateModalOpen(true)}>
            Новый RFI
          </Button>
        }
        tabs={[
          { id: 'all', label: 'Все', count: tabCounts.all },
          { id: 'OPEN', label: 'Открытые', count: tabCounts.open },
          { id: 'ANSWERED', label: 'Отвеченные', count: tabCounts.answered },
          { id: 'OVERDUE', label: 'Просроченные', count: tabCounts.overdue },
          { id: 'CLOSED', label: 'Закрытые', count: tabCounts.closed },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as TabId)}
      />

      {/* Metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard
          icon={<FileQuestion size={18} />}
          label="Всего RFI"
          value={metrics.total}
        />
        <MetricCard
          icon={<Clock size={18} />}
          label="Открытые"
          value={metrics.open}
          trend={{ direction: metrics.open > 3 ? 'up' : 'neutral', value: `${metrics.open} шт.` }}
        />
        <MetricCard
          icon={<AlertTriangle size={18} />}
          label="Просроченные"
          value={metrics.overdue}
          trend={{ direction: metrics.overdue > 0 ? 'down' : 'neutral', value: metrics.overdue > 0 ? 'Требуют внимания' : 'Нет' }}
        />
        <MetricCard
          icon={<Timer size={18} />}
          label="Среднее время ответа"
          value={`${metrics.avgResponse.toFixed(1)} дн.`}
        />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input
            placeholder="Поиск по номеру, теме..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          options={priorityFilterOptions}
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="w-48"
        />
      </div>

      {/* Table */}
      <DataTable<Rfi>
        data={filteredRfis}
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
            label: 'Удалить',
            icon: <Trash2 size={13} />,
            variant: 'danger',
            onClick: async (rows) => {
              const ids = rows.map((r) => r.id);
              const isConfirmed = await confirm({
                title: `Удалить ${ids.length} RFI?`,
                description: 'Операция необратима. Выбранные запросы информации будут удалены.',
                confirmLabel: 'Удалить',
                cancelLabel: 'Отмена',
              });
              if (!isConfirmed) return;
              deleteRfiMutation.mutate(ids);
            },
          },
        ]}
        emptyTitle="Нет запросов информации"
        emptyDescription="Создайте первый RFI для начала работы"
      />

      <RfiCreateModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
      />
    </div>
  );
};

export default RfiListPage;
