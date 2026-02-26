import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import {
  TrendingUp,
  TrendingDown,
  Target,
  BarChart3,
  ChevronDown,
  ChevronRight,
  Filter,
  Wallet,
  Receipt,
  AlertTriangle,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { PageHeader } from '@/design-system/components/PageHeader';
import { MetricCard } from '@/design-system/components/MetricCard';
import { Button } from '@/design-system/components/Button';
import { FormField, Select, Input } from '@/design-system/components/FormField';
import { estimatesApi } from '@/api/estimates';
import { formatMoney, formatMoneyCompact, formatPercent } from '@/lib/format';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';
import type { Estimate } from '@/types';
import type { ComparisonItem, ComparisonSection } from './types';

interface FlatItem extends ComparisonItem {
  sectionName: string;
  isSection: boolean;
}

const EstimateComparisonPage: React.FC = () => {
  const [selectedEstimateId, setSelectedEstimateId] = useState('');
  const [thresholdFilter, setThresholdFilter] = useState(0);
  const [sectionFilter, setSectionFilter] = useState('all');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  const { data: estimatesData } = useQuery({
    queryKey: ['estimates'],
    queryFn: () => estimatesApi.getEstimates(),
  });

  const estimates = estimatesData?.content ?? [];
  const estimateOptions = estimates.map((e: Estimate) => ({
    value: e.id,
    label: e.name,
  }));

  const { data: comparison, isLoading } = useQuery({
    queryKey: ['estimate-comparison', selectedEstimateId],
    queryFn: () => estimatesApi.getComparison(selectedEstimateId),
    enabled: !!selectedEstimateId,
  });

  const toggleSection = (name: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const filteredSections = useMemo(() => {
    if (!comparison) return [];
    let sections = comparison.sections;

    if (sectionFilter !== 'all') {
      sections = sections.filter((s) => s.name === sectionFilter);
    }

    if (thresholdFilter > 0) {
      sections = sections.map((s) => ({
        ...s,
        items: s.items.filter((item) => Math.abs(item.variancePercent) >= thresholdFilter),
      })).filter((s) => s.items.length > 0);
    }

    return sections;
  }, [comparison, sectionFilter, thresholdFilter]);

  const sectionOptions = useMemo(() => {
    if (!comparison) return [{ value: 'all', label: t('common.all') }];
    return [
      { value: 'all', label: t('common.all') },
      ...comparison.sections.map((s) => ({ value: s.name, label: s.name })),
    ];
  }, [comparison]);

  // Top 10 variance items for the chart
  const chartData = useMemo(() => {
    if (!comparison) return [];
    const allItems = comparison.sections.flatMap((s) =>
      s.items.map((item) => ({ name: item.name, variance: item.variance })),
    );
    return allItems
      .sort((a, b) => Math.abs(b.variance) - Math.abs(a.variance))
      .slice(0, 10);
  }, [comparison]);

  const thresholdOptions = [
    { value: '0', label: t('estimates.comparison.thresholdAll') },
    { value: '5', label: '> 5%' },
    { value: '10', label: '> 10%' },
    { value: '20', label: '> 20%' },
    { value: '50', label: '> 50%' },
  ];

  const totalVariancePercent = comparison && comparison.totalPlan > 0
    ? ((comparison.totalVariance / comparison.totalPlan) * 100)
    : 0;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('estimates.comparison.title')}
        subtitle={t('estimates.comparison.subtitle')}
        backTo="/estimates"
        breadcrumbs={[
          { label: t('estimates.comparison.breadcrumbHome'), href: '/' },
          { label: t('estimates.comparison.breadcrumbEstimates'), href: '/estimates' },
          { label: t('estimates.comparison.breadcrumbComparison') },
        ]}
      />

      {/* Estimate selector */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField label={t('estimates.comparison.labelEstimate')} required>
            <Select
              value={selectedEstimateId}
              onChange={(e) => setSelectedEstimateId(e.target.value)}
              options={estimateOptions}
              placeholder={t('estimates.comparison.selectEstimate')}
            />
          </FormField>
          <FormField label={t('estimates.comparison.labelSection')}>
            <Select
              value={sectionFilter}
              onChange={(e) => setSectionFilter(e.target.value)}
              options={sectionOptions}
            />
          </FormField>
          <FormField label={t('estimates.comparison.labelThreshold')}>
            <Select
              value={String(thresholdFilter)}
              onChange={(e) => setThresholdFilter(Number(e.target.value))}
              options={thresholdOptions}
            />
          </FormField>
        </div>
      </div>

      {comparison && (
        <>
          {/* Summary MetricCards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <MetricCard
              icon={<Wallet size={18} />}
              label={t('estimates.comparison.metricPlan')}
              value={formatMoneyCompact(comparison.totalPlan)}
            />
            <MetricCard
              icon={<Receipt size={18} />}
              label={t('estimates.comparison.metricFact')}
              value={formatMoneyCompact(comparison.totalFact)}
            />
            <MetricCard
              icon={<Target size={18} />}
              label={t('estimates.comparison.metricVariance')}
              value={formatMoneyCompact(Math.abs(comparison.totalVariance))}
              trend={{
                direction: comparison.totalVariance <= 0 ? 'up' : 'down',
                value: formatPercent(Math.abs(totalVariancePercent)),
              }}
            />
            <MetricCard
              icon={<AlertTriangle size={18} />}
              label={t('estimates.comparison.metricVariancePercent')}
              value={formatPercent(totalVariancePercent)}
            />
          </div>

          {/* Bar chart - top 10 variance items */}
          {chartData.length > 0 && (
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-6">
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center gap-2">
                <BarChart3 size={16} className="text-neutral-400" />
                {t('estimates.comparison.chartTitle')}
              </h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} layout="vertical" margin={{ left: 120, right: 20, top: 10, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis type="number" tickFormatter={(v: number) => formatMoneyCompact(v)} />
                    <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 12 }} />
                    <Tooltip
                      formatter={(value: number) => [formatMoney(value), t('estimates.comparison.chartVariance')]}
                      contentStyle={{
                        backgroundColor: 'var(--color-neutral-900, #fff)',
                        border: '1px solid var(--color-neutral-200, #e5e7eb)',
                        borderRadius: '8px',
                      }}
                    />
                    <Bar dataKey="variance" radius={[0, 4, 4, 0]}>
                      {chartData.map((entry, idx) => (
                        <Cell
                          key={idx}
                          fill={entry.variance > 0 ? '#ef4444' : '#22c55e'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Tree-table: sections -> items */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50">
                    <th className="text-left px-4 py-3 font-medium text-neutral-600 dark:text-neutral-400">
                      {t('estimates.comparison.colName')}
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-neutral-600 dark:text-neutral-400">
                      {t('estimates.comparison.colUnit')}
                    </th>
                    <th className="text-right px-4 py-3 font-medium text-neutral-600 dark:text-neutral-400">
                      {t('estimates.comparison.colPlanQty')}
                    </th>
                    <th className="text-right px-4 py-3 font-medium text-neutral-600 dark:text-neutral-400">
                      {t('estimates.comparison.colPlanTotal')}
                    </th>
                    <th className="text-right px-4 py-3 font-medium text-neutral-600 dark:text-neutral-400">
                      {t('estimates.comparison.colFactQty')}
                    </th>
                    <th className="text-right px-4 py-3 font-medium text-neutral-600 dark:text-neutral-400">
                      {t('estimates.comparison.colFactTotal')}
                    </th>
                    <th className="text-right px-4 py-3 font-medium text-neutral-600 dark:text-neutral-400">
                      {t('estimates.comparison.colVariance')}
                    </th>
                    <th className="text-right px-4 py-3 font-medium text-neutral-600 dark:text-neutral-400">
                      {t('estimates.comparison.colVariancePct')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSections.map((section) => {
                    const isExpanded = expandedSections.has(section.name);
                    const sectionVariance = section.items.reduce((sum, item) => sum + item.variance, 0);
                    const sectionPlan = section.items.reduce((sum, item) => sum + item.planTotal, 0);
                    const sectionFact = section.items.reduce((sum, item) => sum + item.factTotal, 0);
                    const sectionVarPct = sectionPlan > 0 ? (sectionVariance / sectionPlan) * 100 : 0;

                    return (
                      <React.Fragment key={section.name}>
                        {/* Section header row */}
                        <tr
                          className="border-b border-neutral-200 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-800/30 cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800/60"
                          onClick={() => toggleSection(section.name)}
                        >
                          <td className="px-4 py-3 font-semibold text-neutral-900 dark:text-neutral-100" colSpan={3}>
                            <div className="flex items-center gap-2">
                              {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                              {section.name}
                              <span className="text-xs text-neutral-500 dark:text-neutral-400 font-normal">
                                ({section.items.length})
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums font-medium text-neutral-900 dark:text-neutral-100">
                            {formatMoney(sectionPlan)}
                          </td>
                          <td className="px-4 py-3" />
                          <td className="px-4 py-3 text-right tabular-nums font-medium text-neutral-900 dark:text-neutral-100">
                            {formatMoney(sectionFact)}
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums font-medium">
                            <span className={cn(
                              sectionVariance > 0 ? 'text-danger-600' : sectionVariance < 0 ? 'text-success-600' : 'text-neutral-500',
                            )}>
                              {sectionVariance > 0 ? '+' : ''}{formatMoney(sectionVariance)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums font-medium">
                            <span className={cn(
                              sectionVarPct > 0 ? 'text-danger-600' : sectionVarPct < 0 ? 'text-success-600' : 'text-neutral-500',
                            )}>
                              {sectionVarPct > 0 ? '+' : ''}{formatPercent(sectionVarPct)}
                            </span>
                          </td>
                        </tr>

                        {/* Items */}
                        {isExpanded && section.items.map((item, idx) => (
                          <tr
                            key={idx}
                            className={cn(
                              'border-b border-neutral-100 dark:border-neutral-800',
                              Math.abs(item.variancePercent) > 20 ? 'bg-danger-50/30 dark:bg-danger-900/10' :
                              Math.abs(item.variancePercent) > 10 ? 'bg-warning-50/30 dark:bg-warning-900/10' : '',
                            )}
                          >
                            <td className="px-4 py-2.5 pl-10 text-neutral-700 dark:text-neutral-300">
                              {item.name}
                            </td>
                            <td className="px-4 py-2.5 text-neutral-500 dark:text-neutral-400 text-xs">
                              {item.unit}
                            </td>
                            <td className="px-4 py-2.5 text-right tabular-nums text-neutral-600 dark:text-neutral-400">
                              {new Intl.NumberFormat('ru-RU').format(item.planQty)}
                            </td>
                            <td className="px-4 py-2.5 text-right tabular-nums text-neutral-700 dark:text-neutral-300">
                              {formatMoney(item.planTotal)}
                            </td>
                            <td className="px-4 py-2.5 text-right tabular-nums text-neutral-600 dark:text-neutral-400">
                              {new Intl.NumberFormat('ru-RU').format(item.factQty)}
                            </td>
                            <td className="px-4 py-2.5 text-right tabular-nums text-neutral-700 dark:text-neutral-300">
                              {formatMoney(item.factTotal)}
                            </td>
                            <td className="px-4 py-2.5 text-right tabular-nums font-medium">
                              <span className={cn(
                                item.variance > 0 ? 'text-danger-600' : item.variance < 0 ? 'text-success-600' : 'text-neutral-500 dark:text-neutral-400',
                              )}>
                                {item.variance > 0 ? '+' : ''}{formatMoney(item.variance)}
                              </span>
                            </td>
                            <td className="px-4 py-2.5 text-right">
                              <span className={cn(
                                'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                                item.variancePercent > 10 ? 'bg-danger-100 dark:bg-danger-900/30 text-danger-700 dark:text-danger-300' :
                                item.variancePercent > 0 ? 'bg-warning-100 dark:bg-warning-900/30 text-warning-700 dark:text-warning-300' :
                                item.variancePercent < -10 ? 'bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-300' :
                                'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400',
                              )}>
                                {item.variancePercent > 0 ? '+' : ''}{formatPercent(item.variancePercent)}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </React.Fragment>
                    );
                  })}

                  {filteredSections.length === 0 && !isLoading && selectedEstimateId && (
                    <tr>
                      <td colSpan={8} className="px-4 py-12 text-center text-neutral-500 dark:text-neutral-400">
                        {t('estimates.comparison.noData')}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {!selectedEstimateId && (
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-12 text-center">
          <Target size={48} className="mx-auto text-neutral-300 dark:text-neutral-600 mb-4" />
          <p className="text-neutral-500 dark:text-neutral-400">{t('estimates.comparison.selectHint')}</p>
        </div>
      )}
    </div>
  );
};

export default EstimateComparisonPage;
