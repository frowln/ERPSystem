import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { Plus, Search, BookOpen, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { DataTable } from '@/design-system/components/DataTable';
import { EmptyState } from '@/design-system/components/EmptyState';
import { Input, Select } from '@/design-system/components/FormField';
import { useConfirmDialog } from '@/design-system/components/ConfirmDialog/provider';
import { accountingApi, type JournalEntry } from '@/api/accounting';
import { formatMoney, formatDate } from '@/lib/format';

const JournalEntriesPage: React.FC = () => {
  const navigate = useNavigate();
  const confirm = useConfirmDialog();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [accountFilter, setAccountFilter] = useState('');
  const [periodFilter, setPeriodFilter] = useState('');
  const [journalFilter, setJournalFilter] = useState('');

  const {
    data: entriesData,
    isLoading: entriesLoading,
    isError: entriesError,
    refetch,
  } = useQuery({
    queryKey: ['journal-entries', periodFilter, journalFilter],
    queryFn: () =>
      accountingApi.getJournalEntries({
        page: 0,
        size: 500,
        sort: 'entryDate,desc',
        periodId: periodFilter || undefined,
        journalId: journalFilter || undefined,
      }),
  });

  const { data: accountsData } = useQuery({
    queryKey: ['accounting-accounts', 'journal'],
    queryFn: () => accountingApi.getAccounts({ page: 0, size: 500, sort: 'code,asc' }),
  });

  const { data: periodsData } = useQuery({
    queryKey: ['accounting-periods', 'journal'],
    queryFn: () => accountingApi.getPeriods({ page: 0, size: 120, sort: 'year,desc' }),
  });

  const { data: journalsData } = useQuery({
    queryKey: ['financial-journals', 'journal'],
    queryFn: () => accountingApi.getFinancialJournals({ page: 0, size: 200, sort: 'code,asc', active: true }),
  });

  const accountById = useMemo(() => {
    const map = new Map<string, { code: string; name: string }>();
    (accountsData?.content ?? []).forEach((account) => {
      map.set(account.id, { code: account.code, name: account.name });
    });
    return map;
  }, [accountsData?.content]);

  const entries = entriesData?.content ?? [];

  const filtered = useMemo(() => {
    let result = entries;

    if (accountFilter) {
      result = result.filter(
        (entry) => entry.debitAccountId === accountFilter || entry.creditAccountId === accountFilter,
      );
    }

    const normalizedSearch = search.trim().toLowerCase();
    if (normalizedSearch) {
      result = result.filter((entry) => {
        const debitLabel = accountById.get(entry.debitAccountId);
        const creditLabel = accountById.get(entry.creditAccountId);

        return (
          entry.number.toLowerCase().includes(normalizedSearch) ||
          entry.description.toLowerCase().includes(normalizedSearch) ||
          (entry.documentType ?? '').toLowerCase().includes(normalizedSearch) ||
          (debitLabel?.code ?? '').toLowerCase().includes(normalizedSearch) ||
          (creditLabel?.code ?? '').toLowerCase().includes(normalizedSearch)
        );
      });
    }

    return result;
  }, [entries, accountById, accountFilter, search]);

  const totalAmount = useMemo(
    () => filtered.reduce((sum, entry) => sum + entry.amount, 0),
    [filtered],
  );

  const bulkDeleteMutation = useMutation({
    mutationFn: async (selectedRows: JournalEntry[]) => {
      const uniqueIds = Array.from(new Set(selectedRows.map((entry) => entry.id)));
      await accountingApi.deleteJournalEntriesBulk(uniqueIds);
      return uniqueIds.length;
    },
    onMutate: () => {
      toast.loading('Удаление проводок...', { id: 'journal-entries-bulk-delete' });
    },
    onSuccess: (deletedCount) => {
      queryClient.invalidateQueries({ queryKey: ['journal-entries'] });
      queryClient.invalidateQueries({ queryKey: ['accounting-dashboard'] });
      toast.success(`Удалено проводок: ${deletedCount}`, { id: 'journal-entries-bulk-delete' });
    },
    onError: () => {
      toast.error('Не удалось удалить выбранные проводки', { id: 'journal-entries-bulk-delete' });
    },
  });

  const accountOptions = useMemo(
    () => [
      { value: '', label: 'Все счета' },
      ...(accountsData?.content ?? []).map((account) => ({
        value: account.id,
        label: `${account.code} - ${account.name}`,
      })),
    ],
    [accountsData?.content],
  );

  const periodOptions = useMemo(
    () => [
      { value: '', label: 'Все периоды' },
      ...(periodsData?.content ?? []).map((period) => ({
        value: period.id,
        label: `${period.month.toString().padStart(2, '0')}.${period.year}`,
      })),
    ],
    [periodsData?.content],
  );

  const journalOptions = useMemo(
    () => [
      { value: '', label: 'Все журналы' },
      ...(journalsData?.content ?? []).map((journal) => ({
        value: journal.id,
        label: `${journal.code} - ${journal.name}`,
      })),
    ],
    [journalsData?.content],
  );

  const columns = useMemo<ColumnDef<JournalEntry, unknown>[]>(
    () => [
      {
        accessorKey: 'number',
        header: '№ проводки',
        size: 120,
        cell: ({ getValue }) => (
          <span className="font-mono text-xs text-neutral-500 dark:text-neutral-400">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'entryDate',
        header: 'Дата',
        size: 110,
        cell: ({ getValue }) => (
          <span className="tabular-nums">{formatDate(getValue<string>())}</span>
        ),
      },
      {
        accessorKey: 'description',
        header: 'Операция',
        size: 330,
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-neutral-900 dark:text-neutral-100">{row.original.description}</p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              Документ: {row.original.documentType ?? 'не указан'}
            </p>
          </div>
        ),
      },
      {
        accessorKey: 'debitAccountId',
        header: 'Дебет',
        size: 220,
        cell: ({ getValue }) => {
          const accountId = getValue<string>();
          const account = accountById.get(accountId);
          return (
            <span className="text-sm text-neutral-700 dark:text-neutral-300">
              {account ? `${account.code} - ${account.name}` : accountId.slice(0, 8)}
            </span>
          );
        },
      },
      {
        accessorKey: 'creditAccountId',
        header: 'Кредит',
        size: 220,
        cell: ({ getValue }) => {
          const accountId = getValue<string>();
          const account = accountById.get(accountId);
          return (
            <span className="text-sm text-neutral-700 dark:text-neutral-300">
              {account ? `${account.code} - ${account.name}` : accountId.slice(0, 8)}
            </span>
          );
        },
      },
      {
        accessorKey: 'amount',
        header: 'Сумма',
        size: 170,
        cell: ({ getValue }) => (
          <span className="tabular-nums font-medium text-right block">
            {formatMoney(getValue<number>())}
          </span>
        ),
      },
      {
        accessorKey: 'createdBy',
        header: 'Автор',
        size: 150,
        cell: ({ getValue }) => getValue<string>() || 'Система',
      },
    ],
    [accountById],
  );

  if (entriesError && entries.length === 0) {
    return (
      <div className="animate-fade-in">
        <PageHeader
          title="Журнал проводок"
          subtitle="Проводки бухгалтерского учёта"
          breadcrumbs={[
            { label: 'Главная', href: '/' },
            { label: 'Бухгалтерия', href: '/accounting' },
            { label: 'Журнал проводок' },
          ]}
        />
        <EmptyState
          variant="ERROR"
          title="Не удалось загрузить проводки"
          description="Проверьте соединение и повторите попытку"
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
        title="Журнал проводок"
        subtitle={`${entries.length} проводок | Отфильтровано: ${formatMoney(totalAmount)}`}
        breadcrumbs={[
          { label: 'Главная', href: '/' },
          { label: 'Бухгалтерия', href: '/accounting' },
          { label: 'Журнал проводок' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              iconLeft={<BookOpen size={16} />}
              onClick={() => navigate('/accounting/journals')}
            >
              Журналы
            </Button>
            <Button iconLeft={<Plus size={16} />} onClick={() => navigate('/accounting/journal/new')}>
              Новая проводка
            </Button>
          </div>
        }
      />

      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[240px] max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input
            placeholder="Поиск по номеру, описанию..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="pl-9"
          />
        </div>

        <Select
          options={accountOptions}
          value={accountFilter}
          onChange={(event) => setAccountFilter(event.target.value)}
          className="w-72"
        />

        <Select
          options={periodOptions}
          value={periodFilter}
          onChange={(event) => setPeriodFilter(event.target.value)}
          className="w-56"
        />

        <Select
          options={journalOptions}
          value={journalFilter}
          onChange={(event) => setJournalFilter(event.target.value)}
          className="w-64"
        />
      </div>

      <DataTable<JournalEntry>
        data={filtered}
        columns={columns}
        loading={entriesLoading}
        onRowClick={(entry) => navigate(`/accounting/journal/${entry.id}`)}
        enableRowSelection
        enableColumnVisibility
        enableDensityToggle
        enableExport
        enableSavedViews
        savedViewsKey="accounting-journal-entries"
        bulkActions={[
          {
            label: bulkDeleteMutation.isPending ? 'Удаление...' : 'Удалить',
            icon: <Trash2 size={14} />,
            variant: 'danger',
            onClick: (selectedRows) => {
              if (bulkDeleteMutation.isPending || selectedRows.length === 0) {
                return;
              }
              void (async () => {
                const isConfirmed = await confirm({
                  title: `Удалить ${selectedRows.length} проводок?`,
                  description: 'Действие обратимо только через резервную копию.',
                  confirmLabel: 'Удалить',
                  cancelLabel: 'Отмена',
                  confirmVariant: 'danger',
                  items: selectedRows.slice(0, 5).map((row) => row.number),
                });
                if (!isConfirmed) {
                  return;
                }
                bulkDeleteMutation.mutate(selectedRows);
              })();
            },
          },
        ]}
        pageSize={20}
        emptyTitle="Нет проводок"
        emptyDescription="Создайте первую бухгалтерскую проводку"
      />
    </div>
  );
};

export default JournalEntriesPage;
