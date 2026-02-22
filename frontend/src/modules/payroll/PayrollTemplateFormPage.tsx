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
import { payrollApi } from './api';
import { t } from '@/i18n';

const schema = z.object({
  code: z.string().min(1, t('forms.payrollTemplate.validation.codeRequired')).max(50),
  name: z.string().min(1, t('forms.payrollTemplate.validation.nameRequired')).max(300),
  description: z.string().max(2000).optional(),
  type: z.string().min(1, t('forms.payrollTemplate.validation.typeRequired')),
  baseSalary: z.string().transform((v) => Number(v.replace(/\s/g, '')) || 0),
  hourlyRate: z.string().transform((v) => Number(v.replace(/\s/g, '')) || 0),
  overtimeMultiplier: z.string().transform((v) => Number(v.replace(',', '.')) || 1.5),
  nightShiftMultiplier: z.string().transform((v) => Number(v.replace(',', '.')) || 1.2),
  holidayMultiplier: z.string().transform((v) => Number(v.replace(',', '.')) || 2.0),
  regionalCoefficient: z.string().transform((v) => Number(v.replace(',', '.')) || 1.0),
  northernAllowance: z.string().transform((v) => Number(v.replace(',', '.')) || 0),
});

type FormData = z.input<typeof schema>;

const typeOptions = [
  { value: 'SALARY', label: t('forms.payrollTemplate.types.salary') },
  { value: 'HOURLY', label: t('forms.payrollTemplate.types.hourly') },
  { value: 'PIECE_RATE', label: t('forms.payrollTemplate.types.pieceRate') },
  { value: 'MIXED', label: t('forms.payrollTemplate.types.mixed') },
];

const PayrollTemplateFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEdit = !!id;

  const { data: existing } = useQuery({
    queryKey: ['payroll-template', id],
    queryFn: () => payrollApi.getTemplate(id!),
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
          code: existing.code,
          name: existing.name,
          description: existing.description ?? '',
          type: existing.type,
          baseSalary: String(existing.baseSalary),
          hourlyRate: String(existing.hourlyRate),
          overtimeMultiplier: String(existing.overtimeMultiplier),
          nightShiftMultiplier: String(existing.nightShiftMultiplier),
          holidayMultiplier: String(existing.holidayMultiplier),
          regionalCoefficient: String(existing.regionalCoefficient),
          northernAllowance: String(existing.northernAllowance),
        }
      : {
          code: '', name: '', description: '', type: '',
          baseSalary: '', hourlyRate: '',
          overtimeMultiplier: '1.5', nightShiftMultiplier: '1.2',
          holidayMultiplier: '2.0', regionalCoefficient: '1.0',
          northernAllowance: '0',
        },
  });

  const createMutation = useMutation({
    mutationFn: (data: FormData) => payrollApi.createTemplate(data as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll-templates'] });
      toast.success(t('forms.payrollTemplate.createSuccess'));
      navigate('/payroll');
    },
    onError: () => toast.error(t('forms.payrollTemplate.createError')),
  });

  const updateMutation = useMutation({
    mutationFn: (data: FormData) => payrollApi.updateTemplate(id!, data as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll-templates'] });
      queryClient.invalidateQueries({ queryKey: ['payroll-template', id] });
      toast.success(t('forms.payrollTemplate.updateSuccess'));
      navigate('/payroll');
    },
    onError: () => toast.error(t('forms.payrollTemplate.updateError')),
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
        title={isEdit ? t('forms.payrollTemplate.editTitle') : t('forms.payrollTemplate.createTitle')}
        subtitle={isEdit ? existing?.name : t('forms.payrollTemplate.createSubtitle')}
        backTo="/payroll"
        breadcrumbs={[
          { label: t('forms.common.home'), href: '/' },
          { label: t('forms.payrollTemplate.breadcrumbPayroll'), href: '/payroll' },
          { label: isEdit ? t('forms.common.editing') : t('forms.common.creating') },
        ]}
      />

      <form onSubmit={handleSubmit(onSubmit)} className="max-w-3xl">
        <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-6">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-5">{t('forms.common.basicInfo')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FormField label={t('forms.payrollTemplate.labelCode')} error={errors.code?.message} required>
              <Input placeholder={t('forms.payrollTemplate.placeholderCode')} hasError={!!errors.code} {...register('code')} />
            </FormField>
            <FormField label={t('forms.payrollTemplate.labelType')} error={errors.type?.message} required>
              <Select options={typeOptions} placeholder={t('forms.payrollTemplate.placeholderType')} hasError={!!errors.type} {...register('type')} />
            </FormField>
            <FormField label={t('forms.payrollTemplate.labelName')} error={errors.name?.message} required className="sm:col-span-2">
              <Input placeholder={t('forms.payrollTemplate.placeholderName')} hasError={!!errors.name} {...register('name')} />
            </FormField>
          </div>
        </section>

        <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-6">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-5">{t('forms.payrollTemplate.sectionRates')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FormField label={t('forms.payrollTemplate.labelBaseSalary')} error={errors.baseSalary?.message}>
              <Input type="text" inputMode="numeric" placeholder="120000" hasError={!!errors.baseSalary} {...register('baseSalary')} />
            </FormField>
            <FormField label={t('forms.payrollTemplate.labelHourlyRate')} error={errors.hourlyRate?.message}>
              <Input type="text" inputMode="numeric" placeholder="850" hasError={!!errors.hourlyRate} {...register('hourlyRate')} />
            </FormField>
          </div>
        </section>

        <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-6">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-5">{t('forms.payrollTemplate.sectionMultipliers')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <FormField label={t('forms.payrollTemplate.labelOvertimeMultiplier')} error={errors.overtimeMultiplier?.message}>
              <Input type="text" inputMode="decimal" placeholder="1.5" hasError={!!errors.overtimeMultiplier} {...register('overtimeMultiplier')} />
            </FormField>
            <FormField label={t('forms.payrollTemplate.labelNightShiftMultiplier')} error={errors.nightShiftMultiplier?.message}>
              <Input type="text" inputMode="decimal" placeholder="1.2" hasError={!!errors.nightShiftMultiplier} {...register('nightShiftMultiplier')} />
            </FormField>
            <FormField label={t('forms.payrollTemplate.labelHolidayMultiplier')} error={errors.holidayMultiplier?.message}>
              <Input type="text" inputMode="decimal" placeholder="2.0" hasError={!!errors.holidayMultiplier} {...register('holidayMultiplier')} />
            </FormField>
            <FormField label={t('forms.payrollTemplate.labelRegionalCoefficient')} error={errors.regionalCoefficient?.message}>
              <Input type="text" inputMode="decimal" placeholder="1.0" hasError={!!errors.regionalCoefficient} {...register('regionalCoefficient')} />
            </FormField>
            <FormField label={t('forms.payrollTemplate.labelNorthernAllowance')} error={errors.northernAllowance?.message}>
              <Input type="text" inputMode="decimal" placeholder="0" hasError={!!errors.northernAllowance} {...register('northernAllowance')} />
            </FormField>
          </div>
        </section>

        <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-8">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-5">{t('forms.payrollTemplate.sectionAdditional')}</h2>
          <FormField label={t('forms.payrollTemplate.labelDescription')} error={errors.description?.message}>
            <Textarea placeholder={t('forms.payrollTemplate.placeholderDescription')} rows={4} hasError={!!errors.description} {...register('description')} />
          </FormField>
        </section>

        <div className="flex items-center gap-3">
          <Button type="submit" loading={isSubmitting}>
            {isEdit ? t('forms.common.saveChanges') : t('forms.payrollTemplate.createButton')}
          </Button>
          <Button type="button" variant="secondary" onClick={() => navigate('/payroll')}>
            {t('common.cancel')}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default PayrollTemplateFormPage;
