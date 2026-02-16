import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { FormField, Input, Select, Textarea } from '@/design-system/components/FormField';
import {
  procurementApi,
  type PurchaseOrderItemPayload,
  type PurchaseOrderWithItemsPayload,
} from '@/api/procurement';
import { projectsApi } from '@/api/projects';
import { formatMoney } from '@/lib/format';

const purchaseOrderSchema = z.object({
  orderNumber: z.string().min(1, 'Укажите номер заказа'),
  supplierId: z.string().min(1, 'Выберите поставщика'),
  orderDate: z.string().min(1, 'Укажите дату заказа'),
  expectedDeliveryDate: z.string().optional(),
  projectId: z.string().optional(),
  purchaseRequestId: z.string().optional(),
  contractId: z.string().optional(),
  currency: z.string().min(3, 'Валюта должна содержать 3 символа').max(3, 'Валюта должна содержать 3 символа'),
  paymentTerms: z.string().max(500, 'Максимум 500 символов').optional(),
  deliveryAddress: z.string().max(1000, 'Максимум 1000 символов').optional(),
  notes: z.string().max(5000, 'Максимум 5000 символов').optional(),
});

type PurchaseOrderFormData = z.input<typeof purchaseOrderSchema>;

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

const PurchaseOrderFormPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [items, setItems] = useState<DraftItem[]>([emptyItem()]);

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
    () => [{ value: '', label: 'Не выбран' }, ...projects.map((project) => ({ value: project.id, label: project.name }))],
    [projects],
  );
  const materialOptions = useMemo(
    () => materials.map((material) => ({ value: material.id, label: material.name })),
    [materials],
  );
  const materialSelectOptions = useMemo(
    () => [{ value: '', label: 'Выберите материал' }, ...materialOptions],
    [materialOptions],
  );
  const materialById = useMemo(
    () => new Map(materials.map((material) => [material.id, material])),
    [materials],
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PurchaseOrderFormData>({
    resolver: zodResolver(purchaseOrderSchema),
    defaultValues: {
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
    },
  });

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
      const parsed = purchaseOrderSchema.parse(data);
      const preparedItems: PurchaseOrderItemPayload[] = items.map((item, index) => {
        const quantity = toNumber(item.quantity);
        const unitPrice = toNumber(item.unitPrice);
        const vatRate = toNumber(item.vatRate);
        if (!item.materialId.trim()) {
          throw new Error(`Строка ${index + 1}: укажите ID материала`);
        }
        if (quantity <= 0) {
          throw new Error(`Строка ${index + 1}: количество должно быть больше нуля`);
        }
        if (unitPrice <= 0) {
          throw new Error(`Строка ${index + 1}: цена должна быть больше нуля`);
        }
        if (vatRate < 0 || vatRate > 100) {
          throw new Error(`Строка ${index + 1}: НДС должен быть в диапазоне 0-100`);
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
        throw new Error('Добавьте хотя бы одну позицию');
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
      toast.success('Заказ поставщику создан');
      navigate(`/procurement/purchase-orders/${order.id}`);
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Не удалось создать заказ';
      toast.error(message);
    },
  });

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Новый заказ поставщику"
        subtitle="Создание Purchase Order"
        backTo="/procurement/purchase-orders"
        breadcrumbs={[
          { label: 'Главная', href: '/' },
          { label: 'Закупки', href: '/procurement' },
          { label: 'Заказы поставщикам', href: '/procurement/purchase-orders' },
          { label: 'Создание' },
        ]}
      />

      <form onSubmit={handleSubmit((values) => createMutation.mutate(values))} className="max-w-6xl">
        <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-6">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-5">Основные данные</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <FormField label="Номер заказа" error={errors.orderNumber?.message} required>
              <Input placeholder="PO-2026-001" hasError={!!errors.orderNumber} {...register('orderNumber')} />
            </FormField>
            <FormField label="Поставщик" error={errors.supplierId?.message} required>
              {supplierOptions.length > 0 ? (
                <Select
                  options={supplierOptions}
                  placeholder="Выберите поставщика"
                  hasError={!!errors.supplierId}
                  {...register('supplierId')}
                />
              ) : (
                <Input
                  placeholder="UUID поставщика"
                  hasError={!!errors.supplierId}
                  {...register('supplierId')}
                />
              )}
            </FormField>
            <FormField label="Дата заказа" error={errors.orderDate?.message} required>
              <Input type="date" hasError={!!errors.orderDate} {...register('orderDate')} />
            </FormField>
            <FormField label="План поставки" error={errors.expectedDeliveryDate?.message}>
              <Input type="date" hasError={!!errors.expectedDeliveryDate} {...register('expectedDeliveryDate')} />
            </FormField>
            <FormField label="Проект" error={errors.projectId?.message}>
              <Select options={projectOptions} hasError={!!errors.projectId} {...register('projectId')} />
            </FormField>
            <FormField label="Валюта" error={errors.currency?.message} required>
              <Input placeholder="RUB" hasError={!!errors.currency} {...register('currency')} />
            </FormField>
            <FormField label="ID заявки на закупку" error={errors.purchaseRequestId?.message}>
              <Input placeholder="UUID" hasError={!!errors.purchaseRequestId} {...register('purchaseRequestId')} />
            </FormField>
            <FormField label="ID договора" error={errors.contractId?.message}>
              <Input placeholder="UUID" hasError={!!errors.contractId} {...register('contractId')} />
            </FormField>
            <FormField label="Условия оплаты" error={errors.paymentTerms?.message} className="sm:col-span-2 lg:col-span-3">
              <Input placeholder="Например: 50% аванс, 50% после поставки" hasError={!!errors.paymentTerms} {...register('paymentTerms')} />
            </FormField>
            <FormField label="Адрес поставки" error={errors.deliveryAddress?.message} className="sm:col-span-2 lg:col-span-3">
              <Input placeholder="Город, улица, корпус, склад" hasError={!!errors.deliveryAddress} {...register('deliveryAddress')} />
            </FormField>
            <FormField label="Комментарий" error={errors.notes?.message} className="sm:col-span-2 lg:col-span-3">
              <Textarea placeholder="Комментарий к заказу" rows={3} hasError={!!errors.notes} {...register('notes')} />
            </FormField>
          </div>
        </section>

        <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">Позиции заказа</h2>
            <Button type="button" variant="secondary" size="sm" iconLeft={<Plus size={14} />} onClick={addItemRow}>
              Добавить позицию
            </Button>
          </div>

          <div className="space-y-3">
            {items.map((item, index) => (
              <div key={`po-item-${index}`} className="grid grid-cols-12 gap-3 items-end p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                <div className="col-span-3">
                  <FormField label={index === 0 ? 'ID материала' : undefined} required>
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
                        placeholder="UUID материала"
                        value={item.materialId}
                        onChange={(event) => updateItem(index, 'materialId', event.target.value)}
                      />
                    )}
                  </FormField>
                </div>
                <div className="col-span-2">
                  <FormField label={index === 0 ? 'Наименование' : undefined}>
                    <Input
                      placeholder="Материал"
                      value={item.materialName}
                      onChange={(event) => updateItem(index, 'materialName', event.target.value)}
                    />
                  </FormField>
                </div>
                <div className="col-span-1">
                  <FormField label={index === 0 ? 'Ед.' : undefined}>
                    <Input
                      placeholder="шт"
                      value={item.unit}
                      onChange={(event) => updateItem(index, 'unit', event.target.value)}
                    />
                  </FormField>
                </div>
                <div className="col-span-2">
                  <FormField label={index === 0 ? 'Кол-во' : undefined} required>
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
                  <FormField label={index === 0 ? 'Цена' : undefined} required>
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
                  <FormField label={index === 0 ? 'НДС %' : undefined}>
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
                    aria-label={`Удалить строку ${index + 1}`}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-700 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <SummaryMetric label="Подытог" value={formatMoney(subtotal)} />
            <SummaryMetric label="НДС" value={formatMoney(vatTotal)} />
            <SummaryMetric label="Итого" value={formatMoney(total)} highlight />
          </div>
        </section>

        <div className="flex items-center gap-3 mb-10">
          <Button type="submit" loading={createMutation.isPending}>
            Создать заказ
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate('/procurement/purchase-orders')}
          >
            Отмена
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
