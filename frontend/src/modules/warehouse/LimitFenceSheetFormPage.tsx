import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { FormField, Input, Textarea } from '@/design-system/components/FormField';
import { Combobox } from '@/design-system/components/Combobox';
import { DatePicker } from '@/design-system/components/DatePicker';
import { limitFenceSheetsApi } from '@/api/limitFenceSheets';
import { useProjectOptions, useMaterialOptions, useWarehouseLocationOptions, useEmployeeOptions } from '@/hooks/useSelectOptions';
import { t } from '@/i18n';

const schema = z.object({
  sheetNumber: z.string().min(1, t('warehouse.limitFenceSheet.validationNumberRequired')),
  projectId: z.string().min(1, t('warehouse.limitFenceSheet.validationProjectRequired')),
  materialId: z.string().min(1, t('warehouse.limitFenceSheet.validationMaterialRequired')),
  unit: z.string().optional(),
  limitQuantity: z
    .string()
    .min(1, t('warehouse.limitFenceSheet.validationLimitRequired'))
    .transform((v) => Number(v))
    .refine((v) => v > 0, t('warehouse.limitFenceSheet.validationLimitPositive')),
  periodStart: z.string().min(1, t('warehouse.limitFenceSheet.validationPeriodStartRequired')),
  periodEnd: z.string().min(1, t('warehouse.limitFenceSheet.validationPeriodEndRequired')),
  warehouseId: z.string().optional(),
  responsibleId: z.string().optional(),
  notes: z.string().optional(),
});

type FormData = z.input<typeof schema>;

const LimitFenceSheetFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { options: projectOptions } = useProjectOptions();
  const { options: materialOptions } = useMaterialOptions();
  const { options: locationOptions } = useWarehouseLocationOptions();
  const { options: employeeOptions } = useEmployeeOptions('ACTIVE');

  const { data: existing } = useQuery({
    queryKey: ['limit-fence-sheet', id],
    queryFn: () => limitFenceSheetsApi.getSheet(id!),
    enabled: isEdit,
  });

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    values: isEdit && existing
      ? {
          sheetNumber: existing.sheetNumber,
          projectId: existing.projectId,
          materialId: existing.materialId,
          unit: existing.unit ?? '',
          limitQuantity: String(existing.limitQuantity),
          periodStart: existing.periodStart,
          periodEnd: existing.periodEnd,
          warehouseId: existing.warehouseId ?? '',
          responsibleId: existing.responsibleId ?? '',
          notes: existing.notes ?? '',
        }
      : undefined,
    defaultValues: {
      sheetNumber: '',
      projectId: '',
      materialId: '',
      unit: '',
      limitQuantity: '',
      periodStart: '',
      periodEnd: '',
      warehouseId: '',
      responsibleId: '',
      notes: '',
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: FormData) => {
      const parsed = schema.parse(data);
      return limitFenceSheetsApi.createSheet({
        sheetNumber: parsed.sheetNumber,
        projectId: parsed.projectId,
        materialId: parsed.materialId,
        unit: data.unit || undefined,
        limitQuantity: parsed.limitQuantity,
        periodStart: parsed.periodStart,
        periodEnd: parsed.periodEnd,
        warehouseId: data.warehouseId || undefined,
        responsibleId: data.responsibleId || undefined,
        notes: data.notes || undefined,
      });
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['limit-fence-sheets'] });
      toast.success(t('warehouse.limitFenceSheet.toastCreated'));
      navigate(`/warehouse/limit-fence-sheets/${result.id}`);
    },
    onError: () => toast.error(t('warehouse.limitFenceSheet.toastError')),
  });

  const updateMutation = useMutation({
    mutationFn: (data: FormData) => {
      const parsed = schema.parse(data);
      return limitFenceSheetsApi.updateSheet(id!, {
        limitQuantity: parsed.limitQuantity,
        periodStart: parsed.periodStart,
        periodEnd: parsed.periodEnd,
        warehouseId: data.warehouseId || undefined,
        responsibleId: data.responsibleId || undefined,
        notes: data.notes || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['limit-fence-sheet', id] });
      queryClient.invalidateQueries({ queryKey: ['limit-fence-sheets'] });
      toast.success(t('warehouse.limitFenceSheet.toastUpdated'));
      navigate(`/warehouse/limit-fence-sheets/${id}`);
    },
    onError: () => toast.error(t('warehouse.limitFenceSheet.toastError')),
  });

  const onSubmit = (data: FormData) => {
    if (isEdit) updateMutation.mutate(data);
    else createMutation.mutate(data);
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={isEdit
          ? t('warehouse.limitFenceSheet.formEditTitle', { number: existing?.sheetNumber ?? '' })
          : t('warehouse.limitFenceSheet.formTitle')}
        subtitle={t('warehouse.limitFenceSheet.formSubtitle')}
        backTo={isEdit ? `/warehouse/limit-fence-sheets/${id}` : '/warehouse/limit-fence-sheets'}
        breadcrumbs={[
          { label: t('warehouse.breadcrumbHome'), href: '/' },
          { label: t('warehouse.breadcrumbWarehouse'), href: '/warehouse/materials' },
          { label: t('warehouse.limitFenceSheet.breadcrumb'), href: '/warehouse/limit-fence-sheets' },
          { label: isEdit ? existing?.sheetNumber ?? '...' : t('common.create') },
        ]}
      />

      <form onSubmit={handleSubmit(onSubmit)} className="max-w-3xl">
        {/* Main info */}
        <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-6">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-5">{t('warehouse.limitFenceSheet.formSectionMain')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FormField label={t('warehouse.limitFenceSheet.formLabelNumber')} error={errors.sheetNumber?.message} required>
              <Input
                placeholder={t('warehouse.limitFenceSheet.formPlaceholderNumber')}
                hasError={!!errors.sheetNumber}
                disabled={isEdit}
                {...register('sheetNumber')}
              />
            </FormField>
            <FormField label={t('warehouse.limitFenceSheet.formLabelProject')} error={errors.projectId?.message} required>
              <Controller
                name="projectId"
                control={control}
                render={({ field }) => (
                  <Combobox
                    options={projectOptions}
                    value={field.value}
                    onChange={field.onChange}
                    placeholder={t('warehouse.limitFenceSheet.formLabelProject')}
                    hasError={!!errors.projectId}
                    disabled={isEdit}
                  />
                )}
              />
            </FormField>
            <FormField label={t('warehouse.limitFenceSheet.formLabelMaterial')} error={errors.materialId?.message} required>
              <Controller
                name="materialId"
                control={control}
                render={({ field }) => (
                  <Combobox
                    options={materialOptions}
                    value={field.value}
                    onChange={field.onChange}
                    placeholder={t('warehouse.limitFenceSheet.formLabelMaterial')}
                    hasError={!!errors.materialId}
                    disabled={isEdit}
                  />
                )}
              />
            </FormField>
            <FormField label={t('warehouse.limitFenceSheet.formLabelUnit')}>
              <Input
                placeholder={t('warehouse.limitFenceSheet.formPlaceholderUnit')}
                disabled={isEdit}
                {...register('unit')}
              />
            </FormField>
          </div>
        </section>

        {/* Period and limit */}
        <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-6">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-5">{t('warehouse.limitFenceSheet.formSectionPeriod')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <FormField label={t('warehouse.limitFenceSheet.formLabelLimitQuantity')} error={errors.limitQuantity?.message} required>
              <Input
                type="number"
                placeholder="1000"
                hasError={!!errors.limitQuantity}
                {...register('limitQuantity')}
              />
            </FormField>
            <FormField label={t('warehouse.limitFenceSheet.formLabelPeriodStart')} error={errors.periodStart?.message} required>
              <Controller
                name="periodStart"
                control={control}
                render={({ field }) => (
                  <DatePicker
                    value={field.value}
                    onChange={field.onChange}
                    hasError={!!errors.periodStart}
                  />
                )}
              />
            </FormField>
            <FormField label={t('warehouse.limitFenceSheet.formLabelPeriodEnd')} error={errors.periodEnd?.message} required>
              <Controller
                name="periodEnd"
                control={control}
                render={({ field }) => (
                  <DatePicker
                    value={field.value}
                    onChange={field.onChange}
                    hasError={!!errors.periodEnd}
                  />
                )}
              />
            </FormField>
          </div>
        </section>

        {/* Additional */}
        <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-8">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-5">{t('warehouse.limitFenceSheet.formSectionAdditional')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FormField label={t('warehouse.limitFenceSheet.formLabelWarehouse')}>
              <Controller
                name="warehouseId"
                control={control}
                render={({ field }) => (
                  <Combobox
                    options={locationOptions}
                    value={field.value ?? ''}
                    onChange={field.onChange}
                    placeholder={t('warehouse.limitFenceSheet.formLabelWarehouse')}
                  />
                )}
              />
            </FormField>
            <FormField label={t('warehouse.limitFenceSheet.formLabelResponsible')}>
              <Controller
                name="responsibleId"
                control={control}
                render={({ field }) => (
                  <Combobox
                    options={employeeOptions}
                    value={field.value ?? ''}
                    onChange={field.onChange}
                    placeholder={t('warehouse.limitFenceSheet.formLabelResponsible')}
                  />
                )}
              />
            </FormField>
          </div>
          <div className="mt-5">
            <FormField label={t('warehouse.limitFenceSheet.formLabelNotes')}>
              <Textarea
                placeholder={t('warehouse.limitFenceSheet.formPlaceholderNotes')}
                rows={3}
                {...register('notes')}
              />
            </FormField>
          </div>
        </section>

        <div className="flex items-center gap-3">
          <Button type="submit" loading={isPending}>
            {isEdit ? t('warehouse.limitFenceSheet.formUpdate') : t('warehouse.limitFenceSheet.formSave')}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate(isEdit ? `/warehouse/limit-fence-sheets/${id}` : '/warehouse/limit-fence-sheets')}
          >
            {t('common.cancel')}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default LimitFenceSheetFormPage;
