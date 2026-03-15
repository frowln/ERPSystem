import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Check, X, Crown, Sparkles, Building2, Loader2, CreditCard, Landmark } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { cn } from '@/lib/cn';
import { formatMoneyWhole } from '@/lib/format';
import { t } from '@/i18n';
import { subscriptionApi, type SubscriptionPlan } from '@/api/subscription';
import toast from 'react-hot-toast';

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

function formatPrice(price: number): string {
  if (price === 0) return t('subscription.pricing.free');
  return formatMoneyWhole(price / 100);
}

type PaymentMethod = 'card' | 'bank';

interface BankInvoiceFormData {
  buyerName: string;
  buyerInn: string;
  buyerKpp: string;
  buyerAddress: string;
}

const PricingPage: React.FC = () => {
  const [payingPlanId, setPayingPlanId] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [showBankForm, setShowBankForm] = useState(false);
  const [bankForm, setBankForm] = useState<BankInvoiceFormData>({
    buyerName: '',
    buyerInn: '',
    buyerKpp: '',
    buyerAddress: '',
  });
  const [bankInvoiceResult, setBankInvoiceResult] = useState<{ invoiceNumber: string; amount: number } | null>(null);

  const { data: plans, isLoading } = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: subscriptionApi.getPlans,
  });

  const { data: currentSub } = useQuery({
    queryKey: ['subscription-current'],
    queryFn: subscriptionApi.getCurrentSubscription,
  });

  const paymentMutation = useMutation({
    mutationFn: (planId: string) => subscriptionApi.createPayment(planId),
    onSuccess: (data) => {
      if (data.confirmationUrl) {
        window.location.href = data.confirmationUrl;
      } else {
        toast.error(t('subscription.payment.noRedirectUrl'));
        setPayingPlanId(null);
      }
    },
    onError: () => {
      toast.error(t('subscription.payment.error'));
      setPayingPlanId(null);
    },
  });

  const bankInvoiceMutation = useMutation({
    mutationFn: (data: { planId: string } & BankInvoiceFormData) =>
      subscriptionApi.createBankInvoice({
        planId: data.planId,
        buyerName: data.buyerName,
        buyerInn: data.buyerInn,
        buyerKpp: data.buyerKpp || undefined,
        buyerAddress: data.buyerAddress || undefined,
      }),
    onSuccess: (data) => {
      setBankInvoiceResult({ invoiceNumber: data.invoiceNumber, amount: data.amount });
      setShowBankForm(false);
      toast.success(t('subscription.bankInvoice.created'));
    },
    onError: () => {
      toast.error(t('subscription.bankInvoice.error'));
    },
  });

  const handleUpgrade = (plan: SubscriptionPlan) => {
    if (plan.name === 'ENTERPRISE') {
      toast(t('subscription.dashboard.contactSalesHint'));
      return;
    }
    if (plan.price === 0) {
      toast(t('subscription.payment.freeNoPay'));
      return;
    }
    setSelectedPlan(plan);
    setPaymentMethod('card');
    setShowBankForm(false);
    setBankInvoiceResult(null);
  };

  const handleCardPayment = () => {
    if (!selectedPlan) return;
    setPayingPlanId(selectedPlan.id);
    paymentMutation.mutate(selectedPlan.id);
  };

  const handleBankInvoiceSubmit = () => {
    if (!selectedPlan) return;
    if (!bankForm.buyerName.trim() || !bankForm.buyerInn.trim()) {
      toast.error(t('subscription.bankInvoice.fillRequired'));
      return;
    }
    bankInvoiceMutation.mutate({
      planId: selectedPlan.id,
      ...bankForm,
    });
  };

  const closePlanModal = () => {
    setSelectedPlan(null);
    setShowBankForm(false);
    setPayingPlanId(null);
    setBankInvoiceResult(null);
    setBankForm({ buyerName: '', buyerInn: '', buyerKpp: '', buyerAddress: '' });
  };

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
                      {formatPrice(plan.price)}
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
                      <Button variant="secondary" size="sm" fullWidth disabled>
                        {t('subscription.pricing.currentPlan')}
                      </Button>
                    ) : plan.name === 'ENTERPRISE' ? (
                      <Button
                        variant="secondary"
                        size="sm"
                        fullWidth
                        onClick={() => handleUpgrade(plan)}
                      >
                        {t('subscription.pricing.contactSales')}
                      </Button>
                    ) : (
                      <Button
                        variant="primary"
                        size="sm"
                        fullWidth
                        onClick={() => handleUpgrade(plan)}
                        disabled={payingPlanId === plan.id}
                        iconLeft={payingPlanId === plan.id ? <Loader2 size={16} className="animate-spin" /> : undefined}
                      >
                        {plan.name === 'FREE'
                          ? t('subscription.pricing.startFree')
                          : t('subscription.pricing.upgrade')}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Payment method selection modal */}
          {selectedPlan && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
              <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-2xl w-full max-w-lg mx-4 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                    {t('subscription.bankInvoice.selectMethod')}
                  </h3>
                  <button
                    onClick={closePlanModal}
                    className="p-1 rounded-md text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                {bankInvoiceResult ? (
                  /* Success message after bank invoice created */
                  <div className="text-center py-6">
                    <div className="w-12 h-12 bg-success-100 dark:bg-success-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Check size={24} className="text-success-600" />
                    </div>
                    <h4 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
                      {t('subscription.bankInvoice.successTitle')}
                    </h4>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">
                      {t('subscription.bankInvoice.invoiceLabel')}: <span className="font-mono font-medium">{bankInvoiceResult.invoiceNumber}</span>
                    </p>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
                      {t('subscription.bankInvoice.successHint')}
                    </p>
                    <Button variant="secondary" size="sm" onClick={closePlanModal}>
                      {t('common.close')}
                    </Button>
                  </div>
                ) : showBankForm ? (
                  /* Bank invoice form */
                  <div className="space-y-4">
                    <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-2">
                      {t('subscription.bankInvoice.formHint')}
                    </p>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                        {t('subscription.bankInvoice.companyName')} *
                      </label>
                      <input
                        type="text"
                        value={bankForm.buyerName}
                        onChange={(e) => setBankForm((prev) => ({ ...prev, buyerName: e.target.value }))}
                        placeholder={t('subscription.bankInvoice.companyNamePlaceholder')}
                        className="w-full rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-sm text-neutral-800 dark:text-neutral-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                          {t('subscription.bankInvoice.inn')} *
                        </label>
                        <input
                          type="text"
                          value={bankForm.buyerInn}
                          onChange={(e) => setBankForm((prev) => ({ ...prev, buyerInn: e.target.value }))}
                          placeholder="7707123456"
                          maxLength={12}
                          className="w-full rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-sm text-neutral-800 dark:text-neutral-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                          {t('subscription.bankInvoice.kpp')}
                        </label>
                        <input
                          type="text"
                          value={bankForm.buyerKpp}
                          onChange={(e) => setBankForm((prev) => ({ ...prev, buyerKpp: e.target.value }))}
                          placeholder="770701001"
                          maxLength={9}
                          className="w-full rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-sm text-neutral-800 dark:text-neutral-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                        {t('subscription.bankInvoice.address')}
                      </label>
                      <input
                        type="text"
                        value={bankForm.buyerAddress}
                        onChange={(e) => setBankForm((prev) => ({ ...prev, buyerAddress: e.target.value }))}
                        placeholder={t('subscription.bankInvoice.addressPlaceholder')}
                        className="w-full rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-sm text-neutral-800 dark:text-neutral-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    <div className="flex items-center justify-between pt-2">
                      <button
                        onClick={() => setShowBankForm(false)}
                        className="text-sm text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors"
                      >
                        {t('common.back')}
                      </button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={handleBankInvoiceSubmit}
                        disabled={bankInvoiceMutation.isPending}
                        iconLeft={bankInvoiceMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : undefined}
                      >
                        {t('subscription.bankInvoice.submit')}
                      </Button>
                    </div>
                  </div>
                ) : (
                  /* Payment method selection */
                  <div className="space-y-3">
                    <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
                      {t('subscription.bankInvoice.planLabel')}: <span className="font-semibold">{selectedPlan.displayName}</span>
                      {' '}&mdash;{' '}
                      <span className="font-semibold tabular-nums">{formatPrice(selectedPlan.price)}</span>
                      <span className="text-neutral-400">/{t('subscription.pricing.perMonth')}</span>
                    </p>

                    {/* Card payment option */}
                    <button
                      onClick={() => { setPaymentMethod('card'); handleCardPayment(); }}
                      className={cn(
                        'w-full flex items-center gap-4 p-4 rounded-lg border-2 transition-all text-left',
                        paymentMethod === 'card'
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                          : 'border-neutral-200 dark:border-neutral-700 hover:border-primary-300 dark:hover:border-primary-700',
                      )}
                      disabled={payingPlanId === selectedPlan.id}
                    >
                      <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center flex-shrink-0">
                        <CreditCard size={20} className="text-primary-600 dark:text-primary-400" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                          {t('subscription.bankInvoice.cardPayment')}
                        </div>
                        <div className="text-xs text-neutral-500 dark:text-neutral-400">
                          {t('subscription.bankInvoice.cardHint')}
                        </div>
                      </div>
                      {payingPlanId === selectedPlan.id && (
                        <Loader2 size={16} className="animate-spin text-primary-500" />
                      )}
                    </button>

                    {/* Bank transfer option */}
                    <button
                      onClick={() => { setPaymentMethod('bank'); setShowBankForm(true); }}
                      className={cn(
                        'w-full flex items-center gap-4 p-4 rounded-lg border-2 transition-all text-left',
                        paymentMethod === 'bank'
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                          : 'border-neutral-200 dark:border-neutral-700 hover:border-primary-300 dark:hover:border-primary-700',
                      )}
                    >
                      <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center flex-shrink-0">
                        <Landmark size={20} className="text-amber-600 dark:text-amber-400" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                          {t('subscription.bankInvoice.bankTransfer')}
                        </div>
                        <div className="text-xs text-neutral-500 dark:text-neutral-400">
                          {t('subscription.bankInvoice.bankHint')}
                        </div>
                      </div>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

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
