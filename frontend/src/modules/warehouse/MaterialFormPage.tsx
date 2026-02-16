import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { FormField, Input, Select } from '@/design-system/components/FormField';
import { warehouseApi } from '@/api/warehouse';
import { t } from '@/i18n';

const materialSchema = z.object({
  name: z.string().min(1, t('forms.material.validation.nameRequired')).max(200, t('forms.common.maxChars', { count: '200' })),
  code: z.string().min(1, t('forms.material.validation.codeRequired')).max(50, t('forms.common.maxChars', { count: '50' })),
  category: z.enum(
    ['CONCRETE', 'METAL', 'WOOD', 'INSULATION', 'PIPES', 'ELECTRICAL', 'FINISHING', 'FASTENERS', 'TOOLS', 'OTHER'],
    { required_error: t('forms.material.validation.categoryRequired') },
  ),
  unitOfMeasure: z.string().min(1, t('forms.material.validation.unitRequired')),
  minStock: z
    .string()
    .optional()
    .transform((val) => (val ? Number(val) : undefined)),
  warehouseLocation: z.string().max(100, t('forms.common.maxChars', { count: '100' })).optional(),
});

type MaterialFormData = z.input<typeof materialSchema>;

const categoryOptions = [
  { value: 'CONCRETE', label: t('forms.material.categories.concrete') },
  { value: 'METAL', label: t('forms.material.categories.metal') },
  { value: 'WOOD', label: t('forms.material.categories.wood') },
  { value: 'INSULATION', label: t('forms.material.categories.insulation') },
  { value: 'PIPES', label: t('forms.material.categories.pipes') },
  { value: 'ELECTRICAL', label: t('forms.material.categories.electrical') },
  { value: 'FINISHING', label: t('forms.material.categories.finishing') },
  { value: 'FASTENERS', label: t('forms.material.categories.fasteners') },
  { value: 'TOOLS', label: t('forms.material.categories.tools') },
  { value: 'OTHER', label: t('forms.material.categories.other') },
];

const unitOptions = [
  { value: 'шт', label: t('forms.material.units.piece') },
  { value: 'м', label: t('forms.material.units.meter') },
  { value: 'м2', label: t('forms.material.units.sqMeter') },
  { value: 'м3', label: t('forms.material.units.cubicMeter') },
  { value: 'кг', label: t('forms.material.units.kg') },
  { value: 'т', label: t('forms.material.units.ton') },
  { value: 'л', label: t('forms.material.units.liter') },
  { value: 'упак', label: t('forms.material.units.pack') },
  { value: 'комплект', label: t('forms.material.units.set') },
];

const MaterialFormPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<MaterialFormData>({
    resolver: zodResolver(materialSchema),
    defaultValues: {
      name: '',
      code: '',
      category: '' as any,
      unitOfMeasure: '',
      minStock: '',
      warehouseLocation: '',
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: MaterialFormData) => {
      const parsed = materialSchema.parse(data);
      return warehouseApi.createMaterial({
        name: parsed.name,
        code: parsed.code,
        category: parsed.category,
        unitOfMeasure: parsed.unitOfMeasure,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['MATERIALS'] });
      toast.success(t('forms.material.createSuccess'));
      navigate('/warehouse/materials');
    },
    onError: () => {
      toast.error(t('forms.material.createError'));
    },
  });

  const onSubmit = (data: MaterialFormData) => {
    createMutation.mutate(data);
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('forms.material.createTitle')}
        subtitle={t('forms.material.createSubtitle')}
        backTo="/warehouse/materials"
        breadcrumbs={[
          { label: t('forms.common.home'), href: '/' },
          { label: t('forms.material.breadcrumbWarehouse'), href: '/warehouse/materials' },
          { label: t('forms.material.breadcrumbMaterials'), href: '/warehouse/materials' },
          { label: t('forms.common.creating') },
        ]}
      />

      <form onSubmit={handleSubmit(onSubmit)} className="max-w-3xl">
        <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-6">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-5">{t('forms.common.basicInfo')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FormField label={t('forms.material.labelCode')} error={errors.code?.message} required>
              <Input placeholder={t('forms.material.placeholderCode')} hasError={!!errors.code} {...register('code')} />
            </FormField>
            <FormField label={t('forms.material.labelCategory')} error={errors.category?.message} required>
              <Select
                options={categoryOptions}
                placeholder={t('forms.material.placeholderCategory')}
                hasError={!!errors.category}
                {...register('category')}
              />
            </FormField>
            <FormField label={t('forms.material.labelName')} error={errors.name?.message} required className="sm:col-span-2">
              <Input placeholder={t('forms.material.placeholderName')} hasError={!!errors.name} {...register('name')} />
            </FormField>
            <FormField label={t('forms.material.labelUnit')} error={errors.unitOfMeasure?.message} required>
              <Select
                options={unitOptions}
                placeholder={t('forms.material.placeholderUnit')}
                hasError={!!errors.unitOfMeasure}
                {...register('unitOfMeasure')}
              />
            </FormField>
          </div>
        </section>

        <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-8">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-5">{t('forms.material.sectionStorage')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FormField
              label={t('forms.material.labelMinStock')}
              error={errors.minStock?.message}
              hint={t('forms.material.hintMinStock')}
            >
              <Input
                type="text"
                inputMode="numeric"
                placeholder="100"
                hasError={!!errors.minStock}
                {...register('minStock')}
              />
            </FormField>
            <FormField label={t('forms.material.labelLocation')} error={errors.warehouseLocation?.message}>
              <Input
                placeholder={t('forms.material.placeholderLocation')}
                hasError={!!errors.warehouseLocation}
                {...register('warehouseLocation')}
              />
            </FormField>
          </div>
        </section>

        <div className="flex items-center gap-3">
          <Button type="submit" loading={createMutation.isPending}>
            {t('forms.material.createButton')}
          </Button>
          <Button type="button" variant="secondary" onClick={() => navigate('/warehouse/materials')}>
            {t('common.cancel')}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default MaterialFormPage;
