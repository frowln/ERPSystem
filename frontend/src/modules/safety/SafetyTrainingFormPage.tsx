import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { FormField, Input, Textarea, Select } from '@/design-system/components/FormField';
import { safetyApi, type SafetyTraining, type TrainingType } from '@/api/safety';
import { t } from '@/i18n';
import { useFormDraft } from '@/hooks/useFormDraft';
import { useProjectOptions, useEmployeeOptions } from '@/hooks/useSelectOptions';

const trainingSchema = z.object({
  title: z.string().min(1, t('safety.training.form.validationTitleRequired')).max(500),
  trainingType: z.enum(['INITIAL', 'PRIMARY', 'PERIODIC', 'UNSCHEDULED', 'SPECIAL'], {
    required_error: t('safety.training.form.validationTypeRequired'),
  }),
  projectId: z.string().optional(),
  date: z.string().min(1, t('safety.training.form.validationDateRequired')),
  instructorId: z.string().optional(),
  instructorName: z.string().max(300).optional(),
  participants: z.string().max(5000).optional(),
  topics: z.string().max(2000).optional(),
  duration: z.coerce.number().min(0).max(9999).optional(),
  notes: z.string().max(2000).optional(),
});

type TrainingFormData = z.infer<typeof trainingSchema>;

const getTrainingTypeOptions = () => [
  { value: 'INITIAL', label: t('safety.training.typeInitial') },
  { value: 'PRIMARY', label: t('safety.training.typePrimary') },
  { value: 'PERIODIC', label: t('safety.training.typePeriodic') },
  { value: 'UNSCHEDULED', label: t('safety.training.typeUnscheduled') },
  { value: 'SPECIAL', label: t('safety.training.typeSpecial') },
];

const SafetyTrainingFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEdit = !!id;
  const draftKey = isEdit ? `safety-training-edit-${id}` : 'safety-training-new';

  const defaultFormValues: TrainingFormData = {
    title: '',
    trainingType: 'INITIAL',
    projectId: '',
    date: '',
    instructorId: '',
    instructorName: '',
    participants: '',
    topics: '',
    duration: undefined,
    notes: '',
  };

  const { draft, saveDraft, clearDraft, draftAge } = useFormDraft<TrainingFormData>(draftKey, defaultFormValues);
  const { options: projectOptions } = useProjectOptions();
  const { options: instructorOptions } = useEmployeeOptions('ACTIVE');

  const { data: existing } = useQuery<SafetyTraining>({
    queryKey: ['safety-training', id],
    queryFn: () => safetyApi.getTraining(id!),
    enabled: isEdit,
  });

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<TrainingFormData>({
    resolver: zodResolver(trainingSchema),
    defaultValues: existing
      ? {
          title: existing.title,
          trainingType: existing.trainingType as TrainingType,
          projectId: existing.projectId ?? '',
          date: existing.date,
          instructorId: existing.instructorId ?? '',
          instructorName: existing.instructorName ?? '',
          participants: existing.participants ?? '',
          topics: existing.topics ?? '',
          duration: existing.duration ?? undefined,
          notes: existing.notes ?? '',
        }
      : (draft ?? defaultFormValues),
  });

  useEffect(() => {
    if (!isEdit && draft) {
      toast(t('forms.draftRestored'), { icon: '📝' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formValues = watch();
  useEffect(() => {
    if (!isEdit) saveDraft(formValues);
  }, [formValues, isEdit, saveDraft]);

  const createMutation = useMutation({
    mutationFn: (data: TrainingFormData) =>
      safetyApi.createTraining({
        title: data.title,
        trainingType: data.trainingType as TrainingType,
        projectId: data.projectId || undefined,
        date: data.date,
        instructorId: data.instructorId || undefined,
        instructorName: data.instructorName || undefined,
        participants: data.participants || undefined,
        topics: data.topics || undefined,
        duration: data.duration || undefined,
        notes: data.notes || undefined,
      }),
    onSuccess: () => {
      clearDraft();
      queryClient.invalidateQueries({ queryKey: ['safety-trainings'] });
      toast.success(t('safety.training.form.toastCreated'));
      navigate('/safety/trainings');
    },
    onError: () => toast.error(t('safety.training.form.toastCreateError')),
  });

  const updateMutation = useMutation({
    mutationFn: (data: TrainingFormData) =>
      safetyApi.updateTraining(id!, {
        title: data.title,
        trainingType: data.trainingType as TrainingType,
        projectId: data.projectId || undefined,
        date: data.date,
        instructorId: data.instructorId || undefined,
        instructorName: data.instructorName || undefined,
        participants: data.participants || undefined,
        topics: data.topics || undefined,
        duration: data.duration || undefined,
        notes: data.notes || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['safety-trainings'] });
      queryClient.invalidateQueries({ queryKey: ['safety-training', id] });
      toast.success(t('safety.training.form.toastUpdated'));
      navigate(`/safety/trainings/${id}`);
    },
    onError: () => toast.error(t('safety.training.form.toastUpdateError')),
  });

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const onSubmit: SubmitHandler<TrainingFormData> = (data) => {
    if (isEdit) updateMutation.mutate(data);
    else createMutation.mutate(data);
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={isEdit ? t('safety.training.form.editTitle') : t('safety.training.form.createTitle')}
        subtitle={isEdit ? existing?.title ?? '' : t('safety.training.form.createSubtitle')}
        backTo={isEdit ? `/safety/trainings/${id}` : '/safety/trainings'}
        breadcrumbs={[
          { label: t('common.home'), href: '/' },
          { label: t('safety.title'), href: '/safety' },
          { label: t('safety.training.breadcrumbTrainings'), href: '/safety/trainings' },
          { label: isEdit ? t('forms.common.editing') : t('forms.common.creating') },
        ]}
      />

      <form onSubmit={handleSubmit(onSubmit)} className="max-w-3xl">
        <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-6">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-5">
            {t('forms.common.basicInfo')}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FormField label={t('safety.training.form.labelTitle')} error={errors.title?.message} required className="sm:col-span-2">
              <Input
                placeholder={t('safety.training.form.placeholderTitle')}
                hasError={!!errors.title}
                {...register('title')}
              />
            </FormField>
            <FormField label={t('safety.training.form.labelType')} error={errors.trainingType?.message} required>
              <Select
                options={getTrainingTypeOptions()}
                placeholder={t('safety.training.form.placeholderType')}
                hasError={!!errors.trainingType}
                {...register('trainingType')}
              />
            </FormField>
            <FormField label={t('safety.training.form.labelDate')} error={errors.date?.message} required>
              <Input type="date" hasError={!!errors.date} {...register('date')} />
            </FormField>
            <FormField label={t('safety.training.form.labelProject')} error={errors.projectId?.message}>
              <Select
                options={[{ value: '', label: t('safety.training.form.placeholderProject') }, ...projectOptions]}
                hasError={!!errors.projectId}
                {...register('projectId')}
              />
            </FormField>
            <FormField label={t('safety.training.form.labelDuration')} error={errors.duration?.message}>
              <Input
                type="number"
                placeholder={t('safety.training.form.placeholderDuration')}
                hasError={!!errors.duration}
                {...register('duration')}
              />
            </FormField>
          </div>
        </section>

        <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-6">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-5">
            {t('safety.training.form.sectionInstructor')}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FormField label={t('safety.training.form.labelInstructor')} error={errors.instructorId?.message}>
              <Select
                options={[{ value: '', label: t('safety.training.form.placeholderInstructor') }, ...instructorOptions]}
                hasError={!!errors.instructorId}
                {...register('instructorId')}
              />
            </FormField>
            <FormField label={t('safety.training.form.labelInstructorName')} error={errors.instructorName?.message}>
              <Input
                placeholder={t('safety.training.form.placeholderInstructorName')}
                hasError={!!errors.instructorName}
                {...register('instructorName')}
              />
            </FormField>
          </div>
        </section>

        <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-6">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-5">
            {t('safety.training.form.sectionContent')}
          </h2>
          <div className="space-y-5">
            <FormField label={t('safety.training.form.labelTopics')} error={errors.topics?.message}>
              <Textarea
                placeholder={t('safety.training.form.placeholderTopics')}
                rows={3}
                hasError={!!errors.topics}
                {...register('topics')}
              />
            </FormField>
            <FormField label={t('safety.training.form.labelParticipants')} error={errors.participants?.message}>
              <Textarea
                placeholder={t('safety.training.form.placeholderParticipants')}
                rows={4}
                hasError={!!errors.participants}
                {...register('participants')}
              />
            </FormField>
            <FormField label={t('common.notes')} error={errors.notes?.message}>
              <Textarea
                placeholder={t('safety.training.form.placeholderNotes')}
                rows={3}
                hasError={!!errors.notes}
                {...register('notes')}
              />
            </FormField>
          </div>
        </section>

        <div className="flex items-center gap-3">
          <Button type="submit" loading={isSubmitting}>
            {isEdit ? t('forms.common.saveChanges') : t('safety.training.form.btnCreate')}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate(isEdit ? `/safety/trainings/${id}` : '/safety/trainings')}
          >
            {t('common.back')}
          </Button>
          {!isEdit && draft && (
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                clearDraft();
                window.location.reload();
              }}
              className="ml-auto text-xs text-neutral-500"
            >
              {t('forms.clearDraft')}
              {draftAge && <span className="ml-1 opacity-60">({t('forms.draftSavedAt', { age: draftAge })})</span>}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
};

export default SafetyTrainingFormPage;
