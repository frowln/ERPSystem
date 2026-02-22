import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ComposedChart,
} from 'recharts';
import { PageHeader } from '@/design-system/components/PageHeader';
import { MetricCard } from '@/design-system/components/MetricCard';
import { DataTable } from '@/design-system/components/DataTable';
import { changeManagementApi } from '@/api/changeManagement';
import { useProjectOptions } from '@/hooks/useSelectOptions';
import { t } from '@/i18n';
import { formatMoney } from '@/lib/format';
import type { ColumnDef } from '@tanstack/react-table';
import type {
  AffectedWbsNode,
  ChangeOrderScheduleImpact,
  ChangeOrderImpactItem,
  BudgetImpactByType,
  BudgetImpactMonthly,
  SourceBreakdown,
  TypeBreakdown,
} from './types';

type TabId = 'budget' | 'schedule' | 'trends';

export default function ChangeManagementDashboardPage() {
  const navigate = useNavigate();
  const { options: projectOptions } = useProjectOptions();
  const [projectId, setProjectId] = useState('');
  const [activeTab, setActiveTab] = useState<TabId>('budget');

  const enabled = !!projectId;

  const { data: budgetData, isLoading: budgetLoading } = useQuery({
    queryKey: ['cm-budget-impact', projectId],
    queryFn: () => changeManagementApi.getBudgetImpact(projectId),
    enabled: enabled && activeTab === 'budget',
  });

  const { data: scheduleData, isLoading: scheduleLoading } = useQuery({
    queryKey: ['cm-schedule-impact', projectId],
    queryFn: () => changeManagementApi.getScheduleImpact(projectId),
    enabled: enabled && activeTab === 'schedule',
  });

  const { data: trendData, isLoading: trendLoading } = useQuery({
    queryKey: ['cm-trends', projectId],
    queryFn: () => changeManagementApi.getTrends(projectId),
    enabled: enabled && activeTab === 'trends',
  });

  const tp = (k: string) => t(`changeManagement.analytics.${k}`);

  // ── Column definitions ──

  const wbsColumns = useMemo<ColumnDef<AffectedWbsNode>[]>(() => [
    { accessorKey: 'code', header: tp('colWbsCode'), size: 120 },
    { accessorKey: 'name', header: tp('colWbsName') },
    {
      accessorKey: 'isCriticalPath',
      header: tp('colCriticalPath'),
      size: 100,
      cell: ({ getValue }) => (
        <span className={getValue() ? 'text-red-600 font-semibold' : 'text-gray-500'}>
          {getValue() ? tp('yes') : tp('no')}
        </span>
      ),
    },
    {
      accessorKey: 'totalFloat',
      header: tp('colFloat'),
      size: 80,
      cell: ({ getValue }) => `${getValue()} ${tp('days')}`,
    },
    { accessorKey: 'changeOrderCount', header: tp('colOrderCount'), size: 60 },
    {
      accessorKey: 'totalCostImpact',
      header: tp('colCostImpact'),
      size: 140,
      cell: ({ getValue }) => formatMoney(getValue() as number),
    },
  ], [t]);

  const coImpactColumns = useMemo<ColumnDef<ChangeOrderImpactItem>[]>(() => [
    {
      accessorKey: 'number',
      header: tp('colOrderNumber'),
      size: 100,
      cell: ({ row }) => (
        <button
          className="text-blue-600 hover:underline"
          onClick={() => navigate(`/change-management/orders/${row.original.changeOrderId}`)}
        >
          {row.original.number}
        </button>
      ),
    },
    { accessorKey: 'title', header: tp('colOrderTitle') },
    {
      accessorKey: 'scheduleImpactDays',
      header: tp('colDays'),
      size: 80,
      cell: ({ getValue }) => {
        const v = getValue() as number;
        return <span className={v > 0 ? 'text-red-600 font-medium' : ''}>{v > 0 ? `+${v}` : v} {tp('days')}</span>;
      },
    },
    {
      accessorKey: 'affectsCriticalPath',
      header: tp('colCritical'),
      size: 90,
      cell: ({ getValue }) => (
        <span className={getValue() ? 'text-red-600 font-semibold' : 'text-gray-500'}>
          {getValue() ? tp('yes') : tp('no')}
        </span>
      ),
    },
    {
      accessorKey: 'affectedWbsCodes',
      header: tp('colAffectedWbs'),
      cell: ({ getValue }) => (getValue() as string[]).join(', ') || '—',
    },
  ], [t, navigate]);

  const typeColumns = useMemo<ColumnDef<BudgetImpactByType>[]>(() => [
    { accessorKey: 'changeOrderType', header: tp('colType'), size: 140 },
    { accessorKey: 'count', header: tp('colCount'), size: 80 },
    {
      accessorKey: 'totalAmount',
      header: tp('colAmount'),
      cell: ({ getValue }) => formatMoney(getValue() as number),
    },
    {
      accessorKey: 'percentage',
      header: tp('colPercent'),
      size: 80,
      cell: ({ getValue }) => `${(getValue() as number).toFixed(1)}%`,
    },
  ], [t]);

  const monthlyColumns = useMemo<ColumnDef<BudgetImpactMonthly>[]>(() => [
    { accessorKey: 'month', header: tp('colMonth'), size: 100 },
    {
      accessorKey: 'additions',
      header: tp('colAdditions'),
      cell: ({ getValue }) => <span className="text-green-600">{formatMoney(getValue() as number)}</span>,
    },
    {
      accessorKey: 'deductions',
      header: tp('colDeductions'),
      cell: ({ getValue }) => <span className="text-red-600">{formatMoney(getValue() as number)}</span>,
    },
    {
      accessorKey: 'netChange',
      header: tp('colNetChange'),
      cell: ({ getValue }) => {
        const v = getValue() as number;
        return <span className={v >= 0 ? 'text-green-600' : 'text-red-600'}>{formatMoney(v)}</span>;
      },
    },
    {
      accessorKey: 'cumulativeChange',
      header: tp('colCumulative'),
      cell: ({ getValue }) => formatMoney(getValue() as number),
    },
  ], [t]);

  const sourceColumns = useMemo<ColumnDef<SourceBreakdown>[]>(() => [
    { accessorKey: 'source', header: tp('colSource') },
    { accessorKey: 'count', header: tp('colCount'), size: 80 },
    {
      accessorKey: 'estimatedCost',
      header: tp('colEstimatedCost'),
      cell: ({ getValue }) => formatMoney(getValue() as number),
    },
  ], [t]);

  const typeBreakdownColumns = useMemo<ColumnDef<TypeBreakdown>[]>(() => [
    { accessorKey: 'type', header: tp('colType') },
    { accessorKey: 'count', header: tp('colCount'), size: 80 },
    {
      accessorKey: 'totalAmount',
      header: tp('colAmount'),
      cell: ({ getValue }) => formatMoney(getValue() as number),
    },
  ], [t]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={tp('title')}
        subtitle={tp('subtitle')}
        breadcrumbs={[
          { label: t('changeManagement.orderList.breadcrumbHome'), href: '/' },
          { label: t('changeManagement.orderList.breadcrumbChangeManagement'), href: '/change-management/orders' },
          { label: tp('breadcrumbAnalytics') },
        ]}
        tabs={[
          { id: 'budget' as TabId, label: tp('tabBudget') },
          { id: 'schedule' as TabId, label: tp('tabSchedule') },
          { id: 'trends' as TabId, label: tp('tabTrends') },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as TabId)}
      />

      {/* Project selector */}
      <div className="max-w-sm">
        <select
          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
        >
          <option value="">{tp('selectProject')}</option>
          {projectOptions.map((p) => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>
      </div>

      {!projectId && (
        <div className="rounded-lg border border-dashed border-gray-300 p-12 text-center text-gray-500 dark:border-gray-600 dark:text-gray-400">
          {tp('noProjectSelected')}
        </div>
      )}

      {/* ── Budget Impact tab ── */}
      {activeTab === 'budget' && projectId && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
            <MetricCard label={tp('originalContract')} value={formatMoney(budgetData?.originalContractAmount ?? 0)} loading={budgetLoading} />
            <MetricCard label={tp('approvedAdditions')} value={formatMoney(budgetData?.totalApprovedAdditions ?? 0)} loading={budgetLoading} />
            <MetricCard label={tp('approvedDeductions')} value={formatMoney(budgetData?.totalApprovedDeductions ?? 0)} loading={budgetLoading} />
            <MetricCard label={tp('netChange')} value={formatMoney(budgetData?.netChangeAmount ?? 0)} loading={budgetLoading} />
            <MetricCard label={tp('revisedContract')} value={formatMoney(budgetData?.revisedContractAmount ?? 0)} loading={budgetLoading} />
            <MetricCard label={tp('changePercent')} value={`${(budgetData?.changePercentage ?? 0).toFixed(1)}%`} loading={budgetLoading} />
          </div>

          {/* Monthly budget impact chart */}
          {(budgetData?.monthlyImpact?.length ?? 0) > 0 && (
            <div className="rounded-lg border bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
              <h3 className="mb-4 text-sm font-medium text-gray-700 dark:text-gray-300">{tp('monthlyImpactTitle')}</h3>
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={budgetData?.monthlyImpact}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v: number) => formatMoney(v)} />
                  <Legend />
                  <Bar dataKey="additions" name={tp('colAdditions')} fill="#22c55e" />
                  <Bar dataKey="deductions" name={tp('colDeductions')} fill="#ef4444" />
                  <Line type="monotone" dataKey="cumulativeChange" name={tp('colCumulative')} stroke="#6366f1" strokeWidth={2} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <h3 className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">{tp('byTypeTitle')}</h3>
              <DataTable columns={typeColumns} data={budgetData?.byType ?? []} loading={budgetLoading} />
            </div>
            <div>
              <h3 className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">{tp('monthlyImpactTitle')}</h3>
              <DataTable columns={monthlyColumns} data={budgetData?.monthlyImpact ?? []} loading={budgetLoading} />
            </div>
          </div>
        </div>
      )}

      {/* ── Schedule Impact tab ── */}
      {activeTab === 'schedule' && projectId && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <MetricCard
              label={tp('totalScheduleImpact')}
              value={`${scheduleData?.totalScheduleImpactDays ?? 0} ${tp('days')}`}
              loading={scheduleLoading}
            />
            <MetricCard
              label={tp('criticalPathImpact')}
              value={`${scheduleData?.criticalPathImpactDays ?? 0} ${tp('days')}`}
              loading={scheduleLoading}
            />
            <MetricCard
              label={tp('ordersOnCritical')}
              value={`${scheduleData?.changeOrdersOnCriticalPath ?? 0} / ${scheduleData?.totalChangeOrders ?? 0}`}
              loading={scheduleLoading}
            />
            <MetricCard
              label={t('changeManagement.analytics.affectedWbsNodes')}
              value={String(scheduleData?.affectedNodes?.length ?? 0)}
              loading={scheduleLoading}
            />
          </div>

          <div>
            <h3 className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">{tp('affectedWbsNodes')}</h3>
            <DataTable columns={wbsColumns} data={scheduleData?.affectedNodes ?? []} loading={scheduleLoading} />
          </div>

          <div>
            <h3 className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">{tp('changeOrderImpacts')}</h3>
            <DataTable columns={coImpactColumns} data={scheduleData?.changeOrderImpacts ?? []} loading={scheduleLoading} />
          </div>
        </div>
      )}

      {/* ── Trends tab ── */}
      {activeTab === 'trends' && projectId && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            <MetricCard label={tp('totalEvents')} value={String(trendData?.totalEvents ?? 0)} loading={trendLoading} />
            <MetricCard label={tp('totalOrders')} value={String(trendData?.totalOrders ?? 0)} loading={trendLoading} />
            <MetricCard label={tp('cumulativeCost')} value={formatMoney(trendData?.cumulativeCost ?? 0)} loading={trendLoading} />
          </div>

          {/* Monthly trend chart */}
          {(trendData?.monthlyTrends?.length ?? 0) > 0 && (
            <div className="rounded-lg border bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
              <h3 className="mb-4 text-sm font-medium text-gray-700 dark:text-gray-300">{tp('monthlyTrendsChart')}</h3>
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={trendData?.monthlyTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="eventCount" name={tp('eventCount')} fill="#3b82f6" />
                  <Bar yAxisId="left" dataKey="orderCount" name={tp('orderCount')} fill="#f59e0b" />
                  <Line yAxisId="right" type="monotone" dataKey="cumulativeAmount" name={tp('cumulativeAmount')} stroke="#6366f1" strokeWidth={2} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <h3 className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">{tp('bySourceTitle')}</h3>
              <DataTable columns={sourceColumns} data={trendData?.bySource ?? []} loading={trendLoading} />
            </div>
            <div>
              <h3 className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">{tp('byTypeBreakdown')}</h3>
              <DataTable columns={typeBreakdownColumns} data={trendData?.byType ?? []} loading={trendLoading} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
