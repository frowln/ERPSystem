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
import { safetyApi } from '@/api/safety';
import { t } from '@/i18n';

const inspectionSchema = z.object({
  inspectionDate: z.string().min(1, t('forms.safetyInspection.validation.dateRequired')),
  inspectionType: z.enum(['ROUTINE', 'UNSCHEDULED', 'FOLLOWUP', 'REGULATORY'], {
    required_error: t('forms.safetyInspection.validation.typeRequired'),
  }),
  projectId: z.string().min(1, t('forms.safetyInspection.validation.projectRequired')),
  inspectorId: z.string().optional(),
  inspectorName: z.string().max(300, t('forms.common.maxChars', { count: '300' })).optional(),
  notes: z.string().max(2000, t('forms.common.maxChars', { count: '2000' })).optional(),
});

type InspectionFormData = z.input<typeof inspectionSchema>;

const inspectionTypeOptions = [
  { value: 'ROUTINE', label: t('forms.safetyInspection.inspectionTypes.routine') },
  { value: 'UNSCHEDULED', label: t('forms.safetyInspection.inspectionTypes.unscheduled') },
  { value: 'FOLLOWUP', label: t('forms.safetyInspection.inspectionTypes.followup') },
  { value: 'REGULATORY', label: t('forms.safetyInspection.inspectionTypes.regulatory') },
];

const projectOptions = [
  { value: '1', label: 'ЖК "Солнечный"' },
  { value: '2', label: 'БЦ "Горизонт"' },
  { value: '3', label: 'Мост через р. Вятка' },
  { value: '6', label: 'ТЦ "Центральный"' },
];

const inspectorOptions = [
  { value: '', label: t('forms.safetyInspection.inspectorNotAssigned') },
  { value: 'u1', label: 'Иванов И.И.' },
  { value: 'u2', label: 'Петров П.П.' },
  { value: 'u3', label: 'Сидоров С.С.' },
  { value: 'u4', label: 'Козлов К.К.' },
];

const SafetyInspectionFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEdit = !!id;

  const { data: existingInspection } = useQuery({
    queryKey: ['safety-inspection', id],
    queryFn: () => safetyApi.getInspection(id!),
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
          inspectionDate: existingInspection.inspectionDate ?? '',
          inspectionType: (existingInspection.inspectionType?.toUpperCase() as any) ?? ('' as any),
          projectId: existingInspection.projectId ?? '',
          inspectorId: existingInspection.inspectorId ?? '',
          inspectorName: existingInspection.inspectorName ?? '',
          notes: existingInspection.notes ?? '',
        }
      : {
          inspectionDate: new Date().toISOString().split('T')[0],
          inspectionType: '' as any,
          projectId: '',
          inspectorId: '',
          inspectorName: '',
          notes: '',
        },
  });

  const createMutation = useMutation({
    mutationFn: (data: InspectionFormData) => {
      return safetyApi.createInspection({
        inspectionDate: data.inspectionDate,
        inspectionType: data.inspectionType,
        projectId: data.projectId || undefined,
        inspectorId: data.inspectorId || undefined,
        inspectorName: data.inspectorName || undefined,
        notes: data.notes || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['safety-inspections'] });
      toast.success(t('forms.safetyInspection.createSuccess'));
      navigate('/safety/inspections');
    },
    onError: () => {
      toast.error(t('forms.safetyInspection.createError'));
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: InspectionFormData) => {
      return safetyApi.updateInspection(id!, {
        inspectionDate: data.inspectionDate,
        inspectionType: data.inspectionType,
        projectId: data.projectId || undefined,
        inspectorId: data.inspectorId || undefined,
        inspectorName: data.inspectorName || undefined,
        notes: data.notes || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['safety-inspections'] });
      queryClient.invalidateQueries({ queryKey: ['safety-inspection', id] });
      toast.success(t('forms.safetyInspection.updateSuccess'));
      navigate(`/safety/inspections/${id}`);
    },
    onError: () => {
      toast.error(t('forms.safetyInspection.updateError'));
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
        title={isEdit ? t('forms.safetyInspection.editTitle') : t('forms.safetyInspection.createTitle')}
        subtitle={isEdit ? existingInspection?.number : t('forms.safetyInspection.createSubtitle')}
        backTo={isEdit ? `/safety/inspections/${id}` : '/safety/inspections'}
        breadcrumbs={[
          { label: t('forms.common.home'), href: '/' },
          { label: t('forms.safetyInspection.breadcrumbSafety'), href: '/safety/inspections' },
          { label: t('forms.safetyInspection.breadcrumbInspections'), href: '/safety/inspections' },
          { label: isEdit ? t('forms.common.editing') : t('forms.common.creating') },
        ]}
      />

      <form onSubmit={handleSubmit(onSubmit)} className="max-w-3xl">
        <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-6">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-5">{t('forms.common.basicInfo')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FormField label={t('forms.safetyInspection.labelInspectionDate')} error={errors.inspectionDate?.message} required>
              <Input type="date" hasError={!!errors.inspectionDate} {...register('inspectionDate')} />
            </FormField>
            <FormField label={t('forms.safetyInspection.labelInspectionType')} error={errors.inspectionType?.message} required>
              <Select
                options={inspectionTypeOptions}
                placeholder={t('forms.safetyInspection.placeholderType')}
                hasError={!!errors.inspectionType}
                {...register('inspectionType')}
              />
            </FormField>
            <FormField label={t('forms.safetyInspection.labelProject')} error={errors.projectId?.message} required>
              <Select
                options={projectOptions}
                placeholder={t('forms.safetyInspection.placeholderProject')}
                hasError={!!errors.projectId}
                {...register('projectId')}
              />
            </FormField>
            <FormField label={t('forms.safetyInspection.labelInspector')} error={errors.inspectorId?.message}>
              <Select
                options={inspectorOptions}
                placeholder={t('forms.safetyInspection.placeholderInspector')}
                hasError={!!errors.inspectorId}
                {...register('inspectorId')}
              />
            </FormField>
          </div>
        </section>

        <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-8">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-5">{t('forms.safetyInspection.sectionAdditional')}</h2>
          <FormField label={t('forms.safetyInspection.labelNotes')} error={errors.notes?.message}>
            <Textarea
              placeholder={t('forms.safetyInspection.placeholderNotes')}
              rows={4}
              hasError={!!errors.notes}
              {...register('notes')}
            />
          </FormField>
        </section>

        <div className="flex items-center gap-3">
          <Button type="submit" loading={isSubmitting}>
            {isEdit ? t('forms.common.saveChanges') : t('forms.safetyInspection.createButton')}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate(isEdit ? `/safety/inspections/${id}` : '/safety/inspections')}
          >
            {t('common.back')}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default SafetyInspectionFormPage;
