import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { FormField, Input, Textarea, Select } from '@/design-system/components/FormField';
import { costManagementApi } from '@/api/costManagement';
import { formatMoney } from '@/lib/format';
import { t } from '@/i18n';

const commitmentSchema = z.object({
  name: z.string().min(1, t('forms.commitment.validation.nameRequired')).max(300, t('forms.common.maxChars', { count: '300' })),
  description: z.string().max(2000, t('forms.common.maxChars', { count: '2000' })).optional(),
  projectId: z.string().min(1, t('forms.commitment.validation.projectRequired')),
  vendorId: z.string().min(1, t('forms.commitment.validation.vendorRequired')),
  commitmentType: z.enum([ 'SUBCONTRACT', 'PURCHASE_ORDER', 'SERVICE_AGREEMENT', 'RENTAL'], {
    required_error: t('forms.commitment.validation.commitmentTypeRequired'),
  }),
  amount: z
    .string()
    .min(1, t('forms.commitment.validation.amountRequired'))
    .transform((val) => Number(val.replace(/\s/g, '')))
    .refine((val) => val > 0, t('forms.commitment.validation.amountPositive')),
  currency: z.string().min(1, t('forms.commitment.validation.currencyRequired')),
  contractId: z.string().optional(),
  startDate: z.string().min(1, t('forms.commitment.validation.startDateRequired')),
  endDate: z.string().min(1, t('forms.commitment.validation.endDateRequired')),
});

type CommitmentFormData = z.input<typeof commitmentSchema>;

const projectOptions = [
  { value: '1', label: 'ЖК "Солнечный"' },
  { value: '2', label: 'БЦ "Горизонт"' },
  { value: '3', label: 'Мост через р. Вятка' },
  { value: '6', label: 'ТЦ "Центральный"' },
];

const vendorOptions = [
  { value: 'v1', label: 'ООО "СтройМонтаж"' },
  { value: 'v2', label: 'АО "ЭлектроСтрой"' },
  { value: 'v3', label: 'ООО "БетонСервис"' },
  { value: 'v4', label: 'ООО "ПроектГрупп"' },
  { value: 'v5', label: 'АО "ДорСтрой"' },
  { value: 'v6', label: 'ПАО "МеталлТрейд"' },
];

const typeOptions = [
  { value: 'SUBCONTRACT', label: t('forms.commitment.commitmentTypes.subcontract') },
  { value: 'PURCHASE_ORDER', label: t('forms.commitment.commitmentTypes.purchaseOrder') },
  { value: 'SERVICE_AGREEMENT', label: t('forms.commitment.commitmentTypes.serviceAgreement') },
  { value: 'RENTAL', label: t('forms.commitment.commitmentTypes.rental') },
];

const currencyOptions = [
  { value: 'RUB', label: t('forms.commitment.currencies.rub') },
  { value: 'USD', label: t('forms.commitment.currencies.usd') },
  { value: 'EUR', label: t('forms.commitment.currencies.eur') },
  { value: 'CNY', label: t('forms.commitment.currencies.cny') },
];

const contractOptions = [
  { value: '', label: t('forms.commitment.noContract') },
  { value: 'c1', label: 'ДГ-2025-001 - Генподряд ЖК "Солнечный"' },
  { value: 'c2', label: 'ДГ-2025-002 - Субподряд электромонтаж' },
  { value: 'c3', label: 'ДГ-2025-003 - Поставка бетона' },
  { value: 'c4', label: 'ДГ-2025-004 - Проектирование БЦ "Горизонт"' },
];

const CommitmentFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEdit = !!id;

  const { data: existingCommitment } = useQuery({
    queryKey: ['commitment', id],
    queryFn: () => costManagementApi.getCommitment(id!),
    enabled: isEdit,
  });

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<CommitmentFormData>({
    resolver: zodResolver(commitmentSchema),
    defaultValues: existingCommitment
      ? {
          name: existingCommitment.title,
          description: '',
          projectId: existingCommitment.projectId,
          vendorId: '',
          commitmentType: existingCommitment.type,
          amount: String(existingCommitment.originalAmount),
          currency: 'RUB',
          contractId: '',
          startDate: existingCommitment.startDate ?? '',
          endDate: existingCommitment.endDate ?? '',
        }
      : {
          name: '',
          description: '',
          projectId: '',
          vendorId: '',
          commitmentType: '' as any,
          amount: '',
          currency: 'RUB',
          contractId: '',
          startDate: '',
          endDate: '',
        },
  });

  const amountValue = useWatch({ control, name: 'amount' });
  const numericAmount = Number(String(amountValue).replace(/\s/g, '')) || 0;

  const createMutation = useMutation({
    mutationFn: (data: CommitmentFormData) => {
      const parsed = commitmentSchema.parse(data);
      return costManagementApi.createCommitment({
        title: data.name,
        type: parsed.commitmentType,
        vendorName: data.vendorId,
        projectId: data.projectId,
        originalAmount: parsed.amount as number,
        revisedAmount: parsed.amount as number,
        startDate: data.startDate,
        endDate: data.endDate,
        status: 'DRAFT',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commitments'] });
      toast.success(t('forms.commitment.createSuccess'));
      navigate('/cost-management/commitments');
    },
    onError: () => {
      toast.error(t('forms.commitment.createError'));
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: CommitmentFormData) => {
      const parsed = commitmentSchema.parse(data);
      // TODO: Add updateCommitment to costManagementApi when backend supports full update
      return costManagementApi.createCommitment({
        title: data.name,
        type: parsed.commitmentType,
        vendorName: data.vendorId,
        projectId: data.projectId,
        originalAmount: parsed.amount as number,
        revisedAmount: parsed.amount as number,
        startDate: data.startDate,
        endDate: data.endDate,
        status: 'DRAFT',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commitments'] });
      queryClient.invalidateQueries({ queryKey: ['commitment', id] });
      toast.success(t('forms.commitment.updateSuccess'));
      navigate(`/cost-management/commitments/${id}`);
    },
    onError: () => {
      toast.error(t('forms.commitment.updateError'));
    },
  });

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const onSubmit = (data: CommitmentFormData) => {
    if (isEdit) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={isEdit ? t('forms.commitment.editTitle') : t('forms.commitment.createTitle')}
        subtitle={
          isEdit
            ? existingCommitment?.title
            : t('forms.commitment.createSubtitle')
        }
        backTo={isEdit ? `/cost-management/commitments/${id}` : '/cost-management/commitments'}
        breadcrumbs={[
          { label: t('forms.common.home'), href: '/' },
          { label: t('forms.commitment.breadcrumbCostManagement'), href: '/cost-management' },
          { label: t('forms.commitment.breadcrumbCommitments'), href: '/cost-management/commitments' },
          { label: isEdit ? t('forms.common.editing') : t('forms.common.creating') },
        ]}
      />

      <form onSubmit={handleSubmit(onSubmit)} className="max-w-3xl">
        <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-6">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-5">{t('forms.common.basicInfo')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FormField label={t('forms.commitment.labelName')} error={errors.name?.message} required className="sm:col-span-2">
              <Input
                placeholder={t('costManagement.commitmentForm.placeholderName')}
                hasError={!!errors.name}
                {...register('name')}
              />
            </FormField>
            <FormField label={t('forms.commitment.labelCommitmentType')} error={errors.commitmentType?.message} required>
              <Select
                options={typeOptions}
                placeholder={t('forms.commitment.placeholderType')}
                hasError={!!errors.commitmentType}
                {...register('commitmentType')}
              />
            </FormField>
            <FormField label={t('forms.commitment.labelProject')} error={errors.projectId?.message} required>
              <Select
                options={projectOptions}
                placeholder={t('forms.commitment.placeholderProject')}
                hasError={!!errors.projectId}
                {...register('projectId')}
              />
            </FormField>
            <FormField label={t('forms.commitment.labelVendor')} error={errors.vendorId?.message} required>
              <Select
                options={vendorOptions}
                placeholder={t('forms.commitment.placeholderVendor')}
                hasError={!!errors.vendorId}
                {...register('vendorId')}
              />
            </FormField>
            <FormField label={t('forms.commitment.labelContract')} error={errors.contractId?.message}>
              <Select
                options={contractOptions}
                hasError={!!errors.contractId}
                {...register('contractId')}
              />
            </FormField>
          </div>
        </section>

        <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-6">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-5">{t('forms.commitment.sectionFinancial')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FormField label={t('forms.commitment.labelAmount')} error={errors.amount?.message} required>
              <Input
                type="text"
                inputMode="numeric"
                placeholder="15000000"
                hasError={!!errors.amount}
                {...register('amount')}
              />
            </FormField>
            <FormField label={t('forms.commitment.labelCurrency')} error={errors.currency?.message} required>
              <Select
                options={currencyOptions}
                hasError={!!errors.currency}
                {...register('currency')}
              />
            </FormField>
          </div>
          {numericAmount > 0 && (
            <div className="mt-4 pt-4 border-t border-neutral-100">
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-0.5">{t('forms.commitment.commitmentAmount')}</p>
              <p className="text-sm font-semibold text-primary-700 tabular-nums">
                {formatMoney(numericAmount)}
              </p>
            </div>
          )}
        </section>

        <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-6">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-5">{t('forms.commitment.sectionDates')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FormField label={t('forms.commitment.labelStartDate')} error={errors.startDate?.message} required>
              <Input type="date" hasError={!!errors.startDate} {...register('startDate')} />
            </FormField>
            <FormField label={t('forms.commitment.labelEndDate')} error={errors.endDate?.message} required>
              <Input type="date" hasError={!!errors.endDate} {...register('endDate')} />
            </FormField>
          </div>
        </section>

        <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-8">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-5">{t('forms.commitment.sectionDescription')}</h2>
          <FormField label={t('forms.commitment.labelDescription')} error={errors.description?.message}>
            <Textarea
              placeholder={t('forms.commitment.placeholderDescription')}
              rows={4}
              hasError={!!errors.description}
              {...register('description')}
            />
          </FormField>
        </section>

        <div className="flex items-center gap-3">
          <Button type="submit" loading={isSubmitting}>
            {isEdit ? t('forms.common.saveChanges') : t('forms.commitment.createButton')}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() =>
              navigate(
                isEdit ? `/cost-management/commitments/${id}` : '/cost-management/commitments',
              )
            }
          >
            {t('common.back')}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CommitmentFormPage;
