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
import { t } from '@/i18n';
import type { MonteCarloSimulation, SimulationStatus } from './types';

const statusColorMap: Record<string, BadgeColor> = {
  DRAFT: 'gray',
  RUNNING: 'yellow',
  COMPLETED: 'green',
  FAILED: 'red',
};

const getStatusLabels = (): Record<SimulationStatus, string> => ({
  DRAFT: t('monteCarlo.statusDraft'),
  RUNNING: t('monteCarlo.statusRunning'),
  COMPLETED: t('monteCarlo.statusCompleted'),
  FAILED: t('monteCarlo.statusFailed'),
});

const getStatusFilterOptions = () => [
  { value: '', label: t('monteCarlo.allStatuses') },
  { value: 'DRAFT', label: t('monteCarlo.statusDraft') },
  { value: 'RUNNING', label: t('monteCarlo.statusRunning') },
  { value: 'COMPLETED', label: t('monteCarlo.statusCompleted') },
  { value: 'FAILED', label: t('monteCarlo.statusFailed') },
];

const SimulationListPage: React.FC = () => {
  const navigate = useNavigate();
  const confirm = useConfirmDialog();
  const queryClient = useQueryClient();
  const statusLabels = getStatusLabels();
  const statusFilterOptions = getStatusFilterOptions();
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
        header: t('monteCarlo.colName'),
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
        header: t('common.status'),
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
        header: t('monteCarlo.iterations'),
        size: 120,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-neutral-600">{formatNumber(getValue<number>())}</span>
        ),
      },
      {
        id: 'p50',
        header: t('monteCarlo.colP50'),
        size: 110,
        cell: ({ row }) => (
          <span className="tabular-nums font-medium text-success-600">
            {row.original.results?.p50Duration ?? '---'}
          </span>
        ),
      },
      {
        id: 'p85',
        header: t('monteCarlo.colP85'),
        size: 110,
        cell: ({ row }) => (
          <span className="tabular-nums font-medium text-warning-600">
            {row.original.results?.p85Duration ?? '---'}
          </span>
        ),
      },
      {
        id: 'p95',
        header: t('monteCarlo.colP95'),
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
        title={t('monteCarlo.title')}
        subtitle={t('monteCarlo.subtitle', { count: String(simulations.length) })}
        breadcrumbs={[
          { label: t('nav.dashboard'), href: '/' },
          { label: t('monteCarlo.breadcrumb') },
        ]}
        actions={
          <Button iconLeft={<Plus size={16} />} onClick={() => navigate('/monte-carlo/new')}>
            {t('monteCarlo.newSimulation')}
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input
            placeholder={t('monteCarlo.searchPlaceholder')}
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
            label: t('common.delete'),
            icon: <Trash2 size={13} />,
            variant: 'danger',
            onClick: async (rows) => {
              const ids = rows.map((r) => r.id);
              const isConfirmed = await confirm({
                title: t('monteCarlo.deleteTitle', { count: String(ids.length) }),
                description: t('monteCarlo.deleteDescription'),
                confirmLabel: t('common.delete'),
                cancelLabel: t('common.cancel'),
              });
              if (!isConfirmed) return;
              deleteMutation.mutate(ids);
            },
          },
        ]}
        emptyTitle={t('monteCarlo.emptyTitle')}
        emptyDescription={t('monteCarlo.emptyDescription')}
      />
    </div>
  );
};

export default SimulationListPage;
