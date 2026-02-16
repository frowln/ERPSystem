import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Modal } from '@/design-system/components/Modal';
import { Button } from '@/design-system/components/Button';
import { FormField, Input, Select } from '@/design-system/components/FormField';
import { fleetApi } from '@/api/fleet';
import { t } from '@/i18n';

const vehicleSchema = z.object({
  licensePlate: z
    .string()
    .min(1, t('fleet.createModal.validationLicensePlate'))
    .max(20, t('fleet.createModal.validationMaxChars')),
  brand: z.string().min(1, t('fleet.createModal.validationBrand')),
  model: z.string().min(1, t('fleet.createModal.validationModel')),
  year: z
    .string()
    .min(1, t('fleet.createModal.validationYear'))
    .transform((val) => Number(val))
    .refine((val) => val >= 1990 && val <= 2030, t('fleet.createModal.validationYearRange')),
  type: z.enum(
    ['EXCAVATOR', 'CRANE', 'TRUCK', 'LOADER', 'BULLDOZER', 'CONCRETE_MIXER', 'GENERATOR', 'COMPRESSOR', 'OTHER'],
    { required_error: t('fleet.createModal.validationType') },
  ),
  status: z.enum(['AVAILABLE', 'IN_USE', 'MAINTENANCE', 'REPAIR', 'DECOMMISSIONED'], {
    required_error: t('fleet.createModal.validationStatus'),
  }),
  projectId: z.string().optional(),
});

type VehicleFormData = z.input<typeof vehicleSchema>;

interface VehicleCreateModalProps {
  open: boolean;
  onClose: () => void;
}

const getTypeOptions = () => [
  { value: 'EXCAVATOR', label: t('fleet.createModal.typeExcavator') },
  { value: 'CRANE', label: t('fleet.createModal.typeCrane') },
  { value: 'TRUCK', label: t('fleet.createModal.typeTruck') },
  { value: 'LOADER', label: t('fleet.createModal.typeLoader') },
  { value: 'BULLDOZER', label: t('fleet.createModal.typeBulldozer') },
  { value: 'CONCRETE_MIXER', label: t('fleet.createModal.typeConcreteMixer') },
  { value: 'GENERATOR', label: t('fleet.createModal.typeGenerator') },
  { value: 'COMPRESSOR', label: t('fleet.createModal.typeCompressor') },
  { value: 'OTHER', label: t('fleet.createModal.typeOther') },
];

const getStatusOptions = () => [
  { value: 'AVAILABLE', label: t('fleet.createModal.statusAvailable') },
  { value: 'IN_USE', label: t('fleet.createModal.statusInUse') },
  { value: 'MAINTENANCE', label: t('fleet.createModal.statusMaintenance') },
  { value: 'REPAIR', label: t('fleet.createModal.statusRepair') },
  { value: 'DECOMMISSIONED', label: t('fleet.createModal.statusDecommissioned') },
];

const getProjectOptions = () => [
  { value: '', label: t('fleet.createModal.noProject') },
  { value: '1', label: t('mockData.projectSolnechny') },
  { value: '2', label: t('mockData.projectGorizont') },
  { value: '3', label: t('mockData.projectBridgeVyatka') },
  { value: '6', label: t('mockData.projectTsCentralny') },
];

export const VehicleCreateModal: React.FC<VehicleCreateModalProps> = ({ open, onClose }) => {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<VehicleFormData>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      licensePlate: '',
      brand: '',
      model: '',
      year: '',
      type: '' as any,
      status: 'AVAILABLE',
      projectId: '',
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: VehicleFormData) => {
      const parsed = vehicleSchema.parse(data);
      return fleetApi.createVehicle({
        licensePlate: parsed.licensePlate,
        brand: parsed.brand,
        model: parsed.model,
        year: parsed.year as number,
        type: parsed.type,
        status: parsed.status,
        name: `${parsed.brand} ${parsed.model}`,
        code: parsed.licensePlate,
        projectId: parsed.projectId || undefined,
        fuelType: 'diesel',
        operatingHours: 0,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['VEHICLES'] });
      toast.success(t('fleet.createModal.successToast'));
      reset();
      onClose();
    },
    onError: () => {
      toast.error(t('fleet.createModal.errorToast'));
    },
  });

  const onSubmit = (data: VehicleFormData) => {
    createMutation.mutate(data);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={t('fleet.createModal.title')}
      description={t('fleet.createModal.description')}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={handleClose}>
            {t('fleet.createModal.cancel')}
          </Button>
          <Button onClick={handleSubmit(onSubmit)} loading={createMutation.isPending}>
            {t('fleet.createModal.submit')}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <FormField label={t('fleet.createModal.labelLicensePlate')} error={errors.licensePlate?.message} required>
          <Input
            placeholder={t('fleet.createModal.placeholderLicensePlate')}
            hasError={!!errors.licensePlate}
            {...register('licensePlate')}
          />
        </FormField>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label={t('fleet.createModal.labelBrand')} error={errors.brand?.message} required>
            <Input placeholder="CAT" hasError={!!errors.brand} {...register('brand')} />
          </FormField>
          <FormField label={t('fleet.createModal.labelModel')} error={errors.model?.message} required>
            <Input placeholder="320GC" hasError={!!errors.model} {...register('model')} />
          </FormField>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <FormField label={t('fleet.createModal.labelYear')} error={errors.year?.message} required>
            <Input
              type="text"
              inputMode="numeric"
              placeholder="2023"
              hasError={!!errors.year}
              {...register('year')}
            />
          </FormField>
          <FormField label={t('fleet.createModal.labelType')} error={errors.type?.message} required>
            <Select
              options={getTypeOptions()}
              placeholder={t('fleet.createModal.placeholderType')}
              hasError={!!errors.type}
              {...register('type')}
            />
          </FormField>
          <FormField label={t('fleet.createModal.labelStatus')} error={errors.status?.message} required>
            <Select options={getStatusOptions()} hasError={!!errors.status} {...register('status')} />
          </FormField>
        </div>

        <FormField label={t('fleet.createModal.labelProject')} error={errors.projectId?.message}>
          <Select
            options={getProjectOptions()}
            placeholder={t('fleet.createModal.placeholderProject')}
            hasError={!!errors.projectId}
            {...register('projectId')}
          />
        </FormField>
      </div>
    </Modal>
  );
};
