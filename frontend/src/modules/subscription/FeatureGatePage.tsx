import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Lock, ArrowUpRight, ArrowLeft, Check, X } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';
import { subscriptionApi, type SubscriptionPlan } from '@/api/subscription';

const PLAN_ORDER = ['FREE', 'PRO', 'ENTERPRISE'] as const;

const FeatureGatePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const featureName = searchParams.get('feature') ?? t('subscription.featureGate.defaultFeature');
  const requiredPlan = searchParams.get('plan') ?? 'PRO';

  const { data: plans } = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: subscriptionApi.getPlans,
  });

  const { data: currentSub } = useQuery({
    queryKey: ['subscription-current'],
    queryFn: subscriptionApi.getCurrentSubscription,
  });

  const requiredPlanData = plans?.find((p) => p.name === requiredPlan);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('subscription.featureGate.pageTitle')}
        breadcrumbs={[
          { label: t('common.home'), href: '/' },
          { label: t('subscription.featureGate.breadcrumb') },
        ]}
      />

      <div className="max-w-2xl mx-auto mt-8">
        {/* Lock icon + message */}
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-8 text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mx-auto mb-6">
            <Lock size={28} className="text-neutral-400 dark:text-neutral-500" />
          </div>

          <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-3">
            {t('subscription.featureGate.title')}
          </h2>

          <p className="text-neutral-600 dark:text-neutral-400 mb-2">
            {t('subscription.featureGate.description', { feature: featureName })}
          </p>

          <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-8">
            {t('subscription.featureGate.requiredPlan', {
              plan: requiredPlanData?.displayName ?? requiredPlan,
            })}
          </p>

          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-2 px-4 py-2.5 border border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-300 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 text-sm font-medium transition-colors"
            >
              <ArrowLeft size={16} />
              {t('common.back')}
            </button>
            <button
              onClick={() => navigate('/pricing')}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-500 text-white rounded-lg hover:bg-primary-600 text-sm font-medium transition-colors"
            >
              <ArrowUpRight size={16} />
              {t('subscription.featureGate.upgrade')}
            </button>
          </div>
        </div>

        {/* Mini plan comparison */}
        {plans && plans.length > 0 && (
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-700">
              <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                {t('subscription.featureGate.comparePlans')}
              </h3>
            </div>
            <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {plans
                .sort((a, b) => PLAN_ORDER.indexOf(a.name) - PLAN_ORDER.indexOf(b.name))
                .map((plan) => {
                  const isCurrent = currentSub?.planName === plan.name;
                  const featureKey = searchParams.get('featureKey');
                  const hasFeature = featureKey ? plan.features.includes(featureKey) : true;

                  return (
                    <div
                      key={plan.id}
                      className={cn(
                        'flex items-center justify-between px-6 py-4',
                        isCurrent && 'bg-primary-50/50 dark:bg-primary-900/10',
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div>
                          <span className="font-medium text-neutral-900 dark:text-neutral-100">
                            {plan.displayName}
                          </span>
                          {isCurrent && (
                            <span className="ml-2 text-xs font-medium text-primary-600 bg-primary-100 dark:bg-primary-900/40 px-2 py-0.5 rounded-full">
                              {t('subscription.pricing.currentPlan')}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {hasFeature ? (
                          <Check size={16} className="text-success-500" />
                        ) : (
                          <X size={16} className="text-neutral-300 dark:text-neutral-600" />
                        )}
                        {!isCurrent && hasFeature && (
                          <button
                            onClick={() => navigate('/pricing')}
                            className="text-xs font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
                          >
                            {t('subscription.pricing.upgrade')}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FeatureGatePage;
