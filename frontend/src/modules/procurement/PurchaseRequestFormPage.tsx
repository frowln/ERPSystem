import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Plus, Trash2 } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { FormField, Input, Textarea, Select } from '@/design-system/components/FormField';
import { procurementApi } from '@/api/procurement';
import { projectsApi } from '@/api/projects';
import { formatMoney } from '@/lib/format';
import { useAuthStore } from '@/stores/authStore';
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

const getPriorityOptions = () => [
  { value: 'LOW', label: t('forms.purchaseRequest.priorities.low') },
  { value: 'MEDIUM', label: t('forms.purchaseRequest.priorities.medium') },
  { value: 'HIGH', label: t('forms.purchaseRequest.priorities.high') },
  { value: 'CRITICAL', label: t('forms.purchaseRequest.priorities.critical') },
];

const getUnitOptions = () => [
  { value: 'шт', label: t('forms.purchaseRequest.units.pcs') },
  { value: 'м', label: t('forms.purchaseRequest.units.m') },
  { value: 'м2', label: t('forms.purchaseRequest.units.m2') },
  { value: 'м3', label: t('forms.purchaseRequest.units.m3') },
  { value: 'кг', label: t('forms.purchaseRequest.units.kg') },
  { value: 'т', label: t('forms.purchaseRequest.units.t') },
  { value: 'л', label: t('forms.purchaseRequest.units.l') },
  { value: 'упак', label: t('forms.purchaseRequest.units.pack') },
];

