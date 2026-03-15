import React, { useEffect, useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { FormField, Input, Select, Textarea } from '@/design-system/components/FormField';
import { estimatesApi } from '@/api/estimates';
import { specificationsApi } from '@/api/specifications';
import { useContractOptions, useProjectOptions } from '@/hooks/useSelectOptions';
import { t } from '@/i18n';

const estimateSchema = z.object({
  name: z.string().min(1, t('common.required')).max(500, t('forms.common.maxChars', { count: '500' })),
  projectId: z.string().min(1, t('common.required')),
  specificationId: z.string().min(1, t('common.required')),
  contractId: z.string().optional(),
  notes: z.string().max(2000, t('forms.common.maxChars', { count: '2000' })).optional(),
});

type EstimateFormData = z.input<typeof estimateSchema>;

const EstimateFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const [searchParams] = useSearchParams();
  const projectIdFromQuery = searchParams.get('projectId') ?? '';
  const specificationIdFromQuery = searchParams.get('specificationId') ?? '';
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { options: projectOptions } = useProjectOptions();

  const { data: existingEstimate } = useQuery({
    queryKey: ['ESTIMATE', id],
    queryFn: () => estimatesApi.getEstimate(id!),
    enabled: isEdit,
  });

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<EstimateFormData>({
    resolver: zodResolver(estimateSchema),
    defaultValues: {
      name: '',
      projectId: projectIdFromQuery,
      specificationId: specificationIdFromQuery,
      contractId: '',
      notes: '',
    },
  });

  useEffect(() => {
    if (!existingEstimate) return;
    reset({
      name: existingEstimate.name,
      projectId: existingEstimate.projectId,
      specificationId: existingEstimate.specificationId,
      contractId: (existingEstimate as unknown as { contractId?: string }).contractId ?? '',
      notes: (existingEstimate as unknown as { notes?: string }).notes ?? '',
    });
  }, [existingEstimate, reset]);

  const selectedProjectId = watch('projectId');

  const { options: contractOptions } = useContractOptions(selectedProjectId || undefined);

  const { data: specificationData } = useQuery({
    queryKey: ['estimate-form-specifications', selectedProjectId || 'all'],
    queryFn: () => specificationsApi.getSpecifications({
      ...(selectedProjectId ? { projectId: selectedProjectId } : {}),
      page: 0,
      size: 300,
    }),
  });

  const specificationOptions = useMemo(
    () =>
      (specificationData?.content ?? []).map((spec) => ({
        value: spec.id,
        label: spec.title ? `${spec.name} — ${spec.title}` : spec.name,
      })),
    [specificationData],
  );

  const createMutation = useMutation({
    mutationFn: async (data: EstimateFormData) => {
      const parsed = estimateSchema.parse(data);
      return estimatesApi.createEstimateFromSpec({
        name: parsed.name,
        specificationId: parsed.specificationId,
        contractId: parsed.contractId || undefined,
        notes: parsed.notes || undefined,
      });
    },
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ['estimates'] });
      toast.success(t('estimates.form.toastCreated'));
      navigate(`/estimates/${created.id}`);
    },
    onError: () => {
      toast.error(t('estimates.form.toastCreateError'));
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: EstimateFormData) => {
      const parsed = estimateSchema.parse(data);
      return estimatesApi.updateEstimate(id!, {
        name: parsed.name,
        contractId: parsed.contractId || undefined,
        notes: parsed.notes || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estimates'] });
      queryClient.invalidateQueries({ queryKey: ['ESTIMATE', id] });
      toast.success(t('estimates.form.toastUpdated'));
      navigate(`/estimates/${id}`);
    },
    onError: () => {
      toast.error(t('estimates.form.toastUpdateError'));
    },
  });

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const onSubmit = (data: EstimateFormData) => {
    if (isEdit) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={isEdit ? t('estimates.form.titleEdit') : t('estimates.form.titleCreate')}
        subtitle={isEdit ? existingEstimate?.name : t('estimates.form.subtitleCreate')}
        backTo={isEdit ? `/estimates/${id}` : '/estimates'}
        breadcrumbs={[
          { label: t('forms.common.home'), href: '/' },
          { label: t('estimates.detail.breadcrumbEstimates'), href: '/estimates' },
          { label: isEdit ? t('forms.common.editing') : t('forms.common.creating') },
        ]}
      />

      <form onSubmit={handleSubmit(onSubmit)} className="max-w-3xl">
        <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-6">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-5">
            {t('forms.common.basicInfo')}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FormField label={t('estimates.form.fieldName')} error={errors.name?.message} required className="sm:col-span-2">
              <Input placeholder={t('estimates.form.placeholderName')} hasError={!!errors.name} {...register('name')} />
            </FormField>

            <FormField label={t('estimates.form.fieldProject')} error={errors.projectId?.message} required>
              <Select
                options={projectOptions}
                placeholder={t('estimates.form.placeholderProject')}
                hasError={!!errors.projectId}
                disabled={isEdit}
                {...register('projectId')}
              />
            </FormField>

            <FormField label={t('estimates.form.fieldSpecification')} error={errors.specificationId?.message} required>
              <Select
                options={specificationOptions}
                placeholder={t('estimates.form.placeholderSpecification')}
                hasError={!!errors.specificationId}
                disabled={isEdit}
                {...register('specificationId')}
              />
            </FormField>

            <FormField label={t('estimates.form.fieldContract')} error={errors.contractId?.message}>
              <Select
                options={[{ value: '', label: t('estimates.form.noContract') }, ...contractOptions]}
                placeholder={t('estimates.form.placeholderContract')}
                hasError={!!errors.contractId}
                {...register('contractId')}
              />
            </FormField>

            <FormField label={t('common.notes')} error={errors.notes?.message} className="sm:col-span-2">
              <Textarea placeholder={t('estimates.form.placeholderNotes')} rows={4} hasError={!!errors.notes} {...register('notes')} />
            </FormField>
          </div>
        </section>

        <div className="flex items-center gap-3">
          <Button type="submit" loading={isSubmitting}>
            {isEdit ? t('forms.common.saveChanges') : t('estimates.form.createButton')}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate(isEdit ? `/estimates/${id}` : '/estimates')}
          >
            {t('common.cancel')}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default EstimateFormPage;
