import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { FormField, Input, Textarea, Select } from '@/design-system/components/FormField';
import { taxRiskApi } from './api';
import { t } from '@/i18n';

const schema = z.object({
  name: z.string().min(1, t('forms.taxRisk.validation.nameRequired')).max(300),
  description: z.string().max(2000).optional(),
  projectId: z.string().optional(),
  assessmentDate: z.string().min(1, t('forms.taxRisk.validation.assessmentDateRequired')),
  riskLevel: z.string().min(1, t('forms.taxRisk.validation.riskLevelRequired')),
  overallScore: z.string().transform((v) => Number(v) || 0)
    .refine((v) => v >= 0 && v <= 100, t('forms.taxRisk.validation.scoreRange')),
});

type FormData = z.input<typeof schema>;

const riskOptions = [
  { value: 'LOW', label: t('forms.taxRisk.riskLevels.low') },
  { value: 'MEDIUM', label: t('forms.taxRisk.riskLevels.medium') },
  { value: 'HIGH', label: t('forms.taxRisk.riskLevels.high') },
  { value: 'CRITICAL', label: t('forms.taxRisk.riskLevels.critical') },
];

const getProjectOptions = () => [
  { value: '', label: t('forms.taxRisk.noProject') },
  { value: '1', label: t('forms.taxRisk.projectSunny') },
  { value: '2', label: t('forms.taxRisk.projectHorizon') },
  { value: '3', label: t('forms.taxRisk.projectBridge') },
  { value: '6', label: t('forms.taxRisk.projectCentral') },
];

const TaxRiskFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEdit = !!id;

  const { data: existing } = useQuery({
    queryKey: ['tax-risk', id],
    queryFn: () => taxRiskApi.getById(id!),
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
          name: existing.name,
          description: existing.description ?? '',
          projectId: existing.projectId ?? '',
          assessmentDate: existing.assessmentDate,
          riskLevel: existing.riskLevel,
          overallScore: String(existing.overallScore),
        }
      : {
          name: '',
          description: '',
          projectId: '',
          assessmentDate: new Date().toISOString().split('T')[0],
          riskLevel: '',
          overallScore: '0',
        },
  });

  const createMutation = useMutation({
    mutationFn: (data: FormData) => taxRiskApi.create(data as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tax-risks'] });
      toast.success(t('forms.taxRisk.createSuccess'));
      navigate('/tax-risk');
    },
    onError: () => toast.error(t('forms.taxRisk.createError')),
  });

  const updateMutation = useMutation({
    mutationFn: (data: FormData) => taxRiskApi.update(id!, data as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tax-risks'] });
      queryClient.invalidateQueries({ queryKey: ['tax-risk', id] });
      toast.success(t('forms.taxRisk.updateSuccess'));
      navigate(`/tax-risk/${id}`);
    },
    onError: () => toast.error(t('forms.taxRisk.updateError')),
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
        title={isEdit ? t('forms.taxRisk.editTitle') : t('forms.taxRisk.createTitle')}
        subtitle={isEdit ? existing?.name : t('forms.taxRisk.createSubtitle')}
        backTo={isEdit ? `/tax-risk/${id}` : '/tax-risk'}
        breadcrumbs={[
          { label: t('forms.common.home'), href: '/' },
          { label: t('forms.taxRisk.breadcrumbTaxRisk'), href: '/tax-risk' },
          { label: isEdit ? t('forms.common.editing') : t('forms.common.creating') },
        ]}
      />

      <form onSubmit={handleSubmit(onSubmit)} className="max-w-3xl">
        <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-6">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-5">{t('forms.common.basicInfo')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FormField label={t('forms.taxRisk.labelName')} error={errors.name?.message} required className="sm:col-span-2">
              <Input placeholder={t('forms.taxRisk.placeholderName')} hasError={!!errors.name} {...register('name')} />
            </FormField>
            <FormField label={t('forms.taxRisk.labelProject')} error={errors.projectId?.message}>
              <Select options={getProjectOptions()} hasError={!!errors.projectId} {...register('projectId')} />
            </FormField>
            <FormField label={t('forms.taxRisk.labelAssessmentDate')} error={errors.assessmentDate?.message} required>
              <Input type="date" hasError={!!errors.assessmentDate} {...register('assessmentDate')} />
            </FormField>
            <FormField label={t('forms.taxRisk.labelRiskLevel')} error={errors.riskLevel?.message} required>
              <Select options={riskOptions} placeholder={t('forms.taxRisk.placeholderRiskLevel')} hasError={!!errors.riskLevel} {...register('riskLevel')} />
            </FormField>
            <FormField label={t('forms.taxRisk.labelOverallScore')} error={errors.overallScore?.message}>
              <Input type="text" inputMode="numeric" placeholder="0" hasError={!!errors.overallScore} {...register('overallScore')} />
            </FormField>
          </div>
        </section>

        <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-8">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-5">{t('forms.taxRisk.sectionDescription')}</h2>
          <FormField label={t('forms.taxRisk.labelDescription')} error={errors.description?.message}>
            <Textarea
              placeholder={t('forms.taxRisk.placeholderDescription')}
              rows={5}
              hasError={!!errors.description}
              {...register('description')}
            />
          </FormField>
        </section>

        <div className="flex items-center gap-3">
          <Button type="submit" loading={isSubmitting}>
            {isEdit ? t('forms.common.saveChanges') : t('forms.taxRisk.createButton')}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate(isEdit ? `/tax-risk/${id}` : '/tax-risk')}
          >
            {t('common.cancel')}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default TaxRiskFormPage;
