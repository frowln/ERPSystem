import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  TrendingUp,
  TrendingDown,
  Target,
  Clock,
  DollarSign,
  ShieldCheck,
  Zap,
  BarChart3,
  CheckCircle2,
} from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { MetricCard } from '@/design-system/components/MetricCard';
import { Select } from '@/design-system/components/FormField';
import { cn } from '@/lib/cn';
import { analyticsApi } from '@/api/analytics';
import { kpiBonusesApi } from '@/api/kpiBonuses';
import { projectsApi } from '@/api/projects';
import { t } from '@/i18n';
import type { Project, PaginatedResponse } from '@/types';
import type { KpiItem as KpiItemType } from './types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface KpiItemDisplay extends KpiItemType {
  icon: React.ElementType;
  iconColor: string;
}

const getCategoryLabels = (): Record<string, string> => ({
  all: t('analytics.kpi.categoryAll'),
  schedule: t('analytics.kpi.categorySchedule'),
  cost: t('analytics.kpi.categoryBudget'),
  quality: t('analytics.kpi.categoryQuality'),
  safety: t('analytics.kpi.categorySafety'),
  productivity: t('analytics.kpi.categoryProductivity'),
});

// ---------------------------------------------------------------------------
// Category icon/color mapping (UI-layer enrichment)
// ---------------------------------------------------------------------------

const CATEGORY_ICON_MAP: Record<string, { icon: React.ElementType; color: string }> = {
  SCHEDULE: { icon: Clock, color: 'text-blue-600' },
  COST: { icon: DollarSign, color: 'text-green-600' },
  QUALITY: { icon: CheckCircle2, color: 'text-purple-600' },
  SAFETY: { icon: ShieldCheck, color: 'text-orange-600' },
  PRODUCTIVITY: { icon: Zap, color: 'text-yellow-600' },
};

