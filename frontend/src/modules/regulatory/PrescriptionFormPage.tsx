import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { FormField, Input, Select, Textarea } from '@/design-system/components/FormField';
import { regulatoryApi } from '@/api/regulatory';
import { useProjectOptions } from '@/hooks/useSelectOptions';
import toast from 'react-hot-toast';
import type { RegulatoryBodyType } from './types';
import { t } from '@/i18n';

const schema = z.object({
  description: z.string().min(1, t('regulatory.validationRequired')),
  regulatoryBodyType: z.enum([
    'GIT',
    'ROSTEKHNADZOR',
    'STROYNADZOR',
    'MCHS',
    'ROSPOTREBNADZOR',
    'ENVIRONMENTAL',
    'OTHER',
  ] as const),
  projectId: z.string().optional(),
  receivedDate: z.string().optional(),
  deadline: z.string().optional(),
  appealDeadline: z.string().optional(),
  responsibleName: z.string().optional(),
  fineAmount: z.coerce.number().min(0).optional().or(z.literal('')),
  violationCount: z.coerce.number().int().min(1).optional().or(z.literal('')),
  regulatoryReference: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

const BODY_TYPE_OPTIONS: { value: RegulatoryBodyType; label: string }[] = [
  { value: 'GIT', label: t('regulatory.bodyGIT') },
  { value: 'ROSTEKHNADZOR', label: t('regulatory.bodyRostekhnadzor') },
  { value: 'STROYNADZOR', label: t('regulatory.bodyStroynadzor') },
  { value: 'MCHS', label: t('regulatory.bodyMCHS') },
  { value: 'ROSPOTREBNADZOR', label: t('regulatory.bodyRospotrebnadzor') },
  { value: 'ENVIRONMENTAL', label: t('regulatory.bodyEnvironmental') },
  { value: 'OTHER', label: t('regulatory.bodyOther') },
];

const PrescriptionFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { options: projectOptions } = useProjectOptions();

  const { data: prescription } = useQuery({
    queryKey: ['prescription', id],
    queryFn: () => regulatoryApi.getPrescription(id!),
    enabled: isEdit,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      description: '',
      regulatoryBodyType: 'GIT',
      projectId: '',
      receivedDate: new Date().toISOString().split('T')[0],
      deadline: '',
      appealDeadline: '',
      responsibleName: '',
      fineAmount: '',
      violationCount: 1,
      regulatoryReference: '',
      notes: '',
    },
  });

  useEffect(() => {
    if (prescription) {
      reset({
        description: prescription.description,
        regulatoryBodyType: prescription.regulatoryBodyType ?? 'GIT',
        projectId: prescription.projectId ?? '',
        receivedDate: prescription.receivedDate ?? '',
        deadline: prescription.deadline ?? '',
        appealDeadline: prescription.appealDeadline ?? '',
        responsibleName: prescription.responsibleName ?? '',
        fineAmount: prescription.fineAmount ?? '',
        violationCount: prescription.violationCount ?? 1,
        regulatoryReference: prescription.regulatoryReference ?? '',
        notes: prescription.notes ?? '',
      });
    }
  }, [prescription, reset]);

  const createMutation = useMutation({
    mutationFn: (data: FormValues) => {
      const payload = {
        description: data.description,
        regulatoryBodyType: data.regulatoryBodyType as RegulatoryBodyType,
        projectId: data.projectId || undefined,
        receivedDate: data.receivedDate || undefined,
        deadline: data.deadline || undefined,
        appealDeadline: data.appealDeadline || undefined,
        responsibleName: data.responsibleName || undefined,
        fineAmount: typeof data.fineAmount === 'number' && data.fineAmount > 0 ? data.fineAmount : undefined,
        violationCount: typeof data.violationCount === 'number' ? data.violationCount : undefined,
        regulatoryReference: data.regulatoryReference || undefined,
        notes: data.notes || undefined,
      };
      return isEdit
        ? regulatoryApi.updatePrescription(id!, payload)
        : regulatoryApi.createPrescription(payload);
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['prescriptions'] });
      if (isEdit) {
        queryClient.invalidateQueries({ queryKey: ['prescription', id] });
      }
      toast.success(isEdit ? t('regulatory.toastPrescriptionUpdated') : t('regulatory.toastPrescriptionCreated'));
      navigate(`/regulatory/prescriptions/${result.id}`);
    },
    onError: () => {
      toast.error(t('common.operationError'));
    },
  });

  const onSubmit = (data: FormValues) => {
    createMutation.mutate(data);
  };

  return (
    <div className="animate-fade-in max-w-3xl mx-auto">
      <PageHeader
        title={isEdit ? t('regulatory.prescriptionFormEditTitle') : t('regulatory.prescriptionFormTitle')}
        subtitle={t('regulatory.prescriptionFormSubtitle')}
        breadcrumbs={[
          { label: t('regulatory.breadcrumbHome'), href: '/' },
          { label: t('regulatory.breadcrumbRegulatory'), href: '/regulatory/dashboard' },
          { label: t('regulatory.breadcrumbPrescriptions'), href: '/regulatory/prescriptions' },
          { label: isEdit ? t('regulatory.prescriptionFormEditTitle') : t('regulatory.prescriptionFormTitle') },
        ]}
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6 space-y-5">
          <FormField label={t('regulatory.formDescription')} error={errors.description?.message} required>
            <Textarea
              {...register('description')}
              placeholder={t('regulatory.formDescriptionPlaceholder')}
              rows={4}
            />
          </FormField>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label={t('regulatory.formRegulatoryBodyType')} error={errors.regulatoryBodyType?.message} required>
              <Select
                options={[{ value: '', label: '---' }, ...BODY_TYPE_OPTIONS]}
                {...register('regulatoryBodyType')}
              />
            </FormField>

            <FormField label={t('regulatory.formProject')}>
              <Select
                options={[{ value: '', label: '---' }, ...projectOptions]}
                {...register('projectId')}
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <FormField label={t('regulatory.formReceivedDate')}>
              <Input type="date" {...register('receivedDate')} />
            </FormField>
            <FormField label={t('regulatory.formDeadline')}>
              <Input type="date" {...register('deadline')} />
            </FormField>
            <FormField label={t('regulatory.formAppealDeadline')}>
              <Input type="date" {...register('appealDeadline')} />
            </FormField>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label={t('regulatory.formResponsible')}>
              <Input {...register('responsibleName')} placeholder={t("regulatory.formResponsiblePlaceholder")} />
            </FormField>
            <FormField label={t('regulatory.formFineAmount')}>
              <Input type="number" step="0.01" min="0" {...register('fineAmount')} />
            </FormField>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label={t('regulatory.formViolationCount')}>
              <Input type="number" min="1" {...register('violationCount')} />
            </FormField>
            <FormField label={t('regulatory.formRegulatoryReference')}>
              <Input {...register('regulatoryReference')} placeholder={t("regulatory.formRegulatoryReferencePlaceholder")} />
            </FormField>
          </div>

          <FormField label={t('regulatory.formNotes')}>
            <Textarea {...register('notes')} placeholder={t('regulatory.formNotesPlaceholder')} rows={3} />
          </FormField>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" type="button" onClick={() => navigate(-1)}>
            {t('regulatory.btnCancel')}
          </Button>
          <Button type="submit" loading={isSubmitting || createMutation.isPending}>
            {t('regulatory.btnSavePrescription')}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default PrescriptionFormPage;
