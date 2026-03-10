import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PageHeader, MetricCard, DataTable, StatusBadge } from '@/design-system/components';
import { DollarSign, TrendingUp, Shield, Users, Briefcase, BarChart3 } from 'lucide-react';
import { t } from '@/i18n';
import { executiveKpiApi } from '@/api/executiveKpi';
import type { ProjectHealth } from '@/api/executiveKpi';
import { formatMoney } from '@/lib/format';
import type { ColumnDef } from '@tanstack/react-table';

const HEALTH_COLORS: Record<string, string> = {
  GREEN: 'green',
  YELLOW: 'yellow',
  RED: 'red',
};

export default function ExecutiveKpiDashboardPage() {
  const [activeTab, setActiveTab] = useState('overview');

  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['executive-dashboard'],
    queryFn: executiveKpiApi.getDashboard,
  });

  const tabs = [
    { id: 'overview', label: t('executiveKpi.tabOverview') },
    { id: 'projects', label: t('executiveKpi.tabProjects') },
    { id: 'cashflow', label: t('executiveKpi.tabCashflow') },
    { id: 'safety', label: t('executiveKpi.tabSafety') },
  ];

  const projectColumns: ColumnDef<ProjectHealth>[] = [
    { accessorKey: 'projectName', header: t('executiveKpi.colProject') },
    {
      accessorKey: 'healthStatus',
      header: t('executiveKpi.colHealth'),
      cell: ({ row }) => <StatusBadge status={row.original.healthStatus} colorMap={HEALTH_COLORS} />,
    },
    {
      accessorKey: 'cpi',
      header: 'CPI',
      cell: ({ row }) => (
        <span className={row.original.cpi < 0.9 ? 'text-red-600 dark:text-red-400 font-semibold' : row.original.cpi < 1.0 ? 'text-yellow-600 dark:text-yellow-400' : 'text-green-600 dark:text-green-400'}>
          {row.original.cpi.toFixed(2)}
        </span>
      ),
    },
    {
      accessorKey: 'spi',
      header: 'SPI',
      cell: ({ row }) => (
        <span className={row.original.spi < 0.9 ? 'text-red-600 dark:text-red-400 font-semibold' : row.original.spi < 1.0 ? 'text-yellow-600 dark:text-yellow-400' : 'text-green-600 dark:text-green-400'}>
          {row.original.spi.toFixed(2)}
        </span>
      ),
    },
    { accessorKey: 'contractAmount', header: t('executiveKpi.colContract'), cell: ({ row }) => formatMoney(row.original.contractAmount) },
    { accessorKey: 'budgetAmount', header: t('executiveKpi.colBudget'), cell: ({ row }) => formatMoney(row.original.budgetAmount) },
    { accessorKey: 'spentAmount', header: t('executiveKpi.colSpent'), cell: ({ row }) => formatMoney(row.original.spentAmount) },
  ];

  const ps = dashboard?.portfolioSummary;
  const cp = dashboard?.cashPosition;
  const sm = dashboard?.safetyMetrics;
  const ru = dashboard?.resourceUtilization;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('executiveKpi.title')}
        subtitle={t('executiveKpi.subtitle')}
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {activeTab === 'overview' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard label={t('executiveKpi.metricContractValue')} value={formatMoney(ps?.totalContractValue ?? 0)} icon={<DollarSign className="h-5 w-5" />} />
            <MetricCard label={t('executiveKpi.metricEbit')} value={`${(ps?.ebitMargin ?? 0).toFixed(1)}%`} icon={<TrendingUp className="h-5 w-5" />} />
            <MetricCard label={t('executiveKpi.metricProjects')} value={ps?.activeProjectCount ?? 0} icon={<Briefcase className="h-5 w-5" />} trend={{ direction: 'neutral', value: `${ps?.projectCount ?? 0} ${t('executiveKpi.totalProjects')}` }} />
            <MetricCard label={t('executiveKpi.metricNetCash')} value={formatMoney(cp?.netCash ?? 0)} icon={<DollarSign className="h-5 w-5" />} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard label={t('executiveKpi.metricTrir')} value={(sm?.trir ?? 0).toFixed(2)} icon={<Shield className="h-5 w-5" />} />
            <MetricCard label={t('executiveKpi.metricDaysSafe')} value={sm?.daysSinceLastIncident ?? 0} icon={<Shield className="h-5 w-5" />} />
            <MetricCard label={t('executiveKpi.metricWorkerUtil')} value={`${ru?.workerUtilizationPercent ?? 0}%`} icon={<Users className="h-5 w-5" />} />
            <MetricCard label={t('executiveKpi.metricEquipUtil')} value={`${ru?.equipmentUtilizationPercent ?? 0}%`} icon={<BarChart3 className="h-5 w-5" />} />
          </div>

          {/* Project health summary */}
          <div className="bg-white dark:bg-neutral-900 rounded-lg border dark:border-neutral-700 p-6">
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">{t('executiveKpi.projectHealth')}</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">{dashboard?.projectHealth?.filter(p => p.healthStatus === 'GREEN').length ?? 0}</div>
                <div className="text-sm text-green-700 dark:text-green-400">{t('executiveKpi.healthGreen')}</div>
              </div>
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{dashboard?.projectHealth?.filter(p => p.healthStatus === 'YELLOW').length ?? 0}</div>
                <div className="text-sm text-yellow-700 dark:text-yellow-400">{t('executiveKpi.healthYellow')}</div>
              </div>
              <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">{dashboard?.projectHealth?.filter(p => p.healthStatus === 'RED').length ?? 0}</div>
                <div className="text-sm text-red-700 dark:text-red-400">{t('executiveKpi.healthRed')}</div>
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === 'projects' && (
        <DataTable columns={projectColumns} data={dashboard?.projectHealth ?? []} loading={isLoading} />
      )}

      {activeTab === 'cashflow' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard label={t('executiveKpi.metricAR')} value={formatMoney(cp?.totalAR ?? 0)} icon={<DollarSign className="h-5 w-5" />} />
            <MetricCard label={t('executiveKpi.metricAP')} value={formatMoney(cp?.totalAP ?? 0)} icon={<DollarSign className="h-5 w-5" />} />
            <MetricCard label={t('executiveKpi.metricNetCash')} value={formatMoney(cp?.netCash ?? 0)} icon={<DollarSign className="h-5 w-5" />} />
            <MetricCard label={t('executiveKpi.metricInvoiced')} value={formatMoney(ps?.totalInvoiced ?? 0)} icon={<DollarSign className="h-5 w-5" />} />
          </div>

          <div className="bg-white dark:bg-neutral-900 rounded-lg border dark:border-neutral-700 p-6">
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">{t('executiveKpi.arAging')}</h3>
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="text-lg font-bold">{formatMoney(cp?.arBucket0_30 ?? 0)}</div>
                <div className="text-sm text-neutral-500 dark:text-neutral-400">0-30 {t('executiveKpi.days')}</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <div className="text-lg font-bold">{formatMoney(cp?.arBucket31_60 ?? 0)}</div>
                <div className="text-sm text-neutral-500 dark:text-neutral-400">31-60 {t('executiveKpi.days')}</div>
              </div>
              <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                <div className="text-lg font-bold">{formatMoney(cp?.arBucket61_90 ?? 0)}</div>
                <div className="text-sm text-neutral-500 dark:text-neutral-400">61-90 {t('executiveKpi.days')}</div>
              </div>
              <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <div className="text-lg font-bold">{formatMoney(cp?.arBucket90Plus ?? 0)}</div>
                <div className="text-sm text-neutral-500 dark:text-neutral-400">90+ {t('executiveKpi.days')}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'safety' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <MetricCard label={t('executiveKpi.metricIncidents')} value={sm?.totalIncidents ?? 0} icon={<Shield className="h-5 w-5" />} />
            <MetricCard label={t('executiveKpi.metricTrir')} value={(sm?.trir ?? 0).toFixed(2)} icon={<Shield className="h-5 w-5" />} />
            <MetricCard label={t('executiveKpi.metricDaysSafe')} value={sm?.daysSinceLastIncident ?? 0} icon={<Shield className="h-5 w-5" />} />
            <MetricCard label={t('executiveKpi.metricWorkerUtil')} value={`${ru?.workerUtilizationPercent ?? 0}%`} icon={<Users className="h-5 w-5" />} />
          </div>

          {sm?.severityBreakdown && Object.keys(sm.severityBreakdown).length > 0 && (
            <div className="bg-white dark:bg-neutral-900 rounded-lg border dark:border-neutral-700 p-6">
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">{t('executiveKpi.severityBreakdown')}</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(sm.severityBreakdown).map(([severity, count]) => (
                  <div key={severity} className="text-center p-4 border dark:border-neutral-700 rounded-lg">
                    <div className="text-xl font-bold">{count}</div>
                    <div className="text-sm text-neutral-500 dark:text-neutral-400">{severity}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