function enrichWithIcons(items: KpiItemType[]): KpiItemDisplay[] {
  return items.map((kpi) => {
    const mapping = CATEGORY_ICON_MAP[kpi.category] ?? { icon: BarChart3, color: 'text-neutral-600 dark:text-neutral-400' };
    return { ...kpi, icon: mapping.icon, iconColor: mapping.color };
  });
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getProgress(kpi: KpiItemDisplay): number {
  if (kpi.targetDirection === 'lower_better') {
    if (kpi.target === 0) return kpi.actual === 0 ? 100 : Math.max(0, 100 - kpi.actual * 10);
    return Math.max(0, Math.min(100, ((kpi.target / Math.max(kpi.actual, 0.01)) * 100)));
  }
  if (kpi.target === 0) return 100;
  return Math.max(0, Math.min(100, (kpi.actual / kpi.target) * 100));
}

function getProgressColor(progress: number): string {
  if (progress >= 90) return 'bg-success-500';
  if (progress >= 70) return 'bg-warning-500';
  return 'bg-danger-500';
}

function getStatusText(progress: number): string {
  if (progress >= 90) return t('analytics.kpi.statusNormal');
  if (progress >= 70) return t('analytics.kpi.statusAttention');
  return t('analytics.kpi.statusCritical');
}

function getStatusColor(progress: number): string {
  if (progress >= 90) return 'text-success-600';
  if (progress >= 70) return 'text-warning-600';
  return 'text-danger-600';
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const KpiPage: React.FC = () => {
  const [category, setCategory] = useState('all');
  const [project, setProject] = useState('');

  const { data: kpiData } = useQuery({
    queryKey: ['analytics-kpis', project],
    queryFn: () => analyticsApi.getKpis(project ? { projectId: project } : undefined),
  });
  const kpis = enrichWithIcons(kpiData ?? []);
  const categoryLabels = getCategoryLabels();

  const { data: projectsData } = useQuery<PaginatedResponse<Project>>({
    queryKey: ['projects'],
    queryFn: () => projectsApi.getProjects({ page: 0, size: 100 }),
  });

  const projectOptions = [
    { value: '', label: t('analytics.kpi.allProjects') },
    ...(projectsData?.content ?? []).map((p) => ({ value: p.id, label: p.name })),
  ];

  // Fetch KPI achievements from the API to enrich the display
  const { data: kpiAchievements } = useQuery({
    queryKey: ['kpi-achievements'],
    queryFn: () => kpiBonusesApi.getAchievements({ page: 0, size: 50 }),
  });

  // Merge API data with static KPI definitions when available
  const enrichedKpis = kpis.map((kpi) => {
    const achievement = kpiAchievements?.content?.find(
      (a) => a.kpiName?.toLowerCase().includes(kpi.name.split(' ')[0].toLowerCase()),
    );
    if (achievement) {
      return {
        ...kpi,
        actual: achievement.actualValue ?? kpi.actual,
        target: achievement.targetValue ?? kpi.target,
      };
    }
    return kpi;
  });

  const filtered = category === 'all' ? enrichedKpis : enrichedKpis.filter((k) => k.category === category);

  const overallHealth = Math.round(enrichedKpis.reduce((sum, k) => sum + getProgress(k), 0) / enrichedKpis.length);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('analytics.kpi.title')}
        subtitle={t('analytics.kpi.subtitle')}
        breadcrumbs={[{ label: t('common.home'), href: '/' }, { label: t('analytics.dashboard.title'), href: '/analytics' }, { label: 'KPI' }]}
      />

      {/* Summary metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard icon={<Target size={18} />} label={t('analytics.kpi.overallHealthIndex')} value={`${overallHealth}%`} trend={{ direction: overallHealth >= 80 ? 'up' : 'down', value: overallHealth >= 80 ? t('analytics.kpi.trendGood') : t('analytics.kpi.statusAttention') }} />
        <MetricCard icon={<CheckCircle2 size={18} />} label={t('analytics.kpi.kpiOnTrack')} value={kpis.filter((k) => getProgress(k) >= 90).length} subtitle={`${t('analytics.kpi.outOf')} ${kpis.length}`} />
        <MetricCard icon={<TrendingDown size={18} />} label={t('analytics.kpi.needAttention')} value={kpis.filter((k) => getProgress(k) < 90 && getProgress(k) >= 70).length} />
        <MetricCard icon={<TrendingUp size={18} />} label={t('analytics.kpi.critical')} value={kpis.filter((k) => getProgress(k) < 70).length} trend={kpis.filter((k) => getProgress(k) < 70).length > 0 ? { direction: 'up', value: t('analytics.kpi.trendNeedsAction') } : { direction: 'neutral', value: '0' }} />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <div className="flex items-center gap-2">
          {Object.entries(categoryLabels).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setCategory(key)}
              className={cn(
                'px-3 py-1.5 text-sm font-medium rounded-lg transition-colors',
                category === key ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400' : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800',
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <Select
          options={projectOptions}
          value={project}
          onChange={(e) => setProject(e.target.value)}
          className="w-48"
        />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((kpi) => {
          const Icon = kpi.icon;
          const progress = getProgress(kpi);
          const progressColor = getProgressColor(progress);
          const statusText = getStatusText(progress);
          const statusColor = getStatusColor(progress);

          return (
            <div key={kpi.id} className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-5 hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center bg-neutral-50 dark:bg-neutral-800')}>
                    <Icon size={18} className={kpi.iconColor} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 text-sm">{kpi.name}</h3>
                    <p className={cn('text-xs font-medium mt-0.5', statusColor)}>{statusText}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {kpi.trend === 'up' ? (
                    <TrendingUp size={14} className={kpi.targetDirection === 'higher_better' ? 'text-success-500' : 'text-danger-500'} />
                  ) : kpi.trend === 'down' ? (
                    <TrendingDown size={14} className={kpi.targetDirection === 'lower_better' ? 'text-success-500' : 'text-danger-500'} />
                  ) : null}
                  <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">{kpi.trendValue}</span>
                </div>
              </div>

              <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-4">{kpi.description}</p>

              {/* Target vs Actual */}
              <div className="flex items-end justify-between mb-2">
                <div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('analytics.kpi.actual')}</p>
                  <p className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 tabular-nums">
                    {kpi.actual}{kpi.unit}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('analytics.kpi.target')}</p>
                  <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400 tabular-nums">
                    {kpi.target}{kpi.unit}
                  </p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                <div
                  className={cn('h-full rounded-full transition-all', progressColor)}
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-right text-[10px] text-neutral-400 mt-1 tabular-nums">{progress.toFixed(0)}%</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default KpiPage;
