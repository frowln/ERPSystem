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
import { crmApi } from '@/api/crm';
import { t } from '@/i18n';

const crmLeadSchema = z.object({
  name: z.string().min(1, 'Название лида обязательно').max(300),
  companyName: z.string().max(200, t('forms.common.maxChars', { count: '200' })).optional(),
  contactName: z.string().min(1, t('forms.crmLead.validation.contactNameRequired')).max(200, t('forms.common.maxChars', { count: '200' })),
  email: z
    .string()
    .optional()
    .refine(
      (val) => !val || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val),
      t('forms.crmLead.validation.emailInvalid'),
    ),
  phone: z
    .string()
    .optional()
    .refine(
      (val) => !val || /^[\d+\-() ]+$/.test(val),
      t('forms.crmLead.validation.phoneInvalid'),
    ),
  source: z.string().max(100, t('forms.common.maxChars', { count: '100' })).optional(),
  estimatedValue: z
    .string()
    .optional()
    .transform((val) => (val ? Number(val.replace(/\s/g, '')) : undefined))
    .refine((val) => val === undefined || val >= 0, t('forms.crmLead.validation.amountPositive')),
  probability: z
    .string()
    .optional()
    .transform((val) => (val ? Number(val) : undefined))
    .refine((val) => val === undefined || (val >= 0 && val <= 100), t('forms.crmLead.validation.probabilityRange')),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH']).optional(),
  notes: z.string().max(2000, t('forms.common.maxChars', { count: '2000' })).optional(),
});

type CrmLeadFormData = z.input<typeof crmLeadSchema>;

const priorityOptions = [
  { value: 'LOW', label: 'Низкий' },
  { value: 'NORMAL', label: 'Обычный' },
  { value: 'HIGH', label: 'Высокий' },
];

const sourceOptions = [
  { value: '', label: t('forms.crmLead.sourceNotSpecified') },
  { value: 'website', label: t('forms.crmLead.sources.website') },
  { value: 'referral', label: t('forms.crmLead.sources.referral') },
  { value: 'cold_call', label: t('forms.crmLead.sources.coldCall') },
  { value: 'exhibition', label: t('forms.crmLead.sources.exhibition') },
  { value: 'tender', label: t('forms.crmLead.sources.tender') },
  { value: 'social', label: t('forms.crmLead.sources.social') },
  { value: 'OTHER', label: t('forms.crmLead.sources.other') },
];

const CrmLeadFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEdit = !!id;

  const { data: existingLead } = useQuery({
    queryKey: ['crm-lead', id],
    queryFn: () => crmApi.getLead(id!),
    enabled: isEdit,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CrmLeadFormData>({
    resolver: zodResolver(crmLeadSchema),
    defaultValues: existingLead
      ? {
          name: existingLead.name ?? '',
          companyName: existingLead.companyName ?? '',
          contactName: existingLead.partnerName ?? '',
          email: existingLead.email ?? '',
          phone: existingLead.phone ?? '',
          source: existingLead.source ?? '',
          estimatedValue: existingLead.expectedRevenue ? String(existingLead.expectedRevenue) : '',
          probability: existingLead.probability != null ? String(existingLead.probability) : '',
          priority: existingLead.priority ?? undefined,
          notes: existingLead.description ?? '',
        }
      : {
          name: '',
          companyName: '',
          contactName: '',
          email: '',
          phone: '',
          source: '',
          estimatedValue: '',
          probability: '',
          priority: 'NORMAL' as const,
          notes: '',
        },
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => {
      return crmApi.createLead({
        name: data.name,
        partnerName: data.contactName,
        companyName: data.companyName || undefined,
        email: data.email || undefined,
        phone: data.phone || undefined,
        source: data.source || undefined,
        expectedRevenue: data.estimatedValue,
        probability: data.probability,
        priority: data.priority,
        description: data.notes || undefined,
      } as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-leads'] });
      toast.success(t('forms.crmLead.createSuccess'));
      navigate('/crm/leads');
    },
    onError: () => {
      toast.error(t('forms.crmLead.createError'));
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => {
      return crmApi.updateLead(id!, {
        name: data.name,
        partnerName: data.contactName,
        companyName: data.companyName || undefined,
        email: data.email || undefined,
        phone: data.phone || undefined,
        source: data.source || undefined,
        expectedRevenue: data.estimatedValue,
        probability: data.probability,
        priority: data.priority,
        description: data.notes || undefined,
      } as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-leads'] });
      queryClient.invalidateQueries({ queryKey: ['crm-lead', id] });
      toast.success(t('forms.crmLead.updateSuccess'));
      navigate(`/crm/leads/${id}`);
    },
    onError: () => {
      toast.error(t('forms.crmLead.updateError'));
    },
  });

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const onSubmit = (data: CrmLeadFormData) => {
    if (isEdit) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={isEdit ? t('forms.crmLead.editTitle') : t('forms.crmLead.createTitle')}
        subtitle={isEdit ? existingLead?.name : t('forms.crmLead.createSubtitle')}
        backTo={isEdit ? `/crm/leads/${id}` : '/crm/leads'}
        breadcrumbs={[
          { label: t('forms.common.home'), href: '/' },
          { label: t('forms.crmLead.breadcrumbCrm'), href: '/crm' },
          { label: t('forms.crmLead.breadcrumbLeads'), href: '/crm/leads' },
          { label: isEdit ? t('forms.common.editing') : t('forms.common.creating') },
        ]}
      />

      <form onSubmit={handleSubmit(onSubmit)} className="max-w-3xl">
        <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-6">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-5">Основная информация</h2>
          <div className="grid grid-cols-1 gap-5 mb-5">
            <FormField label="Название лида" error={errors.name?.message} required>
              <Input
                placeholder="Например: ЖК Олимп Парк - Корпус 3, Генподряд"
                hasError={!!errors.name}
                {...register('name')}
              />
            </FormField>
          </div>
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-5">{t('forms.crmLead.sectionContact')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FormField label={t('forms.crmLead.labelContactName')} error={errors.contactName?.message} required>
              <Input
                placeholder={t('forms.crmLead.placeholderContactName')}
                hasError={!!errors.contactName}
                {...register('contactName')}
              />
            </FormField>
            <FormField label={t('forms.crmLead.labelCompany')} error={errors.companyName?.message}>
              <Input
                placeholder={t('forms.crmLead.placeholderCompany')}
                hasError={!!errors.companyName}
                {...register('companyName')}
              />
            </FormField>
            <FormField label={t('forms.crmLead.labelEmail')} error={errors.email?.message}>
              <Input
                type="email"
                placeholder="contact@company.ru"
                hasError={!!errors.email}
                {...register('email')}
              />
            </FormField>
            <FormField label={t('forms.crmLead.labelPhone')} error={errors.phone?.message}>
              <Input
                placeholder="+7 (999) 123-45-67"
                hasError={!!errors.phone}
                {...register('phone')}
              />
            </FormField>
          </div>
        </section>

        <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-6">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-5">{t('forms.crmLead.sectionDeal')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FormField label="Приоритет" error={errors.priority?.message}>
              <Select
                options={priorityOptions}
                hasError={!!errors.priority}
                {...register('priority')}
              />
            </FormField>
            <FormField label={t('forms.crmLead.labelSource')} error={errors.source?.message}>
              <Select
                options={sourceOptions}
                hasError={!!errors.source}
                {...register('source')}
              />
            </FormField>
            <FormField label={t('forms.crmLead.labelEstimatedValue')} error={errors.estimatedValue?.message}>
              <Input
                type="text"
                inputMode="numeric"
                placeholder="5000000"
                hasError={!!errors.estimatedValue}
                {...register('estimatedValue')}
              />
            </FormField>
            <FormField label={t('forms.crmLead.labelProbability')} error={errors.probability?.message}>
              <Input
                type="text"
                inputMode="numeric"
                placeholder="50"
                hasError={!!errors.probability}
                {...register('probability')}
              />
            </FormField>
          </div>
        </section>

        <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-8">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-5">{t('forms.crmLead.sectionAdditional')}</h2>
          <FormField label={t('forms.crmLead.labelNotes')} error={errors.notes?.message}>
            <Textarea
              placeholder={t('forms.crmLead.placeholderNotes')}
              rows={4}
              hasError={!!errors.notes}
              {...register('notes')}
            />
          </FormField>
        </section>

        <div className="flex items-center gap-3">
          <Button type="submit" loading={isSubmitting}>
            {isEdit ? t('forms.common.saveChanges') : t('forms.crmLead.createButton')}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate(isEdit ? `/crm/leads/${id}` : '/crm/leads')}
          >
            {t('common.back')}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CrmLeadFormPage;
