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
import { t } from '@/i18n';

const statusColorMap: Record<string, string> = {
  ACTIVE: 'green',
  INACTIVE: 'gray',
  BLOCKED: 'red',
  PENDING: 'yellow',
};

const getStatusLabels = (): Record<ContractorStatus, string> => ({
  ACTIVE: t('selfEmployed.contractors.statusActive'),
  INACTIVE: t('selfEmployed.contractors.statusInactive'),
  BLOCKED: t('selfEmployed.contractors.statusBlocked'),
  PENDING: t('selfEmployed.contractors.statusPending'),
});

const taxStatusColorMap: Record<string, string> = {
  REGISTERED: 'green',
  UNREGISTERED: 'gray',
  SUSPENDED: 'yellow',
  REVOKED: 'red',
};

const getTaxStatusLabels = (): Record<TaxStatus, string> => ({
  REGISTERED: t('selfEmployed.contractors.taxStatusRegistered'),
  UNREGISTERED: t('selfEmployed.contractors.taxStatusUnregistered'),
  SUSPENDED: t('selfEmployed.contractors.taxStatusSuspended'),
  REVOKED: t('selfEmployed.contractors.taxStatusRevoked'),
});

const getStatusFilterOptions = () => [
  { value: '', label: t('selfEmployed.contractors.statusAll') },
  { value: 'ACTIVE', label: t('selfEmployed.contractors.statusActive') },
  { value: 'INACTIVE', label: t('selfEmployed.contractors.statusInactive') },
  { value: 'BLOCKED', label: t('selfEmployed.contractors.statusBlocked') },
  { value: 'PENDING', label: t('selfEmployed.contractors.statusPending') },
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
        header: t('selfEmployed.contractors.colFullName'),
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
        header: t('selfEmployed.contractors.colInn'),
        size: 140,
        cell: ({ getValue }) => (
          <span className="font-mono text-neutral-600 text-xs">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'phone',
        header: t('selfEmployed.contractors.colPhone'),
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
        header: t('selfEmployed.contractors.colStatus'),
        size: 140,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={statusColorMap}
            label={getStatusLabels()[getValue<ContractorStatus>()] ?? getValue<string>()}
          />
        ),
      },
      {
        accessorKey: 'taxStatus',
        header: t('selfEmployed.contractors.colTaxStatus'),
        size: 160,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={taxStatusColorMap}
            label={getTaxStatusLabels()[getValue<TaxStatus>()] ?? getValue<string>()}
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
        title={t('selfEmployed.contractors.title')}
        subtitle={t('selfEmployed.contractors.subtitle', { count: String(contractors.length) })}
        breadcrumbs={[
          { label: t('selfEmployed.contractors.breadcrumbHome'), href: '/' },
          { label: t('selfEmployed.contractors.breadcrumbSelfEmployed'), href: '/self-employed' },
          { label: t('selfEmployed.contractors.breadcrumbContractors') },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={() => navigate('/self-employed/payments')}>
              {t('selfEmployed.contractors.paymentsBtn')}
            </Button>
            <Button variant="secondary" onClick={() => navigate('/self-employed/registries')}>
              {t('selfEmployed.contractors.registriesBtn')}
            </Button>
            <Button iconLeft={<Plus size={16} />} onClick={() => navigate('/self-employed/contractors/new')}>
              {t('selfEmployed.contractors.newContractor')}
            </Button>
          </div>
        }
      />

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input
            placeholder={t('selfEmployed.contractors.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          options={getStatusFilterOptions()}
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
            label: t('selfEmployed.contractors.bulkDelete'),
            icon: <Trash2 size={13} />,
            variant: 'danger',
            onClick: async (rows) => {
              const ids = rows.map((r) => r.id);
              const isConfirmed = await confirm({
                title: t('selfEmployed.contractors.deleteConfirmTitle', { count: String(ids.length) }),
                description: t('selfEmployed.contractors.deleteConfirmDescription'),
                confirmLabel: t('selfEmployed.contractors.deleteConfirmLabel'),
                cancelLabel: t('selfEmployed.contractors.deleteConfirmCancel'),
              });
              if (!isConfirmed) return;
              deleteMutation.mutate(ids);
            },
          },
        ]}
        emptyTitle={t('selfEmployed.contractors.emptyTitle')}
        emptyDescription={t('selfEmployed.contractors.emptyDescription')}
      />
    </div>
  );
};

export default ContractorListPage;
