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
import { t } from '@/i18n';

const getCreateJournalSchema = () => z.object({
  code: z
    .string()
    .trim()
    .min(2, t('accounting.fjValidationCodeMin'))
    .max(20, t('accounting.fjValidationCodeMax'))
    .regex(/^[A-Za-z0-9_-]+$/, t('accounting.fjValidationCodeFormat')),
  name: z.string().trim().min(2, t('accounting.fjValidationNameMin')).max(500, t('accounting.fjValidationNameMax')),
  journalType: z.enum(['BANK', 'CASH', 'SALES', 'PURCHASE', 'GENERAL']),
});

type CreateJournalFormData = z.input<ReturnType<typeof getCreateJournalSchema>>;

const getJournalTypeLabels = (): Record<JournalType, string> => ({
  BANK: t('accounting.fjTypeBank'),
  CASH: t('accounting.fjTypeCash'),
  SALES: t('accounting.fjTypeSales'),
  PURCHASE: t('accounting.fjTypePurchase'),
  GENERAL: t('accounting.fjTypeGeneral'),
});

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

  const createJournalSchema = useMemo(() => getCreateJournalSchema(), []);
  const journalTypeLabels = getJournalTypeLabels();

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
      toast.success(t('accounting.fjCreateSuccess', { code: journal.code }));
      reset({ code: '', name: '', journalType: 'GENERAL' });
    },
    onError: () => {
      toast.error(t('accounting.fjCreateError'));
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
      toast.success(journal.active ? t('accounting.fjActivateSuccess', { code: journal.code }) : t('accounting.fjDeactivateSuccess', { code: journal.code }));
    },
    onError: () => {
      toast.error(t('accounting.fjToggleStatusError'));
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
        header: t('accounting.fjColCode'),
        size: 120,
        cell: ({ getValue }) => (
          <span className="font-mono text-xs text-neutral-600">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'name',
        header: t('accounting.fjColName'),
        size: 320,
        cell: ({ getValue }) => (
          <span className="font-medium text-neutral-900 dark:text-neutral-100">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'journalType',
        header: t('accounting.fjColType'),
        size: 180,
        cell: ({ row }) => row.original.journalTypeDisplayName ?? journalTypeLabels[row.original.journalType],
      },
      {
        accessorKey: 'active',
        header: t('accounting.fjColStatus'),
        size: 120,
        cell: ({ getValue }) => {
          const active = getValue<boolean>();
          return (
            <StatusBadge
              status={active ? 'active' : 'inactive'}
              colorMap={statusColorMap}
              label={active ? t('accounting.fjStatusActive') : t('accounting.fjStatusInactive')}
            />
          );
        },
      },
      {
        accessorKey: 'createdAt',
        header: t('accounting.fjColCreatedAt'),
        size: 180,
        cell: ({ getValue }) => formatDateTime(getValue<string>()),
      },
      {
        id: 'actions',
        header: t('accounting.fjColActions'),
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
                    title: t('accounting.fjDeactivateTitle', { code: journal.code }),
                    description: t('accounting.fjDeactivateDescription'),
                    confirmLabel: t('accounting.fjDeactivateConfirm'),
                    cancelLabel: t('accounting.fjDeactivateCancel'),
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
              {journal.active ? t('accounting.fjDeactivateButton') : t('accounting.fjActivateButton')}
            </Button>
          );
        },
      },
    ],
    [confirm, journalTypeLabels, pendingJournalId, toggleStatusMutation],
  );

  if (isError && journals.length === 0) {
    return (
      <div className="animate-fade-in">
        <PageHeader
          title={t('accounting.fjTitle')}
          subtitle={t('accounting.fjSubtitle')}
          breadcrumbs={[
            { label: t('accounting.breadcrumbHome'), href: '/' },
            { label: t('accounting.breadcrumbAccounting'), href: '/accounting' },
            { label: t('accounting.breadcrumbFinancialJournals') },
          ]}
        />
        <EmptyState
          variant="ERROR"
          title={t('accounting.fjErrorTitle')}
          description={t('accounting.checkConnectionTryAgain')}
          actionLabel={t('accounting.retry')}
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
        title={t('accounting.fjTitle')}
        subtitle={t('accounting.fjSubtitleCount', { count: journals.length })}
        breadcrumbs={[
          { label: t('accounting.breadcrumbHome'), href: '/' },
          { label: t('accounting.breadcrumbAccounting'), href: '/accounting' },
          { label: t('accounting.breadcrumbFinancialJournals') },
        ]}
      />

      <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen size={16} className="text-primary-600" />
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">{t('accounting.fjCreateTitle')}</h2>
        </div>

        <form
          className="grid grid-cols-1 lg:grid-cols-4 gap-4"
          onSubmit={handleSubmit((values) => createMutation.mutate(values))}
        >
          <FormField label={t('accounting.fjLabelCode')} error={errors.code?.message} required>
            <Input placeholder={t('accounting.fjPlaceholderCode')} hasError={!!errors.code} {...register('code')} />
          </FormField>

          <FormField label={t('accounting.fjLabelName')} error={errors.name?.message} required>
            <Input
              placeholder={t('accounting.fjPlaceholderName')}
              hasError={!!errors.name}
              {...register('name')}
            />
          </FormField>

          <FormField label={t('accounting.fjLabelType')} error={errors.journalType?.message} required>
            <Select
              options={Object.entries(journalTypeLabels).map(([value, label]) => ({ value, label }))}
              hasError={!!errors.journalType}
              {...register('journalType')}
            />
          </FormField>

          <div className="flex items-end">
            <Button type="submit" iconLeft={<Plus size={16} />} loading={createMutation.isPending} fullWidth>
              {t('accounting.fjCreateButton')}
            </Button>
          </div>
        </form>
      </section>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input
            placeholder={t('accounting.fjSearchPlaceholder')}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="pl-9"
          />
        </div>

        <Select
          options={[
            { value: '', label: t('accounting.fjAllTypes') },
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
        emptyTitle={t('accounting.fjEmptyTitle')}
        emptyDescription={t('accounting.fjEmptyDescription')}
      />
    </div>
  );
};

export default FinancialJournalsPage;
