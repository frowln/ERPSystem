import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp, Wallet, FileText, Receipt, Banknote, CreditCard,
  PiggyBank, Target, Activity, BarChart3, ArrowUpRight,
} from 'lucide-react';
import { MetricCard } from '@/design-system/components/MetricCard';
import { Button } from '@/design-system/components/Button';
import { formatMoneyCompact, formatMoneyWhole, formatMoney, formatDate, formatPercent } from '@/lib/format';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';
import type { Project, ProjectFinancialSummary } from '@/types';
import type { ComputedFinancials } from './hooks/useProjectFinancials';

interface Props {
  project: Project | undefined;
  financials: ProjectFinancialSummary | undefined;
  computed: ComputedFinancials;
  financialsLoading: boolean;
}

const FinancialRow: React.FC<{
  label: string;
  value: number;
  bold?: boolean;
  muted?: boolean;
  highlight?: 'warning' | 'danger' | 'success';
}> = ({ label, value, bold, muted, highlight }) => (
  <div className="flex items-center justify-between">
    <span className={cn(
      'text-sm',
      muted ? 'text-neutral-400 italic' : 'text-neutral-600',
      bold && 'font-semibold text-neutral-900 dark:text-neutral-100',
    )}>
      {label}
    </span>
    <span className={cn(
      'text-sm tabular-nums',
      muted ? 'text-neutral-400' : 'text-neutral-800 dark:text-neutral-200',
      bold && 'font-semibold',
      highlight === 'warning' && 'text-warning-600',
      highlight === 'danger' && 'text-danger-600',
      highlight === 'success' && 'text-success-600',
    )}>
      {formatMoneyWhole(value)}
    </span>
  </div>
);

type ProjectCashOperation = {
  id: string;
  date: string;
  category: string;
  counterparty: string;
  direction: 'INCOMING' | 'OUTGOING';
  amount: number;
  documentNo: string;
};

export const ProjectFinanceTab: React.FC<Props> = ({ project: p, financials: fin, computed: f, financialsLoading }) => {
  const navigate = useNavigate();
  const projectCashOps: ProjectCashOperation[] = [];

  return (
    <div className="space-y-6">
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
          <MetricCard icon={<CreditCard size={18} />} label={t('projects.finance.accountsReceivable')} value={formatMoneyCompact(f.accountsReceivable)} trend={f.accountsReceivable > 0 ? { direction: 'neutral', value: t('projects.finance.toReceive') } : undefined} loading={financialsLoading} />
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
          <MetricCard icon={<PiggyBank size={18} />} label={t('projects.finance.accountsPayable')} value={formatMoneyCompact(f.accountsPayable)} trend={f.accountsPayable > 0 ? { direction: 'neutral', value: t('projects.finance.toPay') } : undefined} loading={financialsLoading} />
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

      {/* Detailed breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">{t('projects.finance.incomeDetails')}</h3>
          <div className="space-y-3">
            <FinancialRow label={t('projects.finance.contractAmount')} value={f.contractAmount} />
            <FinancialRow label={t('projects.finance.invoicedToCustomer')} value={f.invoicedToCustomer} />
            <FinancialRow label={t('projects.finance.paymentsReceived')} value={f.receivedPayments} />
            <FinancialRow label={t('projects.finance.accountsReceivable')} value={f.accountsReceivable} highlight={f.accountsReceivable > 0 ? 'warning' : undefined} />
            <div className="border-t border-neutral-100 pt-3">
              <FinancialRow label={t('projects.finance.preliminaryContractEstimate')} value={fin?.preliminaryContractAmount ?? p?.contractAmount ?? 0} muted />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">{t('projects.finance.expenseDetails')}</h3>
          <div className="space-y-3">
            <FinancialRow label={t('projects.finance.plannedBudget')} value={f.plannedBudget} />
            <FinancialRow label={t('projects.finance.estimateTotal')} value={f.estimateTotal} />
            <FinancialRow label={t('projects.finance.committedLabel')} value={f.committed} />
            {fin && (
              <>
                <FinancialRow label={t('projects.finance.subcontracting')} value={fin.subcontractAmount} />
                <FinancialRow label={t('projects.finance.supplies')} value={fin.supplyAmount} />
                <FinancialRow label={t('projects.finance.services')} value={fin.serviceAmount} />
                <FinancialRow label={t('projects.finance.supplierInvoices')} value={fin.invoicedFromSuppliers} />
              </>
            )}
            <FinancialRow label={t('projects.finance.paidToSuppliers')} value={f.paidToSuppliers} />
            <FinancialRow label={t('projects.finance.accountsPayable')} value={f.accountsPayable} highlight={f.accountsPayable > 0 ? 'warning' : undefined} />
            <div className="border-t border-neutral-100 pt-3">
              <FinancialRow label={t('projects.finance.actualCostsTotal')} value={f.actualCost} bold />
              <FinancialRow label={t('projects.finance.preliminaryBudgetEstimate')} value={fin?.preliminaryBudget ?? p?.budget ?? 0} muted />
            </div>
          </div>
        </div>
      </div>

      {/* Cash flow operations */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
        <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{t('projects.finance.cashFlowSection')}</h3>
          <Button variant="secondary" size="sm" iconRight={<ArrowUpRight size={13} />} onClick={() => navigate('/cash-flow')}>
            {t('projects.finance.openCashFlow')}
          </Button>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-neutral-100 bg-neutral-50 dark:bg-neutral-800">
              <th className="px-5 py-2.5 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">{t('projects.finance.headerDate')}</th>
              <th className="px-5 py-2.5 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">{t('projects.finance.headerCategory')}</th>
              <th className="px-5 py-2.5 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">{t('projects.finance.headerCounterparty')}</th>
              <th className="px-5 py-2.5 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">{t('projects.finance.headerDocument')}</th>
              <th className="px-5 py-2.5 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">{t('projects.finance.headerAmount')}</th>
            </tr>
          </thead>
          <tbody>
            {projectCashOps.length === 0 && (
              <tr><td colSpan={5} className="px-5 py-8 text-center text-sm text-neutral-400">{t('projects.finance.noCashFlowData')}</td></tr>
            )}
            {projectCashOps.map((op) => (
              <tr key={op.id} className="border-b border-neutral-100 hover:bg-neutral-50 dark:hover:bg-neutral-800">
                <td className="px-5 py-3 text-sm tabular-nums text-neutral-600">{formatDate(op.date)}</td>
                <td className="px-5 py-3 text-sm text-neutral-700 dark:text-neutral-300">{op.category}</td>
                <td className="px-5 py-3 text-sm text-neutral-600">{op.counterparty}</td>
                <td className="px-5 py-3 text-xs font-mono text-neutral-500 dark:text-neutral-400">{op.documentNo}</td>
                <td className={cn('px-5 py-3 text-sm font-semibold tabular-nums', op.direction === 'INCOMING' ? 'text-success-700' : 'text-danger-700')}>
                  {op.direction === 'INCOMING' ? '+' : '-'}{formatMoney(op.amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
