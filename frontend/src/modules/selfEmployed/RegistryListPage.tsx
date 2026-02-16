import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { Search } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { DataTable } from '@/design-system/components/DataTable';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { Input, Select } from '@/design-system/components/FormField';
import { selfEmployedApi } from './api';
import { formatMoney, formatDate } from '@/lib/format';
import type { SelfEmployedRegistry, RegistryStatus } from './types';
import { t } from '@/i18n';

const statusColorMap: Record<string, string> = {
  DRAFT: 'gray',
  IN_PROGRESS: 'yellow',
  COMPLETED: 'blue',
  APPROVED: 'green',
};

const getStatusLabels = (): Record<RegistryStatus, string> => ({
  DRAFT: t('selfEmployed.registries.statusDraft'),
  IN_PROGRESS: t('selfEmployed.registries.statusInProgress'),
  COMPLETED: t('selfEmployed.registries.statusCompleted'),
  APPROVED: t('selfEmployed.registries.statusApproved'),
});

const getStatusFilterOptions = () => [
  { value: '', label: t('selfEmployed.registries.statusAll') },
  { value: 'DRAFT', label: t('selfEmployed.registries.statusDraft') },
  { value: 'IN_PROGRESS', label: t('selfEmployed.registries.statusInProgress') },
  { value: 'COMPLETED', label: t('selfEmployed.registries.statusCompleted') },
  { value: 'APPROVED', label: t('selfEmployed.registries.statusApproved') },
];

const RegistryListPage: React.FC = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { data: registriesData, isLoading } = useQuery({
    queryKey: ['self-employed-registries'],
    queryFn: () => selfEmployedApi.getRegistries(),
  });

  const registries = (registriesData?.content && registriesData.content.length > 0)
    ? registriesData.content
    : [];

  const filtered = useMemo(() => {
    let result = registries;
    if (statusFilter) {
      result = result.filter((r) => r.status === statusFilter);
    }
    if (search) {
      const lower = search.toLowerCase();
      result = result.filter(
        (r) =>
          r.name.toLowerCase().includes(lower) ||
          r.projectName?.toLowerCase().includes(lower),
      );
    }
    return result;
  }, [registries, statusFilter, search]);

  const columns = useMemo<ColumnDef<SelfEmployedRegistry, unknown>[]>(
    () => [
      {
        accessorKey: 'name',
        header: t('selfEmployed.registries.colName'),
        size: 280,
        cell: ({ getValue }) => (
          <span className="font-medium text-neutral-900 dark:text-neutral-100">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'projectName',
        header: t('selfEmployed.registries.colProject'),
        size: 200,
        cell: ({ getValue }) => (
          <span className="text-neutral-600">{getValue<string>() ?? '---'}</span>
        ),
      },
      {
        accessorKey: 'periodStart',
        header: t('selfEmployed.registries.colPeriod'),
        size: 200,
        cell: ({ row }) => (
          <span className="tabular-nums text-neutral-600">
            {formatDate(row.original.periodStart)} - {formatDate(row.original.periodEnd)}
          </span>
        ),
      },
      {
        accessorKey: 'totalAmount',
        header: t('selfEmployed.registries.colAmount'),
        size: 160,
        cell: ({ getValue }) => (
          <span className="font-medium tabular-nums text-right block">{formatMoney(getValue<number>())}</span>
        ),
      },
      {
        accessorKey: 'totalPayments',
        header: t('selfEmployed.registries.colPayments'),
        size: 100,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-neutral-600">{getValue<number>()}</span>
        ),
      },
      {
        accessorKey: 'status',
        header: t('selfEmployed.registries.colStatus'),
        size: 130,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={statusColorMap}
            label={getStatusLabels()[getValue<RegistryStatus>()] ?? getValue<string>()}
          />
        ),
      },
    ],
    [],
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('selfEmployed.registries.title')}
        subtitle={t('selfEmployed.registries.subtitle', { count: String(registries.length) })}
        backTo="/self-employed"
        breadcrumbs={[
          { label: t('selfEmployed.registries.breadcrumbHome'), href: '/' },
          { label: t('selfEmployed.registries.breadcrumbSelfEmployed'), href: '/self-employed' },
          { label: t('selfEmployed.registries.breadcrumbRegistries') },
        ]}
        actions={
          <Button onClick={() => navigate('/self-employed')}>
            {t('selfEmployed.registries.toContractors')}
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input
            placeholder={t('selfEmployed.registries.searchPlaceholder')}
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

      <DataTable<SelfEmployedRegistry>
        data={filtered}
        columns={columns}
        loading={isLoading}
        enableColumnVisibility
        enableDensityToggle
        enableExport
        pageSize={20}
        emptyTitle={t('selfEmployed.registries.emptyTitle')}
        emptyDescription={t('selfEmployed.registries.emptyDescription')}
      />
    </div>
  );
};

export default RegistryListPage;
