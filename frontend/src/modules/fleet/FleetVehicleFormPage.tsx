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
import { fleetApi, type VehicleStatus } from '@/api/fleet';
import { projectsApi } from '@/api/projects';
import { t } from '@/i18n';

const vehicleSchema = z.object({
  licensePlate: z.string().min(1, t('forms.fleetVehicle.validation.licensePlateRequired')).max(20, t('forms.common.maxChars', { count: '20' })),
  make: z.string().min(1, t('forms.fleetVehicle.validation.makeRequired')).max(100, t('forms.common.maxChars', { count: '100' })),
  model: z.string().min(1, t('forms.fleetVehicle.validation.modelRequired')).max(100, t('forms.common.maxChars', { count: '100' })),
  year: z.string().min(1, t('forms.fleetVehicle.validation.yearRequired')),
  vin: z.string().max(17, t('forms.fleetVehicle.validation.vinMaxLength')).optional(),
  vehicleType: z.enum(['EXCAVATOR', 'BULLDOZER', 'CRANE', 'TRUCK', 'CONCRETE_MIXER', 'LOADER', 'ROLLER', 'GENERATOR', 'COMPRESSOR', 'WELDING', 'CAR', 'BUS', 'OTHER'], {
    required_error: t('forms.fleetVehicle.validation.vehicleTypeRequired'),
  }),
  status: z.enum(['AVAILABLE', 'IN_USE', 'MAINTENANCE', 'REPAIR', 'DECOMMISSIONED'], {
    required_error: t('forms.fleetVehicle.validation.statusRequired'),
  }),
  currentOdometer: z.string().optional(),
  assignedProjectId: z.string().optional(),
  fuelType: z.enum(['diesel', 'gasoline', 'electric', 'hybrid'], {
    required_error: t('forms.fleetVehicle.validation.fuelTypeRequired'),
  }),
  notes: z.string().max(2000, t('forms.common.maxChars', { count: '2000' })).optional(),
});

type VehicleFormData = z.input<typeof vehicleSchema>;

const vehicleTypeOptions = [
  { value: 'EXCAVATOR', label: t('forms.fleetVehicle.vehicleTypes.excavator') },
  { value: 'BULLDOZER', label: t('forms.fleetVehicle.vehicleTypes.bulldozer') },
  { value: 'CRANE', label: t('forms.fleetVehicle.vehicleTypes.crane') },
  { value: 'TRUCK', label: t('forms.fleetVehicle.vehicleTypes.truck') },
  { value: 'CONCRETE_MIXER', label: t('forms.fleetVehicle.vehicleTypes.concreteMixer') },
  { value: 'LOADER', label: t('forms.fleetVehicle.vehicleTypes.loader') },
  { value: 'ROLLER', label: t('forms.fleetVehicle.vehicleTypes.roller') },
  { value: 'GENERATOR', label: t('forms.fleetVehicle.vehicleTypes.generator') },
  { value: 'COMPRESSOR', label: t('forms.fleetVehicle.vehicleTypes.compressor') },
  { value: 'WELDING', label: t('forms.fleetVehicle.vehicleTypes.welding') },
  { value: 'CAR', label: t('forms.fleetVehicle.vehicleTypes.car') },
  { value: 'BUS', label: t('forms.fleetVehicle.vehicleTypes.bus') },
  { value: 'OTHER', label: t('forms.fleetVehicle.vehicleTypes.other') },
];

const statusOptions = [
  { value: 'AVAILABLE', label: t('forms.fleetVehicle.statuses.available') },
  { value: 'IN_USE', label: t('forms.fleetVehicle.statuses.inUse') },
  { value: 'MAINTENANCE', label: t('forms.fleetVehicle.statuses.maintenance') },
  { value: 'REPAIR', label: t('forms.fleetVehicle.statuses.repair') },
  { value: 'DECOMMISSIONED', label: t('forms.fleetVehicle.statuses.decommissioned') },
];

const fuelTypeOptions = [
  { value: 'diesel', label: t('forms.fleetVehicle.fuelTypes.diesel') },
  { value: 'gasoline', label: t('forms.fleetVehicle.fuelTypes.gasoline') },
  { value: 'electric', label: t('forms.fleetVehicle.fuelTypes.electric') },
  { value: 'hybrid', label: t('forms.fleetVehicle.fuelTypes.hybrid') },
];

const FleetVehicleFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEdit = !!id;

  const { data: projectsData } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectsApi.getProjects(),
  });
  const projectOptions = [
    { value: '', label: t('forms.fleetVehicle.noProject') },
    ...(projectsData?.content ?? []).map(p => ({ value: p.id, label: p.name })),
  ];

  const { data: existingVehicle } = useQuery({
    queryKey: ['fleetVehicle', id],
    queryFn: () => fleetApi.getVehicle(id!),
    enabled: isEdit,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<VehicleFormData>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: existingVehicle
      ? {
          licensePlate: existingVehicle.licensePlate ?? '',
          make: existingVehicle.brand ?? '',
          model: existingVehicle.model ?? '',
          year: existingVehicle.year?.toString() ?? '',
          vin: '',
          vehicleType: existingVehicle.type as unknown as VehicleFormData['vehicleType'],
          status: existingVehicle.status as VehicleFormData['status'],
          currentOdometer: existingVehicle.operatingHours?.toString() ?? '',
          assignedProjectId: existingVehicle.projectId ?? '',
          fuelType: existingVehicle.fuelType as VehicleFormData['fuelType'],
          notes: '',
        }
      : {
          licensePlate: '',
          make: '',
          model: '',
          year: '',
          vin: '',
          vehicleType: '' as any,
          status: '' as any,
          currentOdometer: '',
          assignedProjectId: '',
          fuelType: '' as any,
          notes: '',
        },
  });

  const createMutation = useMutation({
    mutationFn: (data: VehicleFormData) => {
      return fleetApi.createVehicle({
        licensePlate: data.licensePlate,
        brand: data.make,
        model: data.model,
        year: Number(data.year),
        type: data.vehicleType,
        status: data.status as VehicleStatus,
        fuelType: data.fuelType,
      } as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fleetVehicles'] });
      toast.success(t('forms.fleetVehicle.createSuccess'));
      navigate('/fleet');
    },
    onError: () => {
      toast.error(t('forms.fleetVehicle.createError'));
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: VehicleFormData) => {
      return fleetApi.updateVehicle(id!, {
        licensePlate: data.licensePlate,
        brand: data.make,
        model: data.model,
        year: Number(data.year),
        type: data.vehicleType,
        status: data.status as VehicleStatus,
        fuelType: data.fuelType,
      } as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fleetVehicles'] });
      queryClient.invalidateQueries({ queryKey: ['fleetVehicle', id] });
      toast.success(t('forms.fleetVehicle.updateSuccess'));
      navigate(`/fleet/${id}`);
    },
    onError: () => {
      toast.error(t('forms.fleetVehicle.updateError'));
    },
  });

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const onSubmit = (data: VehicleFormData) => {
    if (isEdit) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={isEdit ? t('forms.fleetVehicle.editTitle') : t('forms.fleetVehicle.createTitle')}
        subtitle={isEdit ? existingVehicle?.licensePlate : t('forms.fleetVehicle.createSubtitle')}
        backTo={isEdit ? `/fleet/${id}` : '/fleet'}
        breadcrumbs={[
          { label: t('forms.common.home'), href: '/' },
          { label: t('forms.fleetVehicle.breadcrumbFleet'), href: '/fleet' },
          { label: isEdit ? t('forms.common.editing') : t('forms.common.creating') },
        ]}
      />

      <form onSubmit={handleSubmit(onSubmit)} className="max-w-3xl">
        <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-6">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-5">{t('forms.fleetVehicle.sectionBasicInfo')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FormField label={t('forms.fleetVehicle.labelLicensePlate')} error={errors.licensePlate?.message} required>
              <Input
                placeholder={t('forms.fleetVehicle.placeholderLicensePlate')}
                hasError={!!errors.licensePlate}
                {...register('licensePlate')}
              />
            </FormField>
            <FormField label={t('forms.fleetVehicle.labelVin')} error={errors.vin?.message}>
              <Input
                placeholder={t('forms.fleetVehicle.placeholderVin')}
                hasError={!!errors.vin}
                {...register('vin')}
              />
            </FormField>
            <FormField label={t('forms.fleetVehicle.labelMake')} error={errors.make?.message} required>
              <Input
                placeholder={t('forms.fleetVehicle.placeholderMake')}
                hasError={!!errors.make}
                {...register('make')}
              />
            </FormField>
            <FormField label={t('forms.fleetVehicle.labelModel')} error={errors.model?.message} required>
              <Input
                placeholder={t('forms.fleetVehicle.placeholderModel')}
                hasError={!!errors.model}
                {...register('model')}
              />
            </FormField>
            <FormField label={t('forms.fleetVehicle.labelYear')} error={errors.year?.message} required>
              <Input
                type="number"
                placeholder="2024"
                hasError={!!errors.year}
                {...register('year')}
              />
            </FormField>
            <FormField label={t('forms.fleetVehicle.labelVehicleType')} error={errors.vehicleType?.message} required>
              <Select
                options={vehicleTypeOptions}
                placeholder={t('forms.fleetVehicle.placeholderVehicleType')}
                hasError={!!errors.vehicleType}
                {...register('vehicleType')}
              />
            </FormField>
          </div>
        </section>

        <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-6">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-5">{t('forms.fleetVehicle.sectionStatusAssignment')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FormField label={t('forms.fleetVehicle.labelStatus')} error={errors.status?.message} required>
              <Select
                options={statusOptions}
                placeholder={t('forms.fleetVehicle.placeholderStatus')}
                hasError={!!errors.status}
                {...register('status')}
              />
            </FormField>
            <FormField label={t('forms.fleetVehicle.labelFuelType')} error={errors.fuelType?.message} required>
              <Select
                options={fuelTypeOptions}
                placeholder={t('forms.fleetVehicle.placeholderFuelType')}
                hasError={!!errors.fuelType}
                {...register('fuelType')}
              />
            </FormField>
            <FormField label={t('forms.fleetVehicle.labelOdometer')} error={errors.currentOdometer?.message}>
              <Input
                type="number"
                placeholder="0"
                hasError={!!errors.currentOdometer}
                {...register('currentOdometer')}
              />
            </FormField>
            <FormField label={t('forms.fleetVehicle.labelProject')} error={errors.assignedProjectId?.message}>
              <Select
                options={projectOptions}
                placeholder={t('forms.fleetVehicle.placeholderProject')}
                hasError={!!errors.assignedProjectId}
                {...register('assignedProjectId')}
              />
            </FormField>
          </div>
          <div className="mt-5">
            <FormField label={t('forms.fleetVehicle.labelNotes')} error={errors.notes?.message}>
              <Textarea
                placeholder={t('forms.fleetVehicle.placeholderNotes')}
                rows={3}
                hasError={!!errors.notes}
                {...register('notes')}
              />
            </FormField>
          </div>
        </section>

        <div className="flex items-center gap-3">
          <Button type="submit" loading={isSubmitting}>
            {isEdit ? t('forms.common.saveChanges') : t('forms.fleetVehicle.createButton')}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate(isEdit ? `/fleet/${id}` : '/fleet')}
          >
            {t('common.back')}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default FleetVehicleFormPage;
