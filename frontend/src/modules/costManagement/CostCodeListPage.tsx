import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { Search, BarChart3, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { DataTable } from '@/design-system/components/DataTable';
import { MetricCard } from '@/design-system/components/MetricCard';
import { Input } from '@/design-system/components/FormField';
import { costManagementApi } from '@/api/costManagement';
import { formatMoney, formatMoneyCompact, formatPercent } from '@/lib/format';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';
import type { CostCode } from './types';

const CostCodeListPage: React.FC = () => {
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['cost-codes'],
    queryFn: () => costManagementApi.getCostCodes(),
  });

  const costCodes = data ?? [];

  const filtered = useMemo(() => {
    if (!search) return costCodes;
    const lower = search.toLowerCase();
    return costCodes.filter(
      (c) => c.code.toLowerCase().includes(lower) || c.name.toLowerCase().includes(lower),
    );
  }, [costCodes, search]);

  const totals = useMemo(() => {
    const budget = costCodes.reduce((s, c) => s + c.budgetAmount, 0);
    const committed = costCodes.reduce((s, c) => s + c.committedAmount, 0);
    const actual = costCodes.reduce((s, c) => s + c.actualAmount, 0);
    const overBudget = costCodes.filter((c) => c.varianceAmount < 0).length;
    return { budget, committed, actual, overBudget };
  }, [costCodes]);

  const columns = useMemo<ColumnDef<CostCode, unknown>[]>(
    () => [
      {
        accessorKey: 'code',
        header: t('costManagement.costCodeList.columnCode'),
        size: 100,
        cell: ({ getValue }) => (
          <span className="font-mono text-xs text-neutral-600 font-medium">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'name',
        header: t('costManagement.costCodeList.columnName'),
        size: 250,
        cell: ({ getValue }) => (
          <span className="font-medium text-neutral-900 dark:text-neutral-100">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'budgetAmount',
        header: t('costManagement.costCodeList.columnBudget'),
        size: 150,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-neutral-700 dark:text-neutral-300">{formatMoney(getValue<number>())}</span>
        ),
      },
      {
        accessorKey: 'committedAmount',
        header: t('costManagement.costCodeList.columnCommitted'),
        size: 150,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-neutral-700 dark:text-neutral-300">{formatMoney(getValue<number>())}</span>
        ),
      },
      {
        accessorKey: 'actualAmount',
        header: t('costManagement.costCodeList.columnActual'),
        size: 150,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-neutral-700 dark:text-neutral-300">{formatMoney(getValue<number>())}</span>
        ),
      },
      {
        accessorKey: 'forecastAmount',
        header: t('costManagement.costCodeList.columnForecast'),
        size: 150,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-neutral-700 dark:text-neutral-300 font-medium">{formatMoney(getValue<number>())}</span>
        ),
      },
      {
        accessorKey: 'varianceAmount',
        header: t('costManagement.costCodeList.columnVariance'),
        size: 170,
        cell: ({ row }) => {
          const val = row.original.varianceAmount;
          const pct = row.original.variancePercent;
          return (
            <div className="flex items-center gap-2">
              {val !== 0 && (
                val > 0 ? <TrendingUp size={14} className="text-success-500" /> : <TrendingDown size={14} className="text-danger-500" />
              )}
              <span className={cn(
                'tabular-nums text-sm font-medium',
                val > 0 ? 'text-success-600' : val < 0 ? 'text-danger-600' : 'text-neutral-500 dark:text-neutral-400',
              )}>
                {val !== 0 ? formatMoney(val) : '---'}
              </span>
              {pct !== 0 && (
                <span className={cn('text-xs tabular-nums', pct > 0 ? 'text-success-500' : 'text-danger-500')}>
                  ({formatPercent(pct)})
                </span>
              )}
            </div>
          );
        },
      },
      {
        id: 'progress',
        header: t('costManagement.costCodeList.columnUtilization'),
        size: 120,
        cell: ({ row }) => {
          const pct = row.original.budgetAmount > 0
            ? Math.round((row.original.actualAmount / row.original.budgetAmount) * 100)
            : 0;
          return (
            <div className="flex items-center gap-2">
              <div className="w-14 h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full',
                    pct > 100 ? 'bg-danger-500' : pct > 80 ? 'bg-warning-500' : 'bg-primary-500',
                  )}
                  style={{ width: `${Math.min(pct, 100)}%` }}
                />
              </div>
              <span className="text-xs font-medium text-neutral-600 tabular-nums">{pct}%</span>
            </div>
          );
        },
      },
    ],
    [],
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('costManagement.costCodeList.title')}
        subtitle={t('costManagement.costCodeList.subtitle', { count: String(costCodes.length) })}
        breadcrumbs={[
          { label: t('costManagement.costCodeList.breadcrumbHome'), href: '/' },
          { label: t('costManagement.costCodeList.breadcrumbCostManagement') },
          { label: t('costManagement.costCodeList.title') },
        ]}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard icon={<BarChart3 size={18} />} label={t('costManagement.costCodeList.totalBudget')} value={formatMoneyCompact(totals.budget)} />
        <MetricCard label={t('costManagement.costCodeList.committed')} value={formatMoneyCompact(totals.committed)} />
        <MetricCard label={t('costManagement.costCodeList.actual')} value={formatMoneyCompact(totals.actual)} />
        <MetricCard
          icon={<AlertTriangle size={18} />}
          label={t('costManagement.costCodeList.overBudget')}
          value={totals.overBudget}
          subtitle={t('costManagement.costCodeList.items')}
          trend={{ direction: totals.overBudget > 0 ? 'down' : 'neutral', value: totals.overBudget > 0 ? t('costManagement.costCodeList.needAttention') : t('costManagement.costCodeList.none') }}
        />
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input
            placeholder={t('costManagement.costCodeList.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <DataTable<CostCode>
        data={filtered}
        columns={columns}
        loading={isLoading}
        enableColumnVisibility
        enableDensityToggle
        enableExport
        pageSize={20}
        emptyTitle={t('costManagement.costCodeList.emptyTitle')}
        emptyDescription={t('costManagement.costCodeList.emptyDescription')}
      />
    </div>
  );
};

export default CostCodeListPage;
