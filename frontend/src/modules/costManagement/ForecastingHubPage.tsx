import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { type ColumnDef } from '@tanstack/react-table';
import { TrendingUp, DollarSign, Activity, AlertTriangle, ArrowRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { PageHeader } from '@/design-system/components/PageHeader';
import { MetricCard } from '@/design-system/components/MetricCard';
import { DataTable } from '@/design-system/components/DataTable';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { Button } from '@/design-system/components/Button';
import { PageSkeleton } from '@/design-system/components/Skeleton';
import { formatMoneyCompact, formatMoney } from '@/lib/format';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';
import { planningApi } from '@/api/planning';
import { costManagementApi } from '@/api/costManagement';
import { projectsApi } from '@/api/projects';
import type { EvmMetrics, EvmTrendPoint, EacMethods } from '@/modules/planning/types';
import type { ProfitabilityForecast, ProfitabilityRiskLevel, CashFlowForecastBucket } from './types';

// ---------------------------------------------------------------------------
// Helper types
// ---------------------------------------------------------------------------

interface EacComparisonRow {
  projectId: string;
  projectName: string;
  bac: number;
  eacCpi: number;
  eacSpiCpi: number;
  eacBottom: number;
  ieac: number;
}

// ---------------------------------------------------------------------------
// Gauge mini-component (reused from EvmDashboardPage pattern)
// ---------------------------------------------------------------------------

function GaugeMini({ value, label, thresholds }: { value: number; label: string; thresholds: { good: number; warning: number } }) {
  const isGood = value >= thresholds.good;
  const isWarning = value >= thresholds.warning && value < thresholds.good;
  const color = isGood ? 'text-success-600' : isWarning ? 'text-warning-600' : 'text-danger-600';
  const bgColor = isGood ? 'bg-success-100 dark:bg-success-900/30' : isWarning ? 'bg-warning-100 dark:bg-warning-900/30' : 'bg-danger-100 dark:bg-danger-900/30';
  const ringColor = isGood ? 'ring-success-200 dark:ring-success-800' : isWarning ? 'ring-warning-200 dark:ring-warning-800' : 'ring-danger-200 dark:ring-danger-800';

  return (
    <div className="flex flex-col items-center">
      <div className={cn('w-16 h-16 rounded-full flex items-center justify-center ring-4', bgColor, ringColor)}>
        <span className={cn('text-sm font-bold tabular-nums', color)}>{value.toFixed(2)}</span>
      </div>
      <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mt-1.5 text-center">{label}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Risk distribution helpers
// ---------------------------------------------------------------------------

const riskColorMap: Record<string, string> = {
  LOW: 'green',
  MEDIUM: 'yellow',
  HIGH: 'orange',
  CRITICAL: 'red',
};

const riskLabelFn = (level: ProfitabilityRiskLevel): string => {
  const key: Record<ProfitabilityRiskLevel, string> = {
    LOW: 'costManagement.profitability.riskLow',
    MEDIUM: 'costManagement.profitability.riskMedium',
    HIGH: 'costManagement.profitability.riskHigh',
    CRITICAL: 'costManagement.profitability.riskCritical',
  };
  return t(key[level]);
};

const riskBgColors: Record<ProfitabilityRiskLevel, string> = {
  LOW: 'bg-success-500',
  MEDIUM: 'bg-warning-500',
  HIGH: 'bg-orange-500',
  CRITICAL: 'bg-danger-500',
};

// ---------------------------------------------------------------------------
// Main Page Component
// ---------------------------------------------------------------------------

const ForecastingHubPage: React.FC = () => {
  const navigate = useNavigate();

  // ---- Data fetching ----

  const { data: projectsData } = useQuery({
    queryKey: ['projects-list'],
    queryFn: () => projectsApi.getProjects({ size: 200 }),
    staleTime: 5 * 60_000,
  });

  const projects = projectsData?.content ?? [];

  // Fetch EVM metrics for all projects in parallel
  const { data: allEvmMetrics, isLoading: evmLoading } = useQuery({
    queryKey: ['forecasting-hub-evm', projects.map((p) => p.id)],
    queryFn: async () => {
      if (projects.length === 0) return [];
      const results = await Promise.allSettled(
        projects.map((p) => planningApi.getEvmMetrics(p.id)),
      );
      return results
        .filter((r): r is PromiseFulfilledResult<EvmMetrics> => r.status === 'fulfilled')
        .map((r) => r.value);
    },
    enabled: projects.length > 0,
    staleTime: 2 * 60_000,
  });

  // Fetch EAC methods for all projects
  const { data: allEacMethods, isLoading: eacLoading } = useQuery({
    queryKey: ['forecasting-hub-eac-methods', projects.map((p) => p.id)],
    queryFn: async () => {
      if (projects.length === 0) return [];
      const results = await Promise.allSettled(
        projects.map((p) => planningApi.getEacMethods(p.id)),
      );
      return results
        .filter((r): r is PromiseFulfilledResult<EacMethods> => r.status === 'fulfilled')
        .map((r) => r.value);
    },
    enabled: projects.length > 0,
    staleTime: 2 * 60_000,
  });

  // Fetch EVM trend for first project (representative trend)
  const firstProjectId = projects[0]?.id;
  const { data: trendData } = useQuery({
    queryKey: ['forecasting-hub-evm-trend', firstProjectId],
    queryFn: () => planningApi.getEvmTrend(firstProjectId!),
    enabled: !!firstProjectId,
    staleTime: 2 * 60_000,
  });

  // Profitability forecasts
  const { data: forecastsData, isLoading: profitLoading } = useQuery({
    queryKey: ['profitability-forecasts'],
    queryFn: () => costManagementApi.getProfitabilityForecasts({ size: 200 }),
    staleTime: 2 * 60_000,
  });

  // Portfolio summary (prefetch for cache)
  const { isLoading: portfolioLoading } = useQuery({
    queryKey: ['profitability-portfolio'],
    queryFn: () => costManagementApi.getPortfolioSummary(),
    staleTime: 2 * 60_000,
  });

  // Cash flow scenarios + first scenario buckets
  const { data: scenariosData } = useQuery({
    queryKey: ['cf-scenarios'],
    queryFn: () => costManagementApi.getScenarios({ size: 10 }),
    staleTime: 2 * 60_000,
  });

  const firstScenarioId = scenariosData?.content?.[0]?.id;

  const { data: cashflowBuckets } = useQuery({
    queryKey: ['cf-buckets', firstScenarioId],
    queryFn: () => costManagementApi.getForecastBuckets(firstScenarioId!),
    enabled: !!firstScenarioId,
    staleTime: 2 * 60_000,
  });

  // ---- Derived data ----

  const forecasts = forecastsData?.content ?? [];
  const evmMetrics = allEvmMetrics ?? [];
  const eacMethods = allEacMethods ?? [];

  // Portfolio aggregated EAC & ETC
  const portfolioEac = evmMetrics.reduce((sum, m) => sum + m.eac, 0);
  const portfolioEtc = evmMetrics.reduce((sum, m) => sum + m.etc, 0);

  // Weighted average SPI & CPI
  const totalBac = evmMetrics.reduce((sum, m) => sum + m.bac, 0);
  const avgSpi = totalBac > 0
    ? evmMetrics.reduce((sum, m) => sum + m.spi * m.bac, 0) / totalBac
    : 1;
  const avgCpi = totalBac > 0
    ? evmMetrics.reduce((sum, m) => sum + m.cpi * m.bac, 0) / totalBac
    : 1;

  // Cashflow net forecast next 3 months
  const next3MonthsNet = (cashflowBuckets ?? [])
    .slice(0, 3)
    .reduce((sum, b) => sum + b.forecastNet, 0);

  // Risk score (avg from profitability riskLevel mapped numerically)
  const riskScoreMap: Record<ProfitabilityRiskLevel, number> = {
    LOW: 1,
    MEDIUM: 2,
    HIGH: 3,
    CRITICAL: 4,
  };
  const avgRiskScore = forecasts.length > 0
    ? forecasts.reduce((sum, f) => sum + riskScoreMap[f.riskLevel], 0) / forecasts.length
    : 0;
  const riskScoreLabel = avgRiskScore <= 1.5
    ? t('costManagement.forecastingHub.riskLow')
    : avgRiskScore <= 2.5
      ? t('costManagement.forecastingHub.riskMedium')
      : avgRiskScore <= 3.5
        ? t('costManagement.forecastingHub.riskHigh')
        : t('costManagement.forecastingHub.riskCritical');

  // EAC trend mini chart data (last 6 points)
  const eacTrendMini: { date: string; eac: number }[] = (trendData ?? [])
    .slice(-6)
    .map((p: EvmTrendPoint) => ({
      date: p.snapshotDate.slice(5),
      eac: p.eac,
    }));

  // Cashflow chart data (next 6 months)
  const cashflowChartData = (cashflowBuckets ?? []).slice(0, 6).map((b: CashFlowForecastBucket) => ({
    period: b.periodStart.slice(0, 7),
    income: b.forecastIncome,
    expense: b.forecastExpense,
    net: b.forecastNet,
  }));

  // Risk distribution
  const riskDistribution: { level: ProfitabilityRiskLevel; count: number; pct: number }[] = (() => {
    const levels: ProfitabilityRiskLevel[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
    const total = forecasts.length || 1;
    return levels.map((level) => {
      const count = forecasts.filter((f) => f.riskLevel === level).length;
      return { level, count, pct: Math.round((count / total) * 100) };
    });
  })();

  // Top 3 at-risk projects
  const atRiskProjects = forecasts
    .filter((f) => f.riskLevel === 'HIGH' || f.riskLevel === 'CRITICAL')
    .sort((a, b) => b.profitFadeAmount - a.profitFadeAmount)
    .slice(0, 3);

  // EAC methods comparison table
  const eacComparisonRows: EacComparisonRow[] = eacMethods.map((m, idx) => ({
    projectId: evmMetrics[idx]?.projectId ?? `p-${idx}`,
    projectName: evmMetrics[idx]?.projectName ?? `---`,
    bac: m.bac,
    eacCpi: m.eacCpi,
    eacSpiCpi: m.eacSpiCpi,
    eacBottom: m.eacBottom,
    ieac: m.ieac,
  }));

  const eacColumns = useMemo<ColumnDef<EacComparisonRow>[]>(() => [
    {
      accessorKey: 'projectName',
      header: t('costManagement.forecastingHub.colProject'),
      cell: ({ row }) => (
        <span className="font-medium text-neutral-900 dark:text-neutral-100">
          {row.original.projectName}
        </span>
      ),
    },
    {
      accessorKey: 'bac',
      header: 'BAC',
      cell: ({ row }) => <span className="tabular-nums">{formatMoneyCompact(row.original.bac)}</span>,
    },
    {
      accessorKey: 'eacCpi',
      header: t('costManagement.forecastingHub.eacCpi'),
      cell: ({ row }) => {
        const diff = row.original.bac - row.original.eacCpi;
        return (
          <span className={cn('tabular-nums', diff >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400')}>
            {formatMoneyCompact(row.original.eacCpi)}
          </span>
        );
      },
    },
    {
      accessorKey: 'eacSpiCpi',
      header: t('costManagement.forecastingHub.eacSpiCpi'),
      cell: ({ row }) => {
        const diff = row.original.bac - row.original.eacSpiCpi;
        return (
          <span className={cn('tabular-nums', diff >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400')}>
            {formatMoneyCompact(row.original.eacSpiCpi)}
          </span>
        );
      },
    },
    {
      accessorKey: 'eacBottom',
      header: t('costManagement.forecastingHub.eacBottomUp'),
      cell: ({ row }) => {
        const diff = row.original.bac - row.original.eacBottom;
        return (
          <span className={cn('tabular-nums', diff >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400')}>
            {formatMoneyCompact(row.original.eacBottom)}
          </span>
        );
      },
    },
    {
      accessorKey: 'ieac',
      header: 'IEAC',
      cell: ({ row }) => {
        const diff = row.original.bac - row.original.ieac;
        return (
          <span className={cn('tabular-nums', diff >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400')}>
            {formatMoneyCompact(row.original.ieac)}
          </span>
        );
      },
    },
  ], []);

  // ---- Loading state ----
  const isLoading = evmLoading || profitLoading || portfolioLoading;

  if (isLoading && evmMetrics.length === 0) {
    return (
      <div className="animate-fade-in">
        <PageSkeleton variant="dashboard" />
      </div>
    );
  }

  // ---- Render ----
  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('costManagement.forecastingHub.title')}
        subtitle={t('costManagement.forecastingHub.subtitle')}
        breadcrumbs={[
          { label: t('common.home'), href: '/' },
          { label: t('nav.costManagement') },
          { label: t('costManagement.forecastingHub.breadcrumb') },
        ]}
      />

      {/* ---- Top Row: Key Metrics ---- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard
          icon={<DollarSign size={18} />}
          label={t('costManagement.forecastingHub.metricEac')}
          value={formatMoneyCompact(portfolioEac)}
          subtitle={t('costManagement.forecastingHub.metricEacHint')}
        />
        <MetricCard
          icon={<Activity size={18} />}
          label={t('costManagement.forecastingHub.metricEtc')}
          value={formatMoneyCompact(portfolioEtc)}
          subtitle={t('costManagement.forecastingHub.metricEtcHint')}
        />
        <MetricCard
          icon={<TrendingUp size={18} />}
          label={t('costManagement.forecastingHub.metricCashflow')}
          value={formatMoneyCompact(next3MonthsNet)}
          trend={next3MonthsNet !== 0 ? {
            direction: next3MonthsNet >= 0 ? 'up' as const : 'down' as const,
            value: t('costManagement.forecastingHub.next3Months'),
          } : undefined}
        />
        <MetricCard
          icon={<AlertTriangle size={18} />}
          label={t('costManagement.forecastingHub.metricRisk')}
          value={riskScoreLabel}
          subtitle={`${avgRiskScore.toFixed(1)} / 4.0`}
        />
      </div>

      {/* ---- Middle Row: Three panels ---- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Panel 1: EVM Summary */}
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              {t('costManagement.forecastingHub.evmPanel')}
            </h3>
            <Button
              variant="ghost"
              size="xs"
              iconRight={<ArrowRight size={12} />}
              onClick={() => navigate('/planning/evm')}
            >
              {t('costManagement.forecastingHub.viewAll')}
            </Button>
          </div>

          {/* SPI / CPI gauges */}
          <div className="flex items-center justify-around mb-5">
            <GaugeMini value={avgSpi} label="SPI" thresholds={{ good: 0.95, warning: 0.85 }} />
            <GaugeMini value={avgCpi} label="CPI" thresholds={{ good: 0.95, warning: 0.85 }} />
          </div>

          {/* EAC trend mini chart */}
          {eacTrendMini.length > 1 && (
            <div className="mt-2">
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-2">
                {t('costManagement.forecastingHub.eacTrend')}
              </p>
              <ResponsiveContainer width="100%" height={100}>
                <BarChart data={eacTrendMini}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={(v: number) => formatMoneyCompact(v)} width={60} />
                  <Tooltip formatter={(value: number) => formatMoneyCompact(value)} />
                  <Bar dataKey="eac" fill="#6366f1" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Panel 2: Cashflow Outlook */}
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              {t('costManagement.forecastingHub.cashflowPanel')}
            </h3>
            <Button
              variant="ghost"
              size="xs"
              iconRight={<ArrowRight size={12} />}
              onClick={() => navigate('/cost-management/cf-forecast')}
            >
              {t('costManagement.forecastingHub.viewAll')}
            </Button>
          </div>

          {cashflowChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={cashflowChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="period" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={(v: number) => formatMoneyCompact(v)} width={60} />
                <Tooltip formatter={(value: number) => formatMoney(value)} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="income" name={t('costManagement.forecastingHub.income')} fill="#22c55e" radius={[2, 2, 0, 0]} />
                <Bar dataKey="expense" name={t('costManagement.forecastingHub.expense')} fill="#ef4444" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[180px] text-sm text-neutral-400 dark:text-neutral-500">
              {t('costManagement.forecastingHub.noCashflowData')}
            </div>
          )}
        </div>

        {/* Panel 3: Profitability Risk */}
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              {t('costManagement.forecastingHub.riskPanel')}
            </h3>
            <Button
              variant="ghost"
              size="xs"
              iconRight={<ArrowRight size={12} />}
              onClick={() => navigate('/cost-management/profitability')}
            >
              {t('costManagement.forecastingHub.viewAll')}
            </Button>
          </div>

          {/* Risk distribution bar */}
          <div className="mb-4">
            <div className="flex h-5 rounded-full overflow-hidden">
              {riskDistribution.map((r) =>
                r.count > 0 ? (
                  <div
                    key={r.level}
                    className={cn(riskBgColors[r.level], 'transition-all')}
                    style={{ width: `${r.pct}%` }}
                    title={`${riskLabelFn(r.level)}: ${r.count}`}
                  />
                ) : null,
              )}
              {forecasts.length === 0 && (
                <div className="w-full bg-neutral-200 dark:bg-neutral-700" />
              )}
            </div>
            <div className="flex justify-between mt-2">
              {riskDistribution.map((r) => (
                <div key={r.level} className="text-center flex-1">
                  <p className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 tabular-nums">{r.count}</p>
                  <p className="text-[10px] text-neutral-500 dark:text-neutral-400">{riskLabelFn(r.level)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Top 3 at-risk projects */}
          {atRiskProjects.length > 0 && (
            <div className="border-t border-neutral-100 dark:border-neutral-800 pt-3">
              <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-2">
                {t('costManagement.forecastingHub.topAtRisk')}
              </p>
              <div className="space-y-2">
                {atRiskProjects.map((f) => (
                  <div
                    key={f.id}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-neutral-700 dark:text-neutral-300 truncate mr-2">
                      {f.projectName || f.projectId.slice(0, 8)}
                    </span>
                    <StatusBadge
                      status={f.riskLevel}
                      colorMap={riskColorMap}
                      label={riskLabelFn(f.riskLevel)}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ---- Bottom: EAC Methods Comparison Table ---- */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-1">
          {t('costManagement.forecastingHub.eacTableTitle')}
        </h3>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-4">
          {t('costManagement.forecastingHub.eacTableSubtitle')}
        </p>
        <DataTable<EacComparisonRow>
          columns={eacColumns}
          data={eacComparisonRows}
          loading={eacLoading || evmLoading}
          enableExport
          enableSavedViews
          pageSize={10}
          emptyTitle={t('costManagement.forecastingHub.eacTableEmpty')}
          emptyDescription={t('costManagement.forecastingHub.eacTableEmptyDesc')}
        />
      </div>
    </div>
  );
};

export default ForecastingHubPage;
