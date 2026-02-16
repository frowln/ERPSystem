import React from 'react';
import { TrendingUp, Wallet, Clock, Users, FileText, Receipt, CreditCard, Calendar, Building2, User } from 'lucide-react';
import { MetricCard } from '@/design-system/components/MetricCard';
import { priorityLabels } from '@/design-system/components/StatusBadge';
import { formatMoney, formatMoneyCompact, formatDate, formatDateLong, formatPercent } from '@/lib/format';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';
import type { Project } from '@/types';
import type { ComputedFinancials } from './hooks/useProjectFinancials';

interface Props {
  project: Project | undefined;
  financials: ComputedFinancials;
  financialsLoading: boolean;
}

const InfoItem: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
  <div className="flex items-start gap-3">
    <span className="text-neutral-400 mt-0.5 flex-shrink-0">{icon}</span>
    <div>
      <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-0.5">{label}</p>
      <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">{value}</p>
    </div>
  </div>
);

export const ProjectOverviewTab: React.FC<Props> = ({ project: p, financials: f, financialsLoading }) => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricCard icon={<TrendingUp size={18} />} label={t('projects.progress')} value={`${f.completionPct.toFixed(0)}%`} subtitle={t('projects.completion')} loading={financialsLoading} />
      <MetricCard icon={<Wallet size={18} />} label={t('dashboard.plannedBudget')} value={formatMoneyCompact(f.plannedBudget)} trend={{ direction: f.budgetUtilPct > 90 ? 'down' : 'up', value: `${f.budgetUtilPct.toFixed(0)}% ${t('projects.budgetUtilization').toLowerCase()}` }} loading={financialsLoading} />
      <MetricCard icon={<Clock size={18} />} label={t('projects.daysRemaining')} value={String(f.daysRemaining)} subtitle={t('projects.untilDate', { date: formatDate(p?.plannedEndDate ?? '') })} />
      <MetricCard icon={<Users size={18} />} label={t('projects.members')} value={String(p?.membersCount ?? 0)} subtitle={t('projects.inTeam')} />
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricCard icon={<FileText size={18} />} label={t('projects.contractAmount')} value={formatMoneyCompact(f.contractAmount)} loading={financialsLoading} />
      <MetricCard icon={<Receipt size={18} />} label={t('projects.invoicedReceived')} value={formatMoneyCompact(f.invoicedToCustomer)} subtitle={t('projects.received', { amount: formatMoneyCompact(f.receivedPayments) })} loading={financialsLoading} />
      <MetricCard icon={<CreditCard size={18} />} label={t('projects.accountsReceivable')} value={formatMoneyCompact(f.accountsReceivable)} loading={financialsLoading} />
      <MetricCard icon={<Wallet size={18} />} label={t('projects.projectMargin')} value={formatMoneyCompact(f.margin)} trend={{ direction: f.margin >= 0 ? 'up' : 'down', value: formatPercent(f.profitabilityPct) }} loading={financialsLoading} className={f.margin < 0 ? 'border-danger-200 bg-danger-50' : undefined} />
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">{t('projects.projectInfo')}</h3>
        {p?.description && (
          <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed mb-6 pb-6 border-b border-neutral-100 dark:border-neutral-800">{p.description}</p>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-5 gap-x-8">
          <InfoItem icon={<Building2 size={15} />} label={t('projects.customer')} value={p?.customerName ?? ''} />
          <InfoItem icon={<User size={15} />} label={t('projects.manager')} value={p?.managerName ?? ''} />
          <InfoItem icon={<Calendar size={15} />} label={t('projects.plannedStart')} value={formatDateLong(p?.plannedStartDate ?? '')} />
          <InfoItem icon={<Calendar size={15} />} label={t('projects.plannedEnd')} value={formatDateLong(p?.plannedEndDate ?? '')} />
          {p?.actualStartDate && <InfoItem icon={<Calendar size={15} />} label={t('projects.actualStart')} value={formatDateLong(p.actualStartDate)} />}
          <InfoItem icon={<FileText size={15} />} label={t('projects.priority')} value={priorityLabels[p?.priority ?? ''] ?? p?.priority ?? ''} />
        </div>
      </div>

      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">{t('projects.budget')}</h3>
        <div className="space-y-4">
          <div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">{t('dashboard.plannedBudget')}</p>
            <p className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 tabular-nums">{formatMoney(f.plannedBudget)}</p>
          </div>
          <div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">{t('projects.contractAmount')}</p>
            <p className="text-base font-medium text-neutral-700 dark:text-neutral-300 tabular-nums">{formatMoney(f.contractAmount)}</p>
          </div>
          <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('projects.budgetUtilization')}</p>
              <p className="text-xs font-medium text-neutral-600 dark:text-neutral-400">{formatPercent(f.budgetUtilPct)}</p>
            </div>
            <div className="w-full h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
              <div
                className={cn('h-full rounded-full transition-all', f.budgetUtilPct > 90 ? 'bg-danger-500' : f.budgetUtilPct > 70 ? 'bg-warning-500' : 'bg-primary-500')}
                style={{ width: `${Math.min(f.budgetUtilPct, 100)}%` }}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-0.5">{t('projects.actualCosts')}</p>
              <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300 tabular-nums">{formatMoneyCompact(f.actualCost)}</p>
            </div>
            <div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-0.5">{t('projects.remaining')}</p>
              <p className={cn('text-sm font-medium tabular-nums', f.remaining > 0 ? 'text-success-600' : 'text-danger-600')}>{formatMoneyCompact(f.remaining)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);
