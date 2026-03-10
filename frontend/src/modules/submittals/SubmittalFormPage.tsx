import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { FormField, Input, Textarea, Select } from '@/design-system/components/FormField';
import { submittalsApi } from '@/api/submittals';
import { projectsApi } from '@/api/projects';
import { permissionsApi } from '@/api/permissions';
import { t } from '@/i18n';
import type { Submittal, SubmittalType } from './types';

const submittalSchema = z.object({
  title: z.string().min(1, t('forms.submittal.validation.titleRequired')).max(300, t('forms.common.maxChars', { count: '300' })),
  description: z.string().max(2000, t('forms.common.maxChars', { count: '2000' })).optional(),
  specSection: z.string().max(100, t('forms.common.maxChars', { count: '100' })).optional(),
  projectId: z.string().min(1, t('forms.submittal.validation.projectRequired')),
  submittedById: z.string().optional(),
  reviewerId: z.string().optional(),
  dueDate: z.string().optional(),
  submittalType: z.enum(['SHOP_DRAWING', 'PRODUCT_DATA', 'SAMPLE', 'MOCK_UP', 'TEST_REPORT', 'CERTIFICATE', 'CALCULATION', 'DESIGN_MIX', 'OTHER'], {
    required_error: t('forms.submittal.validation.typeRequired'),
  }),
  notes: z.string().max(2000, t('forms.common.maxChars', { count: '2000' })).optional(),
});

type SubmittalFormData = z.infer<typeof submittalSchema>;

const buildDescription = (description?: string, notes?: string): string | undefined => {
  const base = description?.trim() ?? '';
  const extra = notes?.trim() ?? '';
  if (!base && !extra) return undefined;
  if (!extra) return base;
  return `${base}${base ? '\n\n' : ''}${t('forms.submittal.notesPrefix')} ${extra}`;
};

const getTypeOptions = () => [
  { value: 'SHOP_DRAWING', label: t('forms.submittal.types.shopDrawing') },
  { value: 'PRODUCT_DATA', label: t('forms.submittal.types.productData') },
  { value: 'SAMPLE', label: t('forms.submittal.types.sample') },
  { value: 'MOCK_UP', label: t('forms.submittal.types.mockUp') },
  { value: 'TEST_REPORT', label: t('forms.submittal.types.testReport') },
  { value: 'CERTIFICATE', label: t('forms.submittal.types.certificate') },
  { value: 'CALCULATION', label: t('forms.submittal.types.calculation') },
  { value: 'DESIGN_MIX', label: t('forms.submittal.types.designMix') },
  { value: 'OTHER', label: t('forms.submittal.types.other') },
];

const SubmittalFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEdit = !!id;

  const { data: projectsData } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectsApi.getProjects(),
  });
  const projectOptions = (projectsData?.content ?? []).map(p => ({ value: p.id, label: p.name }));

  const { data: usersData } = useQuery({
    queryKey: ['users'],
    queryFn: () => permissionsApi.getUsers(),
  });
  const userOptions = [
    { value: '', label: t('forms.submittal.unassigned') },
    ...(usersData?.content ?? []).map(u => ({ value: u.id, label: u.fullName ?? u.email })),
  ];

  const { data: existingSubmittal } = useQuery<Submittal>({
    queryKey: ['submittal', id],
    queryFn: () => submittalsApi.getSubmittal(id!),
    enabled: isEdit,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SubmittalFormData>({
    resolver: zodResolver(submittalSchema),
    defaultValues: existingSubmittal
      ? {
          title: existingSubmittal.title ?? '',
          description: existingSubmittal.description ?? '',
          specSection: existingSubmittal.specSection ?? '',
          projectId: existingSubmittal.projectId,
          submittedById: existingSubmittal.submittedById ?? '',
          reviewerId: existingSubmittal.reviewedById ?? '',
          dueDate: existingSubmittal.dueDate ?? '',
          submittalType: existingSubmittal.submittalType,
          notes: '',
        }
      : {
          title: '',
          description: '',
          specSection: '',
          projectId: '',
          submittedById: '',
          reviewerId: '',
          dueDate: '',
          submittalType: 'SHOP_DRAWING',
          notes: '',
        },
  });

  const createMutation = useMutation({
    mutationFn: (data: SubmittalFormData) => {
      return submittalsApi.createSubmittal({
        title: data.title,
        description: buildDescription(data.description, data.notes),
        submittalType: data.submittalType as SubmittalType,
        specSection: data.specSection || undefined,
        projectId: data.projectId,
        submittedById: data.submittedById || undefined,
        dueDate: data.dueDate || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['submittals'] });
      toast.success(t('forms.submittal.createSuccess'));
      navigate('/pm/submittals');
    },
    onError: () => {
      toast.error(t('forms.submittal.createError'));
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: SubmittalFormData) => {
      return submittalsApi.updateSubmittal(id!, {
        title: data.title,
        description: buildDescription(data.description, data.notes),
        submittalType: data.submittalType as SubmittalType,
        specSection: data.specSection || undefined,
        projectId: data.projectId,
        submittedById: data.submittedById || undefined,
        dueDate: data.dueDate || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['submittals'] });
      queryClient.invalidateQueries({ queryKey: ['submittal', id] });
      toast.success(t('forms.submittal.updateSuccess'));
      navigate(`/pm/submittals/${id}`);
    },
    onError: () => {
      toast.error(t('forms.submittal.updateError'));
    },
  });

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const onSubmit: SubmitHandler<SubmittalFormData> = (data) => {
    if (isEdit) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={isEdit ? t('forms.submittal.editTitle') : t('forms.submittal.createTitle')}
        subtitle={isEdit ? existingSubmittal?.title : t('forms.submittal.createSubtitle')}
        backTo={isEdit ? `/pm/submittals/${id}` : '/pm/submittals'}
        breadcrumbs={[
          { label: t('forms.common.home'), href: '/' },
          { label: t('forms.submittal.breadcrumbSubmittals'), href: '/pm/submittals' },
          { label: isEdit ? t('forms.common.editing') : t('forms.common.creating') },
        ]}
      />

      <form onSubmit={handleSubmit(onSubmit)} className="max-w-3xl">
        {/* Section: Basic info */}
        <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-6">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-5">{t('forms.common.basicInfo')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FormField label={t('forms.submittal.labelTitle')} error={errors.title?.message} required className="sm:col-span-2">
              <Input
                placeholder={t('forms.submittal.placeholderTitle')}
                hasError={!!errors.title}
                {...register('title')}
              />
            </FormField>
            <FormField label={t('forms.submittal.labelSpecSection')} error={errors.specSection?.message}>
              <Input
                placeholder={t('forms.submittal.placeholderSpecSection')}
                hasError={!!errors.specSection}
                {...register('specSection')}
              />
            </FormField>
            <FormField label={t('forms.submittal.labelType')} error={errors.submittalType?.message} required>
              <Select
                options={getTypeOptions()}
                hasError={!!errors.submittalType}
                {...register('submittalType')}
              />
            </FormField>
            <FormField label={t('forms.submittal.labelProject')} error={errors.projectId?.message} required>
              <Select
                options={projectOptions}
                hasError={!!errors.projectId}
                {...register('projectId')}
              />
            </FormField>
            <FormField label={t('forms.submittal.labelDueDate')} error={errors.dueDate?.message}>
              <Input type="date" hasError={!!errors.dueDate} {...register('dueDate')} />
            </FormField>
          </div>
        </section>

        {/* Section: Participants */}
        <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-6">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-5">{t('forms.submittal.sectionParticipants')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FormField label={t('forms.submittal.labelSubmittedBy')} error={errors.submittedById?.message}>
              <Select
                options={userOptions}
                placeholder={t('forms.submittal.placeholderSubmittedBy')}
                hasError={!!errors.submittedById}
                {...register('submittedById')}
              />
            </FormField>
            <FormField label={t('forms.submittal.labelReviewer')} error={errors.reviewerId?.message}>
              <Select
                options={userOptions}
                placeholder={t('forms.submittal.placeholderReviewer')}
                hasError={!!errors.reviewerId}
                {...register('reviewerId')}
              />
            </FormField>
          </div>
        </section>

        {/* Section: Details */}
        <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-6">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-5">{t('forms.submittal.sectionDetails')}</h2>
          <div className="mt-0">
            <FormField label={t('common.description')} error={errors.description?.message}>
              <Textarea
                placeholder={t('forms.submittal.placeholderDescription')}
                rows={4}
                hasError={!!errors.description}
                {...register('description')}
              />
            </FormField>
          </div>
          <div className="mt-5">
            <FormField label={t('common.notes')} error={errors.notes?.message}>
              <Textarea
                placeholder={t('forms.submittal.placeholderNotes')}
                rows={3}
                hasError={!!errors.notes}
                {...register('notes')}
              />
            </FormField>
          </div>
        </section>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Button type="submit" loading={isSubmitting}>
            {isEdit ? t('forms.common.saveChanges') : t('forms.submittal.createButton')}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate(isEdit ? `/pm/submittals/${id}` : '/pm/submittals')}
          >
            {t('common.back')}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default SubmittalFormPage;
