import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Search, CheckCircle, AlertCircle } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { FormField, Input } from '@/design-system/components/FormField';
import { contractsApi } from '@/api/contracts';
import { findPartyByInn, mapDadataToCounterparty, isDadataConfigured } from '@/lib/dadata';
import { t } from '@/i18n';

const schema = z.object({
  name: z.string().min(1, t('counterparties.validation.nameRequired')),
  inn: z
    .string()
    .optional()
    .refine(
      (v) => !v || /^\d{10}$|^\d{12}$/.test(v),
      t('counterparties.validation.innFormat'),
    ),
  kpp: z.string().optional(),
  ogrn: z.string().optional(),
  legalAddress: z.string().optional(),
  actualAddress: z.string().optional(),
  bankAccount: z.string().optional(),
  bik: z.string().optional(),
  correspondentAccount: z.string().optional(),
  bankName: z.string().optional(),
  supplier: z.boolean().optional(),
  customer: z.boolean().optional(),
});

type FormData = z.infer<typeof schema>;

const CounterpartyFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEdit = !!id;

  const { data: existing } = useQuery({
    queryKey: ['counterparty', id],
    queryFn: () => contractsApi.getCounterparty(id!),
    enabled: isEdit,
  });

  const [innLookupLoading, setInnLookupLoading] = useState(false);
  const [innLookupResult, setInnLookupResult] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    values: existing
      ? {
          name: existing.name,
          inn: existing.inn ?? '',
          kpp: existing.kpp ?? '',
          ogrn: existing.ogrn ?? '',
          legalAddress: existing.legalAddress ?? '',
          actualAddress: existing.actualAddress ?? '',
          bankAccount: existing.bankAccount ?? '',
          bik: existing.bik ?? '',
          correspondentAccount: existing.correspondentAccount ?? '',
          bankName: (existing as any).bankName ?? '',
          supplier: existing.supplier,
          customer: existing.customer,
        }
      : undefined,
  });

  const createMutation = useMutation({
    mutationFn: (data: FormData) => contractsApi.createCounterparty({ ...data, active: true }),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ['counterparties'] });
      toast.success(t('counterparties.createSuccess'));
      navigate(`/counterparties/${created.id}`);
    },
    onError: () => toast.error(t('counterparties.createError')),
  });

  const updateMutation = useMutation({
    mutationFn: (data: FormData) => contractsApi.updateCounterparty(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['counterparties'] });
      queryClient.invalidateQueries({ queryKey: ['counterparty', id] });
      toast.success(t('counterparties.updateSuccess'));
      navigate(`/counterparties/${id}`);
    },
    onError: () => toast.error(t('counterparties.updateError')),
  });

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const innValue = watch('inn') ?? '';
  const innReady = /^\d{10}$|^\d{12}$/.test(innValue);

  const handleInnLookup = async () => {
    if (!innReady) return;
    setInnLookupLoading(true);
    setInnLookupResult(null);
    try {
      const party = await findPartyByInn(innValue);
      if (!party) {
        toast.error('Организация с таким ИНН не найдена');
        return;
      }
      const mapped = mapDadataToCounterparty(party);
      setValue('name', mapped.name, { shouldDirty: true });
      setValue('kpp', mapped.kpp, { shouldDirty: true });
      setValue('ogrn', mapped.ogrn, { shouldDirty: true });
      setValue('legalAddress', mapped.legalAddress, { shouldDirty: true });
      setValue('actualAddress', mapped.actualAddress, { shouldDirty: true });
      setInnLookupResult(mapped.name);
      toast.success(`Найдено: ${mapped.name}`);
    } catch {
      toast.error('Ошибка при запросе к Dadata');
    } finally {
      setInnLookupLoading(false);
    }
  };

  const onSubmit = (data: FormData) => {
    if (isEdit) updateMutation.mutate(data);
    else createMutation.mutate(data);
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={isEdit ? t('counterparties.editTitle') : t('counterparties.createTitle')}
        subtitle={isEdit ? existing?.name : undefined}
        backTo={isEdit ? `/counterparties/${id}` : '/counterparties'}
        breadcrumbs={[
          { label: t('forms.common.home'), href: '/' },
          { label: t('counterparties.title'), href: '/counterparties' },
          { label: isEdit ? t('forms.common.editing') : t('forms.common.creating') },
        ]}
      />

      <form onSubmit={handleSubmit(onSubmit)} className="max-w-3xl space-y-6">
        {/* Basic info */}
        <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-5">
            {t('counterparties.sectionBasicInfo')}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FormField
              label={t('counterparties.labelName')}
              error={errors.name?.message}
              required
              className="sm:col-span-2"
            >
              <Input
                placeholder={t('counterparties.placeholderName')}
                hasError={!!errors.name}
                {...register('name')}
              />
            </FormField>

            {/* Роль */}
            <div className="sm:col-span-2 flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" {...register('customer')} className="rounded" />
                <span className="text-sm text-neutral-700 dark:text-neutral-300">
                  {t('counterparties.labelIsCustomer')}
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" {...register('supplier')} className="rounded" />
                <span className="text-sm text-neutral-700 dark:text-neutral-300">
                  {t('counterparties.labelIsSupplier')}
                </span>
              </label>
            </div>
          </div>
        </section>

        {/* Requisites */}
        <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-5">
            {t('counterparties.sectionRequisites')}
          </h2>

          {/* Dadata INN lookup */}
          {!isDadataConfigured() && (
            <div className="mb-4 flex items-start gap-2 px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-xs text-amber-700 dark:text-amber-400">
              <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
              <span>
                Автозаполнение по ИНН недоступно. Укажите{' '}
                <code className="font-mono">VITE_DADATA_TOKEN</code> в <code>.env.local</code>
                {' '}(бесплатно на{' '}
                <a
                  href="https://dadata.ru"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  dadata.ru
                </a>
                ).
              </span>
            </div>
          )}

          {innLookupResult && (
            <div className="mb-4 flex items-center gap-2 px-3 py-2 rounded-lg bg-success-50 dark:bg-success-900/20 border border-success-200 dark:border-success-800 text-sm text-success-700 dark:text-success-400">
              <CheckCircle size={15} />
              <span>Данные заполнены: <strong>{innLookupResult}</strong></span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <FormField label={t('counterparties.labelInn')} error={errors.inn?.message}>
              <div className="flex gap-2">
                <Input
                  placeholder={t('counterparties.placeholderInn')}
                  hasError={!!errors.inn}
                  inputMode="numeric"
                  maxLength={12}
                  {...register('inn')}
                />
                {isDadataConfigured() && (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    iconLeft={<Search size={13} />}
                    loading={innLookupLoading}
                    disabled={!innReady || innLookupLoading}
                    onClick={handleInnLookup}
                    title={innReady ? 'Заполнить по ИНН' : 'Введите 10 или 12 цифр ИНН'}
                  >
                    Найти
                  </Button>
                )}
              </div>
            </FormField>
            <FormField label={t('counterparties.labelKpp')} error={errors.kpp?.message}>
              <Input
                placeholder={t('counterparties.placeholderKpp')}
                inputMode="numeric"
                maxLength={9}
                {...register('kpp')}
              />
            </FormField>
            <FormField label={t('counterparties.labelOgrn')} error={errors.ogrn?.message}>
              <Input
                placeholder={t('counterparties.placeholderOgrn')}
                inputMode="numeric"
                maxLength={13}
                {...register('ogrn')}
              />
            </FormField>
            <FormField
              label={t('counterparties.labelLegalAddress')}
              className="sm:col-span-3"
            >
              <Input
                placeholder="г. Москва, ул. Пример, д. 1"
                {...register('legalAddress')}
              />
            </FormField>
            <FormField
              label={t('counterparties.labelActualAddress')}
              className="sm:col-span-3"
            >
              <Input
                placeholder="г. Москва, ул. Пример, д. 1"
                {...register('actualAddress')}
              />
            </FormField>
          </div>
        </section>

        {/* Bank */}
        <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-5">
            {t('counterparties.sectionBankDetails')}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FormField label={t('counterparties.labelBankName')} className="sm:col-span-2">
              <Input placeholder="ПАО «Сбербанк»" {...register('bankName')} />
            </FormField>
            <FormField label={t('counterparties.labelBik')}>
              <Input
                placeholder={t('counterparties.placeholderBik')}
                inputMode="numeric"
                maxLength={9}
                {...register('bik')}
              />
            </FormField>
            <FormField label={t('counterparties.labelCorrespondentAccount')}>
              <Input
                placeholder={t('counterparties.placeholderBankAccount')}
                inputMode="numeric"
                maxLength={20}
                {...register('correspondentAccount')}
              />
            </FormField>
            <FormField label={t('counterparties.labelBankAccount')} className="sm:col-span-2">
              <Input
                placeholder={t('counterparties.placeholderBankAccount')}
                inputMode="numeric"
                maxLength={20}
                {...register('bankAccount')}
              />
            </FormField>
          </div>
        </section>

        <div className="flex items-center gap-3">
          <Button type="submit" loading={isSubmitting}>
            {isEdit ? t('forms.common.saveChanges') : t('counterparties.createButton')}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate(isEdit ? `/counterparties/${id}` : '/counterparties')}
          >
            {t('common.cancel')}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CounterpartyFormPage;
