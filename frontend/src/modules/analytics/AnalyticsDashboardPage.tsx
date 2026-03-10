import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, Legend,
  AreaChart, Area,
} from 'recharts';
import {
  Download, Printer, RefreshCw,
  Target, Award, Sparkles, BarChart3 as BarChart3Icon, FileBarChart, Sigma, PieChart as PieChartIcon, ChevronRight,
} from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { Select } from '@/design-system/components/FormField';
import { MetricCard } from '@/design-system/components/MetricCard';
import { cn } from '@/lib/cn';
import { formatMoneyCompact } from '@/lib/format';
import { analyticsApi, type AnalyticsDashboardData } from '@/api/analytics';
import { t } from '@/i18n';
import { useThemeStore } from '@/hooks/useTheme';

const quickLinks = [
  { href: '/kpi', icon: Target, labelKey: 'analytics.quickLinks.kpi' },
  { href: '/analytics/kpi-achievements', icon: Award, labelKey: 'analytics.quickLinks.kpiAchievements' },
  { href: '/analytics/executive-kpi', icon: BarChart3Icon, labelKey: 'analytics.quickLinks.executiveKpi' },
  { href: '/analytics/report-builder', icon: FileBarChart, labelKey: 'analytics.quickLinks.reportBuilder' },
  { href: '/analytics/project-charts', icon: PieChartIcon, labelKey: 'analytics.quickLinks.projectCharts' },
  { href: '/analytics/predictive', icon: Sparkles, labelKey: 'analytics.quickLinks.predictive' },
  { href: '/analytics/audit-pivot', icon: Sigma, labelKey: 'analytics.quickLinks.auditPivot' },
  { href: '/analytics/bonus-calculations', icon: Award, labelKey: 'analytics.quickLinks.bonus' },
];

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#a855f7', '#94a3b8'];

const WidgetCard: React.FC<{ title: string; children: React.ReactNode; className?: string }> = ({ title, children, className }) => (
  <div className={cn('bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-5', className)}>
    <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">{title}</h3>
    {children}
  </div>
);

const CustomTooltip: React.FC<{ active?: boolean; payload?: Array<{ name: string; value: number; color?: string }>; label?: string }> = ({ active, payload, label }) => {
  if (!active || !payload) return null;
  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-lg p-3 text-xs">
      <p className="font-semibold text-neutral-900 dark:text-neutral-100 mb-1">{label}</p>
      {payload.map((entry, idx) => (
        <div key={idx} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-neutral-600 dark:text-neutral-400">{entry.name}:</span>
          <span className="font-medium text-neutral-900 dark:text-neutral-100">{typeof entry.value === 'number' && entry.value >= 1000 ? formatMoneyCompact(entry.value) : entry.value}</span>
        </div>
      ))}
    </div>
  );
};

