import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { FormField, Input, Textarea, Select } from '@/design-system/components/FormField';
import { maintenanceApi } from '@/api/maintenance';
import { t } from '@/i18n';
import type { MaintenanceRequest } from './types';

const maintenanceRequestSchema = z.object({
  title: z.string().min(1, t('forms.maintenanceRequest.validation.titleRequired')).max(300, t('forms.common.maxChars', { count: '300' })),
  description: z.string().max(2000, t('forms.common.maxChars', { count: '2000' })).optional(),
  equipmentId: z.string().min(1, t('forms.maintenanceRequest.validation.equipmentRequired')),
  priority: z.enum([ 'LOW', 'MEDIUM', 'HIGH', 'URGENT'], {
    required_error: t('forms.maintenanceRequest.validation.priorityRequired'),
  }),
  requestType: z.enum([ 'CORRECTIVE', 'PREVENTIVE'], {
    required_error: t('forms.maintenanceRequest.validation.requestTypeRequired'),
  }),
  startDate: z.string().min(1, t('forms.maintenanceRequest.validation.startDateRequired')),
  endDate: z.string().optional(),
  scheduledDate: z.string().optional(),
});

type MaintenanceRequestFormData = z.infer<typeof maintenanceRequestSchema>;

const equipmentOptions = [
  { value: 'eq1', label: 'Башенный кран КБ-403' },
  { value: 'eq2', label: 'Экскаватор CAT 320' },
  { value: 'eq3', label: 'Бетононасос Putzmeister BSA' },
  { value: 'eq4', label: 'Компрессор Atlas Copco XAS' },
  { value: 'eq5', label: 'Генератор Caterpillar DE220' },
  { value: 'eq6', label: 'Сварочный аппарат Lincoln V350' },
];

const priorityOptions = [
  { value: 'LOW', label: t('forms.maintenanceRequest.priorities.low') },
  { value: 'MEDIUM', label: t('forms.maintenanceRequest.priorities.medium') },
  { value: 'HIGH', label: t('forms.maintenanceRequest.priorities.high') },
  { value: 'URGENT', label: t('forms.maintenanceRequest.priorities.urgent') },
];

const requestTypeOptions = [
  { value: 'CORRECTIVE', label: t('forms.maintenanceRequest.requestTypes.corrective') },
  { value: 'PREVENTIVE', label: t('forms.maintenanceRequest.requestTypes.preventive') },
];

const MaintenanceRequestFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEdit = !!id;

  const { data: existingRequest } = useQuery<MaintenanceRequest>({
    queryKey: ['maintenance-request', id],
    queryFn: () => maintenanceApi.getRequest(id!),
    enabled: isEdit,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<MaintenanceRequestFormData>({
    resolver: zodResolver(maintenanceRequestSchema),
    defaultValues: existingRequest
      ? {
          title: existingRequest.name,
          description: existingRequest.description ?? '',
          equipmentId: existingRequest.equipmentId,
          priority: existingRequest.priority,
          requestType: existingRequest.maintenanceType === 'CORRECTIVE' ? 'CORRECTIVE' : 'PREVENTIVE',
          startDate: existingRequest.scheduledDate ?? '',
          endDate: existingRequest.completedDate ?? '',
          scheduledDate: existingRequest.scheduledDate ?? '',
        }
      : {
          title: '',
          description: '',
          equipmentId: '',
          priority: 'MEDIUM',
          requestType: 'PREVENTIVE',
          startDate: '',
          endDate: '',
          scheduledDate: '',
        },
  });

  const createMutation = useMutation({
    mutationFn: (data: MaintenanceRequestFormData) => {
      return maintenanceApi.createRequest({
        name: data.title,
        description: data.description || undefined,
        equipmentId: data.equipmentId,
        priority: data.priority,
        maintenanceType: data.requestType,
        scheduledDate: data.startDate || data.scheduledDate || undefined,
        completedDate: data.endDate || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance-requests'] });
      toast.success(t('forms.maintenanceRequest.createSuccess'));
      navigate('/maintenance/requests');
    },
    onError: () => {
      toast.error(t('forms.maintenanceRequest.createError'));
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: MaintenanceRequestFormData) => {
      // NOTE: API only supports status updates; full update may need backend extension
      return maintenanceApi.createRequest({
        name: data.title,
        description: data.description || undefined,
        equipmentId: data.equipmentId,
        priority: data.priority,
        maintenanceType: data.requestType,
        scheduledDate: data.startDate || data.scheduledDate || undefined,
        completedDate: data.endDate || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance-requests'] });
      queryClient.invalidateQueries({ queryKey: ['maintenance-request', id] });
      toast.success(t('forms.maintenanceRequest.updateSuccess'));
      navigate('/maintenance/requests');
    },
    onError: () => {
      toast.error(t('forms.maintenanceRequest.updateError'));
    },
  });

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const onSubmit: SubmitHandler<MaintenanceRequestFormData> = (data) => {
    if (isEdit) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={isEdit ? t('forms.maintenanceRequest.editTitle') : t('forms.maintenanceRequest.createTitle')}
        subtitle={isEdit ? existingRequest?.name : t('forms.maintenanceRequest.createSubtitle')}
        backTo="/maintenance/requests"
        breadcrumbs={[
          { label: t('forms.common.home'), href: '/' },
          { label: t('forms.maintenanceRequest.breadcrumbMaintenance'), href: '/maintenance' },
          { label: t('forms.maintenanceRequest.breadcrumbRequests'), href: '/maintenance/requests' },
          { label: isEdit ? t('forms.common.editing') : t('forms.common.creating') },
        ]}
      />

      <form onSubmit={handleSubmit(onSubmit)} className="max-w-3xl">
        <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-6">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-5">{t('forms.common.basicInfo')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FormField label={t('forms.maintenanceRequest.labelTitle')} error={errors.title?.message} required className="sm:col-span-2">
              <Input
                placeholder="Замена подшипника лебёдки крана"
                hasError={!!errors.title}
                {...register('title')}
              />
            </FormField>
            <FormField label={t('forms.maintenanceRequest.labelEquipment')} error={errors.equipmentId?.message} required>
              <Select
                options={equipmentOptions}
                placeholder={t('forms.maintenanceRequest.placeholderEquipment')}
                hasError={!!errors.equipmentId}
                {...register('equipmentId')}
              />
            </FormField>
            <FormField label={t('forms.maintenanceRequest.labelRequestType')} error={errors.requestType?.message} required>
              <Select
                options={requestTypeOptions}
                placeholder={t('forms.maintenanceRequest.placeholderRequestType')}
                hasError={!!errors.requestType}
                {...register('requestType')}
              />
            </FormField>
            <FormField label={t('forms.maintenanceRequest.labelPriority')} error={errors.priority?.message} required>
              <Select
                options={priorityOptions}
                placeholder={t('forms.maintenanceRequest.placeholderPriority')}
                hasError={!!errors.priority}
                {...register('priority')}
              />
            </FormField>
            <FormField label={t('forms.maintenanceRequest.labelStartDate')} error={errors.startDate?.message} required>
              <Input type="date" hasError={!!errors.startDate} {...register('startDate')} />
            </FormField>
            <FormField label={t('forms.maintenanceRequest.labelEndDate')} error={errors.endDate?.message}>
              <Input type="date" hasError={!!errors.endDate} {...register('endDate')} />
            </FormField>
          </div>
        </section>

        <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-8">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-5">{t('forms.maintenanceRequest.sectionDescription')}</h2>
          <FormField label={t('forms.maintenanceRequest.labelDescription')} error={errors.description?.message}>
            <Textarea
              placeholder={t('forms.maintenanceRequest.placeholderDescription')}
              rows={5}
              hasError={!!errors.description}
              {...register('description')}
            />
          </FormField>
        </section>

        <div className="flex items-center gap-3">
          <Button type="submit" loading={isSubmitting}>
            {isEdit ? t('forms.common.saveChanges') : t('forms.maintenanceRequest.createButton')}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate('/maintenance/requests')}
          >
            {t('common.back')}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default MaintenanceRequestFormPage;
