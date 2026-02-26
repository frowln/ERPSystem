import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Building2, Wallet, Percent, Calculator, ChevronDown, ChevronRight, FileText } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { MetricCard } from '@/design-system/components/MetricCard';
import { FormField, Select } from '@/design-system/components/FormField';
import { estimatesApi } from '@/api/estimates';
import { formatMoney, formatMoneyCompact } from '@/lib/format';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';
import type { SummaryChapter } from './types';

const SummaryEstimatePage: React.FC = () => {
  const [projectId, setProjectId] = useState('');
  const [expandedChapters, setExpandedChapters] = useState<Set<number>>(new Set());

  // Use estimates to derive project options
  const { data: estimatesData } = useQuery({
    queryKey: ['estimates'],
    queryFn: () => estimatesApi.getEstimates(),
  });

  const projectOptions = useMemo(() => {
    const projects = new Map<string, string>();
    for (const est of estimatesData?.content ?? []) {
      if (est.projectId && est.projectName) {
        projects.set(est.projectId, est.projectName);
      }
    }
    return Array.from(projects.entries()).map(([id, name]) => ({
      value: id,
      label: name,
    }));
  }, [estimatesData]);

  const { data: summary, isLoading } = useQuery({
    queryKey: ['summary-estimate', projectId],
    queryFn: () => estimatesApi.getSummaryEstimate(projectId),
    enabled: !!projectId,
  });

  const toggleChapter = (num: number) => {
    setExpandedChapters((prev) => {
      const next = new Set(prev);
      if (next.has(num)) next.delete(num);
      else next.add(num);
      return next;
    });
  };

  const expandAll = () => {
    if (!summary) return;
    setExpandedChapters(new Set(summary.chapters.map((c) => c.number)));
  };

  const collapseAll = () => {
    setExpandedChapters(new Set());
  };

  const constructionWorks = useMemo(() => {
    if (!summary) return 0;
    return summary.chapters
      .filter((c) => [2, 3, 4, 5].includes(c.number))
      .reduce((sum, c) => sum + c.subtotal, 0);
  }, [summary]);

  const equipmentTotal = useMemo(() => {
    if (!summary) return 0;
    return summary.chapters
      .filter((c) => c.number === 9)
      .reduce((sum, c) => sum + c.subtotal, 0);
  }, [summary]);

  const otherExpenses = useMemo(() => {
    if (!summary) return 0;
    return summary.chapters
      .filter((c) => ![2, 3, 4, 5, 9].includes(c.number))
      .reduce((sum, c) => sum + c.subtotal, 0);
  }, [summary]);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('estimates.summary.title')}
        subtitle={t('estimates.summary.subtitle')}
        backTo="/estimates"
        breadcrumbs={[
          { label: t('estimates.summary.breadcrumbHome'), href: '/' },
          { label: t('estimates.summary.breadcrumbEstimates'), href: '/estimates' },
          { label: t('estimates.summary.breadcrumbSummary') },
        ]}
      />

      {/* Project selector */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-6">
        <FormField label={t('estimates.summary.labelProject')} required>
          <Select
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            options={projectOptions}
            placeholder={t('estimates.summary.selectProject')}
          />
        </FormField>
      </div>

      {summary && (
        <>
          {/* Summary MetricCards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <MetricCard
              icon={<Wallet size={18} />}
              label={t('estimates.summary.metricTotal')}
              value={formatMoneyCompact(summary.grandTotal)}
            />
            <MetricCard
              icon={<Building2 size={18} />}
              label={t('estimates.summary.metricConstruction')}
              value={formatMoneyCompact(constructionWorks)}
            />
            <MetricCard
              icon={<Calculator size={18} />}
              label={t('estimates.summary.metricEquipment')}
              value={formatMoneyCompact(equipmentTotal)}
            />
            <MetricCard
              icon={<Percent size={18} />}
              label={t('estimates.summary.metricOther')}
              value={formatMoneyCompact(otherExpenses)}
            />
          </div>

          {/* Overhead and profit summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-5">
              <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1">
                {t('estimates.summary.directCosts')}
              </p>
              <p className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 tabular-nums">
                {formatMoney(summary.totalDirect)}
              </p>
            </div>
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-5">
              <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1">
                {t('estimates.summary.overheadCosts')}
              </p>
              <p className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 tabular-nums">
                {formatMoney(summary.overhead)}
              </p>
            </div>
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-5">
              <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1">
                {t('estimates.summary.profitLabel')}
              </p>
              <p className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 tabular-nums">
                {formatMoney(summary.profit)}
              </p>
            </div>
          </div>

          {/* Chapters tree table */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
            {/* Toolbar */}
            <div className="flex items-center justify-between px-6 py-3 border-b border-neutral-200 dark:border-neutral-700">
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                {t('estimates.summary.chaptersTitle')}
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={expandAll}
                  className="text-xs text-primary-600 dark:text-primary-400 hover:underline"
                >
                  {t('estimates.summary.expandAll')}
                </button>
                <span className="text-neutral-300 dark:text-neutral-600">|</span>
                <button
                  onClick={collapseAll}
                  className="text-xs text-primary-600 dark:text-primary-400 hover:underline"
                >
                  {t('estimates.summary.collapseAll')}
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50">
                    <th className="text-left px-4 py-3 font-medium text-neutral-600 dark:text-neutral-400 w-12">
                      {t('estimates.summary.colChapterNum')}
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-neutral-600 dark:text-neutral-400">
                      {t('estimates.summary.colName')}
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-neutral-600 dark:text-neutral-400">
                      {t('estimates.summary.colEstimateNum')}
                    </th>
                    <th className="text-right px-4 py-3 font-medium text-neutral-600 dark:text-neutral-400">
                      {t('estimates.summary.colAmount')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {summary.chapters.map((chapter) => {
                    const isExpanded = expandedChapters.has(chapter.number);
                    return (
                      <React.Fragment key={chapter.number}>
                        {/* Chapter header row */}
                        <tr
                          className="border-b border-neutral-200 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-800/30 cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800/60"
                          onClick={() => toggleChapter(chapter.number)}
                        >
                          <td className="px-4 py-3 font-semibold text-neutral-900 dark:text-neutral-100 tabular-nums">
                            {chapter.number}
                          </td>
                          <td className="px-4 py-3 font-semibold text-neutral-900 dark:text-neutral-100" colSpan={2}>
                            <div className="flex items-center gap-2">
                              {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                              {chapter.name}
                              <span className="text-xs text-neutral-500 dark:text-neutral-400 font-normal">
                                ({chapter.items.length})
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums font-semibold text-neutral-900 dark:text-neutral-100">
                            {formatMoney(chapter.subtotal)}
                          </td>
                        </tr>

                        {/* Chapter items */}
                        {isExpanded && chapter.items.map((item, idx) => (
                          <tr
                            key={idx}
                            className="border-b border-neutral-100 dark:border-neutral-800"
                          >
                            <td className="px-4 py-2.5" />
                            <td className="px-4 py-2.5 pl-10 text-neutral-700 dark:text-neutral-300">
                              <div className="flex items-center gap-2">
                                <FileText size={14} className="text-neutral-400 flex-shrink-0" />
                                {item.name}
                              </div>
                            </td>
                            <td className="px-4 py-2.5 text-neutral-500 dark:text-neutral-400 text-xs font-mono">
                              {item.estimateNumber}
                            </td>
                            <td className="px-4 py-2.5 text-right tabular-nums text-neutral-700 dark:text-neutral-300">
                              {formatMoney(item.amount)}
                            </td>
                          </tr>
                        ))}
                      </React.Fragment>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-neutral-300 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-800/50">
                    <td colSpan={3} className="px-4 py-3 font-bold text-neutral-900 dark:text-neutral-100">
                      {t('estimates.summary.grandTotalLabel')}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-bold text-lg text-neutral-900 dark:text-neutral-100">
                      {formatMoney(summary.grandTotal)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </>
      )}

      {!projectId && (
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-12 text-center">
          <Building2 size={48} className="mx-auto text-neutral-300 dark:text-neutral-600 mb-4" />
          <p className="text-neutral-500 dark:text-neutral-400">{t('estimates.summary.selectHint')}</p>
        </div>
      )}
    </div>
  );
};

export default SummaryEstimatePage;