const AnalyticsDashboardPage: React.FC = () => {
  const [dateRange, setDateRange] = useState('6m');
  const isDark = useThemeStore((s) => s.resolved === 'dark');
  const gridColor = isDark ? '#334155' : '#f1f5f9';
  const tickColor = isDark ? '#94a3b8' : '#64748b';
  const tickLightColor = isDark ? '#94a3b8' : '#94a3b8';

  const { data, isLoading, refetch } = useQuery<AnalyticsDashboardData>({
    queryKey: ['analytics', 'dashboard', dateRange],
    queryFn: () => analyticsApi.getDashboardData({ dateFrom: getDateFrom(dateRange) }),
  });

  const projectStatusData = (data?.projectStatusSummary ?? []).map((s) => ({
    name: s.label,
    value: s.count,
    color: s.color || COLORS[0],
  }));
  const financialBars = data?.financialBars ?? [];
  const safetyMetrics = data?.safetyMetrics ?? [];
  const taskBurndown = data?.taskBurndown ?? [];
  const procurementSpend = data?.procurementSpend ?? [];
  const warehouseStock = (data?.warehouseStockLevels ?? []).map((w) => ({
    name: w.label,
    current: w.currentStock,
    min: w.minStock,
    max: w.maxStock,
    fill: COLORS[0],
  }));

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('analytics.dashboard.title')}
        subtitle={t('analytics.dashboard.subtitle')}
        breadcrumbs={[
          { label: t('common.home'), href: '/' },
          { label: t('analytics.dashboard.title') },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Select
              options={[
                { value: '1m', label: t('analytics.dashboard.range1m') },
                { value: '3m', label: t('analytics.dashboard.range3m') },
                { value: '6m', label: t('analytics.dashboard.range6m') },
                { value: '1y', label: t('analytics.dashboard.range1y') },
              ]}
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-36"
            />
            <Button variant="secondary" iconLeft={<RefreshCw size={16} />} size="sm" onClick={() => refetch()} loading={isLoading}>
              {t('analytics.dashboard.refresh')}
            </Button>
            <Button variant="secondary" iconLeft={<Download size={16} />} size="sm" onClick={() => toast(t('common.exportStarted'))}>
              {t('analytics.dashboard.export')}
            </Button>
            <Button variant="secondary" iconLeft={<Printer size={16} />} size="sm" onClick={() => window.print()}>
              {t('analytics.dashboard.print')}
            </Button>
          </div>
        }
      />

      {/* Quick access links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 mb-6">
        {quickLinks.map((link) => (
          <Link
            key={link.href}
            to={link.href}
            className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 hover:border-primary-300 dark:hover:border-primary-600 hover:shadow-sm transition-all group"
          >
            <link.icon size={15} className="text-neutral-400 group-hover:text-primary-500 flex-shrink-0" />
            <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300 group-hover:text-primary-600 dark:group-hover:text-primary-400 truncate">{t(link.labelKey)}</span>
            <ChevronRight size={12} className="text-neutral-300 group-hover:text-primary-400 ml-auto flex-shrink-0" />
          </Link>
        ))}
      </div>

      {/* Summary metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard
          label={t('analytics.dashboard.activeProjects')}
          value={projectStatusData.reduce((s, d) => s + d.value, 0) || '--'}
          subtitle={t('analytics.dashboard.vsPrevMonth')}
        />
        <MetricCard
          label={t('analytics.dashboard.totalBudget')}
          value={financialBars.length > 0 ? formatMoneyCompact(financialBars.reduce((s, d) => s + d.revenue, 0)) : '--'}
          subtitle={t('analytics.dashboard.vsPrevMonth')}
        />
        <MetricCard
          label={t('analytics.dashboard.daysWithoutIncidents')}
          value={safetyMetrics.length > 0 ? (safetyMetrics[safetyMetrics.length - 1]?.daysWithoutIncident ?? '--') : '--'}
          subtitle=""
        />
        <MetricCard
          label={t('analytics.dashboard.taskCompletion')}
          value={taskBurndown.length > 0 ? `${taskBurndown[taskBurndown.length - 1]?.actual ?? '--'}` : '--'}
          subtitle={t('analytics.dashboard.vsPrevWeek')}
        />
      </div>

      {/* Widgets grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Project Status Pie */}
        <WidgetCard title={t('analytics.dashboard.projectStatuses')}>
          <div className="flex items-center">
            <div className="w-48 h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={projectStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {projectStatusData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-2 ml-4">
              {projectStatusData.map((entry) => (
                <div key={entry.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                    <span className="text-sm text-neutral-700 dark:text-neutral-300">{entry.name}</span>
                  </div>
                  <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{entry.value}</span>
                </div>
              ))}
            </div>
          </div>
        </WidgetCard>

        {/* Financial Bars */}
        <WidgetCard title={t('analytics.dashboard.financialMetrics')}>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={financialBars} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: tickLightColor }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: tickLightColor }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1_000_000).toFixed(0)}${t('analytics.dashboard.millionShort')}`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12, color: tickColor }} />
              <Bar dataKey="revenue" name={t('analytics.dashboard.chartRevenue')} fill="#3b82f6" radius={[3, 3, 0, 0]} />
              <Bar dataKey="cost" name={t('analytics.dashboard.chartCosts')} fill="#f59e0b" radius={[3, 3, 0, 0]} />
              <Bar dataKey="profit" name={t('analytics.dashboard.chartProfit')} fill="#22c55e" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </WidgetCard>

        {/* Safety Metrics */}
        <WidgetCard title={t('analytics.dashboard.safety')}>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={safetyMetrics}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: tickLightColor }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: tickLightColor }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12, color: tickColor }} />
              <Area type="monotone" dataKey="inspections" name={t('analytics.dashboard.chartInspections')} stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.1} />
              <Area type="monotone" dataKey="nearMisses" name={t('analytics.dashboard.chartNearMisses')} stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.1} />
              <Area type="monotone" dataKey="incidents" name={t('analytics.dashboard.chartIncidents')} stroke="#ef4444" fill="#ef4444" fillOpacity={0.15} />
            </AreaChart>
          </ResponsiveContainer>
        </WidgetCard>

        {/* Task Burndown */}
        <WidgetCard title={t('analytics.dashboard.taskBurndown')}>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={taskBurndown}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis dataKey="date" tick={{ fontSize: 12, fill: tickLightColor }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: tickLightColor }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12, color: tickColor }} />
              <Line type="monotone" dataKey="ideal" name={t('analytics.dashboard.chartIdeal')} stroke="#94a3b8" strokeDasharray="5 5" dot={false} />
              <Line type="monotone" dataKey="planned" name={t('analytics.dashboard.chartPlanned')} stroke="#3b82f6" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="actual" name={t('analytics.dashboard.chartActual')} stroke="#ef4444" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </WidgetCard>

        {/* Procurement Spend */}
        <WidgetCard title={t('analytics.dashboard.procurementSpend')}>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={procurementSpend} layout="vertical" barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: tickLightColor }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1_000_000).toFixed(0)}${t('analytics.dashboard.millionShort')}`} />
              <YAxis type="category" dataKey="category" tick={{ fontSize: 12, fill: tickColor }} axisLine={false} tickLine={false} width={70} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12, color: tickColor }} />
              <Bar dataKey="planned" name={t('analytics.dashboard.chartPlan')} fill="#94a3b8" radius={[0, 3, 3, 0]} barSize={12} />
              <Bar dataKey="actual" name={t('analytics.dashboard.chartFact')} fill="#3b82f6" radius={[0, 3, 3, 0]} barSize={12} />
            </BarChart>
          </ResponsiveContainer>
        </WidgetCard>

        {/* Warehouse Stock Levels */}
        <WidgetCard title={t('analytics.dashboard.warehouseStockLevels')}>
          <div className="space-y-3">
            {warehouseStock.map((item) => {
              const isBelowMin = item.current < item.min;
              return (
                <div key={item.name}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-neutral-700 dark:text-neutral-300">{item.name}</span>
                    <span className={cn(
                      'text-xs font-medium',
                      isBelowMin ? 'text-danger-600' : 'text-neutral-600',
                    )}>
                      {item.current}%
                      {isBelowMin && ` (${t('analytics.dashboard.belowMinimum')})`}
                    </span>
                  </div>
                  <div className="relative w-full h-3 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                    {/* Min threshold line */}
                    <div
                      className="absolute top-0 bottom-0 w-px bg-danger-400 z-10"
                      style={{ left: `${item.min}%` }}
                    />
                    <div
                      className={cn(
                        'h-full rounded-full transition-all',
                        isBelowMin ? 'bg-danger-500' : 'bg-primary-500',
                      )}
                      style={{ width: `${item.current}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-[10px] text-neutral-400 mt-3">{t('analytics.dashboard.redLineNote')}</p>
        </WidgetCard>
      </div>
    </div>
  );
};

function getDateFrom(range: string): string {
  const now = new Date();
  switch (range) {
    case '1m': now.setMonth(now.getMonth() - 1); break;
    case '3m': now.setMonth(now.getMonth() - 3); break;
    case '6m': now.setMonth(now.getMonth() - 6); break;
    case '1y': now.setFullYear(now.getFullYear() - 1); break;
  }
  return now.toISOString().slice(0, 10);
}

export default AnalyticsDashboardPage;
