import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Check, X, Crown, Sparkles, Building2 } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';
import { subscriptionApi, type SubscriptionPlan } from '@/api/subscription';

const PLAN_ICONS: Record<string, React.ReactNode> = {
  FREE: <Sparkles size={24} className="text-neutral-500" />,
  PRO: <Crown size={24} className="text-primary-500" />,
  ENTERPRISE: <Building2 size={24} className="text-warning-500" />,
};

const PLAN_COLORS: Record<string, string> = {
  FREE: 'border-neutral-200 dark:border-neutral-700',
  PRO: 'border-primary-500 ring-2 ring-primary-100 dark:ring-primary-900',
  ENTERPRISE: 'border-warning-400 dark:border-warning-600',
};

const ALL_FEATURES = [
  'projects',
  'tasks',
  'documents',
  'basic_reports',
  'budgets',
  'invoices',
  'payments',
  'cash_flow',
  'procurement',
  'quality',
  'analytics',
  'integrations',
  'api_access',
  'bim',
  'iot',
  'ai_assistant',
  'monte_carlo',
  'custom_workflows',
  'sla_support',
  'dedicated_manager',
  'sso',
  'audit_log',
] as const;

function formatQuota(value: number): string {
  if (value >= 2147483647) return t('subscription.pricing.unlimited');
  return String(value);
}

function formatPrice(price: number, currency: string): string {
  if (price === 0) return t('subscription.pricing.free');
  const formatted = new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(price / 100);
  return formatted;
}

const PricingPage: React.FC = () => {
  const { data: plans, isLoading } = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: subscriptionApi.getPlans,
  });

  const { data: currentSub } = useQuery({
    queryKey: ['subscription-current'],
    queryFn: subscriptionApi.getCurrentSubscription,
  });

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('subscription.pricing.title')}
        subtitle={t('subscription.pricing.subtitle')}
        breadcrumbs={[
          { label: t('common.home'), href: '/' },
          { label: t('subscription.pricing.breadcrumb') },
        ]}
      />

      {isLoading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="w-8 h-8 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Plan cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            {(plans ?? []).map((plan) => {
              const isCurrent = currentSub?.planName === plan.name;
              return (
                <div
                  key={plan.id}
                  className={cn(
                    'relative bg-white dark:bg-neutral-900 rounded-xl border p-6 flex flex-col',
                    PLAN_COLORS[plan.name] ?? 'border-neutral-200 dark:border-neutral-700',
                  )}
                >
                  {plan.name === 'PRO' && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                      {t('subscription.pricing.popular')}
                    </div>
                  )}

                  <div className="flex items-center gap-3 mb-4">
                    {PLAN_ICONS[plan.name]}
                    <div>
                      <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                        {plan.displayName}
                      </h3>
                      {isCurrent && (
                        <span className="inline-block mt-0.5 text-xs font-medium text-success-600 bg-success-50 dark:bg-success-900/30 px-2 py-0.5 rounded-full">
                          {t('subscription.pricing.currentPlan')}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mb-6">
                    <span className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 tabular-nums">
                      {formatPrice(plan.price, plan.currency)}
                    </span>
                    {plan.price > 0 && (
                      <span className="text-sm text-neutral-500 dark:text-neutral-400 ml-1">
                        / {t('subscription.pricing.perMonth')}
                      </span>
                    )}
                  </div>

                  {/* Quotas */}
                  <div className="space-y-2 mb-6 text-sm">
                    <div className="flex items-center justify-between text-neutral-700 dark:text-neutral-300">
                      <span>{t('subscription.pricing.users')}</span>
                      <span className="font-medium tabular-nums">{formatQuota(plan.maxUsers)}</span>
                    </div>
                    <div className="flex items-center justify-between text-neutral-700 dark:text-neutral-300">
                      <span>{t('subscription.pricing.projects')}</span>
                      <span className="font-medium tabular-nums">{formatQuota(plan.maxProjects)}</span>
                    </div>
                    <div className="flex items-center justify-between text-neutral-700 dark:text-neutral-300">
                      <span>{t('subscription.pricing.storage')}</span>
                      <span className="font-medium tabular-nums">
                        {plan.maxStorageGb >= 2147483647
                          ? t('subscription.pricing.unlimited')
                          : `${plan.maxStorageGb} ${t('subscription.pricing.gb')}`}
                      </span>
                    </div>
                  </div>

                  {/* CTA button */}
                  <div className="mt-auto">
                    {isCurrent ? (
                      <button
                        disabled
                        className="w-full py-2.5 px-4 rounded-lg text-sm font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-500 cursor-not-allowed"
                      >
                        {t('subscription.pricing.currentPlan')}
                      </button>
                    ) : plan.name === 'ENTERPRISE' ? (
                      <button className="w-full py-2.5 px-4 rounded-lg text-sm font-medium bg-warning-500 text-white hover:bg-warning-600 transition-colors">
                        {t('subscription.pricing.contactSales')}
                      </button>
                    ) : (
                      <button className="w-full py-2.5 px-4 rounded-lg text-sm font-medium bg-primary-500 text-white hover:bg-primary-600 transition-colors">
                        {plan.name === 'FREE'
                          ? t('subscription.pricing.startFree')
                          : t('subscription.pricing.upgrade')}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Feature comparison table */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-700">
              <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                {t('subscription.pricing.featureComparison')}
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-neutral-200 dark:border-neutral-700">
                    <th className="text-left py-3 px-6 text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                      {t('subscription.pricing.feature')}
                    </th>
                    {(plans ?? []).map((plan) => (
                      <th
                        key={plan.id}
                        className="text-center py-3 px-6 text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider"
                      >
                        {plan.displayName}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ALL_FEATURES.map((feature) => (
                    <tr
                      key={feature}
                      className="border-b border-neutral-100 dark:border-neutral-800 last:border-b-0"
                    >
                      <td className="py-3 px-6 text-sm text-neutral-700 dark:text-neutral-300">
                        {t(`subscription.features.${feature}` as Parameters<typeof t>[0])}
                      </td>
                      {(plans ?? []).map((plan) => {
                        const hasFeature = plan.features.includes(feature);
                        return (
                          <td key={plan.id} className="text-center py-3 px-6">
                            {hasFeature ? (
                              <Check size={16} className="inline-block text-success-500" />
                            ) : (
                              <X size={16} className="inline-block text-neutral-300 dark:text-neutral-600" />
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default PricingPage;
