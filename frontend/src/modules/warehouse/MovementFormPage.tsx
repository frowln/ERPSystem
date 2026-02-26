import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { FormField, Input, Textarea, Select } from '@/design-system/components/FormField';
import { warehouseApi } from '@/api/warehouse';
import { permissionsApi } from '@/api/permissions';
import { t } from '@/i18n';

const movementSchema = z.object({
  materialId: z.string().min(1, t('forms.movement.validation.materialRequired')),
  movementType: z.enum(['RECEIPT', 'ISSUE', 'TRANSFER', 'ADJUSTMENT', 'RETURN', 'WRITE_OFF'], {
    required_error: t('forms.movement.validation.typeRequired'),
  }),
  sourceLocation: z.string().optional(),
  destinationLocation: z.string().optional(),
  quantity: z
    .string()
    .min(1, t('forms.movement.validation.quantityRequired'))
    .transform((val) => Number(val))
    .refine((val) => val > 0, t('forms.movement.validation.quantityPositive')),
  movementDate: z.string().min(1, t('forms.movement.validation.dateRequired')),
  reason: z.string().max(500, t('forms.common.maxChars', { count: '500' })).optional(),
  responsiblePerson: z.string().min(1, t('forms.movement.validation.responsibleRequired')),
});

type MovementFormData = z.input<typeof movementSchema>;

const movementTypeOptions = [
  { value: 'RECEIPT', label: t('forms.movement.movementTypes.receipt') },
  { value: 'ISSUE', label: t('forms.movement.movementTypes.issue') },
  { value: 'TRANSFER', label: t('forms.movement.movementTypes.transfer') },
  { value: 'ADJUSTMENT', label: t('forms.movement.movementTypes.adjustment') },
  { value: 'RETURN', label: t('forms.movement.movementTypes.return') },
  { value: 'WRITE_OFF', label: t('forms.movement.movementTypes.writeOff') },
];

const MovementFormPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: materialsData } = useQuery({
    queryKey: ['warehouse-materials'],
    queryFn: () => warehouseApi.getMaterials({ page: 0, size: 200 }),
  });
  const materialOptions = (materialsData?.content ?? []).map((m) => ({
    value: m.id,
    label: m.name,
  }));

  const { data: locationsData } = useQuery({
    queryKey: ['warehouse-locations'],
    queryFn: () => warehouseApi.getLocations({ page: 0, size: 100 }),
  });
  const locationOptions = (locationsData?.content ?? []).map((loc) => ({
    value: loc.id,
    label: loc.name,
  }));

  const { data: usersData } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => permissionsApi.getUsers({ page: 0, size: 100 }),
  });
  const responsibleOptions = (usersData?.content ?? []).map((u) => ({
    value: u.id,
    label: u.fullName ?? `${u.firstName} ${u.lastName}`,
  }));

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<MovementFormData>({
    resolver: zodResolver(movementSchema),
    defaultValues: {
      materialId: '',
      movementType: '' as any,
      sourceLocation: '',
      destinationLocation: '',
      quantity: '',
      movementDate: '',
      reason: '',
      responsiblePerson: '',
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: MovementFormData) => {
      const parsed = movementSchema.parse(data);
      return warehouseApi.createMovement({
        number: `${t('mockData.movementNumberPrefix')}-${Date.now()}`,
        movementDate: parsed.movementDate,
        movementType: parsed.movementType,
        sourceLocation: parsed.sourceLocation,
        destinationLocation: parsed.destinationLocation,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movements'] });
      toast.success(t('forms.movement.createSuccess'));
      navigate('/warehouse/movements');
    },
    onError: () => {
      toast.error(t('forms.movement.createError'));
    },
  });

  const onSubmit = (data: MovementFormData) => {
    createMutation.mutate(data);
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('forms.movement.createTitle')}
        subtitle={t('forms.movement.createSubtitle')}
        backTo="/warehouse/movements"
        breadcrumbs={[
          { label: t('forms.common.home'), href: '/' },
          { label: t('forms.movement.breadcrumbWarehouse'), href: '/warehouse/materials' },
          { label: t('forms.movement.breadcrumbMovements'), href: '/warehouse/movements' },
          { label: t('forms.common.creating') },
        ]}
      />

      <form onSubmit={handleSubmit(onSubmit)} className="max-w-3xl">
        <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-6">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-5">{t('forms.movement.sectionMovementInfo')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FormField label={t('forms.movement.labelMaterial')} error={errors.materialId?.message} required>
              <Select
                options={materialOptions}
                placeholder={t('forms.movement.placeholderMaterial')}
                hasError={!!errors.materialId}
                {...register('materialId')}
              />
            </FormField>
            <FormField label={t('forms.movement.labelMovementType')} error={errors.movementType?.message} required>
              <Select
                options={movementTypeOptions}
                placeholder={t('forms.movement.placeholderType')}
                hasError={!!errors.movementType}
                {...register('movementType')}
              />
            </FormField>
            <FormField label={t('forms.movement.labelQuantity')} error={errors.quantity?.message} required>
              <Input
                type="text"
                inputMode="numeric"
                placeholder="100"
                hasError={!!errors.quantity}
                {...register('quantity')}
              />
            </FormField>
            <FormField label={t('forms.movement.labelMovementDate')} error={errors.movementDate?.message} required>
              <Input type="date" hasError={!!errors.movementDate} {...register('movementDate')} />
            </FormField>
          </div>
        </section>

        <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-6">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-5">{t('forms.movement.sectionLocations')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FormField label={t('forms.movement.labelFrom')} error={errors.sourceLocation?.message}>
              <Select
                options={locationOptions}
                placeholder={t('forms.movement.placeholderFrom')}
                hasError={!!errors.sourceLocation}
                {...register('sourceLocation')}
              />
            </FormField>
            <FormField label={t('forms.movement.labelTo')} error={errors.destinationLocation?.message}>
              <Select
                options={locationOptions}
                placeholder={t('forms.movement.placeholderTo')}
                hasError={!!errors.destinationLocation}
                {...register('destinationLocation')}
              />
            </FormField>
          </div>
        </section>

        <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-8">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-5">{t('forms.movement.sectionAdditional')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FormField label={t('forms.movement.labelResponsible')} error={errors.responsiblePerson?.message} required>
              <Select
                options={responsibleOptions}
                placeholder={t('forms.movement.placeholderResponsible')}
                hasError={!!errors.responsiblePerson}
                {...register('responsiblePerson')}
              />
            </FormField>
          </div>
          <div className="mt-5">
            <FormField label={t('forms.movement.labelReason')} error={errors.reason?.message}>
              <Textarea
                placeholder={t('forms.movement.placeholderReason')}
                rows={3}
                hasError={!!errors.reason}
                {...register('reason')}
              />
            </FormField>
          </div>
        </section>

        <div className="flex items-center gap-3">
          <Button type="submit" loading={createMutation.isPending}>
            {t('forms.movement.createButton')}
          </Button>
          <Button type="button" variant="secondary" onClick={() => navigate('/warehouse/movements')}>
            {t('common.cancel')}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default MovementFormPage;
