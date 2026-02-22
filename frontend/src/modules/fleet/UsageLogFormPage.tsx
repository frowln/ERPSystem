import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { FormField, Input, Select, Textarea } from '@/design-system/components/FormField';
import { fleetApi } from '@/api/fleet';
import { useProjectOptions, useVehicleOptions } from '@/hooks/useSelectOptions';
import { t } from '@/i18n';
import toast from 'react-hot-toast';

const schema = z.object({
  vehicleId: z.string().min(1),
  projectId: z.string().optional(),
  operatorName: z.string().optional(),
  usageDate: z.string().min(1),
  hoursWorked: z.coerce.number().min(0),
  hoursStart: z.coerce.number().optional(),
  hoursEnd: z.coerce.number().optional(),
  fuelConsumed: z.coerce.number().optional(),
  description: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

const UsageLogFormPage: React.FC = () => {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { options: vehicleOptions } = useVehicleOptions();
  const { options: projectOptions } = useProjectOptions();

  const { data: existing, isLoading: loadingExisting } = useQuery({
    queryKey: ['fleet-usage-log', id],
    queryFn: () => fleetApi.getUsageLog(id!),
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
      vehicleId: '',
      projectId: '',
      usageDate: new Date().toISOString().slice(0, 10),
      hoursWorked: 0,
    },
  });

  useEffect(() => {
    if (existing) {
      reset({
        vehicleId: existing.vehicleId,
        projectId: existing.projectId ?? '',
        operatorName: existing.operatorName ?? '',
        usageDate: existing.usageDate,
        hoursWorked: existing.hoursWorked ?? 0,
        hoursStart: existing.hoursStart ?? undefined,
        hoursEnd: existing.hoursEnd ?? undefined,
        fuelConsumed: existing.fuelConsumed ?? undefined,
        description: existing.description ?? '',
        notes: existing.notes ?? '',
      });
    }
  }, [existing, reset]);

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => fleetApi.createUsageLog(data),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['fleet-usage-logs'] });
      toast.success(t('fleet.usageLogs.toastCreated'));
      navigate(`/fleet/usage-logs/${result.id}`);
    },
    onError: () => toast.error(t('fleet.usageLogs.toastCreateError')),
  });

  const updateMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => fleetApi.updateUsageLog(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fleet-usage-log', id] });
      queryClient.invalidateQueries({ queryKey: ['fleet-usage-logs'] });
      toast.success(t('fleet.usageLogs.toastUpdated'));
      navigate(`/fleet/usage-logs/${id}`);
    },
    onError: () => toast.error(t('fleet.usageLogs.toastUpdateError')),
  });

  const onSubmit = (values: FormValues) => {
    const payload: Record<string, unknown> = { ...values };
    if (!payload.projectId) delete payload.projectId;
    if (isEdit) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  if (isEdit && loadingExisting) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={isEdit ? t('fleet.usageLogs.formTitleEdit') : t('fleet.usageLogs.formTitleNew')}
        breadcrumbs={[
          { label: t('fleet.usageLogs.breadcrumbHome'), href: '/' },
          { label: t('fleet.usageLogs.breadcrumbFleet'), href: '/fleet' },
          { label: t('fleet.usageLogs.breadcrumbUsageLogs'), href: '/fleet/usage-logs' },
          { label: isEdit ? t('fleet.usageLogs.breadcrumbEdit') : t('fleet.usageLogs.breadcrumbNew') },
        ]}
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label={t('fleet.usageLogs.formVehicle')} error={errors.vehicleId?.message} required>
              <Select
                {...register('vehicleId')}
                options={vehicleOptions}
                placeholder={t('fleet.usageLogs.formVehiclePlaceholder')}
              />
            </FormField>

            <FormField label={t('fleet.usageLogs.formProject')}>
              <Select
                {...register('projectId')}
                options={projectOptions}
                placeholder={t('fleet.usageLogs.formProjectPlaceholder')}
              />
            </FormField>

            <FormField label={t('fleet.usageLogs.formDate')} error={errors.usageDate?.message} required>
              <Input type="date" {...register('usageDate')} />
            </FormField>

            <FormField label={t('fleet.usageLogs.formOperatorName')}>
              <Input {...register('operatorName')} placeholder={t('fleet.usageLogs.formOperatorNamePlaceholder')} />
            </FormField>
          </div>
        </div>

        {/* Hours */}
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6 space-y-4">
          <h3 className="text-base font-semibold">{t('fleet.usageLogs.labelHoursWorked')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField label={t('fleet.usageLogs.formHoursWorked')} error={errors.hoursWorked?.message} required>
              <Input type="number" step="0.01" {...register('hoursWorked')} />
            </FormField>
            <FormField label={t('fleet.usageLogs.formHoursStart')}>
              <Input type="number" step="0.01" {...register('hoursStart')} />
            </FormField>
            <FormField label={t('fleet.usageLogs.formHoursEnd')}>
              <Input type="number" step="0.01" {...register('hoursEnd')} />
            </FormField>
          </div>
        </div>

        {/* Fuel */}
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6 space-y-4">
          <FormField label={t('fleet.usageLogs.formFuelConsumed')}>
            <Input type="number" step="0.01" {...register('fuelConsumed')} />
          </FormField>
        </div>

        {/* Description & Notes */}
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6 space-y-4">
          <FormField label={t('fleet.usageLogs.formDescription')}>
            <Textarea {...register('description')} placeholder={t('fleet.usageLogs.formDescriptionPlaceholder')} rows={2} />
          </FormField>
          <FormField label={t('fleet.usageLogs.formNotes')}>
            <Textarea {...register('notes')} placeholder={t('fleet.usageLogs.formNotesPlaceholder')} rows={2} />
          </FormField>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <Button type="button" variant="secondary" onClick={() => navigate(-1)}>
            {t('fleet.usageLogs.formBtnCancel')}
          </Button>
          <Button type="submit" disabled={isSubmitting || createMutation.isPending || updateMutation.isPending}>
            {isEdit ? t('fleet.usageLogs.formBtnUpdate') : t('fleet.usageLogs.formBtnCreate')}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default UsageLogFormPage;
