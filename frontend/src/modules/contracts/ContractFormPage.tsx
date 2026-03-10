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
import { projectsApi } from '@/api/projects';
import { formatMoney } from '@/lib/format';
import { t } from '@/i18n';

const contractSchema = z.object({
  name: z.string().min(1, t('forms.contract.validation.nameRequired')).max(300, t('forms.common.maxChars', { count: '300' })),
  number: z.string().min(1, t('forms.contract.validation.numberRequired')).max(50, t('forms.common.maxChars', { count: '50' })),
  contractDate: z.string().min(1, t('forms.contract.validation.dateRequired')),
  partnerId: z.string().min(1, t('forms.contract.validation.partnerRequired')),
  projectId: z.string().min(1, t('forms.contract.validation.projectRequired')),
  typeId: z.string().optional(),
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
  prepaymentPercent: z.string().transform((val) => Number(val)).optional(),
  paymentDelayDays: z.string().transform((val) => Number(val)).optional(),
  guaranteePeriodMonths: z.string().transform((val) => Number(val)).optional(),
  direction: z.string().optional(),
  procurementLaw: z.string().optional(),
  procurementMethod: z.string().optional(),
  tenderNumber: z.string().max(100).optional(),
  tenderJustification: z.string().max(2000).optional(),
  notes: z.string().max(2000, t('forms.common.maxChars', { count: '2000' })).optional(),
  insuranceType: z.string().optional(),
  insurancePolicyNumber: z.string().max(100).optional(),
  insuranceAmount: z.string().optional(),
  insuranceExpiryDate: z.string().optional(),
  performanceBondNumber: z.string().max(100).optional(),
  performanceBondAmount: z.string().optional(),
  paymentBondNumber: z.string().max(100).optional(),
  paymentBondAmount: z.string().optional(),
});

type ContractFormData = z.input<typeof contractSchema>;

const fallbackTypeOptions = [
  { value: '', label: t('forms.contract.contractTypes.general') },
  { value: '', label: t('forms.contract.contractTypes.subcontract') },
  { value: '', label: t('forms.contract.contractTypes.supply') },
  { value: '', label: t('forms.contract.contractTypes.design') },
  { value: '', label: t('forms.contract.contractTypes.services') },
];

const vatRateOptions = [
  { value: '20', label: '20%' },
  { value: '10', label: '10%' },
  { value: '0', label: '0%' },
];

const procurementLawOptions = [
  { value: '', label: t('contracts.procurement.commercial') },
  { value: '44-FZ', label: t('contracts.procurement.44fz') },
  { value: '223-FZ', label: t('contracts.procurement.223fz') },
  { value: 'COMMERCIAL', label: t('contracts.procurement.commercial') },
];

