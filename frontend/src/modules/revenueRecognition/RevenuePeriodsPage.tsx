import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { Search, CalendarDays, TrendingUp, DollarSign, BarChart3 } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { DataTable } from '@/design-system/components/DataTable';
import { MetricCard } from '@/design-system/components/MetricCard';
import { Input, Select } from '@/design-system/components/FormField';
import { revenueRecognitionApi } from '@/api/revenueRecognition';
import { formatMoney, formatMoneyCompact, formatPercent } from '@/lib/format';
import { t } from '@/i18n';
import type { RevenueContract, RevenuePeriod } from './types';

interface PeriodSummary {
  id: string;
  contractNumber: string;
  contractName: string;
  period: string;
  periodLabel: string;
  periodCost: number;
  periodRevenue: number;
  periodProfit: number;
  cumulativePercent: number;
  adjustments: number;
}


const getPeriodOptions = () => [
  { value: '', label: t('revenueRecognition.allPeriods') },
  { value: '2026-Q1', label: '1 кв. 2026' },
  { value: '2025-Q4', label: '4 кв. 2025' },
  { value: '2025-Q3', label: '3 кв. 2025' },
  { value: '2025-Q2', label: '2 кв. 2025' },
  { value: '2025-Q1', label: '1 кв. 2025' },
];

const RevenuePeriodsPage: React.FC = () => {
  const periodOptions = getPeriodOptions();
  const [search, setSearch] = useState('');
  const [periodFilter, setPeriodFilter] = useState('');

  const { data: summariesData } = useQuery<{ content: PeriodSummary[] }>({
    queryKey: ['revenue-periods-summary'],
    queryFn: () => revenueRecognitionApi.getPeriods('all') as any,
  });

  const summaries: PeriodSummary[] = (summariesData as any)?.content ?? (summariesData as any) ?? [];

  const filtered = useMemo(() => {
    let result = summaries;
    if (periodFilter) result = result.filter((s: PeriodSummary) => s.period === periodFilter);
    if (search) {
      const lower = search.toLowerCase();
      result = result.filter(
        (s: PeriodSummary) =>
          s.contractNumber.toLowerCase().includes(lower) ||
          s.contractName.toLowerCase().includes(lower),
      );
    }
    return result;
  }, [summaries, periodFilter, search]);

  const totals = useMemo(() => {
    const currentPeriod = filtered.filter((s: PeriodSummary) => s.period === '2026-Q1');
    const totalRevenue = currentPeriod.reduce((sum: number, s: PeriodSummary) => sum + s.periodRevenue, 0);
    const totalCost = currentPeriod.reduce((sum: number, s: PeriodSummary) => sum + s.periodCost, 0);
    const totalProfit = currentPeriod.reduce((sum: number, s: PeriodSummary) => sum + s.periodProfit, 0);
    const totalAdj = currentPeriod.reduce((sum: number, s: PeriodSummary) => sum + s.adjustments, 0);
    return { totalRevenue, totalCost, totalProfit, totalAdj };
  }, [filtered]);

  const columns = useMemo<ColumnDef<PeriodSummary, unknown>[]>(
    () => [
      {
        accessorKey: 'contractNumber',
        header: t('revenueRecognition.colContractNumber'),
        size: 110,
        cell: ({ getValue }) => (
          <span className="font-mono text-neutral-500 dark:text-neutral-400 text-xs">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'contractName',
        header: t('revenueRecognition.colContract'),
        size: 220,
        cell: ({ getValue }) => (
          <span className="font-medium text-neutral-900 dark:text-neutral-100 truncate max-w-[200px] block">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'periodLabel',
        header: t('revenueRecognition.colPeriod'),
        size: 110,
        cell: ({ getValue }) => (
          <span className="text-sm text-neutral-700 dark:text-neutral-300">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'periodCost',
        header: t('revenueRecognition.costs'),
        size: 140,
        cell: ({ getValue }) => <span className="tabular-nums">{formatMoney(getValue<number>())}</span>,
      },
      {
        accessorKey: 'periodRevenue',
        header: t('revenueRecognition.revenue'),
        size: 140,
        cell: ({ getValue }) => <span className="tabular-nums text-green-600 font-medium">{formatMoney(getValue<number>())}</span>,
      },
      {
        accessorKey: 'periodProfit',
        header: t('revenueRecognition.profit'),
        size: 140,
        cell: ({ getValue }) => <span className="tabular-nums">{formatMoney(getValue<number>())}</span>,
      },
      {
        accessorKey: 'cumulativePercent',
        header: t('revenueRecognition.percentComplete'),
        size: 100,
        cell: ({ getValue }) => <span className="tabular-nums">{formatPercent(getValue<number>())}</span>,
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
        title={t('revenueRecognition.periodsTitle')}
        subtitle={t('revenueRecognition.periodsSubtitle')}
        breadcrumbs={[
          { label: t('nav.dashboard'), href: '/' },
          { label: t('revenueRecognition.title'), href: '/revenue' },
          { label: t('revenueRecognition.periods') },
        ]}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard icon={<CalendarDays size={18} />} label={t('revenueRecognition.currentQRecords')} value={filtered.filter((s: PeriodSummary) => s.period === '2026-Q1').length} />
        <MetricCard icon={<DollarSign size={18} />} label={t('revenueRecognition.revenueCurrentQ')} value={formatMoneyCompact(totals.totalRevenue)} />
        <MetricCard icon={<TrendingUp size={18} />} label={t('revenueRecognition.profitCurrentQ')} value={formatMoneyCompact(totals.totalProfit)} />
        <MetricCard icon={<BarChart3 size={18} />} label={t('revenueRecognition.adjustments')} value={formatMoney(totals.totalAdj)} />
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input placeholder={t('revenueRecognition.searchByContract')} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select
          options={periodOptions}
          value={periodFilter}
          onChange={(e) => setPeriodFilter(e.target.value)}
          className="w-44"
        />
      </div>

      <DataTable<PeriodSummary>
        data={filtered}
        columns={columns}
        enableRowSelection
        enableColumnVisibility
        enableDensityToggle
        enableExport
        pageSize={20}
        emptyTitle={t('revenueRecognition.periodsEmptyTitle')}
        emptyDescription={t('revenueRecognition.periodsEmptyDescription')}
      />
    </div>
  );
};

export default RevenuePeriodsPage;
