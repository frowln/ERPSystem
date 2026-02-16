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
import { selfEmployedApi } from './api';
import { t } from '@/i18n';

const schema = z.object({
  fullName: z.string().min(1, t('forms.contractor.validation.fullNameRequired')).max(300),
  inn: z.string()
    .min(12, t('forms.contractor.validation.innLength'))
    .max(12, t('forms.contractor.validation.innLength'))
    .regex(/^\d{12}$/, t('forms.contractor.validation.innFormat')),
  phone: z.string().max(30).optional(),
  email: z.string().email(t('forms.contractor.validation.emailInvalid')).optional().or(z.literal('')),
  bankAccount: z.string().max(30).optional(),
  bankName: z.string().max(200).optional(),
  bankBik: z.string().max(9).optional(),
  specialization: z.string().max(200).optional(),
  notes: z.string().max(2000).optional(),
});

type FormData = z.input<typeof schema>;

const ContractorFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEdit = !!id;

  const { data: existing } = useQuery({
    queryKey: ['self-employed-contractor', id],
    queryFn: () => selfEmployedApi.getContractor(id!),
    enabled: isEdit,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: existing
      ? {
          fullName: existing.fullName,
          inn: existing.inn,
          phone: existing.phone ?? '',
          email: existing.email ?? '',
          bankAccount: existing.bankAccount ?? '',
          bankName: existing.bankName ?? '',
          bankBik: existing.bankBik ?? '',
          specialization: existing.specialization ?? '',
          notes: existing.notes ?? '',
        }
      : {
          fullName: '', inn: '', phone: '', email: '',
          bankAccount: '', bankName: '', bankBik: '',
          specialization: '', notes: '',
        },
  });

  const createMutation = useMutation({
    mutationFn: (data: FormData) => selfEmployedApi.createContractor(data as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['self-employed-contractors'] });
      toast.success(t('forms.contractor.createSuccess'));
      navigate('/self-employed');
    },
    onError: () => toast.error(t('forms.contractor.createError')),
  });

  const updateMutation = useMutation({
    mutationFn: (data: FormData) => selfEmployedApi.updateContractor(id!, data as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['self-employed-contractors'] });
      queryClient.invalidateQueries({ queryKey: ['self-employed-contractor', id] });
      toast.success(t('forms.contractor.updateSuccess'));
      navigate('/self-employed');
    },
    onError: () => toast.error(t('forms.contractor.updateError')),
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
        title={isEdit ? t('forms.contractor.editTitle') : t('forms.contractor.createTitle')}
        subtitle={isEdit ? existing?.fullName : t('forms.contractor.createSubtitle')}
        backTo="/self-employed"
        breadcrumbs={[
          { label: t('forms.common.home'), href: '/' },
          { label: t('forms.contractor.breadcrumbSelfEmployed'), href: '/self-employed' },
          { label: isEdit ? t('forms.common.editing') : t('forms.common.creating') },
        ]}
      />

      <form onSubmit={handleSubmit(onSubmit)} className="max-w-3xl">
        <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-6">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-5">{t('forms.contractor.sectionPersonal')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FormField label={t('forms.contractor.labelFullName')} error={errors.fullName?.message} required className="sm:col-span-2">
              <Input placeholder="Козлов Андрей Павлович" hasError={!!errors.fullName} {...register('fullName')} />
            </FormField>
            <FormField label={t('forms.contractor.labelInn')} error={errors.inn?.message} required>
              <Input placeholder="773456789012" maxLength={12} hasError={!!errors.inn} {...register('inn')} />
            </FormField>
            <FormField label={t('forms.contractor.labelSpecialization')} error={errors.specialization?.message}>
              <Input placeholder="Электромонтаж" hasError={!!errors.specialization} {...register('specialization')} />
            </FormField>
            <FormField label={t('forms.contractor.labelPhone')} error={errors.phone?.message}>
              <Input placeholder="+7 (903) 123-45-67" hasError={!!errors.phone} {...register('phone')} />
            </FormField>
            <FormField label={t('forms.contractor.labelEmail')} error={errors.email?.message}>
              <Input type="email" placeholder="email@example.com" hasError={!!errors.email} {...register('email')} />
            </FormField>
          </div>
        </section>

        <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-6">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-5">{t('forms.contractor.sectionBank')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FormField label={t('forms.contractor.labelBankAccount')} error={errors.bankAccount?.message}>
              <Input placeholder="40802810..." hasError={!!errors.bankAccount} {...register('bankAccount')} />
            </FormField>
            <FormField label={t('forms.contractor.labelBik')} error={errors.bankBik?.message}>
              <Input placeholder="044525225" maxLength={9} hasError={!!errors.bankBik} {...register('bankBik')} />
            </FormField>
            <FormField label={t('forms.contractor.labelBankName')} error={errors.bankName?.message} className="sm:col-span-2">
              <Input placeholder="ПАО Сбербанк" hasError={!!errors.bankName} {...register('bankName')} />
            </FormField>
          </div>
        </section>

        <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-8">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-5">{t('forms.contractor.sectionAdditional')}</h2>
          <FormField label={t('forms.contractor.labelNotes')} error={errors.notes?.message}>
            <Textarea placeholder={t('forms.contractor.placeholderNotes')} rows={4} hasError={!!errors.notes} {...register('notes')} />
          </FormField>
        </section>

        <div className="flex items-center gap-3">
          <Button type="submit" loading={isSubmitting}>
            {isEdit ? t('forms.common.saveChanges') : t('forms.contractor.createButton')}
          </Button>
          <Button type="button" variant="secondary" onClick={() => navigate('/self-employed')}>
            {t('common.cancel')}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ContractorFormPage;
