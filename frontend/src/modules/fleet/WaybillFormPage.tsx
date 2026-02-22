import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { FormField, Input, Select, Textarea, Checkbox } from '@/design-system/components/FormField';
import { fleetApi } from '@/api/fleet';
import { useProjectOptions, useVehicleOptions } from '@/hooks/useSelectOptions';
import { t } from '@/i18n';
import toast from 'react-hot-toast';

const schema = z.object({
  vehicleId: z.string().min(1),
  projectId: z.string().optional(),
  waybillDate: z.string().min(1),
  driverName: z.string().optional(),
  routeDescription: z.string().optional(),
  departurePoint: z.string().optional(),
  destinationPoint: z.string().optional(),
  mileageStart: z.coerce.number().optional(),
  mileageEnd: z.coerce.number().optional(),
  engineHoursStart: z.coerce.number().optional(),
  engineHoursEnd: z.coerce.number().optional(),
  fuelDispensed: z.coerce.number().optional(),
  fuelConsumed: z.coerce.number().optional(),
  fuelRemaining: z.coerce.number().optional(),
  medicalExamPassed: z.boolean().optional(),
  medicalExaminer: z.string().optional(),
  mechanicApproved: z.boolean().optional(),
  mechanicName: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

const WaybillFormPage: React.FC = () => {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { options: vehicleOptions } = useVehicleOptions();
  const { options: projectOptions } = useProjectOptions();

  const { data: existing, isLoading: loadingExisting } = useQuery({
    queryKey: ['fleet-waybill', id],
    queryFn: () => fleetApi.getWaybill(id!),
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
      waybillDate: new Date().toISOString().slice(0, 10),
      medicalExamPassed: false,
      mechanicApproved: false,
    },
  });

  useEffect(() => {
    if (existing) {
      reset({
        vehicleId: existing.vehicleId,
        projectId: existing.projectId ?? '',
        waybillDate: existing.waybillDate,
        driverName: existing.driverName ?? '',
        routeDescription: existing.routeDescription ?? '',
        departurePoint: existing.departurePoint ?? '',
        destinationPoint: existing.destinationPoint ?? '',
        mileageStart: existing.mileageStart ?? undefined,
        mileageEnd: existing.mileageEnd ?? undefined,
        engineHoursStart: existing.engineHoursStart ?? undefined,
        engineHoursEnd: existing.engineHoursEnd ?? undefined,
        fuelDispensed: existing.fuelDispensed ?? undefined,
        fuelConsumed: existing.fuelConsumed ?? undefined,
        fuelRemaining: existing.fuelRemaining ?? undefined,
        medicalExamPassed: existing.medicalExamPassed ?? false,
        medicalExaminer: existing.medicalExaminer ?? '',
        mechanicApproved: existing.mechanicApproved ?? false,
        mechanicName: existing.mechanicName ?? '',
        notes: existing.notes ?? '',
      });
    }
  }, [existing, reset]);

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => fleetApi.createWaybill(data),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['fleet-waybills'] });
      toast.success(t('fleet.waybills.toastCreated'));
      navigate(`/fleet/waybills/${result.id}`);
    },
    onError: () => toast.error(t('fleet.waybills.toastCreateError')),
  });

  const updateMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => fleetApi.updateWaybill(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fleet-waybill', id] });
      queryClient.invalidateQueries({ queryKey: ['fleet-waybills'] });
      toast.success(t('fleet.waybills.toastUpdated'));
      navigate(`/fleet/waybills/${id}`);
    },
    onError: () => toast.error(t('fleet.waybills.toastUpdateError')),
  });

  const onSubmit = (values: FormValues) => {
    const payload: Record<string, unknown> = { ...values };
    // Remove empty strings for optional UUID fields
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
        title={isEdit ? t('fleet.waybills.formTitleEdit') : t('fleet.waybills.formTitleNew')}
        breadcrumbs={[
          { label: t('fleet.waybills.breadcrumbHome'), href: '/' },
          { label: t('fleet.waybills.breadcrumbFleet'), href: '/fleet' },
          { label: t('fleet.waybills.breadcrumbWaybills'), href: '/fleet/waybills' },
          { label: isEdit ? t('fleet.waybills.breadcrumbEdit') : t('fleet.waybills.breadcrumbNew') },
        ]}
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic info */}
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label={t('fleet.waybills.formVehicle')} error={errors.vehicleId?.message} required>
              <Select
                {...register('vehicleId')}
                options={vehicleOptions}
                placeholder={t('fleet.waybills.formVehiclePlaceholder')}
              />
            </FormField>

            <FormField label={t('fleet.waybills.formProject')}>
              <Select
                {...register('projectId')}
                options={projectOptions}
                placeholder={t('fleet.waybills.formProjectPlaceholder')}
              />
            </FormField>

            <FormField label={t('fleet.waybills.formDate')} error={errors.waybillDate?.message} required>
              <Input type="date" {...register('waybillDate')} />
            </FormField>

            <FormField label={t('fleet.waybills.formDriverName')}>
              <Input {...register('driverName')} placeholder={t('fleet.waybills.formDriverNamePlaceholder')} />
            </FormField>
          </div>
        </div>

        {/* Route */}
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6 space-y-4">
          <h3 className="text-base font-semibold">{t('fleet.waybills.sectionRoute')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label={t('fleet.waybills.formDeparturePoint')}>
              <Input {...register('departurePoint')} />
            </FormField>
            <FormField label={t('fleet.waybills.formDestinationPoint')}>
              <Input {...register('destinationPoint')} />
            </FormField>
          </div>
          <FormField label={t('fleet.waybills.formRouteDescription')}>
            <Textarea {...register('routeDescription')} placeholder={t('fleet.waybills.formRouteDescriptionPlaceholder')} rows={2} />
          </FormField>
        </div>

        {/* Mileage & Engine Hours */}
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6 space-y-4">
          <h3 className="text-base font-semibold">{t('fleet.waybills.sectionMileage')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label={t('fleet.waybills.formMileageStart')}>
              <Input type="number" step="0.01" {...register('mileageStart')} />
            </FormField>
            <FormField label={t('fleet.waybills.formMileageEnd')}>
              <Input type="number" step="0.01" {...register('mileageEnd')} />
            </FormField>
            <FormField label={t('fleet.waybills.formEngineHoursStart')}>
              <Input type="number" step="0.01" {...register('engineHoursStart')} />
            </FormField>
            <FormField label={t('fleet.waybills.formEngineHoursEnd')}>
              <Input type="number" step="0.01" {...register('engineHoursEnd')} />
            </FormField>
          </div>
        </div>

        {/* Fuel */}
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6 space-y-4">
          <h3 className="text-base font-semibold">{t('fleet.waybills.sectionFuel')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField label={t('fleet.waybills.formFuelDispensed')}>
              <Input type="number" step="0.01" {...register('fuelDispensed')} />
            </FormField>
            <FormField label={t('fleet.waybills.formFuelConsumed')}>
              <Input type="number" step="0.01" {...register('fuelConsumed')} />
            </FormField>
            <FormField label={t('fleet.waybills.formFuelRemaining')}>
              <Input type="number" step="0.01" {...register('fuelRemaining')} />
            </FormField>
          </div>
        </div>

        {/* Pre-trip */}
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6 space-y-4">
          <h3 className="text-base font-semibold">{t('fleet.waybills.sectionPreTrip')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <Checkbox {...register('medicalExamPassed')} label={t('fleet.waybills.formMedicalExamPassed')} />
              <FormField label={t('fleet.waybills.formMedicalExaminer')}>
                <Input {...register('medicalExaminer')} />
              </FormField>
            </div>
            <div className="space-y-3">
              <Checkbox {...register('mechanicApproved')} label={t('fleet.waybills.formMechanicApproved')} />
              <FormField label={t('fleet.waybills.formMechanicName')}>
                <Input {...register('mechanicName')} />
              </FormField>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6 space-y-4">
          <FormField label={t('fleet.waybills.formNotes')}>
            <Textarea {...register('notes')} placeholder={t('fleet.waybills.formNotesPlaceholder')} rows={3} />
          </FormField>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <Button type="button" variant="secondary" onClick={() => navigate(-1)}>
            {t('fleet.waybills.formBtnCancel')}
          </Button>
          <Button type="submit" disabled={isSubmitting || createMutation.isPending || updateMutation.isPending}>
            {isEdit ? t('fleet.waybills.formBtnUpdate') : t('fleet.waybills.formBtnCreate')}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default WaybillFormPage;
