import React from 'react';
import {
  TrendingUp, Wallet, FileText, Receipt, Banknote, CreditCard,
  PiggyBank, Target, Activity, BarChart3,
} from 'lucide-react';
import { MetricCard } from '@/design-system/components/MetricCard';
import { formatMoneyCompact, formatPercent } from '@/lib/format';
import { t } from '@/i18n';
import type { ComputedFinancials } from '../hooks/useProjectFinancials';

interface FinanceMetricCardsProps {
  computed: ComputedFinancials;
  financialsLoading: boolean;
}

export const FinanceMetricCards = React.memo<FinanceMetricCardsProps>(({
  computed: f,
  financialsLoading,
}) => (
  <>
    {/* Income */}
    <div>
      <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-3 flex items-center gap-2">
        <TrendingUp size={16} className="text-success-600" />
        {t('projects.finance.incomeSection')}
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard icon={<FileText size={18} />} label={t('projects.finance.contractAmount')} value={formatMoneyCompact(f.contractAmount)} loading={financialsLoading} />
        <MetricCard icon={<Receipt size={18} />} label={t('projects.finance.invoiced')} value={formatMoneyCompact(f.invoicedToCustomer)} loading={financialsLoading} />
        <MetricCard icon={<Banknote size={18} />} label={t('projects.finance.paymentsReceived')} value={formatMoneyCompact(f.receivedPayments)} loading={financialsLoading} />
        <MetricCard icon={<CreditCard size={18} />} label={t('projects.finance.accountsReceivable')} value={formatMoneyCompact(Math.max(0, f.accountsReceivable))} trend={f.accountsReceivable > 0 ? { direction: 'neutral', value: t('projects.finance.toReceive') } : undefined} loading={financialsLoading} />
      </div>
    </div>

    {/* Expenses */}
    <div>
      <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-3 flex items-center gap-2">
        <Wallet size={16} className="text-danger-600" />
        {t('projects.finance.expenseSection')}
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard icon={<Wallet size={18} />} label={t('projects.finance.plannedBudget')} value={formatMoneyCompact(f.plannedBudget)} loading={financialsLoading} />
        <MetricCard icon={<Target size={18} />} label={t('projects.finance.commitments')} value={formatMoneyCompact(f.committed)} loading={financialsLoading} />
        <MetricCard icon={<CreditCard size={18} />} label={t('projects.finance.actualCosts')} value={formatMoneyCompact(f.actualCost)} trend={{ direction: f.budgetUtilPct > 90 ? 'down' : 'up', value: t('projects.finance.budgetPct', { pct: f.budgetUtilPct.toFixed(0) }) }} loading={financialsLoading} />
        <MetricCard icon={<PiggyBank size={18} />} label={t('projects.finance.accountsPayable')} value={formatMoneyCompact(Math.max(0, f.accountsPayable))} trend={f.accountsPayable > 0 ? { direction: 'neutral', value: t('projects.finance.toPay') } : undefined} loading={financialsLoading} />
      </div>
    </div>

    {/* Indicators */}
    <div>
      <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-3 flex items-center gap-2">
        <BarChart3 size={16} className="text-primary-600" />
        {t('projects.finance.indicatorsSection')}
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard icon={<TrendingUp size={18} />} label={t('projects.finance.margin')} value={formatMoneyCompact(f.margin)} loading={financialsLoading} className={f.margin < 0 ? 'border-danger-200 bg-danger-50' : f.margin > 0 ? 'border-success-200 bg-success-50' : undefined} />
        <MetricCard icon={<Activity size={18} />} label={t('projects.finance.profitability')} value={formatPercent(f.profitabilityPct)} trend={{ direction: f.profitabilityPct > 10 ? 'up' : f.profitabilityPct < 0 ? 'down' : 'neutral', value: f.profitabilityPct > 10 ? t('projects.finance.profitabilityGood') : f.profitabilityPct < 0 ? t('projects.finance.profitabilityLoss') : t('projects.finance.profitabilityLow') }} loading={financialsLoading} className={f.profitabilityPct < 0 ? 'border-danger-200 bg-danger-50' : f.profitabilityPct > 10 ? 'border-success-200 bg-success-50' : undefined} />
        <MetricCard icon={<Target size={18} />} label={t('projects.finance.budgetUtilization')} value={formatPercent(f.budgetUtilPct)} trend={{ direction: f.budgetUtilPct > 90 ? 'down' : 'up', value: f.budgetUtilPct > 90 ? t('projects.finance.overBudget') : t('projects.finance.withinBudget') }} loading={financialsLoading} />
        <MetricCard icon={<Banknote size={18} />} label={t('projects.finance.cashFlow')} value={formatMoneyCompact(f.cashFlow)} trend={{ direction: f.cashFlow >= 0 ? 'up' : 'down', value: f.cashFlow >= 0 ? t('projects.finance.cashFlowPositive') : t('projects.finance.cashFlowNegative') }} loading={financialsLoading} className={f.cashFlow < 0 ? 'border-danger-200 bg-danger-50' : undefined} />
      </div>
    </div>
  </>
));

FinanceMetricCards.displayName = 'FinanceMetricCards';
