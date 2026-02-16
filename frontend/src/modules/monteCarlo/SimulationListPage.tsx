import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { Plus, Search, Trash2 } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { useConfirmDialog } from '@/design-system/components/ConfirmDialog/provider';
import { DataTable } from '@/design-system/components/DataTable';
import { StatusBadge, type BadgeColor } from '@/design-system/components/StatusBadge';
import { Input, Select } from '@/design-system/components/FormField';
import { monteCarloApi } from './api';
import { formatNumber } from '@/lib/format';
import type { MonteCarloSimulation, SimulationStatus } from './types';

const statusColorMap: Record<string, BadgeColor> = {
  DRAFT: 'gray',
  RUNNING: 'yellow',
  COMPLETED: 'green',
  FAILED: 'red',
};

const statusLabels: Record<SimulationStatus, string> = {
  DRAFT: 'Черновик',
  RUNNING: 'Выполняется',
  COMPLETED: 'Завершена',
  FAILED: 'Ошибка',
};

const statusFilterOptions = [
  { value: '', label: 'Все статусы' },
  { value: 'DRAFT', label: 'Черновик' },
  { value: 'RUNNING', label: 'Выполняется' },
  { value: 'COMPLETED', label: 'Завершена' },
  { value: 'FAILED', label: 'Ошибка' },
];

const SimulationListPage: React.FC = () => {
  const navigate = useNavigate();
  const confirm = useConfirmDialog();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const deleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      for (const id of ids) {
        await monteCarloApi.delete(id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monte-carlo'] });
    },
  });

  const { data: simulationsData, isLoading } = useQuery({
    queryKey: ['monte-carlo'],
    queryFn: () => monteCarloApi.getAll(),
  });

  const simulations = (simulationsData?.content && simulationsData.content.length > 0)
    ? simulationsData.content
    : [];

  const filtered = useMemo(() => {
    let result = simulations;
    if (statusFilter) {
      result = result.filter((s) => s.status === statusFilter);
    }
    if (search) {
      const lower = search.toLowerCase();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(lower) ||
          s.projectName?.toLowerCase().includes(lower),
      );
    }
    return result;
  }, [simulations, statusFilter, search]);

  const columns = useMemo<ColumnDef<MonteCarloSimulation, unknown>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Название',
        size: 280,
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-neutral-900 dark:text-neutral-100">{row.original.name}</p>
            {row.original.projectName && (
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{row.original.projectName}</p>
            )}
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
            colorMap={statusColorMap}
            label={statusLabels[getValue<SimulationStatus>()] ?? getValue<string>()}
          />
        ),
      },
      {
        accessorKey: 'iterations',
        header: 'Итераций',
        size: 120,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-neutral-600">{formatNumber(getValue<number>())}</span>
        ),
      },
      {
        id: 'p50',
        header: 'P50 (дней)',
        size: 110,
        cell: ({ row }) => (
          <span className="tabular-nums font-medium text-success-600">
            {row.original.results?.p50Duration ?? '---'}
          </span>
        ),
      },
      {
        id: 'p85',
        header: 'P85 (дней)',
        size: 110,
        cell: ({ row }) => (
          <span className="tabular-nums font-medium text-warning-600">
            {row.original.results?.p85Duration ?? '---'}
          </span>
        ),
      },
      {
        id: 'p95',
        header: 'P95 (дней)',
        size: 110,
        cell: ({ row }) => (
          <span className="tabular-nums font-medium text-danger-600">
            {row.original.results?.p95Duration ?? '---'}
          </span>
        ),
      },
    ],
    [],
  );

  const handleRowClick = useCallback(
    (simulation: MonteCarloSimulation) => navigate(`/monte-carlo/${simulation.id}`),
    [navigate],
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Симуляции Монте-Карло"
        subtitle={`${simulations.length} симуляций`}
        breadcrumbs={[
          { label: 'Главная', href: '/' },
          { label: 'Монте-Карло' },
        ]}
        actions={
          <Button iconLeft={<Plus size={16} />} onClick={() => navigate('/monte-carlo/new')}>
            Новая симуляция
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input
            placeholder="Поиск по названию, проекту..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          options={statusFilterOptions}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-44"
        />
      </div>

      {/* Table */}
      <DataTable<MonteCarloSimulation>
        data={filtered}
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
                title: `Удалить ${ids.length} симуляци(ю/й)?`,
                description: 'Операция необратима. Выбранные симуляции будут удалены.',
                confirmLabel: 'Удалить',
                cancelLabel: 'Отмена',
              });
              if (!isConfirmed) return;
              deleteMutation.mutate(ids);
            },
          },
        ]}
        emptyTitle="Нет симуляций"
        emptyDescription="Создайте первую симуляцию Монте-Карло"
      />
    </div>
  );
};

export default SimulationListPage;
