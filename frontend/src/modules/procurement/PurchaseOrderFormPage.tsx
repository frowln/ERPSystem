import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { useConfirmDialog } from '@/design-system/components/ConfirmDialog/provider';
import { FormField, Input, Select, Textarea } from '@/design-system/components/FormField';
import {
  procurementApi,
  type PurchaseOrderItemPayload,
  type PurchaseOrderWithItemsPayload,
} from '@/api/procurement';
import { projectsApi } from '@/api/projects';
import { formatDateTime, formatMoney } from '@/lib/format';
import { t } from '@/i18n';

const getPurchaseOrderSchema = () => z.object({
  orderNumber: z.string().min(1, t('procurement.orderForm.validation.orderNumberRequired')),
  supplierId: z.string().min(1, t('procurement.orderForm.validation.supplierRequired')),
  orderDate: z.string().min(1, t('procurement.orderForm.validation.orderDateRequired')),
  expectedDeliveryDate: z.string().optional(),
  projectId: z.string().optional(),
  purchaseRequestId: z.string().optional(),
  contractId: z.string().optional(),
  currency: z.string().min(3, t('procurement.orderForm.validation.currencyLength')).max(3, t('procurement.orderForm.validation.currencyLength')),
  paymentTerms: z.string().max(500, t('procurement.orderForm.validation.maxChars500')).optional(),
  deliveryAddress: z.string().max(1000, t('procurement.orderForm.validation.maxChars1000')).optional(),
  notes: z.string().max(5000, t('procurement.orderForm.validation.maxChars5000')).optional(),
});

type PurchaseOrderFormData = z.input<ReturnType<typeof getPurchaseOrderSchema>>;
const PURCHASE_ORDER_DRAFT_KEY = 'procurement:purchase-order:create:draft:v1';

interface DraftItem {
  materialId: string;
  materialName: string;
  unit: string;
  quantity: string;
  unitPrice: string;
  vatRate: string;
}

const emptyItem = (): DraftItem => ({
  materialId: '',
  materialName: '',
  unit: 'шт',
  quantity: '',
  unitPrice: '',
  vatRate: '20',
});

const toNumber = (value: string): number => {
  const parsed = Number(value.replace(',', '.').trim());
  return Number.isFinite(parsed) ? parsed : 0;
};

const defaultPurchaseOrderValues: PurchaseOrderFormData = {
  orderNumber: '',
  supplierId: '',
  orderDate: new Date().toISOString().split('T')[0],
  expectedDeliveryDate: '',
  projectId: '',
  purchaseRequestId: '',
  contractId: '',
  currency: 'RUB',
  paymentTerms: '',
  deliveryAddress: '',
  notes: '',
};

type PurchaseOrderDraft = {
  savedAt: number;
  formValues: PurchaseOrderFormData;
  items: DraftItem[];
};

const normalizeDraftItem = (item: Partial<DraftItem> | null | undefined): DraftItem => ({
  materialId: item?.materialId ?? '',
  materialName: item?.materialName ?? '',
  unit: item?.unit ?? 'шт',
  quantity: item?.quantity ?? '',
  unitPrice: item?.unitPrice ?? '',
  vatRate: item?.vatRate ?? '20',
});

const isDraftItemEmpty = (item: DraftItem): boolean => {
  return (
    item.materialId.trim() === ''
    && item.materialName.trim() === ''
    && item.unit.trim() === 'шт'
    && item.quantity.trim() === ''
    && item.unitPrice.trim() === ''
    && item.vatRate.trim() === '20'
  );
};

const parsePurchaseOrderDraft = (raw: string): PurchaseOrderDraft | null => {
  try {
    const parsed = JSON.parse(raw) as Partial<PurchaseOrderDraft>;
    if (
      !parsed
      || typeof parsed.savedAt !== 'number'
      || !parsed.formValues
      || typeof parsed.formValues !== 'object'
    ) {
      return null;
    }

    const normalizedItems = Array.isArray(parsed.items) && parsed.items.length > 0
      ? parsed.items.map((item) => normalizeDraftItem(item))
      : [emptyItem()];

    return {
      savedAt: parsed.savedAt,
      formValues: {
        ...defaultPurchaseOrderValues,
        ...parsed.formValues,
      },
      items: normalizedItems,
    };
  } catch {
    return null;
  }
};

const isUuidLike = (value: string): boolean => {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value.trim());
};

const PurchaseOrderFormPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const confirm = useConfirmDialog();
  const queryClient = useQueryClient();
  const [items, setItems] = useState<DraftItem[]>([emptyItem()]);
  const [isDraftHydrated, setIsDraftHydrated] = useState(false);
  const [restoredDraftAt, setRestoredDraftAt] = useState<number | null>(null);
  const [lastDraftSavedAt, setLastDraftSavedAt] = useState<number | null>(null);
  const [isContextApplied, setIsContextApplied] = useState(false);

  const sourcePurchaseRequestIdRaw = searchParams.get('purchaseRequestId')?.trim() ?? '';
  const sourceProjectIdRaw = searchParams.get('projectId')?.trim() ?? '';
  const sourceRequestName = searchParams.get('sourceRequestName')?.trim() ?? '';
  const sourcePurchaseRequestId = isUuidLike(sourcePurchaseRequestIdRaw) ? sourcePurchaseRequestIdRaw : '';
  const sourceProjectId = isUuidLike(sourceProjectIdRaw) ? sourceProjectIdRaw : '';

  const { data: suppliers = [] } = useQuery({
    queryKey: ['procurement-suppliers'],
    queryFn: procurementApi.getSuppliers,
  });

  const { data: projectsResponse } = useQuery({
    queryKey: ['projects', 'purchase-order-form'],
    queryFn: () => projectsApi.getProjects({ page: 0, size: 300, sort: 'name,asc' }),
  });
  const projects = projectsResponse?.content ?? [];
  const { data: materials = [] } = useQuery({
    queryKey: ['procurement-materials'],
    queryFn: procurementApi.getMaterials,
  });

  const supplierOptions = useMemo(
    () => suppliers.map((supplier) => ({ value: supplier.id, label: supplier.name })),
    [suppliers],
  );
  const projectOptions = useMemo(
    () => [{ value: '', label: t('procurement.orderForm.notSelected') }, ...projects.map((project) => ({ value: project.id, label: project.name }))],
    [projects],
  );
  const materialOptions = useMemo(
    () => materials.map((material) => ({ value: material.id, label: material.name })),
    [materials],
  );
  const materialSelectOptions = useMemo(
    () => [{ value: '', label: t('procurement.orderForm.selectMaterial') }, ...materialOptions],
    [materialOptions],
  );
  const materialById = useMemo(
    () => new Map(materials.map((material) => [material.id, material])),
    [materials],
  );

  const {
    register,
    handleSubmit,
    reset,
    control,
    getValues,
    setValue,
    formState: { errors },
  } = useForm<PurchaseOrderFormData>({
    resolver: zodResolver(getPurchaseOrderSchema()),
    defaultValues: defaultPurchaseOrderValues,
  });
  const watchedValues = useWatch({ control }) as Partial<PurchaseOrderFormData>;

  useEffect(() => {
    const raw = window.localStorage.getItem(PURCHASE_ORDER_DRAFT_KEY);
    if (!raw) {
      setIsDraftHydrated(true);
      return;
    }

    const parsed = parsePurchaseOrderDraft(raw);
    if (!parsed) {
      window.localStorage.removeItem(PURCHASE_ORDER_DRAFT_KEY);
      setIsDraftHydrated(true);
      return;
    }

    const maxDraftAgeMs = 1000 * 60 * 60 * 24 * 7;
    if (Date.now() - parsed.savedAt > maxDraftAgeMs) {
      window.localStorage.removeItem(PURCHASE_ORDER_DRAFT_KEY);
      setIsDraftHydrated(true);
      return;
    }

    reset({
      ...defaultPurchaseOrderValues,
      ...parsed.formValues,
    });
    setItems(parsed.items.length > 0 ? parsed.items : [emptyItem()]);
    setRestoredDraftAt(parsed.savedAt);
    setLastDraftSavedAt(parsed.savedAt);
    setIsDraftHydrated(true);
  }, [reset]);

  useEffect(() => {
    if (!isDraftHydrated) {
      return;
    }

    const timer = window.setTimeout(() => {
      const draft: PurchaseOrderDraft = {
        savedAt: Date.now(),
        formValues: {
          ...defaultPurchaseOrderValues,
          ...watchedValues,
        },
        items: items.length > 0 ? items.map((item) => normalizeDraftItem(item)) : [emptyItem()],
      };
      window.localStorage.setItem(PURCHASE_ORDER_DRAFT_KEY, JSON.stringify(draft));
      setLastDraftSavedAt(draft.savedAt);
    }, 600);

    return () => {
      window.clearTimeout(timer);
    };
  }, [isDraftHydrated, items, watchedValues]);

  useEffect(() => {
    if (!isDraftHydrated || isContextApplied) {
      return;
    }

    const values = getValues();
    let changed = false;

    if (sourcePurchaseRequestId && !values.purchaseRequestId?.trim()) {
      setValue('purchaseRequestId', sourcePurchaseRequestId, { shouldDirty: true });
      changed = true;
    }

    if (sourceProjectId && !values.projectId?.trim()) {
      setValue('projectId', sourceProjectId, { shouldDirty: true });
      changed = true;
    }

    if (sourceRequestName && !values.notes?.trim()) {
      setValue('notes', `${t('procurement.orderForm.createdFromRequest')}: ${sourceRequestName}`, { shouldDirty: true });
      changed = true;
    }

    if (changed) {
      toast.success(t('procurement.orderForm.toastPrefilled'));
    }

    setIsContextApplied(true);
  }, [
    getValues,
    isContextApplied,
    isDraftHydrated,
    setValue,
    sourceProjectId,
    sourcePurchaseRequestId,
    sourceRequestName,
  ]);

  const clearDraft = () => {
    window.localStorage.removeItem(PURCHASE_ORDER_DRAFT_KEY);
    setRestoredDraftAt(null);
    setLastDraftSavedAt(null);
  };

  const hasUnsavedChanges = useMemo(() => {
    const formChanged = (
      (watchedValues.orderNumber ?? '').trim() !== ''
      || (watchedValues.supplierId ?? '').trim() !== ''
      || (watchedValues.expectedDeliveryDate ?? '').trim() !== ''
      || (watchedValues.projectId ?? '').trim() !== ''
      || (watchedValues.purchaseRequestId ?? '').trim() !== ''
      || (watchedValues.contractId ?? '').trim() !== ''
      || (watchedValues.currency ?? 'RUB').trim().toUpperCase() !== 'RUB'
      || (watchedValues.paymentTerms ?? '').trim() !== ''
      || (watchedValues.deliveryAddress ?? '').trim() !== ''
      || (watchedValues.notes ?? '').trim() !== ''
      || ((watchedValues.orderDate ?? defaultPurchaseOrderValues.orderDate) !== defaultPurchaseOrderValues.orderDate)
    );
    const itemsChanged = items.length > 1 || items.some((item) => !isDraftItemEmpty(item));
    return formChanged || itemsChanged;
  }, [items, watchedValues]);

  useEffect(() => {
    if (!hasUnsavedChanges) {
      return;
    }

    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => {
      window.removeEventListener('beforeunload', handler);
    };
  }, [hasUnsavedChanges]);

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + toNumber(item.quantity) * toNumber(item.unitPrice), 0),
    [items],
  );
  const vatTotal = useMemo(
    () => items.reduce((sum, item) => {
      const itemSubtotal = toNumber(item.quantity) * toNumber(item.unitPrice);
      const vatRate = toNumber(item.vatRate);
      return sum + (itemSubtotal * vatRate) / 100;
    }, 0),
    [items],
  );
  const total = subtotal + vatTotal;

  const addItemRow = () => {
    setItems((prev) => [...prev, emptyItem()]);
  };

  const removeItemRow = (index: number) => {
    setItems((prev) => (prev.length > 1 ? prev.filter((_, idx) => idx !== index) : prev));
  };

  const updateItem = (index: number, field: keyof DraftItem, value: string) => {
    setItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const createMutation = useMutation({
    mutationFn: async (data: PurchaseOrderFormData) => {
      const parsed = getPurchaseOrderSchema().parse(data);
      const preparedItems: PurchaseOrderItemPayload[] = items.map((item, index) => {
        const quantity = toNumber(item.quantity);
        const unitPrice = toNumber(item.unitPrice);
        const vatRate = toNumber(item.vatRate);
        if (!item.materialId.trim()) {
          throw new Error(`${t('procurement.orderForm.errorRow')} ${index + 1}: ${t('procurement.orderForm.errorMaterialRequired')}`);
        }
        if (quantity <= 0) {
          throw new Error(`${t('procurement.orderForm.errorRow')} ${index + 1}: ${t('procurement.orderForm.errorQuantityPositive')}`);
        }
        if (unitPrice <= 0) {
          throw new Error(`${t('procurement.orderForm.errorRow')} ${index + 1}: ${t('procurement.orderForm.errorPricePositive')}`);
        }
        if (vatRate < 0 || vatRate > 100) {
          throw new Error(`${t('procurement.orderForm.errorRow')} ${index + 1}: ${t('procurement.orderForm.errorVatRange')}`);
        }
        return {
          materialId: item.materialId.trim(),
          materialName: item.materialName.trim() || undefined,
          unit: item.unit.trim() || undefined,
          quantity,
          unitPrice,
          vatRate,
        };
      });

      if (preparedItems.length === 0) {
        throw new Error(t('procurement.orderForm.errorNoItems'));
      }

      const payload: PurchaseOrderWithItemsPayload = {
        orderNumber: parsed.orderNumber.trim(),
        supplierId: parsed.supplierId,
        orderDate: parsed.orderDate,
        projectId: parsed.projectId || undefined,
        purchaseRequestId: parsed.purchaseRequestId || undefined,
        contractId: parsed.contractId || undefined,
        expectedDeliveryDate: parsed.expectedDeliveryDate || undefined,
        currency: parsed.currency.toUpperCase(),
        paymentTerms: parsed.paymentTerms?.trim() || undefined,
        deliveryAddress: parsed.deliveryAddress?.trim() || undefined,
        notes: parsed.notes?.trim() || undefined,
        items: preparedItems,
      };
      return procurementApi.createPurchaseOrderWithItems(payload);
    },
    onSuccess: (order) => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      queryClient.invalidateQueries({ queryKey: ['purchase-order', order.id] });
      queryClient.invalidateQueries({ queryKey: ['purchase-order-items', order.id] });
      window.localStorage.removeItem(PURCHASE_ORDER_DRAFT_KEY);
      setRestoredDraftAt(null);
      setLastDraftSavedAt(null);
      toast.success(t('procurement.orderForm.toastCreated'));
      navigate(`/procurement/purchase-orders/${order.id}`);
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : t('procurement.orderForm.toastCreateError');
      toast.error(message);
    },
  });

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('procurement.orderForm.title')}
        subtitle={t('procurement.orderForm.subtitle')}
        backTo="/procurement/purchase-orders"
        breadcrumbs={[
          { label: t('procurement.orderForm.breadcrumbHome'), href: '/' },
          { label: t('procurement.orderForm.breadcrumbProcurement'), href: '/procurement' },
          { label: t('procurement.orderForm.breadcrumbOrders'), href: '/procurement/purchase-orders' },
          { label: t('procurement.orderForm.breadcrumbCreate') },
        ]}
      />

      {(restoredDraftAt || lastDraftSavedAt) && (
        <div className="bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl p-4 mb-6 text-sm flex items-center justify-between gap-3 max-w-6xl">
          <p className="text-neutral-700 dark:text-neutral-300">
            {restoredDraftAt
              ? `${t('procurement.orderForm.draftRestored')} (${formatDateTime(new Date(restoredDraftAt).toISOString())}).`
              : `${t('procurement.orderForm.autosaveEnabled')}.`}
            {lastDraftSavedAt
              ? ` ${t('procurement.orderForm.lastSaved')}: ${formatDateTime(new Date(lastDraftSavedAt).toISOString())}.`
              : ''}
          </p>
          <Button size="sm" variant="secondary" type="button" onClick={clearDraft}>
            {t('procurement.orderForm.clearDraft')}
          </Button>
        </div>
      )}

      {sourcePurchaseRequestId && (
        <div className="bg-primary-50 dark:bg-primary-950/30 border border-primary-200 dark:border-primary-800 rounded-xl p-4 mb-6 text-sm flex items-center justify-between gap-3 max-w-6xl">
          <p className="text-primary-900 dark:text-primary-200">
            {sourceRequestName
              ? `${t('procurement.orderForm.creatingFromRequestNamed')} "${sourceRequestName}".`
              : `${t('procurement.orderForm.creatingFromRequest')}.`}
            {' '}{t('procurement.orderForm.requestId')}: <span className="font-mono">{sourcePurchaseRequestId.slice(0, 8)}…</span>
          </p>
          <Button
            size="sm"
            variant="secondary"
            type="button"
            onClick={() => navigate(`/procurement/${sourcePurchaseRequestId}`)}
          >
            {t('procurement.orderForm.openRequest')}
          </Button>
        </div>
      )}

      <form onSubmit={handleSubmit((values) => createMutation.mutate(values))} className="max-w-6xl">
        <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-6">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-5">{t('procurement.orderForm.sectionBasicData')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <FormField label={t('procurement.orderForm.labelOrderNumber')} error={errors.orderNumber?.message} required>
              <Input placeholder="PO-2026-001" hasError={!!errors.orderNumber} {...register('orderNumber')} />
            </FormField>
            <FormField label={t('procurement.orderForm.labelSupplier')} error={errors.supplierId?.message} required>
              {supplierOptions.length > 0 ? (
                <Select
                  options={supplierOptions}
                  placeholder={t('procurement.orderForm.placeholderSupplier')}
                  hasError={!!errors.supplierId}
                  {...register('supplierId')}
                />
              ) : (
                <Input
                  placeholder={t('procurement.orderForm.placeholderSupplierUuid')}
                  hasError={!!errors.supplierId}
                  {...register('supplierId')}
                />
              )}
            </FormField>
            <FormField label={t('procurement.orderForm.labelOrderDate')} error={errors.orderDate?.message} required>
              <Input type="date" hasError={!!errors.orderDate} {...register('orderDate')} />
            </FormField>
            <FormField label={t('procurement.orderForm.labelDeliveryPlan')} error={errors.expectedDeliveryDate?.message}>
              <Input type="date" hasError={!!errors.expectedDeliveryDate} {...register('expectedDeliveryDate')} />
            </FormField>
            <FormField label={t('procurement.orderForm.labelProject')} error={errors.projectId?.message}>
              <Select options={projectOptions} hasError={!!errors.projectId} {...register('projectId')} />
            </FormField>
            <FormField label={t('procurement.orderForm.labelCurrency')} error={errors.currency?.message} required>
              <Input placeholder="RUB" hasError={!!errors.currency} {...register('currency')} />
            </FormField>
            <FormField label={t('procurement.orderForm.labelPurchaseRequestId')} error={errors.purchaseRequestId?.message}>
              <Input placeholder="UUID" hasError={!!errors.purchaseRequestId} {...register('purchaseRequestId')} />
            </FormField>
            <FormField label={t('procurement.orderForm.labelContractId')} error={errors.contractId?.message}>
              <Input placeholder="UUID" hasError={!!errors.contractId} {...register('contractId')} />
            </FormField>
            <FormField label={t('procurement.orderForm.labelPaymentTerms')} error={errors.paymentTerms?.message} className="sm:col-span-2 lg:col-span-3">
              <Input placeholder={t('procurement.orderForm.placeholderPaymentTerms')} hasError={!!errors.paymentTerms} {...register('paymentTerms')} />
            </FormField>
            <FormField label={t('procurement.orderForm.labelDeliveryAddress')} error={errors.deliveryAddress?.message} className="sm:col-span-2 lg:col-span-3">
              <Input placeholder={t('procurement.orderForm.placeholderDeliveryAddress')} hasError={!!errors.deliveryAddress} {...register('deliveryAddress')} />
            </FormField>
            <FormField label={t('procurement.orderForm.labelNotes')} error={errors.notes?.message} className="sm:col-span-2 lg:col-span-3">
              <Textarea placeholder={t('procurement.orderForm.placeholderNotes')} rows={3} hasError={!!errors.notes} {...register('notes')} />
            </FormField>
          </div>
        </section>

        <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">{t('procurement.orderForm.sectionItems')}</h2>
            <Button type="button" variant="secondary" size="sm" iconLeft={<Plus size={14} />} onClick={addItemRow}>
              {t('procurement.orderForm.addItem')}
            </Button>
          </div>

          <div className="space-y-3">
            {items.map((item, index) => (
              <div key={`po-item-${index}`} className="grid grid-cols-12 gap-3 items-end p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                <div className="col-span-3">
                  <FormField label={index === 0 ? t('procurement.orderForm.labelMaterialId') : undefined} required>
                    {materialOptions.length > 0 ? (
                      <Select
                        options={materialSelectOptions}
                        value={item.materialId}
                        onChange={(event) => {
                          const materialId = event.target.value;
                          const material = materialById.get(materialId);
                          setItems((prev) => {
                            const next = [...prev];
                            next[index] = {
                              ...next[index],
                              materialId,
                              materialName: material?.name ?? next[index].materialName,
                              unit: material?.unit ?? next[index].unit,
                            };
                            return next;
                          });
                        }}
                      />
                    ) : (
                      <Input
                        placeholder={t('procurement.orderForm.placeholderMaterialUuid')}
                        value={item.materialId}
                        onChange={(event) => updateItem(index, 'materialId', event.target.value)}
                      />
                    )}
                  </FormField>
                </div>
                <div className="col-span-2">
                  <FormField label={index === 0 ? t('procurement.orderForm.labelMaterialName') : undefined}>
                    <Input
                      placeholder={t('procurement.orderForm.placeholderMaterial')}
                      value={item.materialName}
                      onChange={(event) => updateItem(index, 'materialName', event.target.value)}
                    />
                  </FormField>
                </div>
                <div className="col-span-1">
                  <FormField label={index === 0 ? t('procurement.orderForm.labelUnit') : undefined}>
                    <Input
                      placeholder={t('procurement.orderForm.placeholderUnit')}
                      value={item.unit}
                      onChange={(event) => updateItem(index, 'unit', event.target.value)}
                    />
                  </FormField>
                </div>
                <div className="col-span-2">
                  <FormField label={index === 0 ? t('procurement.orderForm.labelQuantity') : undefined} required>
                    <Input
                      type="text"
                      inputMode="decimal"
                      placeholder="0"
                      value={item.quantity}
                      onChange={(event) => updateItem(index, 'quantity', event.target.value)}
                    />
                  </FormField>
                </div>
                <div className="col-span-2">
                  <FormField label={index === 0 ? t('procurement.orderForm.labelPrice') : undefined} required>
                    <Input
                      type="text"
                      inputMode="decimal"
                      placeholder="0"
                      value={item.unitPrice}
                      onChange={(event) => updateItem(index, 'unitPrice', event.target.value)}
                    />
                  </FormField>
                </div>
                <div className="col-span-1">
                  <FormField label={index === 0 ? t('procurement.orderForm.labelVat') : undefined}>
                    <Input
                      type="text"
                      inputMode="decimal"
                      placeholder="20"
                      value={item.vatRate}
                      onChange={(event) => updateItem(index, 'vatRate', event.target.value)}
                    />
                  </FormField>
                </div>
                <div className="col-span-1 flex justify-center">
                  <button
                    type="button"
                    onClick={() => removeItemRow(index)}
                    className="p-1.5 text-neutral-400 hover:text-danger-600 hover:bg-danger-50 rounded-md transition-colors"
                    disabled={items.length === 1}
                    aria-label={`${t('procurement.orderForm.deleteRow')} ${index + 1}`}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-700 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <SummaryMetric label={t('procurement.orderForm.subtotal')} value={formatMoney(subtotal)} />
            <SummaryMetric label={t('procurement.orderForm.vat')} value={formatMoney(vatTotal)} />
            <SummaryMetric label={t('procurement.orderForm.total')} value={formatMoney(total)} highlight />
          </div>
        </section>

        <div className="flex items-center gap-3 mb-10">
          <Button type="submit" loading={createMutation.isPending}>
            {t('procurement.orderForm.createOrder')}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={async () => {
              if (!hasUnsavedChanges) {
                navigate('/procurement/purchase-orders');
                return;
              }

              const isConfirmed = await confirm({
                title: t('procurement.orderForm.confirmLeaveTitle'),
                description: t('procurement.orderForm.confirmLeaveDescription'),
                confirmLabel: t('procurement.orderForm.confirmLeaveBtn'),
                cancelLabel: t('procurement.orderForm.confirmStayBtn'),
                items: [`${t('procurement.orderForm.itemsInForm')}: ${items.length}`],
              });
              if (!isConfirmed) {
                return;
              }
              navigate('/procurement/purchase-orders');
            }}
          >
            {t('common.cancel')}
          </Button>
        </div>
      </form>
    </div>
  );
};

const SummaryMetric: React.FC<{ label: string; value: string; highlight?: boolean }> = ({
  label,
  value,
  highlight = false,
}) => (
  <div className="rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-3">
    <p className="text-xs text-neutral-500 mb-1">{label}</p>
    <p className={`text-sm tabular-nums font-semibold ${highlight ? 'text-primary-700 dark:text-primary-300' : 'text-neutral-900 dark:text-neutral-100'}`}>
      {value}
    </p>
  </div>
);

export default PurchaseOrderFormPage;
