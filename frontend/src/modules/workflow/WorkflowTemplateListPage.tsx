import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { Plus, Search, GitBranch, Zap, PlayCircle, PauseCircle } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { DataTable } from '@/design-system/components/DataTable';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { MetricCard } from '@/design-system/components/MetricCard';
import { Input, Select } from '@/design-system/components/FormField';
import { workflowApi } from '@/api/workflow';
import { formatDate } from '@/lib/format';
import type { WorkflowDefinition, WorkflowStatus, EntityType } from './types';

const statusColorMap: Record<string, 'gray' | 'blue' | 'green' | 'yellow' | 'red' | 'purple'> = {
  ACTIVE: 'green',
  INACTIVE: 'gray',
  DRAFT: 'yellow',
};

const statusLabels: Record<string, string> = {
  ACTIVE: 'Активный',
  INACTIVE: 'Неактивный',
  DRAFT: 'Черновик',
};

const entityTypeLabels: Record<string, string> = {
  CONTRACT: 'Договор',
  DOCUMENT: 'Документ',
  PURCHASE_REQUEST: 'Заявка на закупку',
  INVOICE: 'Счёт',
  BUDGET: 'Бюджет',
  CHANGE_ORDER: 'Доп. соглашение',
};

type TabId = 'all' | 'ACTIVE' | 'DRAFT' | 'INACTIVE';

const WorkflowTemplateListPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [search, setSearch] = useState('');
  const [entityFilter, setEntityFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['workflows'],
    queryFn: () => workflowApi.getWorkflows(),
  });

  const workflows = data?.content ?? [];

  const filtered = useMemo(() => {
    let result = workflows;
    if (activeTab === 'ACTIVE') result = result.filter((w) => w.status === 'ACTIVE');
    else if (activeTab === 'DRAFT') result = result.filter((w) => w.status === 'DRAFT');
    else if (activeTab === 'INACTIVE') result = result.filter((w) => w.status === 'INACTIVE');

    if (entityFilter) result = result.filter((w) => w.entityType === entityFilter);
    if (search) {
      const lower = search.toLowerCase();
      result = result.filter(
        (w) =>
          w.name.toLowerCase().includes(lower) ||
          (w.description ?? '').toLowerCase().includes(lower) ||
          w.createdByName.toLowerCase().includes(lower),
      );
    }
    return result;
  }, [workflows, activeTab, entityFilter, search]);

  const counts = useMemo(() => ({
    all: workflows.length,
    active: workflows.filter((w) => w.status === 'ACTIVE').length,
    draft: workflows.filter((w) => w.status === 'DRAFT').length,
    inactive: workflows.filter((w) => w.status === 'INACTIVE').length,
  }), [workflows]);

  const columns = useMemo<ColumnDef<WorkflowDefinition, unknown>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Название',
        size: 280,
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-neutral-900 dark:text-neutral-100">{row.original.name}</p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 truncate max-w-[260px]">{row.original.description ?? '---'}</p>
          </div>
        ),
      },
      {
        accessorKey: 'entityType',
        header: 'Тип сущности',
        size: 160,
        cell: ({ getValue }) => (
          <span className="text-neutral-700 dark:text-neutral-300">{entityTypeLabels[getValue<string>()] ?? getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Статус',
        size: 130,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={statusColorMap}
            label={statusLabels[getValue<string>()] ?? getValue<string>()}
          />
        ),
      },
      {
        accessorKey: 'stepsCount',
        header: 'Шагов',
        size: 80,
        cell: ({ getValue }) => (
          <span className="font-mono text-neutral-600">{getValue<number>()}</span>
        ),
      },
      {
        accessorKey: 'version',
        header: 'Версия',
        size: 80,
        cell: ({ getValue }) => (
          <span className="font-mono text-xs text-primary-600">v{getValue<number>()}</span>
        ),
      },
      {
        accessorKey: 'createdByName',
        header: 'Автор',
        size: 150,
      },
      {
        accessorKey: 'updatedAt',
        header: 'Обновлён',
        size: 120,
        cell: ({ getValue }) => (
          <span className="tabular-nums">{formatDate(getValue<string>())}</span>
        ),
      },
      {
        id: 'actions',
        header: '',
        size: 80,
        cell: ({ row }) => (
          <Button
            variant="ghost"
            size="xs"
            onClick={(e) => { e.stopPropagation(); navigate(`/workflows/${row.original.id}/designer`); }}
          >
            Открыть
          </Button>
        ),
      },
    ],
    [navigate],
  );

  const handleRowClick = useCallback(
    (wf: WorkflowDefinition) => navigate(`/workflows/${wf.id}/designer`),
    [navigate],
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Бизнес-процессы"
        subtitle={`${workflows.length} шаблонов в системе`}
        breadcrumbs={[
          { label: 'Главная', href: '/' },
          { label: 'Бизнес-процессы' },
        ]}
        actions={
          <Button iconLeft={<Plus size={16} />} onClick={() => navigate('/workflows/new/designer')}>
            Новый процесс
          </Button>
        }
        tabs={[
          { id: 'all', label: 'Все', count: counts.all },
          { id: 'ACTIVE', label: 'Активные', count: counts.active },
          { id: 'DRAFT', label: 'Черновики', count: counts.draft },
          { id: 'INACTIVE', label: 'Неактивные', count: counts.inactive },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as TabId)}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard icon={<GitBranch size={18} />} label="Всего процессов" value={counts.all} />
        <MetricCard icon={<PlayCircle size={18} />} label="Активные" value={counts.active} />
        <MetricCard icon={<Zap size={18} />} label="Черновики" value={counts.draft} subtitle="ожидают настройки" />
        <MetricCard icon={<PauseCircle size={18} />} label="Неактивные" value={counts.inactive} />
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input placeholder="Поиск по названию..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select
          options={[
            { value: '', label: 'Все типы сущностей' },
            ...Object.entries(entityTypeLabels).map(([value, label]) => ({ value, label })),
          ]}
          value={entityFilter}
          onChange={(e) => setEntityFilter(e.target.value)}
          className="w-52"
        />
      </div>

      <DataTable<WorkflowDefinition>
        data={filtered ?? []}
        columns={columns}
        loading={isLoading}
        onRowClick={handleRowClick}
        enableRowSelection
        enableColumnVisibility
        enableDensityToggle
        enableExport
        pageSize={20}
        emptyTitle="Нет бизнес-процессов"
        emptyDescription="Создайте первый шаблон процесса"
      />
    </div>
  );
};

export default WorkflowTemplateListPage;
