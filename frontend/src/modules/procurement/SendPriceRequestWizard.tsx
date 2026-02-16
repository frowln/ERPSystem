import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Modal } from '@/design-system/components/Modal';
import { Button } from '@/design-system/components/Button';
import { FormField, Input, Textarea, Checkbox } from '@/design-system/components/FormField';
import { procurementApi } from '@/api/procurement';
import { t } from '@/i18n';
import toast from 'react-hot-toast';

interface SendPriceRequestWizardProps {
  open: boolean;
  onClose: () => void;
}

interface Material {
  id: string;
  name: string;
  unit: string;
}

interface Supplier {
  id: string;
  name: string;
  email: string;
  categories: string[];
}


const getSteps = () => [
  t('procurement.sendPriceRequest.stepMaterials'),
  t('procurement.sendPriceRequest.stepSuppliers'),
  t('procurement.sendPriceRequest.stepParameters'),
  t('procurement.sendPriceRequest.stepSend'),
];

export const SendPriceRequestWizard: React.FC<SendPriceRequestWizardProps> = ({ open, onClose }) => {
  const { data: allMaterials = [] } = useQuery({
    queryKey: ['procurement-materials'],
    queryFn: () => procurementApi.getMaterials(),
    enabled: open,
  });

  const { data: allSuppliers = [] } = useQuery({
    queryKey: ['procurement-suppliers'],
    queryFn: () => procurementApi.getSuppliers(),
    enabled: open,
  });

  const [step, setStep] = useState(0);
  const [selectedMaterials, setSelectedMaterials] = useState<Set<string>>(new Set());
  const [quantities, setQuantities] = useState<Record<string, string>>({});
  const [selectedSuppliers, setSelectedSuppliers] = useState<Set<string>>(new Set());
  const [deadline, setDeadline] = useState('');
  const [message, setMessage] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const toggleMaterial = (id: string) => {
    setSelectedMaterials((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSupplier = (id: string) => {
    setSelectedSuppliers((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const materials = allMaterials.filter((m) => selectedMaterials.has(m.id));
  const suppliers = allSuppliers.filter((s) => selectedSuppliers.has(s.id));

  const handleFinish = async () => {
    setSubmitting(true);
    try {
      await procurementApi.sendPriceRequests({
        materialIds: [...selectedMaterials],
        quantities,
        supplierIds: [...selectedSuppliers],
        deadline,
        deliveryAddress: deliveryAddress || undefined,
        message: message || undefined,
      });
      toast.success(`${t('procurement.sendPriceRequest.toastSent')}: ${suppliers.length} ${t('procurement.sendPriceRequest.toastSuppliers')}`);
      resetAndClose();
    } catch {
      toast.error(t('procurement.sendPriceRequest.toastSent'));
    } finally {
      setSubmitting(false);
    }
  };

  const resetAndClose = () => {
    setStep(0);
    setSelectedMaterials(new Set());
    setQuantities({});
    setSelectedSuppliers(new Set());
    setDeadline('');
    setMessage('');
    setDeliveryAddress('');
    onClose();
  };

  const canNext =
    step === 0
      ? selectedMaterials.size > 0 && [...selectedMaterials].every((id) => quantities[id])
      : step === 1
        ? selectedSuppliers.size > 0
        : step === 2
          ? deadline !== ''
          : true;

  const STEPS = getSteps();

  return (
    <Modal
      open={open}
      onClose={resetAndClose}
      title={t('procurement.sendPriceRequest.title')}
      size="xl"
      footer={
        <>
          <Button variant="secondary" onClick={step === 0 ? resetAndClose : () => setStep(step - 1)}>
            {step === 0 ? t('procurement.sendPriceRequest.cancel') : t('procurement.sendPriceRequest.back')}
          </Button>
          {step < STEPS.length - 1 ? (
            <Button onClick={() => setStep(step + 1)} disabled={!canNext}>
              {t('procurement.sendPriceRequest.next')}
            </Button>
          ) : (
            <Button onClick={handleFinish} loading={submitting}>
              {t('procurement.sendPriceRequest.sendRequests')}
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

      {/* Step 1: Select materials */}
      {step === 0 && (
        <div className="space-y-3">
          <p className="text-sm text-neutral-500 dark:text-neutral-400">{t('procurement.sendPriceRequest.selectMaterialsHint')}</p>
          <div className="space-y-2">
            {allMaterials.map((mat) => (
              <div key={mat.id} className="flex items-center gap-3 border border-neutral-200 dark:border-neutral-700 rounded-lg px-3 py-2.5">
                <Checkbox checked={selectedMaterials.has(mat.id)} onChange={() => toggleMaterial(mat.id)} />
                <span className="text-sm flex-1">{mat.name}</span>
                <Input
                  type="number"
                  className="w-24"
                  placeholder={t('procurement.sendPriceRequest.quantityPlaceholder')}
                  value={quantities[mat.id] || ''}
                  onChange={(e) => setQuantities({ ...quantities, [mat.id]: e.target.value })}
                  disabled={!selectedMaterials.has(mat.id)}
                />
                <span className="text-xs text-neutral-500 dark:text-neutral-400 w-16">{mat.unit}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Select suppliers */}
      {step === 1 && (
        <div className="space-y-3">
          <p className="text-sm text-neutral-500 dark:text-neutral-400">{t('procurement.sendPriceRequest.selectSuppliersHint')}</p>
          <div className="border border-neutral-200 dark:border-neutral-700 rounded-lg divide-y divide-neutral-100">
            {allSuppliers.map((sup) => (
              <label key={sup.id} className="flex items-center gap-3 px-4 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-800 cursor-pointer">
                <Checkbox checked={selectedSuppliers.has(sup.id)} onChange={() => toggleSupplier(sup.id)} />
                <div className="flex-1">
                  <p className="text-sm font-medium">{sup.name}</p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">{sup.email}</p>
                </div>
                <div className="flex gap-1">
                  {sup.categories.map((cat) => (
                    <span key={cat} className="text-xs bg-neutral-100 dark:bg-neutral-800 text-neutral-600 px-2 py-0.5 rounded">
                      {cat}
                    </span>
                  ))}
                </div>
              </label>
            ))}
          </div>
          {selectedSuppliers.size > 0 && (
            <p className="text-sm text-primary-600">{t('procurement.sendPriceRequest.selectedSuppliers')}: {selectedSuppliers.size}</p>
          )}
        </div>
      )}

      {/* Step 3: Set deadline, message */}
      {step === 2 && (
        <div className="space-y-4">
          <FormField label={t('procurement.sendPriceRequest.deadlineLabel')} required>
            <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
          </FormField>
          <FormField label={t('procurement.sendPriceRequest.deliveryAddressLabel')}>
            <Input
              placeholder={t('procurement.sendPriceRequest.deliveryAddressPlaceholder')}
              value={deliveryAddress}
              onChange={(e) => setDeliveryAddress(e.target.value)}
            />
          </FormField>
          <FormField label={t('procurement.sendPriceRequest.messageLabel')}>
            <Textarea
              placeholder={t('procurement.sendPriceRequest.messagePlaceholder')}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
            />
          </FormField>
        </div>
      )}

      {/* Step 4: Review and send */}
      {step === 3 && (
        <div className="space-y-4">
          <p className="text-sm text-neutral-600">{t('procurement.sendPriceRequest.reviewHint')}</p>
          <div className="border border-neutral-200 dark:border-neutral-700 rounded-lg p-4 space-y-3">
            <div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('procurement.sendPriceRequest.reviewMaterials')} ({materials.length})</p>
              <ul className="mt-1 space-y-1">
                {materials.map((m) => (
                  <li key={m.id} className="text-sm">
                    {m.name} - {quantities[m.id]} {m.unit}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('procurement.sendPriceRequest.reviewSuppliers')} ({suppliers.length})</p>
              <ul className="mt-1 space-y-1">
                {suppliers.map((s) => (
                  <li key={s.id} className="text-sm">{s.name} ({s.email})</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('procurement.sendPriceRequest.reviewDeadline')}</p>
              <p className="text-sm">{deadline}</p>
            </div>
            {deliveryAddress && (
              <div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('procurement.sendPriceRequest.reviewDeliveryAddress')}</p>
                <p className="text-sm">{deliveryAddress}</p>
              </div>
            )}
            {message && (
              <div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('procurement.sendPriceRequest.reviewMessage')}</p>
                <p className="text-sm">{message}</p>
              </div>
            )}
          </div>
          <div className="bg-primary-50 border border-primary-200 rounded-lg p-3">
            <p className="text-sm text-primary-800">
              {t('procurement.sendPriceRequest.sendConfirmation', { count: String(suppliers.length) })}
            </p>
          </div>
        </div>
      )}
    </Modal>
  );
};
