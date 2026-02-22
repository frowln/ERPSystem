import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { FormField, Input, Textarea, Select } from '@/design-system/components/FormField';
import { defectsApi } from '@/api/defects';
import { t } from '@/i18n';
import { useFormDraft } from '@/hooks/useFormDraft';
import { useProjectOptions, useEmployeeOptions, usePartnerOptions } from '@/hooks/useSelectOptions';

const getSlaOptions = () => [
  { value: '', label: '—' },
  { value: '24', label: t('defects.form.sla24h') },
  { value: '48', label: t('defects.form.sla48h') },
  { value: '72', label: t('defects.form.sla72h') },
  { value: '120', label: t('defects.form.sla120h') },
  { value: '168', label: t('defects.form.sla168h') },
  { value: '336', label: t('defects.form.sla336h') },
];

const defectSchema = z.object({
  projectId: z.string().min(1, t('defects.form.validationProject')),
  title: z.string().min(1, t('defects.form.validationTitle')).max(500),
  description: z.string().max(5000).optional(),
  location: z.string().max(500).optional(),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  assignedToId: z.string().optional(),
  contractorId: z.string().optional(),
  fixDeadline: z.string().optional(),
  slaDeadlineHours: z.string().optional(),
});

type DefectFormData = z.input<typeof defectSchema>;

const getSeverityOptions = () => [
  { value: 'LOW', label: t('defects.severityLow') },
  { value: 'MEDIUM', label: t('defects.severityMedium') },
  { value: 'HIGH', label: t('defects.severityHigh') },
  { value: 'CRITICAL', label: t('defects.severityCritical') },
];

const DefectFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEdit = !!id;
  const draftKey = isEdit ? `defect-edit-${id}` : 'defect-new';
  const defaultValues: DefectFormData = {
    projectId: '', title: '', description: '', location: '',
    severity: 'MEDIUM', assignedToId: '', contractorId: '', fixDeadline: '',
    slaDeadlineHours: '',
  };
  const { draft, saveDraft, clearDraft, draftAge } = useFormDraft<DefectFormData>(draftKey, defaultValues);
  const { options: projectOptions } = useProjectOptions();
  const { options: employeeOptions } = useEmployeeOptions('ACTIVE');
  const { options: partnerOptions } = usePartnerOptions();

  const { data: existing } = useQuery({
    queryKey: ['defect', id],
    queryFn: () => defectsApi.getDefect(id!),
    enabled: isEdit,
  });

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<DefectFormData>({
    resolver: zodResolver(defectSchema),
    defaultValues: existing
      ? {
          projectId: existing.projectId,
          title: existing.title,
          description: existing.description ?? '',
          location: existing.location ?? '',
          severity: existing.severity,
          assignedToId: existing.assignedToId ?? '',
          contractorId: existing.contractorId ?? '',
          fixDeadline: existing.fixDeadline ?? '',
          slaDeadlineHours: existing.slaDeadlineHours ? String(existing.slaDeadlineHours) : '',
        }
      : (draft ?? defaultValues),
  });

  useEffect(() => {
    if (!isEdit && draft) {
      toast(t('forms.draftRestored'), { icon: '\uD83D\uDCDD' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formValues = watch();
  useEffect(() => {
    if (!isEdit) saveDraft(formValues);
  }, [formValues, isEdit, saveDraft]);

  const createMutation = useMutation({
    mutationFn: (data: DefectFormData) =>
      defectsApi.createDefect({
        projectId: data.projectId,
        title: data.title,
        description: data.description || undefined,
        location: data.location || undefined,
        severity: data.severity,
        assignedToId: data.assignedToId || undefined,
        contractorId: data.contractorId || undefined,
        fixDeadline: data.fixDeadline || undefined,
        slaDeadlineHours: data.slaDeadlineHours ? Number(data.slaDeadlineHours) : undefined,
      }),
    onSuccess: (created) => {
      clearDraft();
      queryClient.invalidateQueries({ queryKey: ['defects'] });
      toast.success(t('defects.form.createSuccess'));
      navigate(`/defects/${created.id}`);
    },
    onError: () => toast.error(t('defects.form.createError')),
  });

  const updateMutation = useMutation({
    mutationFn: (data: DefectFormData) =>
      defectsApi.updateDefect(id!, {
        title: data.title,
        description: data.description || undefined,
        location: data.location || undefined,
        severity: data.severity,
        assignedToId: data.assignedToId || undefined,
        contractorId: data.contractorId || undefined,
        fixDeadline: data.fixDeadline || undefined,
        slaDeadlineHours: data.slaDeadlineHours ? Number(data.slaDeadlineHours) : undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['defect', id] });
      queryClient.invalidateQueries({ queryKey: ['defects'] });
      toast.success(t('defects.form.updateSuccess'));
      navigate(`/defects/${id}`);
    },
    onError: () => toast.error(t('defects.form.updateError')),
  });

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const onSubmit = (data: DefectFormData) => {
    if (isEdit) updateMutation.mutate(data);
    else createMutation.mutate(data);
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={isEdit ? t('defects.form.editTitle') : t('defects.form.createTitle')}
        subtitle={isEdit ? existing?.title : t('defects.form.createSubtitle')}
        backTo={isEdit ? `/defects/${id}` : '/defects'}
        breadcrumbs={[
          { label: t('common.home'), href: '/' },
          { label: t('defects.breadcrumb'), href: '/defects' },
          { label: isEdit ? t('forms.common.editing') : t('forms.common.creating') },
        ]}
      />

      <form onSubmit={handleSubmit(onSubmit)} className="max-w-3xl">
        <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-6">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-5">{t('forms.common.basicInfo')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FormField label={t('defects.form.labelTitle')} error={errors.title?.message} required className="sm:col-span-2">
              <Input placeholder={t('defects.form.placeholderTitle')} hasError={!!errors.title} {...register('title')} />
            </FormField>
            <FormField label={t('defects.form.labelProject')} error={errors.projectId?.message} required>
              <Select options={projectOptions} placeholder={t('defects.form.placeholderProject')} hasError={!!errors.projectId} {...register('projectId')} />
            </FormField>
            <FormField label={t('defects.form.labelSeverity')} error={errors.severity?.message} required>
              <Select options={getSeverityOptions()} hasError={!!errors.severity} {...register('severity')} />
            </FormField>
            <FormField label={t('defects.form.labelContractor')} error={errors.contractorId?.message}>
              <Select options={[{ value: '', label: t('defects.form.placeholderContractor') }, ...partnerOptions]} hasError={!!errors.contractorId} {...register('contractorId')} />
            </FormField>
            <FormField label={t('defects.form.labelAssignee')} error={errors.assignedToId?.message}>
              <Select options={[{ value: '', label: t('defects.form.placeholderAssignee') }, ...employeeOptions]} hasError={!!errors.assignedToId} {...register('assignedToId')} />
            </FormField>
            <FormField label={t('defects.form.labelDeadline')} error={errors.fixDeadline?.message}>
              <Input type="date" hasError={!!errors.fixDeadline} {...register('fixDeadline')} />
            </FormField>
            <FormField label={t('defects.form.labelSla')} error={errors.slaDeadlineHours?.message}>
              <Select options={getSlaOptions()} hasError={!!errors.slaDeadlineHours} {...register('slaDeadlineHours')} />
            </FormField>
            <FormField label={t('defects.form.labelLocation')} error={errors.location?.message} className="sm:col-span-2">
              <Input placeholder={t('defects.form.placeholderLocation')} hasError={!!errors.location} {...register('location')} />
            </FormField>
          </div>
          <div className="mt-5">
            <FormField label={t('common.description')} error={errors.description?.message}>
              <Textarea placeholder={t('defects.form.placeholderDescription')} rows={4} hasError={!!errors.description} {...register('description')} />
            </FormField>
          </div>
        </section>

        <div className="flex items-center gap-3">
          <Button type="submit" loading={isSubmitting}>
            {isEdit ? t('forms.common.saveChanges') : t('defects.form.createButton')}
          </Button>
          <Button type="button" variant="secondary" onClick={() => navigate(isEdit ? `/defects/${id}` : '/defects')}>
            {t('common.back')}
          </Button>
          {!isEdit && draft && (
            <Button type="button" variant="secondary" onClick={() => { clearDraft(); window.location.reload(); }} className="ml-auto text-xs text-neutral-500">
              {t('forms.clearDraft')}
              {draftAge && <span className="ml-1 opacity-60">({t('forms.draftSavedAt', { age: draftAge })})</span>}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
};

export default DefectFormPage;
