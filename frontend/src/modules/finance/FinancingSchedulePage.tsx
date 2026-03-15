import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { Calendar, TrendingUp } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { DataTable } from '@/design-system/components/DataTable';
import { Select } from '@/design-system/components/FormField';
import { EmptyState } from '@/design-system/components/EmptyState';
import { TableSkeleton } from '@/design-system/components/Skeleton';
import { contractsApi } from '@/api/contracts';
import { apiClient } from '@/api/client';
import { formatMoney } from '@/lib/format';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';

interface FinancingScheduleEntry {
  month: string;
  planned: number;
  actual: number;
  delta: number;
  cumPlanned: number;
  cumActual: number;
}

const fetchFinancingSchedule = async (contractId: string): Promise<FinancingScheduleEntry[]> => {
  const response = await apiClient.get<FinancingScheduleEntry[]>(
    `/contracts/${contractId}/financing-schedule`,
  );
  return response.data;
};

const FinancingSchedulePage: React.FC = () => {
  const [selectedContractId, setSelectedContractId] = useState('');

  const { data: contractsData } = useQuery({
    queryKey: ['contracts-list-for-schedule'],
    queryFn: () => contractsApi.getContracts({ size: 200 }),
  });

  const contracts = contractsData?.content ?? [];

  const contractOptions = useMemo(
    () => [
      { value: '', label: t('finance.financingSchedule.selectContract') },
      ...contracts.map((c) => ({ value: c.id, label: `${c.number ?? ''} — ${c.name ?? c.id}` })),
    ],
    [contracts],
  );

  const {
    data: schedule = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['financing-schedule', selectedContractId],
    queryFn: () => fetchFinancingSchedule(selectedContractId),
    enabled: !!selectedContractId,
  });

  const totals = useMemo(() => {
    const totalPlanned = schedule.reduce((s, e) => s + e.planned, 0);
    const totalActual = schedule.reduce((s, e) => s + e.actual, 0);
    const totalDelta = totalActual - totalPlanned;
    return { totalPlanned, totalActual, totalDelta };
  }, [schedule]);

  const maxAmount = useMemo(
    () => Math.max(...schedule.map((e) => Math.max(e.planned, e.actual)), 1),
    [schedule],
  );

  const columns = useMemo<ColumnDef<FinancingScheduleEntry, unknown>[]>(
    () => [
      {
        accessorKey: 'month',
        header: t('finance.financingSchedule.fields.month'),
        size: 120,
        cell: ({ getValue }) => (
          <span className="font-medium text-neutral-900 dark:text-neutral-100">
            {getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: 'planned',
        header: t('finance.financingSchedule.fields.planned'),
        size: 160,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-right block text-neutral-700 dark:text-neutral-300">
            {formatMoney(getValue<number>())}
          </span>
        ),
      },
      {
        accessorKey: 'actual',
        header: t('finance.financingSchedule.fields.actual'),
        size: 160,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-right block font-medium text-neutral-900 dark:text-neutral-100">
            {formatMoney(getValue<number>())}
          </span>
        ),
      },
      {
        accessorKey: 'delta',
        header: t('finance.financingSchedule.fields.delta'),
        size: 160,
        cell: ({ getValue }) => {
          const val = getValue<number>();
          return (
            <span
              className={cn(
                'tabular-nums text-right block font-semibold',
                val > 0
                  ? 'text-success-600'
                  : val < 0
                    ? 'text-danger-600'
                    : 'text-neutral-500',
              )}
            >
              {val > 0 ? '+' : ''}
              {formatMoney(val)}
            </span>
          );
        },
      },
      {
        accessorKey: 'cumPlanned',
        header: t('finance.financingSchedule.fields.cumPlanned'),
        size: 170,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-right block text-neutral-600 dark:text-neutral-400">
            {formatMoney(getValue<number>())}
          </span>
        ),
      },
      {
        accessorKey: 'cumActual',
        header: t('finance.financingSchedule.fields.cumActual'),
        size: 170,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-right block text-neutral-600 dark:text-neutral-400">
            {formatMoney(getValue<number>())}
          </span>
        ),
      },
    ],
    [],
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('finance.financingSchedule.title')}
        subtitle={t('finance.financingSchedule.description')}
        breadcrumbs={[
          { label: t('common.home'), href: '/' },
          { label: t('finance.financingSchedule.breadcrumbFinance'), href: '/finance' },
          { label: t('finance.financingSchedule.breadcrumbSchedule') },
        ]}
      />

      {/* Contract selector */}
      <div className="mb-6">
        <Select
          options={contractOptions}
          value={selectedContractId}
          onChange={(e) => setSelectedContractId(e.target.value)}
          className="w-full max-w-md"
        />
      </div>

      {!selectedContractId && (
        <EmptyState
          icon={<Calendar size={40} className="text-neutral-400" />}
          title={t('finance.financingSchedule.noContract')}
          description={t('finance.financingSchedule.description')}
        />
      )}

      {selectedContractId && isLoading && <TableSkeleton rows={6} />}

      {selectedContractId && isError && (
        <EmptyState
          variant="ERROR"
          title={t('finance.financingSchedule.loadError')}
          description={t('common.tryAgainLater')}
        />
      )}

      {selectedContractId && !isLoading && !isError && schedule.length > 0 && (
        <>
          {/* Visual bar chart placeholder using divs */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-6">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
              {t('finance.financingSchedule.chartTitle')}
            </h3>
            <div className="flex items-end gap-2 h-[200px]">
              {schedule.map((entry) => (
                <div key={entry.month} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                  <div className="flex items-end gap-0.5 w-full justify-center h-full">
                    {/* Planned bar */}
                    <div
                      className="w-3 bg-primary-300 dark:bg-primary-700 rounded-t transition-all"
                      style={{ height: `${Math.max(2, (entry.planned / maxAmount) * 100)}%` }}
                      title={`${t('finance.financingSchedule.fields.planned')}: ${formatMoney(entry.planned)}`}
                    />
                    {/* Actual bar */}
                    <div
                      className="w-3 bg-primary-600 dark:bg-primary-400 rounded-t transition-all"
                      style={{ height: `${Math.max(2, (entry.actual / maxAmount) * 100)}%` }}
                      title={`${t('finance.financingSchedule.fields.actual')}: ${formatMoney(entry.actual)}`}
                    />
                  </div>
                  <span className="text-[10px] text-neutral-500 dark:text-neutral-400 truncate max-w-full">
                    {entry.month}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-4 mt-3 text-xs text-neutral-500 dark:text-neutral-400">
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-primary-300 dark:bg-primary-700 inline-block" />
                {t('finance.financingSchedule.fields.planned')}
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-primary-600 dark:bg-primary-400 inline-block" />
                {t('finance.financingSchedule.fields.actual')}
              </span>
            </div>
          </div>

          {/* Table */}
          <DataTable<FinancingScheduleEntry>
            data={schedule}
            columns={columns}
            loading={isLoading}
            enableExport
            pageSize={20}
            emptyTitle={t('finance.financingSchedule.emptyTitle')}
            emptyDescription={t('finance.financingSchedule.emptyDescription')}
          />

          {/* Total row */}
          <div className="mt-2 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <TrendingUp size={16} className="text-primary-600" />
                <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                  {t('finance.financingSchedule.total')}
                </span>
              </div>
              <div className="flex items-center gap-6 text-sm">
                <div>
                  <span className="text-neutral-500 dark:text-neutral-400 mr-2">
                    {t('finance.financingSchedule.fields.planned')}:
                  </span>
                  <span className="tabular-nums font-medium text-neutral-900 dark:text-neutral-100">
                    {formatMoney(totals.totalPlanned)}
                  </span>
                </div>
                <div>
                  <span className="text-neutral-500 dark:text-neutral-400 mr-2">
                    {t('finance.financingSchedule.fields.actual')}:
                  </span>
                  <span className="tabular-nums font-medium text-neutral-900 dark:text-neutral-100">
                    {formatMoney(totals.totalActual)}
                  </span>
                </div>
                <div>
                  <span className="text-neutral-500 dark:text-neutral-400 mr-2">
                    {t('finance.financingSchedule.fields.delta')}:
                  </span>
                  <span
                    className={cn(
                      'tabular-nums font-semibold',
                      totals.totalDelta > 0
                        ? 'text-success-600'
                        : totals.totalDelta < 0
                          ? 'text-danger-600'
                          : 'text-neutral-500',
                    )}
                  >
                    {totals.totalDelta > 0 ? '+' : ''}
                    {formatMoney(totals.totalDelta)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {selectedContractId && !isLoading && !isError && schedule.length === 0 && (
        <EmptyState
          title={t('finance.financingSchedule.emptyTitle')}
          description={t('finance.financingSchedule.emptyDescription')}
        />
      )}
    </div>
  );
};

export default FinancingSchedulePage;
