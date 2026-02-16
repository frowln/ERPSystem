import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Modal } from '@/design-system/components/Modal';
import { Button } from '@/design-system/components/Button';
import { FormField, Input, Textarea, Checkbox } from '@/design-system/components/FormField';
import { procurementApi } from '@/api/procurement';
import { t } from '@/i18n';
import toast from 'react-hot-toast';

interface MergeRequestsWizardProps {
  open: boolean;
  onClose: () => void;
}

interface PurchaseRequest {
  id: string;
  number: string;
  title: string;
  supplier: string;
  total: number;
  itemCount: number;
  date: string;
}


const getSteps = () => [
  t('procurement.mergeWizard.stepSelectRequests'),
  t('procurement.mergeWizard.stepPreview'),
  t('procurement.mergeWizard.stepConfirm'),
];

export const MergeRequestsWizard: React.FC<MergeRequestsWizardProps> = ({ open, onClose }) => {
  const queryClient = useQueryClient();

  const { data: prData } = useQuery({
    queryKey: ['purchase-requests-for-merge'],
    queryFn: () => procurementApi.getPurchaseRequests(),
    enabled: open,
  });

  const allRequests: PurchaseRequest[] = (prData?.content ?? []).map((r) => ({
    id: r.id,
    number: r.name,
    title: r.name,
    supplier: r.assignedToName ?? '',
    total: r.totalAmount,
    itemCount: r.itemCount,
    date: r.requestDate,
  }));

  const [step, setStep] = useState(0);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [mergedTitle, setMergedTitle] = useState('');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const toggleRequest = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selected = allRequests.filter((r) => selectedIds.has(r.id));
  const totalAmount = selected.reduce((sum, r) => sum + r.total, 0);
  const totalItems = selected.reduce((sum, r) => sum + r.itemCount, 0);

  const handleFinish = async () => {
    setSubmitting(true);
    try {
      await procurementApi.mergePurchaseRequests({
        requestIds: [...selectedIds],
        title: mergedTitle,
        comment: comment || undefined,
      });
      queryClient.invalidateQueries({ queryKey: ['purchase-requests'] });
      toast.success(`${t('procurement.mergeWizard.toastMerged')}: ${selected.length} -> 1`);
      resetAndClose();
    } catch {
      toast.error(t('procurement.mergeWizard.toastMerged'));
    } finally {
      setSubmitting(false);
    }
  };

  const resetAndClose = () => {
    setStep(0);
    setSelectedIds(new Set());
    setMergedTitle('');
    setComment('');
    onClose();
  };

  const canNext = step === 0 ? selectedIds.size >= 2 : step === 1 ? mergedTitle.trim() !== '' : true;

  const STEPS = getSteps();

  return (
    <Modal
      open={open}
      onClose={resetAndClose}
      title={t('procurement.mergeWizard.title')}
      size="xl"
      footer={
        <>
          <Button variant="secondary" onClick={step === 0 ? resetAndClose : () => setStep(step - 1)}>
            {step === 0 ? t('procurement.mergeWizard.cancel') : t('procurement.mergeWizard.back')}
          </Button>
          {step < STEPS.length - 1 ? (
            <Button onClick={() => setStep(step + 1)} disabled={!canNext}>
              {t('procurement.mergeWizard.next')}
            </Button>
          ) : (
            <Button onClick={handleFinish} loading={submitting}>
              {t('procurement.mergeWizard.merge')}
            </Button>
          )}
        </>
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

      {/* Step 1: Select requests */}
      {step === 0 && (
        <div className="space-y-3">
          <p className="text-sm text-neutral-500 dark:text-neutral-400">{t('procurement.mergeWizard.selectHint')}</p>
          <div className="border border-neutral-200 dark:border-neutral-700 rounded-lg divide-y divide-neutral-100">
            {allRequests.map((req) => (
              <label key={req.id} className="flex items-center gap-3 px-4 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-800 cursor-pointer">
                <Checkbox checked={selectedIds.has(req.id)} onChange={() => toggleRequest(req.id)} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-primary-700">{req.number}</span>
                    <span className="text-sm text-neutral-900 dark:text-neutral-100">{req.title}</span>
                  </div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                    {req.supplier} | {req.itemCount} {t('procurement.mergeWizard.items')} | {req.date}
                  </p>
                </div>
                <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300 whitespace-nowrap">
                  {req.total.toLocaleString('ru-RU')} ₽
                </span>
              </label>
            ))}
          </div>
          {selectedIds.size >= 2 && (
            <p className="text-sm text-primary-600">{t('procurement.mergeWizard.selected')}: {selectedIds.size} {t('procurement.mergeWizard.requests')}</p>
          )}
          {selectedIds.size === 1 && (
            <p className="text-sm text-warning-600">{t('procurement.mergeWizard.minimumTwo')}</p>
          )}
        </div>
      )}

      {/* Step 2: Preview merged result */}
      {step === 1 && (
        <div className="space-y-4">
          <FormField label={t('procurement.mergeWizard.mergedTitleLabel')} required>
            <Input
              placeholder={t('procurement.mergeWizard.mergedTitlePlaceholder')}
              value={mergedTitle}
              onChange={(e) => setMergedTitle(e.target.value)}
            />
          </FormField>
          <div className="bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-3">{t('procurement.mergeWizard.mergeResult')}</h4>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('procurement.mergeWizard.requestsCount')}</p>
                <p className="text-lg font-semibold">{selected.length}</p>
              </div>
              <div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('procurement.mergeWizard.itemsCount')}</p>
                <p className="text-lg font-semibold">{totalItems}</p>
              </div>
              <div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('procurement.mergeWizard.totalAmount')}</p>
                <p className="text-lg font-semibold">{totalAmount.toLocaleString('ru-RU')} ₽</p>
              </div>
            </div>
            <div className="space-y-2">
              {selected.map((req) => (
                <div key={req.id} className="flex items-center justify-between bg-white dark:bg-neutral-900 rounded px-3 py-2 border border-neutral-100">
                  <span className="text-sm">{req.number} - {req.title}</span>
                  <span className="text-xs text-neutral-500 dark:text-neutral-400">{req.itemCount} {t('procurement.mergeWizard.items')}</span>
                </div>
              ))}
            </div>
          </div>
          <FormField label={t('procurement.mergeWizard.commentLabel')}>
            <Textarea
              placeholder={t('procurement.mergeWizard.commentPlaceholder')}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={2}
            />
          </FormField>
        </div>
      )}

      {/* Step 3: Confirm */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="bg-warning-50 border border-warning-200 rounded-lg p-3">
            <p className="text-sm text-warning-800">
              {t('procurement.mergeWizard.confirmWarning')}
            </p>
          </div>
          <div className="border border-neutral-200 dark:border-neutral-700 rounded-lg p-4 space-y-2">
            <p className="text-sm"><strong>{t('procurement.mergeWizard.confirmTitle')}:</strong> {mergedTitle}</p>
            <p className="text-sm"><strong>{t('procurement.mergeWizard.confirmMergedRequests')}:</strong> {selected.map((r) => r.number).join(', ')}</p>
            <p className="text-sm"><strong>{t('procurement.mergeWizard.confirmTotalItems')}:</strong> {totalItems}</p>
            <p className="text-sm"><strong>{t('procurement.mergeWizard.confirmTotalAmount')}:</strong> {totalAmount.toLocaleString('ru-RU')} ₽</p>
            {comment && <p className="text-sm"><strong>{t('procurement.mergeWizard.confirmComment')}:</strong> {comment}</p>}
          </div>
        </div>
      )}
    </Modal>
  );
};
