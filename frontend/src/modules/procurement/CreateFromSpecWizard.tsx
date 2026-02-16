import React, { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Modal } from '@/design-system/components/Modal';
import { Button } from '@/design-system/components/Button';
import { FormField, Input, Select, Checkbox } from '@/design-system/components/FormField';
import { procurementApi } from '@/api/procurement';
import { specificationsApi } from '@/api/specifications';
import { useAuthStore } from '@/stores/authStore';
import { t } from '@/i18n';
import toast from 'react-hot-toast';
import type { SpecItem, Specification } from '@/types';

interface CreateFromSpecWizardProps {
  open: boolean;
  onClose: () => void;
}

const getSteps = () => [
  t('procurement.createFromSpec.step1'),
  t('procurement.createFromSpec.step2'),
  t('procurement.createFromSpec.step3'),
];

const parsePositiveQuantity = (raw: string): number => {
  const normalized = raw.trim().replace(',', '.');
  if (!normalized) {
    return 0;
  }
  const parsed = Number(normalized);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
};

const buildRequesterName = (user: ReturnType<typeof useAuthStore.getState>['user']): string => {
  return user?.fullName?.trim()
    || `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim()
    || user?.email
    || t('forms.purchaseRequest.currentUser');
};

const buildUnitPrice = (item: SpecItem): number | undefined => {
  if (!Number.isFinite(item.plannedAmount) || !Number.isFinite(item.quantity) || item.quantity <= 0) {
    return undefined;
  }
  const value = item.plannedAmount / item.quantity;
  if (!Number.isFinite(value) || value <= 0) {
    return undefined;
  }
  return Number(value.toFixed(2));
};

export const CreateFromSpecWizard: React.FC<CreateFromSpecWizardProps> = ({ open, onClose }) => {
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((state) => state.user);

  const [step, setStep] = useState(0);
  const [specId, setSpecId] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [quantities, setQuantities] = useState<Record<string, string>>({});
  const [dates, setDates] = useState<Record<string, string>>({});

  const { data: specsResponse, isLoading: isSpecsLoading } = useQuery({
    queryKey: ['specifications', 'create-from-spec'],
    queryFn: () => specificationsApi.getSpecifications({ page: 0, size: 300, sort: 'createdAt,desc' }),
    enabled: open,
  });

  const specifications = useMemo(
    () => (specsResponse?.content ?? []).filter((spec) => spec.status === 'APPROVED' || spec.status === 'ACTIVE'),
    [specsResponse?.content],
  );
  const selectedSpecification = useMemo(
    () => specifications.find((spec) => spec.id === specId),
    [specId, specifications],
  );

  const { data: specItems = [], isLoading: isItemsLoading } = useQuery({
    queryKey: ['spec-items', 'create-from-spec', specId],
    queryFn: () => specificationsApi.getSpecItems(specId),
    enabled: open && Boolean(specId),
  });

  const availableItems = useMemo(
    () => specItems.filter((item) => item.itemType === 'MATERIAL' || item.itemType === 'EQUIPMENT'),
    [specItems],
  );
  const selectedItems = useMemo(
    () => availableItems.filter((item) => selectedIds.has(item.id)),
    [availableItems, selectedIds],
  );

  useEffect(() => {
    setSelectedIds(new Set());
    setQuantities({});
    setDates({});
  }, [specId]);

  const getEffectiveQuantity = (item: SpecItem): number => {
    const raw = quantities[item.id];
    if (!raw?.trim()) {
      return item.quantity;
    }
    return parsePositiveQuantity(raw);
  };

  const toggleItem = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleAll = () => {
    setSelectedIds((prev) => {
      if (availableItems.length === 0) {
        return new Set<string>();
      }
      if (prev.size === availableItems.length) {
        return new Set<string>();
      }
      return new Set(availableItems.map((item) => item.id));
    });
  };

  const resetAndClose = () => {
    setStep(0);
    setSpecId('');
    setSelectedIds(new Set());
    setQuantities({});
    setDates({});
    onClose();
  };

  const createRequestsMutation = useMutation({
    mutationFn: async () => {
      if (!selectedSpecification) {
        throw new Error(t('procurement.createFromSpec.toastError'));
      }
      if (selectedItems.length === 0) {
        throw new Error(t('procurement.createFromSpec.emptySpecItems'));
      }

      const hasInvalidQuantities = selectedItems.some((item) => getEffectiveQuantity(item) <= 0);
      if (hasInvalidQuantities) {
        throw new Error(t('procurement.createFromSpec.toastInvalidQuantity'));
      }

      const requesterName = buildRequesterName(currentUser);
      const requestDate = new Date().toISOString().split('T')[0];
      let createdCount = 0;

      for (const item of selectedItems) {
        const deliveryDate = dates[item.id]?.trim();
        const requestNotes = [
          `${t('procurement.createFromSpec.labelSpecification')}: ${selectedSpecification.name}`,
          deliveryDate ? `${t('procurement.createFromSpec.labelDeliveryDate')}: ${deliveryDate}` : null,
        ].filter((line): line is string => Boolean(line && line.length > 0)).join('\n');

        const request = await procurementApi.createPurchaseRequest({
          requestDate,
          projectId: selectedSpecification.projectId,
          priority: 'MEDIUM',
          requestedById: currentUser?.id,
          requestedByName: requesterName,
          notes: requestNotes || undefined,
        });

        await procurementApi.addPurchaseRequestItem(request.id, {
          sequence: 1,
          specItemId: item.id,
          name: item.name,
          quantity: getEffectiveQuantity(item),
          unitOfMeasure: item.unitOfMeasure || 'шт',
          unitPrice: buildUnitPrice(item),
          notes: deliveryDate ? `${t('procurement.createFromSpec.labelDeliveryDate')}: ${deliveryDate}` : undefined,
        });
        createdCount += 1;
      }

      return createdCount;
    },
    onSuccess: (createdCount) => {
      queryClient.invalidateQueries({ queryKey: ['purchase-requests'] });
      toast.success(t('procurement.createFromSpec.toastSuccess', { count: String(createdCount) }));
      resetAndClose();
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : t('procurement.createFromSpec.toastError');
      toast.error(message);
    },
  });

  const canNext = step === 0
    ? specId !== '' && selectedIds.size > 0
    : step === 1
      ? selectedItems.length > 0 && selectedItems.every((item) => getEffectiveQuantity(item) > 0)
      : true;

  const specOptions = useMemo(
    () => specifications.map((spec: Specification) => ({ value: spec.id, label: spec.name })),
    [specifications],
  );
  const STEPS = getSteps();

  return (
    <Modal
      open={open}
      onClose={resetAndClose}
      title={t('procurement.createFromSpec.title')}
      size="xl"
      footer={(
        <>
          <Button variant="secondary" onClick={step === 0 ? resetAndClose : () => setStep(step - 1)}>
            {step === 0 ? t('procurement.createFromSpec.btnCancel') : t('procurement.createFromSpec.btnBack')}
          </Button>
          {step < STEPS.length - 1 ? (
            <Button onClick={() => setStep(step + 1)} disabled={!canNext}>
              {t('procurement.createFromSpec.btnNext')}
            </Button>
          ) : (
            <Button onClick={() => createRequestsMutation.mutate()} loading={createRequestsMutation.isPending}>
              {t('procurement.createFromSpec.btnCreate')}
            </Button>
          )}
        </>
      )}
    >
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

      {step === 0 && (
        <div className="space-y-4">
          <FormField label={t('procurement.createFromSpec.labelSpecification')} required>
            {(!isSpecsLoading && specOptions.length === 0) ? (
              <Input disabled placeholder={t('procurement.createFromSpec.emptySpecItems')} />
            ) : (
              <Select
                options={specOptions}
                value={specId}
                onChange={(event) => setSpecId(event.target.value)}
                placeholder={isSpecsLoading ? t('common.loading') : t('procurement.createFromSpec.placeholderSpecification')}
                disabled={isSpecsLoading}
              />
            )}
          </FormField>

          {specId && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  {t('procurement.createFromSpec.specItemsLabel')}
                </span>
                <button type="button" onClick={toggleAll} className="text-xs text-primary-600 hover:underline">
                  {selectedIds.size === availableItems.length && availableItems.length > 0
                    ? t('procurement.createFromSpec.deselectAll')
                    : t('procurement.createFromSpec.selectAll')}
                </button>
              </div>
              <div className="border border-neutral-200 dark:border-neutral-700 rounded-lg divide-y divide-neutral-100 max-h-60 overflow-y-auto">
                {!isItemsLoading && availableItems.length === 0 && (
                  <p className="text-sm text-neutral-500 dark:text-neutral-400 px-3 py-3">
                    {t('procurement.createFromSpec.emptySpecItems')}
                  </p>
                )}
                {availableItems.map((item) => (
                  <label key={item.id} className="flex items-center gap-3 px-3 py-2.5 hover:bg-neutral-50 dark:hover:bg-neutral-800 cursor-pointer">
                    <Checkbox checked={selectedIds.has(item.id)} onChange={() => toggleItem(item.id)} />
                    <span className="text-sm flex-1">{item.name}</span>
                    <span className="text-xs text-neutral-500 dark:text-neutral-400">
                      {item.quantity} {item.unitOfMeasure}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {step === 1 && (
        <div className="space-y-3">
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-3">{t('procurement.createFromSpec.step2Hint')}</p>
          {selectedItems.map((item) => (
            <div key={item.id} className="border border-neutral-200 dark:border-neutral-700 rounded-lg p-3">
              <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 mb-2">{item.name}</p>
              <div className="grid grid-cols-3 gap-3">
                <FormField label={t('procurement.createFromSpec.labelBySpec')}>
                  <Input value={`${item.quantity} ${item.unitOfMeasure}`} disabled />
                </FormField>
                <FormField label={t('procurement.createFromSpec.labelRequestQuantity')} required>
                  <Input
                    type="text"
                    inputMode="decimal"
                    placeholder="0"
                    value={quantities[item.id] ?? String(item.quantity)}
                    onChange={(event) => setQuantities({ ...quantities, [item.id]: event.target.value })}
                  />
                </FormField>
                <FormField label={t('procurement.createFromSpec.labelDeliveryDate')}>
                  <Input
                    type="date"
                    value={dates[item.id] || ''}
                    onChange={(event) => setDates({ ...dates, [item.id]: event.target.value })}
                  />
                </FormField>
              </div>
            </div>
          ))}
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <p className="text-sm text-neutral-600">
            {t('procurement.createFromSpec.confirmText', { count: String(selectedItems.length) })}
          </p>
          <div className="border border-neutral-200 dark:border-neutral-700 rounded-lg divide-y divide-neutral-100">
            {selectedItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between px-4 py-2.5">
                <span className="text-sm">{item.name}</span>
                <div className="flex items-center gap-4 text-sm text-neutral-600">
                  <span>{getEffectiveQuantity(item)} {item.unitOfMeasure}</span>
                  <span>{dates[item.id] || t('procurement.createFromSpec.noDateLabel')}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="bg-primary-50 border border-primary-200 rounded-lg p-3">
            <p className="text-sm text-primary-800">{t('procurement.createFromSpec.confirmNotice')}</p>
          </div>
        </div>
      )}
    </Modal>
  );
};
