import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Plus, Trash2 } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { FormField, Input, Textarea, Select } from '@/design-system/components/FormField';
import { financeApi } from '@/api/finance';
import { contractsApi } from '@/api/contracts';
import { formatMoney } from '@/lib/format';
import { t } from '@/i18n';

const invoiceSchema = z.object({
  contractId: z.string().min(1, t('forms.invoice.validation.contractRequired')),
  number: z.string().min(1, t('forms.invoice.validation.numberRequired')).max(50, t('forms.common.maxChars', { count: '50' })),
  invoiceDate: z.string().min(1, t('forms.invoice.validation.invoiceDateRequired')),
  dueDate: z.string().min(1, t('forms.invoice.validation.dueDateRequired')),
  invoiceType: z.enum([ 'ISSUED', 'RECEIVED'], {
    required_error: t('forms.invoice.validation.typeRequired'),
  }),
  amount: z
    .string()
    .min(1, t('forms.invoice.validation.amountRequired'))
    .transform((val) => Number(val.replace(/\s/g, '')))
    .refine((val) => val > 0, t('forms.invoice.validation.amountPositive')),
  vatRate: z.string().transform((val) => Number(val)),
  notes: z.string().max(2000, t('forms.common.maxChars', { count: '2000' })).optional(),
});

type InvoiceFormData = z.input<typeof invoiceSchema>;

interface LineItem {
  description: string;
  quantity: string;
  unitPrice: string;
  amount: string;
}

const invoiceTypeOptions = [
  { value: 'ISSUED', label: t('forms.invoice.invoiceTypes.issued') },
  { value: 'RECEIVED', label: t('forms.invoice.invoiceTypes.received') },
];

const vatRateOptions = [
  { value: '20', label: '20%' },
  { value: '10', label: '10%' },
  { value: '0', label: '0%' },
];

