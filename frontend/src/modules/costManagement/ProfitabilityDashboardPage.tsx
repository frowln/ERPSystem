import React, { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { RefreshCw } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { DataTable } from '@/design-system/components/DataTable';
import { MetricCard } from '@/design-system/components/MetricCard';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { costManagementApi } from '@/api/costManagement';
import { formatMoney } from '@/lib/format';
import { t } from '@/i18n';
import type { ProfitabilityForecast, ProfitabilityPortfolio, ProfitabilitySnapshot, ProfitabilityRiskLevel } from './types';

const riskColorMap: Record<string, string> = {
  LOW: 'green',
  MEDIUM: 'yellow',
  HIGH: 'orange',
  CRITICAL: 'red',
};

const riskLabelFn = (level: ProfitabilityRiskLevel): string => {
  const key: Record<ProfitabilityRiskLevel, string> = {
    LOW: 'costManagement.profitability.riskLow',
    MEDIUM: 'costManagement.profitability.riskMedium',
    HIGH: 'costManagement.profitability.riskHigh',
    CRITICAL: 'costManagement.profitability.riskCritical',
  };
  return t(key[level]);
};

type TabId = 'all' | 'atRisk' | 'loss' | 'portfolio';

const ProfitabilityDashboardPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  const { data: forecastsData, isLoading: forecastsLoading } = useQuery({
    queryKey: ['profitability-forecasts'],
    queryFn: () => costManagementApi.getProfitabilityForecasts({ size: 200 }),
  });

  const { data: portfolio } = useQuery({
    queryKey: ['profitability-portfolio'],
    queryFn: () => costManagementApi.getPortfolioSummary(),
  });

  const { data: snapshots } = useQuery({
    queryKey: ['profitability-snapshots', selectedProjectId],
    queryFn: () => costManagementApi.getProfitabilitySnapshots(selectedProjectId!),
    enabled: !!selectedProjectId,
  });

  const recalculateMutation = useMutation({
    mutationFn: (projectId: string) => costManagementApi.recalculateProfitability(projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profitability-forecasts'] });
      queryClient.invalidateQueries({ queryKey: ['profitability-portfolio'] });
    },
  });

  const recalculateAllMutation = useMutation({
    mutationFn: () => costManagementApi.recalculateAllProfitability(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profitability-forecasts'] });
      queryClient.invalidateQueries({ queryKey: ['profitability-portfolio'] });
    },
  });

  const forecasts = forecastsData?.content ?? [];

  const filteredForecasts = useMemo(() => {
    if (activeTab === 'atRisk') return forecasts.filter(f => f.riskLevel === 'HIGH' || f.riskLevel === 'CRITICAL');
    if (activeTab === 'loss') return forecasts.filter(f => f.forecastMargin < 0);
    return forecasts;
  }, [forecasts, activeTab]);

  const tabs = useMemo(() => [
    { id: 'all' as TabId, label: t('costManagement.profitability.tabAll'), count: forecasts.length },
    { id: 'atRisk' as TabId, label: t('costManagement.profitability.tabAtRisk'), count: forecasts.filter(f => f.riskLevel === 'HIGH' || f.riskLevel === 'CRITICAL').length },
    { id: 'loss' as TabId, label: t('costManagement.profitability.tabLoss'), count: forecasts.filter(f => f.forecastMargin < 0).length },
    { id: 'portfolio' as TabId, label: t('costManagement.profitability.tabPortfolio') },
  ], [forecasts]);

  const handleRowClick = useCallback((row: ProfitabilityForecast) => {
    setSelectedProjectId(prev => prev === row.projectId ? null : row.projectId);
  }, []);

  const getFadeColor = (pct: number) => {
    if (pct > 20) return 'text-red-600 dark:text-red-400 font-bold';
    if (pct > 10) return 'text-orange-600 dark:text-orange-400 font-semibold';
    if (pct > 0) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-green-600 dark:text-green-400';
  };

  const columns = useMemo<ColumnDef<ProfitabilityForecast>[]>(() => [
    {
      accessorKey: 'projectName',
      header: t('costManagement.profitability.colProject'),
      cell: ({ row }) => (
        <span className="font-medium text-gray-900 dark:text-white">
          {row.original.projectName || row.original.projectId?.slice(0, 8)}
        </span>
      ),
    },
    {
      accessorKey: 'contractAmount',
      header: t('costManagement.profitability.colContract'),
      cell: ({ row }) => formatMoney(row.original.contractAmount),
    },
    {
      accessorKey: 'estimateAtCompletion',
      header: t('costManagement.profitability.colEAC'),
      cell: ({ row }) => formatMoney(row.original.estimateAtCompletion),
    },
    {
      accessorKey: 'estimateToComplete',
      header: t('costManagement.profitability.colETC'),
      cell: ({ row }) => formatMoney(row.original.estimateToComplete),
    },
    {
      accessorKey: 'forecastMargin',
      header: t('costManagement.profitability.colMargin'),
      cell: ({ row }) => (
        <span className={row.original.forecastMargin < 0 ? 'text-red-600 dark:text-red-400 font-bold' : 'text-green-600 dark:text-green-400'}>
          {formatMoney(row.original.forecastMargin)}
        </span>
      ),
    },
    {
      accessorKey: 'forecastMarginPercent',
      header: t('costManagement.profitability.colMarginPct'),
      cell: ({ row }) => (
        <span className={row.original.forecastMarginPercent < 0 ? 'text-red-600 dark:text-red-400' : ''}>
          {row.original.forecastMarginPercent.toFixed(1)}%
        </span>
      ),
    },
    {
      accessorKey: 'profitFadeAmount',
      header: t('costManagement.profitability.colProfitFade'),
      cell: ({ row }) => (
        <span className={getFadeColor(row.original.profitFadePercent)}>
          {formatMoney(row.original.profitFadeAmount)}
          <span className="text-xs ml-1">({row.original.profitFadePercent.toFixed(1)}%)</span>
        </span>
      ),
    },
    {
      accessorKey: 'completionPercent',
      header: t('costManagement.profitability.colCompletion'),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div className="w-16 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full"
              style={{ width: `${Math.min(100, row.original.completionPercent)}%` }}
            />
          </div>
          <span className="text-xs">{row.original.completionPercent.toFixed(0)}%</span>
        </div>
      ),
    },
    {
      accessorKey: 'riskLevel',
      header: t('costManagement.profitability.colRisk'),
      cell: ({ row }) => (
        <StatusBadge
          status={row.original.riskLevel}
          colorMap={riskColorMap}
          label={riskLabelFn(row.original.riskLevel)}
        />
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => { e.stopPropagation(); recalculateMutation.mutate(row.original.projectId); }}
        >
          <RefreshCw size={14} />
        </Button>
      ),
    },
  ], [recalculateMutation]);

  const snapshotColumns = useMemo<ColumnDef<ProfitabilitySnapshot>[]>(() => [
    { accessorKey: 'snapshotDate', header: t('costManagement.profitability.snapshotDate') },
    { accessorKey: 'eac', header: 'EAC', cell: ({ row }) => formatMoney(row.original.eac) },
    { accessorKey: 'etc', header: 'ETC', cell: ({ row }) => formatMoney(row.original.etc) },
    { accessorKey: 'forecastMargin', header: t('costManagement.profitability.colMargin'), cell: ({ row }) => formatMoney(row.original.forecastMargin) },
    {
      accessorKey: 'profitFadeAmount',
      header: t('costManagement.profitability.colProfitFade'),
      cell: ({ row }) => (
        <span className={row.original.profitFadeAmount > 0 ? 'text-red-600 dark:text-red-400' : ''}>
          {formatMoney(row.original.profitFadeAmount)}
        </span>
      ),
    },
    { accessorKey: 'completionPercent', header: '%', cell: ({ row }) => `${row.original.completionPercent.toFixed(0)}%` },
  ], []);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('costManagement.profitability.title')}
        subtitle={t('costManagement.profitability.subtitle')}
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as TabId)}
        actions={
          <Button
            onClick={() => recalculateAllMutation.mutate()}
            disabled={recalculateAllMutation.isPending}
          >
            <RefreshCw size={16} className={recalculateAllMutation.isPending ? 'animate-spin' : ''} />
            {t('costManagement.profitability.recalculateAll')}
          </Button>
        }
      />

      {activeTab === 'portfolio' && portfolio ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <MetricCard
              label={t('costManagement.profitability.portfolioTotalContracts')}
              value={formatMoney(portfolio.totalContractValue)}
            />
            <MetricCard
              label={t('costManagement.profitability.portfolioForecastMargin')}
              value={formatMoney(portfolio.totalForecastMargin)}
            />
            <MetricCard
              label={t('costManagement.profitability.portfolioAvgMargin')}
              value={`${portfolio.avgMarginPercent.toFixed(1)}%`}
            />
            <MetricCard
              label={t('costManagement.profitability.portfolioProfitFade')}
              value={formatMoney(portfolio.totalProfitFade)}
            />
            <MetricCard
              label={t('costManagement.profitability.portfolioAtRisk')}
              value={String(portfolio.projectsAtRisk)}
            />
            <MetricCard
              label={t('costManagement.profitability.portfolioLoss')}
              value={String(portfolio.lossProjects)}
            />
          </div>

          {portfolio.byRiskLevel && (
            <div className="grid grid-cols-4 gap-3">
              {(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as ProfitabilityRiskLevel[]).map(level => (
                <div
                  key={level}
                  className={`rounded-lg p-4 text-center ${
                    level === 'CRITICAL' ? 'bg-red-100 dark:bg-red-900/30' :
                    level === 'HIGH' ? 'bg-orange-100 dark:bg-orange-900/30' :
                    level === 'MEDIUM' ? 'bg-yellow-100 dark:bg-yellow-900/30' :
                    'bg-green-100 dark:bg-green-900/30'
                  }`}
                >
                  <div className="text-2xl font-bold">{portfolio.byRiskLevel?.[level] ?? 0}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">{riskLabelFn(level)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {forecasts.length === 0 && !forecastsLoading && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 text-center text-yellow-800 dark:text-yellow-200">
              {t('costManagement.profitability.noForecasts')}
            </div>
          )}

          <DataTable
            columns={columns}
            data={filteredForecasts}
            loading={forecastsLoading}
            onRowClick={handleRowClick}
          />

          {selectedProjectId && snapshots && snapshots.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t('costManagement.profitability.snapshotsTitle')}
              </h3>
              <DataTable
                columns={snapshotColumns}
                data={snapshots}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProfitabilityDashboardPage;
