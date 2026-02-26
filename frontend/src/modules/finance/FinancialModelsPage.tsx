import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { LayoutGrid, Search } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { DataTable } from '@/design-system/components/DataTable';
import { EmptyState } from '@/design-system/components/EmptyState';
import {
  StatusBadge,
  budgetStatusColorMap,
  budgetStatusLabels,
} from '@/design-system/components/StatusBadge';
import { Input } from '@/design-system/components/FormField';
import { financeApi } from '@/api/finance';
import { formatMoney, formatPercent } from '@/lib/format';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';
import type { Budget } from '@/types';

const FinancialModelsPage: React.FC = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const { data: budgetsData, isLoading, isError, refetch } = useQuery({
    queryKey: ['budgets'],
    queryFn: () => financeApi.getBudgets(),
  });

  const budgets = budgetsData?.content ?? [];

  const filtered = useMemo(() => {
    if (!search) return budgets;
    const lower = search.toLowerCase();
    return budgets.filter(
      (b) =>
        b.name.toLowerCase().includes(lower) ||
        (b.projectName ?? '').toLowerCase().includes(lower),
    );
  }, [budgets, search]);

  const columns = useMemo<ColumnDef<Budget, unknown>[]>(
    () => [
      {
        accessorKey: 'name',
        header: t('finance.budgetList.colName'),
        size: 280,
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-neutral-900 dark:text-neutral-100">{row.original.name}</p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{row.original.projectName}</p>
          </div>
        ),
      },
      {
        accessorKey: 'status',
        header: t('finance.budgetList.colStatus'),
        size: 130,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={budgetStatusColorMap}
            label={budgetStatusLabels[getValue<string>()] ?? getValue<string>()}
          />
        ),
      },
      {
        accessorKey: 'plannedRevenue',
        header: t('finance.budgetList.colPlannedRevenue'),
        size: 160,
        cell: ({ getValue }) => (
          <span className="font-medium tabular-nums text-right block">
            {formatMoney(getValue<number>())}
          </span>
        ),
      },
      {
        accessorKey: 'plannedCost',
        header: t('finance.budgetList.colPlannedCost'),
        size: 160,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-right block text-neutral-600">
            {formatMoney(getValue<number>())}
          </span>
        ),
      },
      {
        id: 'variance',
        header: t('finance.budgetList.colVariance'),
        size: 110,
        cell: ({ row }) => {
          const v = row.original.costVariancePercent;
          return (
            <span className={cn(
              'font-medium tabular-nums',
              v > 0 ? 'text-danger-600' : v < 0 ? 'text-success-600' : 'text-neutral-500 dark:text-neutral-400',
            )}>
              {v > 0 ? '+' : ''}{formatPercent(v)}
            </span>
          );
        },
      },
    ],
    [],
  );

  // Click goes directly to FM page (skip budget detail)
  const handleRowClick = useCallback(
    (budget: Budget) => navigate(`/budgets/${budget.id}/fm`),
    [navigate],
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('finance.fmList.title')}
        subtitle={t('finance.fmList.subtitle', { count: String(budgets.length) })}
        breadcrumbs={[
          { label: t('common.home'), href: '/' },
          { label: t('finance.fmList.breadcrumb') },
        ]}
      />

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input
            placeholder={t('finance.budgetList.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('finance.fmList.hint')}</p>
      </div>

      {isError ? (
        <EmptyState
          variant="ERROR"
          title={t('errors.noConnection')}
          description={t('errors.serverErrorRetry')}
          actionLabel={t('common.retry')}
          onAction={() => void refetch()}
        />
      ) : (
        <DataTable<Budget>
          data={filtered}
          columns={columns}
          loading={isLoading}
          onRowClick={handleRowClick}
          enableColumnVisibility
          enableDensityToggle
          enableExport
          pageSize={20}
          emptyTitle={t('finance.fmList.emptyTitle')}
          emptyDescription={t('finance.fmList.emptyDescription')}
        />
      )}
    </div>
  );
};

export default FinancialModelsPage;
