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
import { qualityApi } from '@/api/quality';
import { t } from '@/i18n';

const inspectionSchema = z.object({
  title: z.string().min(1, t('forms.qualityInspection.validation.titleRequired')).max(300, t('forms.common.maxChars', { count: '300' })),
  description: z.string().max(2000, t('forms.common.maxChars', { count: '2000' })).optional(),
  inspectionType: z.enum(['visual', 'measurement', 'test', 'AUDIT'], {
    required_error: t('forms.qualityInspection.validation.typeRequired'),
  }),
  projectId: z.string().min(1, t('forms.qualityInspection.validation.projectRequired')),
  location: z.string().max(300, t('forms.common.maxChars', { count: '300' })).optional(),
  scheduledDate: z.string().optional(),
  inspectorId: z.string().optional(),
  status: z.enum(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'FAILED'], {
    required_error: t('forms.qualityInspection.validation.statusRequired'),
  }),
  checklistItems: z.string().max(2000, t('forms.common.maxChars', { count: '2000' })).optional(),
  notes: z.string().max(2000, t('forms.common.maxChars', { count: '2000' })).optional(),
});

type InspectionFormData = z.input<typeof inspectionSchema>;

const inspectionTypeOptions = [
  { value: 'visual', label: t('forms.qualityInspection.inspectionTypes.visual') },
  { value: 'measurement', label: t('forms.qualityInspection.inspectionTypes.measurement') },
  { value: 'test', label: t('forms.qualityInspection.inspectionTypes.test') },
  { value: 'AUDIT', label: t('forms.qualityInspection.inspectionTypes.audit') },
];

const statusOptions = [
  { value: 'SCHEDULED', label: t('forms.qualityInspection.statuses.scheduled') },
  { value: 'IN_PROGRESS', label: t('forms.qualityInspection.statuses.inProgress') },
  { value: 'COMPLETED', label: t('forms.qualityInspection.statuses.completed') },
  { value: 'FAILED', label: t('forms.qualityInspection.statuses.failed') },
];

const getProjectOptions = () => [
  { value: '1', label: t('mockData.projectSolnechny') },
  { value: '2', label: t('mockData.projectHorizon') },
  { value: '3', label: t('mockData.projectBridge') },
  { value: '6', label: t('mockData.projectCentral') },
];

const getInspectorOptions = () => [
  { value: '', label: t('forms.qualityInspection.inspectorNotAssigned') },
  { value: 'u1', label: t('mockData.personIvanovII') },
  { value: 'u2', label: t('mockData.personPetrovPP') },
  { value: 'u3', label: t('mockData.personSidorovSS') },
  { value: 'u4', label: t('mockData.personKozlovKK') },
];

const InspectionFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEdit = !!id;

  const { data: existingInspection } = useQuery({
    queryKey: ['qualityCheck', id],
    queryFn: () => qualityApi.getCheck(id!),
    enabled: isEdit,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<InspectionFormData>({
    resolver: zodResolver(inspectionSchema),
    defaultValues: existingInspection
      ? {
          title: existingInspection.name ?? '',
          description: existingInspection.description ?? '',
          inspectionType: (existingInspection.type as any) ?? ('' as any),
          projectId: existingInspection.projectId,
          location: '',
          scheduledDate: existingInspection.scheduledDate ?? '',
          inspectorId: '',
          status: (existingInspection.status as any) ?? ('' as any),
          checklistItems: '',
          notes: '',
        }
      : {
          title: '',
          description: '',
          inspectionType: '' as any,
          projectId: '',
          location: '',
          scheduledDate: '',
          inspectorId: '',
          status: '' as any,
          checklistItems: '',
          notes: '',
        },
  });

  const createMutation = useMutation({
    mutationFn: (data: InspectionFormData) => {
      return qualityApi.createCheck({
        name: data.title,
        description: data.description || undefined,
        type: data.inspectionType as any,
        projectId: data.projectId,
        scheduledDate: data.scheduledDate || undefined,
        status: data.status as any,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qualityChecks'] });
      toast.success(t('forms.qualityInspection.createSuccess'));
      navigate('/quality');
    },
    onError: () => {
      toast.error(t('forms.qualityInspection.createError'));
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: InspectionFormData) => {
      return qualityApi.updateCheck(id!, {
        name: data.title,
        description: data.description || undefined,
        type: data.inspectionType as any,
        projectId: data.projectId,
        scheduledDate: data.scheduledDate || undefined,
        status: data.status as any,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qualityChecks'] });
      queryClient.invalidateQueries({ queryKey: ['qualityCheck', id] });
      toast.success(t('forms.qualityInspection.updateSuccess'));
      navigate(`/quality/${id}`);
    },
    onError: () => {
      toast.error(t('forms.qualityInspection.updateError'));
    },
  });

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const onSubmit = (data: InspectionFormData) => {
    if (isEdit) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={isEdit ? t('forms.qualityInspection.editTitle') : t('forms.qualityInspection.createTitle')}
        subtitle={isEdit ? existingInspection?.name : t('forms.qualityInspection.createSubtitle')}
        backTo={isEdit ? `/quality/${id}` : '/quality'}
        breadcrumbs={[
          { label: t('forms.common.home'), href: '/' },
          { label: t('forms.qualityInspection.breadcrumbQuality'), href: '/quality' },
          { label: isEdit ? t('forms.common.editing') : t('forms.common.creating') },
        ]}
      />

      <form onSubmit={handleSubmit(onSubmit)} className="max-w-3xl">
        <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-6">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-5">{t('forms.common.basicInfo')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FormField label={t('forms.qualityInspection.labelTitle')} error={errors.title?.message} required className="sm:col-span-2">
              <Input
                placeholder={t('forms.qualityInspection.placeholderTitle')}
                hasError={!!errors.title}
                {...register('title')}
              />
            </FormField>
            <FormField label={t('forms.qualityInspection.labelInspectionType')} error={errors.inspectionType?.message} required>
              <Select
                options={inspectionTypeOptions}
                placeholder={t('forms.qualityInspection.placeholderType')}
                hasError={!!errors.inspectionType}
                {...register('inspectionType')}
              />
            </FormField>
            <FormField label={t('forms.qualityInspection.labelStatus')} error={errors.status?.message} required>
              <Select
                options={statusOptions}
                placeholder={t('forms.qualityInspection.placeholderStatus')}
                hasError={!!errors.status}
                {...register('status')}
              />
            </FormField>
            <FormField label={t('forms.qualityInspection.labelProject')} error={errors.projectId?.message} required>
              <Select
                options={getProjectOptions()}
                placeholder={t('forms.qualityInspection.placeholderProject')}
                hasError={!!errors.projectId}
                {...register('projectId')}
              />
            </FormField>
            <FormField label={t('forms.qualityInspection.labelInspector')} error={errors.inspectorId?.message}>
              <Select
                options={getInspectorOptions()}
                placeholder={t('forms.qualityInspection.placeholderInspector')}
                hasError={!!errors.inspectorId}
                {...register('inspectorId')}
              />
            </FormField>
          </div>
        </section>

        <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-6">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-5">{t('forms.qualityInspection.sectionDetails')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FormField label={t('forms.qualityInspection.labelLocation')} error={errors.location?.message}>
              <Input
                placeholder={t('forms.qualityInspection.placeholderLocation')}
                hasError={!!errors.location}
                {...register('location')}
              />
            </FormField>
            <FormField label={t('forms.qualityInspection.labelScheduledDate')} error={errors.scheduledDate?.message}>
              <Input type="date" hasError={!!errors.scheduledDate} {...register('scheduledDate')} />
            </FormField>
          </div>
          <div className="mt-5">
            <FormField label={t('common.description')} error={errors.description?.message}>
              <Textarea
                placeholder={t('forms.qualityInspection.placeholderDescription')}
                rows={4}
                hasError={!!errors.description}
                {...register('description')}
              />
            </FormField>
          </div>
          <div className="mt-5">
            <FormField label={t('forms.qualityInspection.labelChecklist')} error={errors.checklistItems?.message}>
              <Textarea
                placeholder={t('forms.qualityInspection.placeholderChecklist')}
                rows={4}
                hasError={!!errors.checklistItems}
                {...register('checklistItems')}
              />
            </FormField>
          </div>
          <div className="mt-5">
            <FormField label={t('common.notes')} error={errors.notes?.message}>
              <Textarea
                placeholder={t('forms.qualityInspection.placeholderNotes')}
                rows={3}
                hasError={!!errors.notes}
                {...register('notes')}
              />
            </FormField>
          </div>
        </section>

        <div className="flex items-center gap-3">
          <Button type="submit" loading={isSubmitting}>
            {isEdit ? t('forms.common.saveChanges') : t('forms.qualityInspection.createButton')}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate(isEdit ? `/quality/${id}` : '/quality')}
          >
            {t('common.back')}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default InspectionFormPage;
