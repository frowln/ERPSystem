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
import { safetyApi } from '@/api/safety';
import { t } from '@/i18n';
import type { SafetyIncident, IncidentType, IncidentSeverity } from './types';

const incidentSchema = z.object({
  title: z.string().min(1, t('forms.safetyIncident.validation.titleRequired')).max(300, t('forms.common.maxChars', { count: '300' })),
  description: z.string().min(1, t('forms.safetyIncident.validation.descriptionRequired')).max(2000, t('forms.common.maxChars', { count: '2000' })),
  incidentType: z.enum(['FALL', 'STRUCK_BY', 'CAUGHT_IN', 'ELECTROCUTION', 'COLLAPSE', 'FIRE', 'CHEMICAL', 'EQUIPMENT', 'OTHER'], {
    required_error: t('forms.safetyIncident.validation.typeRequired'),
  }),
  severity: z.enum(['MINOR', 'MODERATE', 'SERIOUS', 'CRITICAL', 'FATAL'], {
    required_error: t('forms.safetyIncident.validation.severityRequired'),
  }),
  projectId: z.string().min(1, t('forms.safetyIncident.validation.projectRequired')),
  location: z.string().max(300, t('forms.common.maxChars', { count: '300' })).optional(),
  incidentDate: z.string().min(1, t('forms.safetyIncident.validation.dateRequired')),
  reportedById: z.string().optional(),
  involvedPersonnel: z.string().max(1000, t('forms.common.maxChars', { count: '1000' })).optional(),
  correctiveActions: z.string().max(2000, t('forms.common.maxChars', { count: '2000' })).optional(),
});

type IncidentFormData = z.infer<typeof incidentSchema>;

const incidentTypeOptions = [
  { value: 'FALL', label: t('forms.safetyIncident.incidentTypes.fall') },
  { value: 'STRUCK_BY', label: t('forms.safetyIncident.incidentTypes.struckBy') },
  { value: 'CAUGHT_IN', label: t('forms.safetyIncident.incidentTypes.caughtIn') },
  { value: 'ELECTROCUTION', label: t('forms.safetyIncident.incidentTypes.electrocution') },
  { value: 'COLLAPSE', label: t('forms.safetyIncident.incidentTypes.collapse') },
  { value: 'FIRE', label: t('forms.safetyIncident.incidentTypes.fire') },
  { value: 'CHEMICAL', label: t('forms.safetyIncident.incidentTypes.chemical') },
  { value: 'EQUIPMENT', label: t('forms.safetyIncident.incidentTypes.equipment') },
  { value: 'OTHER', label: t('forms.safetyIncident.incidentTypes.other') },
];

const severityOptions = [
  { value: 'MINOR', label: t('forms.safetyIncident.severityLevels.minor') },
  { value: 'MODERATE', label: t('forms.safetyIncident.severityLevels.moderate') },
  { value: 'SERIOUS', label: t('forms.safetyIncident.severityLevels.serious') },
  { value: 'CRITICAL', label: t('forms.safetyIncident.severityLevels.critical') },
  { value: 'FATAL', label: t('forms.safetyIncident.severityLevels.fatal') },
];

const getProjectOptions = () => [
  { value: '1', label: t('mockData.projectSolnechny') },
  { value: '2', label: t('mockData.projectHorizon') },
  { value: '3', label: t('mockData.projectBridge') },
  { value: '6', label: t('mockData.projectCentral') },
];

const getReporterOptions = () => [
  { value: '', label: t('forms.safetyIncident.reporterNotSpecified') },
  { value: 'u1', label: t('mockData.personIvanovII') },
  { value: 'u2', label: t('mockData.personPetrovPP') },
  { value: 'u3', label: t('mockData.personSidorovSS') },
  { value: 'u4', label: t('mockData.personKozlovKK') },
];


const SafetyIncidentFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEdit = !!id;

  const { data: existingIncident } = useQuery<SafetyIncident>({
    queryKey: ['safetyIncident', id],
    queryFn: () => safetyApi.getIncident(id!),
    enabled: isEdit,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<IncidentFormData>({
    resolver: zodResolver(incidentSchema),
    defaultValues: existingIncident != null
      ? {
          title: `${t('forms.safetyIncident.editSubtitlePrefix')} ${existingIncident.number}`,
          description: existingIncident.description ?? '',
          incidentType: existingIncident.incidentType as IncidentType,
          severity: existingIncident.severity as IncidentSeverity,
          projectId: existingIncident.projectId,
          location: existingIncident.location ?? '',
          incidentDate: existingIncident.incidentDate ?? '',
          reportedById: existingIncident.reportedById ?? '',
          involvedPersonnel: '',
          correctiveActions: existingIncident.correctiveActions ?? '',
        }
      : {
          title: '',
          description: '',
          incidentType: 'OTHER',
          severity: 'MODERATE',
          projectId: '',
          location: '',
          incidentDate: '',
          reportedById: '',
          involvedPersonnel: '',
          correctiveActions: '',
        },
  });

  const createMutation = useMutation({
    mutationFn: (data: IncidentFormData) => {
      return safetyApi.createIncident({
        description: data.description,
        incidentType: data.incidentType,
        severity: data.severity,
        projectId: data.projectId,
        location: data.location?.trim() || t('forms.safetyIncident.locationNotSpecified'),
        incidentDate: data.incidentDate,
        injuredPersons: 0,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['safetyIncidents'] });
      toast.success(t('forms.safetyIncident.createSuccess'));
      navigate('/safety');
    },
    onError: () => {
      toast.error(t('forms.safetyIncident.createError'));
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: IncidentFormData) => {
      return safetyApi.updateIncident(id!, {
        description: data.description,
        incidentType: data.incidentType,
        severity: data.severity,
        projectId: data.projectId,
        location: data.location?.trim() || t('forms.safetyIncident.locationNotSpecified'),
        incidentDate: data.incidentDate,
        reportedById: data.reportedById || undefined,
        correctiveActions: data.correctiveActions || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['safetyIncidents'] });
      queryClient.invalidateQueries({ queryKey: ['safetyIncident', id] });
      toast.success(t('forms.safetyIncident.updateSuccess'));
      navigate(`/safety/${id}`);
    },
    onError: () => {
      toast.error(t('forms.safetyIncident.updateError'));
    },
  });

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const onSubmit: SubmitHandler<IncidentFormData> = (data) => {
    if (isEdit) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={isEdit ? t('forms.safetyIncident.editTitle') : t('forms.safetyIncident.createTitle')}
        subtitle={isEdit ? `${t('forms.safetyIncident.editSubtitlePrefix')} ${existingIncident?.number ?? ''}` : t('forms.safetyIncident.createSubtitle')}
        backTo={isEdit ? `/safety/${id}` : '/safety'}
        breadcrumbs={[
          { label: t('forms.common.home'), href: '/' },
          { label: t('forms.safetyIncident.breadcrumbSafety'), href: '/safety' },
          { label: isEdit ? t('forms.common.editing') : t('forms.common.creating') },
        ]}
      />

      <form onSubmit={handleSubmit(onSubmit)} className="max-w-3xl">
        <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-6">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-5">{t('forms.common.basicInfo')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FormField label={t('forms.safetyIncident.labelTitle')} error={errors.title?.message} required className="sm:col-span-2">
              <Input
                placeholder={t('forms.safetyIncident.placeholderTitle')}
                hasError={!!errors.title}
                {...register('title')}
              />
            </FormField>
            <FormField label={t('forms.safetyIncident.labelIncidentType')} error={errors.incidentType?.message} required>
              <Select
                options={incidentTypeOptions}
                placeholder={t('forms.safetyIncident.placeholderType')}
                hasError={!!errors.incidentType}
                {...register('incidentType')}
              />
            </FormField>
            <FormField label={t('forms.safetyIncident.labelSeverity')} error={errors.severity?.message} required>
              <Select
                options={severityOptions}
                placeholder={t('forms.safetyIncident.placeholderSeverity')}
                hasError={!!errors.severity}
                {...register('severity')}
              />
            </FormField>
            <FormField label={t('forms.safetyIncident.labelProject')} error={errors.projectId?.message} required>
              <Select
                options={getProjectOptions()}
                placeholder={t('forms.safetyIncident.placeholderProject')}
                hasError={!!errors.projectId}
                {...register('projectId')}
              />
            </FormField>
            <FormField label={t('forms.safetyIncident.labelReportedBy')} error={errors.reportedById?.message}>
              <Select
                options={getReporterOptions()}
                placeholder={t('forms.safetyIncident.placeholderReporter')}
                hasError={!!errors.reportedById}
                {...register('reportedById')}
              />
            </FormField>
          </div>
        </section>

        <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-6">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-5">{t('forms.safetyIncident.sectionDetails')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FormField label={t('forms.safetyIncident.labelLocation')} error={errors.location?.message}>
              <Input
                placeholder={t('forms.safetyIncident.placeholderLocation')}
                hasError={!!errors.location}
                {...register('location')}
              />
            </FormField>
            <FormField label={t('forms.safetyIncident.labelIncidentDate')} error={errors.incidentDate?.message} required>
              <Input type="date" hasError={!!errors.incidentDate} {...register('incidentDate')} />
            </FormField>
          </div>
          <div className="mt-5">
            <FormField label={t('common.description')} error={errors.description?.message} required>
              <Textarea
                placeholder={t('forms.safetyIncident.placeholderDescription')}
                rows={4}
                hasError={!!errors.description}
                {...register('description')}
              />
            </FormField>
          </div>
          <div className="mt-5">
            <FormField label={t('forms.safetyIncident.labelInvolvedPersonnel')} error={errors.involvedPersonnel?.message}>
              <Textarea
                placeholder={t('forms.safetyIncident.placeholderPersonnel')}
                rows={3}
                hasError={!!errors.involvedPersonnel}
                {...register('involvedPersonnel')}
              />
            </FormField>
          </div>
          <div className="mt-5">
            <FormField label={t('forms.safetyIncident.labelCorrectiveActions')} error={errors.correctiveActions?.message}>
              <Textarea
                placeholder={t('forms.safetyIncident.placeholderCorrectiveActions')}
                rows={4}
                hasError={!!errors.correctiveActions}
                {...register('correctiveActions')}
              />
            </FormField>
          </div>
        </section>

        <div className="flex items-center gap-3">
          <Button type="submit" loading={isSubmitting}>
            {isEdit ? t('forms.common.saveChanges') : t('forms.safetyIncident.createButton')}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate(isEdit ? `/safety/${id}` : '/safety')}
          >
            {t('common.back')}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default SafetyIncidentFormPage;
