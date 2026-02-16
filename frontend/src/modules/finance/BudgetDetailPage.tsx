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
import {
  StatusBadge,
  budgetStatusColorMap,
  budgetStatusLabels,
  budgetCategoryColorMap,
  budgetCategoryLabels,
} from '@/design-system/components/StatusBadge';
import { financeApi } from '@/api/finance';
import { formatMoney, formatMoneyCompact, formatPercent } from '@/lib/format';
import { t } from '@/i18n';
import type { Budget, BudgetItem } from '@/types';

type DetailTab = 'overview' | 'items' | 'chart';

const BudgetDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<DetailTab>('overview');

  const { data: budget } = useQuery({
    queryKey: ['budget', id],
    queryFn: () => financeApi.getBudget(id!),
    enabled: !!id,
  });

  const { data: items } = useQuery({
    queryKey: ['budget-items', id],
    queryFn: () => financeApi.getBudgetItems(id!),
    enabled: !!id,
  });

  const b = budget;
  const budgetItems = items ?? [];

  const chartData = useMemo(() =>
    budgetItems.map((item) => ({
      name: budgetCategoryLabels[item.category] ?? item.category,
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
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={budgetCategoryColorMap}
            label={budgetCategoryLabels[getValue<string>()] ?? getValue<string>()}
          />
        ),
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

          <DataTable<BudgetItem>
            data={budgetItems}
            columns={itemColumns}
            loading={false}
            enableColumnVisibility
            enableExport
            pageSize={20}
            emptyTitle={t('finance.budgetDetail.emptyItems')}
            emptyDescription={t('finance.budgetDetail.emptyItemsDesc')}
          />
        </div>
      )}

      {activeTab === 'items' && (
        <DataTable<BudgetItem>
          data={budgetItems}
          columns={itemColumns}
          loading={false}
          enableColumnVisibility
          enableExport
          pageSize={20}
          emptyTitle={t('finance.budgetDetail.emptyItems')}
          emptyDescription={t('finance.budgetDetail.emptyItemsDesc')}
        />
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
