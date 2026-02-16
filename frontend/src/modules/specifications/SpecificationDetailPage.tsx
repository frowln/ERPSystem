import React, { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { Package, Wrench, Cpu, Layers } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { MetricCard } from '@/design-system/components/MetricCard';
import { DataTable } from '@/design-system/components/DataTable';
import {
  StatusBadge,
  specificationStatusColorMap,
  specificationStatusLabels,
  specItemTypeColorMap,
  specItemTypeLabels,
} from '@/design-system/components/StatusBadge';
import { specificationsApi } from '@/api/specifications';
import { formatMoney, formatMoneyCompact } from '@/lib/format';
import { t } from '@/i18n';
import type { Specification, SpecItem } from '@/types';

const SpecificationDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const { data: spec } = useQuery({
    queryKey: [ 'SPECIFICATION', id],
    queryFn: () => specificationsApi.getSpecification(id!),
    enabled: !!id,
  });

  const { data: items } = useQuery({
    queryKey: ['spec-items', id],
    queryFn: () => specificationsApi.getSpecItems(id!),
    enabled: !!id,
  });

  const s = spec;
  const specItems = items ?? [];

  const summary = useMemo(() => {
    const materials = specItems.filter((i) => i.itemType === 'MATERIAL');
    const equipment = specItems.filter((i) => i.itemType === 'EQUIPMENT');
    const works = specItems.filter((i) => i.itemType === 'WORK');
    return {
      total: specItems.length,
      materialCount: materials.length,
      materialAmount: materials.reduce((sum, i) => sum + i.plannedAmount, 0),
      equipmentCount: equipment.length,
      equipmentAmount: equipment.reduce((sum, i) => sum + i.plannedAmount, 0),
      workCount: works.length,
      workAmount: works.reduce((sum, i) => sum + i.plannedAmount, 0),
    };
  }, [specItems]);

  const columns = useMemo<ColumnDef<SpecItem, unknown>[]>(
    () => [
      {
        accessorKey: 'sequence',
        header: '\u2116',
        size: 60,
        cell: ({ getValue }) => (
          <span className="font-mono text-neutral-500 dark:text-neutral-400 text-xs">{getValue<number>()}</span>
        ),
      },
      {
        accessorKey: 'itemType',
        header: t('specifications.detailColType'),
        size: 120,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={specItemTypeColorMap}
            label={specItemTypeLabels[getValue<string>()] ?? getValue<string>()}
          />
        ),
      },
      {
        accessorKey: 'name',
        header: t('specifications.detailColName'),
        size: 280,
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-neutral-900 dark:text-neutral-100">{row.original.name}</p>
            {row.original.productCode && (
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 font-mono">{row.original.productCode}</p>
            )}
          </div>
        ),
      },
      {
        accessorKey: 'quantity',
        header: t('specifications.detailColQuantity'),
        size: 100,
        cell: ({ row }) => (
          <span className="tabular-nums text-neutral-700 dark:text-neutral-300">
            {new Intl.NumberFormat('ru-RU').format(row.original.quantity)}
          </span>
        ),
      },
      {
        accessorKey: 'unitOfMeasure',
        header: t('specifications.detailColUnit'),
        size: 80,
        cell: ({ getValue }) => (
          <span className="text-neutral-600">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'plannedAmount',
        header: t('specifications.detailColAmount'),
        size: 160,
        cell: ({ getValue }) => (
          <span className="font-medium tabular-nums text-right block">
            {formatMoney(getValue<number>())}
          </span>
        ),
      },
      {
        accessorKey: 'procurementStatus',
        header: t('specifications.detailColProcurementStatus'),
        size: 130,
        cell: ({ getValue }) => {
          const val = getValue<string>();
          const colorMap: Record<string, string> = {
            'Заказано': 'text-primary-600 bg-primary-50',
            'Доставлено': 'text-success-600 bg-success-50',
            'Частично': 'text-warning-600 bg-warning-50',
            'Не заказано': 'text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800',
            '---': 'text-neutral-400',
          };
          return (
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${colorMap[val] ?? 'text-neutral-500 dark:text-neutral-400'}`}>
              {val}
            </span>
          );
        },
      },
      {
        accessorKey: 'estimateStatus',
        header: t('specifications.detailColEstimateStatus'),
        size: 120,
        cell: ({ getValue }) => {
          const val = getValue<string>();
          const colorMap: Record<string, string> = {
            'Утверждена': 'text-success-600 bg-success-50',
            'В работе': 'text-warning-600 bg-warning-50',
            'Черновик': 'text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800',
          };
          return (
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${colorMap[val] ?? 'text-neutral-500 dark:text-neutral-400'}`}>
              {val}
            </span>
          );
        },
      },
    ],
    [],
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={s?.name ?? ''}
        subtitle={t('specifications.detailVersionSubtitle', { project: s?.projectName ?? '', version: String(s?.version ?? '') })}
        backTo="/specifications"
        breadcrumbs={[
          { label: t('specifications.breadcrumbHome'), href: '/' },
          { label: t('specifications.breadcrumbSpecifications'), href: '/specifications' },
          { label: s?.name ?? '' },
        ]}
        actions={
          <StatusBadge
            status={s?.status ?? ''}
            colorMap={specificationStatusColorMap}
            label={specificationStatusLabels[s?.status ?? ''] ?? s?.status ?? ''}
            size="md"
          />
        }
      />

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard
          icon={<Layers size={18} />}
          label={t('specifications.detailTotalItems')}
          value={String(summary.total)}
          subtitle={formatMoneyCompact(s?.totalAmount ?? 0)}
        />
        <MetricCard
          icon={<Package size={18} />}
          label={t('specifications.detailMaterials')}
          value={String(summary.materialCount)}
          subtitle={formatMoneyCompact(summary.materialAmount)}
        />
        <MetricCard
          icon={<Wrench size={18} />}
          label={t('specifications.detailWorks')}
          value={String(summary.workCount)}
          subtitle={formatMoneyCompact(summary.workAmount)}
        />
        <MetricCard
          icon={<Cpu size={18} />}
          label={t('specifications.detailEquipment')}
          value={String(summary.equipmentCount)}
          subtitle={formatMoneyCompact(summary.equipmentAmount)}
        />
      </div>

      {/* Items table */}
      <DataTable<SpecItem>
        data={specItems ?? []}
        columns={columns}
        enableColumnVisibility
        enableDensityToggle
        enableExport
        pageSize={20}
        emptyTitle={t('specifications.detailEmptyTitle')}
        emptyDescription={t('specifications.detailEmptyDescription')}
      />
    </div>
  );
};

export default SpecificationDetailPage;
