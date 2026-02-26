import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  CreditCard, Users, FolderKanban, HardDrive, ArrowUpRight,
  Calendar, Clock, CheckCircle2, AlertTriangle, Receipt,
  ChevronLeft, ChevronRight,
} from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { cn } from '@/lib/cn';
import { formatDateTime } from '@/lib/format';
import { t } from '@/i18n';
import {
  subscriptionApi,
  type SubscriptionPlan,
  type TenantSubscription,
  type UsageInfo,
  type PaymentStatus,
} from '@/api/subscription';

const QUOTA_ICONS: Record<string, React.ElementType> = {
  users: Users,
  projects: FolderKanban,
  storage: HardDrive,
};

const STATUS_MAP: Record<string, { color: string; icon: React.ElementType }> = {
  ACTIVE: { color: 'text-success-600 bg-success-50 dark:bg-success-900/30', icon: CheckCircle2 },
  TRIAL: { color: 'text-primary-600 bg-primary-50 dark:bg-primary-900/30', icon: Clock },
  EXPIRED: { color: 'text-danger-600 bg-danger-50 dark:bg-danger-900/30', icon: AlertTriangle },
  CANCELLED: { color: 'text-neutral-500 bg-neutral-100 dark:bg-neutral-800', icon: AlertTriangle },
};

const PAYMENT_STATUS_COLORS: Record<PaymentStatus, string> = {
  PAID: 'text-success-600 bg-success-50 dark:bg-success-900/30',
  PENDING: 'text-warning-600 bg-warning-50 dark:bg-warning-900/30',
  OVERDUE: 'text-danger-600 bg-danger-50 dark:bg-danger-900/30',
  CANCELLED: 'text-neutral-500 bg-neutral-100 dark:bg-neutral-800',
  REFUNDED: 'text-primary-600 bg-primary-50 dark:bg-primary-900/30',
};

function formatQuotaValue(value: number): string {
  if (value >= 2147483647) return t('subscription.pricing.unlimited');
  return String(value);
}

function formatAmount(amount: number, currency: string): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount / 100);
}

const SubscriptionDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [billingPage, setBillingPage] = useState(0);

  const { data: currentSub, isLoading: subLoading } = useQuery({
    queryKey: ['subscription-current'],
    queryFn: subscriptionApi.getCurrentSubscription,
  });

  const { data: usage, isLoading: usageLoading } = useQuery({
    queryKey: ['subscription-usage'],
    queryFn: subscriptionApi.getUsage,
  });

  const { data: plans } = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: subscriptionApi.getPlans,
  });

  const { data: billingHistory } = useQuery({
    queryKey: ['subscription-billing-history', billingPage],
    queryFn: () => subscriptionApi.getBillingHistory(billingPage, 10),
  });

  const changePlanMutation = useMutation({
    mutationFn: (planId: string) => subscriptionApi.changePlan(planId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-current'] });
      queryClient.invalidateQueries({ queryKey: ['subscription-usage'] });
      toast.success(t('subscription.dashboard.planChanged'));
    },
    onError: () => {
      toast.error(t('subscription.dashboard.planChangeError'));
    },
  });

  const isLoading = subLoading || usageLoading;
  const statusConfig = currentSub ? STATUS_MAP[currentSub.status] : undefined;
  const StatusIcon = statusConfig?.icon ?? CheckCircle2;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('subscription.dashboard.title')}
        subtitle={t('subscription.dashboard.subtitle')}
        breadcrumbs={[
          { label: t('common.home'), href: '/' },
          { label: t('common.settings'), href: '/settings' },
          { label: t('subscription.dashboard.breadcrumb') },
        ]}
        actions={
          <button
            onClick={() => navigate('/pricing')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 text-sm font-medium transition-colors"
          >
            <ArrowUpRight size={16} />
            {t('subscription.dashboard.viewPlans')}
          </button>
        }
      />

      {isLoading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="w-8 h-8 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Current plan card */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-primary-50 dark:bg-primary-900/30 rounded-lg">
                  <CreditCard size={20} className="text-primary-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                    {currentSub?.planDisplayName ?? t('subscription.dashboard.noPlan')}
                  </h3>
                  {statusConfig && (
                    <span className={cn('inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full mt-1', statusConfig.color)}>
                      <StatusIcon size={12} />
                      {currentSub?.statusDisplayName}
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right text-sm text-neutral-500 dark:text-neutral-400">
                {currentSub?.startDate && (
                  <div className="flex items-center gap-1.5">
                    <Calendar size={14} />
                    <span>{t('subscription.dashboard.since')} {formatDateTime(currentSub.startDate)}</span>
                  </div>
                )}
                {currentSub?.trialEndDate && currentSub.status === 'TRIAL' && (
                  <div className="flex items-center gap-1.5 mt-1 text-warning-600">
                    <Clock size={14} />
                    <span>{t('subscription.dashboard.trialEnds')} {formatDateTime(currentSub.trialEndDate)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Usage bars */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {(usage?.quotas ?? []).map((quota) => {
              const Icon = QUOTA_ICONS[quota.quotaType] ?? HardDrive;
              const percent = quota.max > 0 && quota.max < 2147483647
                ? Math.min((quota.current / quota.max) * 100, 100)
                : 0;
              const isUnlimited = quota.max >= 2147483647;
              const isWarning = percent >= 80 && !isUnlimited;
              const isDanger = percent >= 95 || quota.exceeded;

              return (
                <div
                  key={quota.quotaType}
                  className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-5"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Icon size={16} className="text-neutral-500 dark:text-neutral-400" />
                    <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      {t(`subscription.quotas.${quota.quotaType}` as Parameters<typeof t>[0])}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 tabular-nums">
                      {quota.current}
                    </span>
                    <span className="text-sm text-neutral-500 dark:text-neutral-400">
                      / {formatQuotaValue(quota.max)}
                    </span>
                  </div>
                  {!isUnlimited && (
                    <div className="w-full h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all',
                          isDanger ? 'bg-danger-500' : isWarning ? 'bg-warning-500' : 'bg-primary-500',
                        )}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  )}
                  {isUnlimited && (
                    <p className="text-xs text-neutral-400 dark:text-neutral-500">
                      {t('subscription.pricing.unlimited')}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Plan comparison / upgrade section */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
              {t('subscription.dashboard.availablePlans')}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(plans ?? []).map((plan) => {
                const isCurrent = currentSub?.planName === plan.name;
                return (
                  <div
                    key={plan.id}
                    className={cn(
                      'rounded-lg border p-4',
                      isCurrent
                        ? 'border-primary-300 dark:border-primary-700 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-neutral-200 dark:border-neutral-700',
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-neutral-900 dark:text-neutral-100">{plan.displayName}</h4>
                      {isCurrent && (
                        <span className="text-xs font-medium text-primary-600 bg-primary-100 dark:bg-primary-900/40 px-2 py-0.5 rounded-full">
                          {t('subscription.pricing.currentPlan')}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-3">
                      {formatQuotaValue(plan.maxUsers)} {t('subscription.pricing.users').toLowerCase()},&nbsp;
                      {formatQuotaValue(plan.maxProjects)} {t('subscription.pricing.projects').toLowerCase()}
                    </p>
                    {!isCurrent && (
                      <button
                        onClick={() => {
                          if (plan.name === 'ENTERPRISE') {
                            toast(t('subscription.dashboard.contactSalesHint'));
                          } else {
                            changePlanMutation.mutate(plan.id);
                          }
                        }}
                        disabled={changePlanMutation.isPending}
                        className={cn(
                          'w-full py-2 px-3 rounded-lg text-sm font-medium transition-colors',
                          plan.name === 'ENTERPRISE'
                            ? 'bg-warning-500 text-white hover:bg-warning-600'
                            : 'bg-primary-500 text-white hover:bg-primary-600',
                        )}
                      >
                        {plan.name === 'ENTERPRISE'
                          ? t('subscription.pricing.contactSales')
                          : t('subscription.pricing.upgrade')}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Billing history */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden mt-6">
            <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-700 flex items-center gap-2">
              <Receipt size={18} className="text-neutral-500 dark:text-neutral-400" />
              <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                {t('subscription.billing.title')}
              </h3>
            </div>

            {billingHistory && billingHistory.content.length > 0 ? (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-neutral-200 dark:border-neutral-700">
                        <th className="text-left py-3 px-6 text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                          {t('subscription.billing.invoiceNumber')}
                        </th>
                        <th className="text-left py-3 px-6 text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                          {t('subscription.billing.date')}
                        </th>
                        <th className="text-left py-3 px-6 text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                          {t('subscription.billing.plan')}
                        </th>
                        <th className="text-right py-3 px-6 text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                          {t('subscription.billing.amount')}
                        </th>
                        <th className="text-center py-3 px-6 text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                          {t('subscription.billing.status')}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {billingHistory.content.map((record) => (
                        <tr
                          key={record.id}
                          className="border-b border-neutral-100 dark:border-neutral-800 last:border-b-0"
                        >
                          <td className="py-3 px-6 text-sm font-mono text-neutral-700 dark:text-neutral-300">
                            {record.invoiceNumber ?? '---'}
                          </td>
                          <td className="py-3 px-6 text-sm text-neutral-600 dark:text-neutral-400">
                            {formatDateTime(record.invoiceDate)}
                          </td>
                          <td className="py-3 px-6 text-sm text-neutral-700 dark:text-neutral-300">
                            {record.planDisplayName}
                          </td>
                          <td className="py-3 px-6 text-sm text-right font-medium text-neutral-900 dark:text-neutral-100 tabular-nums">
                            {formatAmount(record.amount, record.currency)}
                          </td>
                          <td className="py-3 px-6 text-center">
                            <span
                              className={cn(
                                'inline-block text-xs font-medium px-2 py-0.5 rounded-full',
                                PAYMENT_STATUS_COLORS[record.paymentStatus] ?? 'text-neutral-500 bg-neutral-100',
                              )}
                            >
                              {record.paymentStatusDisplayName}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {billingHistory.totalPages > 1 && (
                  <div className="flex items-center justify-between px-6 py-3 border-t border-neutral-200 dark:border-neutral-700">
                    <span className="text-xs text-neutral-500 dark:text-neutral-400">
                      {t('subscription.billing.page')} {billingHistory.number + 1} / {billingHistory.totalPages}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setBillingPage((p) => Math.max(0, p - 1))}
                        disabled={billingPage === 0}
                        className="p-1.5 rounded-md border border-neutral-200 dark:border-neutral-700 text-neutral-500 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <button
                        onClick={() => setBillingPage((p) => p + 1)}
                        disabled={billingPage >= billingHistory.totalPages - 1}
                        className="p-1.5 rounded-md border border-neutral-200 dark:border-neutral-700 text-neutral-500 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="px-6 py-10 text-center">
                <Receipt size={24} className="mx-auto text-neutral-300 dark:text-neutral-600 mb-2" />
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  {t('subscription.billing.empty')}
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default SubscriptionDashboardPage;
