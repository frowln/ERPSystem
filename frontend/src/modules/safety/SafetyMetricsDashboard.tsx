import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import {
  Activity,
  TrendingUp,
  AlertTriangle,
  Clock,
  Target,
  Info,
} from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { DataTable } from '@/design-system/components/DataTable';
import { MetricCard } from '@/design-system/components/MetricCard';
import { Select } from '@/design-system/components/FormField';
import { safetyApi } from '@/api/safety';
import { formatNumber } from '@/lib/format';
import { t } from '@/i18n';
import type { SafetyMetrics, MetricsPeriod } from './types';

const INDUSTRY_BENCHMARK_LTIR = 1.0;
const INDUSTRY_BENCHMARK_TRIR = 2.5;

interface ProjectRow {
  projectId: string;
  projectName: string;
  ltir: number;
  trir: number;
  incidents: number;
  workHours: number;
}

const SafetyMetricsDashboard: React.FC = () => {
  const [period, setPeriod] = useState<MetricsPeriod>('year');

  const { data: metrics, isLoading } = useQuery<SafetyMetrics>({
    queryKey: ['safety-metrics', period],
    queryFn: () => safetyApi.getMetrics(period),
  });

  const periodOptions = [
    { value: 'month', label: t('safety.metrics.periodMonth') },
    { value: 'quarter', label: t('safety.metrics.periodQuarter') },
    { value: 'year', label: t('safety.metrics.periodYear') },
  ];

  const projectColumns = useMemo<ColumnDef<ProjectRow, unknown>[]>(
    () => [
      {
        accessorKey: 'projectName',
        header: t('safety.metrics.colProject'),
        size: 250,
        cell: ({ getValue }) => (
          <span className="font-medium text-neutral-900 dark:text-neutral-100">
            {getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: 'ltir',
        header: t('safety.metrics.colLtir'),
        size: 100,
        cell: ({ getValue }) => {
          const v = getValue<number>();
          return (
            <span
              className={
                v > INDUSTRY_BENCHMARK_LTIR
                  ? 'text-danger-600 font-semibold tabular-nums'
                  : 'text-success-600 font-semibold tabular-nums'
              }
            >
              {v.toFixed(2)}
            </span>
          );
        },
      },
      {
        accessorKey: 'trir',
        header: t('safety.metrics.colTrir'),
        size: 100,
        cell: ({ getValue }) => {
          const v = getValue<number>();
          return (
            <span
              className={
                v > INDUSTRY_BENCHMARK_TRIR
                  ? 'text-danger-600 font-semibold tabular-nums'
                  : 'text-success-600 font-semibold tabular-nums'
              }
            >
              {v.toFixed(2)}
            </span>
          );
        },
      },
      {
        accessorKey: 'incidents',
        header: t('safety.metrics.colIncidents'),
        size: 120,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-neutral-700 dark:text-neutral-300">
            {getValue<number>()}
          </span>
        ),
      },
      {
        accessorKey: 'workHours',
        header: t('safety.metrics.colWorkHours'),
        size: 150,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-neutral-700 dark:text-neutral-300">
            {formatNumber(getValue<number>())}
          </span>
        ),
      },
    ],
    [],
  );

  const trendData = metrics?.monthlyTrend ?? [];

  // Compute max for chart normalization
  const maxVal = useMemo(() => {
    if (!trendData.length) return 1;
    return Math.max(
      ...trendData.map((d) => Math.max(d.ltir, d.trir, d.targetLtir ?? 0, d.targetTrir ?? 0)),
      0.01,
    );
  }, [trendData]);

  // Target vs actual helper
  const getTargetComparison = (actual: number | undefined, target: number | undefined) => {
    if (actual == null || target == null) return undefined;
    const diff = actual - target;
    if (diff <= 0) return { direction: 'up' as const, value: t('safety.metrics.belowTarget') };
    return { direction: 'down' as const, value: t('safety.metrics.aboveTarget') };
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('safety.metrics.title')}
        subtitle={t('safety.metrics.subtitle')}
        breadcrumbs={[
          { label: t('safety.metrics.breadcrumbHome'), href: '/' },
          { label: t('safety.metrics.breadcrumbSafety'), href: '/safety' },
          { label: t('safety.metrics.breadcrumbMetrics') },
        ]}
        actions={
          <Select
            options={periodOptions}
            value={period}
            onChange={(e) => setPeriod(e.target.value as MetricsPeriod)}
            className="w-40"
          />
        }
      />

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <MetricCard
          icon={<Activity size={18} />}
          label={t('safety.metrics.metricLtir')}
          value={metrics?.ltir?.toFixed(2) ?? '\u2014'}
          subtitle={t('safety.metrics.metricLtirDesc')}
          loading={isLoading}
          trend={getTargetComparison(metrics?.ltir, metrics?.targets?.ltir)}
        />
        <MetricCard
          icon={<TrendingUp size={18} />}
          label={t('safety.metrics.metricTrir')}
          value={metrics?.trir?.toFixed(2) ?? '\u2014'}
          subtitle={t('safety.metrics.metricTrirDesc')}
          loading={isLoading}
          trend={getTargetComparison(metrics?.trir, metrics?.targets?.trir)}
        />
        <MetricCard
          icon={<AlertTriangle size={18} />}
          label={t('safety.metrics.metricDart')}
          value={metrics?.dartRate?.toFixed(2) ?? '\u2014'}
          subtitle={t('safety.metrics.metricDartDesc')}
          loading={isLoading}
          trend={getTargetComparison(metrics?.dartRate, metrics?.targets?.dartRate)}
        />
        <MetricCard
          icon={<Clock size={18} />}
          label={t('safety.metrics.metricSeverity')}
          value={metrics?.severityRate?.toFixed(2) ?? '\u2014'}
          subtitle={t('safety.metrics.metricSeverityDesc')}
          loading={isLoading}
          trend={getTargetComparison(metrics?.severityRate, metrics?.targets?.severityRate)}
        />
        <MetricCard
          icon={<Target size={18} />}
          label={t('safety.metrics.metricNearMiss')}
          value={metrics?.nearMissFreq?.toFixed(2) ?? '\u2014'}
          subtitle={t('safety.metrics.metricNearMissDesc')}
          loading={isLoading}
        />
      </div>

      {/* Formula display */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-5 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Info size={16} className="text-primary-500" />
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            {t('safety.metrics.formulaTitle')}
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-neutral-50 dark:bg-neutral-800 rounded-lg p-4">
            <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 mb-1">LTIR</p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 font-mono">
              LTIR = (LTI cases x 200,000) / {t('safety.metrics.formulaTotalHours')}
            </p>
            {metrics && (
              <p className="text-xs text-neutral-600 dark:text-neutral-300 mt-2 tabular-nums">
                = ({metrics.ltiCases} x 200,000) / {formatNumber(metrics.totalWorkHours)} = <span className="font-semibold">{metrics.ltir.toFixed(2)}</span>
              </p>
            )}
          </div>
          <div className="bg-neutral-50 dark:bg-neutral-800 rounded-lg p-4">
            <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 mb-1">TRIR</p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 font-mono">
              TRIR = ({t('safety.metrics.formulaRecordable')} x 200,000) / {t('safety.metrics.formulaTotalHours')}
            </p>
            {metrics && (
              <p className="text-xs text-neutral-600 dark:text-neutral-300 mt-2 tabular-nums">
                = ({metrics.recordableIncidents} x 200,000) / {formatNumber(metrics.totalWorkHours)} = <span className="font-semibold">{metrics.trir.toFixed(2)}</span>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Target vs Actual comparison */}
      {metrics?.targets && (
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-5 mb-6">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
            {t('safety.metrics.targetVsActualTitle')}
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-700">
                  <th className="text-left py-2 text-neutral-500 dark:text-neutral-400 font-medium">{t('safety.metrics.colMetric')}</th>
                  <th className="text-right py-2 text-neutral-500 dark:text-neutral-400 font-medium">{t('safety.metrics.colTarget')}</th>
                  <th className="text-right py-2 text-neutral-500 dark:text-neutral-400 font-medium">{t('safety.metrics.colActual')}</th>
                  <th className="text-center py-2 text-neutral-500 dark:text-neutral-400 font-medium">{t('safety.metrics.colDeviation')}</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { label: 'LTIR', target: metrics.targets.ltir, actual: metrics.ltir },
                  { label: 'TRIR', target: metrics.targets.trir, actual: metrics.trir },
                  { label: 'DART', target: metrics.targets.dartRate, actual: metrics.dartRate },
                  { label: t('safety.metrics.metricSeverity'), target: metrics.targets.severityRate, actual: metrics.severityRate },
                ].map((row) => {
                  const deviation = row.actual - row.target;
                  const isGood = deviation <= 0;
                  return (
                    <tr key={row.label} className="border-b border-neutral-100 dark:border-neutral-800 last:border-0">
                      <td className="py-2 font-medium text-neutral-900 dark:text-neutral-100">{row.label}</td>
                      <td className="py-2 text-right tabular-nums text-neutral-500 dark:text-neutral-400">{row.target.toFixed(2)}</td>
                      <td className="py-2 text-right tabular-nums font-semibold text-neutral-900 dark:text-neutral-100">{row.actual.toFixed(2)}</td>
                      <td className="py-2 text-center">
                        <span className={`text-xs font-medium tabular-nums ${isGood ? 'text-success-600' : 'text-danger-600'}`}>
                          {deviation > 0 ? '+' : ''}{deviation.toFixed(2)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Trend chart (simple bar-based visualization) */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-5 mb-6">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
          {t('safety.metrics.trendTitle')}
        </h2>
        {trendData.length > 0 ? (
          <div className="overflow-x-auto">
            <div className="flex items-end gap-2 min-w-[600px] h-48">
              {trendData.map((d) => (
                <div
                  key={d.month}
                  className="flex-1 flex flex-col items-center gap-1"
                >
                  <div className="flex items-end gap-0.5 w-full h-36 relative">
                    {/* Target line indicator */}
                    {d.targetLtir != null && (
                      <div
                        className="absolute left-0 right-0 border-t border-dashed border-neutral-400 dark:border-neutral-500 pointer-events-none"
                        style={{
                          bottom: `${Math.max((d.targetLtir / maxVal) * 100, 0)}%`,
                        }}
                      />
                    )}
                    <div
                      className="flex-1 bg-primary-500 dark:bg-primary-400 rounded-t"
                      style={{
                        height: `${Math.max((d.ltir / maxVal) * 100, 2)}%`,
                      }}
                      title={`LTIR: ${d.ltir.toFixed(2)}`}
                    />
                    <div
                      className="flex-1 bg-warning-500 dark:bg-warning-400 rounded-t"
                      style={{
                        height: `${Math.max((d.trir / maxVal) * 100, 2)}%`,
                      }}
                      title={`TRIR: ${d.trir.toFixed(2)}`}
                    />
                  </div>
                  <span className="text-[10px] text-neutral-500 dark:text-neutral-400 truncate w-full text-center">
                    {d.month}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-4 mt-3 justify-center">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-primary-500 dark:bg-primary-400" />
                <span className="text-xs text-neutral-600 dark:text-neutral-400">
                  LTIR
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-warning-500 dark:bg-warning-400" />
                <span className="text-xs text-neutral-600 dark:text-neutral-400">
                  TRIR
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-6 border-t border-dashed border-neutral-400 dark:border-neutral-500" />
                <span className="text-xs text-neutral-600 dark:text-neutral-400">
                  {t('safety.metrics.targetLine')}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            {t('safety.metrics.emptyDescription')}
          </p>
        )}
      </div>

      {/* Monthly breakdown table */}
      {trendData.length > 0 && (
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-5 mb-6">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
            {t('safety.metrics.monthlyBreakdownTitle')}
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-700">
                  <th className="text-left py-2 text-neutral-500 dark:text-neutral-400 font-medium">{t('safety.metrics.colMonth')}</th>
                  <th className="text-right py-2 text-neutral-500 dark:text-neutral-400 font-medium">LTIR</th>
                  <th className="text-right py-2 text-neutral-500 dark:text-neutral-400 font-medium">{t('safety.metrics.colTargetLtir')}</th>
                  <th className="text-right py-2 text-neutral-500 dark:text-neutral-400 font-medium">TRIR</th>
                  <th className="text-right py-2 text-neutral-500 dark:text-neutral-400 font-medium">{t('safety.metrics.colTargetTrir')}</th>
                </tr>
              </thead>
              <tbody>
                {trendData.map((row) => (
                  <tr key={row.month} className="border-b border-neutral-100 dark:border-neutral-800 last:border-0">
                    <td className="py-2 font-medium text-neutral-900 dark:text-neutral-100">{row.month}</td>
                    <td className={`py-2 text-right tabular-nums font-semibold ${row.ltir > (row.targetLtir ?? Infinity) ? 'text-danger-600' : 'text-success-600'}`}>
                      {row.ltir.toFixed(2)}
                    </td>
                    <td className="py-2 text-right tabular-nums text-neutral-500 dark:text-neutral-400">
                      {row.targetLtir?.toFixed(2) ?? '\u2014'}
                    </td>
                    <td className={`py-2 text-right tabular-nums font-semibold ${row.trir > (row.targetTrir ?? Infinity) ? 'text-danger-600' : 'text-success-600'}`}>
                      {row.trir.toFixed(2)}
                    </td>
                    <td className="py-2 text-right tabular-nums text-neutral-500 dark:text-neutral-400">
                      {row.targetTrir?.toFixed(2) ?? '\u2014'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Project Breakdown Table */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-5">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
          {t('safety.metrics.projectBreakdownTitle')}
        </h2>
        <DataTable<ProjectRow>
          data={metrics?.projectBreakdown ?? []}
          columns={projectColumns}
          loading={isLoading}
          pageSize={10}
          enableExport
          emptyTitle={t('safety.metrics.emptyTitle')}
          emptyDescription={t('safety.metrics.emptyDescription')}
        />
      </div>
    </div>
  );
};

export default SafetyMetricsDashboard;
