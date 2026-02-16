import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { Plus, Search, Trash2 } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { useConfirmDialog } from '@/design-system/components/ConfirmDialog/provider';
import { DataTable } from '@/design-system/components/DataTable';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { Input, Select } from '@/design-system/components/FormField';
import { taxRiskApi } from './api';
import { formatDate } from '@/lib/format';
import type { TaxRiskAssessment, RiskLevel, TaxRiskStatus } from './types';

const riskLevelColorMap: Record<string, string> = {
  LOW: 'green',
  MEDIUM: 'yellow',
  HIGH: 'orange',
  CRITICAL: 'red',
};

const riskLevelLabels: Record<RiskLevel, string> = {
  LOW: 'Низкий',
  MEDIUM: 'Средний',
  HIGH: 'Высокий',
  CRITICAL: 'Критический',
};

const statusColorMap: Record<string, string> = {
  DRAFT: 'gray',
  IN_PROGRESS: 'yellow',
  COMPLETED: 'blue',
  REVIEWED: 'green',
};

const statusLabels: Record<TaxRiskStatus, string> = {
  DRAFT: 'Черновик',
  IN_PROGRESS: 'В работе',
  COMPLETED: 'Завершена',
  REVIEWED: 'Проверена',
};

const riskFilterOptions = [
  { value: '', label: 'Все уровни' },
  { value: 'LOW', label: 'Низкий' },
  { value: 'MEDIUM', label: 'Средний' },
  { value: 'HIGH', label: 'Высокий' },
  { value: 'CRITICAL', label: 'Критический' },
];

const statusFilterOptions = [
  { value: '', label: 'Все статусы' },
  { value: 'DRAFT', label: 'Черновик' },
  { value: 'IN_PROGRESS', label: 'В работе' },
  { value: 'COMPLETED', label: 'Завершена' },
  { value: 'REVIEWED', label: 'Проверена' },
];

const TaxRiskListPage: React.FC = () => {
  const navigate = useNavigate();
  const confirm = useConfirmDialog();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const deleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      for (const id of ids) {
        await taxRiskApi.delete(id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tax-risks'] });
    },
  });

  const { data: assessmentsData, isLoading } = useQuery({
    queryKey: ['tax-risks'],
    queryFn: () => taxRiskApi.getAll(),
  });

  const assessments = (assessmentsData?.content && assessmentsData.content.length > 0)
    ? assessmentsData.content
    : [];

  const filtered = useMemo(() => {
    let result = assessments;
    if (riskFilter) {
      result = result.filter((a) => a.riskLevel === riskFilter);
    }
    if (statusFilter) {
      result = result.filter((a) => a.status === statusFilter);
    }
    if (search) {
      const lower = search.toLowerCase();
      result = result.filter(
        (a) =>
          a.name.toLowerCase().includes(lower) ||
          a.projectName?.toLowerCase().includes(lower),
      );
    }
    return result;
  }, [assessments, riskFilter, statusFilter, search]);

  const columns = useMemo<ColumnDef<TaxRiskAssessment, unknown>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Название',
        size: 300,
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
        accessorKey: 'assessmentDate',
        header: 'Дата оценки',
        size: 130,
        cell: ({ getValue }) => (
          <span className="tabular-nums">{formatDate(getValue<string>())}</span>
        ),
      },
      {
        accessorKey: 'riskLevel',
        header: 'Уровень риска',
        size: 150,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={riskLevelColorMap}
            label={riskLevelLabels[getValue<RiskLevel>()] ?? getValue<string>()}
          />
        ),
      },
      {
        accessorKey: 'overallScore',
        header: 'Балл',
        size: 100,
        cell: ({ getValue }) => {
          const score = getValue<number>();
          const color = score >= 75 ? 'text-danger-600' : score >= 50 ? 'text-warning-600' : score >= 25 ? 'text-yellow-600' : 'text-success-600';
          return (
            <span className={`font-semibold tabular-nums ${color}`}>{score}</span>
          );
        },
      },
      {
        accessorKey: 'status',
        header: 'Статус',
        size: 130,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={statusColorMap}
            label={statusLabels[getValue<TaxRiskStatus>()] ?? getValue<string>()}
          />
        ),
      },
    ],
    [],
  );

  const handleRowClick = useCallback(
    (assessment: TaxRiskAssessment) => navigate(`/tax-risk/${assessment.id}`),
    [navigate],
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Оценка налоговых рисков"
        subtitle={`${assessments.length} оценок в системе`}
        breadcrumbs={[
          { label: 'Главная', href: '/' },
          { label: 'Налоговые риски' },
        ]}
        actions={
          <Button iconLeft={<Plus size={16} />} onClick={() => navigate('/tax-risk/new')}>
            Новая оценка
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
          options={riskFilterOptions}
          value={riskFilter}
          onChange={(e) => setRiskFilter(e.target.value)}
          className="w-44"
        />
        <Select
          options={statusFilterOptions}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-44"
        />
      </div>

      {/* Table */}
      <DataTable<TaxRiskAssessment>
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
                title: `Удалить ${ids.length} оценк(у/и)?`,
                description: 'Операция необратима. Выбранные оценки будут удалены.',
                confirmLabel: 'Удалить',
                cancelLabel: 'Отмена',
              });
              if (!isConfirmed) return;
              deleteMutation.mutate(ids);
            },
          },
        ]}
        emptyTitle="Нет оценок"
        emptyDescription="Создайте первую оценку налоговых рисков"
      />
    </div>
  );
};

export default TaxRiskListPage;
