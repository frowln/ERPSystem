import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Plus, Trash2 } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { FormField, Input, Textarea, Select } from '@/design-system/components/FormField';
import { procurementApi } from '@/api/procurement';
import { formatMoney } from '@/lib/format';
import { t } from '@/i18n';

const purchaseRequestSchema = z.object({
  requestDate: z.string().min(1, t('forms.purchaseRequest.validation.requestDateRequired')),
  projectId: z.string().min(1, t('forms.purchaseRequest.validation.projectRequired')),
  neededByDate: z.string().min(1, t('forms.purchaseRequest.validation.neededByDateRequired')),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], {
    required_error: t('forms.purchaseRequest.validation.priorityRequired'),
  }),
  notes: z.string().max(5000, t('forms.common.maxChars', { count: '5000' })).optional(),
});

type PurchaseRequestFormData = z.input<typeof purchaseRequestSchema>;

interface MaterialItem {
  materialId: string;
  quantity: string;
  unit: string;
  estimatedPrice: string;
}

const projectOptions = [
  { value: '1', label: 'ЖК "Солнечный"' },
  { value: '2', label: 'БЦ "Горизонт"' },
  { value: '3', label: 'Мост через р. Вятка' },
  { value: '6', label: 'ТЦ "Центральный"' },
];

const getPriorityOptions = () => [
  { value: 'LOW', label: t('forms.purchaseRequest.priorities.low') },
  { value: 'MEDIUM', label: t('forms.purchaseRequest.priorities.medium') },
  { value: 'HIGH', label: t('forms.purchaseRequest.priorities.high') },
  { value: 'CRITICAL', label: t('forms.purchaseRequest.priorities.critical') },
];

const materialOptions = [
  { value: 'm1', label: 'Арматура А500С d12' },
  { value: 'm2', label: 'Бетон В25' },
  { value: 'm3', label: 'Кирпич облицовочный' },
  { value: 'm4', label: 'Утеплитель Rockwool 100мм' },
  { value: 'm5', label: 'Труба ПНД 110мм' },
  { value: 'm6', label: 'Кабель ВВГнг 3x2.5' },
  { value: 'm7', label: 'Цемент М500' },
  { value: 'm8', label: 'Песок строительный' },
];

const unitOptions = [
  { value: 'шт', label: 'шт' },
  { value: 'м', label: 'м' },
  { value: 'м2', label: 'м2' },
  { value: 'м3', label: 'м3' },
  { value: 'кг', label: 'кг' },
  { value: 'т', label: 'т' },
  { value: 'л', label: 'л' },
  { value: 'упак', label: 'упак' },
];

const PurchaseRequestFormPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [items, setItems] = useState<MaterialItem[]>([
    { materialId: '', quantity: '', unit: 'шт', estimatedPrice: '' },
  ]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PurchaseRequestFormData>({
    resolver: zodResolver(purchaseRequestSchema),
    defaultValues: {
      requestDate: new Date().toISOString().split('T')[0],
      projectId: '',
      neededByDate: '',
      priority: 'MEDIUM',
      notes: '',
    },
  });

  const addItem = () => {
    setItems([...items, { materialId: '', quantity: '', unit: 'шт', estimatedPrice: '' }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: keyof MaterialItem, value: string) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  const totalEstimated = items.reduce((sum, item) => {
    const qty = Number(item.quantity) || 0;
    const price = Number(item.estimatedPrice) || 0;
    return sum + qty * price;
  }, 0);

  const createMutation = useMutation({
    mutationFn: (data: PurchaseRequestFormData) => {
      return procurementApi.createPurchaseRequest({
        name: `${t('forms.purchaseRequest.requestNamePrefix')} ${data.requestDate}`,
        requestDate: data.requestDate,
        projectId: data.projectId,
        status: 'DRAFT',
        priority: data.priority,
        requestedByName: t('forms.purchaseRequest.currentUser'),
        totalAmount: totalEstimated,
        itemCount: items.length,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchaseRequests'] });
      toast.success(t('forms.purchaseRequest.createSuccess'));
      navigate('/procurement');
    },
    onError: () => {
      toast.error(t('forms.purchaseRequest.createError'));
    },
  });

  const onSubmit = (data: PurchaseRequestFormData) => {
    createMutation.mutate(data);
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('forms.purchaseRequest.createTitle')}
        subtitle={t('forms.purchaseRequest.createSubtitle')}
        backTo="/procurement"
        breadcrumbs={[
          { label: t('forms.common.home'), href: '/' },
          { label: t('forms.purchaseRequest.breadcrumbProcurement'), href: '/procurement' },
          { label: t('forms.common.creating') },
        ]}
      />

      <form onSubmit={handleSubmit(onSubmit)} className="max-w-4xl">
        <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-6">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-5">{t('forms.common.basicInfo')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FormField label={t('forms.purchaseRequest.labelRequestDate')} error={errors.requestDate?.message} required>
              <Input type="date" hasError={!!errors.requestDate} {...register('requestDate')} />
            </FormField>
            <FormField label={t('forms.purchaseRequest.labelProject')} error={errors.projectId?.message} required>
              <Select
                options={projectOptions}
                placeholder={t('forms.purchaseRequest.placeholderProject')}
                hasError={!!errors.projectId}
                {...register('projectId')}
              />
            </FormField>
            <FormField label={t('forms.purchaseRequest.labelNeededByDate')} error={errors.neededByDate?.message} required>
              <Input type="date" hasError={!!errors.neededByDate} {...register('neededByDate')} />
            </FormField>
            <FormField label={t('forms.purchaseRequest.labelPriority')} error={errors.priority?.message} required>
              <Select options={getPriorityOptions()} hasError={!!errors.priority} {...register('priority')} />
            </FormField>
          </div>
        </section>

        <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">{t('forms.purchaseRequest.sectionMaterials')}</h2>
            <Button type="button" variant="secondary" size="sm" iconLeft={<Plus size={14} />} onClick={addItem}>
              {t('forms.purchaseRequest.addItem')}
            </Button>
          </div>
          <div className="space-y-3">
            {items.map((item, index) => (
              <div key={index} className="grid grid-cols-12 gap-3 items-end p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                <div className="col-span-4">
                  <FormField label={index === 0 ? t('forms.purchaseRequest.labelMaterial') : undefined}>
                    <Select
                      options={materialOptions}
                      placeholder={t('forms.purchaseRequest.placeholderMaterial')}
                      value={item.materialId}
                      onChange={(e) => updateItem(index, 'materialId', e.target.value)}
                    />
                  </FormField>
                </div>
                <div className="col-span-2">
                  <FormField label={index === 0 ? t('forms.purchaseRequest.labelQuantity') : undefined}>
                    <Input
                      type="text"
                      inputMode="numeric"
                      placeholder="0"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                    />
                  </FormField>
                </div>
                <div className="col-span-2">
                  <FormField label={index === 0 ? t('forms.purchaseRequest.labelUnitOfMeasure') : undefined}>
                    <Select
                      options={unitOptions}
                      value={item.unit}
                      onChange={(e) => updateItem(index, 'unit', e.target.value)}
                    />
                  </FormField>
                </div>
                <div className="col-span-3">
                  <FormField label={index === 0 ? t('forms.purchaseRequest.labelEstimatedPrice') : undefined}>
                    <Input
                      type="text"
                      inputMode="numeric"
                      placeholder="0"
                      value={item.estimatedPrice}
                      onChange={(e) => updateItem(index, 'estimatedPrice', e.target.value)}
                    />
                  </FormField>
                </div>
                <div className="col-span-1 flex justify-center">
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="p-1.5 text-neutral-400 hover:text-danger-600 hover:bg-danger-50 rounded-md transition-colors"
                    disabled={items.length === 1}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
          {totalEstimated > 0 && (
            <div className="mt-4 pt-4 border-t border-neutral-100 flex justify-end">
              <div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-0.5">{t('forms.purchaseRequest.estimatedTotal')}</p>
                <p className="text-sm font-semibold text-primary-700 tabular-nums text-right">
                  {formatMoney(totalEstimated)}
                </p>
              </div>
            </div>
          )}
        </section>

        <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-8">
          <FormField label={t('forms.purchaseRequest.labelNotes')} error={errors.notes?.message}>
            <Textarea
              placeholder={t('forms.purchaseRequest.placeholderNotes')}
              rows={4}
              hasError={!!errors.notes}
              {...register('notes')}
            />
          </FormField>
        </section>

        <div className="flex items-center gap-3">
          <Button type="submit" loading={createMutation.isPending}>
            {t('forms.purchaseRequest.createButton')}
          </Button>
          <Button type="button" variant="secondary" onClick={() => navigate('/procurement')}>
            {t('common.cancel')}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default PurchaseRequestFormPage;
