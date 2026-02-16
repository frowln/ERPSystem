import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Plus, Trash2 } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { FormField, Input, Textarea, Select } from '@/design-system/components/FormField';
import { specificationsApi } from '@/api/specifications';
import { t } from '@/i18n';

const specificationSchema = z.object({
  name: z.string().min(1, t('forms.specification.validation.nameRequired')).max(300, t('forms.common.maxChars', { count: '300' })),
  code: z.string().min(1, t('forms.specification.validation.codeRequired')).max(50, t('forms.common.maxChars', { count: '50' })),
  projectId: z.string().min(1, t('forms.specification.validation.projectRequired')),
  status: z.enum(['DRAFT', 'IN_REVIEW', 'APPROVED', 'ACTIVE'], {
    required_error: t('forms.specification.validation.statusRequired'),
  }),
  notes: z.string().max(2000, t('forms.common.maxChars', { count: '2000' })).optional(),
});

type SpecificationFormData = z.input<typeof specificationSchema>;

interface LineItem {
  name: string;
  productCode: string;
  quantity: string;
  unitOfMeasure: string;
  plannedAmount: string;
}

const projectOptions = [
  { value: '1', label: 'ЖК "Солнечный"' },
  { value: '2', label: 'БЦ "Горизонт"' },
  { value: '3', label: 'Мост через р. Вятка' },
  { value: '6', label: 'ТЦ "Центральный"' },
];

const statusOptions = [
  { value: 'DRAFT', label: t('forms.specification.statuses.draft') },
  { value: 'IN_REVIEW', label: t('forms.specification.statuses.inReview') },
  { value: 'APPROVED', label: t('forms.specification.statuses.approved') },
  { value: 'ACTIVE', label: t('forms.specification.statuses.active') },
];

const SpecificationFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEdit = !!id;

  const [lineItems, setLineItems] = useState<LineItem[]>([
    { name: '', productCode: '', quantity: '', unitOfMeasure: 'шт', plannedAmount: '' },
  ]);

  const { data: existingSpec } = useQuery({
    queryKey: [ 'SPECIFICATION', id],
    queryFn: () => specificationsApi.getSpecification(id!),
    enabled: isEdit,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SpecificationFormData>({
    resolver: zodResolver(specificationSchema),
    defaultValues: existingSpec
      ? {
          name: existingSpec.name,
          code: '',
          projectId: existingSpec.projectId,
          status: existingSpec.status,
          notes: existingSpec.notes ?? '',
        }
      : {
          name: '',
          code: '',
          projectId: '',
          status: 'DRAFT',
          notes: '',
        },
  });

  const addLineItem = () => {
    setLineItems([...lineItems, { name: '', productCode: '', quantity: '', unitOfMeasure: 'шт', plannedAmount: '' }]);
  };

  const removeLineItem = (index: number) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter((_, i) => i !== index));
    }
  };

  const updateLineItem = (index: number, field: keyof LineItem, value: string) => {
    const updated = [...lineItems];
    updated[index] = { ...updated[index], [field]: value };
    setLineItems(updated);
  };

  const createMutation = useMutation({
    mutationFn: (data: SpecificationFormData) => {
      return specificationsApi.createSpecification({
        name: data.name,
        projectId: data.projectId,
        status: data.status,
        notes: data.notes,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['specifications'] });
      toast.success(t('forms.specification.createSuccess'));
      navigate('/specifications');
    },
    onError: () => {
      toast.error(t('forms.specification.createError'));
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: SpecificationFormData) => {
      return specificationsApi.updateSpecification(id!, {
        name: data.name,
        projectId: data.projectId,
        status: data.status,
        notes: data.notes,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['specifications'] });
      queryClient.invalidateQueries({ queryKey: [ 'SPECIFICATION', id] });
      toast.success(t('forms.specification.updateSuccess'));
      navigate(`/specifications/${id}`);
    },
    onError: () => {
      toast.error(t('forms.specification.updateError'));
    },
  });

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const onSubmit = (data: SpecificationFormData) => {
    if (isEdit) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={isEdit ? t('forms.specification.editTitle') : t('forms.specification.createTitle')}
        subtitle={isEdit ? existingSpec?.name : t('forms.specification.createSubtitle')}
        backTo={isEdit ? `/specifications/${id}` : '/specifications'}
        breadcrumbs={[
          { label: t('forms.common.home'), href: '/' },
          { label: t('forms.specification.breadcrumbSpecifications'), href: '/specifications' },
          { label: isEdit ? t('forms.common.editing') : t('forms.common.creating') },
        ]}
      />

      <form onSubmit={handleSubmit(onSubmit)} className="max-w-4xl">
        <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-6">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-5">{t('forms.common.basicInfo')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FormField label={t('forms.specification.labelCode')} error={errors.code?.message} required>
              <Input placeholder="СП-001" hasError={!!errors.code} {...register('code')} />
            </FormField>
            <FormField label={t('forms.specification.labelProject')} error={errors.projectId?.message} required>
              <Select
                options={projectOptions}
                placeholder={t('forms.specification.placeholderProject')}
                hasError={!!errors.projectId}
                {...register('projectId')}
              />
            </FormField>
            <FormField label={t('forms.specification.labelName')} error={errors.name?.message} required className="sm:col-span-2">
              <Input placeholder={t('forms.specification.placeholderName')} hasError={!!errors.name} {...register('name')} />
            </FormField>
            <FormField label={t('forms.specification.labelStatus')} error={errors.status?.message} required>
              <Select options={statusOptions} hasError={!!errors.status} {...register('status')} />
            </FormField>
            <FormField label={t('forms.specification.labelNotes')} error={errors.notes?.message} className="sm:col-span-2">
              <Textarea placeholder={t('forms.specification.placeholderNotes')} rows={3} hasError={!!errors.notes} {...register('notes')} />
            </FormField>
          </div>
        </section>

        <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">{t('forms.specification.sectionLineItems')}</h2>
            <Button type="button" variant="secondary" size="sm" iconLeft={<Plus size={14} />} onClick={addLineItem}>
              {t('forms.specification.addLineItem')}
            </Button>
          </div>
          <div className="space-y-4">
            {lineItems.map((item, index) => (
              <div key={index} className="grid grid-cols-12 gap-3 items-end p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                <div className="col-span-4">
                  <FormField label={index === 0 ? t('forms.specification.labelItemName') : undefined}>
                    <Input
                      placeholder={t('forms.specification.placeholderItemName')}
                      value={item.name}
                      onChange={(e) => updateLineItem(index, 'name', e.target.value)}
                    />
                  </FormField>
                </div>
                <div className="col-span-2">
                  <FormField label={index === 0 ? t('forms.specification.labelProductCode') : undefined}>
                    <Input
                      placeholder="Код"
                      value={item.productCode}
                      onChange={(e) => updateLineItem(index, 'productCode', e.target.value)}
                    />
                  </FormField>
                </div>
                <div className="col-span-2">
                  <FormField label={index === 0 ? t('forms.specification.labelQuantity') : undefined}>
                    <Input
                      type="text"
                      inputMode="numeric"
                      placeholder="0"
                      value={item.quantity}
                      onChange={(e) => updateLineItem(index, 'quantity', e.target.value)}
                    />
                  </FormField>
                </div>
                <div className="col-span-1">
                  <FormField label={index === 0 ? t('forms.specification.labelUnit') : undefined}>
                    <Input
                      placeholder="шт"
                      value={item.unitOfMeasure}
                      onChange={(e) => updateLineItem(index, 'unitOfMeasure', e.target.value)}
                    />
                  </FormField>
                </div>
                <div className="col-span-2">
                  <FormField label={index === 0 ? t('forms.specification.labelAmount') : undefined}>
                    <Input
                      type="text"
                      inputMode="numeric"
                      placeholder="0"
                      value={item.plannedAmount}
                      onChange={(e) => updateLineItem(index, 'plannedAmount', e.target.value)}
                    />
                  </FormField>
                </div>
                <div className="col-span-1 flex justify-center">
                  <button
                    type="button"
                    onClick={() => removeLineItem(index)}
                    className="p-1.5 text-neutral-400 hover:text-danger-600 hover:bg-danger-50 rounded-md transition-colors"
                    disabled={lineItems.length === 1}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="flex items-center gap-3">
          <Button type="submit" loading={isSubmitting}>
            {isEdit ? t('forms.common.saveChanges') : t('forms.specification.createButton')}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate(isEdit ? `/specifications/${id}` : '/specifications')}
          >
            {t('common.cancel')}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default SpecificationFormPage;
