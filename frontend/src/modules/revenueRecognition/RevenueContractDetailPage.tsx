import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { ArrowLeft, Edit, DollarSign, TrendingUp, BarChart3, Calendar } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { DataTable } from '@/design-system/components/DataTable';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { MetricCard } from '@/design-system/components/MetricCard';
import { revenueRecognitionApi } from '@/api/revenueRecognition';
import { formatDate, formatMoney, formatMoneyCompact, formatPercent } from '@/lib/format';
import { t } from '@/i18n';
import type { RevenueContract, RevenuePeriod } from './types';

const statusColorMap: Record<string, 'gray' | 'blue' | 'green' | 'yellow' | 'red'> = {
  ACTIVE: 'green', COMPLETED: 'blue', SUSPENDED: 'yellow', TERMINATED: 'red',
};
const getStatusLabels = (): Record<string, string> => ({
  ACTIVE: t('revenueRecognition.statusActive'), COMPLETED: t('revenueRecognition.statusCompleted'), SUSPENDED: t('revenueRecognition.statusSuspended'), TERMINATED: t('revenueRecognition.statusTerminated'),
});
const getMethodLabels = (): Record<string, string> => ({
  PERCENTAGE_OF_COMPLETION: t('revenueRecognition.methodPercentage'), COMPLETED_CONTRACT: t('revenueRecognition.methodCompleted'), INPUT_METHOD: t('revenueRecognition.methodInput'), OUTPUT_METHOD: t('revenueRecognition.methodOutput'),
});
const getStandardLabels = (): Record<string, string> => ({
  IFRS_15: t('revenueRecognition.standardIFRS15'), ASC_606: 'ASC 606', RAS: t('revenueRecognition.standardRAS'),
});


const RevenueContractDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: contract, isLoading } = useQuery<RevenueContract>({
    queryKey: ['revenue-contract', id],
    queryFn: () => revenueRecognitionApi.getContract(id!),
    enabled: !!id,
  });

  const { data: periods } = useQuery<RevenuePeriod[]>({
    queryKey: ['revenue-periods', id],
    queryFn: () => revenueRecognitionApi.getPeriods(id!),
    enabled: !!id,
  });

  const statusLabels = getStatusLabels();
  const methodLabels = getMethodLabels();
  const standardLabels = getStandardLabels();

  if (isLoading || !contract) {
    return (
      <div className="animate-fade-in">
        <div className="flex items-center justify-center h-64 text-neutral-400">{t('common.loading')}</div>
      </div>
    );
  }

  const c = contract;
  const periodList = periods ?? [];

  const remainingRevenue = c.totalRevenue - c.recognizedRevenue;
  const remainingCost = c.totalCost - c.incurredCost;

  const columns = useMemo<ColumnDef<RevenuePeriod, unknown>[]>(
    () => [
      {
        accessorKey: 'periodLabel',
        header: t('revenueRecognition.colPeriod'),
        size: 120,
        cell: ({ getValue }) => (
          <span className="font-medium text-neutral-900 dark:text-neutral-100">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'periodCostIncurred',
        header: t('revenueRecognition.periodCost'),
        size: 140,
        cell: ({ getValue }) => <span className="tabular-nums">{formatMoney(getValue<number>())}</span>,
      },
      {
        accessorKey: 'cumulativeCostIncurred',
        header: t('revenueRecognition.cumulativeCost'),
        size: 140,
        cell: ({ getValue }) => <span className="tabular-nums text-neutral-500 dark:text-neutral-400">{formatMoney(getValue<number>())}</span>,
      },
      {
        accessorKey: 'percentComplete',
        header: t('revenueRecognition.percentComplete'),
        size: 110,
        cell: ({ getValue }) => {
          const pct = getValue<number>();
          return (
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                <div className="h-full bg-primary-500 rounded-full" style={{ width: `${pct}%` }} />
              </div>
              <span className="text-xs tabular-nums">{formatPercent(pct)}</span>
            </div>
          );
        },
      },
      {
        accessorKey: 'periodRevenueRecognized',
        header: t('revenueRecognition.periodRevenue'),
        size: 140,
        cell: ({ getValue }) => <span className="tabular-nums text-green-600 font-medium">{formatMoney(getValue<number>())}</span>,
      },
      {
        accessorKey: 'cumulativeRevenueRecognized',
        header: t('revenueRecognition.cumulativeRevenue'),
        size: 140,
        cell: ({ getValue }) => <span className="tabular-nums text-neutral-500 dark:text-neutral-400">{formatMoney(getValue<number>())}</span>,
      },
      {
        accessorKey: 'periodGrossProfit',
        header: t('revenueRecognition.periodProfit'),
        size: 140,
        cell: ({ getValue }) => <span className="tabular-nums">{formatMoney(getValue<number>())}</span>,
      },
      {
        accessorKey: 'adjustments',
        header: t('revenueRecognition.adjustments'),
        size: 120,
        cell: ({ getValue }) => {
          const adj = getValue<number>();
          if (adj === 0) return <span className="text-neutral-400">---</span>;
          return <span className={`tabular-nums ${adj < 0 ? 'text-danger-600' : 'text-green-600'}`}>{formatMoney(adj)}</span>;
        },
      },
    ],
    [],
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={c.contractName}
        subtitle={`${c.contractNumber} | ${c.clientName}`}
        breadcrumbs={[
          { label: t('nav.dashboard'), href: '/' },
          { label: t('revenueRecognition.title'), href: '/revenue' },
          { label: t('revenueRecognition.contracts'), href: '/revenue/contracts' },
          { label: c.contractNumber },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" iconLeft={<ArrowLeft size={16} />} onClick={() => navigate('/revenue/contracts')}>
              {t('common.back')}
            </Button>
            <Button variant="outline" iconLeft={<Edit size={16} />} onClick={() => navigate(`/revenue/contracts/${c.id}/edit`)}>
              {t('common.edit')}
            </Button>
          </div>
        }
      />

      {/* Key metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard icon={<DollarSign size={18} />} label={t('revenueRecognition.totalRevenue')} value={formatMoneyCompact(c.totalRevenue)} />
        <MetricCard icon={<TrendingUp size={18} />} label={t('revenueRecognition.recognizedRevenue')} value={formatMoneyCompact(c.recognizedRevenue)} trend={{ direction: 'up', value: formatPercent(c.percentComplete) }} />
        <MetricCard icon={<BarChart3 size={18} />} label={t('revenueRecognition.grossMargin')} value={formatPercent(c.grossMargin)} />
        <MetricCard icon={<Calendar size={18} />} label={t('revenueRecognition.endDate')} value={formatDate(c.endDate)} />
      </div>

      {/* Contract details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6">
          <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-4">{t('revenueRecognition.contractParams')}</h3>
          <dl className="grid grid-cols-2 gap-y-3 gap-x-4">
            <div>
              <dt className="text-xs text-neutral-500 dark:text-neutral-400">{t('common.status')}</dt>
              <dd className="mt-0.5"><StatusBadge status={c.status} colorMap={statusColorMap} label={statusLabels[c.status] ?? c.status} /></dd>
            </div>
            <div>
              <dt className="text-xs text-neutral-500 dark:text-neutral-400">{t('revenueRecognition.recognitionMethod')}</dt>
              <dd className="text-sm font-medium text-neutral-900 dark:text-neutral-100 mt-0.5">{methodLabels[c.method]}</dd>
            </div>
            <div>
              <dt className="text-xs text-neutral-500 dark:text-neutral-400">{t('revenueRecognition.standard')}</dt>
              <dd className="text-sm font-medium text-neutral-900 dark:text-neutral-100 mt-0.5">{standardLabels[c.standard]}</dd>
            </div>
            <div>
              <dt className="text-xs text-neutral-500 dark:text-neutral-400">{t('revenueRecognition.client')}</dt>
              <dd className="text-sm font-medium text-neutral-900 dark:text-neutral-100 mt-0.5">{c.clientName}</dd>
            </div>
            <div>
              <dt className="text-xs text-neutral-500 dark:text-neutral-400">{t('revenueRecognition.startDate')}</dt>
              <dd className="text-sm tabular-nums text-neutral-900 dark:text-neutral-100 mt-0.5">{formatDate(c.startDate)}</dd>
            </div>
            <div>
              <dt className="text-xs text-neutral-500 dark:text-neutral-400">{t('revenueRecognition.endDate')}</dt>
              <dd className="text-sm tabular-nums text-neutral-900 dark:text-neutral-100 mt-0.5">{formatDate(c.endDate)}</dd>
            </div>
          </dl>
        </div>

        <div className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6">
          <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-4">{t('revenueRecognition.financialMetrics')}</h3>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-neutral-500 dark:text-neutral-400">{t('revenueRecognition.revenueRecognizedOfTotal')}</span>
                <span className="font-medium tabular-nums">{formatMoney(c.recognizedRevenue)} / {formatMoney(c.totalRevenue)}</span>
              </div>
              <div className="h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 rounded-full" style={{ width: `${(c.recognizedRevenue / c.totalRevenue) * 100}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-neutral-500 dark:text-neutral-400">{t('revenueRecognition.costIncurredOfPlan')}</span>
                <span className="font-medium tabular-nums">{formatMoney(c.incurredCost)} / {formatMoney(c.totalCost)}</span>
              </div>
              <div className="h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(c.incurredCost / c.totalCost) * 100}%` }} />
              </div>
            </div>
            <div className="pt-2 border-t border-neutral-100">
              <div className="flex justify-between text-sm">
                <span className="text-neutral-500 dark:text-neutral-400">{t('revenueRecognition.remainingRevenue')}</span>
                <span className="font-medium tabular-nums">{formatMoney(remainingRevenue)}</span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-neutral-500 dark:text-neutral-400">{t('revenueRecognition.remainingCost')}</span>
                <span className="font-medium tabular-nums">{formatMoney(remainingCost)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Period-by-period breakdown */}
      <div className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6">
        <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-4">{t('revenueRecognition.recognitionByPeriods')}</h3>
        <DataTable<RevenuePeriod>
          data={periodList}
          columns={columns}
          pageSize={20}
          enableExport
          emptyTitle={t('revenueRecognition.periodsEmptyTitle')}
          emptyDescription={t('revenueRecognition.periodsEmptyDetailDescription')}
        />
      </div>
    </div>
  );
};

export default RevenueContractDetailPage;
