import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { t } from '@/i18n';

const PaymentResultPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const paymentStatus = searchParams.get('payment'); // 'success' | 'cancelled' | etc.

  const isSuccess = paymentStatus === 'success';
  const isCancelled = paymentStatus === 'cancelled';
  const isPending = !isSuccess && !isCancelled;

  useEffect(() => {
    if (isPending) {
      const timer = setTimeout(() => navigate('/settings/subscription'), 5000);
      return () => clearTimeout(timer);
    }
  }, [isPending, navigate]);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('subscription.payment.resultTitle')}
        breadcrumbs={[
          { label: t('common.home'), href: '/' },
          { label: t('subscription.dashboard.breadcrumb'), href: '/settings/subscription' },
          { label: t('subscription.payment.resultBreadcrumb') },
        ]}
      />

      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-10 text-center max-w-md w-full">
          {isSuccess ? (
            <>
              <CheckCircle2 size={56} className="mx-auto text-success-500 mb-4" />
              <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
                {t('subscription.payment.successTitle')}
              </h2>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-6">
                {t('subscription.payment.successDescription')}
              </p>
            </>
          ) : isCancelled ? (
            <>
              <XCircle size={56} className="mx-auto text-danger-500 mb-4" />
              <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
                {t('subscription.payment.cancelledTitle')}
              </h2>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-6">
                {t('subscription.payment.cancelledDescription')}
              </p>
            </>
          ) : (
            <>
              <Loader2 size={56} className="mx-auto text-primary-500 mb-4 animate-spin" />
              <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
                {t('subscription.payment.pendingTitle')}
              </h2>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-6">
                {t('subscription.payment.pendingDescription')}
              </p>
            </>
          )}

          <Button
            variant="primary"
            onClick={() => navigate('/settings/subscription')}
          >
            {t('subscription.payment.backToSubscription')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PaymentResultPage;
