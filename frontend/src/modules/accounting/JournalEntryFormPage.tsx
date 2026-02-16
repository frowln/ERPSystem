import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { FormField, Input, Textarea, Select } from '@/design-system/components/FormField';
import { EmptyState } from '@/design-system/components/EmptyState';
import { accountingApi } from '@/api/accounting';
import { formatDateTime, formatMoney } from '@/lib/format';

const uuidSchema = z.string().uuid('Неверный формат UUID');

const journalEntrySchema = z.object({
  entryDate: z.string().min(1, 'Укажите дату проводки'),
  journalId: uuidSchema,
  periodId: uuidSchema,
  debitAccountId: uuidSchema,
  creditAccountId: uuidSchema,
  description: z.string().min(1, 'Укажите описание').max(500, 'Максимум 500 символов'),
  amount: z
    .string()
    .min(1, 'Укажите сумму')
    .transform((value) => Number(value.replace(/\s/g, '').replace(',', '.')))
    .refine((value) => Number.isFinite(value) && value > 0, 'Сумма должна быть больше 0'),
  documentType: z.string().max(50, 'Максимум 50 символов').optional(),
  documentId: z
    .string()
    .optional()
    .refine((value) => !value || uuidSchema.safeParse(value).success, 'Неверный UUID документа'),
  notes: z.string().max(2000, 'Максимум 2000 символов').optional(),
});

type JournalEntryFormData = z.input<typeof journalEntrySchema>;

const JOURNAL_ENTRY_DRAFT_KEY = 'accounting:journal-entry:draft:v1';

const defaultJournalEntryValues: JournalEntryFormData = {
  entryDate: new Date().toISOString().split('T')[0],
  journalId: '',
  periodId: '',
  debitAccountId: '',
  creditAccountId: '',
  description: '',
  amount: '',
  documentType: '',
  documentId: '',
  notes: '',
};

type JournalEntryDraft = {
  savedAt: number;
  values: JournalEntryFormData;
};

const parseJournalEntryDraft = (raw: string): JournalEntryDraft | null => {
  try {
    const parsed = JSON.parse(raw) as Partial<JournalEntryDraft>;
    if (!parsed || typeof parsed.savedAt !== 'number' || !parsed.values) {
      return null;
    }
    return {
      savedAt: parsed.savedAt,
      values: {
        ...defaultJournalEntryValues,
        ...parsed.values,
      },
    };
  } catch {
    return null;
  }
};

const JournalEntryFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    data: existingEntry,
    isLoading: entryLoading,
    isError: entryError,
    refetch: refetchEntry,
  } = useQuery({
    queryKey: ['journal-entry', id],
    queryFn: () => accountingApi.getJournalEntry(id!),
    enabled: isEdit,
  });

  const { data: accountsPage } = useQuery({
    queryKey: ['accounting-accounts', 'form'],
    queryFn: () => accountingApi.getAccounts({ page: 0, size: 500, sort: 'code,asc' }),
  });

  const {
    data: periodsPage,
    isError: periodsError,
    refetch: refetchPeriods,
  } = useQuery({
    queryKey: ['accounting-periods'],
    queryFn: () => accountingApi.getPeriods({ page: 0, size: 120, sort: 'year,desc' }),
  });

  const {
    data: journalsPage,
    isError: journalsError,
    refetch: refetchJournals,
  } = useQuery({
    queryKey: ['financial-journals'],
    queryFn: () => accountingApi.getFinancialJournals({ page: 0, size: 200, sort: 'code,asc', active: true }),
  });

  const {
    register,
    reset,
    setValue,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<JournalEntryFormData>({
    resolver: zodResolver(journalEntrySchema),
    defaultValues: defaultJournalEntryValues,
  });

  const [restoredDraftAt, setRestoredDraftAt] = useState<number | null>(null);
  const [lastDraftSavedAt, setLastDraftSavedAt] = useState<number | null>(null);

  useEffect(() => {
    if (!existingEntry) {
      return;
    }

    reset({
      entryDate: existingEntry.entryDate,
      journalId: existingEntry.journalId,
      periodId: existingEntry.periodId,
      debitAccountId: existingEntry.debitAccountId,
      creditAccountId: existingEntry.creditAccountId,
      description: existingEntry.description,
      amount: String(existingEntry.amount),
      documentType: existingEntry.documentType ?? '',
      documentId: existingEntry.documentId ?? '',
      notes: '',
    });
  }, [existingEntry, reset]);

  const watchedValues = useWatch({ control });
  const amountValue = useWatch({ control, name: 'amount' });
  const selectedPeriodId = useWatch({ control, name: 'periodId' });
  const selectedJournalId = useWatch({ control, name: 'journalId' });
  const numericAmount = Number(String(amountValue ?? '').replace(/\s/g, '').replace(',', '.')) || 0;

  const accountOptions = useMemo(
    () =>
      (accountsPage?.content ?? []).map((account) => ({
        value: account.id,
        label: `${account.code} - ${account.name}`,
      })),
    [accountsPage?.content],
  );

  const periodOptions = useMemo(
    () =>
      (periodsPage?.content ?? []).map((period) => ({
        value: period.id,
        label: `${period.month.toString().padStart(2, '0')}.${period.year} (${period.statusDisplayName ?? period.status})`,
      })),
    [periodsPage?.content],
  );

  const journalOptions = useMemo(
    () =>
      (journalsPage?.content ?? []).map((journal) => ({
        value: journal.id,
        label: `${journal.code} - ${journal.name}`,
      })),
    [journalsPage?.content],
  );

  const openPeriods = useMemo(
    () => (periodsPage?.content ?? []).filter((period) => period.status === 'OPEN'),
    [periodsPage?.content],
  );

  useEffect(() => {
    if (isEdit || !periodsPage?.content?.length || selectedPeriodId) {
      return;
    }
    const preferredPeriod = openPeriods[0] ?? periodsPage.content[0];
    if (preferredPeriod) {
      setValue('periodId', preferredPeriod.id);
    }
  }, [isEdit, openPeriods, periodsPage?.content, selectedPeriodId, setValue]);

  useEffect(() => {
    if (isEdit || journalOptions.length === 0 || selectedJournalId) {
      return;
    }
    setValue('journalId', journalOptions[0].value);
  }, [isEdit, journalOptions, selectedJournalId, setValue]);

  useEffect(() => {
    if (isEdit || entryLoading) {
      return;
    }
    const raw = window.localStorage.getItem(JOURNAL_ENTRY_DRAFT_KEY);
    if (!raw) {
      return;
    }

    const parsed = parseJournalEntryDraft(raw);
    if (!parsed) {
      window.localStorage.removeItem(JOURNAL_ENTRY_DRAFT_KEY);
      return;
    }

    const maxDraftAgeMs = 1000 * 60 * 60 * 24 * 7;
    if (Date.now() - parsed.savedAt > maxDraftAgeMs) {
      window.localStorage.removeItem(JOURNAL_ENTRY_DRAFT_KEY);
      return;
    }

    reset({
      ...defaultJournalEntryValues,
      ...parsed.values,
    });
    setRestoredDraftAt(parsed.savedAt);
    setLastDraftSavedAt(parsed.savedAt);
  }, [entryLoading, isEdit, reset]);

  useEffect(() => {
    if (isEdit || entryLoading) {
      return;
    }

    const timer = window.setTimeout(() => {
      const draft: JournalEntryDraft = {
        savedAt: Date.now(),
        values: {
          ...defaultJournalEntryValues,
          ...watchedValues,
        },
      };
      window.localStorage.setItem(JOURNAL_ENTRY_DRAFT_KEY, JSON.stringify(draft));
      setLastDraftSavedAt(draft.savedAt);
    }, 500);

    return () => {
      window.clearTimeout(timer);
    };
  }, [entryLoading, isEdit, watchedValues]);

  const clearDraft = () => {
    window.localStorage.removeItem(JOURNAL_ENTRY_DRAFT_KEY);
    setRestoredDraftAt(null);
    setLastDraftSavedAt(null);
  };

  const canSubmit =
    accountOptions.length > 0 &&
    periodOptions.length > 0 &&
    (journalOptions.length > 0 || isEdit);

  const createMutation = useMutation({
    mutationFn: (values: JournalEntryFormData) => {
      const parsed = journalEntrySchema.parse(values);
      return accountingApi.createJournalEntry({
        journalId: values.journalId,
        periodId: values.periodId,
        debitAccountId: values.debitAccountId,
        creditAccountId: values.creditAccountId,
        entryDate: values.entryDate,
        amount: parsed.amount,
        description: values.description,
        documentType: values.documentType || undefined,
        documentId: values.documentId || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal-entries'] });
      queryClient.invalidateQueries({ queryKey: ['accounting-dashboard'] });
      window.localStorage.removeItem(JOURNAL_ENTRY_DRAFT_KEY);
      toast.success('Проводка создана');
      navigate('/accounting/journal');
    },
    onError: () => {
      toast.error('Не удалось создать проводку');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (values: JournalEntryFormData) => {
      const parsed = journalEntrySchema.parse(values);
      return accountingApi.updateJournalEntry(id!, {
        journalId: values.journalId,
        periodId: values.periodId,
        debitAccountId: values.debitAccountId,
        creditAccountId: values.creditAccountId,
        entryDate: values.entryDate,
        amount: parsed.amount,
        description: values.description,
        documentType: values.documentType || undefined,
        documentId: values.documentId || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal-entries'] });
      queryClient.invalidateQueries({ queryKey: ['journal-entry', id] });
      queryClient.invalidateQueries({ queryKey: ['accounting-dashboard'] });
      toast.success('Проводка обновлена');
      navigate('/accounting/journal');
    },
    onError: () => {
      toast.error('Не удалось обновить проводку');
    },
  });

  const openCurrentPeriodMutation = useMutation({
    mutationFn: () => {
      const now = new Date();
      return accountingApi.openPeriod(now.getFullYear(), now.getMonth() + 1);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounting-periods'] });
      toast.success('Текущий период открыт');
    },
    onError: () => {
      toast.error('Не удалось открыть период');
    },
  });

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  if (entryError && isEdit && !existingEntry) {
    return (
      <div className="animate-fade-in">
        <PageHeader
          title="Проводка"
          subtitle="Редактирование"
          backTo="/accounting/journal"
          breadcrumbs={[
            { label: 'Главная', href: '/' },
            { label: 'Бухгалтерия', href: '/accounting' },
            { label: 'Журнал проводок', href: '/accounting/journal' },
            { label: 'Редактирование' },
          ]}
        />
        <EmptyState
          variant="ERROR"
          title="Проводка не найдена"
          description="Возможно, запись была удалена или недоступна"
          actionLabel="Повторить"
          onAction={() => {
            void refetchEntry();
          }}
        />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={isEdit ? 'Редактирование проводки' : 'Новая проводка'}
        subtitle={isEdit ? existingEntry?.number : 'Создание бухгалтерской проводки'}
        backTo="/accounting/journal"
        breadcrumbs={[
          { label: 'Главная', href: '/' },
          { label: 'Бухгалтерия', href: '/accounting' },
          { label: 'Журнал проводок', href: '/accounting/journal' },
          { label: isEdit ? 'Редактирование' : 'Создание' },
        ]}
      />

      {!canSubmit && !entryLoading && (
        <div className="bg-warning-50 border border-warning-200 text-warning-800 rounded-xl p-4 mb-6 text-sm">
          Для создания проводки нужны справочники: план счетов, периоды и финансовые журналы.
          <div className="mt-2 flex flex-wrap gap-2">
            {(periodOptions.length === 0 || periodsError) && (
              <Button size="sm" variant="secondary" onClick={() => { void refetchPeriods(); }}>
                Обновить периоды
              </Button>
            )}
            {openPeriods.length === 0 && (
              <Button
                size="sm"
                variant="secondary"
                loading={openCurrentPeriodMutation.isPending}
                onClick={() => {
                  openCurrentPeriodMutation.mutate();
                }}
              >
                Открыть текущий период
              </Button>
            )}
            {(journalOptions.length === 0 || journalsError) && (
              <>
                <Button size="sm" variant="secondary" onClick={() => { void refetchJournals(); }}>
                  Обновить журналы
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => navigate('/accounting/journals')}
                >
                  Управлять журналами
                </Button>
              </>
            )}
          </div>
        </div>
      )}

      {!isEdit && (restoredDraftAt || lastDraftSavedAt) && (
        <div className="bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl p-4 mb-6 text-sm flex items-center justify-between gap-3">
          <p className="text-neutral-700 dark:text-neutral-300">
            {restoredDraftAt
              ? `Черновик восстановлен (${formatDateTime(new Date(restoredDraftAt).toISOString())}).`
              : 'Автосохранение черновика включено.'}
            {lastDraftSavedAt
              ? ` Последнее сохранение: ${formatDateTime(new Date(lastDraftSavedAt).toISOString())}.`
              : ''}
          </p>
          <Button size="sm" variant="secondary" type="button" onClick={clearDraft}>
            Очистить черновик
          </Button>
        </div>
      )}

      <form
        onSubmit={handleSubmit((values) => {
          if (isEdit) {
            updateMutation.mutate(values);
            return;
          }
          createMutation.mutate(values);
        })}
        className="max-w-4xl"
      >
        <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-6">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-5">Основная информация</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FormField label="Дата проводки" error={errors.entryDate?.message} required>
              <Input type="date" hasError={!!errors.entryDate} {...register('entryDate')} />
            </FormField>

            <FormField
              label="Период"
              error={errors.periodId?.message}
              hint={openPeriods.length === 0 ? 'Нет открытых периодов. Создайте период выше.' : undefined}
              required
            >
              <Select
                options={periodOptions}
                placeholder="Выберите период"
                hasError={!!errors.periodId}
                {...register('periodId')}
              />
            </FormField>

            <div className="sm:col-span-2">
              <FormField
                label="Финансовый журнал"
                error={errors.journalId?.message}
                hint="Выберите журнал из справочника"
                required
              >
                <Select
                  options={journalOptions}
                  placeholder="Выберите финансовый журнал"
                  hasError={!!errors.journalId}
                  {...register('journalId')}
                />
              </FormField>
            </div>

            <FormField label="Описание операции" error={errors.description?.message} required className="sm:col-span-2">
              <Input
                placeholder="Например: Поступление материалов от поставщика"
                hasError={!!errors.description}
                {...register('description')}
              />
            </FormField>
          </div>
        </section>

        <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-6">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-5">Счета и сумма</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FormField label="Дебет" error={errors.debitAccountId?.message} required>
              <Select
                options={accountOptions}
                placeholder="Выберите счёт дебета"
                hasError={!!errors.debitAccountId}
                {...register('debitAccountId')}
              />
            </FormField>

            <FormField label="Кредит" error={errors.creditAccountId?.message} required>
              <Select
                options={accountOptions}
                placeholder="Выберите счёт кредита"
                hasError={!!errors.creditAccountId}
                {...register('creditAccountId')}
              />
            </FormField>

            <FormField label="Сумма" error={errors.amount?.message} required>
              <Input
                type="text"
                inputMode="decimal"
                placeholder="0.00"
                hasError={!!errors.amount}
                {...register('amount')}
              />
            </FormField>

            <FormField label="Тип документа" error={errors.documentType?.message}>
              <Input
                placeholder="Например: УПД, ПП, Счёт"
                hasError={!!errors.documentType}
                {...register('documentType')}
              />
            </FormField>

            <FormField label="UUID документа" error={errors.documentId?.message} className="sm:col-span-2">
              <Input
                placeholder="Необязательно"
                hasError={!!errors.documentId}
                {...register('documentId')}
              />
            </FormField>
          </div>

          {numericAmount > 0 && (
            <div className="mt-4 pt-4 border-t border-neutral-100">
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-0.5">Предпросмотр суммы</p>
              <p className="text-sm font-semibold text-primary-700 tabular-nums">{formatMoney(numericAmount)}</p>
            </div>
          )}
        </section>

        <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-8">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-5">Комментарий</h2>
          <FormField label="Заметки" error={errors.notes?.message}>
            <Textarea
              placeholder="Дополнительная информация"
              rows={3}
              hasError={!!errors.notes}
              {...register('notes')}
            />
          </FormField>
        </section>

        <div className="flex items-center gap-3">
          <Button type="submit" loading={isSubmitting} disabled={!canSubmit || entryLoading}>
            {isEdit ? 'Сохранить изменения' : 'Создать проводку'}
          </Button>
          <Button type="button" variant="secondary" onClick={() => navigate('/accounting/journal')}>
            Назад
          </Button>
        </div>
      </form>
    </div>
  );
};

export default JournalEntryFormPage;
