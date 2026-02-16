import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Modal } from '@/design-system/components/Modal';
import { Button } from '@/design-system/components/Button';
import { FormField, Textarea } from '@/design-system/components/FormField';
import { financeApi } from '@/api/finance';
import { t } from '@/i18n';
import toast from 'react-hot-toast';

interface PaymentApproveWizardProps {
  open: boolean;
  onClose: () => void;
  paymentId?: string;
}

interface PaymentDetails {
  number: string;
  date: string;
  supplier: string;
  contract: string;
  amount: number;
  vat: number;
  total: number;
  purpose: string;
  invoice: string;
  budgetItem: string;
  budgetPlanned: number;
  budgetSpent: number;
  budgetRemaining: number;
}

const STEPS = [t('finance.paymentApprove.stepDetails'), t('finance.paymentApprove.stepBudgetCheck'), t('finance.paymentApprove.stepDecision')];

export const PaymentApproveWizard: React.FC<PaymentApproveWizardProps> = ({ open, onClose, paymentId }) => {
  const [step, setStep] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { data: paymentData } = useQuery({
    queryKey: ['payment-approve', paymentId],
    queryFn: () => financeApi.getPayment(paymentId!),
    enabled: !!paymentId && open,
  });

  const payment = paymentData as unknown as PaymentDetails | undefined;
  const budgetOk = (payment?.total ?? 0) <= (payment?.budgetRemaining ?? 0);
  const budgetUsagePercent = payment?.budgetPlanned
    ? Math.round((((payment?.budgetSpent ?? 0) + (payment?.total ?? 0)) / payment.budgetPlanned) * 100)
    : 0;

  const handleDecision = async (decision: 'APPROVE' | 'REJECT') => {
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 1000));
    if (decision === 'APPROVE') {
      toast.success(t('finance.paymentApprove.toastApproved', { number: payment?.number ?? '' }));
    } else {
      toast.error(t('finance.paymentApprove.toastRejected', { number: payment?.number ?? '' }));
    }
    setSubmitting(false);
    resetAndClose();
  };

  const resetAndClose = () => {
    setStep(0);
    setComment('');
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={resetAndClose}
      title={t('finance.paymentApprove.modalTitle')}
      size="lg"
      footer={
        step < STEPS.length - 1 ? (
          <>
            <Button variant="secondary" onClick={step === 0 ? resetAndClose : () => setStep(step - 1)}>
              {step === 0 ? t('finance.paymentApprove.cancel') : t('finance.paymentApprove.back')}
            </Button>
            <Button onClick={() => setStep(step + 1)}>{t('finance.paymentApprove.next')}</Button>
          </>
        ) : (
          <>
            <Button variant="secondary" onClick={() => setStep(step - 1)}>
              {t('finance.paymentApprove.back')}
            </Button>
            <Button variant="danger" onClick={() => handleDecision('REJECT')} loading={submitting}>
              {t('finance.paymentApprove.reject')}
            </Button>
            <Button variant="success" onClick={() => handleDecision('APPROVE')} loading={submitting}>
              {t('finance.paymentApprove.approve')}
            </Button>
          </>
        )
      }
    >
      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-6">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${
                i <= step ? 'bg-primary-600 text-white' : 'bg-neutral-200 text-neutral-500 dark:text-neutral-400'
              }`}
            >
              {i + 1}
            </div>
            <span className={`text-sm ${i <= step ? 'text-neutral-900 dark:text-neutral-100 font-medium' : 'text-neutral-400'}`}>
              {label}
            </span>
            {i < STEPS.length - 1 && <div className="w-8 h-px bg-neutral-300" />}
          </div>
        ))}
      </div>

      {/* Step 1: Payment details */}
      {step === 0 && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg p-4">
            <div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('finance.paymentApprove.paymentNumber')}</p>
              <p className="text-sm font-semibold">{payment?.number ?? ''}</p>
            </div>
            <div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('finance.paymentApprove.date')}</p>
              <p className="text-sm">{payment?.date ?? ''}</p>
            </div>
            <div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('finance.paymentApprove.supplier')}</p>
              <p className="text-sm">{payment?.supplier ?? ''}</p>
            </div>
            <div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('finance.paymentApprove.contract')}</p>
              <p className="text-sm">{payment?.contract ?? ''}</p>
            </div>
            <div className="col-span-2">
              <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('finance.paymentApprove.purpose')}</p>
              <p className="text-sm">{payment?.purpose ?? ''}</p>
            </div>
          </div>

          <div className="border border-neutral-200 dark:border-neutral-700 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <tbody>
                <tr className="border-b border-neutral-100">
                  <td className="px-4 py-2 text-neutral-600">{t('finance.paymentApprove.amountExclVat')}</td>
                  <td className="px-4 py-2 text-right font-medium">{(payment?.amount ?? 0).toLocaleString('ru-RU')} ₽</td>
                </tr>
                <tr className="border-b border-neutral-100">
                  <td className="px-4 py-2 text-neutral-600">{t('finance.paymentApprove.vat')}</td>
                  <td className="px-4 py-2 text-right font-medium">{(payment?.vat ?? 0).toLocaleString('ru-RU')} ₽</td>
                </tr>
                <tr className="bg-neutral-50 dark:bg-neutral-800">
                  <td className="px-4 py-2 font-semibold">{t('finance.paymentApprove.totalPayable')}</td>
                  <td className="px-4 py-2 text-right font-bold text-lg">{(payment?.total ?? 0).toLocaleString('ru-RU')} ₽</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Step 2: Budget check */}
      {step === 1 && (
        <div className="space-y-4">
          <div className="bg-neutral-50 dark:bg-neutral-800 rounded-lg p-4">
            <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">{t('finance.paymentApprove.budgetItem')}: {payment?.budgetItem ?? ''}</p>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('finance.paymentApprove.planned')}</p>
                <p className="text-sm font-semibold">{(payment?.budgetPlanned ?? 0).toLocaleString('ru-RU')} ₽</p>
              </div>
              <div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('finance.paymentApprove.spent')}</p>
                <p className="text-sm font-semibold">{(payment?.budgetSpent ?? 0).toLocaleString('ru-RU')} ₽</p>
              </div>
              <div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('finance.paymentApprove.remaining')}</p>
                <p className="text-sm font-semibold">{(payment?.budgetRemaining ?? 0).toLocaleString('ru-RU')} ₽</p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mb-2">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-neutral-500 dark:text-neutral-400">{t('finance.paymentApprove.budgetUsage')}</span>
                <span className={budgetUsagePercent > 90 ? 'text-danger-600 font-medium' : 'text-neutral-600'}>
                  {budgetUsagePercent}%
                </span>
              </div>
              <div className="w-full h-2 bg-neutral-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    budgetUsagePercent > 90 ? 'bg-danger-500' : budgetUsagePercent > 70 ? 'bg-warning-500' : 'bg-success-500'
                  }`}
                  style={{ width: `${Math.min(budgetUsagePercent, 100)}%` }}
                />
              </div>
            </div>
          </div>

          <div className={`rounded-lg p-3 border ${budgetOk ? 'bg-success-50 border-success-200' : 'bg-danger-50 border-danger-200'}`}>
            <p className={`text-sm font-medium ${budgetOk ? 'text-success-800' : 'text-danger-800'}`}>
              {budgetOk
                ? t('finance.paymentApprove.budgetOk')
                : t('finance.paymentApprove.budgetExceeded')}
            </p>
            <p className={`text-xs mt-1 ${budgetOk ? 'text-success-700' : 'text-danger-700'}`}>
              {t('finance.paymentApprove.budgetSummary', { payment: (payment?.total ?? 0).toLocaleString('ru-RU'), remaining: (payment?.budgetRemaining ?? 0).toLocaleString('ru-RU') })}
            </p>
          </div>
        </div>
      )}

      {/* Step 3: Decision */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="bg-neutral-50 dark:bg-neutral-800 rounded-lg p-3 text-sm">
            <p><strong>{payment?.number ?? ''}</strong> | {payment?.supplier ?? ''}</p>
            <p className="text-neutral-600 mt-1">{t('finance.paymentApprove.summaryAmount')}: <strong>{(payment?.total ?? 0).toLocaleString('ru-RU')} ₽</strong></p>
            <p className={`mt-1 ${budgetOk ? 'text-success-700' : 'text-danger-700'}`}>
              {t('finance.paymentApprove.summaryBudget')}: {budgetOk ? t('finance.paymentApprove.withinBudget') : t('finance.paymentApprove.overBudget')}
            </p>
          </div>

          <FormField label={t('finance.paymentApprove.commentLabel')}>
            <Textarea
              placeholder={t('finance.paymentApprove.commentPlaceholder')}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
            />
          </FormField>

          <div className="bg-primary-50 border border-primary-200 rounded-lg p-3">
            <p className="text-sm text-primary-800">
              {t('finance.paymentApprove.confirmInfo')}
            </p>
          </div>
        </div>
      )}
    </Modal>
  );
};
