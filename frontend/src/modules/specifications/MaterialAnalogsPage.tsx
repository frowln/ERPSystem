import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { Search, Plus, ArrowLeftRight, DollarSign, Star, CheckCircle } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { DataTable } from '@/design-system/components/DataTable';
import { MetricCard } from '@/design-system/components/MetricCard';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { Input, Select } from '@/design-system/components/FormField';
import { materialAnalogsApi } from '@/api/materialAnalogs';
import { formatMoney } from '@/lib/format';
import { t } from '@/i18n';
import type { MaterialAnalog, SubstitutionType } from './types';

const substitutionTypeColorMap: Record<string, 'gray' | 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'orange' | 'cyan'> = {
  equivalent: 'blue',
  superior: 'green',
  inferior: 'orange',
  alternative: 'purple',
};

const getSubstitutionTypeLabels = (): Record<string, string> => ({
  equivalent: t('specifications.materialsSubTypeEquivalent'),
  superior: t('specifications.materialsSubTypeSuperior'),
  inferior: t('specifications.materialsSubTypeInferior'),
  alternative: t('specifications.materialsSubTypeAlternative'),
});

const qualityRatingColorMap: Record<string, 'gray' | 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'orange' | 'cyan'> = {
  A: 'green',
  B: 'blue',
  C: 'yellow',
  D: 'red',
  unrated: 'gray',
};

const getQualityRatingLabels = (): Record<string, string> => ({
  A: t('specifications.materialsQualityA'),
  B: t('specifications.materialsQualityB'),
  C: t('specifications.materialsQualityC'),
  D: t('specifications.materialsQualityD'),
  unrated: t('specifications.materialsQualityUnrated'),
});

const getTypeFilterOptions = () => [
  { value: '', label: t('specifications.materialsFilterAllTypes') },
  { value: 'equivalent', label: t('specifications.materialsFilterEquivalent') },
  { value: 'superior', label: t('specifications.materialsFilterSuperior') },
  { value: 'inferior', label: t('specifications.materialsFilterInferior') },
  { value: 'alternative', label: t('specifications.materialsFilterAlternative') },
];

const MaterialAnalogsPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const navigate = useNavigate();
  const { data, isLoading } = useQuery({
    queryKey: ['material-analogs'],
    queryFn: () => materialAnalogsApi.getAnalogs(),
  });

  const analogs = data?.content ?? [];

  const filtered = useMemo(() => {
    let result = analogs;
    if (typeFilter) result = result.filter((a) => a.substitutionType === typeFilter);
    if (search) {
      const lower = search.toLowerCase();
      result = result.filter(
        (a) =>
          a.originalMaterialName.toLowerCase().includes(lower) ||
          a.analogMaterialName.toLowerCase().includes(lower) ||
          a.supplierName.toLowerCase().includes(lower),
      );
    }
    return result;
  }, [analogs, typeFilter, search]);

  const metrics = useMemo(() => ({
    total: analogs.length,
    approved: analogs.filter((a) => a.isApproved).length,
    avgSavings: analogs.length > 0 ? analogs.reduce((s, a) => s + a.priceDifferencePercent, 0) / analogs.length : 0,
    equivalents: analogs.filter((a) => a.substitutionType === 'equivalent').length,
  }), [analogs]);

  const columns = useMemo<ColumnDef<MaterialAnalog, unknown>[]>(
    () => {
      const subLabels = getSubstitutionTypeLabels();
      const qualLabels = getQualityRatingLabels();
      return [
        {
          accessorKey: 'originalMaterialName',
          header: t('specifications.materialsColOriginal'),
          size: 220,
          cell: ({ row }) => (
            <div>
              <p className="font-medium text-neutral-900 dark:text-neutral-100 truncate max-w-[200px]">{row.original.originalMaterialName}</p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{row.original.originalMaterialCode ?? '---'}</p>
            </div>
          ),
        },
        {
          accessorKey: 'analogMaterialName',
          header: t('specifications.materialsColAnalog'),
          size: 220,
          cell: ({ row }) => (
            <div>
              <p className="font-medium text-neutral-900 dark:text-neutral-100 truncate max-w-[200px]">{row.original.analogMaterialName}</p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{row.original.supplierName}</p>
            </div>
          ),
        },
        {
          accessorKey: 'substitutionType',
          header: t('specifications.materialsColSubstitutionType'),
          size: 140,
          cell: ({ getValue }) => (
            <StatusBadge
              status={getValue<string>()}
              colorMap={substitutionTypeColorMap}
              label={subLabels[getValue<string>()] ?? getValue<string>()}
            />
          ),
        },
        {
          accessorKey: 'qualityRating',
          header: t('specifications.materialsColQuality'),
          size: 120,
          cell: ({ getValue }) => (
            <StatusBadge
              status={getValue<string>()}
              colorMap={qualityRatingColorMap}
              label={qualLabels[getValue<string>()] ?? getValue<string>()}
            />
          ),
        },
        {
          accessorKey: 'priceDifferencePercent',
          header: t('specifications.materialsColPriceDiff'),
          size: 120,
          cell: ({ getValue }) => {
            const val = getValue<number>();
            const color = val < 0 ? 'text-success-600' : val > 0 ? 'text-danger-600' : 'text-neutral-500 dark:text-neutral-400';
            return <span className={`tabular-nums font-medium ${color}`}>{val > 0 ? '+' : ''}{val.toFixed(1)}%</span>;
          },
        },
        {
          accessorKey: 'leadTimeDays',
          header: t('specifications.materialsColLeadTime'),
          size: 110,
          cell: ({ getValue }) => {
            const val = getValue<number>();
            return val ? <span className="tabular-nums text-neutral-700 dark:text-neutral-300">{val} {t('specifications.materialsDays')}</span> : <span className="text-neutral-400">---</span>;
          },
        },
        {
          accessorKey: 'isApproved',
          header: t('specifications.materialsColStatus'),
          size: 120,
          cell: ({ getValue }) => (
            <StatusBadge
              status={getValue<boolean>() ? 'APPROVED' : 'PENDING'}
              colorMap={{ approved: 'green', pending: 'yellow' }}
              label={getValue<boolean>() ? t('specifications.materialsStatusApproved') : t('specifications.materialsStatusPending')}
            />
          ),
        },
      ];
    },
    [],
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('specifications.materialsTitle')}
        subtitle={t('specifications.materialsSubtitle', { count: String(analogs.length) })}
        breadcrumbs={[
          { label: t('specifications.breadcrumbHome'), href: '/' },
          { label: t('specifications.breadcrumbSpecifications'), href: '/specifications' },
          { label: t('specifications.materialsBreadcrumb') },
        ]}
        actions={
          <Button iconLeft={<Plus size={16} />} onClick={() => navigate('/specifications/analogs/new')}>{t('specifications.materialsAddAnalog')}</Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard icon={<ArrowLeftRight size={18} />} label={t('specifications.materialsMetricTotal')} value={metrics.total} />
        <MetricCard icon={<CheckCircle size={18} />} label={t('specifications.materialsMetricApproved')} value={metrics.approved} />
        <MetricCard
          icon={<DollarSign size={18} />}
          label={t('specifications.materialsMetricAvgPriceDiff')}
          value={`${metrics.avgSavings.toFixed(1)}%`}
          trend={{ direction: metrics.avgSavings < 0 ? 'up' : 'down', value: metrics.avgSavings < 0 ? t('specifications.materialsTrendSaving') : t('specifications.materialsTrendMore') }}
        />
        <MetricCard icon={<Star size={18} />} label={t('specifications.materialsMetricEquivalents')} value={metrics.equivalents} />
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input placeholder={t('specifications.materialsSearchPlaceholder')} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select options={getTypeFilterOptions()} value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="w-48" />
      </div>

      <DataTable<MaterialAnalog>
        data={filtered ?? []}
        columns={columns}
        loading={isLoading}
        enableRowSelection
        enableColumnVisibility
        enableDensityToggle
        enableExport
        pageSize={20}
        emptyTitle={t('specifications.materialsEmptyTitle')}
        emptyDescription={t('specifications.materialsEmptyDescription')}
      />
    </div>
  );
};

export default MaterialAnalogsPage;
