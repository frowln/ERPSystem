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
import { selfEmployedApi } from './api';
import type { SelfEmployedContractor, ContractorStatus, TaxStatus } from './types';

const statusColorMap: Record<string, string> = {
  ACTIVE: 'green',
  INACTIVE: 'gray',
  BLOCKED: 'red',
  PENDING: 'yellow',
};

const statusLabels: Record<ContractorStatus, string> = {
  ACTIVE: 'Активен',
  INACTIVE: 'Неактивен',
  BLOCKED: 'Заблокирован',
  PENDING: 'Ожидание',
};

const taxStatusColorMap: Record<string, string> = {
  REGISTERED: 'green',
  UNREGISTERED: 'gray',
  SUSPENDED: 'yellow',
  REVOKED: 'red',
};

const taxStatusLabels: Record<TaxStatus, string> = {
  REGISTERED: 'Зарегистрирован',
  UNREGISTERED: 'Не зарегистрирован',
  SUSPENDED: 'Приостановлен',
  REVOKED: 'Аннулирован',
};

const statusFilterOptions = [
  { value: '', label: 'Все статусы' },
  { value: 'ACTIVE', label: 'Активен' },
  { value: 'INACTIVE', label: 'Неактивен' },
  { value: 'BLOCKED', label: 'Заблокирован' },
  { value: 'PENDING', label: 'Ожидание' },
];

const ContractorListPage: React.FC = () => {
  const navigate = useNavigate();
  const confirm = useConfirmDialog();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const deleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      for (const id of ids) {
        await selfEmployedApi.deleteContractor(id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['self-employed-contractors'] });
    },
  });

  const { data: contractorsData, isLoading } = useQuery({
    queryKey: ['self-employed-contractors'],
    queryFn: () => selfEmployedApi.getContractors(),
  });

  const contractors = (contractorsData?.content && contractorsData.content.length > 0)
    ? contractorsData.content
    : [];

  const filtered = useMemo(() => {
    let result = contractors;
    if (statusFilter) {
      result = result.filter((c) => c.status === statusFilter);
    }
    if (search) {
      const lower = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.fullName.toLowerCase().includes(lower) ||
          c.inn.includes(search) ||
          c.email?.toLowerCase().includes(lower) ||
          c.phone?.includes(search),
      );
    }
    return result;
  }, [contractors, statusFilter, search]);

  const columns = useMemo<ColumnDef<SelfEmployedContractor, unknown>[]>(
    () => [
      {
        accessorKey: 'fullName',
        header: 'ФИО',
        size: 250,
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-neutral-900 dark:text-neutral-100">{row.original.fullName}</p>
            {row.original.specialization && (
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{row.original.specialization}</p>
            )}
          </div>
        ),
      },
      {
        accessorKey: 'inn',
        header: 'ИНН',
        size: 140,
        cell: ({ getValue }) => (
          <span className="font-mono text-neutral-600 text-xs">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'phone',
        header: 'Телефон',
        size: 160,
        cell: ({ getValue }) => (
          <span className="text-neutral-600">{getValue<string>() ?? '---'}</span>
        ),
      },
      {
        accessorKey: 'EMAIL',
        header: 'Email',
        size: 200,
        cell: ({ getValue }) => (
          <span className="text-neutral-600">{getValue<string>() ?? '---'}</span>
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
            label={statusLabels[getValue<ContractorStatus>()] ?? getValue<string>()}
          />
        ),
      },
      {
        accessorKey: 'taxStatus',
        header: 'Статус НПД',
        size: 160,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={taxStatusColorMap}
            label={taxStatusLabels[getValue<TaxStatus>()] ?? getValue<string>()}
          />
        ),
      },
    ],
    [],
  );

  const handleRowClick = useCallback(
    (contractor: SelfEmployedContractor) => navigate(`/self-employed/contractors/${contractor.id}/edit`),
    [navigate],
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Реестр самозанятых"
        subtitle={`${contractors.length} исполнителей`}
        breadcrumbs={[
          { label: 'Главная', href: '/' },
          { label: 'Самозанятые', href: '/self-employed' },
          { label: 'Исполнители' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={() => navigate('/self-employed/payments')}>
              Выплаты
            </Button>
            <Button variant="secondary" onClick={() => navigate('/self-employed/registries')}>
              Реестры
            </Button>
            <Button iconLeft={<Plus size={16} />} onClick={() => navigate('/self-employed/contractors/new')}>
              Новый исполнитель
            </Button>
          </div>
        }
      />

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input
            placeholder="Поиск по ФИО, ИНН..."
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
      <DataTable<SelfEmployedContractor>
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
                title: `Удалить ${ids.length} исполнител(ей)?`,
                description: 'Операция необратима. Выбранные карточки исполнителей будут удалены.',
                confirmLabel: 'Удалить',
                cancelLabel: 'Отмена',
              });
              if (!isConfirmed) return;
              deleteMutation.mutate(ids);
            },
          },
        ]}
        emptyTitle="Нет исполнителей"
        emptyDescription="Добавьте первого самозанятого исполнителя"
      />
    </div>
  );
};

export default ContractorListPage;
