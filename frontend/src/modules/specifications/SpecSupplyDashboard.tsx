import React, { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Package, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { MetricCard } from '@/design-system/components/MetricCard';
import { specificationsApi } from '@/api/specifications';
import { formatMoney, formatPercent } from '@/lib/format';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';
import type { SpecItem } from './types';

const SpecSupplyDashboard: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const { data: spec } = useQuery({
    queryKey: ['specification', id],
    queryFn: () => specificationsApi.getSpecification(id!),
    enabled: !!id,
  });

  const { data: items = [] } = useQuery({
    queryKey: ['spec-items', id],
    queryFn: () => specificationsApi.getSpecItems(id!),
    enabled: !!id,
  });

  const stats = useMemo(() => {
    const fc = items.filter(i => i.supplyStatus === 'FULLY_COVERED');
    const pc = items.filter(i => i.supplyStatus === 'PARTIALLY_COVERED');
    const nc = items.filter(i => !i.supplyStatus || i.supplyStatus === 'NOT_COVERED');
    const totalAmount = items.reduce((s, i) => s + (i.plannedAmount ?? 0), 0);
    const coveredAmount = fc.reduce((s, i) => s + (i.plannedAmount ?? 0), 0);
    const partialAmount = pc.reduce((s, i) => s + (i.plannedAmount ?? 0), 0);
    return {
      total: items.length,
      fullyCovered: fc.length,
      partiallyCovered: pc.length,
      notCovered: nc.length,
      totalAmount,
      coveredAmount,
      partialAmount,
      coveragePercent: items.length > 0 ? (fc.length / items.length) * 100 : 0,
    };
  }, [items]);

  // Group by itemType for section breakdown
  const sectionBreakdown = useMemo(() => {
    const sections: Record<string, { total: number; covered: number; partial: number; notCovered: number; amount: number }> = {};
    for (const item of items) {
      const key = item.itemType;
      if (!sections[key]) sections[key] = { total: 0, covered: 0, partial: 0, notCovered: 0, amount: 0 };
      sections[key].total++;
      sections[key].amount += item.plannedAmount ?? 0;
      if (item.supplyStatus === 'FULLY_COVERED') sections[key].covered++;
      else if (item.supplyStatus === 'PARTIALLY_COVERED') sections[key].partial++;
      else sections[key].notCovered++;
    }
    return sections;
  }, [items]);

  const typeLabels: Record<string, string> = {
    MATERIAL: t('specifications.splitView.typeMaterial'),
    EQUIPMENT: t('specifications.splitView.typeEquipment'),
    WORK: t('specifications.splitView.typeWork'),
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('specifications.supplyDashboard.title')}
        subtitle={spec?.name ?? ''}
        backTo={`/specifications/${id}`}
        breadcrumbs={[
          { label: t('common.home'), href: '/' },
          { label: t('nav.specifications'), href: '/specifications' },
          { label: spec?.name ?? '', href: `/specifications/${id}` },
          { label: t('specifications.supplyDashboard.breadcrumb') },
        ]}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard
          icon={<Package size={18} />}
          label={t('specifications.supplyDashboard.totalPositions')}
          value={String(stats.total)}
        />
        <MetricCard
          icon={<CheckCircle size={18} />}
          label={t('specifications.supplyDashboard.fullyCovered')}
          value={String(stats.fullyCovered)}
          trend={{ direction: 'up', value: formatPercent(stats.coveragePercent) }}
        />
        <MetricCard
          icon={<AlertTriangle size={18} />}
          label={t('specifications.supplyDashboard.partiallyCovered')}
          value={String(stats.partiallyCovered)}
        />
        <MetricCard
          icon={<XCircle size={18} />}
          label={t('specifications.supplyDashboard.notCoveredCount')}
          value={String(stats.notCovered)}
        />
      </div>

      {/* Donut chart area (text-based) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Coverage donut */}
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">{t('specifications.supplyDashboard.coverageSummary')}</h3>
          <div className="flex items-center gap-8">
            {/* Simple donut visualization */}
            <div className="relative w-32 h-32">
              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="currentColor" className="text-neutral-100 dark:text-neutral-800" strokeWidth="3" />
                <circle cx="18" cy="18" r="15.915" fill="none" className="text-success-500" strokeWidth="3"
                  strokeDasharray={`${stats.coveragePercent} ${100 - stats.coveragePercent}`} strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold tabular-nums">{stats.coveragePercent.toFixed(0)}%</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-success-500" />
                <span className="text-sm text-neutral-700 dark:text-neutral-300">{t('specifications.supplyDashboard.fullyCovered')}</span>
                <span className="text-sm font-semibold ml-auto tabular-nums">{stats.fullyCovered}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-warning-500" />
                <span className="text-sm text-neutral-700 dark:text-neutral-300">{t('specifications.supplyDashboard.partiallyCovered')}</span>
                <span className="text-sm font-semibold ml-auto tabular-nums">{stats.partiallyCovered}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-danger-500" />
                <span className="text-sm text-neutral-700 dark:text-neutral-300">{t('specifications.supplyDashboard.notCoveredCount')}</span>
                <span className="text-sm font-semibold ml-auto tabular-nums">{stats.notCovered}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Amount breakdown */}
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">{t('specifications.supplyDashboard.amountBreakdown')}</h3>
          <div className="space-y-4">
            <div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">{t('specifications.supplyDashboard.totalAmount')}</p>
              <p className="text-xl font-bold tabular-nums">{formatMoney(stats.totalAmount)}</p>
            </div>
            <div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">{t('specifications.supplyDashboard.coveredAmount')}</p>
              <p className="text-lg font-semibold text-success-600 tabular-nums">{formatMoney(stats.coveredAmount)}</p>
            </div>
            <div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">{t('specifications.supplyDashboard.uncoveredAmount')}</p>
              <p className="text-lg font-semibold text-danger-600 tabular-nums">{formatMoney(stats.totalAmount - stats.coveredAmount - stats.partialAmount)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Section breakdown */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">{t('specifications.supplyDashboard.bySection')}</h3>
        <div className="space-y-4">
          {Object.entries(sectionBreakdown).map(([type, data]) => {
            const pct = data.total > 0 ? (data.covered / data.total) * 100 : 0;
            return (
              <div key={type}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{typeLabels[type] ?? type}</span>
                  <span className="text-sm text-neutral-500 dark:text-neutral-400">
                    {data.covered}/{data.total} &middot; {formatMoney(data.amount)}
                  </span>
                </div>
                <div className="w-full h-2.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden flex">
                  <div className="h-full bg-success-500" style={{ width: `${data.total > 0 ? (data.covered / data.total) * 100 : 0}%` }} />
                  <div className="h-full bg-warning-500" style={{ width: `${data.total > 0 ? (data.partial / data.total) * 100 : 0}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SpecSupplyDashboard;