const toNumber = (value: string): number => {
  const normalized = value.replace(',', '.').trim();
  if (!normalized) {
    return 0;
  }
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

const PurchaseRequestFormPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((state) => state.user);

  const [items, setItems] = useState<MaterialItem[]>([
    { materialId: '', quantity: '', unit: 'шт', estimatedPrice: '' },
  ]);

  const { data: projectsResponse, isLoading: isProjectsLoading } = useQuery({
    queryKey: ['projects', 'purchase-request-form'],
    queryFn: () => projectsApi.getProjects({ page: 0, size: 300, sort: 'name,asc' }),
  });
  const projects = projectsResponse?.content ?? [];

  const { data: materials = [], isLoading: isMaterialsLoading } = useQuery({
    queryKey: ['procurement-materials'],
    queryFn: procurementApi.getMaterials,
  });

  const projectOptions = useMemo(
    () => projects.map((project) => ({ value: project.id, label: project.name })),
    [projects],
  );
  const materialOptions = useMemo(
    () => materials.map((material) => ({ value: material.id, label: material.name })),
    [materials],
  );
  const materialById = useMemo(
    () => new Map(materials.map((material) => [material.id, material])),
    [materials],
  );

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

  const setItemMaterial = (index: number, materialId: string) => {
    setItems((prev) => {
      const next = [...prev];
      const material = materialById.get(materialId);
      next[index] = {
        ...next[index],
        materialId,
        unit: material?.unit ?? next[index].unit,
      };
      return next;
    });
  };

  const totalEstimated = useMemo(
    () => items.reduce((sum, item) => sum + (toNumber(item.quantity) * toNumber(item.estimatedPrice)), 0),
    [items],
  );

  const createMutation = useMutation({
    mutationFn: async (data: PurchaseRequestFormData) => {
      const parsed = purchaseRequestSchema.parse(data);
      const filledItems = items
        .map((item, index) => ({
          row: index + 1,
          materialId: item.materialId.trim(),
          quantity: item.quantity.trim(),
          unit: item.unit.trim(),
          estimatedPrice: item.estimatedPrice.trim(),
        }))
        .filter((item) => item.materialId || item.quantity || item.estimatedPrice);

      if (filledItems.length === 0) {
        throw new Error(t('forms.purchaseRequest.validation.atLeastOneItem'));
      }

      const itemPayloads = filledItems.map((item, index) => {
        if (!item.materialId) {
          throw new Error(`${t('forms.purchaseRequest.validation.itemMaterialRequired')} ${item.row}`);
        }

        const quantity = toNumber(item.quantity);
        if (quantity <= 0) {
          throw new Error(`${t('forms.purchaseRequest.validation.itemQuantityPositive')} ${item.row}`);
        }

        if (!item.unit) {
          throw new Error(`${t('forms.purchaseRequest.validation.itemUnitRequired')} ${item.row}`);
        }

        let unitPrice: number | undefined;
        if (item.estimatedPrice) {
          const parsedPrice = toNumber(item.estimatedPrice);
          if (parsedPrice <= 0) {
            throw new Error(`${t('forms.purchaseRequest.validation.itemPricePositive')} ${item.row}`);
          }
          unitPrice = parsedPrice;
        }

        return {
          sequence: index + 1,
          name: materialById.get(item.materialId)?.name ?? item.materialId,
          quantity,
          unitOfMeasure: item.unit,
          unitPrice,
        };
      });

      const requesterName = currentUser?.fullName?.trim()
        || `${currentUser?.firstName ?? ''} ${currentUser?.lastName ?? ''}`.trim()
        || currentUser?.email
        || t('forms.purchaseRequest.currentUser');

      const neededByLine = `${t('forms.purchaseRequest.labelNeededByDate')}: ${parsed.neededByDate}`;
      const trimmedNotes = parsed.notes?.trim() ?? '';
      const maxNotesLength = 5000;
      const maxFreeTextLength = Math.max(0, maxNotesLength - neededByLine.length - (trimmedNotes ? 1 : 0));
      const limitedNotes = trimmedNotes ? trimmedNotes.slice(0, maxFreeTextLength) : '';
      const requestNotes = limitedNotes ? `${limitedNotes}\n${neededByLine}` : neededByLine;

      const request = await procurementApi.createPurchaseRequest({
        requestDate: parsed.requestDate,
        projectId: parsed.projectId,
        priority: parsed.priority,
        requestedById: currentUser?.id,
        requestedByName: requesterName,
        notes: requestNotes || undefined,
      });

      for (const itemPayload of itemPayloads) {
        await procurementApi.addPurchaseRequestItem(request.id, itemPayload);
      }

      return request;
    },
    onSuccess: (request) => {
      queryClient.invalidateQueries({ queryKey: ['purchase-requests'] });
      toast.success(t('forms.purchaseRequest.createSuccess'));
      navigate(`/procurement/${request.id}`);
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : t('forms.purchaseRequest.createError');
      toast.error(message);
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
              {!isProjectsLoading && projectOptions.length === 0 ? (
                <Input placeholder="UUID" hasError={!!errors.projectId} {...register('projectId')} />
              ) : (
                <Select
                  options={projectOptions}
                  placeholder={isProjectsLoading ? t('common.loading') : t('forms.purchaseRequest.placeholderProject')}
                  hasError={!!errors.projectId}
                  disabled={isProjectsLoading}
                  {...register('projectId')}
                />
              )}
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
                    {!isMaterialsLoading && materialOptions.length === 0 ? (
                      <Input
                        placeholder={t('forms.purchaseRequest.placeholderMaterial')}
                        value={item.materialId}
                        onChange={(e) => updateItem(index, 'materialId', e.target.value)}
                      />
                    ) : (
                      <Select
                        options={materialOptions}
                        placeholder={isMaterialsLoading ? t('common.loading') : t('forms.purchaseRequest.placeholderMaterial')}
                        value={item.materialId}
                        onChange={(e) => setItemMaterial(index, e.target.value)}
                        disabled={isMaterialsLoading}
                      />
                    )}
                  </FormField>
                </div>
                <div className="col-span-2">
                  <FormField label={index === 0 ? t('forms.purchaseRequest.labelQuantity') : undefined}>
                    <Input
                      type="text"
                      inputMode="decimal"
                      placeholder="0"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                    />
                  </FormField>
                </div>
                <div className="col-span-2">
                  <FormField label={index === 0 ? t('forms.purchaseRequest.labelUnitOfMeasure') : undefined}>
                    <Select
                      options={getUnitOptions()}
                      value={item.unit}
                      onChange={(e) => updateItem(index, 'unit', e.target.value)}
                    />
                  </FormField>
                </div>
                <div className="col-span-3">
                  <FormField label={index === 0 ? t('forms.purchaseRequest.labelEstimatedPrice') : undefined}>
                    <Input
                      type="text"
                      inputMode="decimal"
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
