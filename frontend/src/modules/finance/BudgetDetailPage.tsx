import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import {
  Edit3,
  Wallet,
  TrendingUp,
  TrendingDown,
  Receipt,
  BarChart3,
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
import { Button } from '@/design-system/components/Button';
import { MetricCard } from '@/design-system/components/MetricCard';
import { DataTable } from '@/design-system/components/DataTable';
import { EmptyState } from '@/design-system/components/EmptyState';
import {
  StatusBadge,
  budgetStatusColorMap,
  budgetStatusLabels,
  budgetCategoryColorMap,
  budgetCategoryLabels,
} from '@/design-system/components/StatusBadge';
import { financeApi } from '@/api/finance';
import { specificationsApi } from '@/api/specifications';
import { formatMoney, formatMoneyCompact, formatPercent } from '@/lib/format';
import { t } from '@/i18n';
import type { Budget, BudgetItem, CommercialProposal, Specification } from '@/types';

type DetailTab = 'overview' | 'items' | 'chart';

const normalizeBudgetCategory = (category?: string | null): string | undefined => {
  if (!category) return undefined;
  return category.toUpperCase().replace(/\s+/g, '_');
};

const resolveBudgetCategoryLabel = (category?: string | null): string => {
  if (!category) return '';
  const normalized = normalizeBudgetCategory(category);
  return (
    budgetCategoryLabels[category]
    ?? (normalized ? budgetCategoryLabels[normalized] : undefined)
    ?? category
  );
};

const BudgetDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<DetailTab>('overview');

  const {
    data: budget,
    isLoading: isBudgetLoading,
    isError: isBudgetError,
    refetch: refetchBudget,
  } = useQuery({
    queryKey: ['budget', id],
    queryFn: () => financeApi.getBudget(id!),
    enabled: !!id,
  });

  const {
    data: items,
    isLoading: isItemsLoading,
    isError: isItemsError,
    refetch: refetchItems,
  } = useQuery({
    queryKey: ['budget-items', id],
    queryFn: () => financeApi.getBudgetItems(id!),
    enabled: !!id,
  });

  const { data: projectSpecifications } = useQuery({
    queryKey: ['specifications', 'by-project', budget?.projectId],
    queryFn: () => specificationsApi.getSpecifications({ projectId: budget!.projectId, page: 0, size: 20 }),
    enabled: !!budget?.projectId,
  });

  const { data: projectProposals } = useQuery({
    queryKey: ['commercial-proposals', 'by-project', budget?.projectId],
    queryFn: () => financeApi.getCommercialProposals({ projectId: budget!.projectId, page: 0, size: 30 }),
    enabled: !!budget?.projectId,
  });

  const b = budget;
  const budgetItems = items ?? [];
  const relatedSpec = useMemo(
    () => (projectSpecifications?.content ?? [])[0] as Specification | undefined,
    [projectSpecifications],
  );
  const relatedProposal = useMemo(
    () => {
      const proposals = (projectProposals?.content ?? []) as CommercialProposal[];
      return proposals.find((proposal) => proposal.budgetId === id) ?? proposals[0];
    },
    [projectProposals, id],
  );

  const chartData = useMemo(() =>
    budgetItems.map((item) => ({
      name: resolveBudgetCategoryLabel(item.category),
      [t('finance.budgetDetail.chartPlan')]: item.plannedAmount / 1_000_000,
      [t('finance.budgetDetail.chartActual')]: item.actualAmount / 1_000_000,
      [t('finance.budgetDetail.chartCommitted')]: item.committedAmount / 1_000_000,
    })),
    [budgetItems],
  );

  const itemColumns = useMemo<ColumnDef<BudgetItem, unknown>[]>(
    () => [
      {
        accessorKey: 'category',
        header: t('finance.budgetDetail.colCategory'),
        size: 140,
        cell: ({ getValue }) => {
          const rawCategory = getValue<string>();
          const normalizedCategory = normalizeBudgetCategory(rawCategory) ?? rawCategory;
          return (
            <StatusBadge
              status={normalizedCategory}
              colorMap={budgetCategoryColorMap}
              label={resolveBudgetCategoryLabel(rawCategory)}
            />
          );
        },
      },
      {
        accessorKey: 'name',
        header: t('finance.budgetDetail.colName'),
        size: 220,
        cell: ({ getValue }) => (
          <span className="font-medium text-neutral-900 dark:text-neutral-100">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'plannedAmount',
        header: t('finance.budgetDetail.colPlanned'),
        size: 160,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-right block">{formatMoney(getValue<number>())}</span>
        ),
      },
      {
        accessorKey: 'actualAmount',
        header: t('finance.budgetDetail.colActual'),
        size: 160,
        cell: ({ getValue }) => (
          <span className="font-medium tabular-nums text-right block">{formatMoney(getValue<number>())}</span>
        ),
      },
      {
        accessorKey: 'committedAmount',
        header: t('finance.budgetDetail.colCommitted'),
        size: 160,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-right block text-warning-600">{formatMoney(getValue<number>())}</span>
        ),
      },
      {
        accessorKey: 'remainingAmount',
        header: t('finance.budgetDetail.colRemaining'),
        size: 160,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-right block text-success-600">{formatMoney(getValue<number>())}</span>
        ),
      },
    ],
    [],
  );

  if (!id) {
    return (
      <div className="animate-fade-in">
        <EmptyState
          variant="ERROR"
          title={t('errors.badRequest')}
          description={t('errors.invalidIdFormat')}
        />
      </div>
    );
  }

  if (isBudgetLoading) {
    return (
      <div className="animate-fade-in flex items-center justify-center py-16 text-neutral-500 dark:text-neutral-400">
        {t('common.loading')}
      </div>
    );
  }

  if (isBudgetError || !b) {
    return (
      <div className="animate-fade-in">
        <PageHeader
          title={t('finance.budgetList.title')}
          backTo="/budgets"
          breadcrumbs={[
            { label: t('common.home'), href: '/' },
            { label: t('finance.budgetList.breadcrumbFinance') },
            { label: t('finance.budgetList.breadcrumbBudgets'), href: '/budgets' },
          ]}
        />
        <EmptyState
          variant="ERROR"
          title={t('errors.noConnection')}
          description={t('errors.serverErrorRetry')}
          actionLabel={t('common.retry')}
          onAction={() => void refetchBudget()}
        />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={b?.name ?? ''}
        subtitle={b?.projectName ?? t('finance.budgetDetail.defaultSubtitle')}
        backTo="/budgets"
        breadcrumbs={[
          { label: t('common.home'), href: '/' },
          { label: t('finance.budgetDetail.breadcrumbFinance') },
          { label: t('finance.budgetDetail.breadcrumbBudgets'), href: '/budgets' },
          { label: b?.name ?? '' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate(`/budgets/${id}/fm`)}
            >
              {t('finance.fm.breadcrumbFm')}
            </Button>
            <StatusBadge
              status={b?.status ?? ''}
              colorMap={budgetStatusColorMap}
              label={budgetStatusLabels[b?.status ?? ''] ?? b?.status ?? ''}
              size="md"
            />
            <Button
              variant="secondary"
              size="sm"
              iconLeft={<Edit3 size={14} />}
              onClick={() => navigate(`/budgets/${id}/edit`)}
            >
              {t('finance.budgetDetail.edit')}
            </Button>
          </div>
        }
        tabs={[
          { id: 'overview', label: t('finance.budgetDetail.tabOverview') },
          { id: 'items', label: t('finance.budgetDetail.tabItems') },
          { id: 'chart', label: t('finance.budgetDetail.tabChart') },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as DetailTab)}
      />

      <div className="mb-6 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-4">
        <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
          {t('finance.budgetDetail.flowTitle')}
        </p>
        <div className="flex flex-wrap gap-2">
          {relatedSpec && (
            <Button variant="secondary" size="sm" onClick={() => navigate(`/specifications/${relatedSpec.id}`)}>
              {t('finance.budgetDetail.flowSpec')}
            </Button>
          )}
          {relatedSpec && (
            <Button variant="secondary" size="sm" onClick={() => navigate(`/specifications/${relatedSpec.id}/supply-dashboard`)}>
              {t('finance.budgetDetail.flowCl')}
            </Button>
          )}
          {relatedProposal && (
            <Button variant="secondary" size="sm" onClick={() => navigate(`/commercial-proposals/${relatedProposal.id}`)}>
              {t('finance.budgetDetail.flowCp')}
            </Button>
          )}
          <Button variant="secondary" size="sm" onClick={() => navigate(`/budgets/${id}/fm`)}>
            {t('finance.budgetDetail.flowFm')}
          </Button>
        </div>
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <MetricCard
              icon={<TrendingUp size={18} />}
              label={t('finance.budgetDetail.plannedRevenue')}
              value={formatMoneyCompact(b?.plannedRevenue ?? 0)}
            />
            <MetricCard
              icon={<TrendingDown size={18} />}
              label={t('finance.budgetDetail.plannedCost')}
              value={formatMoneyCompact(b?.plannedCost ?? 0)}
            />
            <MetricCard
              icon={<Wallet size={18} />}
              label={t('finance.budgetDetail.plannedMargin')}
              value={formatMoneyCompact(b?.plannedMargin ?? 0)}
              trend={{ direction: 'up', value: formatPercent((b?.plannedRevenue ?? 0) > 0 ? ((b?.plannedMargin ?? 0) / (b?.plannedRevenue ?? 1)) * 100 : 0) }}
            />
            <MetricCard
              icon={<TrendingUp size={18} />}
              label={t('finance.budgetDetail.actualRevenue')}
              value={formatMoneyCompact(b?.actualRevenue ?? 0)}
              trend={{ direction: (b?.revenueVariancePercent ?? 0) >= 0 ? 'up' : 'down', value: formatPercent(Math.abs(b?.revenueVariancePercent ?? 0)) }}
            />
            <MetricCard
              icon={<TrendingDown size={18} />}
              label={t('finance.budgetDetail.actualCost')}
              value={formatMoneyCompact(b?.actualCost ?? 0)}
              trend={{ direction: (b?.costVariancePercent ?? 0) <= 0 ? 'up' : 'down', value: formatPercent(Math.abs(b?.costVariancePercent ?? 0)) }}
            />
            <MetricCard
              icon={<Receipt size={18} />}
              label={t('finance.budgetDetail.actualMargin')}
              value={formatMoneyCompact(b?.actualMargin ?? 0)}
              trend={{ direction: (b?.actualMargin ?? 0) >= 0 ? 'up' : 'down', value: formatMoneyCompact(b?.actualMargin ?? 0) }}
            />
          </div>

          {isItemsError ? (
            <EmptyState
              variant="ERROR"
              title={t('errors.noConnection')}
              description={t('errors.serverErrorRetry')}
              actionLabel={t('common.retry')}
              onAction={() => void refetchItems()}
            />
          ) : (
            <DataTable<BudgetItem>
              data={budgetItems}
              columns={itemColumns}
              loading={isItemsLoading}
              enableColumnVisibility
              enableExport
              pageSize={20}
              emptyTitle={t('finance.budgetDetail.emptyItems')}
              emptyDescription={t('finance.budgetDetail.emptyItemsDesc')}
            />
          )}
        </div>
      )}

      {activeTab === 'items' && (
        isItemsError ? (
          <EmptyState
            variant="ERROR"
            title={t('errors.noConnection')}
            description={t('errors.serverErrorRetry')}
            actionLabel={t('common.retry')}
            onAction={() => void refetchItems()}
          />
        ) : (
          <DataTable<BudgetItem>
            data={budgetItems}
            columns={itemColumns}
            loading={isItemsLoading}
            enableColumnVisibility
            enableExport
            pageSize={20}
            emptyTitle={t('finance.budgetDetail.emptyItems')}
            emptyDescription={t('finance.budgetDetail.emptyItemsDesc')}
          />
        )
      )}

      {activeTab === 'chart' && (
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">{t('finance.budgetDetail.chartTitle')}</h3>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value: number) => `${value.toFixed(1)} ${t('finance.budgetDetail.chartTooltipUnit')}`}
                  contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb' }}
                />
                <Legend />
                <Bar dataKey={t('finance.budgetDetail.chartPlan')} fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey={t('finance.budgetDetail.chartActual')} fill="#22c55e" radius={[4, 4, 0, 0]} />
                <Bar dataKey={t('finance.budgetDetail.chartCommitted')} fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};

export default BudgetDetailPage;