const procurementMethodOptions = [
  { value: '', label: '—' },
  { value: 'OPEN_TENDER', label: t('contracts.procurement.methodOpenTender') },
  { value: 'SINGLE_SOURCE', label: t('contracts.procurement.methodSingleSource') },
  { value: 'AUCTION', label: t('contracts.procurement.methodAuction') },
  { value: 'REQUEST', label: t('contracts.procurement.methodRequest') },
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

  const { data: contractTypesData } = useQuery({
    queryKey: ['contract-types'],
    queryFn: async () => {
      const res = await contractsApi.getContractTypes();
      return res;
    },
  });
  const typeOptions = (contractTypesData ?? []).length > 0
    ? contractTypesData!.map((ct: any) => ({ value: ct.id, label: ct.name }))
    : fallbackTypeOptions;

  const { data: counterpartiesData } = useQuery({
    queryKey: ['counterparties'],
    queryFn: () => contractsApi.getCounterparties(),
  });
  const partnerOptions = (counterpartiesData?.content ?? []).map(c => ({ value: c.id, label: c.name }));

  const { data: projectsData } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectsApi.getProjects(),
  });
  const projectOptions = (projectsData?.content ?? []).map(p => ({ value: p.id, label: p.name }));

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
          prepaymentPercent: String(existingContract.prepaymentPercent ?? 0),
          paymentDelayDays: String(existingContract.paymentDelayDays ?? 0),
          guaranteePeriodMonths: String(existingContract.guaranteePeriodMonths ?? ''),
          direction: existingContract.direction ?? '',
          procurementLaw: existingContract.procurementLaw ?? '',
          procurementMethod: existingContract.procurementMethod ?? '',
          tenderNumber: existingContract.tenderNumber ?? '',
          tenderJustification: existingContract.tenderJustification ?? '',
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
          prepaymentPercent: '0',
          paymentDelayDays: '0',
          guaranteePeriodMonths: '',
          direction: '',
          procurementLaw: '',
          procurementMethod: '',
          tenderNumber: '',
          tenderJustification: '',
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
      const payload: Record<string, unknown> = { ...data };
      // Remove fields that backend generates or are not in DTO
      delete payload.number;
      delete payload.insuranceType;
      delete payload.insurancePolicyNumber;
      delete payload.insuranceAmount;
      delete payload.insuranceExpiryDate;
      delete payload.performanceBondNumber;
      delete payload.performanceBondAmount;
      delete payload.paymentBondNumber;
      delete payload.paymentBondAmount;
      delete payload.procurementLaw;
      delete payload.procurementMethod;
      delete payload.tenderNumber;
      delete payload.tenderJustification;
      // Convert empty strings to null for UUID fields
      if (!payload.typeId) payload.typeId = null;
      if (!payload.partnerId) payload.partnerId = null;
      if (!payload.projectId) payload.projectId = null;
      if (!payload.direction) delete payload.direction;
      return contractsApi.createContract(payload as any);
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
      const payload: Record<string, unknown> = { ...data };
      // Remove fields not in backend UpdateContractRequest DTO
      delete payload.number;
      delete payload.insuranceType;
      delete payload.insurancePolicyNumber;
      delete payload.insuranceAmount;
      delete payload.insuranceExpiryDate;
      delete payload.performanceBondNumber;
      delete payload.performanceBondAmount;
      delete payload.paymentBondNumber;
      delete payload.paymentBondAmount;
      delete payload.procurementLaw;
      delete payload.procurementMethod;
      delete payload.tenderNumber;
      delete payload.tenderJustification;
      if (!payload.typeId) payload.typeId = null;
      if (!payload.partnerId) payload.partnerId = null;
      if (!payload.projectId) payload.projectId = null;
      if (!payload.direction) delete payload.direction;
      return contractsApi.updateContract(id!, payload as any);
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
                options={partnerOptions}
                placeholder={t('forms.contract.placeholderPartner')}
                hasError={!!errors.partnerId}
                {...register('partnerId')}
              />
            </FormField>
            <FormField label={t('forms.contract.labelProject')} error={errors.projectId?.message} required>
              <Select
                options={projectOptions}
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
            <FormField label={t('forms.contract.labelDirection')}>
              <Select
                options={[
                  { value: '', label: t('forms.contract.directionNone') },
                  { value: 'CONTRACTOR', label: t('contracts.direction.contractor') },
                  { value: 'CLIENT', label: t('contracts.direction.client') },
                ]}
                {...register('direction')}
              />
            </FormField>
            <FormField label={t('contracts.procurement.law')}>
              <Select
                options={procurementLawOptions}
                {...register('procurementLaw')}
              />
            </FormField>
            <FormField label={t('contracts.procurement.method')}>
              <Select
                options={procurementMethodOptions}
                {...register('procurementMethod')}
              />
            </FormField>
            <FormField label={t('contracts.procurement.tenderNumber')}>
              <Input
                placeholder="ЗК-2024-00123"
                {...register('tenderNumber')}
              />
            </FormField>
            <FormField label={t('contracts.procurement.tenderJustification')} className="sm:col-span-2">
              <Textarea
                placeholder={t('contracts.procurement.tenderJustification')}
                rows={2}
                {...register('tenderJustification')}
              />
            </FormField>
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
            <FormField label={t('forms.contract.labelPrepayment')}>
              <Input
                type="text"
                inputMode="numeric"
                placeholder="30"
                {...register('prepaymentPercent')}
              />
            </FormField>
            <FormField label={t('forms.contract.labelPaymentDelay')}>
              <Input
                type="text"
                inputMode="numeric"
                placeholder="30"
                {...register('paymentDelayDays')}
              />
            </FormField>
            <FormField label={t('forms.contract.labelGuarantee')}>
              <Input
                type="text"
                inputMode="numeric"
                placeholder="12"
                {...register('guaranteePeriodMonths')}
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

        {/* Section: Insurance & Bonds */}
        <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-8">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-5">{t('contracts.insurance.sectionTitle')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FormField label={t('contracts.insurance.type')}>
              <Select
                options={[
                  { value: '', label: '—' },
                  { value: 'CMR', label: t('contracts.insurance.types.CMR') },
                  { value: 'BUILDERS_RISK', label: t('contracts.insurance.types.BUILDERS_RISK') },
                  { value: 'PROFESSIONAL_LIABILITY', label: t('contracts.insurance.types.PROFESSIONAL_LIABILITY') },
                  { value: 'COMBINED', label: t('contracts.insurance.types.COMBINED') },
                ]}
                {...register('insuranceType')}
              />
            </FormField>
            <FormField label={t('contracts.insurance.policyNumber')}>
              <Input placeholder="ПС-2024-00001" {...register('insurancePolicyNumber')} />
            </FormField>
            <FormField label={t('contracts.insurance.amount')}>
              <Input type="text" inputMode="numeric" placeholder="0" {...register('insuranceAmount')} />
            </FormField>
            <FormField label={t('contracts.insurance.expiryDate')}>
              <Input type="date" {...register('insuranceExpiryDate')} />
            </FormField>
            <FormField label={t('contracts.insurance.performanceBondNumber')}>
              <Input placeholder="БГ-2024-00001" {...register('performanceBondNumber')} />
            </FormField>
            <FormField label={t('contracts.insurance.performanceBondAmount')}>
              <Input type="text" inputMode="numeric" placeholder="0" {...register('performanceBondAmount')} />
            </FormField>
            <FormField label={t('contracts.insurance.paymentBondNumber')}>
              <Input placeholder="БГ-2024-00002" {...register('paymentBondNumber')} />
            </FormField>
            <FormField label={t('contracts.insurance.paymentBondAmount')}>
              <Input type="text" inputMode="numeric" placeholder="0" {...register('paymentBondAmount')} />
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
