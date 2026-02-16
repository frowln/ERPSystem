import React, { useState } from 'react';
import { Modal } from '@/design-system/components/Modal';
import { Button } from '@/design-system/components/Button';
import { FormField, Input, Select, Checkbox } from '@/design-system/components/FormField';
import { t } from '@/i18n';
import toast from 'react-hot-toast';

interface CreateFromSpecWizardProps {
  open: boolean;
  onClose: () => void;
}

interface SpecItem {
  id: string;
  name: string;
  unit: string;
  specQty: number;
}

// TODO: replace with real API call
const specItems: SpecItem[] = [];

const getSteps = () => [
  t('procurement.createFromSpec.stepSelectSpec'),
  t('procurement.createFromSpec.stepItemParams'),
  t('procurement.createFromSpec.stepConfirm'),
];

export const CreateFromSpecWizard: React.FC<CreateFromSpecWizardProps> = ({ open, onClose }) => {
  const [step, setStep] = useState(0);
  const [specId, setSpecId] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [quantities, setQuantities] = useState<Record<string, string>>({});
  const [dates, setDates] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const toggleItem = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === 0) setSelectedIds(new Set());
    else setSelectedIds(new Set(([] as any[]).map((i) => i.id)));
  };

  const selectedItems = ([] as any[]).filter((i) => selectedIds.has(i.id));

  const handleFinish = async () => {
    setSubmitting(true);
    // useMutation would be called here
    await new Promise((r) => setTimeout(r, 1000));
    toast.success(`${t('procurement.createFromSpec.toastCreated')}: ${selectedItems.length}`);
    setSubmitting(false);
    resetAndClose();
  };

  const resetAndClose = () => {
    setStep(0);
    setSpecId('');
    setSelectedIds(new Set());
    setQuantities({});
    setDates({});
    onClose();
  };

  const canNext = step === 0 ? specId !== '' && selectedIds.size > 0 : step === 1;

  const STEPS = getSteps();

  return (
    <Modal
      open={open}
      onClose={resetAndClose}
      title={t('procurement.createFromSpec.title')}
      size="xl"
      footer={
        <>
          <Button variant="secondary" onClick={step === 0 ? resetAndClose : () => setStep(step - 1)}>
            {step === 0 ? t('procurement.createFromSpec.cancel') : t('procurement.createFromSpec.back')}
          </Button>
          {step < STEPS.length - 1 ? (
            <Button onClick={() => setStep(step + 1)} disabled={!canNext}>
              {t('procurement.createFromSpec.next')}
            </Button>
          ) : (
            <Button onClick={handleFinish} loading={submitting}>
              {t('procurement.createFromSpec.createRequests')}
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

      {/* Step 1: Select specification + items */}
      {step === 0 && (
        <div className="space-y-4">
          <FormField label={t('procurement.createFromSpec.specLabel')} required>
            <Select
              options={[]}
              value={specId}
              onChange={(e) => setSpecId(e.target.value)}
              placeholder={t('procurement.createFromSpec.specPlaceholder')}
            />
          </FormField>
          {specId && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{t('procurement.createFromSpec.specItems')}</span>
                <button onClick={toggleAll} className="text-xs text-primary-600 hover:underline">
                  {selectedIds.size === 0 ? t('procurement.createFromSpec.deselectAll') : t('procurement.createFromSpec.selectAll')}
                </button>
              </div>
              <div className="border border-neutral-200 dark:border-neutral-700 rounded-lg divide-y divide-neutral-100 max-h-60 overflow-y-auto">
                {([] as any[]).map((item) => (
                  <label key={item.id} className="flex items-center gap-3 px-3 py-2.5 hover:bg-neutral-50 dark:hover:bg-neutral-800 cursor-pointer">
                    <Checkbox checked={selectedIds.has(item.id)} onChange={() => toggleItem(item.id)} />
                    <span className="text-sm flex-1">{item.name}</span>
                    <span className="text-xs text-neutral-500 dark:text-neutral-400">{item.specQty} {item.unit}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step 2: Review items, set quantities and dates */}
      {step === 1 && (
        <div className="space-y-3">
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-3">{t('procurement.createFromSpec.itemParamsHint')}</p>
          {selectedItems.map((item) => (
            <div key={item.id} className="border border-neutral-200 dark:border-neutral-700 rounded-lg p-3">
              <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 mb-2">{item.name}</p>
              <div className="grid grid-cols-3 gap-3">
                <FormField label={t('procurement.createFromSpec.bySpec')}>
                  <Input value={`${item.specQty} ${item.unit}`} disabled />
                </FormField>
                <FormField label={t('procurement.createFromSpec.requestQuantity')} required>
                  <Input
                    type="number"
                    placeholder="0"
                    value={quantities[item.id] || ''}
                    onChange={(e) => setQuantities({ ...quantities, [item.id]: e.target.value })}
                  />
                </FormField>
                <FormField label={t('procurement.createFromSpec.deliveryDate')}>
                  <Input
                    type="date"
                    value={dates[item.id] || ''}
                    onChange={(e) => setDates({ ...dates, [item.id]: e.target.value })}
                  />
                </FormField>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Step 3: Confirm */}
      {step === 2 && (
        <div className="space-y-4">
          <p className="text-sm text-neutral-600">
            {t('procurement.createFromSpec.confirmCount', { count: String(selectedItems.length) })}
          </p>
          <div className="border border-neutral-200 dark:border-neutral-700 rounded-lg divide-y divide-neutral-100">
            {selectedItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between px-4 py-2.5">
                <span className="text-sm">{item.name}</span>
                <div className="flex items-center gap-4 text-sm text-neutral-600">
                  <span>{quantities[item.id] || item.specQty} {item.unit}</span>
                  <span>{dates[item.id] || t('procurement.createFromSpec.noDate')}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="bg-primary-50 border border-primary-200 rounded-lg p-3">
            <p className="text-sm text-primary-800">
              {t('procurement.createFromSpec.confirmNote')}
            </p>
          </div>
        </div>
      )}
    </Modal>
  );
};
