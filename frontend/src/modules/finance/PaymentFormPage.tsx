import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { FormField, Input, Textarea, Select } from '@/design-system/components/FormField';
import { financeApi } from '@/api/finance';
import { contractsApi } from '@/api/contracts';
import { formatMoney } from '@/lib/format';
import { t } from '@/i18n';

const paymentSchema = z.object({
  contractId: z.string().min(1, t('forms.payment.validation.contractRequired')),
  invoiceId: z.string().optional(),
  paymentType: z.enum([ 'INCOMING', 'OUTGOING'], {
    required_error: t('forms.payment.validation.typeRequired'),
  }),
  amount: z
    .string()
    .min(1, t('forms.payment.validation.amountRequired'))
    .transform((val) => Number(val.replace(/\s/g, '')))
    .refine((val) => val > 0, t('forms.payment.validation.amountPositive')),
  paymentDate: z.string().min(1, t('forms.payment.validation.dateRequired')),
  method: z.string().min(1, t('forms.payment.validation.methodRequired')),
  purpose: z.string().max(1000, t('forms.common.maxChars', { count: '1000' })).optional(),
  bankAccount: z.string().max(100, t('forms.common.maxChars', { count: '100' })).optional(),
  reference: z.string().max(100, t('forms.common.maxChars', { count: '100' })).optional(),
  notes: z.string().max(2000, t('forms.common.maxChars', { count: '2000' })).optional(),
});

type PaymentFormData = z.input<typeof paymentSchema>;

const paymentTypeOptions = [
  { value: 'INCOMING', label: t('forms.payment.paymentTypes.incoming') },
  { value: 'OUTGOING', label: t('forms.payment.paymentTypes.outgoing') },
];

const methodOptions = [
  { value: 'bank_transfer', label: t('forms.payment.paymentMethods.bankTransfer') },
  { value: 'cash', label: t('forms.payment.paymentMethods.cash') },
  { value: 'letter_of_credit', label: t('forms.payment.paymentMethods.letterOfCredit') },
  { value: 'offset', label: t('forms.payment.paymentMethods.offset') },
];

const PaymentFormPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: contractsData } = useQuery({
    queryKey: ['contracts-for-select'],
    queryFn: () => contractsApi.getContracts({ size: 200 } as any),
  });

  const contractOptions = useMemo(() => {
    const contracts = contractsData?.content ?? [];
    return contracts.map((c) => ({
      value: c.id,
      label: `${c.number} - ${c.name}`,
    }));
  }, [contractsData]);

  // Map contractId -> projectId for auto-resolution
  const contractProjectMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const c of contractsData?.content ?? []) {
      if (c.projectId) {
        map[c.id] = c.projectId;
      }
    }
    return map;
  }, [contractsData]);

  const { data: invoicesData } = useQuery({
    queryKey: ['invoices-for-select'],
    queryFn: () => financeApi.getInvoices({ size: 200 } as any),
  });

  const invoiceOptions = useMemo(() => {
    const invoices = invoicesData?.content ?? [];
    return invoices
      .filter((i) => i.status !== 'PAID' && i.status !== 'CANCELLED')
      .map((i) => ({
        value: i.id,
        label: `${i.number} от ${i.invoiceDate}`,
      }));
  }, [invoicesData]);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      contractId: '',
      invoiceId: '',
      paymentType: '' as any,
      amount: '',
      paymentDate: '',
      method: '',
      purpose: '',
      bankAccount: '',
      reference: '',
      notes: '',
    },
  });

  const amountValue = useWatch({ control, name: 'amount' });
  const numericAmount = Number(String(amountValue).replace(/\s/g, '')) || 0;

  const createMutation = useMutation({
    mutationFn: (data: PaymentFormData) => {
      const parsed = paymentSchema.parse(data);
      // Auto-resolve projectId from contract
      const projectId = contractProjectMap[parsed.contractId] ?? undefined;
      return financeApi.createPayment({
        paymentDate: parsed.paymentDate,
        paymentType: parsed.paymentType,
        amount: parsed.amount as number,
        contractId: parsed.contractId,
        projectId,
        invoiceId: parsed.invoiceId || undefined,
        purpose: parsed.purpose || '',
        bankAccount: parsed.bankAccount || undefined,
        notes: parsed.notes || undefined,
      } as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['PAYMENTS'] });
      toast.success(t('forms.payment.createSuccess'));
      navigate('/payments');
    },
    onError: () => {
      toast.error(t('forms.payment.createError'));
    },
  });

  const onSubmit = (data: PaymentFormData) => {
    createMutation.mutate(data);
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('forms.payment.createTitle')}
        subtitle={t('forms.payment.createSubtitle')}
        backTo="/payments"
        breadcrumbs={[
          { label: t('forms.common.home'), href: '/' },
          { label: t('forms.payment.breadcrumbPayments'), href: '/payments' },
          { label: t('forms.common.creating') },
        ]}
      />

      <form onSubmit={handleSubmit(onSubmit)} className="max-w-3xl">
        <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-6">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-5">{t('forms.common.basicInfo')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FormField label={t('forms.payment.labelPaymentType')} error={errors.paymentType?.message} required>
              <Select
                options={paymentTypeOptions}
                placeholder={t('forms.payment.placeholderType')}
                hasError={!!errors.paymentType}
                {...register('paymentType')}
              />
            </FormField>
            <FormField label={t('forms.payment.labelContract')} error={errors.contractId?.message} required>
              <Select
                options={contractOptions}
                placeholder={t('forms.payment.placeholderContract')}
                hasError={!!errors.contractId}
                {...register('contractId')}
              />
            </FormField>
            <FormField label={t('forms.payment.labelInvoice')} error={errors.invoiceId?.message}>
              <Select
                options={invoiceOptions}
                placeholder={t('forms.payment.placeholderInvoice')}
                hasError={!!errors.invoiceId}
                {...register('invoiceId')}
              />
            </FormField>
            <FormField label={t('forms.payment.labelPaymentDate')} error={errors.paymentDate?.message} required>
              <Input type="date" hasError={!!errors.paymentDate} {...register('paymentDate')} />
            </FormField>
            <FormField label={t('forms.payment.labelMethod')} error={errors.method?.message} required>
              <Select
                options={methodOptions}
                placeholder={t('forms.payment.placeholderMethod')}
                hasError={!!errors.method}
                {...register('method')}
              />
            </FormField>
          </div>
        </section>

        <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-6">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-5">{t('forms.payment.sectionAmount')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FormField label={t('forms.payment.labelAmount')} error={errors.amount?.message} required>
              <Input
                type="text"
                inputMode="numeric"
                placeholder="500000"
                hasError={!!errors.amount}
                {...register('amount')}
              />
            </FormField>
            <FormField label={t('forms.payment.labelReference')} error={errors.reference?.message}>
              <Input placeholder={t('forms.payment.placeholderReference')} hasError={!!errors.reference} {...register('reference')} />
            </FormField>
          </div>
          {numericAmount > 0 && (
            <div className="mt-4 pt-4 border-t border-neutral-100">
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-0.5">{t('forms.payment.paymentPreview')}</p>
              <p className="text-sm font-semibold text-primary-700 tabular-nums">{formatMoney(numericAmount)}</p>
            </div>
          )}
        </section>

        <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-8">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-5">{t('forms.payment.sectionAdditional')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FormField label={t('forms.payment.labelPurpose')} error={errors.purpose?.message}>
              <Input
                placeholder={t('forms.payment.placeholderPurpose')}
                hasError={!!errors.purpose}
                {...register('purpose')}
              />
            </FormField>
            <FormField label={t('forms.payment.labelBankAccount')} error={errors.bankAccount?.message}>
              <Input
                placeholder={t('forms.payment.placeholderBankAccount')}
                hasError={!!errors.bankAccount}
                {...register('bankAccount')}
              />
            </FormField>
          </div>
          <div className="mt-5">
            <FormField label={t('common.notes')} error={errors.notes?.message}>
              <Textarea
                placeholder={t('forms.payment.placeholderNotes')}
                rows={3}
                hasError={!!errors.notes}
                {...register('notes')}
              />
            </FormField>
          </div>
        </section>

        <div className="flex items-center gap-3">
          <Button type="submit" loading={createMutation.isPending}>
            {t('forms.payment.createButton')}
          </Button>
          <Button type="button" variant="secondary" onClick={() => navigate('/payments')}>
            {t('common.cancel')}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default PaymentFormPage;
