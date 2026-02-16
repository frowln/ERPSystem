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
import { kpiBonusesApi } from '@/api/kpiBonuses';
import { t } from '@/i18n';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface KpiItem {
  id: string;
  name: string;
  description: string;
  target: number;
  actual: number;
  unit: string;
  trend: 'up' | 'down' | 'neutral';
  trendValue: string;
  category: 'SCHEDULE' | 'COST' | 'QUALITY' | 'SAFETY' | 'PRODUCTIVITY';
  icon: React.ElementType;
  iconColor: string;
  targetDirection: 'higher_better' | 'lower_better';
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
// Mock data
// ---------------------------------------------------------------------------

const getKpis = (): KpiItem[] => [
  {
    id: '1', name: 'SPI (Schedule Performance Index)', description: t('analytics.kpi.spiDesc'),
    target: 1.0, actual: 0.94, unit: '', trend: 'down', trendValue: '-0.03', category: 'SCHEDULE', icon: Clock, iconColor: 'text-blue-600', targetDirection: 'higher_better',
  },
  {
    id: '2', name: 'CPI (Cost Performance Index)', description: t('analytics.kpi.cpiDesc'),
    target: 1.0, actual: 1.02, unit: '', trend: 'up', trendValue: '+0.01', category: 'COST', icon: DollarSign, iconColor: 'text-green-600', targetDirection: 'higher_better',
  },
  {
    id: '3', name: t('analytics.kpi.qualityScoreName'), description: t('analytics.kpi.qualityScoreDesc'),
    target: 95, actual: 91, unit: '%', trend: 'down', trendValue: '-2%', category: 'QUALITY', icon: CheckCircle2, iconColor: 'text-purple-600', targetDirection: 'higher_better',
  },
  {
    id: '4', name: t('analytics.kpi.incidentCountName'), description: t('analytics.kpi.incidentCountDesc'),
    target: 0, actual: 0, unit: '', trend: 'neutral', trendValue: '0', category: 'SAFETY', icon: ShieldCheck, iconColor: 'text-orange-600', targetDirection: 'lower_better',
  },
  {
    id: '5', name: t('analytics.kpi.laborProductivityName'), description: t('analytics.kpi.laborProductivityDesc'),
    target: 100, actual: 87, unit: '%', trend: 'up', trendValue: '+3%', category: 'PRODUCTIVITY', icon: Zap, iconColor: 'text-yellow-600', targetDirection: 'higher_better',
  },
  {
    id: '6', name: t('analytics.kpi.scheduleLagName'), description: t('analytics.kpi.scheduleLagDesc'),
    target: 0, actual: 5, unit: t('analytics.kpi.unitDays'), trend: 'up', trendValue: '+2', category: 'SCHEDULE', icon: Clock, iconColor: 'text-blue-600', targetDirection: 'lower_better',
  },
  {
    id: '7', name: t('analytics.kpi.budgetUtilizationName'), description: t('analytics.kpi.budgetUtilizationDesc'),
    target: 100, actual: 68, unit: '%', trend: 'up', trendValue: '+5%', category: 'COST', icon: DollarSign, iconColor: 'text-green-600', targetDirection: 'higher_better',
  },
  {
    id: '8', name: t('analytics.kpi.daysWithoutIncidentName'), description: t('analytics.kpi.daysWithoutIncidentDesc'),
    target: 365, actual: 47, unit: t('analytics.kpi.unitDays'), trend: 'up', trendValue: '+47', category: 'SAFETY', icon: ShieldCheck, iconColor: 'text-orange-600', targetDirection: 'higher_better',
  },
  {
    id: '9', name: t('analytics.kpi.openRemarksName'), description: t('analytics.kpi.openRemarksDesc'),
    target: 0, actual: 8, unit: t('analytics.kpi.unitPcs'), trend: 'down', trendValue: '-3', category: 'QUALITY', icon: Target, iconColor: 'text-purple-600', targetDirection: 'lower_better',
  },
  {
    id: '10', name: t('analytics.kpi.fleetLoadName'), description: t('analytics.kpi.fleetLoadDesc'),
    target: 85, actual: 78, unit: '%', trend: 'up', trendValue: '+2%', category: 'PRODUCTIVITY', icon: BarChart3, iconColor: 'text-yellow-600', targetDirection: 'higher_better',
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getProgress(kpi: KpiItem): number {
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

  const kpis = getKpis();
  const categoryLabels = getCategoryLabels();

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
                category === key ? 'bg-primary-50 text-primary-700' : 'text-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-800',
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <Select
          options={[
            { value: '', label: t('analytics.kpi.allProjects') },
            { value: 'p1', label: 'ЖК "Солнечный"' },
            { value: 'p2', label: 'БЦ "Горизонт"' },
            { value: 'p3', label: 'Мост через р. Вятка' },
          ]}
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
                  <p className="text-sm font-medium text-neutral-600 tabular-nums">
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
