import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useWatch, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { FormField, Input, Textarea, Select } from '@/design-system/components/FormField';
import { portfolioApi } from '@/api/portfolio';
import { formatMoney } from '@/lib/format';
import { t } from '@/i18n';
import type { Opportunity, OpportunityStage } from './types';

const opportunitySchema = z.object({
  name: z.string().min(1, t('forms.opportunity.validation.nameRequired')).max(300, t('forms.common.maxChars', { count: '300' })),
  description: z.string().max(2000, t('forms.common.maxChars', { count: '2000' })).optional(),
  clientName: z.string().min(1, t('forms.opportunity.validation.clientRequired')).max(200, t('forms.common.maxChars', { count: '200' })),
  estimatedValue: z.string().optional(),
  probability: z.string().optional(),
  stage: z.enum(['LEAD', 'QUALIFICATION', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST'], {
    required_error: t('forms.opportunity.validation.stageRequired'),
  }),
  projectType: z.enum(['RESIDENTIAL', 'COMMERCIAL', 'INDUSTRIAL', 'INFRASTRUCTURE'], {
    required_error: t('forms.opportunity.validation.projectTypeRequired'),
  }),
  bidDeadline: z.string().optional(),
  location: z.string().max(300, t('forms.common.maxChars', { count: '300' })).optional(),
  notes: z.string().max(2000, t('forms.common.maxChars', { count: '2000' })).optional(),
});

type OpportunityFormData = z.infer<typeof opportunitySchema>;

const stageOptions = [
  { value: 'LEAD', label: t('forms.opportunity.stages.lead') },
  { value: 'QUALIFICATION', label: t('forms.opportunity.stages.qualification') },
  { value: 'PROPOSAL', label: t('forms.opportunity.stages.proposal') },
  { value: 'NEGOTIATION', label: t('forms.opportunity.stages.negotiation') },
  { value: 'WON', label: t('forms.opportunity.stages.won') },
  { value: 'LOST', label: t('forms.opportunity.stages.lost') },
];

const projectTypeOptions = [
  { value: 'RESIDENTIAL', label: t('forms.opportunity.projectTypes.residential') },
  { value: 'COMMERCIAL', label: t('forms.opportunity.projectTypes.commercial') },
  { value: 'INDUSTRIAL', label: t('forms.opportunity.projectTypes.industrial') },
  { value: 'INFRASTRUCTURE', label: t('forms.opportunity.projectTypes.infrastructure') },
];

const OpportunityFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEdit = !!id;

  const { data: existingOpportunity } = useQuery<Opportunity>({
    queryKey: ['opportunity', id],
    queryFn: () => portfolioApi.getOpportunity(id!),
    enabled: isEdit,
  });

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<OpportunityFormData>({
    resolver: zodResolver(opportunitySchema),
    values: existingOpportunity
      ? {
          name: existingOpportunity.name ?? '',
          description: existingOpportunity.description ?? '',
          clientName: existingOpportunity.clientName ?? '',
          estimatedValue: existingOpportunity.value?.toString() ?? '',
          probability: existingOpportunity.probability?.toString() ?? '',
          stage: existingOpportunity.stage as OpportunityStage,
          projectType: 'COMMERCIAL',
          bidDeadline: existingOpportunity.expectedCloseDate ?? '',
          location: '',
          notes: '',
        }
      : undefined,
  });

  const estimatedValueWatch = useWatch({ control, name: 'estimatedValue' });

  const createMutation = useMutation({
    mutationFn: (data: OpportunityFormData) => {
      return portfolioApi.createOpportunity({
        name: data.name,
        description: data.description || undefined,
        clientName: data.clientName,
        estimatedValue: data.estimatedValue ? Number(data.estimatedValue) : 0,
        probability: data.probability ? Number(data.probability) : undefined,
        stage: data.stage,
        expectedCloseDate: data.bidDeadline || new Date().toISOString().slice(0, 10),
        projectType: data.projectType,
        region: data.location || undefined,
      } as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
      toast.success(t('forms.opportunity.createSuccess'));
      navigate('/portfolio/opportunities');
    },
    onError: () => {
      toast.error(t('forms.opportunity.createError'));
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: OpportunityFormData) => {
      return portfolioApi.updateOpportunity(id!, {
        name: data.name,
        description: data.description || undefined,
        clientName: data.clientName,
        estimatedValue: data.estimatedValue ? Number(data.estimatedValue) : undefined,
        probability: data.probability ? Number(data.probability) : undefined,
        stage: data.stage,
        expectedCloseDate: data.bidDeadline || undefined,
        projectType: data.projectType,
        region: data.location || undefined,
      } as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
      queryClient.invalidateQueries({ queryKey: ['opportunity', id] });
      toast.success(t('forms.opportunity.updateSuccess'));
      navigate(`/portfolio/opportunities/${id}`);
    },
    onError: () => {
      toast.error(t('forms.opportunity.updateError'));
    },
  });

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const onSubmit: SubmitHandler<OpportunityFormData> = (data) => {
    if (isEdit) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={isEdit ? t('forms.opportunity.editTitle') : t('forms.opportunity.createTitle')}
        subtitle={isEdit ? existingOpportunity?.name : t('forms.opportunity.createSubtitle')}
        backTo={isEdit ? `/portfolio/opportunities/${id}` : '/portfolio/opportunities'}
        breadcrumbs={[
          { label: t('forms.common.home'), href: '/' },
          { label: t('forms.opportunity.breadcrumbPortfolio'), href: '/portfolio/opportunities' },
          { label: isEdit ? t('forms.common.editing') : t('forms.common.creating') },
        ]}
      />

      <form onSubmit={handleSubmit(onSubmit)} className="max-w-3xl">
        <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-6">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-5">{t('forms.common.basicInfo')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FormField label={t('forms.opportunity.labelName')} error={errors.name?.message} required className="sm:col-span-2">
              <Input
                placeholder={t('forms.opportunity.placeholderName')}
                hasError={!!errors.name}
                {...register('name')}
              />
            </FormField>
            <FormField label={t('forms.opportunity.labelClient')} error={errors.clientName?.message} required>
              <Input
                placeholder={t('forms.opportunity.placeholderClient')}
                hasError={!!errors.clientName}
                {...register('clientName')}
              />
            </FormField>
            <FormField label={t('forms.opportunity.labelLocation')} error={errors.location?.message}>
              <Input
                placeholder={t('forms.opportunity.placeholderLocation')}
                hasError={!!errors.location}
                {...register('location')}
              />
            </FormField>
            <FormField label={t('forms.opportunity.labelStage')} error={errors.stage?.message} required>
              <Select
                options={stageOptions}
                placeholder={t('forms.opportunity.placeholderStage')}
                hasError={!!errors.stage}
                {...register('stage')}
              />
            </FormField>
            <FormField label={t('forms.opportunity.labelProjectType')} error={errors.projectType?.message} required>
              <Select
                options={projectTypeOptions}
                placeholder={t('forms.opportunity.placeholderProjectType')}
                hasError={!!errors.projectType}
                {...register('projectType')}
              />
            </FormField>
          </div>
        </section>

        <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-6">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-5">{t('forms.opportunity.sectionFinancial')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FormField label={t('forms.opportunity.labelEstimatedValue')} error={errors.estimatedValue?.message}>
              <Input
                type="number"
                placeholder="0"
                hasError={!!errors.estimatedValue}
                {...register('estimatedValue')}
              />
              {estimatedValueWatch && Number(estimatedValueWatch) > 0 && (
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                  {formatMoney(Number(estimatedValueWatch))}
                </p>
              )}
            </FormField>
            <FormField label={t('forms.opportunity.labelProbability')} error={errors.probability?.message}>
              <Input
                type="number"
                placeholder="0"
                min="0"
                max="100"
                hasError={!!errors.probability}
                {...register('probability')}
              />
            </FormField>
            <FormField label={t('forms.opportunity.labelBidDeadline')} error={errors.bidDeadline?.message}>
              <Input type="date" hasError={!!errors.bidDeadline} {...register('bidDeadline')} />
            </FormField>
          </div>
        </section>

        <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-6">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-5">{t('forms.opportunity.sectionDetails')}</h2>
          <div className="mt-0">
            <FormField label={t('forms.opportunity.labelDescription')} error={errors.description?.message}>
              <Textarea
                placeholder={t('forms.opportunity.placeholderDescription')}
                rows={4}
                hasError={!!errors.description}
                {...register('description')}
              />
            </FormField>
          </div>
          <div className="mt-5">
            <FormField label={t('forms.opportunity.labelNotes')} error={errors.notes?.message}>
              <Textarea
                placeholder={t('forms.opportunity.placeholderNotes')}
                rows={3}
                hasError={!!errors.notes}
                {...register('notes')}
              />
            </FormField>
          </div>
        </section>

        <div className="flex items-center gap-3">
          <Button type="submit" loading={isSubmitting}>
            {isEdit ? t('forms.common.saveChanges') : t('forms.opportunity.createButton')}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate(isEdit ? `/portfolio/opportunities/${id}` : '/portfolio/opportunities')}
          >
            {t('common.back')}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default OpportunityFormPage;
