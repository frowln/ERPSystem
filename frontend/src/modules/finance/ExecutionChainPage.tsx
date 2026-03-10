import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  FileText,
  Wallet,
  ClipboardCheck,
  Receipt,
  CreditCard,
  ChevronRight,
  ArrowRight,
  FolderSearch,
} from 'lucide-react';
import { financeApi } from '@/api/finance';
import { useProjectOptions as useProjectSelectOptions } from '@/hooks/useSelectOptions';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Select } from '@/design-system/components/FormField';
import { Skeleton } from '@/design-system/components/Skeleton';
import { formatMoney, formatQuantity, formatPercent } from '@/lib/format';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';
import type { ExecutionChainEntry } from '@/modules/finance/types';

// ---------------------------------------------------------------------------
// Stage configuration
// ---------------------------------------------------------------------------

interface StageConfig {
  key: string;
  labelKey: string;
  icon: React.ReactNode;
  colorClass: string;
  barColor: string;
  totalField: 'totalEstimate' | 'totalBudget' | 'totalKs2' | 'totalInvoiced' | 'totalPaid';
}

const STAGES: StageConfig[] = [
  {
    key: 'estimate',
    labelKey: 'finance.executionChain.stageEstimate',
    icon: <FileText size={20} />,
    colorClass: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950',
    barColor: 'bg-blue-500',
    totalField: 'totalEstimate',
  },
  {
    key: 'budget',
    labelKey: 'finance.executionChain.stageBudget',
    icon: <Wallet size={20} />,
    colorClass: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950',
    barColor: 'bg-indigo-500',
    totalField: 'totalBudget',
  },
  {
    key: 'ks2',
    labelKey: 'finance.executionChain.stageKs2',
    icon: <ClipboardCheck size={20} />,
    colorClass: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950',
    barColor: 'bg-amber-500',
    totalField: 'totalKs2',
  },
  {
    key: 'invoice',
    labelKey: 'finance.executionChain.stageInvoiced',
    icon: <Receipt size={20} />,
    colorClass: 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950',
    barColor: 'bg-orange-500',
    totalField: 'totalInvoiced',
  },
  {
    key: 'payment',
    labelKey: 'finance.executionChain.stagePaid',
    icon: <CreditCard size={20} />,
    colorClass: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950',
    barColor: 'bg-emerald-500',
    totalField: 'totalPaid',
  },
];

// ---------------------------------------------------------------------------
// Project selector options
// ---------------------------------------------------------------------------

function useProjectOptions() {
  const { options } = useProjectSelectOptions();
  return options;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** Single pipeline stage card */
function StageCard({
  stage,
  amount,
  percent,
  loading,
}: {
  stage: StageConfig;
  amount: number;
  percent: number;
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="flex-1 min-w-[160px] bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4">
        <div className="animate-pulse space-y-3">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-6 w-28" />
          <Skeleton className="h-2 w-full rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 min-w-[160px] bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4 transition-shadow duration-200 hover:shadow-md">
      <div className="flex items-center gap-2 mb-2">
        <span className={cn('p-1.5 rounded-lg', stage.colorClass)}>
          {stage.icon}
        </span>
        <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
          {t(stage.labelKey)}
        </span>
      </div>
      <p className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 tabular-nums mb-1">
        {formatMoney(amount)}
      </p>
      <div className="flex items-center gap-2">
        <div className="flex-1 h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all duration-500', stage.barColor)}
            style={{ width: `${Math.min(percent, 100)}%` }}
          />
        </div>
        <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400 tabular-nums whitespace-nowrap">
          {formatPercent(percent)}
        </span>
      </div>
      <p className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-1">
        {t('finance.executionChain.ofEstimate')}
      </p>
    </div>
  );
}

/** Arrow connector between stages showing leakage */
function ArrowConnector({ leakage, loading }: { leakage: number; loading: boolean }) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center px-1 shrink-0">
        <ArrowRight size={18} className="text-neutral-300 dark:text-neutral-600" />
      </div>
    );
  }

  const isLoss = leakage > 0;
  const isGain = leakage < 0;

  return (
    <div className="flex flex-col items-center justify-center px-1 shrink-0">
      <ArrowRight size={18} className="text-neutral-400 dark:text-neutral-500" />
      {leakage !== 0 && (
        <span
          className={cn(
            'text-[10px] font-medium mt-0.5 whitespace-nowrap',
            isLoss && 'text-red-500 dark:text-red-400',
            isGain && 'text-emerald-500 dark:text-emerald-400',
          )}
        >
          {isLoss ? '-' : '+'}
          {formatMoney(Math.abs(leakage))}
        </span>
      )}
    </div>
  );
}

