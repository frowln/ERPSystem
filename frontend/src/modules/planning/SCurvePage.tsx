import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp, BarChart3, Target, ArrowDownUp } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { MetricCard } from '@/design-system/components/MetricCard';
import { Select } from '@/design-system/components/FormField';
import { cn } from '@/lib/cn';
import { planningApi } from './api';
import { projectsApi } from '@/api/projects';
import { t } from '@/i18n';
import type { SCurveData } from './types';
import type { Project, PaginatedResponse } from '@/types';

type ViewMode = 'cost' | 'volume' | 'items';

const defaultSCurveData: SCurveData = {
  points: [],
  currentPlannedPercent: 0,
  currentActualPercent: 0,
  deviation: 0,
};

const SCurvePage: React.FC = () => {
  const [projectId, setProjectId] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('cost');

  const { data: projectsData } = useQuery<PaginatedResponse<Project>>({
    queryKey: ['projects'],
    queryFn: () => projectsApi.getProjects({ page: 0, size: 100 }),
  });

  const projectOptions = (projectsData?.content ?? []).map((p) => ({
    value: p.id,
    label: p.name,
  }));

  const selectedProjectId = projectId || projectOptions[0]?.value || '';

  const { data } = useQuery<SCurveData>({
    queryKey: ['s-curve', selectedProjectId, viewMode],
    queryFn: () => planningApi.getSCurveData(selectedProjectId, viewMode),
    enabled: !!selectedProjectId,
  });

  const sCurve = data ?? defaultSCurveData;

  const deviationDirection = sCurve.deviation >= 0 ? 'up' : 'down';
  const deviationLabel =
    sCurve.deviation >= 0
      ? t('planning.sCurve.deviationAhead')
      : t('planning.sCurve.deviationBehind');

  const viewModeOptions = [
    { value: 'cost', label: t('planning.sCurve.viewCost') },
    { value: 'volume', label: t('planning.sCurve.viewVolume') },
    { value: 'items', label: t('planning.sCurve.viewItems') },
  ];

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('planning.sCurve.title')}
        subtitle={t('planning.sCurve.subtitle')}
        breadcrumbs={[
          { label: t('planning.sCurve.breadcrumbHome'), href: '/' },
          { label: t('planning.sCurve.breadcrumbPlanning') },
          { label: t('planning.sCurve.breadcrumbSCurve') },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Select
              options={projectOptions}
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              placeholder={t('planning.sCurve.selectProject')}
              className="w-56"
            />
          </div>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard
          icon={<Target size={18} />}
          label={t('planning.sCurve.metricPlannedProgress')}
          value={`${sCurve.currentPlannedPercent.toFixed(1)}%`}
        />
        <MetricCard
          icon={<TrendingUp size={18} />}
          label={t('planning.sCurve.metricActualProgress')}
          value={`${sCurve.currentActualPercent.toFixed(1)}%`}
        />
        <MetricCard
          icon={<ArrowDownUp size={18} />}
          label={t('planning.sCurve.metricDeviation')}
          value={`${sCurve.deviation > 0 ? '+' : ''}${sCurve.deviation.toFixed(1)}%`}
          trend={{ direction: deviationDirection, value: deviationLabel }}
        />
        <MetricCard
          icon={<BarChart3 size={18} />}
          label={t('planning.sCurve.metricDataPoints')}
          value={sCurve.points.length}
        />
      </div>

      {/* View mode tabs */}
      <div className="flex items-center gap-2 mb-6">
        {viewModeOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setViewMode(opt.value as ViewMode)}
            className={cn(
              'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
              viewMode === opt.value
                ? 'bg-primary-600 text-white'
                : 'bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-700',
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* S-Curve chart */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
          {t('planning.sCurve.chartTitle')}
        </h3>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-6">
          {t('planning.sCurve.chartSubtitle')}
        </p>

        {sCurve.points.length > 0 ? (
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart
              data={sCurve.points}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorPlanned" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: '#9ca3af' }}
                tickFormatter={(val: string) => val.slice(5)}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#9ca3af' }}
                domain={[0, 100]}
                tickFormatter={(val: number) => `${val}%`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--color-neutral-50, #fafafa)',
                  borderColor: 'var(--color-neutral-200, #e5e7eb)',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                formatter={(value: number) => [`${value.toFixed(1)}%`]}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="plannedProgress"
                stroke="#6366f1"
                fillOpacity={1}
                fill="url(#colorPlanned)"
                strokeWidth={2}
                name={t('planning.sCurve.legendPlanned')}
              />
              <Area
                type="monotone"
                dataKey="actualProgress"
                stroke="#22c55e"
                fillOpacity={1}
                fill="url(#colorActual)"
                strokeWidth={2}
                name={t('planning.sCurve.legendActual')}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-48 text-neutral-400 dark:text-neutral-500">
            {t('planning.sCurve.noData')}
          </div>
        )}

        {/* Legend description */}
        <div className="flex items-center gap-6 mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <div className="w-6 h-2.5 rounded bg-indigo-500" />
            <span className="text-xs text-neutral-600 dark:text-neutral-400">
              {t('planning.sCurve.legendPlanned')}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-2.5 rounded bg-green-500" />
            <span className="text-xs text-neutral-600 dark:text-neutral-400">
              {t('planning.sCurve.legendActual')}
            </span>
          </div>
        </div>
      </div>

      {/* Data points table */}
      {sCurve.points.length > 0 && (
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mt-6">
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
            {t('planning.sCurve.dataTableTitle')}
          </h3>
          <div className="overflow-auto max-h-64">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-700">
                  <th className="text-left py-2 px-3 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase">
                    {t('planning.sCurve.colDate')}
                  </th>
                  <th className="text-right py-2 px-3 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase">
                    {t('planning.sCurve.colPlanned')}
                  </th>
                  <th className="text-right py-2 px-3 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase">
                    {t('planning.sCurve.colActual')}
                  </th>
                  <th className="text-right py-2 px-3 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase">
                    {t('planning.sCurve.colDeviation')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {sCurve.points.map((point, idx) => {
                  const diff = point.actualProgress - point.plannedProgress;
                  return (
                    <tr
                      key={idx}
                      className="border-b border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                    >
                      <td className="py-2 px-3 tabular-nums text-neutral-700 dark:text-neutral-300">
                        {point.date}
                      </td>
                      <td className="py-2 px-3 text-right tabular-nums text-neutral-600 dark:text-neutral-400">
                        {point.plannedProgress.toFixed(1)}%
                      </td>
                      <td className="py-2 px-3 text-right tabular-nums text-neutral-600 dark:text-neutral-400">
                        {point.actualProgress.toFixed(1)}%
                      </td>
                      <td
                        className={cn(
                          'py-2 px-3 text-right tabular-nums font-medium',
                          diff >= 0
                            ? 'text-success-600 dark:text-success-400'
                            : 'text-danger-600 dark:text-danger-400',
                        )}
                      >
                        {diff > 0 ? '+' : ''}
                        {diff.toFixed(1)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default SCurvePage;
