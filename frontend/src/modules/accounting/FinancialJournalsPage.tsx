import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { BookOpen, Plus, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { DataTable } from '@/design-system/components/DataTable';
import { EmptyState } from '@/design-system/components/EmptyState';
import { FormField, Input, Select } from '@/design-system/components/FormField';
import { useConfirmDialog } from '@/design-system/components/ConfirmDialog/provider';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { accountingApi, type FinancialJournal, type JournalType } from '@/api/accounting';
import { formatDateTime } from '@/lib/format';

const createJournalSchema = z.object({
  code: z
    .string()
    .trim()
    .min(2, 'Минимум 2 символа')
    .max(20, 'Максимум 20 символов')
    .regex(/^[A-Za-z0-9_-]+$/, 'Только латиница, цифры, "_" и "-"'),
  name: z.string().trim().min(2, 'Минимум 2 символа').max(500, 'Максимум 500 символов'),
  journalType: z.enum(['BANK', 'CASH', 'SALES', 'PURCHASE', 'GENERAL']),
});

type CreateJournalFormData = z.input<typeof createJournalSchema>;

const journalTypeLabels: Record<JournalType, string> = {
  BANK: 'Банковский',
  CASH: 'Кассовый',
  SALES: 'Продажи',
  PURCHASE: 'Закупки',
  GENERAL: 'Общий',
};

const statusColorMap: Record<string, 'green' | 'gray' | 'red' | 'yellow' | 'blue'> = {
  active: 'green',
  inactive: 'gray',
};

const FinancialJournalsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const confirm = useConfirmDialog();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [pendingJournalId, setPendingJournalId] = useState<string | null>(null);

  const {
    data,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['financial-journals', 'management'],
    queryFn: () => accountingApi.getFinancialJournals({ page: 0, size: 200, sort: 'code,asc' }),
  });

  const journals = data?.content ?? [];

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateJournalFormData>({
    resolver: zodResolver(createJournalSchema),
    defaultValues: {
      code: '',
      name: '',
      journalType: 'GENERAL',
    },
  });

  const createMutation = useMutation({
    mutationFn: (values: CreateJournalFormData) => {
      const parsed = createJournalSchema.parse(values);
      return accountingApi.createFinancialJournal({
        code: parsed.code.toUpperCase(),
        name: parsed.name,
        journalType: parsed.journalType,
      });
    },
    onSuccess: (journal) => {
      queryClient.invalidateQueries({ queryKey: ['financial-journals'] });
      queryClient.invalidateQueries({ queryKey: ['financial-journals', 'management'] });
      toast.success(`Журнал ${journal.code} создан`);
      reset({ code: '', name: '', journalType: 'GENERAL' });
    },
    onError: () => {
      toast.error('Не удалось создать финансовый журнал');
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: (journal: FinancialJournal) =>
      journal.active
        ? accountingApi.deactivateFinancialJournal(journal.id)
        : accountingApi.activateFinancialJournal(journal.id),
    onMutate: (journal) => {
      setPendingJournalId(journal.id);
    },
    onSuccess: (journal) => {
      queryClient.invalidateQueries({ queryKey: ['financial-journals'] });
      queryClient.invalidateQueries({ queryKey: ['financial-journals', 'management'] });
      toast.success(journal.active ? `Журнал ${journal.code} активирован` : `Журнал ${journal.code} деактивирован`);
    },
    onError: () => {
      toast.error('Не удалось обновить статус журнала');
    },
    onSettled: () => {
      setPendingJournalId(null);
    },
  });

  const filtered = useMemo(() => {
    let result = journals;

    if (typeFilter) {
      result = result.filter((journal) => journal.journalType === typeFilter);
    }

    const normalizedSearch = search.trim().toLowerCase();
    if (normalizedSearch) {
      result = result.filter(
        (journal) =>
          journal.code.toLowerCase().includes(normalizedSearch) ||
          journal.name.toLowerCase().includes(normalizedSearch),
      );
    }

    return result;
  }, [journals, search, typeFilter]);

  const columns = useMemo<ColumnDef<FinancialJournal, unknown>[]>(
    () => [
      {
        accessorKey: 'code',
        header: 'Код',
        size: 120,
        cell: ({ getValue }) => (
          <span className="font-mono text-xs text-neutral-600">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'name',
        header: 'Наименование',
        size: 320,
        cell: ({ getValue }) => (
          <span className="font-medium text-neutral-900 dark:text-neutral-100">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'journalType',
        header: 'Тип',
        size: 180,
        cell: ({ row }) => row.original.journalTypeDisplayName ?? journalTypeLabels[row.original.journalType],
      },
      {
        accessorKey: 'active',
        header: 'Статус',
        size: 120,
        cell: ({ getValue }) => {
          const active = getValue<boolean>();
          return (
            <StatusBadge
              status={active ? 'active' : 'inactive'}
              colorMap={statusColorMap}
              label={active ? 'Активен' : 'Неактивен'}
            />
          );
        },
      },
      {
        accessorKey: 'createdAt',
        header: 'Создан',
        size: 180,
        cell: ({ getValue }) => formatDateTime(getValue<string>()),
      },
      {
        id: 'actions',
        header: 'Действия',
        size: 170,
        cell: ({ row }) => {
          const journal = row.original;
          const isPending = toggleStatusMutation.isPending && pendingJournalId === journal.id;
          return (
            <Button
              size="sm"
              variant={journal.active ? 'secondary' : 'primary'}
              loading={isPending}
              onClick={async () => {
                if (journal.active) {
                  const isConfirmed = await confirm({
                    title: `Деактивировать журнал "${journal.code}"?`,
                    description: 'Проводки останутся доступными, но новые записи будут ограничены.',
                    confirmLabel: 'Деактивировать',
                    cancelLabel: 'Отмена',
                    confirmVariant: 'danger',
                    items: [journal.code],
                  });
                  if (!isConfirmed) {
                    return;
                  }
                }
                toggleStatusMutation.mutate(journal);
              }}
            >
              {journal.active ? 'Деактивировать' : 'Активировать'}
            </Button>
          );
        },
      },
    ],
    [confirm, pendingJournalId, toggleStatusMutation],
  );

  if (isError && journals.length === 0) {
    return (
      <div className="animate-fade-in">
        <PageHeader
          title="Финансовые журналы"
          subtitle="Справочник журналов бухгалтерских проводок"
          breadcrumbs={[
            { label: 'Главная', href: '/' },
            { label: 'Бухгалтерия', href: '/accounting' },
            { label: 'Финансовые журналы' },
          ]}
        />
        <EmptyState
          variant="ERROR"
          title="Не удалось загрузить финансовые журналы"
          description="Проверьте соединение и попробуйте снова"
          actionLabel="Повторить"
          onAction={() => {
            void refetch();
          }}
        />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Финансовые журналы"
        subtitle={`${journals.length} журналов`}
        breadcrumbs={[
          { label: 'Главная', href: '/' },
          { label: 'Бухгалтерия', href: '/accounting' },
          { label: 'Финансовые журналы' },
        ]}
      />

      <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen size={16} className="text-primary-600" />
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">Создать журнал</h2>
        </div>

        <form
          className="grid grid-cols-1 lg:grid-cols-4 gap-4"
          onSubmit={handleSubmit((values) => createMutation.mutate(values))}
        >
          <FormField label="Код" error={errors.code?.message} required>
            <Input placeholder="Например: GEN" hasError={!!errors.code} {...register('code')} />
          </FormField>

          <FormField label="Наименование" error={errors.name?.message} required>
            <Input
              placeholder="Например: Общий журнал"
              hasError={!!errors.name}
              {...register('name')}
            />
          </FormField>

          <FormField label="Тип" error={errors.journalType?.message} required>
            <Select
              options={Object.entries(journalTypeLabels).map(([value, label]) => ({ value, label }))}
              hasError={!!errors.journalType}
              {...register('journalType')}
            />
          </FormField>

          <div className="flex items-end">
            <Button type="submit" iconLeft={<Plus size={16} />} loading={createMutation.isPending} fullWidth>
              Создать
            </Button>
          </div>
        </form>
      </section>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input
            placeholder="Поиск по коду или названию..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="pl-9"
          />
        </div>

        <Select
          options={[
            { value: '', label: 'Все типы' },
            ...Object.entries(journalTypeLabels).map(([value, label]) => ({ value, label })),
          ]}
          value={typeFilter}
          onChange={(event) => setTypeFilter(event.target.value)}
          className="w-56"
        />
      </div>

      <DataTable<FinancialJournal>
        data={filtered}
        columns={columns}
        loading={isLoading}
        enableColumnVisibility
        enableDensityToggle
        enableExport
        pageSize={20}
        emptyTitle="Нет финансовых журналов"
        emptyDescription="Создайте первый журнал, чтобы формировать проводки"
      />
    </div>
  );
};

export default FinancialJournalsPage;