/** The 5-stage horizontal pipeline */
function ExecutionPipeline({
  totals,
  loading,
}: {
  totals: Record<string, number>;
  loading: boolean;
}) {
  const estimate = totals.totalEstimate || 0;

  return (
    <div className="mb-6">
      <h2 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-3">
        {t('finance.executionChain.pipelineTitle')}
      </h2>

      {/* Desktop: horizontal row */}
      <div className="hidden md:flex items-stretch gap-0">
        {STAGES.map((stage, idx) => {
          const amount = totals[stage.totalField] || 0;
          const percent = estimate > 0 ? (amount / estimate) * 100 : 0;

          // Leakage = previous stage amount - this stage amount
          const prevAmount = idx > 0 ? (totals[STAGES[idx - 1].totalField] || 0) : 0;
          const leakage = idx > 0 ? prevAmount - amount : 0;

          return (
            <React.Fragment key={stage.key}>
              {idx > 0 && <ArrowConnector leakage={leakage} loading={loading} />}
              <StageCard stage={stage} amount={amount} percent={percent} loading={loading} />
            </React.Fragment>
          );
        })}
      </div>

      {/* Mobile: vertical stack */}
      <div className="flex flex-col gap-2 md:hidden">
        {STAGES.map((stage, idx) => {
          const amount = totals[stage.totalField] || 0;
          const percent = estimate > 0 ? (amount / estimate) * 100 : 0;

          const prevAmount = idx > 0 ? (totals[STAGES[idx - 1].totalField] || 0) : 0;
          const leakage = idx > 0 ? prevAmount - amount : 0;

          return (
            <React.Fragment key={stage.key}>
              {idx > 0 && leakage !== 0 && (
                <div className="flex items-center gap-2 px-4 py-1">
                  <ChevronRight size={14} className="text-neutral-400 dark:text-neutral-500 rotate-90" />
                  <span
                    className={cn(
                      'text-xs font-medium',
                      leakage > 0 ? 'text-red-500 dark:text-red-400' : 'text-emerald-500 dark:text-emerald-400',
                    )}
                  >
                    {t('finance.executionChain.leakage')}: {leakage > 0 ? '-' : '+'}
                    {formatMoney(Math.abs(leakage))}
                  </span>
                </div>
              )}
              <StageCard stage={stage} amount={amount} percent={percent} loading={loading} />
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

/** Execution percent color */
function executionColor(pct: number): string {
  if (pct >= 90) return 'bg-emerald-500';
  if (pct >= 50) return 'bg-amber-500';
  return 'bg-neutral-300 dark:bg-neutral-600';
}

function executionTextColor(pct: number): string {
  if (pct >= 90) return 'text-emerald-600 dark:text-emerald-400';
  if (pct >= 50) return 'text-amber-600 dark:text-amber-400';
  return 'text-neutral-500 dark:text-neutral-400';
}

/** Detail table row */
function DetailRow({ entry }: { entry: ExecutionChainEntry }) {
  return (
    <tr className="border-b border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
      <td className="px-3 py-2.5 text-sm text-neutral-900 dark:text-neutral-100 font-medium max-w-[200px] truncate">
        {entry.name}
      </td>
      <td className="px-3 py-2.5 text-sm text-neutral-500 dark:text-neutral-400 text-center">
        {entry.unit}
      </td>
      <td className="px-3 py-2.5 text-sm text-neutral-700 dark:text-neutral-300 text-right tabular-nums">
        {formatQuantity(entry.estimateQty)}
      </td>
      <td className="px-3 py-2.5 text-sm text-neutral-700 dark:text-neutral-300 text-right tabular-nums">
        {formatMoney(entry.estimateAmount)}
      </td>
      <td className="px-3 py-2.5 text-sm text-neutral-700 dark:text-neutral-300 text-right tabular-nums">
        {formatMoney(entry.budgetAmount)}
      </td>
      <td className="px-3 py-2.5 text-sm text-neutral-700 dark:text-neutral-300 text-right tabular-nums">
        {formatQuantity(entry.ks2Qty)}
      </td>
      <td className="px-3 py-2.5 text-sm text-neutral-700 dark:text-neutral-300 text-right tabular-nums">
        {formatMoney(entry.ks2Amount)}
      </td>
      <td className="px-3 py-2.5 text-sm text-neutral-700 dark:text-neutral-300 text-right tabular-nums">
        {formatMoney(entry.invoicedAmount)}
      </td>
      <td className="px-3 py-2.5 text-sm text-neutral-700 dark:text-neutral-300 text-right tabular-nums">
        {formatMoney(entry.paidAmount)}
      </td>
      <td className="px-3 py-2.5">
        <div className="flex items-center gap-2 min-w-[100px]">
          <div className="flex-1 h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
            <div
              className={cn('h-full rounded-full transition-all duration-300', executionColor(entry.executionPercent))}
              style={{ width: `${Math.min(entry.executionPercent, 100)}%` }}
            />
          </div>
          <span className={cn('text-xs font-medium tabular-nums w-10 text-right', executionTextColor(entry.executionPercent))}>
            {formatPercent(entry.executionPercent)}
          </span>
        </div>
      </td>
    </tr>
  );
}

/** Totals footer row */
function TotalsRow({ items }: { items: ExecutionChainEntry[] }) {
  const sum = (fn: (e: ExecutionChainEntry) => number) => items.reduce((acc, e) => acc + fn(e), 0);

  const totalEstimate = sum((e) => e.estimateAmount);
  const totalBudget = sum((e) => e.budgetAmount);
  const totalKs2 = sum((e) => e.ks2Amount);
  const totalInvoiced = sum((e) => e.invoicedAmount);
  const totalPaid = sum((e) => e.paidAmount);
  const overallExecution = totalEstimate > 0 ? (totalPaid / totalEstimate) * 100 : 0;

  return (
    <tr className="bg-neutral-50 dark:bg-neutral-800/70 font-semibold">
      <td className="px-3 py-3 text-sm text-neutral-900 dark:text-neutral-100">
        {t('finance.executionChain.totalsRow')}
      </td>
      <td className="px-3 py-3" />
      <td className="px-3 py-3" />
      <td className="px-3 py-3 text-sm text-neutral-900 dark:text-neutral-100 text-right tabular-nums">
        {formatMoney(totalEstimate)}
      </td>
      <td className="px-3 py-3 text-sm text-neutral-900 dark:text-neutral-100 text-right tabular-nums">
        {formatMoney(totalBudget)}
      </td>
      <td className="px-3 py-3" />
      <td className="px-3 py-3 text-sm text-neutral-900 dark:text-neutral-100 text-right tabular-nums">
        {formatMoney(totalKs2)}
      </td>
      <td className="px-3 py-3 text-sm text-neutral-900 dark:text-neutral-100 text-right tabular-nums">
        {formatMoney(totalInvoiced)}
      </td>
      <td className="px-3 py-3 text-sm text-neutral-900 dark:text-neutral-100 text-right tabular-nums">
        {formatMoney(totalPaid)}
      </td>
      <td className="px-3 py-3">
        <div className="flex items-center gap-2 min-w-[100px]">
          <div className="flex-1 h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
            <div
              className={cn('h-full rounded-full', executionColor(overallExecution))}
              style={{ width: `${Math.min(overallExecution, 100)}%` }}
            />
          </div>
          <span className={cn('text-xs font-semibold tabular-nums w-10 text-right', executionTextColor(overallExecution))}>
            {formatPercent(overallExecution)}
          </span>
        </div>
      </td>
    </tr>
  );
}

/** Detail table section */
function DetailTable({ items, loading }: { items: ExecutionChainEntry[]; loading: boolean }) {
  if (loading) {
    return (
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
        <div className="px-4 py-3 border-b border-neutral-100 dark:border-neutral-800">
          <Skeleton className="h-5 w-48" />
        </div>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex gap-4 px-4 py-3 border-b border-neutral-100 dark:border-neutral-800">
            {Array.from({ length: 8 }).map((_, j) => (
              <Skeleton key={j} className="h-4 flex-1" />
            ))}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
      <div className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-700">
        <h2 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
          {t('finance.executionChain.detailTitle')}
        </h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1000px]">
          <thead>
            <tr className="bg-neutral-50 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700">
              <th className="px-3 py-2.5 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                {t('finance.executionChain.colWorkItem')}
              </th>
              <th className="px-3 py-2.5 text-center text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                {t('finance.executionChain.colUnit')}
              </th>
              <th className="px-3 py-2.5 text-right text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                {t('finance.executionChain.colEstimateQty')}
              </th>
              <th className="px-3 py-2.5 text-right text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                {t('finance.executionChain.colEstimateAmt')}
              </th>
              <th className="px-3 py-2.5 text-right text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                {t('finance.executionChain.colBudgetAmt')}
              </th>
              <th className="px-3 py-2.5 text-right text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                {t('finance.executionChain.colKs2Qty')}
              </th>
              <th className="px-3 py-2.5 text-right text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                {t('finance.executionChain.colKs2Amt')}
              </th>
              <th className="px-3 py-2.5 text-right text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                {t('finance.executionChain.colInvoiced')}
              </th>
              <th className="px-3 py-2.5 text-right text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                {t('finance.executionChain.colPaid')}
              </th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider min-w-[130px]">
                {t('finance.executionChain.colExecution')}
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((entry) => (
              <DetailRow key={entry.id} entry={entry} />
            ))}
          </tbody>
          {items.length > 0 && (
            <tfoot>
              <TotalsRow items={items} />
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}

/** Empty state when no project is selected */
function EmptyProjectState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
      <div className="text-neutral-300 dark:text-neutral-600 mb-4">
        <FolderSearch size={48} strokeWidth={1.5} />
      </div>
      <h3 className="text-base font-medium text-neutral-700 dark:text-neutral-300 mb-1">
        {t('finance.executionChain.emptyTitle')}
      </h3>
      <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-sm">
        {t('finance.executionChain.emptyDescription')}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function ExecutionChainPage() {
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const projectOptions = useProjectOptions();

  const {
    data: chain,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['execution-chain', selectedProjectId],
    queryFn: () => financeApi.getExecutionChain(selectedProjectId),
    enabled: !!selectedProjectId,
  });

  const totals: Record<string, number> = {
    totalEstimate: chain?.totalEstimate ?? 0,
    totalBudget: chain?.totalBudget ?? 0,
    totalKs2: chain?.totalKs2 ?? 0,
    totalInvoiced: chain?.totalInvoiced ?? 0,
    totalPaid: chain?.totalPaid ?? 0,
  };

  return (
    <div className="flex flex-col h-full overflow-auto">
      <div className="px-6 pt-4 pb-0">
        <PageHeader
          title={t('finance.executionChain.title')}
          subtitle={t('finance.executionChain.subtitle')}
          breadcrumbs={[
            { label: t('finance.executionChain.breadcrumbHome'), href: '/' },
            { label: t('finance.executionChain.breadcrumbFinance'), href: '/budgets' },
            { label: t('finance.executionChain.breadcrumbChain') },
          ]}
          actions={
            <div className="w-64">
              <Select
                options={projectOptions}
                placeholder={t('finance.executionChain.selectProjectPlaceholder')}
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
              />
            </div>
          }
        />
      </div>

      <div className="flex-1 px-6 pb-6">
        {!selectedProjectId ? (
          <EmptyProjectState />
        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
            <div className="text-red-300 dark:text-red-600 mb-4">
              <FolderSearch size={48} strokeWidth={1.5} />
            </div>
            <h3 className="text-base font-medium text-red-700 dark:text-red-300 mb-1">
              {t('finance.executionChain.errorTitle')}
            </h3>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-sm">
              {t('finance.executionChain.errorDescription')}
            </p>
          </div>
        ) : (
          <>
            <ExecutionPipeline totals={totals} loading={isLoading} />
            <DetailTable items={chain?.items ?? []} loading={isLoading} />
          </>
        )}
      </div>
    </div>
  );
}
