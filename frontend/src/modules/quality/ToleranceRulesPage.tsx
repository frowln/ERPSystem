import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { Plus, Search, Ruler, BookOpen, CheckCircle } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { DataTable } from '@/design-system/components/DataTable';
import { MetricCard } from '@/design-system/components/MetricCard';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { Input, Select } from '@/design-system/components/FormField';
import { toleranceApi } from '@/api/tolerance';
import { t } from '@/i18n';
import type { ToleranceRule } from './types';

const categoryColorMap: Record<string, 'blue' | 'red' | 'green' | 'yellow' | 'cyan' | 'orange' | 'purple' | 'gray'> = {
  geometric: 'blue',
  structural: 'red',
  thermal: 'orange',
  acoustic: 'cyan',
  waterproofing: 'green',
  fire_resistance: 'red',
  surface_finish: 'purple',
  alignment: 'yellow',
  other: 'gray',
};

const getCategoryLabels = (): Record<string, string> => ({
  geometric: t('quality.toleranceRules.categoryGeometric'),
  structural: t('quality.toleranceRules.categoryStructural'),
  thermal: t('quality.toleranceRules.categoryThermal'),
  acoustic: t('quality.toleranceRules.categoryAcoustic'),
  waterproofing: t('quality.toleranceRules.categoryWaterproofing'),
  fire_resistance: t('quality.toleranceRules.categoryFireResistance'),
  surface_finish: t('quality.toleranceRules.categorySurfaceFinish'),
  alignment: t('quality.toleranceRules.categoryAlignment'),
  other: t('quality.toleranceRules.categoryOther'),
});

const activeColorMap: Record<string, 'green' | 'gray'> = {
  true: 'green',
  false: 'gray',
};

const getActiveLabels = (): Record<string, string> => ({
  true: t('quality.toleranceRules.statusActive'),
  false: t('quality.toleranceRules.statusInactive'),
});

const getCategoryFilterOptions = () => [
  { value: '', label: t('quality.toleranceRules.filterAllCategories') },
  ...Object.entries(getCategoryLabels()).map(([v, l]) => ({ value: v, label: l })),
];

const getActiveFilterOptions = () => [
  { value: '', label: t('quality.toleranceRules.filterAll') },
  { value: 'true', label: t('quality.toleranceRules.filterActive') },
  { value: 'false', label: t('quality.toleranceRules.filterInactive') },
];

const ToleranceRulesPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState('');

  const navigate = useNavigate();
  const { data: rulesData, isLoading } = useQuery({
    queryKey: ['tolerance-rules'],
    queryFn: () => toleranceApi.getRules(),
  });

  const rules = rulesData?.content ?? [];

  const filteredRules = useMemo(() => {
    let filtered = rules;

    if (categoryFilter) {
      filtered = filtered.filter((r) => r.category === categoryFilter);
    }

    if (activeFilter) {
      filtered = filtered.filter((r) => String(r.isActive) === activeFilter);
    }

    if (search) {
      const lower = search.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.code.toLowerCase().includes(lower) ||
          r.name.toLowerCase().includes(lower) ||
          r.parameter.toLowerCase().includes(lower) ||
          (r.normativeDocument ?? '').toLowerCase().includes(lower),
      );
    }

    return filtered;
  }, [rules, categoryFilter, activeFilter, search]);

  const activeCount = useMemo(() => rules.filter((r) => r.isActive).length, [rules]);
  const categoryCounts = useMemo(() => {
    const counts = new Set(rules.map((r) => r.category));
    return counts.size;
  }, [rules]);

  const columns = useMemo<ColumnDef<ToleranceRule, unknown>[]>(
    () => {
      const categoryLabels = getCategoryLabels();
      const activeLabels = getActiveLabels();
      return [
      {
        accessorKey: 'code',
        header: t('quality.toleranceRules.colCode'),
        size: 100,
        cell: ({ getValue }) => (
          <span className="font-mono text-neutral-500 dark:text-neutral-400 text-xs">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'name',
        header: t('quality.toleranceRules.colName'),
        size: 280,
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-neutral-900 dark:text-neutral-100">{row.original.name}</p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{row.original.normativeDocument ?? '---'}</p>
          </div>
        ),
      },
      {
        accessorKey: 'category',
        header: t('quality.toleranceRules.colCategory'),
        size: 150,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={categoryColorMap}
            label={categoryLabels[getValue<string>()] ?? getValue<string>()}
          />
        ),
      },
      {
        accessorKey: 'parameter',
        header: t('quality.toleranceRules.colParameter'),
        size: 180,
        cell: ({ getValue }) => (
          <span className="text-neutral-700 dark:text-neutral-300">{getValue<string>()}</span>
        ),
      },
      {
        id: 'tolerance',
        header: t('quality.toleranceRules.colTolerance'),
        size: 160,
        cell: ({ row }) => (
          <span className="font-mono tabular-nums text-neutral-700 dark:text-neutral-300">
            {row.original.nominalValue} ({row.original.toleranceMinus > 0 ? '-' : ''}{row.original.toleranceMinus} / +{row.original.tolerancePlus}) {row.original.unitOfMeasure}
          </span>
        ),
      },
      {
        accessorKey: 'isActive',
        header: t('quality.toleranceRules.colStatus'),
        size: 110,
        cell: ({ getValue }) => (
          <StatusBadge
            status={String(getValue<boolean>())}
            colorMap={activeColorMap}
            label={activeLabels[String(getValue<boolean>())]}
          />
        ),
      },
      {
        accessorKey: 'projectName',
        header: t('quality.toleranceRules.colProject'),
        size: 160,
        cell: ({ getValue }) => (
          <span className="text-neutral-600">{getValue<string>() ?? '---'}</span>
        ),
      },
    ];
    },
    [],
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('quality.toleranceRules.title')}
        subtitle={t('quality.toleranceRules.subtitle', { count: String(rules.length) })}
        breadcrumbs={[
          { label: t('quality.toleranceRules.breadcrumbHome'), href: '/' },
          { label: t('quality.toleranceRules.breadcrumbQuality') },
          { label: t('quality.toleranceRules.breadcrumbTolerances') },
        ]}
        actions={
          <Button iconLeft={<Plus size={16} />} onClick={() => navigate('/quality/tolerance-rules/new')}>
            {t('quality.toleranceRules.btnNewRule')}
          </Button>
        }
      />

      {/* Metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <MetricCard
          icon={<Ruler size={18} />}
          label={t('quality.toleranceRules.metricTotal')}
          value={rules.length}
        />
        <MetricCard
          icon={<CheckCircle size={18} />}
          label={t('quality.toleranceRules.metricActive')}
          value={activeCount}
        />
        <MetricCard
          icon={<BookOpen size={18} />}
          label={t('quality.toleranceRules.metricCategories')}
          value={categoryCounts}
        />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input
            placeholder={t('quality.toleranceRules.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          options={getCategoryFilterOptions()}
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="w-48"
        />
        <Select
          options={getActiveFilterOptions()}
          value={activeFilter}
          onChange={(e) => setActiveFilter(e.target.value)}
          className="w-36"
        />
      </div>

      {/* Table */}
      <DataTable<ToleranceRule>
        data={filteredRules}
        columns={columns}
        loading={isLoading}
        enableRowSelection
        enableColumnVisibility
        enableDensityToggle
        enableExport
        pageSize={20}
        emptyTitle={t('quality.toleranceRules.emptyTitle')}
        emptyDescription={t('quality.toleranceRules.emptyDescription')}
      />
    </div>
  );
};

export default ToleranceRulesPage;
