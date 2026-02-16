import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { Plus, Search } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { DataTable } from '@/design-system/components/DataTable';
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

type TabId = 'all' | 'DRAFT' | 'APPROVED' | 'ACTIVE' | 'FROZEN' | 'CLOSED';

const BudgetListPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [search, setSearch] = useState('');

  const { data: budgetsData, isLoading } = useQuery({
    queryKey: ['budgets'],
    queryFn: () => financeApi.getBudgets(),
  });

  const budgets = budgetsData?.content ?? [];

  const filteredBudgets = useMemo(() => {
    let filtered = budgets;

    if (activeTab !== 'all') {
      filtered = filtered.filter((b) => b.status === activeTab);
    }

    if (search) {
      const lower = search.toLowerCase();
      filtered = filtered.filter(
        (b) =>
          b.name.toLowerCase().includes(lower) ||
          (b.projectName ?? '').toLowerCase().includes(lower),
      );
    }

    return filtered;
  }, [budgets, activeTab, search]);

  const tabCounts = useMemo(() => ({
    all: budgets.length,
    draft: budgets.filter((b) => b.status === 'DRAFT').length,
    approved: budgets.filter((b) => b.status === 'APPROVED').length,
    active: budgets.filter((b) => b.status === 'ACTIVE').length,
    frozen: budgets.filter((b) => b.status === 'FROZEN').length,
    closed: budgets.filter((b) => b.status === 'CLOSED').length,
  }), [budgets]);

  const columns = useMemo<ColumnDef<Budget, unknown>[]>(
    () => [
      {
        accessorKey: 'name',
        header: t('finance.budgetList.colName'),
        size: 260,
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-neutral-900 dark:text-neutral-100">{row.original.name}</p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{row.original.projectName}</p>
          </div>
        ),
      },
      {
        accessorKey: 'projectName',
        header: t('finance.budgetList.colProject'),
        size: 160,
        cell: ({ getValue }) => (
          <span className="text-neutral-600">{getValue<string>()}</span>
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
        accessorKey: 'actualRevenue',
        header: t('finance.budgetList.colActualRevenue'),
        size: 160,
        cell: ({ row }) => {
          const planned = row.original.plannedRevenue;
          const actual = row.original.actualRevenue;
          const pct = planned > 0 ? (actual / planned) * 100 : 0;
          return (
            <div className="space-y-1">
              <span className="font-medium tabular-nums text-right block">
                {formatMoney(actual)}
              </span>
              <div className="w-full h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-success-500 rounded-full transition-all"
                  style={{ width: `${Math.min(pct, 100)}%` }}
                />
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: 'actualCost',
        header: t('finance.budgetList.colActualCost'),
        size: 160,
        cell: ({ row }) => {
          const planned = row.original.plannedCost;
          const actual = row.original.actualCost;
          const pct = planned > 0 ? (actual / planned) * 100 : 0;
          return (
            <div className="space-y-1">
              <span className="tabular-nums text-right block text-neutral-600">
                {formatMoney(actual)}
              </span>
              <div className="w-full h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all',
                    pct > 100 ? 'bg-danger-500' : 'bg-primary-500',
                  )}
                  style={{ width: `${Math.min(pct, 100)}%` }}
                />
              </div>
            </div>
          );
        },
      },
      {
        id: 'variance',
        header: t('finance.budgetList.colVariance'),
        size: 120,
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

  const handleRowClick = useCallback(
    (budget: Budget) => navigate(`/budgets/${budget.id}`),
    [navigate],
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('finance.budgetList.title')}
        subtitle={t('finance.budgetList.subtitle', { count: String(budgets.length) })}
        breadcrumbs={[
          { label: t('common.home'), href: '/' },
          { label: t('finance.budgetList.breadcrumbFinance') },
          { label: t('finance.budgetList.breadcrumbBudgets') },
        ]}
        actions={
          <Button iconLeft={<Plus size={16} />} onClick={() => navigate('/budgets/new')}>
            {t('finance.budgetList.newBudget')}
          </Button>
        }
        tabs={[
          { id: 'all', label: t('finance.budgetList.tabAll'), count: tabCounts.all },
          { id: 'DRAFT', label: t('finance.budgetList.tabDraft'), count: tabCounts.draft },
          { id: 'APPROVED', label: t('finance.budgetList.tabApproved'), count: tabCounts.approved },
          { id: 'ACTIVE', label: t('finance.budgetList.tabActive'), count: tabCounts.active },
          { id: 'FROZEN', label: t('finance.budgetList.tabFrozen'), count: tabCounts.frozen },
          { id: 'CLOSED', label: t('finance.budgetList.tabClosed'), count: tabCounts.closed },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as TabId)}
      />

      {/* Filters */}
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
      </div>

      {/* Table */}
      <DataTable<Budget>
        data={filteredBudgets}
        columns={columns}
        loading={isLoading}
        onRowClick={handleRowClick}
        enableRowSelection
        enableColumnVisibility
        enableDensityToggle
        enableExport
        pageSize={20}
        emptyTitle={t('finance.budgetList.emptyTitle')}
        emptyDescription={t('finance.budgetList.emptyDescription')}
      />
    </div>
  );
};

export default BudgetListPage;
