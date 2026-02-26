import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectsApi } from '@/api/projects';
import { contractsApi } from '@/api/contracts';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { FormField, Input, Textarea, Select } from '@/design-system/components/FormField';
import { priceCoefficientApi } from './api';
import { t } from '@/i18n';

const schema = z.object({
  code: z.string().min(1, t('forms.priceCoefficient.validation.codeRequired')).max(50),
  name: z.string().min(1, t('forms.priceCoefficient.validation.nameRequired')).max(300),
  description: z.string().max(2000).optional(),
  type: z.string().min(1, t('forms.priceCoefficient.validation.typeRequired')),
  value: z.string().min(1, t('forms.priceCoefficient.validation.valueRequired'))
    .transform((val) => Number(val.replace(',', '.')))
    .refine((val) => val > 0, t('forms.priceCoefficient.validation.valuePositive')),
  effectiveFrom: z.string().min(1, t('forms.priceCoefficient.validation.effectiveFromRequired')),
  effectiveTo: z.string().optional(),
  contractId: z.string().optional(),
  projectId: z.string().optional(),
});

type FormData = z.input<typeof schema>;

const typeOptions = [
  { value: 'REGIONAL', label: t('forms.priceCoefficient.types.regional') },
  { value: 'SEASONAL', label: t('forms.priceCoefficient.types.seasonal') },
  { value: 'MATERIAL', label: t('forms.priceCoefficient.types.material') },
  { value: 'LABOR', label: t('forms.priceCoefficient.types.labor') },
  { value: 'EQUIPMENT', label: t('forms.priceCoefficient.types.equipment') },
  { value: 'OVERHEAD', label: t('forms.priceCoefficient.types.overhead') },
  { value: 'CUSTOM', label: t('forms.priceCoefficient.types.custom') },
];


const PriceCoefficientFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEdit = !!id;

  const { data: projectsData } = useQuery({ queryKey: ['projects'], queryFn: () => projectsApi.getProjects() });
  const projectOptions = [
    { value: '', label: t('forms.priceCoefficient.noBinding') },
    ...(projectsData?.content ?? []).map((p) => ({ value: p.id, label: p.name })),
  ];

  const { data: contractsData } = useQuery({ queryKey: ['contracts'], queryFn: () => contractsApi.getContracts() });
  const contractOptions = [
    { value: '', label: t('forms.priceCoefficient.noBinding') },
    ...(contractsData?.content ?? []).map((c) => ({ value: c.id, label: `${c.number} ${c.name}` })),
  ];

  const { data: existing } = useQuery({
    queryKey: ['price-coefficient', id],
    queryFn: () => priceCoefficientApi.getById(id!),
    enabled: isEdit,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: existing
      ? {
          code: existing.code,
          name: existing.name,
          description: existing.description ?? '',
          type: existing.type,
          value: String(existing.value),
          effectiveFrom: existing.effectiveFrom,
          effectiveTo: existing.effectiveTo ?? '',
          contractId: existing.contractId ?? '',
          projectId: existing.projectId ?? '',
        }
      : {
          code: '',
          name: '',
          description: '',
          type: '',
          value: '',
          effectiveFrom: '',
          effectiveTo: '',
          contractId: '',
          projectId: '',
        },
  });

  const createMutation = useMutation({
    mutationFn: (data: FormData) => priceCoefficientApi.create(data as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['price-coefficients'] });
      toast.success(t('forms.priceCoefficient.createSuccess'));
      navigate('/price-coefficients');
    },
    onError: () => toast.error(t('forms.priceCoefficient.createError')),
  });

  const updateMutation = useMutation({
    mutationFn: (data: FormData) => priceCoefficientApi.update(id!, data as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['price-coefficients'] });
      queryClient.invalidateQueries({ queryKey: ['price-coefficient', id] });
      toast.success(t('forms.priceCoefficient.updateSuccess'));
      navigate(`/price-coefficients/${id}`);
    },
    onError: () => toast.error(t('forms.priceCoefficient.updateError')),
  });

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const onSubmit = (data: FormData) => {
    if (isEdit) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={isEdit ? t('forms.priceCoefficient.editTitle') : t('forms.priceCoefficient.createTitle')}
        subtitle={isEdit ? existing?.name : t('forms.priceCoefficient.createSubtitle')}
        backTo={isEdit ? `/price-coefficients/${id}` : '/price-coefficients'}
        breadcrumbs={[
          { label: t('forms.common.home'), href: '/' },
          { label: t('forms.priceCoefficient.breadcrumbPriceCoefficients'), href: '/price-coefficients' },
          { label: isEdit ? t('forms.common.editing') : t('forms.common.creating') },
        ]}
      />

      <form onSubmit={handleSubmit(onSubmit)} className="max-w-3xl">
        <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-6">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-5">{t('forms.common.basicInfo')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FormField label={t('forms.priceCoefficient.labelCode')} error={errors.code?.message} required>
              <Input placeholder={t('forms.priceCoefficient.placeholderCode')} hasError={!!errors.code} {...register('code')} />
            </FormField>
            <FormField label={t('forms.priceCoefficient.labelType')} error={errors.type?.message} required>
              <Select options={typeOptions} placeholder={t('forms.priceCoefficient.placeholderType')} hasError={!!errors.type} {...register('type')} />
            </FormField>
            <FormField label={t('forms.priceCoefficient.labelName')} error={errors.name?.message} required className="sm:col-span-2">
              <Input placeholder={t('forms.priceCoefficient.placeholderName')} hasError={!!errors.name} {...register('name')} />
            </FormField>
            <FormField label={t('forms.priceCoefficient.labelValue')} error={errors.value?.message} required>
              <Input type="text" inputMode="decimal" placeholder="1.35" hasError={!!errors.value} {...register('value')} />
            </FormField>
          </div>
        </section>

        <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-6">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-5">{t('forms.priceCoefficient.sectionDates')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FormField label={t('forms.priceCoefficient.labelEffectiveFrom')} error={errors.effectiveFrom?.message} required>
              <Input type="date" hasError={!!errors.effectiveFrom} {...register('effectiveFrom')} />
            </FormField>
            <FormField label={t('forms.priceCoefficient.labelEffectiveTo')} error={errors.effectiveTo?.message}>
              <Input type="date" hasError={!!errors.effectiveTo} {...register('effectiveTo')} />
            </FormField>
          </div>
        </section>

        <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-6">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-5">{t('forms.priceCoefficient.sectionBindings')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FormField label={t('forms.priceCoefficient.labelProject')} error={errors.projectId?.message}>
              <Select options={projectOptions} hasError={!!errors.projectId} {...register('projectId')} />
            </FormField>
            <FormField label={t('forms.priceCoefficient.labelContract')} error={errors.contractId?.message}>
              <Select options={contractOptions} hasError={!!errors.contractId} {...register('contractId')} />
            </FormField>
          </div>
        </section>

        <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-8">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-5">{t('forms.priceCoefficient.sectionAdditional')}</h2>
          <FormField label={t('forms.priceCoefficient.labelDescription')} error={errors.description?.message}>
            <Textarea
              placeholder={t('forms.priceCoefficient.placeholderDescription')}
              rows={4}
              hasError={!!errors.description}
              {...register('description')}
            />
          </FormField>
        </section>

        <div className="flex items-center gap-3">
          <Button type="submit" loading={isSubmitting}>
            {isEdit ? t('forms.common.saveChanges') : t('forms.priceCoefficient.createButton')}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate(isEdit ? `/price-coefficients/${id}` : '/price-coefficients')}
          >
            {t('common.cancel')}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default PriceCoefficientFormPage;
