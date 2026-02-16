import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { Plus, Search, ClipboardCheck, CheckCircle2, XCircle, Clock, LayoutGrid } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { DataTable } from '@/design-system/components/DataTable';
import { EmptyState } from '@/design-system/components/EmptyState';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { MetricCard } from '@/design-system/components/MetricCard';
import { Input, Select } from '@/design-system/components/FormField';
import { closeoutApi } from '@/api/closeout';
import { formatDate, formatPercent } from '@/lib/format';
import type { CommissioningChecklist } from './types';

const statusColorMap: Record<string, 'gray' | 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'orange'> = {
  NOT_STARTED: 'gray',
  IN_PROGRESS: 'blue',
  COMPLETED: 'green',
  FAILED: 'red',
  ON_HOLD: 'orange',
};

const statusLabels: Record<string, string> = {
  NOT_STARTED: 'Не начат',
  IN_PROGRESS: 'В процессе',
  COMPLETED: 'Завершён',
  FAILED: 'Не пройден',
  ON_HOLD: 'Приостановлен',
};

type TabId = 'all' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';

const CommissioningListPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const {
    data,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['commissioning'],
    queryFn: () => closeoutApi.getCommissioningChecklists({ page: 0, size: 200 }),
  });

  const checklists = data?.content ?? [];

  const filtered = useMemo(() => {
    let result = checklists;

    if (activeTab === 'IN_PROGRESS') result = result.filter((checklist) => checklist.status === 'IN_PROGRESS');
    else if (activeTab === 'COMPLETED') result = result.filter((checklist) => checklist.status === 'COMPLETED');
    else if (activeTab === 'FAILED') result = result.filter((checklist) => checklist.status === 'FAILED');

    if (statusFilter) result = result.filter((checklist) => checklist.status === statusFilter);

    if (search.trim()) {
      const lower = search.toLowerCase();
      result = result.filter((checklist) => (
        checklist.checklistNumber.toLowerCase().includes(lower)
        || checklist.systemName.toLowerCase().includes(lower)
        || checklist.inspectorName.toLowerCase().includes(lower)
      ));
    }

    return result;
  }, [checklists, activeTab, statusFilter, search]);

  const counts = useMemo(() => ({
    all: checklists.length,
    in_progress: checklists.filter((checklist) => checklist.status === 'IN_PROGRESS').length,
    completed: checklists.filter((checklist) => checklist.status === 'COMPLETED').length,
    failed: checklists.filter((checklist) => checklist.status === 'FAILED').length,
  }), [checklists]);

  const avgCompletion = useMemo(() => {
    if (checklists.length === 0) return 0;
    return checklists.reduce((sum, checklist) => (
      sum + (checklist.totalItems > 0 ? (checklist.completedItems / checklist.totalItems) * 100 : 0)
    ), 0) / checklists.length;
  }, [checklists]);

  const columns = useMemo<ColumnDef<CommissioningChecklist, unknown>[]>(
    () => [
      {
        accessorKey: 'checklistNumber',
        header: '\u2116',
        size: 120,
        cell: ({ getValue }) => <span className="font-mono text-neutral-500 dark:text-neutral-400 text-xs">{getValue<string>()}</span>,
      },
      {
        accessorKey: 'systemName',
        header: 'Система',
        size: 240,
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-neutral-900 dark:text-neutral-100">{row.original.systemName}</p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{row.original.subsystem ?? row.original.projectName}</p>
          </div>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Статус',
        size: 140,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={statusColorMap}
            label={statusLabels[getValue<string>()] ?? getValue<string>()}
          />
        ),
      },
      {
        id: 'progress',
        header: 'Прогресс',
        size: 150,
        cell: ({ row }) => {
          const progressPercent = row.original.totalItems > 0
            ? (row.original.completedItems / row.original.totalItems) * 100
            : 0;
          return (
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                <div className="h-full bg-primary-500 rounded-full transition-all" style={{ width: `${progressPercent}%` }} />
              </div>
              <span className="text-xs text-neutral-600 tabular-nums w-10 text-right">{progressPercent.toFixed(0)}%</span>
            </div>
          );
        },
      },
      {
        accessorKey: 'passedItems',
        header: 'Прошли / Не прошли',
        size: 160,
        cell: ({ row }) => (
          <span className="text-sm">
            <span className="text-green-600 font-medium">{row.original.passedItems}</span>
            {' / '}
            <span className="text-danger-600 font-medium">{row.original.failedItems}</span>
          </span>
        ),
      },
      {
        accessorKey: 'inspectorName',
        header: 'Инспектор',
        size: 170,
      },
      {
        accessorKey: 'inspectionDate',
        header: 'Дата проверки',
        size: 130,
        cell: ({ getValue }) => <span className="tabular-nums">{formatDate(getValue<string>())}</span>,
      },
    ],
    [],
  );

  const handleRowClick = useCallback(
    (checklist: CommissioningChecklist) => navigate(`/closeout/commissioning/${checklist.id}`),
    [navigate],
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Пусконаладочные работы"
        subtitle={`${checklists.length} чек-листов в системе`}
        breadcrumbs={[
          { label: 'Главная', href: '/' },
          { label: 'Завершение', href: '/closeout/dashboard' },
          { label: 'Пусконаладка' },
        ]}
        actions={(
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              iconLeft={<LayoutGrid size={16} />}
              onClick={() => navigate('/closeout/commissioning/board')}
            >
              Доска
            </Button>
            <Button iconLeft={<Plus size={16} />}>
              Новый чек-лист
            </Button>
          </div>
        )}
        tabs={[
          { id: 'all', label: 'Все', count: counts.all },
          { id: 'IN_PROGRESS', label: 'В процессе', count: counts.in_progress },
          { id: 'COMPLETED', label: 'Завершены', count: counts.completed },
          { id: 'FAILED', label: 'Не пройдены', count: counts.failed },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as TabId)}
      />

      {isError && checklists.length === 0 ? (
        <EmptyState
          variant="ERROR"
          title="Не удалось загрузить чек-листы пусконаладки"
          description="Проверьте соединение и повторите попытку"
          actionLabel="Повторить"
          onAction={() => { void refetch(); }}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <MetricCard icon={<ClipboardCheck size={18} />} label="Всего чек-листов" value={counts.all} />
            <MetricCard icon={<Clock size={18} />} label="В процессе" value={counts.in_progress} subtitle="ожидают проверки" />
            <MetricCard icon={<CheckCircle2 size={18} />} label="Завершены" value={counts.completed} />
            <MetricCard icon={<XCircle size={18} />} label="Средняя готовность" value={formatPercent(avgCompletion)} />
          </div>

          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1 max-w-xs">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <Input
                placeholder="Поиск по номеру, системе..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="pl-9"
              />
            </div>
            <Select
              options={[
                { value: '', label: 'Все статусы' },
                ...Object.entries(statusLabels).map(([value, label]) => ({ value, label })),
              ]}
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="w-52"
            />
          </div>

          <DataTable<CommissioningChecklist>
            data={filtered}
            columns={columns}
            loading={isLoading}
            onRowClick={handleRowClick}
            enableRowSelection
            enableColumnVisibility
            enableDensityToggle
            enableExport
            pageSize={20}
            emptyTitle="Нет чек-листов пусконаладки"
            emptyDescription="Создайте первый чек-лист для начала проверок"
          />
        </>
      )}
    </div>
  );
};

export default CommissioningListPage;
