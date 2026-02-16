import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useWatch, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { FormField, Input, Textarea, Select } from '@/design-system/components/FormField';
import { changeManagementApi } from '@/api/changeManagement';
import { formatMoney } from '@/lib/format';
import { t } from '@/i18n';
import type { ChangeOrder, ChangeOrderType } from './types';

const changeOrderSchema = z.object({
  title: z.string().min(1, t('forms.changeOrder.validation.titleRequired')).max(300, t('forms.common.maxChars', { count: '300' })),
  description: z.string().max(2000, t('forms.common.maxChars', { count: '2000' })).optional(),
  projectId: z.string().min(1, t('forms.changeOrder.validation.projectRequired')),
  contractId: z.string().min(1, t('forms.changeOrder.validation.contractRequired')),
  reason: z.enum(['SCOPE_CHANGE', 'DESIGN_CHANGE', 'UNFORESEEN_CONDITION', 'CLIENT_REQUEST', 'REGULATORY'], {
    required_error: t('forms.changeOrder.validation.reasonRequired'),
  }),
  estimatedCost: z.string().optional(),
  scheduledDays: z.string().optional(),
  priority: z.enum([ 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], {
    required_error: t('forms.changeOrder.validation.priorityRequired'),
  }),
  notes: z.string().max(2000, t('forms.common.maxChars', { count: '2000' })).optional(),
});

type ChangeOrderFormData = z.infer<typeof changeOrderSchema>;

const mapReasonToType = (reason: ChangeOrderFormData['reason']): ChangeOrderType => {
  if (reason === 'UNFORESEEN_CONDITION' || reason === 'REGULATORY') {
    return 'TIME_EXTENSION';
  }
  if (reason === 'CLIENT_REQUEST') {
    return 'ADDITION';
  }
  return 'ADDITION';
};

const mapTypeToReason = (type: ChangeOrderType): ChangeOrderFormData['reason'] => {
  if (type === 'TIME_EXTENSION') return 'UNFORESEEN_CONDITION';
  return 'SCOPE_CHANGE';
};

const buildDescription = (description?: string, notes?: string): string | undefined => {
  const base = description?.trim() ?? '';
  const note = notes?.trim() ?? '';
  if (!base && !note) return undefined;
  if (!note) return base;
  return `${base}${base ? '\n\n' : ''}${t('forms.changeOrder.notesPrefix')}: ${note}`;
};

const getReasonOptions = () => [
  { value: 'SCOPE_CHANGE', label: t('forms.changeOrder.reasons.scopeChange') },
  { value: 'DESIGN_CHANGE', label: t('forms.changeOrder.reasons.designChange') },
  { value: 'UNFORESEEN_CONDITION', label: t('forms.changeOrder.reasons.unforeseenCondition') },
  { value: 'CLIENT_REQUEST', label: t('forms.changeOrder.reasons.clientRequest') },
  { value: 'REGULATORY', label: t('forms.changeOrder.reasons.regulatory') },
];

const getPriorityOptions = () => [
  { value: 'LOW', label: t('forms.changeOrder.priorities.low') },
  { value: 'MEDIUM', label: t('forms.changeOrder.priorities.medium') },
  { value: 'HIGH', label: t('forms.changeOrder.priorities.high') },
  { value: 'CRITICAL', label: t('forms.changeOrder.priorities.critical') },
];

const projectOptions = [
  { value: '1', label: 'ЖК "Солнечный"' },
  { value: '2', label: 'БЦ "Горизонт"' },
  { value: '3', label: 'Мост через р. Вятка' },
  { value: '6', label: 'ТЦ "Центральный"' },
];

const contractOptions = [
  { value: 'con1', label: 'Договор СМР-2024/01' },
  { value: 'con2', label: 'Договор ПИР-2024/05' },
  { value: 'con3', label: 'Договор ЭМР-2024/12' },
];

const ChangeOrderFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEdit = !!id;

  const { data: existingOrder } = useQuery<ChangeOrder>({
    queryKey: ['changeOrder', id],
    queryFn: () => changeManagementApi.getChangeOrder(id!),
    enabled: isEdit,
  });

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<ChangeOrderFormData>({
    resolver: zodResolver(changeOrderSchema),
    defaultValues: existingOrder
      ? {
          title: existingOrder.title ?? '',
          description: existingOrder.description ?? '',
          projectId: existingOrder.projectId,
          contractId: existingOrder.contractId ?? '',
          reason: mapTypeToReason(existingOrder.type),
          estimatedCost: existingOrder.amount?.toString() ?? '',
          scheduledDays: existingOrder.scheduleImpactDays?.toString() ?? '',
          priority: 'MEDIUM',
          notes: '',
        }
      : {
          title: '',
          description: '',
          projectId: '',
          contractId: '',
          reason: 'SCOPE_CHANGE',
          estimatedCost: '',
          scheduledDays: '',
          priority: 'MEDIUM',
          notes: '',
        },
  });

  const estimatedCostValue = useWatch({ control, name: 'estimatedCost' });

  const createMutation = useMutation({
    mutationFn: (data: ChangeOrderFormData) => {
      return changeManagementApi.createChangeOrder({
        title: data.title,
        description: buildDescription(data.description, data.notes),
        type: mapReasonToType(data.reason),
        projectId: data.projectId,
        contractId: data.contractId || undefined,
        amount: data.estimatedCost ? Number(data.estimatedCost) : 0,
        scheduleImpactDays: data.scheduledDays ? Number(data.scheduledDays) : 0,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['changeOrders'] });
      toast.success(t('forms.changeOrder.createSuccess'));
      navigate('/change-management');
    },
    onError: () => {
      toast.error(t('forms.changeOrder.createError'));
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: ChangeOrderFormData) => {
      return changeManagementApi.updateChangeOrder(id!, {
        title: data.title,
        description: buildDescription(data.description, data.notes),
        type: mapReasonToType(data.reason),
        projectId: data.projectId,
        contractId: data.contractId || undefined,
        amount: data.estimatedCost ? Number(data.estimatedCost) : undefined,
        scheduleImpactDays: data.scheduledDays ? Number(data.scheduledDays) : undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['changeOrders'] });
      queryClient.invalidateQueries({ queryKey: ['changeOrder', id] });
      toast.success(t('forms.changeOrder.updateSuccess'));
      navigate(`/change-management/${id}`);
    },
    onError: () => {
      toast.error(t('forms.changeOrder.updateError'));
    },
  });

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const onSubmit: SubmitHandler<ChangeOrderFormData> = (data) => {
    if (isEdit) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={isEdit ? t('forms.changeOrder.editTitle') : t('forms.changeOrder.createTitle')}
        subtitle={isEdit ? existingOrder?.title : t('forms.changeOrder.createSubtitle')}
        backTo={isEdit ? `/change-management/${id}` : '/change-management'}
        breadcrumbs={[
          { label: t('forms.common.home'), href: '/' },
          { label: t('forms.changeOrder.breadcrumbChangeManagement'), href: '/change-management' },
          { label: isEdit ? t('forms.common.editing') : t('forms.common.creating') },
        ]}
      />

      <form onSubmit={handleSubmit(onSubmit)} className="max-w-3xl">
        <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-6">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-5">{t('forms.common.basicInfo')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FormField label={t('forms.changeOrder.labelTitle')} error={errors.title?.message} required className="sm:col-span-2">
              <Input
                placeholder={t('forms.changeOrder.placeholderTitle')}
                hasError={!!errors.title}
                {...register('title')}
              />
            </FormField>
            <FormField label={t('forms.changeOrder.labelReason')} error={errors.reason?.message} required>
              <Select
                options={getReasonOptions()}
                placeholder={t('forms.changeOrder.placeholderReason')}
                hasError={!!errors.reason}
                {...register('reason')}
              />
            </FormField>
            <FormField label={t('forms.changeOrder.labelPriority')} error={errors.priority?.message} required>
              <Select
                options={getPriorityOptions()}
                placeholder={t('forms.changeOrder.placeholderPriority')}
                hasError={!!errors.priority}
                {...register('priority')}
              />
            </FormField>
            <FormField label={t('forms.changeOrder.labelProject')} error={errors.projectId?.message} required>
              <Select
                options={projectOptions}
                placeholder={t('forms.changeOrder.placeholderProject')}
                hasError={!!errors.projectId}
                {...register('projectId')}
              />
            </FormField>
            <FormField label={t('forms.changeOrder.labelContract')} error={errors.contractId?.message} required>
              <Select
                options={contractOptions}
                placeholder={t('forms.changeOrder.placeholderContract')}
                hasError={!!errors.contractId}
                {...register('contractId')}
              />
            </FormField>
          </div>
        </section>

        <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-6">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-5">{t('forms.changeOrder.sectionCostSchedule')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FormField label={t('forms.changeOrder.labelEstimatedCost')} error={errors.estimatedCost?.message}>
              <Input
                type="number"
                placeholder="0"
                hasError={!!errors.estimatedCost}
                {...register('estimatedCost')}
              />
              {estimatedCostValue && Number(estimatedCostValue) > 0 && (
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                  {formatMoney(Number(estimatedCostValue))}
                </p>
              )}
            </FormField>
            <FormField label={t('forms.changeOrder.labelScheduledDays')} error={errors.scheduledDays?.message}>
              <Input
                type="number"
                placeholder="0"
                hasError={!!errors.scheduledDays}
                {...register('scheduledDays')}
              />
            </FormField>
          </div>
        </section>

        <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-6">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-5">{t('forms.changeOrder.sectionDetails')}</h2>
          <div className="mt-0">
            <FormField label={t('forms.changeOrder.labelDescription')} error={errors.description?.message}>
              <Textarea
                placeholder={t('forms.changeOrder.placeholderDescription')}
                rows={4}
                hasError={!!errors.description}
                {...register('description')}
              />
            </FormField>
          </div>
          <div className="mt-5">
            <FormField label={t('forms.changeOrder.labelNotes')} error={errors.notes?.message}>
              <Textarea
                placeholder={t('forms.changeOrder.placeholderNotes')}
                rows={3}
                hasError={!!errors.notes}
                {...register('notes')}
              />
            </FormField>
          </div>
        </section>

        <div className="flex items-center gap-3">
          <Button type="submit" loading={isSubmitting}>
            {isEdit ? t('forms.common.saveChanges') : t('forms.changeOrder.createButton')}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate(isEdit ? `/change-management/${id}` : '/change-management')}
          >
            {t('common.back')}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ChangeOrderFormPage;
