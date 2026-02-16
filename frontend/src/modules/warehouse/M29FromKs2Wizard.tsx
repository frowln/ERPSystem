import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Modal } from '@/design-system/components/Modal';
import { Button } from '@/design-system/components/Button';
import { FormField, Input, Checkbox } from '@/design-system/components/FormField';
import toast from 'react-hot-toast';
import { t } from '@/i18n';
import { warehouseApi } from '@/api/warehouse';
import type { Ks2Act, M29MaterialLine } from '@/api/warehouse';

interface M29FromKs2WizardProps {
  open: boolean;
  onClose: () => void;
}

const STEPS = [t('warehouse.m29Wizard.step1'), t('warehouse.m29Wizard.step2'), t('warehouse.m29Wizard.step3'), t('warehouse.m29Wizard.step4')];

export const M29FromKs2Wizard: React.FC<M29FromKs2WizardProps> = ({ open, onClose }) => {
  const [step, setStep] = useState(0);
  const [selectedActs, setSelectedActs] = useState<Set<string>>(new Set());
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);

  const { data: ks2Acts = [] } = useQuery({
    queryKey: ['ks2-acts'],
    queryFn: () => warehouseApi.getKs2Acts(),
    enabled: open,
  });

  const selectedActIds = Array.from(selectedActs);

  const { data: m29Materials = [], isLoading: loadingMaterials } = useQuery({
    queryKey: ['m29-materials', selectedActIds],
    queryFn: () => warehouseApi.getM29Materials(selectedActIds),
    enabled: selectedActs.size > 0 && step >= 1,
  });

  // Initialize quantities when materials load
  useEffect(() => {
    if (m29Materials.length > 0) {
      setQuantities((prev) => {
        const next = { ...prev };
        for (const m of m29Materials) {
          if (!(m.id in next)) {
            next[m.id] = m.actualQty;
          }
        }
        return next;
      });
    }
  }, [m29Materials]);

  const toggleAct = (id: string) => {
    setSelectedActs((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const acts = ks2Acts.filter((a) => selectedActs.has(a.id));

  const updateQty = (matId: string, val: number) => {
    setQuantities((prev) => ({ ...prev, [matId]: val }));
  };

  const handleFinish = async () => {
    setSubmitting(true);
    try {
      await warehouseApi.generateM29({
        actIds: selectedActIds,
        quantities,
      });
      toast.success(t('warehouse.m29Wizard.toastGenerated', { count: acts.length }));
    } catch {
      toast.error(t('warehouse.m29Wizard.toastGenerateError'));
    } finally {
      setSubmitting(false);
      resetAndClose();
    }
  };

  const resetAndClose = () => {
    setStep(0);
    setSelectedActs(new Set());
    setQuantities({});
    onClose();
  };

  const canNext = step === 0 ? selectedActs.size > 0 : true;

  return (
    <Modal
      open={open}
      onClose={resetAndClose}
      title={t('warehouse.m29Wizard.title')}
      description={t('warehouse.m29Wizard.description')}
      size="xl"
      footer={
        <>
          <Button variant="secondary" onClick={step === 0 ? resetAndClose : () => setStep(step - 1)}>
            {step === 0 ? t('warehouse.m29Wizard.btnCancel') : t('warehouse.m29Wizard.btnBack')}
          </Button>
          {step < STEPS.length - 1 ? (
            <Button onClick={() => setStep(step + 1)} disabled={!canNext}>
              {t('warehouse.m29Wizard.btnNext')}
            </Button>
          ) : (
            <Button onClick={handleFinish} loading={submitting}>
              {t('warehouse.m29Wizard.btnGenerate')}
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

      {/* Step 1: Select KS-2 acts */}
      {step === 0 && (
        <div className="space-y-3">
          <p className="text-sm text-neutral-500 dark:text-neutral-400">{t('warehouse.m29Wizard.step1Instruction')}</p>
          <div className="border border-neutral-200 dark:border-neutral-700 rounded-lg divide-y divide-neutral-100">
            {ks2Acts.map((act) => (
              <label key={act.id} className="flex items-center gap-3 px-4 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-800 cursor-pointer">
                <Checkbox checked={selectedActs.has(act.id)} onChange={() => toggleAct(act.id)} />
                <div className="flex-1">
                  <p className="text-sm font-medium">{act.number}</p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">{act.contractor} | {act.period}</p>
                </div>
                <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  {act.amount.toLocaleString('ru-RU')} ₽
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Preview material list */}
      {step === 1 && (
        <div className="space-y-4">
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            {t('warehouse.m29Wizard.step2Instruction')}
          </p>
          <div className="border border-neutral-200 dark:border-neutral-700 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-neutral-50 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700">
                  <th className="text-left px-3 py-2 font-medium text-neutral-600">{t('warehouse.m29Wizard.headerMaterial')}</th>
                  <th className="text-right px-3 py-2 font-medium text-neutral-600">{t('warehouse.m29Wizard.headerUnit')}</th>
                  <th className="text-right px-3 py-2 font-medium text-neutral-600">{t('warehouse.m29Wizard.headerNorm')}</th>
                  <th className="text-right px-3 py-2 font-medium text-neutral-600">{t('warehouse.m29Wizard.headerActual')}</th>
                </tr>
              </thead>
              <tbody>
                {m29Materials.map((mat) => (
                  <tr key={mat.id} className="border-b border-neutral-100">
                    <td className="px-3 py-2">{mat.name}</td>
                    <td className="px-3 py-2 text-right text-neutral-500 dark:text-neutral-400">{mat.unit}</td>
                    <td className="px-3 py-2 text-right">{mat.normQty}</td>
                    <td className="px-3 py-2 text-right font-medium">{mat.actualQty}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="bg-primary-50 border border-primary-200 rounded-lg p-3">
            <p className="text-sm text-primary-800">
              {t('warehouse.m29Wizard.infoMaterialsFound', { count: m29Materials.length })}
            </p>
          </div>
        </div>
      )}

      {/* Step 3: Edit quantities */}
      {step === 2 && (
        <div className="space-y-3">
          <p className="text-sm text-neutral-500 dark:text-neutral-400">{t('warehouse.m29Wizard.step3Instruction')}</p>
          <div className="space-y-2">
            {m29Materials.map((mat) => {
              const diff = quantities[mat.id] - mat.normQty;
              return (
                <div key={mat.id} className="flex items-center gap-3 border border-neutral-200 dark:border-neutral-700 rounded-lg px-3 py-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{mat.name}</p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('warehouse.m29Wizard.labelNorm')}: {mat.normQty} {mat.unit}</p>
                  </div>
                  <FormField label="">
                    <Input
                      type="number"
                      className="w-24"
                      value={quantities[mat.id]}
                      onChange={(e) => updateQty(mat.id, Number(e.target.value))}
                      step={0.1}
                      min={0}
                    />
                  </FormField>
                  <span className="text-xs w-12 text-right">{mat.unit}</span>
                  {diff !== 0 && (
                    <span className={`text-xs w-16 text-right ${diff > 0 ? 'text-danger-600' : 'text-success-600'}`}>
                      {diff > 0 ? '+' : ''}{diff.toFixed(1)}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Step 4: Generate M-29 */}
      {step === 3 && (
        <div className="space-y-4">
          <p className="text-sm text-neutral-600">{t('warehouse.m29Wizard.step4Instruction')}</p>
          <div className="border border-neutral-200 dark:border-neutral-700 rounded-lg p-4 space-y-2 text-sm">
            <p><strong>{t('warehouse.m29Wizard.summaryActs')}:</strong> {acts.map((a) => a.number).join('; ')}</p>
            <p><strong>{t('warehouse.m29Wizard.summaryMaterialPositions')}:</strong> {m29Materials.length}</p>
            <p>
              <strong>{t('warehouse.m29Wizard.summaryDeviations')}:</strong>{' '}
              {m29Materials.filter((m) => quantities[m.id] !== m.normQty).length > 0
                ? `${m29Materials.filter((m) => quantities[m.id] !== m.normQty).length} ${t('warehouse.m29Wizard.summaryPositions')}`
                : t('warehouse.m29Wizard.summaryNoDeviations')}
            </p>
          </div>
          <div className="bg-success-50 border border-success-200 rounded-lg p-3">
            <p className="text-sm text-success-800">
              {t('warehouse.m29Wizard.infoReportReady')}
            </p>
          </div>
        </div>
      )}
    </Modal>
  );
};
