import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { Search, Target, TrendingUp, Award, BarChart3 } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { DataTable } from '@/design-system/components/DataTable';
import { MetricCard } from '@/design-system/components/MetricCard';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { Input, Select } from '@/design-system/components/FormField';
import { kpiBonusesApi } from '@/api/kpiBonuses';
import { formatDate } from '@/lib/format';
import type { KpiAchievement, KpiCategory } from './types';
import type { PaginatedResponse } from '@/types';
import { t } from '@/i18n';

const kpiCategoryColorMap: Record<string, 'gray' | 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'orange' | 'cyan'> = {
  schedule: 'blue',
  cost: 'green',
  quality: 'purple',
  safety: 'red',
  productivity: 'orange',
};

const getKpiCategoryLabels = (): Record<string, string> => ({
  schedule: t('analytics.kpiAchievements.catSchedule'),
  cost: t('analytics.kpiAchievements.catCost'),
  quality: t('analytics.kpiAchievements.catQuality'),
  safety: t('analytics.kpiAchievements.catSafety'),
  productivity: t('analytics.kpiAchievements.catProductivity'),
});

const getCategoryFilterOptions = () => [
  { value: '', label: t('analytics.kpiAchievements.allCategories') },
  { value: 'SCHEDULE', label: t('analytics.kpiAchievements.catSchedule') },
  { value: 'COST', label: t('analytics.kpiAchievements.catCost') },
  { value: 'QUALITY', label: t('analytics.kpiAchievements.catQuality') },
  { value: 'SAFETY', label: t('analytics.kpiAchievements.catSafety') },
  { value: 'PRODUCTIVITY', label: t('analytics.kpiAchievements.catProductivity') },
];


const KpiAchievementsPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const kpiCategoryLabels = getKpiCategoryLabels();
  const categoryFilterOptions = getCategoryFilterOptions();

  const { data, isLoading } = useQuery<PaginatedResponse<KpiAchievement>>({
    queryKey: ['kpi-achievements'],
    queryFn: () => kpiBonusesApi.getAchievements(),
  });

  const achievements = data?.content ?? [];

  const filtered = useMemo(() => {
    let result = achievements;
    if (categoryFilter) result = result.filter((a) => a.category === categoryFilter);
    if (search) {
      const lower = search.toLowerCase();
      result = result.filter(
        (a) => a.kpiName.toLowerCase().includes(lower) || a.employeeName.toLowerCase().includes(lower),
      );
    }
    return result;
  }, [achievements, categoryFilter, search]);

  const metrics = useMemo(() => {
    const avg = achievements.length > 0
      ? achievements.reduce((s, a) => s + a.achievementPercent, 0) / achievements.length
      : 0;
    const above100 = achievements.filter((a) => a.achievementPercent >= 100).length;
    const below80 = achievements.filter((a) => a.achievementPercent < 80).length;
    return { total: achievements.length, avgAchievement: avg, above100, below80 };
  }, [achievements]);

  const columns = useMemo<ColumnDef<KpiAchievement, unknown>[]>(
    () => [
      {
        accessorKey: 'kpiName',
        header: 'KPI',
        size: 250,
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-neutral-900 dark:text-neutral-100 truncate max-w-[230px]">{row.original.kpiName}</p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{row.original.projectName ?? t('analytics.kpiAchievements.general')}</p>
          </div>
        ),
      },
      {
        accessorKey: 'category',
        header: t('analytics.kpiAchievements.colCategory'),
        size: 140,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={kpiCategoryColorMap}
            label={kpiCategoryLabels[getValue<string>()] ?? getValue<string>()}
          />
        ),
      },
      {
        accessorKey: 'employeeName',
        header: t('analytics.kpiAchievements.colEmployee'),
        size: 160,
      },
      {
        accessorKey: 'targetValue',
        header: t('analytics.kpiAchievements.colTarget'),
        size: 90,
        cell: ({ row }) => (
          <span className="tabular-nums text-neutral-700 dark:text-neutral-300">{row.original.targetValue} {row.original.unit}</span>
        ),
      },
      {
        accessorKey: 'actualValue',
        header: t('analytics.kpiAchievements.colActual'),
        size: 90,
        cell: ({ row }) => (
          <span className="tabular-nums text-neutral-700 dark:text-neutral-300">{row.original.actualValue} {row.original.unit}</span>
        ),
      },
      {
        accessorKey: 'achievementPercent',
        header: t('analytics.kpiAchievements.colAchievement'),
        size: 120,
        cell: ({ getValue }) => {
          const val = getValue<number>();
          const color = val >= 100 ? 'text-success-600' : val >= 80 ? 'text-warning-600' : 'text-danger-600';
          return <span className={`tabular-nums font-semibold ${color}`}>{val.toFixed(1)}%</span>;
        },
      },
      {
        accessorKey: 'weight',
        header: t('analytics.kpiAchievements.colWeight'),
        size: 80,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-neutral-500 dark:text-neutral-400">{(getValue<number>() * 100).toFixed(0)}%</span>
        ),
      },
      {
        accessorKey: 'period',
        header: t('analytics.kpiAchievements.colPeriod'),
        size: 100,
        cell: ({ getValue }) => <span className="tabular-nums text-neutral-700 dark:text-neutral-300">{getValue<string>()}</span>,
      },
    ],
    [],
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('analytics.kpiAchievements.title')}
        subtitle={`${achievements.length} ${t('analytics.kpiAchievements.indicatorsCount')}`}
        breadcrumbs={[
          { label: t('common.home'), href: '/' },
          { label: t('analytics.dashboard.title'), href: '/analytics' },
          { label: t('analytics.kpiAchievements.title') },
        ]}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard icon={<Target size={18} />} label={t('analytics.kpiAchievements.totalKpi')} value={metrics.total} />
        <MetricCard
          icon={<BarChart3 size={18} />}
          label={t('analytics.kpiAchievements.avgAchievement')}
          value={`${metrics.avgAchievement.toFixed(1)}%`}
          trend={{ direction: metrics.avgAchievement >= 90 ? 'up' : 'down', value: `${metrics.avgAchievement.toFixed(0)}%` }}
        />
        <MetricCard icon={<Award size={18} />} label={t('analytics.kpiAchievements.exceeded')} value={metrics.above100} />
        <MetricCard
          icon={<TrendingUp size={18} />}
          label={t('analytics.kpiAchievements.below80')}
          value={metrics.below80}
          trend={{ direction: metrics.below80 > 0 ? 'down' : 'neutral', value: metrics.below80 > 0 ? t('analytics.kpiAchievements.needAttention') : t('analytics.kpiAchievements.none') }}
        />
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input placeholder={t('analytics.kpiAchievements.searchPlaceholder')} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select options={categoryFilterOptions} value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="w-48" />
      </div>

      <DataTable<KpiAchievement>
        data={filtered}
        columns={columns}
        loading={isLoading}
        enableColumnVisibility
        enableDensityToggle
        enableExport
        pageSize={20}
        emptyTitle={t('analytics.kpiAchievements.emptyTitle')}
        emptyDescription={t('analytics.kpiAchievements.emptyDescription')}
      />
    </div>
  );
};

export default KpiAchievementsPage;
