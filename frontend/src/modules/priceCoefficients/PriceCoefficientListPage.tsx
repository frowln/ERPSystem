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
import { t } from '@/i18n';
import type { PriceCoefficient, PriceCoefficientType, PriceCoefficientStatus } from './types';

const statusColorMap: Record<string, string> = {
  ACTIVE: 'green',
  INACTIVE: 'gray',
  DRAFT: 'yellow',
  EXPIRED: 'red',
};

const getStatusLabels = (): Record<string, string> => ({
  ACTIVE: t('priceCoefficients.statusActive'),
  INACTIVE: t('priceCoefficients.statusInactive'),
  DRAFT: t('priceCoefficients.statusDraft'),
  EXPIRED: t('priceCoefficients.statusExpired'),
});

const getTypeLabels = (): Record<PriceCoefficientType, string> => ({
  REGIONAL: t('priceCoefficients.typeRegional'),
  SEASONAL: t('priceCoefficients.typeSeasonal'),
  MATERIAL: t('priceCoefficients.typeMaterial'),
  LABOR: t('priceCoefficients.typeLabor'),
  EQUIPMENT: t('priceCoefficients.typeEquipment'),
  OVERHEAD: t('priceCoefficients.typeOverhead'),
  CUSTOM: t('priceCoefficients.typeCustom'),
});

const getTypeFilterOptions = () => [
  { value: '', label: t('priceCoefficients.allTypes') },
  { value: 'REGIONAL', label: t('priceCoefficients.typeRegional') },
  { value: 'SEASONAL', label: t('priceCoefficients.typeSeasonal') },
  { value: 'MATERIAL', label: t('priceCoefficients.typeMaterial') },
  { value: 'LABOR', label: t('priceCoefficients.typeLabor') },
  { value: 'EQUIPMENT', label: t('priceCoefficients.typeEquipment') },
  { value: 'OVERHEAD', label: t('priceCoefficients.typeOverhead') },
  { value: 'CUSTOM', label: t('priceCoefficients.typeCustom') },
];

const getStatusFilterOptions = () => [
  { value: '', label: t('priceCoefficients.allStatuses') },
  { value: 'ACTIVE', label: t('priceCoefficients.statusActive') },
  { value: 'INACTIVE', label: t('priceCoefficients.statusInactive') },
  { value: 'DRAFT', label: t('priceCoefficients.statusDraft') },
  { value: 'EXPIRED', label: t('priceCoefficients.statusExpired') },
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

  const typeLabels = getTypeLabels();
  const statusLabels = getStatusLabels();

  const columns = useMemo<ColumnDef<PriceCoefficient, unknown>[]>(
    () => [
      {
        accessorKey: 'code',
        header: t('priceCoefficients.colCode'),
        size: 150,
        cell: ({ getValue }) => (
          <span className="font-mono text-neutral-500 dark:text-neutral-400 text-xs">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'name',
        header: t('priceCoefficients.colName'),
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
        header: t('priceCoefficients.colType'),
        size: 150,
        cell: ({ getValue }) => (
          <span className="text-neutral-600">{typeLabels[getValue<PriceCoefficientType>()] ?? getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'value',
        header: t('priceCoefficients.colValue'),
        size: 120,
        cell: ({ getValue }) => (
          <span className="font-medium tabular-nums text-right block">{getValue<number>().toFixed(4)}</span>
        ),
      },
      {
        accessorKey: 'effectiveFrom',
        header: t('priceCoefficients.colEffectiveFrom'),
        size: 130,
        cell: ({ getValue }) => (
          <span className="tabular-nums">{formatDate(getValue<string>())}</span>
        ),
      },
      {
        accessorKey: 'effectiveTo',
        header: t('priceCoefficients.colEffectiveTo'),
        size: 130,
        cell: ({ getValue }) => (
          <span className="tabular-nums">{getValue<string>() ? formatDate(getValue<string>()) : t('priceCoefficients.indefinite')}</span>
        ),
      },
      {
        accessorKey: 'status',
        header: t('priceCoefficients.colStatus'),
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
    [typeLabels, statusLabels],
  );

  const handleRowClick = useCallback(
    (coefficient: PriceCoefficient) => navigate(`/price-coefficients/${coefficient.id}`),
    [navigate],
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('priceCoefficients.listTitle')}
        subtitle={t('priceCoefficients.listSubtitle', { count: coefficients.length })}
        breadcrumbs={[
          { label: t('priceCoefficients.breadcrumbHome'), href: '/' },
          { label: t('priceCoefficients.breadcrumbPriceCoefficients') },
        ]}
        actions={
          <Button iconLeft={<Plus size={16} />} onClick={() => navigate('/price-coefficients/new')}>
            {t('priceCoefficients.newCoefficient')}
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input
            placeholder={t('priceCoefficients.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          options={getTypeFilterOptions()}
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="w-48"
        />
        <Select
          options={getStatusFilterOptions()}
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
            label: t('priceCoefficients.bulkDelete'),
            icon: <Trash2 size={13} />,
            variant: 'danger',
            onClick: async (rows) => {
              const ids = rows.map((r) => r.id);
              const isConfirmed = await confirm({
                title: t('priceCoefficients.confirmDeleteTitle', { count: ids.length }),
                description: t('priceCoefficients.confirmDeleteDescription'),
                confirmLabel: t('priceCoefficients.confirmDeleteBtn'),
                cancelLabel: t('common.cancel'),
              });
              if (!isConfirmed) return;
              deleteMutation.mutate(ids);
            },
          },
        ]}
        emptyTitle={t('priceCoefficients.emptyTitle')}
        emptyDescription={t('priceCoefficients.emptyDescription')}
      />
    </div>
  );
};

export default PriceCoefficientListPage;
