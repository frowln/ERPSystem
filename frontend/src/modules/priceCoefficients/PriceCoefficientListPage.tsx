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
import { priceCoefficientApi } from './api';
import { formatDate, formatNumber } from '@/lib/format';
import type { PriceCoefficient, PriceCoefficientType, PriceCoefficientStatus } from './types';

const statusColorMap: Record<string, string> = {
  ACTIVE: 'green',
  INACTIVE: 'gray',
  DRAFT: 'yellow',
  EXPIRED: 'red',
};

const statusLabels: Record<string, string> = {
  ACTIVE: 'Активен',
  INACTIVE: 'Неактивен',
  DRAFT: 'Черновик',
  EXPIRED: 'Истёк',
};

const typeLabels: Record<PriceCoefficientType, string> = {
  REGIONAL: 'Региональный',
  SEASONAL: 'Сезонный',
  MATERIAL: 'Материалы',
  LABOR: 'Трудозатраты',
  EQUIPMENT: 'Оборудование',
  OVERHEAD: 'Накладные',
  CUSTOM: 'Пользовательский',
};

const typeFilterOptions = [
  { value: '', label: 'Все типы' },
  { value: 'REGIONAL', label: 'Региональный' },
  { value: 'SEASONAL', label: 'Сезонный' },
  { value: 'MATERIAL', label: 'Материалы' },
  { value: 'LABOR', label: 'Трудозатраты' },
  { value: 'EQUIPMENT', label: 'Оборудование' },
  { value: 'OVERHEAD', label: 'Накладные' },
  { value: 'CUSTOM', label: 'Пользовательский' },
];

const statusFilterOptions = [
  { value: '', label: 'Все статусы' },
  { value: 'ACTIVE', label: 'Активен' },
  { value: 'INACTIVE', label: 'Неактивен' },
  { value: 'DRAFT', label: 'Черновик' },
  { value: 'EXPIRED', label: 'Истёк' },
];

const PriceCoefficientListPage: React.FC = () => {
  const navigate = useNavigate();
  const confirm = useConfirmDialog();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const deleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      for (const id of ids) {
        await priceCoefficientApi.delete(id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['price-coefficients'] });
    },
  });

  const { data: coefficientsData, isLoading } = useQuery({
    queryKey: ['price-coefficients'],
    queryFn: () => priceCoefficientApi.getAll(),
  });

  const coefficients = (coefficientsData?.content && coefficientsData.content.length > 0)
    ? coefficientsData.content
    : [];

  const filtered = useMemo(() => {
    let result = coefficients;

    if (typeFilter) {
      result = result.filter((c) => c.type === typeFilter);
    }
    if (statusFilter) {
      result = result.filter((c) => c.status === statusFilter);
    }
    if (search) {
      const lower = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(lower) ||
          c.code.toLowerCase().includes(lower),
      );
    }

    return result;
  }, [coefficients, typeFilter, statusFilter, search]);

  const columns = useMemo<ColumnDef<PriceCoefficient, unknown>[]>(
    () => [
      {
        accessorKey: 'code',
        header: 'Код',
        size: 150,
        cell: ({ getValue }) => (
          <span className="font-mono text-neutral-500 dark:text-neutral-400 text-xs">{getValue<string>()}</span>
        ),
      },
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
        accessorKey: 'type',
        header: 'Тип',
        size: 150,
        cell: ({ getValue }) => (
          <span className="text-neutral-600">{typeLabels[getValue<PriceCoefficientType>()] ?? getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'value',
        header: 'Значение',
        size: 120,
        cell: ({ getValue }) => (
          <span className="font-medium tabular-nums text-right block">{getValue<number>().toFixed(4)}</span>
        ),
      },
      {
        accessorKey: 'effectiveFrom',
        header: 'Действует с',
        size: 130,
        cell: ({ getValue }) => (
          <span className="tabular-nums">{formatDate(getValue<string>())}</span>
        ),
      },
      {
        accessorKey: 'effectiveTo',
        header: 'Действует до',
        size: 130,
        cell: ({ getValue }) => (
          <span className="tabular-nums">{getValue<string>() ? formatDate(getValue<string>()) : 'Бессрочно'}</span>
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
    ],
    [],
  );

  const handleRowClick = useCallback(
    (coefficient: PriceCoefficient) => navigate(`/price-coefficients/${coefficient.id}`),
    [navigate],
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Ценовые коэффициенты"
        subtitle={`${coefficients.length} коэффициентов в системе`}
        breadcrumbs={[
          { label: 'Главная', href: '/' },
          { label: 'Ценовые коэффициенты' },
        ]}
        actions={
          <Button iconLeft={<Plus size={16} />} onClick={() => navigate('/price-coefficients/new')}>
            Новый коэффициент
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input
            placeholder="Поиск по коду, названию..."
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
        <Select
          options={statusFilterOptions}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-44"
        />
      </div>

      {/* Table */}
      <DataTable<PriceCoefficient>
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
                title: `Удалить ${ids.length} коэффициент(ов)?`,
                description: 'Операция необратима. Выбранные коэффициенты будут удалены.',
                confirmLabel: 'Удалить',
                cancelLabel: 'Отмена',
              });
              if (!isConfirmed) return;
              deleteMutation.mutate(ids);
            },
          },
        ]}
        emptyTitle="Нет коэффициентов"
        emptyDescription="Создайте первый ценовой коэффициент"
      />
    </div>
  );
};

export default PriceCoefficientListPage;
