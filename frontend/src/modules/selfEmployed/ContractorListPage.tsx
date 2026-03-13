import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { Plus, Search, Trash2, ShieldCheck } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { useConfirmDialog } from '@/design-system/components/ConfirmDialog/provider';
import { DataTable } from '@/design-system/components/DataTable';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { Input, Select } from '@/design-system/components/FormField';
import { selfEmployedApi } from './api';
import { formatMoney } from '@/lib/format';
import type { SelfEmployedContractor, ContractorStatus, NpdStatus, ContractType } from './types';
import { t } from '@/i18n';
import toast from 'react-hot-toast';

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

const npdStatusColorMap: Record<string, string> = {
  ACTIVE: 'green',
  INACTIVE: 'gray',
  NOT_REGISTERED: 'red',
  UNKNOWN: 'yellow',
};

const getNpdStatusLabels = (): Record<NpdStatus, string> => ({
  ACTIVE: t('selfEmployed.contractors.npdActive'),
  INACTIVE: t('selfEmployed.contractors.npdInactive'),
  NOT_REGISTERED: t('selfEmployed.contractors.npdNotRegistered'),
  UNKNOWN: t('selfEmployed.contractors.npdUnknown'),
});

const getContractTypeLabels = (): Record<ContractType, string> => ({
  GPC: t('selfEmployed.contractors.contractTypeGpc'),
  SERVICE: t('selfEmployed.contractors.contractTypeService'),
  SUBCONTRACT: t('selfEmployed.contractors.contractTypeSubcontract'),
});

const getStatusFilterOptions = () => [
  { value: '', label: t('selfEmployed.contractors.statusAll') },
  { value: 'ACTIVE', label: t('selfEmployed.contractors.statusActive') },
  { value: 'INACTIVE', label: t('selfEmployed.contractors.statusInactive') },
  { value: 'BLOCKED', label: t('selfEmployed.contractors.statusBlocked') },
  { value: 'PENDING', label: t('selfEmployed.contractors.statusPending') },
];

const getNpdFilterOptions = () => [
  { value: '', label: t('selfEmployed.contractors.npdAll') },
  { value: 'ACTIVE', label: t('selfEmployed.contractors.npdActive') },
  { value: 'INACTIVE', label: t('selfEmployed.contractors.npdInactive') },
  { value: 'NOT_REGISTERED', label: t('selfEmployed.contractors.npdNotRegistered') },
  { value: 'UNKNOWN', label: t('selfEmployed.contractors.npdUnknown') },
];

const getContractTypeFilterOptions = () => [
  { value: '', label: t('selfEmployed.contractors.contractTypeAll') },
  { value: 'GPC', label: t('selfEmployed.contractors.contractTypeGpc') },
  { value: 'SERVICE', label: t('selfEmployed.contractors.contractTypeService') },
  { value: 'SUBCONTRACT', label: t('selfEmployed.contractors.contractTypeSubcontract') },
];

const ContractorListPage: React.FC = () => {
  const navigate = useNavigate();
  const confirm = useConfirmDialog();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [npdFilter, setNpdFilter] = useState('');
  const [contractTypeFilter, setContractTypeFilter] = useState('');

  const deleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      for (const id of ids) {
        await selfEmployedApi.deleteContractor(id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['self-employed-contractors'] });
      toast.success(t('selfEmployed.contractors.deleteSuccess'));
    },
    onError: () => {
      toast.error(t('common.operationError'));
    },
  });

  const bulkVerifyMutation = useMutation({
    mutationFn: (ids: string[]) => selfEmployedApi.bulkVerifyNpd(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['self-employed-contractors'] });
      toast.success(t('selfEmployed.contractors.npdVerifySuccess'));
    },
    onError: () => {
      toast.error(t('selfEmployed.contractors.npdVerifyError'));
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
    if (npdFilter) {
      result = result.filter((c) => c.npdStatus === npdFilter);
    }
    if (contractTypeFilter) {
      result = result.filter((c) => c.contractType === contractTypeFilter);
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
  }, [contractors, statusFilter, npdFilter, contractTypeFilter, search]);

  const columns = useMemo<ColumnDef<SelfEmployedContractor, unknown>[]>(
    () => [
      {
        accessorKey: 'fullName',
        header: t('selfEmployed.contractors.colFullName'),
        size: 220,
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
          <span className="font-mono text-neutral-600 dark:text-neutral-400 text-xs">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'npdStatus',
        header: t('selfEmployed.contractors.colNpdStatus'),
        size: 150,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={npdStatusColorMap}
            label={getNpdStatusLabels()[getValue<NpdStatus>()] ?? getValue<string>()}
          />
        ),
      },
      {
        accessorKey: 'contractType',
        header: t('selfEmployed.contractors.colContractType'),
        size: 130,
        cell: ({ getValue }) => {
          const val = getValue<ContractType>();
          return (
            <span className="text-neutral-700 dark:text-neutral-300 text-sm">
              {val ? getContractTypeLabels()[val] : '---'}
            </span>
          );
        },
      },
      {
        accessorKey: 'specialization',
        header: t('selfEmployed.contractors.colSpecialization'),
        size: 160,
        cell: ({ getValue }) => (
          <span className="text-neutral-600 dark:text-neutral-400">{getValue<string>() ?? '---'}</span>
        ),
      },
      {
        accessorKey: 'hourlyRate',
        header: t('selfEmployed.contractors.colHourlyRate'),
        size: 120,
        cell: ({ getValue }) => {
          const rate = getValue<number>();
          return (
            <span className="font-medium tabular-nums text-right block">
              {rate != null ? formatMoney(rate) : '---'}
            </span>
          );
        },
      },
      {
        accessorKey: 'totalPaid',
        header: t('selfEmployed.contractors.colTotalPaid'),
        size: 140,
        cell: ({ getValue }) => (
          <span className="font-medium tabular-nums text-right block">
            {formatMoney(getValue<number>() ?? 0)}
          </span>
        ),
      },
      {
        accessorKey: 'status',
        header: t('selfEmployed.contractors.colStatus'),
        size: 130,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={statusColorMap}
            label={getStatusLabels()[getValue<ContractorStatus>()] ?? getValue<string>()}
          />
        ),
      },
    ],
    [],
  );

  const handleRowClick = useCallback(
    (contractor: SelfEmployedContractor) => navigate(`/self-employed/${contractor.id}`),
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
            <Button iconLeft={<Plus size={16} />} onClick={() => navigate('/self-employed/new')}>
              {t('selfEmployed.contractors.newContractor')}
            </Button>
          </div>
        }
      />

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 max-w-xs min-w-[200px]">
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
        <Select
          options={getNpdFilterOptions()}
          value={npdFilter}
          onChange={(e) => setNpdFilter(e.target.value)}
          className="w-48"
        />
        <Select
          options={getContractTypeFilterOptions()}
          value={contractTypeFilter}
          onChange={(e) => setContractTypeFilter(e.target.value)}
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
            label: t('selfEmployed.contractors.bulkVerifyNpd'),
            icon: <ShieldCheck size={13} />,
            variant: 'secondary',
            onClick: async (rows) => {
              const ids = rows.map((r) => r.id);
              bulkVerifyMutation.mutate(ids);
            },
          },
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