const InvoiceFormPage: React.FC = () => {
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

  const [lineItems, setLineItems] = useState<LineItem[]>([
    { description: '', quantity: '', unitPrice: '', amount: '' },
  ]);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      contractId: '',
      number: '',
      invoiceDate: '',
      dueDate: '',
      invoiceType: '' as any,
      amount: '',
      vatRate: '20',
      notes: '',
    },
  });

  const amountValue = useWatch({ control, name: 'amount' });
  const vatRateValue = useWatch({ control, name: 'vatRate' });
  const numericAmount = Number(String(amountValue).replace(/\s/g, '')) || 0;
  const numericVatRate = Number(vatRateValue) || 0;
  const vatAmount = (numericAmount * numericVatRate) / 100;
  const totalWithVat = numericAmount + vatAmount;

  const addLineItem = () => {
    setLineItems([...lineItems, { description: '', quantity: '', unitPrice: '', amount: '' }]);
  };

  const removeLineItem = (index: number) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter((_, i) => i !== index));
    }
  };

  const updateLineItem = (index: number, field: keyof LineItem, value: string) => {
    const updated = [...lineItems];
    updated[index] = { ...updated[index], [field]: value };
    if (field === 'quantity' || field === 'unitPrice') {
      const qty = Number(updated[index].quantity) || 0;
      const price = Number(updated[index].unitPrice) || 0;
      updated[index].amount = String(qty * price);
    }
    setLineItems(updated);
  };

  const createMutation = useMutation({
    mutationFn: (data: InvoiceFormData) => {
      const parsed = invoiceSchema.parse(data);
      const subtotal = parsed.amount as number;
      const vatRate = parsed.vatRate as number;
      const vatAmount = subtotal * vatRate / 100;
      const totalAmount = subtotal + vatAmount;
      // Auto-resolve projectId from contract
      const projectId = contractProjectMap[parsed.contractId] ?? undefined;
      return financeApi.createInvoice({
        invoiceDate: parsed.invoiceDate,
        dueDate: parsed.dueDate,
        contractId: parsed.contractId,
        projectId,
        invoiceType: parsed.invoiceType,
        subtotal,
        vatRate,
        totalAmount,
      } as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['INVOICES'] });
      toast.success(t('forms.invoice.createSuccess'));
      navigate('/invoices');
    },
    onError: () => {
      toast.error(t('forms.invoice.createError'));
    },
  });

  const onSubmit = (data: InvoiceFormData) => {
    createMutation.mutate(data);
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('forms.invoice.createTitle')}
        subtitle={t('forms.invoice.createSubtitle')}
        backTo="/invoices"
        breadcrumbs={[
          { label: t('forms.common.home'), href: '/' },
          { label: t('forms.invoice.breadcrumbInvoices'), href: '/invoices' },
          { label: t('forms.common.creating') },
        ]}
      />

      <form onSubmit={handleSubmit(onSubmit)} className="max-w-4xl">
        <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-6">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-5">{t('forms.common.basicInfo')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FormField label={t('forms.invoice.labelContract')} error={errors.contractId?.message} required>
              <Select
                options={contractOptions}
                placeholder={t('forms.invoice.placeholderContract')}
                hasError={!!errors.contractId}
                {...register('contractId')}
              />
            </FormField>
            <FormField label={t('forms.invoice.labelInvoiceType')} error={errors.invoiceType?.message} required>
              <Select
                options={invoiceTypeOptions}
                placeholder={t('forms.invoice.placeholderType')}
                hasError={!!errors.invoiceType}
                {...register('invoiceType')}
              />
            </FormField>
            <FormField label={t('forms.invoice.labelNumber')} error={errors.number?.message} required>
              <Input placeholder={t('forms.invoice.placeholderNumber')} hasError={!!errors.number} {...register('number')} />
            </FormField>
            <FormField label={t('forms.invoice.labelInvoiceDate')} error={errors.invoiceDate?.message} required>
              <Input type="date" hasError={!!errors.invoiceDate} {...register('invoiceDate')} />
            </FormField>
            <FormField label={t('forms.invoice.labelDueDate')} error={errors.dueDate?.message} required>
              <Input type="date" hasError={!!errors.dueDate} {...register('dueDate')} />
            </FormField>
          </div>
        </section>

        <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">{t('forms.invoice.sectionLineItems')}</h2>
            <Button type="button" variant="secondary" size="sm" iconLeft={<Plus size={14} />} onClick={addLineItem}>
              {t('forms.invoice.addLineItem')}
            </Button>
          </div>
          <div className="space-y-3">
            {lineItems.map((item, index) => (
              <div key={index} className="grid grid-cols-12 gap-3 items-end p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                <div className="col-span-5">
                  <FormField label={index === 0 ? t('forms.invoice.lineItemDescription') : undefined}>
                    <Input
                      placeholder={t('forms.invoice.lineItemPlaceholder')}
                      value={item.description}
                      onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                    />
                  </FormField>
                </div>
                <div className="col-span-2">
                  <FormField label={index === 0 ? t('forms.invoice.lineItemQuantity') : undefined}>
                    <Input
                      type="text"
                      inputMode="numeric"
                      placeholder="0"
                      value={item.quantity}
                      onChange={(e) => updateLineItem(index, 'quantity', e.target.value)}
                    />
                  </FormField>
                </div>
                <div className="col-span-2">
                  <FormField label={index === 0 ? t('forms.invoice.lineItemPrice') : undefined}>
                    <Input
                      type="text"
                      inputMode="numeric"
                      placeholder="0"
                      value={item.unitPrice}
                      onChange={(e) => updateLineItem(index, 'unitPrice', e.target.value)}
                    />
                  </FormField>
                </div>
                <div className="col-span-2">
                  <FormField label={index === 0 ? t('forms.invoice.lineItemAmount') : undefined}>
                    <Input type="text" value={item.amount} disabled className="bg-neutral-100 dark:bg-neutral-800" />
                  </FormField>
                </div>
                <div className="col-span-1 flex justify-center">
                  <button
                    type="button"
                    onClick={() => removeLineItem(index)}
                    className="p-1.5 text-neutral-400 hover:text-danger-600 hover:bg-danger-50 rounded-md transition-colors"
                    disabled={lineItems.length === 1}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-6">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-5">{t('forms.invoice.sectionAmounts')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FormField label={t('forms.invoice.labelAmountExVat')} error={errors.amount?.message} required>
              <Input
                type="text"
                inputMode="numeric"
                placeholder="1000000"
                hasError={!!errors.amount}
                {...register('amount')}
              />
            </FormField>
            <FormField label={t('forms.invoice.labelVatRate')} error={errors.vatRate?.message}>
              <Select options={vatRateOptions} hasError={!!errors.vatRate} {...register('vatRate')} />
            </FormField>
          </div>
          {numericAmount > 0 && (
            <div className="mt-4 pt-4 border-t border-neutral-100 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-0.5">{t('forms.invoice.previewAmountExVat')}</p>
                <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300 tabular-nums">{formatMoney(numericAmount)}</p>
              </div>
              <div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-0.5">{t('forms.invoice.previewVat', { rate: String(numericVatRate) })}</p>
                <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300 tabular-nums">{formatMoney(vatAmount)}</p>
              </div>
              <div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-0.5">{t('forms.invoice.previewTotal')}</p>
                <p className="text-sm font-semibold text-primary-700 tabular-nums">{formatMoney(totalWithVat)}</p>
              </div>
            </div>
          )}
        </section>

        <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-8">
          <FormField label={t('common.notes')} error={errors.notes?.message}>
            <Textarea placeholder={t('forms.invoice.placeholderNotes')} rows={3} hasError={!!errors.notes} {...register('notes')} />
          </FormField>
        </section>

        <div className="flex items-center gap-3">
          <Button type="submit" loading={createMutation.isPending}>
            {t('forms.invoice.createButton')}
          </Button>
          <Button type="button" variant="secondary" onClick={() => navigate('/invoices')}>
            {t('common.cancel')}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default InvoiceFormPage;
