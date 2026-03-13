import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { FormField, Input, Textarea, Select } from '@/design-system/components/FormField';
import { selfEmployedApi } from './api';
import { t } from '@/i18n';

const getContractTypeOptions = () => [
  { value: 'GPC', label: t('selfEmployed.form.contractTypeGpc') },
  { value: 'SERVICE', label: t('selfEmployed.form.contractTypeService') },
  { value: 'SUBCONTRACT', label: t('selfEmployed.form.contractTypeSubcontract') },
];

const schema = z.object({
  fullName: z.string().min(1).max(300),
  inn: z.string()
    .min(12)
    .max(12)
    .regex(/^\d{12}$/),
  phone: z.string().max(30).optional().or(z.literal('')),
  email: z.string().email().optional().or(z.literal('')),
  contractType: z.enum(['GPC', 'SERVICE', 'SUBCONTRACT']),
  contractNumber: z.string().max(50).optional().or(z.literal('')),
  contractStartDate: z.string().optional().or(z.literal('')),
  contractEndDate: z.string().optional().or(z.literal('')),
  hourlyRate: z.coerce.number().min(0).optional().or(z.literal('')),
  bankAccount: z.string().max(30).optional().or(z.literal('')),
  bankName: z.string().max(200).optional().or(z.literal('')),
  bankBik: z.string().max(9).optional().or(z.literal('')),
  specialization: z.string().max(200).optional().or(z.literal('')),
  notes: z.string().max(2000).optional().or(z.literal('')),
});

type FormData = z.input<typeof schema>;

const ContractorFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEdit = !!id;

  const { data: existing, isSuccess: isLoaded } = useQuery({
    queryKey: ['self-employed-contractor', id],
    queryFn: () => selfEmployedApi.getContractor(id!),
    enabled: isEdit,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: '', inn: '', phone: '', email: '',
      contractType: 'GPC', contractNumber: '',
      contractStartDate: '', contractEndDate: '',
      hourlyRate: '',
      bankAccount: '', bankName: '', bankBik: '',
      specialization: '', notes: '',
    },
  });

  useEffect(() => {
    if (isEdit && isLoaded && existing) {
      reset({
        fullName: existing.fullName,
        inn: existing.inn,
        phone: existing.phone ?? '',
        email: existing.email ?? '',
        contractType: existing.contractType ?? 'GPC',
        contractNumber: existing.contractNumber ?? '',
        contractStartDate: existing.contractStartDate ?? '',
        contractEndDate: existing.contractEndDate ?? '',
        hourlyRate: existing.hourlyRate ?? '',
        bankAccount: existing.bankAccount ?? '',
        bankName: existing.bankName ?? '',
        bankBik: existing.bankBik ?? '',
        specialization: existing.specialization ?? '',
        notes: existing.notes ?? '',
      });
    }
  }, [isEdit, isLoaded, existing, reset]);

  const createMutation = useMutation({
    mutationFn: (data: FormData) => selfEmployedApi.createContractor({
      ...data,
      hourlyRate: data.hourlyRate ? Number(data.hourlyRate) : undefined,
    } as Record<string, unknown>),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['self-employed-contractors'] });
      toast.success(t('selfEmployed.form.createSuccess'));
      navigate('/self-employed');
    },
    onError: () => toast.error(t('selfEmployed.form.createError')),
  });

  const updateMutation = useMutation({
    mutationFn: (data: FormData) => selfEmployedApi.updateContractor(id!, {
      ...data,
      hourlyRate: data.hourlyRate ? Number(data.hourlyRate) : undefined,
    } as Record<string, unknown>),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['self-employed-contractors'] });
      queryClient.invalidateQueries({ queryKey: ['self-employed-contractor', id] });
      toast.success(t('selfEmployed.form.updateSuccess'));
      navigate(`/self-employed/${id}`);
    },
    onError: () => toast.error(t('selfEmployed.form.updateError')),
  });

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const onSubmit = (data: FormData) => {
    if (isEdit) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={isEdit ? t('selfEmployed.form.editTitle') : t('selfEmployed.form.createTitle')}
        subtitle={isEdit ? existing?.fullName : t('selfEmployed.form.createSubtitle')}
        backTo={isEdit ? `/self-employed/${id}` : '/self-employed'}
        breadcrumbs={[
          { label: t('common.home'), href: '/' },
          { label: t('selfEmployed.contractors.breadcrumbSelfEmployed'), href: '/self-employed' },
          ...(isEdit && existing ? [{ label: existing.fullName, href: `/self-employed/${id}` }] : []),
          { label: isEdit ? t('forms.common.editing') : t('forms.common.creating') },
        ]}
      />

      <form onSubmit={handleSubmit(onSubmit)} className="max-w-3xl">
        {/* Personal Data */}
        <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-6">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-5">
            {t('selfEmployed.form.sectionPersonal')}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FormField label={t('selfEmployed.form.labelFullName')} error={errors.fullName?.message} required className="sm:col-span-2">
              <Input placeholder={t('selfEmployed.form.placeholderFullName')} hasError={!!errors.fullName} {...register('fullName')} />
            </FormField>
            <FormField label={t('selfEmployed.form.labelInn')} error={errors.inn?.message} required>
              <Input placeholder="773456789012" maxLength={12} hasError={!!errors.inn} {...register('inn')} />
            </FormField>
            <FormField label={t('selfEmployed.form.labelSpecialization')} error={errors.specialization?.message}>
              <Input placeholder={t('selfEmployed.form.placeholderSpecialization')} hasError={!!errors.specialization} {...register('specialization')} />
            </FormField>
            <FormField label={t('selfEmployed.form.labelPhone')} error={errors.phone?.message}>
              <Input placeholder="+7 (903) 123-45-67" hasError={!!errors.phone} {...register('phone')} />
            </FormField>
            <FormField label={t('selfEmployed.form.labelEmail')} error={errors.email?.message}>
              <Input type="email" placeholder="email@example.com" hasError={!!errors.email} {...register('email')} />
            </FormField>
          </div>
        </section>

        {/* Contract Data */}
        <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-6">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-5">
            {t('selfEmployed.form.sectionContract')}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FormField label={t('selfEmployed.form.labelContractType')} error={errors.contractType?.message} required>
              <Select options={getContractTypeOptions()} hasError={!!errors.contractType} {...register('contractType')} />
            </FormField>
            <FormField label={t('selfEmployed.form.labelContractNumber')} error={errors.contractNumber?.message}>
              <Input placeholder={t('selfEmployed.form.placeholderContractNumber')} hasError={!!errors.contractNumber} {...register('contractNumber')} />
            </FormField>
            <FormField label={t('selfEmployed.form.labelContractStartDate')} error={errors.contractStartDate?.message}>
              <Input type="date" hasError={!!errors.contractStartDate} {...register('contractStartDate')} />
            </FormField>
            <FormField label={t('selfEmployed.form.labelContractEndDate')} error={errors.contractEndDate?.message}>
              <Input type="date" hasError={!!errors.contractEndDate} {...register('contractEndDate')} />
            </FormField>
            <FormField label={t('selfEmployed.form.labelHourlyRate')} error={errors.hourlyRate?.message}>
              <Input type="number" min={0} step="0.01" placeholder="1500" hasError={!!errors.hourlyRate} {...register('hourlyRate')} />
            </FormField>
          </div>
        </section>

        {/* Bank Details */}
        <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-6">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-5">
            {t('selfEmployed.form.sectionBank')}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FormField label={t('selfEmployed.form.labelBankAccount')} error={errors.bankAccount?.message}>
              <Input placeholder="40802810..." hasError={!!errors.bankAccount} {...register('bankAccount')} />
            </FormField>
            <FormField label={t('selfEmployed.form.labelBik')} error={errors.bankBik?.message}>
              <Input placeholder="044525225" maxLength={9} hasError={!!errors.bankBik} {...register('bankBik')} />
            </FormField>
            <FormField label={t('selfEmployed.form.labelBankName')} error={errors.bankName?.message} className="sm:col-span-2">
              <Input placeholder={t('selfEmployed.form.placeholderBankName')} hasError={!!errors.bankName} {...register('bankName')} />
            </FormField>
          </div>
        </section>

        {/* Additional */}
        <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-8">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-5">
            {t('selfEmployed.form.sectionAdditional')}
          </h2>
          <FormField label={t('selfEmployed.form.labelNotes')} error={errors.notes?.message}>
            <Textarea placeholder={t('selfEmployed.form.placeholderNotes')} rows={4} hasError={!!errors.notes} {...register('notes')} />
          </FormField>
        </section>

        <div className="flex items-center gap-3">
          <Button type="submit" loading={isSubmitting}>
            {isEdit ? t('forms.common.saveChanges') : t('selfEmployed.form.createButton')}
          </Button>
          <Button type="button" variant="secondary" onClick={() => navigate(isEdit ? `/self-employed/${id}` : '/self-employed')}>
            {t('common.cancel')}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ContractorFormPage;
