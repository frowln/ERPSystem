import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { FormField, Input, Textarea, Select } from '@/design-system/components/FormField';
import { contractsApi } from '@/api/contracts';
import { formatMoney } from '@/lib/format';
import { t } from '@/i18n';

const contractSchema = z.object({
  name: z.string().min(1, t('forms.contract.validation.nameRequired')).max(300, t('forms.common.maxChars', { count: '300' })),
  number: z.string().min(1, t('forms.contract.validation.numberRequired')).max(50, t('forms.common.maxChars', { count: '50' })),
  contractDate: z.string().min(1, t('forms.contract.validation.dateRequired')),
  partnerId: z.string().min(1, t('forms.contract.validation.partnerRequired')),
  projectId: z.string().min(1, t('forms.contract.validation.projectRequired')),
  typeId: z.string().min(1, t('forms.contract.validation.typeRequired')),
  amount: z
    .string()
    .min(1, t('forms.contract.validation.amountRequired'))
    .transform((val) => Number(val.replace(/\s/g, '')))
    .refine((val) => val > 0, t('forms.contract.validation.amountPositive')),
  vatRate: z.string().transform((val) => Number(val)),
  paymentTerms: z.string().max(500, t('forms.common.maxChars', { count: '500' })).optional(),
  plannedStartDate: z.string().min(1, t('forms.contract.validation.startDateRequired')),
  plannedEndDate: z.string().min(1, t('forms.contract.validation.endDateRequired')),
  retentionPercent: z.string().transform((val) => Number(val)).optional(),
  notes: z.string().max(2000, t('forms.common.maxChars', { count: '2000' })).optional(),
});

type ContractFormData = z.input<typeof contractSchema>;

// Mock data — will be replaced by API data
const getPartnerOptions = () => [
  { value: 'p1', label: t('common.mockVendors.stroyMontazh') },
  { value: 'p2', label: t('common.mockVendors.elektroStroy') },
  { value: 'p3', label: t('common.mockVendors.betonServis') },
  { value: 'p4', label: t('common.mockVendors.proektGrupp') },
  { value: 'p5', label: t('common.mockVendors.dorStroy') },
  { value: 'p6', label: t('common.mockVendors.krovlyaPro') },
  { value: 'p7', label: t('common.mockVendors.metallTrade') },
];

// Mock data — will be replaced by API data
const getProjectOptions = () => [
  { value: '1', label: t('common.mockProjects.solnechny') },
  { value: '2', label: t('common.mockProjects.gorizont') },
  { value: '3', label: t('common.mockProjects.mostVyatka') },
  { value: '6', label: t('common.mockProjects.tsentralny') },
];

const typeOptions = [
  { value: 't1', label: t('forms.contract.contractTypes.general') },
  { value: 't2', label: t('forms.contract.contractTypes.subcontract') },
  { value: 't3', label: t('forms.contract.contractTypes.supply') },
  { value: 't4', label: t('forms.contract.contractTypes.design') },
  { value: 't5', label: t('forms.contract.contractTypes.services') },
];

const vatRateOptions = [
  { value: '20', label: '20%' },
  { value: '10', label: '10%' },
  { value: '0', label: '0%' },
];

const ContractFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEdit = !!id;

  const { data: existingContract } = useQuery({
    queryKey: [ 'CONTRACT', id],
    queryFn: () => contractsApi.getContract(id!),
    enabled: isEdit,
  });

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<ContractFormData>({
    resolver: zodResolver(contractSchema),
    defaultValues: existingContract
      ? {
          name: existingContract.name,
          number: existingContract.number,
          contractDate: existingContract.contractDate,
          partnerId: existingContract.partnerId,
          projectId: existingContract.projectId,
          typeId: existingContract.typeId,
          amount: String(existingContract.amount),
          vatRate: String(existingContract.vatRate),
          paymentTerms: existingContract.paymentTerms ?? '',
          plannedStartDate: existingContract.plannedStartDate ?? '',
          plannedEndDate: existingContract.plannedEndDate ?? '',
          retentionPercent: String(existingContract.retentionPercent),
          notes: existingContract.notes ?? '',
        }
      : {
          name: '',
          number: '',
          contractDate: '',
          partnerId: '',
          projectId: '',
          typeId: '',
          amount: '',
          vatRate: '20',
          paymentTerms: '',
          plannedStartDate: '',
          plannedEndDate: '',
          retentionPercent: '5',
          notes: '',
        },
  });

  const amountValue = useWatch({ control, name: 'amount' });
  const vatRateValue = useWatch({ control, name: 'vatRate' });

  const numericAmount = Number(String(amountValue).replace(/\s/g, '')) || 0;
  const numericVatRate = Number(vatRateValue) || 0;
  const vatAmount = numericAmount * numericVatRate / 100;
  const totalWithVat = numericAmount + vatAmount;

  const createMutation = useMutation({
    mutationFn: (data: ContractFormData) => {
      return contractsApi.createContract(data as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['CONTRACTS'] });
      toast.success(t('forms.contract.createSuccess'));
      navigate('/contracts');
    },
    onError: () => {
      toast.error(t('forms.contract.createError'));
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: ContractFormData) => {
      return contractsApi.updateContract(id!, data as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['CONTRACTS'] });
      queryClient.invalidateQueries({ queryKey: [ 'CONTRACT', id] });
      toast.success(t('forms.contract.updateSuccess'));
      navigate(`/contracts/${id}`);
    },
    onError: () => {
      toast.error(t('forms.contract.updateError'));
    },
  });

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const onSubmit = (data: ContractFormData) => {
    if (isEdit) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={isEdit ? t('forms.contract.editTitle') : t('forms.contract.createTitle')}
        subtitle={isEdit ? existingContract?.name : t('forms.contract.createSubtitle')}
        backTo={isEdit ? `/contracts/${id}` : '/contracts'}
        breadcrumbs={[
          { label: t('forms.common.home'), href: '/' },
          { label: t('forms.contract.breadcrumbContracts'), href: '/contracts' },
          { label: isEdit ? t('forms.common.editing') : t('forms.common.creating') },
        ]}
      />

      <form onSubmit={handleSubmit(onSubmit)} className="max-w-3xl">
        {/* Section: Basic info */}
        <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-6">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-5">{t('forms.common.basicInfo')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FormField label={t('forms.contract.labelNumber')} error={errors.number?.message} required>
              <Input
                placeholder={t('forms.contract.placeholderNumber')}
                hasError={!!errors.number}
                {...register('number')}
              />
            </FormField>
            <FormField label={t('forms.contract.labelDate')} error={errors.contractDate?.message} required>
              <Input
                type="date"
                hasError={!!errors.contractDate}
                {...register('contractDate')}
              />
            </FormField>
            <FormField label={t('forms.contract.labelName')} error={errors.name?.message} required className="sm:col-span-2">
              <Input
                placeholder={t('forms.contract.placeholderName')}
                hasError={!!errors.name}
                {...register('name')}
              />
            </FormField>
            <FormField label={t('forms.contract.labelPartner')} error={errors.partnerId?.message} required>
              <Select
                options={getPartnerOptions()}
                placeholder={t('forms.contract.placeholderPartner')}
                hasError={!!errors.partnerId}
                {...register('partnerId')}
              />
            </FormField>
            <FormField label={t('forms.contract.labelProject')} error={errors.projectId?.message} required>
              <Select
                options={getProjectOptions()}
                placeholder={t('forms.dailyLog.placeholderProject')}
                hasError={!!errors.projectId}
                {...register('projectId')}
              />
            </FormField>
            <FormField label={t('forms.contract.labelType')} error={errors.typeId?.message} required>
              <Select
                options={typeOptions}
                placeholder={t('forms.calendarEvent.placeholderEventType')}
                hasError={!!errors.typeId}
                {...register('typeId')}
              />
            </FormField>
          </div>
        </section>

        {/* Section: Dates */}
        <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-6">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-5">{t('forms.contract.sectionDates')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FormField label={t('forms.contract.labelPlannedStart')} error={errors.plannedStartDate?.message} required>
              <Input
                type="date"
                hasError={!!errors.plannedStartDate}
                {...register('plannedStartDate')}
              />
            </FormField>
            <FormField label={t('forms.contract.labelPlannedEnd')} error={errors.plannedEndDate?.message} required>
              <Input
                type="date"
                hasError={!!errors.plannedEndDate}
                {...register('plannedEndDate')}
              />
            </FormField>
          </div>
        </section>

        {/* Section: Cost */}
        <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-6">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-5">{t('forms.contract.sectionCost')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FormField
              label={t('forms.contract.labelAmountExVat')}
              error={errors.amount?.message}
              required
            >
              <Input
                type="text"
                inputMode="numeric"
                placeholder="850000000"
                hasError={!!errors.amount}
                {...register('amount')}
              />
            </FormField>
            <FormField label={t('forms.contract.labelVatRate')} error={errors.vatRate?.message}>
              <Select
                options={vatRateOptions}
                hasError={!!errors.vatRate}
                {...register('vatRate')}
              />
            </FormField>
          </div>

          {/* Auto-calculated fields */}
          {numericAmount > 0 && (
            <div className="mt-4 pt-4 border-t border-neutral-100 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-0.5">{t('forms.contract.previewAmountExVat')}</p>
                <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300 tabular-nums">{formatMoney(numericAmount)}</p>
              </div>
              <div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-0.5">{t('forms.contract.previewVat', { rate: String(numericVatRate) })}</p>
                <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300 tabular-nums">{formatMoney(vatAmount)}</p>
              </div>
              <div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-0.5">{t('forms.contract.previewTotal')}</p>
                <p className="text-sm font-semibold text-primary-700 tabular-nums">{formatMoney(totalWithVat)}</p>
              </div>
            </div>
          )}
        </section>

        {/* Section: Additional */}
        <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-8">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-5">{t('forms.contract.sectionAdditional')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FormField label={t('forms.contract.labelPaymentTerms')} error={errors.paymentTerms?.message}>
              <Input
                placeholder={t('forms.contract.placeholderPaymentTerms')}
                hasError={!!errors.paymentTerms}
                {...register('paymentTerms')}
              />
            </FormField>
            <FormField label={t('forms.contract.labelRetention')} error={errors.retentionPercent?.message}>
              <Input
                type="text"
                inputMode="numeric"
                placeholder="5"
                hasError={!!errors.retentionPercent}
                {...register('retentionPercent')}
              />
            </FormField>
            <FormField
              label={t('common.notes')}
              error={errors.notes?.message}
              className="sm:col-span-2"
            >
              <Textarea
                placeholder={t('forms.contract.placeholderNotes')}
                rows={4}
                hasError={!!errors.notes}
                {...register('notes')}
              />
            </FormField>
          </div>
        </section>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Button type="submit" loading={isSubmitting}>
            {isEdit ? t('forms.common.saveChanges') : t('forms.contract.createButton')}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate(isEdit ? `/contracts/${id}` : '/contracts')}
          >
            {t('common.cancel')}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ContractFormPage;
