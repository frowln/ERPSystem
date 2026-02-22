import React from 'react';
import { BarChart3 } from 'lucide-react';
import { cn } from '@/lib/cn';
import { formatMoneyCompact } from '@/lib/format';
import { t } from '@/i18n';
import type { ComputedFinancials } from '../hooks/useProjectFinancials';

interface MarginSummarySectionProps {
  revenueTotals: { contractAmount: number };
  expenseTotals: { contractAmount: number };
  plannedMargin: number;
  plannedMarginPct: number;
  computed: ComputedFinancials;
}

export const MarginSummarySection = React.memo<MarginSummarySectionProps>(({
  revenueTotals,
  expenseTotals,
  plannedMargin,
  plannedMarginPct,
  computed: f,
}) => (
  <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
    <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center gap-2">
      <BarChart3 size={16} className="text-primary-600" />
      {t('projects.finance.marginCalculation')}
    </h3>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Plan by contracts */}
      <div className="space-y-2.5">
        <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400">{t('projects.finance.planByContracts')}</p>
        <div className="flex justify-between text-sm">
          <span className="text-neutral-600">{t('projects.finance.revenueGkClient')}</span>
          <span className="font-medium tabular-nums text-success-700">{formatMoneyCompact(revenueTotals.contractAmount)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-neutral-600">{t('projects.finance.expensesSubSupply')}</span>
          <span className="font-medium tabular-nums text-danger-600">&minus; {formatMoneyCompact(expenseTotals.contractAmount)}</span>
        </div>
        <div className="border-t border-neutral-100 pt-2.5 flex justify-between text-sm font-semibold">
          <span className="text-neutral-800 dark:text-neutral-200">{t('projects.finance.plannedMarginLabel')}</span>
          <span className={plannedMargin >= 0 ? 'text-success-700' : 'text-danger-600'}>
            {formatMoneyCompact(plannedMargin)} ({plannedMarginPct.toFixed(1)}%)
          </span>
        </div>
      </div>
      {/* Actual by payments */}
      <div className="space-y-2.5">
        <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400">{t('projects.finance.factByPayments')}</p>
        <div className="flex justify-between text-sm">
          <span className="text-neutral-600">{t('projects.finance.receivedFromClient')}</span>
          <span className="font-medium tabular-nums text-success-700">{formatMoneyCompact(f.receivedPayments)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-neutral-600">{t('projects.finance.paidToSuppliers')}</span>
          <span className="font-medium tabular-nums text-danger-600">&minus; {formatMoneyCompact(f.paidToSuppliers)}</span>
        </div>
        <div className="border-t border-neutral-100 pt-2.5 flex justify-between text-sm font-semibold">
          <span className="text-neutral-800 dark:text-neutral-200">{t('projects.finance.netCashFlow')}</span>
          <span className={f.cashFlow >= 0 ? 'text-success-700' : 'text-danger-600'}>
            {formatMoneyCompact(f.cashFlow)}
          </span>
        </div>
      </div>
      {/* Receivables / Payables */}
      <div className="space-y-2.5">
        <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400">{t('projects.finance.debts')}</p>
        <div className="flex justify-between text-sm">
          <span className="text-neutral-600">{t('projects.finance.receivablesOwedToUs')}</span>
          <span className={cn('font-medium tabular-nums', f.accountsReceivable > 0 ? 'text-warning-600' : 'text-neutral-500')}>
            {formatMoneyCompact(Math.max(0, f.accountsReceivable))}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-neutral-600">{t('projects.finance.payablesWeOwe')}</span>
          <span className={cn('font-medium tabular-nums', f.accountsPayable > 0 ? 'text-warning-600' : 'text-neutral-500')}>
            {formatMoneyCompact(Math.max(0, f.accountsPayable))}
          </span>
        </div>
        <div className="border-t border-neutral-100 pt-2.5 flex justify-between text-sm">
          <span className="text-neutral-600">{t('projects.finance.budgetPlan')}</span>
          <span className="font-medium tabular-nums text-neutral-700">{formatMoneyCompact(f.plannedBudget)}</span>
        </div>
      </div>
    </div>
  </div>
));

MarginSummarySection.displayName = 'MarginSummarySection';
