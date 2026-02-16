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
import { dispatchApi } from '@/api/dispatch';
import { t } from '@/i18n';

const dispatchOrderSchema = z.object({
  orderNumber: z.string().min(1, t('forms.dispatchOrder.validation.orderNumberRequired')).max(50, t('forms.common.maxChars', { count: '50' })),
  projectId: z.string().optional(),
  vehicleId: z.string().optional(),
  driverId: z.string().optional(),
  origin: z.string().min(1, t('forms.dispatchOrder.validation.originRequired')).max(300, t('forms.common.maxChars', { count: '300' })),
  destination: z.string().min(1, t('forms.dispatchOrder.validation.destinationRequired')).max(300, t('forms.common.maxChars', { count: '300' })),
  cargoDescription: z.string().max(500, t('forms.common.maxChars', { count: '500' })).optional(),
  weight: z
    .string()
    .optional()
    .transform((val) => (val ? Number(val.replace(/\s/g, '')) : undefined))
    .refine((val) => val === undefined || val > 0, t('forms.dispatchOrder.validation.weightPositive')),
  scheduledDate: z.string().min(1, t('forms.dispatchOrder.validation.scheduledDateRequired')),
});

type DispatchOrderFormData = z.input<typeof dispatchOrderSchema>;

const getProjectOptions = () => [
  { value: '', label: t('forms.dispatchOrder.noProject') },
  { value: '1', label: t('forms.dispatchOrder.projectSolnechny') },
  { value: '2', label: t('forms.dispatchOrder.projectHorizont') },
  { value: '3', label: t('forms.dispatchOrder.projectBridge') },
  { value: '6', label: t('forms.dispatchOrder.projectCentral') },
];

const getVehicleOptions = () => [
  { value: '', label: t('forms.dispatchOrder.vehicleNotSelected') },
  { value: 'v1', label: t('forms.dispatchOrder.vehicleKamaz') },
  { value: 'v2', label: t('forms.dispatchOrder.vehicleMaz') },
  { value: 'v3', label: t('forms.dispatchOrder.vehicleVolvo') },
  { value: 'v4', label: t('forms.dispatchOrder.vehicleMan') },
  { value: 'v5', label: t('forms.dispatchOrder.vehicleScania') },
];

const getDriverOptions = () => [
  { value: '', label: t('forms.dispatchOrder.driverNotAssigned') },
  { value: 'd1', label: t('forms.dispatchOrder.driverSmirnov') },
  { value: 'd2', label: t('forms.dispatchOrder.driverKuznetsov') },
  { value: 'd3', label: t('forms.dispatchOrder.driverPopov') },
  { value: 'd4', label: t('forms.dispatchOrder.driverVasiliev') },
];

const DispatchOrderFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEdit = !!id;

  const { data: existingOrder } = useQuery({
    queryKey: ['dispatch-order', id],
    queryFn: () => dispatchApi.getOrder(id!),
    enabled: isEdit,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DispatchOrderFormData>({
    resolver: zodResolver(dispatchOrderSchema),
    defaultValues: existingOrder
      ? {
          orderNumber: existingOrder.number,
          projectId: existingOrder.projectId ?? '',
          vehicleId: '',
          driverId: '',
          origin: existingOrder.originLocation,
          destination: existingOrder.destinationLocation,
          cargoDescription: existingOrder.cargoDescription ?? '',
          weight: existingOrder.cargoWeight ? String(existingOrder.cargoWeight) : '',
          scheduledDate: existingOrder.scheduledDate,
        }
      : {
          orderNumber: '',
          projectId: '',
          vehicleId: '',
          driverId: '',
          origin: '',
          destination: '',
          cargoDescription: '',
          weight: '',
          scheduledDate: '',
        },
  });

  const createMutation = useMutation({
    mutationFn: (data: DispatchOrderFormData) => {
      const parsed = dispatchOrderSchema.parse(data);
      return dispatchApi.createOrder({
        description: `${t('forms.dispatchOrder.editSubtitlePrefix')} ${data.orderNumber}`,
        vehicleNumber: data.vehicleId || undefined,
        driverName: data.driverId || undefined,
        originLocation: data.origin,
        destinationLocation: data.destination,
        scheduledDate: data.scheduledDate,
        cargoDescription: data.cargoDescription || undefined,
        cargoWeight: parsed.weight,
        projectId: data.projectId || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dispatch-orders'] });
      toast.success(t('forms.dispatchOrder.createSuccess'));
      navigate('/dispatch/orders');
    },
    onError: () => {
      toast.error(t('forms.dispatchOrder.createError'));
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: DispatchOrderFormData) => {
      const parsed = dispatchOrderSchema.parse(data);
      return dispatchApi.createOrder({
        description: `${t('forms.dispatchOrder.editSubtitlePrefix')} ${data.orderNumber}`,
        vehicleNumber: data.vehicleId || undefined,
        driverName: data.driverId || undefined,
        originLocation: data.origin,
        destinationLocation: data.destination,
        scheduledDate: data.scheduledDate,
        cargoDescription: data.cargoDescription || undefined,
        cargoWeight: parsed.weight,
        projectId: data.projectId || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dispatch-orders'] });
      queryClient.invalidateQueries({ queryKey: ['dispatch-order', id] });
      toast.success(t('forms.dispatchOrder.updateSuccess'));
      navigate('/dispatch/orders');
    },
    onError: () => {
      toast.error(t('forms.dispatchOrder.updateError'));
    },
  });

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const onSubmit = (data: DispatchOrderFormData) => {
    if (isEdit) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={isEdit ? t('forms.dispatchOrder.editTitle') : t('forms.dispatchOrder.createTitle')}
        subtitle={isEdit ? `${t('forms.dispatchOrder.editSubtitlePrefix')} ${existingOrder?.number}` : t('forms.dispatchOrder.createSubtitle')}
        backTo="/dispatch/orders"
        breadcrumbs={[
          { label: t('forms.common.home'), href: '/' },
          { label: t('forms.dispatchOrder.breadcrumbDispatch'), href: '/dispatch' },
          { label: t('forms.dispatchOrder.breadcrumbOrders'), href: '/dispatch/orders' },
          { label: isEdit ? t('forms.common.editing') : t('forms.common.creating') },
        ]}
      />

      <form onSubmit={handleSubmit(onSubmit)} className="max-w-3xl">
        <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-6">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-5">{t('forms.dispatchOrder.sectionOrderInfo')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FormField label={t('forms.dispatchOrder.labelOrderNumber')} error={errors.orderNumber?.message} required>
              <Input
                placeholder={t('forms.dispatchOrder.placeholderOrderNumber')}
                hasError={!!errors.orderNumber}
                {...register('orderNumber')}
              />
            </FormField>
            <FormField label={t('forms.dispatchOrder.labelProject')} error={errors.projectId?.message}>
              <Select
                options={getProjectOptions()}
                hasError={!!errors.projectId}
                {...register('projectId')}
              />
            </FormField>
            <FormField label={t('forms.dispatchOrder.labelScheduledDate')} error={errors.scheduledDate?.message} required>
              <Input type="date" hasError={!!errors.scheduledDate} {...register('scheduledDate')} />
            </FormField>
          </div>
        </section>

        <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-6">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-5">{t('forms.dispatchOrder.sectionTransport')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FormField label={t('forms.dispatchOrder.labelVehicle')} error={errors.vehicleId?.message}>
              <Select
                options={getVehicleOptions()}
                hasError={!!errors.vehicleId}
                {...register('vehicleId')}
              />
            </FormField>
            <FormField label={t('forms.dispatchOrder.labelDriver')} error={errors.driverId?.message}>
              <Select
                options={getDriverOptions()}
                hasError={!!errors.driverId}
                {...register('driverId')}
              />
            </FormField>
          </div>
        </section>

        <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-8">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-5">{t('forms.dispatchOrder.sectionRouteCargo')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FormField label={t('forms.dispatchOrder.labelOrigin')} error={errors.origin?.message} required>
              <Input
                placeholder={t('forms.dispatchOrder.placeholderOrigin')}
                hasError={!!errors.origin}
                {...register('origin')}
              />
            </FormField>
            <FormField label={t('forms.dispatchOrder.labelDestination')} error={errors.destination?.message} required>
              <Input
                placeholder={t('forms.dispatchOrder.placeholderDestination')}
                hasError={!!errors.destination}
                {...register('destination')}
              />
            </FormField>
            <FormField label={t('forms.dispatchOrder.labelCargoDescription')} error={errors.cargoDescription?.message} className="sm:col-span-2">
              <Textarea
                placeholder={t('forms.dispatchOrder.placeholderCargoDescription')}
                rows={3}
                hasError={!!errors.cargoDescription}
                {...register('cargoDescription')}
              />
            </FormField>
            <FormField label={t('forms.dispatchOrder.labelWeight')} error={errors.weight?.message}>
              <Input
                type="text"
                inputMode="numeric"
                placeholder="15000"
                hasError={!!errors.weight}
                {...register('weight')}
              />
            </FormField>
          </div>
        </section>

        <div className="flex items-center gap-3">
          <Button type="submit" loading={isSubmitting}>
            {isEdit ? t('forms.common.saveChanges') : t('forms.dispatchOrder.createButton')}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate('/dispatch/orders')}
          >
            {t('common.back')}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default DispatchOrderFormPage;
