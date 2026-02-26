import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Line,
  ComposedChart,
  ReferenceLine,
  Legend,
} from 'recharts';
import { AlertTriangle, BarChart3, ListOrdered, Target } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { MetricCard } from '@/design-system/components/MetricCard';
import { Input, Select } from '@/design-system/components/FormField';
import { qualityApi } from '@/api/quality';
import { t } from '@/i18n';
import type { DefectStatistics } from '@/modules/quality/types';

const DefectParetoPage: React.FC = () => {
  const [projectFilter, setProjectFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const { data: statistics, isLoading } = useQuery({
    queryKey: ['defect-statistics', projectFilter, severityFilter, dateFrom, dateTo],
    queryFn: () =>
      qualityApi.getDefectStatistics({
        projectId: projectFilter || undefined,
        severity: severityFilter || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      }),
  });

  // Compute Pareto chart data
  const chartData = useMemo(() => {
    if (!statistics?.byType || statistics.byType.length === 0) return [];

    const sorted = [...statistics.byType].sort((a, b) => b.count - a.count);
    let cumulative = 0;
    const totalCount = sorted.reduce((sum, item) => sum + item.count, 0);

    return sorted.map((item) => {
      cumulative += item.count;
      return {
        type: item.type,
        count: item.count,
        percentage: item.percentage,
        cumulative: totalCount > 0 ? (cumulative / totalCount) * 100 : 0,
      };
    });
  }, [statistics]);

  // Compute summary metrics
  const summaryMetrics = useMemo(() => {
    if (!statistics) {
      return { total: 0, topCategory: '-', top3: '-', threshold80: 0 };
    }

    const sorted = [...(statistics.byType ?? [])].sort((a, b) => b.count - a.count);
    const topCategory = sorted[0]?.type ?? '-';
    const top3 = sorted
      .slice(0, 3)
      .map((s) => s.type)
      .join(', ') || '-';

    // Find how many categories make up 80%
    let cumulative = 0;
    const totalCount = statistics.total;
    let threshold80 = 0;
    for (const item of sorted) {
      cumulative += item.count;
      threshold80++;
      if (totalCount > 0 && cumulative / totalCount >= 0.8) break;
    }

    return {
      total: statistics.total,
      topCategory,
      top3,
      threshold80,
    };
  }, [statistics]);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('quality.defectPareto.title')}
        subtitle={t('quality.defectPareto.subtitle')}
        breadcrumbs={[
          { label: t('quality.defectPareto.breadcrumbHome'), href: '/' },
          { label: t('quality.defectPareto.breadcrumbQuality'), href: '/quality' },
          { label: t('quality.defectPareto.breadcrumbPareto') },
        ]}
      />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Select
          options={[
            { value: '', label: t('quality.defectPareto.filterAllProjects') },
          ]}
          value={projectFilter}
          onChange={(e) => setProjectFilter(e.target.value)}
          className="w-44"
        />
        <Select
          options={[
            { value: '', label: t('quality.defectPareto.filterAllSeverities') },
            { value: 'minor', label: t('quality.defectPareto.severityMinor') },
            { value: 'major', label: t('quality.defectPareto.severityMajor') },
            { value: 'critical', label: t('quality.defectPareto.severityCritical') },
          ]}
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value)}
          className="w-40"
        />
        <Input
          type="date"
          placeholder={t('quality.defectPareto.dateFrom')}
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="w-36"
        />
        <Input
          type="date"
          placeholder={t('quality.defectPareto.dateTo')}
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="w-36"
        />
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard
          icon={<AlertTriangle size={16} />}
          label={t('quality.defectPareto.metricTotal')}
          value={summaryMetrics.total}
          loading={isLoading}
        />
        <MetricCard
          icon={<BarChart3 size={16} />}
          label={t('quality.defectPareto.metricTopCategory')}
          value={summaryMetrics.topCategory}
          loading={isLoading}
        />
        <MetricCard
          icon={<ListOrdered size={16} />}
          label={t('quality.defectPareto.metricTop3')}
          value={summaryMetrics.top3}
          loading={isLoading}
          compact
        />
        <MetricCard
          icon={<Target size={16} />}
          label={t('quality.defectPareto.metricThreshold')}
          value={t('quality.defectPareto.categoriesCount', {
            count: String(summaryMetrics.threshold80),
          })}
          loading={isLoading}
        />
      </div>

      {/* Pareto Chart */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
        {chartData.length === 0 && !isLoading ? (
          <div className="flex items-center justify-center h-80 text-neutral-400 dark:text-neutral-500">
            {t('quality.defectPareto.noData')}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={400}>
            <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-neutral-200 dark:text-neutral-700" />
              <XAxis
                dataKey="type"
                tick={{ fontSize: 12, fill: 'currentColor' }}
                className="text-neutral-500 dark:text-neutral-400"
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis
                yAxisId="count"
                tick={{ fontSize: 12, fill: 'currentColor' }}
                className="text-neutral-500 dark:text-neutral-400"
                label={{
                  value: t('quality.defectPareto.chartCount'),
                  angle: -90,
                  position: 'insideLeft',
                  style: { textAnchor: 'middle', fontSize: 12 },
                }}
              />
              <YAxis
                yAxisId="cumulative"
                orientation="right"
                domain={[0, 100]}
                tick={{ fontSize: 12, fill: 'currentColor' }}
                className="text-neutral-500 dark:text-neutral-400"
                label={{
                  value: t('quality.defectPareto.chartCumulative'),
                  angle: 90,
                  position: 'insideRight',
                  style: { textAnchor: 'middle', fontSize: 12 },
                }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--color-neutral-50, #fafafa)',
                  border: '1px solid var(--color-neutral-200, #e5e5e5)',
                  borderRadius: '8px',
                  fontSize: '13px',
                }}
              />
              <Legend />
              <Bar
                yAxisId="count"
                dataKey="count"
                name={t('quality.defectPareto.chartCount')}
                fill="#3b82f6"
                radius={[4, 4, 0, 0]}
              />
              <Line
                yAxisId="cumulative"
                type="monotone"
                dataKey="cumulative"
                name={t('quality.defectPareto.chartCumulative')}
                stroke="#ef4444"
                strokeWidth={2}
                dot={{ fill: '#ef4444', r: 4 }}
              />
              <ReferenceLine
                yAxisId="cumulative"
                y={80}
                stroke="#f59e0b"
                strokeDasharray="5 5"
                label={{
                  value: t('quality.defectPareto.chartThreshold'),
                  position: 'right',
                  fill: '#f59e0b',
                  fontSize: 11,
                }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default DefectParetoPage;
