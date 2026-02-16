import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Modal } from '@/design-system/components/Modal';
import { Button } from '@/design-system/components/Button';
import { FormField, Textarea } from '@/design-system/components/FormField';
import { procurementApi } from '@/api/procurement';
import { t } from '@/i18n';
import toast from 'react-hot-toast';

interface ApprovalWizardProps {
  open: boolean;
  onClose: () => void;
  itemId?: string;
}

interface ApprovalItem {
  number: string;
  title: string;
  requestor: string;
  department: string;
  date: string;
  total: number;
  items: Array<{ name: string; qty: number; unit: string; price: number }>;
  budgetRemaining: number;
}

const getSteps = () => [t('procurement.approvalWizard.stepDetails'), t('procurement.approvalWizard.stepDecision')];

export const ApprovalWizard: React.FC<ApprovalWizardProps> = ({ open, onClose, itemId }) => {
  const [step, setStep] = useState(0);
  const [comment, setComment] = useState('');
  const [conditions, setConditions] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { data: requestData } = useQuery({
    queryKey: ['purchase-request-approve', itemId],
    queryFn: () => procurementApi.getPurchaseRequest(itemId!),
    enabled: !!itemId && open,
  });

  const item: ApprovalItem = {
    number: requestData?.name ?? '',
    title: requestData?.name ?? '',
    requestor: requestData?.requestedByName ?? '',
    department: (requestData as any)?.department ?? '',
    date: requestData?.requestDate ?? '',
    total: requestData?.totalAmount ?? 0,
    items: (requestData as any)?.items ?? [],
    budgetRemaining: (requestData as any)?.budgetRemaining ?? 0,
  };
  const budgetOk = item.total <= item.budgetRemaining;

  const handleDecision = async (decision: 'APPROVE' | 'REJECT' | 'RETURN') => {
    setSubmitting(true);
    try {
      await procurementApi.approvePurchaseRequest(itemId!, {
        decision,
        comment: comment || undefined,
        conditions: conditions || undefined,
      });
      const decisionLabel = decision === 'APPROVE'
        ? t('procurement.approvalWizard.decisionApproved')
        : decision === 'REJECT'
          ? t('procurement.approvalWizard.decisionRejected')
          : t('procurement.approvalWizard.decisionReturned');
      toast.success(`${t('procurement.approvalWizard.toastRequest')} ${item.number} ${decisionLabel}`);
      resetAndClose();
    } catch {
      toast.error(t('procurement.approvalWizard.toastRequest'));
    } finally {
      setSubmitting(false);
    }
  };

  const resetAndClose = () => {
    setStep(0);
    setComment('');
    setConditions('');
    onClose();
  };

  const STEPS = getSteps();

  return (
    <Modal
      open={open}
      onClose={resetAndClose}
      title={t('procurement.approvalWizard.title')}
      size="lg"
      footer={
        step === 0 ? (
          <>
            <Button variant="secondary" onClick={resetAndClose}>
              {t('procurement.approvalWizard.cancel')}
            </Button>
            <Button onClick={() => setStep(1)}>{t('procurement.approvalWizard.next')}</Button>
          </>
        ) : (
          <>
            <Button variant="secondary" onClick={() => setStep(0)}>
              {t('procurement.approvalWizard.back')}
            </Button>
            <Button variant="ghost" onClick={() => handleDecision('RETURN')} loading={submitting}>
              {t('procurement.approvalWizard.returnForRevision')}
            </Button>
            <Button variant="danger" onClick={() => handleDecision('REJECT')} loading={submitting}>
              {t('procurement.approvalWizard.reject')}
            </Button>
            <Button variant="success" onClick={() => handleDecision('APPROVE')} loading={submitting}>
              {t('procurement.approvalWizard.approve')}
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

      {/* Step 1: Item details */}
      {step === 0 && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg p-4">
            <div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('procurement.approvalWizard.requestNumber')}</p>
              <p className="text-sm font-semibold">{item.number}</p>
            </div>
            <div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('procurement.approvalWizard.date')}</p>
              <p className="text-sm">{item.date}</p>
            </div>
            <div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('procurement.approvalWizard.initiator')}</p>
              <p className="text-sm">{item.requestor}</p>
            </div>
            <div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('procurement.approvalWizard.department')}</p>
              <p className="text-sm">{item.department}</p>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">{t('procurement.approvalWizard.requestItems')}</p>
            <div className="border border-neutral-200 dark:border-neutral-700 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-neutral-50 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700">
                    <th className="text-left px-3 py-2 font-medium text-neutral-600">{t('procurement.approvalWizard.thName')}</th>
                    <th className="text-right px-3 py-2 font-medium text-neutral-600">{t('procurement.approvalWizard.thQuantity')}</th>
                    <th className="text-right px-3 py-2 font-medium text-neutral-600">{t('procurement.approvalWizard.thPrice')}</th>
                    <th className="text-right px-3 py-2 font-medium text-neutral-600">{t('procurement.approvalWizard.thAmount')}</th>
                  </tr>
                </thead>
                <tbody>
                  {item.items.map((line, idx) => (
                    <tr key={idx} className="border-b border-neutral-100">
                      <td className="px-3 py-2">{line.name}</td>
                      <td className="px-3 py-2 text-right">{line.qty} {line.unit}</td>
                      <td className="px-3 py-2 text-right">{line.price.toLocaleString('ru-RU')} ₽</td>
                      <td className="px-3 py-2 text-right font-medium">
                        {(line.qty * line.price).toLocaleString('ru-RU')} ₽
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-neutral-50 dark:bg-neutral-800">
                    <td colSpan={3} className="px-3 py-2 font-semibold text-right">{t('procurement.approvalWizard.total')}:</td>
                    <td className="px-3 py-2 text-right font-bold">{item.total.toLocaleString('ru-RU')} ₽</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <div className={`rounded-lg p-3 border ${budgetOk ? 'bg-success-50 border-success-200' : 'bg-danger-50 border-danger-200'}`}>
            <p className={`text-sm ${budgetOk ? 'text-success-800' : 'text-danger-800'}`}>
              {budgetOk
                ? `${t('procurement.approvalWizard.budgetSufficient')} (${t('procurement.approvalWizard.remaining')} ${item.budgetRemaining.toLocaleString('ru-RU')} ₽)`
                : `${t('procurement.approvalWizard.budgetExceeded')} (${t('procurement.approvalWizard.remaining')} ${item.budgetRemaining.toLocaleString('ru-RU')} ₽)`}
            </p>
          </div>
        </div>
      )}

      {/* Step 2: Decision */}
      {step === 1 && (
        <div className="space-y-4">
          <div className="bg-neutral-50 dark:bg-neutral-800 rounded-lg p-3">
            <p className="text-sm">
              <strong>{item.number}</strong> - {item.title}
            </p>
            <p className="text-sm text-neutral-600 mt-1">
              {t('procurement.approvalWizard.amount')}: <strong>{item.total.toLocaleString('ru-RU')} ₽</strong>
            </p>
          </div>

          <FormField label={t('procurement.approvalWizard.commentLabel')}>
            <Textarea
              placeholder={t('procurement.approvalWizard.commentPlaceholder')}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
            />
          </FormField>

          <FormField label={t('procurement.approvalWizard.conditionsLabel')}>
            <Textarea
              placeholder={t('procurement.approvalWizard.conditionsPlaceholder')}
              value={conditions}
              onChange={(e) => setConditions(e.target.value)}
              rows={2}
            />
          </FormField>

          <div className="bg-primary-50 border border-primary-200 rounded-lg p-3">
            <p className="text-sm text-primary-800">
              {t('procurement.approvalWizard.actionPrompt')}
            </p>
          </div>
        </div>
      )}
    </Modal>
  );
};
