import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { Checkbox, FormField, Input, Textarea } from '@/design-system/components/FormField';
import { dispatchApi } from '@/api/dispatch';
import { t } from '@/i18n';
import { useFormDraft } from '@/hooks/useFormDraft';

const dispatchRouteSchema = z.object({
  name: z.string().trim().min(1, t('forms.dispatchRoute.validation.nameRequired')).max(120, t('forms.common.maxChars', { count: '120' })),
  originLocation: z.string().trim().min(1, t('forms.dispatchRoute.validation.originRequired')).max(300, t('forms.common.maxChars', { count: '300' })),
  destinationLocation: z.string().trim().min(1, t('forms.dispatchRoute.validation.destinationRequired')).max(300, t('forms.common.maxChars', { count: '300' })),
  distance: z
    .string()
    .optional()
    .transform((val) => {
      const normalized = val?.trim();
      if (!normalized) return undefined;
      const parsed = Number(normalized.replace(',', '.'));
      return Number.isFinite(parsed) ? parsed : NaN;
    })
    .refine((val) => val === undefined || val > 0, t('forms.dispatchRoute.validation.distancePositive')),
  estimatedDuration: z
    .string()
    .optional()
    .transform((val) => {
      const normalized = val?.trim();
      if (!normalized) return undefined;
      const parsed = Number(normalized);
      return Number.isFinite(parsed) ? parsed : NaN;
    })
    .refine((val) => val === undefined || val > 0, t('forms.dispatchRoute.validation.durationPositive')),
  isActive: z.boolean(),
  notes: z.string().max(500, t('forms.common.maxChars', { count: '500' })).optional(),
});

type DispatchRouteFormData = z.input<typeof dispatchRouteSchema>;

const DISPATCH_ROUTE_DRAFT_DEFAULTS: DispatchRouteFormData = {
  name: '',
  originLocation: '',
  destinationLocation: '',
  distance: '',
  estimatedDuration: '',
  isActive: true,
  notes: '',
};

const DispatchRouteFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEdit = Boolean(id);

  const { draft, saveDraft, clearDraft } = useFormDraft<DispatchRouteFormData>(
    'dispatch-route-new',
    DISPATCH_ROUTE_DRAFT_DEFAULTS,
  );

  const { data: existingRoute } = useQuery({
    queryKey: ['dispatch-route', id],
    queryFn: () => dispatchApi.getRoute(id!),
    enabled: isEdit,
  });

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<DispatchRouteFormData>({
    resolver: zodResolver(dispatchRouteSchema),
    defaultValues: existingRoute
      ? {
          name: existingRoute.name,
          originLocation: existingRoute.originLocation,
          destinationLocation: existingRoute.destinationLocation,
          distance: existingRoute.distance ? String(existingRoute.distance) : '',
          estimatedDuration: existingRoute.estimatedDuration ? String(existingRoute.estimatedDuration) : '',
          isActive: existingRoute.isActive,
          notes: existingRoute.notes ?? '',
        }
      : (draft ?? DISPATCH_ROUTE_DRAFT_DEFAULTS),
  });

  useEffect(() => {
    if (!isEdit && draft) toast(t('forms.draftRestored'), { icon: '📝' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formValues = watch();
  useEffect(() => {
    if (!isEdit) saveDraft(formValues);
  }, [formValues, isEdit, saveDraft]);

  useEffect(() => {
    if (!existingRoute) return;
    reset({
      name: existingRoute.name,
      originLocation: existingRoute.originLocation,
      destinationLocation: existingRoute.destinationLocation,
      distance: existingRoute.distance ? String(existingRoute.distance) : '',
      estimatedDuration: existingRoute.estimatedDuration ? String(existingRoute.estimatedDuration) : '',
      isActive: existingRoute.isActive,
      notes: existingRoute.notes ?? '',
    });
  }, [existingRoute, reset]);

  const createMutation = useMutation({
    mutationFn: (data: DispatchRouteFormData) => {
      const parsed = dispatchRouteSchema.parse(data);
      return dispatchApi.createRoute({
        name: parsed.name,
        originLocation: parsed.originLocation,
        destinationLocation: parsed.destinationLocation,
        distance: parsed.distance,
        estimatedDuration: parsed.estimatedDuration,
        isActive: parsed.isActive,
        notes: parsed.notes || undefined,
      });
    },
    onSuccess: () => {
      clearDraft();
      queryClient.invalidateQueries({ queryKey: ['dispatch-routes'] });
      toast.success(t('forms.dispatchRoute.createSuccess'));
      navigate('/dispatch/routes');
    },
    onError: () => {
      toast.error(t('forms.dispatchRoute.createError'));
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: DispatchRouteFormData) => {
      if (!id) {
        throw new Error('Dispatch route ID is required');
      }
      const parsed = dispatchRouteSchema.parse(data);
      return dispatchApi.updateRoute(id, {
        name: parsed.name,
        originLocation: parsed.originLocation,
        destinationLocation: parsed.destinationLocation,
        distance: parsed.distance,
        estimatedDuration: parsed.estimatedDuration,
        isActive: parsed.isActive,
        notes: parsed.notes || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dispatch-routes'] });
      queryClient.invalidateQueries({ queryKey: ['dispatch-route', id] });
      toast.success(t('forms.dispatchRoute.updateSuccess'));
      navigate('/dispatch/routes');
    },
    onError: () => {
      toast.error(t('forms.dispatchRoute.updateError'));
    },
  });

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const onSubmit = (data: DispatchRouteFormData) => {
    if (isEdit) {
      updateMutation.mutate(data);
      return;
    }
    createMutation.mutate(data);
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={isEdit ? t('forms.dispatchRoute.editTitle') : t('forms.dispatchRoute.createTitle')}
        subtitle={
          isEdit
            ? `${t('forms.dispatchRoute.editSubtitlePrefix')} ${existingRoute?.name ?? ''}`
            : t('forms.dispatchRoute.createSubtitle')
        }
        backTo="/dispatch/routes"
        breadcrumbs={[
          { label: t('forms.common.home'), href: '/' },
          { label: t('forms.dispatchRoute.breadcrumbDispatch'), href: '/dispatch/orders' },
          { label: t('forms.dispatchRoute.breadcrumbRoutes'), href: '/dispatch/routes' },
          { label: isEdit ? t('forms.common.editing') : t('forms.common.creating') },
        ]}
      />

      <form onSubmit={handleSubmit(onSubmit)} className="max-w-3xl">
        <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-6">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-5">
            {t('forms.dispatchRoute.sectionRouteInfo')}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FormField label={t('forms.dispatchRoute.labelName')} error={errors.name?.message} required className="sm:col-span-2">
              <Input
                placeholder={t('forms.dispatchRoute.placeholderName')}
                hasError={!!errors.name}
                {...register('name')}
              />
            </FormField>
            <FormField className="sm:col-span-2">
              <Checkbox label={t('forms.dispatchRoute.labelActive')} {...register('isActive')} />
            </FormField>
          </div>
        </section>

        <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-6">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-5">
            {t('forms.dispatchRoute.sectionPathMetrics')}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FormField label={t('forms.dispatchRoute.labelOrigin')} error={errors.originLocation?.message} required>
              <Input
                placeholder={t('forms.dispatchRoute.placeholderOrigin')}
                hasError={!!errors.originLocation}
                {...register('originLocation')}
              />
            </FormField>
            <FormField label={t('forms.dispatchRoute.labelDestination')} error={errors.destinationLocation?.message} required>
              <Input
                placeholder={t('forms.dispatchRoute.placeholderDestination')}
                hasError={!!errors.destinationLocation}
                {...register('destinationLocation')}
              />
            </FormField>
            <FormField label={t('forms.dispatchRoute.labelDistance')} error={errors.distance?.message}>
              <Input
                type="number"
                min="0"
                step="0.1"
                placeholder={t('forms.dispatchRoute.placeholderDistance')}
                hasError={!!errors.distance}
                {...register('distance')}
              />
            </FormField>
            <FormField label={t('forms.dispatchRoute.labelDuration')} error={errors.estimatedDuration?.message}>
              <Input
                type="number"
                min="0"
                step="1"
                placeholder={t('forms.dispatchRoute.placeholderDuration')}
                hasError={!!errors.estimatedDuration}
                {...register('estimatedDuration')}
              />
            </FormField>
          </div>
        </section>

        <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-8">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-5">
            {t('forms.dispatchRoute.sectionAdditional')}
          </h2>
          <FormField label={t('forms.dispatchRoute.labelNotes')} error={errors.notes?.message}>
            <Textarea
              rows={4}
              placeholder={t('forms.dispatchRoute.placeholderNotes')}
              hasError={!!errors.notes}
              {...register('notes')}
            />
          </FormField>
        </section>

        <div className="flex items-center gap-3">
          <Button type="submit" loading={isSubmitting}>
            {isEdit ? t('forms.common.saveChanges') : t('forms.dispatchRoute.createButton')}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate('/dispatch/routes')}
          >
            {t('common.back')}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default DispatchRouteFormPage;
