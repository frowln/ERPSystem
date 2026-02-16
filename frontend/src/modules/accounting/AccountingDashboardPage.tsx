import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import {
  Wallet,
  BookOpen,
  ArrowRight,
  Scale,
  Layers,
  CalendarDays,
  Boxes,
  FolderTree,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { DataTable } from '@/design-system/components/DataTable';
import { MetricCard } from '@/design-system/components/MetricCard';
import { EmptyState } from '@/design-system/components/EmptyState';
import { accountingApi, type JournalEntry } from '@/api/accounting';
import { formatMoney, formatDate } from '@/lib/format';
import { t } from '@/i18n';

const AccountingDashboardPage: React.FC = () => {
  const navigate = useNavigate();

  const {
    data: dashboard,
    isLoading: dashboardLoading,
    isError: dashboardError,
    refetch,
  } = useQuery({
    queryKey: ['accounting-dashboard'],
    queryFn: () => accountingApi.getDashboard(),
  });

  const { data: accountsPage } = useQuery({
    queryKey: ['accounting-accounts', 'summary'],
    queryFn: () => accountingApi.getAccounts({ page: 0, size: 500, sort: 'code,asc' }),
  });

  const accountById = useMemo(() => {
    const map = new Map<string, string>();
    (accountsPage?.content ?? []).forEach((account) => {
      map.set(account.id, `${account.code} - ${account.name}`);
    });
    return map;
  }, [accountsPage?.content]);

  const entries = dashboard?.recentEntries ?? [];

  const columns = useMemo<ColumnDef<JournalEntry, unknown>[]>(
    () => [
      {
        accessorKey: 'number',
        header: t('accounting.colNumber'),
        size: 110,
        cell: ({ getValue }) => (
          <span className="font-mono text-xs text-neutral-500 dark:text-neutral-400">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'entryDate',
        header: t('accounting.colDate'),
        size: 120,
        cell: ({ getValue }) => (
          <span className="tabular-nums">{formatDate(getValue<string>())}</span>
        ),
      },
      {
        accessorKey: 'description',
        header: t('accounting.colDescription'),
        size: 360,
        cell: ({ getValue }) => (
          <span className="font-medium text-neutral-900 dark:text-neutral-100">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'debitAccountId',
        header: t('accounting.colDebit'),
        size: 220,
        cell: ({ getValue }) => {
          const accountId = getValue<string>();
          return (
            <span className="text-sm text-neutral-700 dark:text-neutral-300">
              {accountById.get(accountId) ?? accountId.slice(0, 8)}
            </span>
          );
        },
      },
      {
        accessorKey: 'creditAccountId',
        header: t('accounting.colCredit'),
        size: 220,
        cell: ({ getValue }) => {
          const accountId = getValue<string>();
          return (
            <span className="text-sm text-neutral-700 dark:text-neutral-300">
              {accountById.get(accountId) ?? accountId.slice(0, 8)}
            </span>
          );
        },
      },
      {
        accessorKey: 'amount',
        header: t('accounting.colAmount'),
        size: 170,
        cell: ({ getValue }) => (
          <span className="tabular-nums font-medium text-right block">
            {formatMoney(getValue<number>())}
          </span>
        ),
      },
      {
        accessorKey: 'createdBy',
        header: t('accounting.colAuthor'),
        size: 140,
        cell: ({ getValue }) => getValue<string>() || t('accounting.system'),
      },
    ],
    [accountById],
  );

  if (dashboardError && !dashboard) {
    return (
      <div className="animate-fade-in">
        <PageHeader
          title={t('accounting.dashboardTitle')}
          subtitle={t('accounting.dashboardSubtitle')}
          breadcrumbs={[
            { label: t('accounting.breadcrumbHome'), href: '/' },
            { label: t('accounting.breadcrumbAccounting') },
          ]}
        />
        <EmptyState
          variant="ERROR"
          title={t('accounting.dashboardErrorTitle')}
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
        title={t('accounting.dashboardTitle')}
        subtitle={t('accounting.dashboardSubtitle')}
        breadcrumbs={[
          { label: t('accounting.breadcrumbHome'), href: '/' },
          { label: t('accounting.breadcrumbAccounting') },
        ]}
        actions={
          <div className="flex gap-2">
            <Button
              variant="secondary"
              iconLeft={<BookOpen size={16} />}
              onClick={() => navigate('/accounting/chart')}
            >
              {t('accounting.dashboardChartOfAccounts')}
            </Button>
            <Button
              variant="secondary"
              iconLeft={<FolderTree size={16} />}
              onClick={() => navigate('/accounting/journals')}
            >
              {t('accounting.dashboardFinJournals')}
            </Button>
            <Button
              iconLeft={<ArrowRight size={16} />}
              onClick={() => navigate('/accounting/journal')}
            >
              {t('accounting.dashboardJournalEntries')}
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard
          icon={<Wallet size={18} />}
          label={t('accounting.metricTotalAccounts')}
          value={dashboard?.totalAccounts ?? 0}
          subtitle={t('accounting.metricTotalAccountsSub')}
        />
        <MetricCard
          icon={<Scale size={18} />}
          label={t('accounting.metricEntries')}
          value={dashboard?.entriesCount ?? 0}
          subtitle={t('accounting.metricEntriesSub')}
        />
        <MetricCard
          icon={<CalendarDays size={18} />}
          label={t('accounting.metricOpenPeriods')}
          value={dashboard?.openPeriodsCount ?? 0}
          subtitle={t('accounting.metricOpenPeriodsSub')}
        />
        <MetricCard
          icon={<Boxes size={18} />}
          label={t('accounting.metricFixedAssetsValue')}
          value={formatMoney(dashboard?.fixedAssetsCurrentValue ?? 0)}
          subtitle={t('accounting.metricFixedAssetsValueSub', { count: dashboard?.fixedAssetsCount ?? 0 })}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-5">
          <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-3">{t('accounting.chartStructureTitle')}</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between py-1.5">
              <span className="text-sm text-neutral-700 dark:text-neutral-300">{t('accounting.chartActive')}</span>
              <span className="text-sm font-medium tabular-nums">{dashboard?.activeAccounts ?? 0}</span>
            </div>
            <div className="flex items-center justify-between py-1.5">
              <span className="text-sm text-neutral-700 dark:text-neutral-300">{t('accounting.chartPassive')}</span>
              <span className="text-sm font-medium tabular-nums">{dashboard?.passiveAccounts ?? 0}</span>
            </div>
            <div className="flex items-center justify-between py-1.5">
              <span className="text-sm text-neutral-700 dark:text-neutral-300">{t('accounting.chartActivePassive')}</span>
              <span className="text-sm font-medium tabular-nums">
                {dashboard?.activePassiveAccounts ?? 0}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-5">
          <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-3">{t('accounting.turnoverTitle')}</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between py-1.5">
              <span className="text-sm text-neutral-700 dark:text-neutral-300">{t('accounting.turnoverAmount')}</span>
              <span className="text-sm font-medium tabular-nums">
                {formatMoney(dashboard?.entriesTotalAmount ?? 0)}
              </span>
            </div>
            <div className="flex items-center justify-between py-1.5">
              <span className="text-sm text-neutral-700 dark:text-neutral-300">{t('accounting.turnoverRecords')}</span>
              <span className="text-sm font-medium tabular-nums">{entries.length}</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-5">
          <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-3">{t('accounting.fixedAssetsSummaryTitle')}</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between py-1.5">
              <span className="text-sm text-neutral-700 dark:text-neutral-300">{t('accounting.fixedAssetsSummaryObjects')}</span>
              <span className="text-sm font-medium tabular-nums">{dashboard?.fixedAssetsCount ?? 0}</span>
            </div>
            <div className="flex items-center justify-between py-1.5">
              <span className="text-sm text-neutral-700 dark:text-neutral-300">{t('accounting.fixedAssetsSummaryCurrentValue')}</span>
              <span className="text-sm font-medium tabular-nums">
                {formatMoney(dashboard?.fixedAssetsCurrentValue ?? 0)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-2">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
          <Layers size={18} />
          {t('accounting.recentEntriesTitle')}
        </h2>
      </div>

      <DataTable<JournalEntry>
        data={entries}
        columns={columns}
        loading={dashboardLoading}
        enableExport
        pageSize={10}
        onRowClick={(entry) => navigate(`/accounting/journal/${entry.id}`)}
        emptyTitle={t('accounting.dashboardEmptyTitle')}
        emptyDescription={t('accounting.dashboardEmptyDescription')}
      />
    </div>
  );
};

export default AccountingDashboardPage;
