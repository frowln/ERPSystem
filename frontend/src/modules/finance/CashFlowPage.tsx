import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { PageHeader } from '@/design-system/components/PageHeader';
import { MetricCard } from '@/design-system/components/MetricCard';
import { DataTable } from '@/design-system/components/DataTable';
import { financeApi, type CashFlowEntry } from '@/api/finance';
import { formatMoney, formatMoneyCompact } from '@/lib/format';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';

const CashFlowPage: React.FC = () => {
  const { data: cashFlowData, isLoading } = useQuery({
    queryKey: ['cash-flow'],
    queryFn: () => financeApi.getCashFlow(),
  });

  const cashFlow = cashFlowData ?? [];

  const totals = useMemo(() => {
    const totalIncoming = cashFlow.reduce((s, e) => s + e.incoming, 0);
    const totalOutgoing = cashFlow.reduce((s, e) => s + e.outgoing, 0);
    const totalNet = totalIncoming - totalOutgoing;
    return { totalIncoming, totalOutgoing, totalNet };
  }, [cashFlow]);

  const chartData = useMemo(() =>
    cashFlow.map((e) => ({
      name: e.month,
      [t('finance.cashFlowPage.chartIncoming')]: e.incoming / 1_000_000,
      [t('finance.cashFlowPage.chartOutgoing')]: e.outgoing / 1_000_000,
      [t('finance.cashFlowPage.chartBalance')]: e.net / 1_000_000,
    })),
    [cashFlow],
  );

  const columns = useMemo<ColumnDef<CashFlowEntry, unknown>[]>(
    () => [
      {
        accessorKey: 'month',
        header: t('finance.cashFlowPage.colPeriod'),
        size: 140,
        cell: ({ getValue }) => (
          <span className="font-medium text-neutral-900 dark:text-neutral-100">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'INCOMING',
        header: t('finance.cashFlowPage.colIncoming'),
        size: 180,
        cell: ({ getValue }) => (
          <span className="font-medium tabular-nums text-right block text-success-600">
            {formatMoney(getValue<number>())}
          </span>
        ),
      },
      {
        accessorKey: 'OUTGOING',
        header: t('finance.cashFlowPage.colOutgoing'),
        size: 180,
        cell: ({ getValue }) => (
          <span className="font-medium tabular-nums text-right block text-danger-600">
            {formatMoney(getValue<number>())}
          </span>
        ),
      },
      {
        accessorKey: 'net',
        header: t('finance.cashFlowPage.colBalance'),
        size: 180,
        cell: ({ getValue }) => {
          const val = getValue<number>();
          return (
            <span className={cn(
              'font-semibold tabular-nums text-right block',
              val >= 0 ? 'text-success-700' : 'text-danger-700',
            )}>
              {val >= 0 ? '+' : ''}{formatMoney(val)}
            </span>
          );
        },
      },
    ],
    [],
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('finance.cashFlowPage.title')}
        subtitle={t('finance.cashFlowPage.subtitle')}
        breadcrumbs={[
          { label: t('common.home'), href: '/' },
          { label: t('finance.cashFlowPage.breadcrumbFinance') },
          { label: t('finance.cashFlowPage.breadcrumbCashFlow') },
        ]}
      />

      {/* Metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <MetricCard
          icon={<TrendingUp size={18} />}
          label={t('finance.cashFlowPage.metricTotalIncoming')}
          value={formatMoneyCompact(totals.totalIncoming)}
        />
        <MetricCard
          icon={<TrendingDown size={18} />}
          label={t('finance.cashFlowPage.metricTotalOutgoing')}
          value={formatMoneyCompact(totals.totalOutgoing)}
        />
        <MetricCard
          icon={<Wallet size={18} />}
          label={t('finance.cashFlowPage.metricNetFlow')}
          value={formatMoneyCompact(totals.totalNet)}
          trend={{ direction: totals.totalNet >= 0 ? 'up' : 'down', value: formatMoneyCompact(Math.abs(totals.totalNet)) }}
        />
      </div>

      {/* Chart */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-6">
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">{t('finance.cashFlowPage.chartTitle')}</h3>
        <div className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                formatter={(value: number) => t('finance.cashFlowPage.tooltipValue', { value: value.toFixed(1) })}
                contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb' }}
              />
              <Legend />
              <Bar dataKey={t('finance.cashFlowPage.chartIncoming')} fill="#22c55e" radius={[4, 4, 0, 0]} />
              <Bar dataKey={t('finance.cashFlowPage.chartOutgoing')} fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Table */}
      <DataTable<CashFlowEntry>
        data={cashFlow}
        columns={columns}
        loading={isLoading}
        enableExport
        pageSize={20}
        emptyTitle={t('finance.cashFlowPage.emptyTitle')}
        emptyDescription={t('finance.cashFlowPage.emptyDescription')}
      />
    </div>
  );
};

export default CashFlowPage;
