import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ShieldAlert,
  Calendar,
  DollarSign,
  AlertTriangle,
  TrendingUp,
  Activity,
} from 'lucide-react';
import { t } from '@/i18n';
import { cn } from '@/lib/cn';
import { formatDateTime } from '@/lib/format';
import { aiApi } from '@/api/ai';
import type { RiskFactor } from '@/api/ai';
import { PageHeader } from '@/design-system/components/PageHeader';
import { MetricCard } from '@/design-system/components/MetricCard';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { Skeleton } from '@/design-system/components/Skeleton';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const getRiskLevel = (score: number): string => {
  if (score < 25) return t('ai.riskDashboard.riskLevel.low');
  if (score < 50) return t('ai.riskDashboard.riskLevel.medium');
  if (score < 75) return t('ai.riskDashboard.riskLevel.high');
  return t('ai.riskDashboard.riskLevel.critical');
};

const getRiskTrend = (score: number): { direction: 'up' | 'down' | 'neutral'; value: string } => {
  if (score < 30) return { direction: 'down', value: getRiskLevel(score) };
  if (score < 60) return { direction: 'neutral', value: getRiskLevel(score) };
  return { direction: 'up', value: getRiskLevel(score) };
};

const categoryColorMap: Record<string, string> = {
  SCHEDULE: 'blue',
  COST: 'orange',
  SAFETY: 'red',
  QUALITY: 'purple',
  RESOURCE: 'cyan',
};

const mitigationStatusColorMap: Record<string, string> = {
  NONE: 'gray',
  PLANNED: 'blue',
  IN_PROGRESS: 'yellow',
  RESOLVED: 'green',
};

// ---------------------------------------------------------------------------
// Risk Trend Chart Placeholder
// ---------------------------------------------------------------------------

const RiskTrendPlaceholder: React.FC = () => (
  <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
    <div className="flex items-center gap-2 mb-4">
      <TrendingUp size={18} className="text-primary-600" />
      <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
        {t('ai.riskDashboard.riskTrend.title')}
      </h3>
    </div>
    <div className="h-48 rounded-lg bg-neutral-50 dark:bg-neutral-800 border border-dashed border-neutral-300 dark:border-neutral-600 flex flex-col items-center justify-center gap-3">
      <Activity size={32} className="text-neutral-300 dark:text-neutral-600" />
      <p className="text-sm text-neutral-500 dark:text-neutral-400 text-center max-w-sm px-4">
        {t('ai.riskDashboard.riskTrend.description')}
      </p>
    </div>
  </div>
);

// ---------------------------------------------------------------------------
// Risk Factors Table
// ---------------------------------------------------------------------------

const RiskFactorsTable: React.FC<{ factors: RiskFactor[]; loading: boolean }> = ({
  factors,
  loading,
}) => {
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    );
  }

  if (factors.length === 0) {
    return (
      <div className="text-center py-8">
        <ShieldAlert size={32} className="mx-auto text-neutral-300 dark:text-neutral-600 mb-3" />
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          {t('ai.riskDashboard.factors.noFactors')}
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-neutral-200 dark:border-neutral-700">
            <th className="text-left py-3 px-4 text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
              {t('ai.riskDashboard.factors.name')}
            </th>
            <th className="text-left py-3 px-4 text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
              {t('ai.riskDashboard.factors.category')}
            </th>
            <th className="text-left py-3 px-4 text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
              {t('ai.riskDashboard.factors.probability')}
            </th>
            <th className="text-left py-3 px-4 text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
              {t('ai.riskDashboard.factors.impact')}
            </th>
            <th className="text-left py-3 px-4 text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
              {t('ai.riskDashboard.factors.riskScore')}
            </th>
            <th className="text-left py-3 px-4 text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
              {t('ai.riskDashboard.factors.mitigationStatus')}
            </th>
            <th className="text-left py-3 px-4 text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
              {t('ai.riskDashboard.factors.suggestedMitigation')}
            </th>
          </tr>
        </thead>
        <tbody>
          {factors.map((factor) => (
            <tr
              key={factor.id}
              className="border-b border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
            >
              <td className="py-3 px-4 text-neutral-900 dark:text-neutral-100 font-medium">
                {factor.name}
              </td>
              <td className="py-3 px-4">
                <StatusBadge
                  status={factor.category}
                  colorMap={categoryColorMap}
                  label={t(`ai.riskDashboard.category.${factor.category}`)}
                  size="sm"
                />
              </td>
              <td className="py-3 px-4 text-neutral-700 dark:text-neutral-300">
                {Math.round(factor.probability * 100)}%
              </td>
              <td className="py-3 px-4 text-neutral-700 dark:text-neutral-300">
                {Math.round(factor.impact * 100)}%
              </td>
              <td className="py-3 px-4">
                <RiskScoreBadge score={factor.riskScore} />
              </td>
              <td className="py-3 px-4">
                <StatusBadge
                  status={factor.mitigationStatus}
                  colorMap={mitigationStatusColorMap}
                  label={t(`ai.riskDashboard.mitigationStatus.${factor.mitigationStatus}`)}
                  size="sm"
                />
              </td>
              <td className="py-3 px-4 text-sm text-neutral-600 dark:text-neutral-400 max-w-xs truncate">
                {factor.suggestedMitigation}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Risk Score Badge
// ---------------------------------------------------------------------------

const RiskScoreBadge: React.FC<{ score: number }> = ({ score }) => {
  const rounded = Math.round(score);
  let color: string;
  if (rounded < 25) color = 'text-success-600';
  else if (rounded < 50) color = 'text-warning-600';
  else if (rounded < 75) color = 'text-orange-600';
  else color = 'text-danger-600';

  return <span className={cn('font-semibold text-sm', color)}>{rounded}</span>;
};

// ---------------------------------------------------------------------------
// Critical Alerts
// ---------------------------------------------------------------------------

const CriticalAlerts: React.FC<{ factors: RiskFactor[] }> = ({ factors }) => {
  const criticalFactors = factors.filter(
    (f) => f.riskScore >= 60 && f.mitigationStatus !== 'RESOLVED',
  );

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle size={18} className="text-danger-500" />
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
          {t('ai.riskDashboard.alerts.title')}
        </h3>
      </div>

      {criticalFactors.length === 0 ? (
        <p className="text-sm text-neutral-500 dark:text-neutral-400 text-center py-4">
          {t('ai.riskDashboard.alerts.noAlerts')}
        </p>
      ) : (
        <div className="space-y-3">
          {criticalFactors.slice(0, 5).map((factor) => (
            <div
              key={factor.id}
              className="flex items-start gap-3 p-3 rounded-lg border border-danger-200 dark:border-danger-800 bg-danger-50 dark:bg-danger-900/20"
            >
              <ShieldAlert size={16} className="text-danger-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                    {factor.name}
                  </span>
                  <StatusBadge
                    status={factor.category}
                    colorMap={categoryColorMap}
                    label={t(`ai.riskDashboard.category.${factor.category}`)}
                    size="sm"
                  />
                  <RiskScoreBadge score={factor.riskScore} />
                </div>
                {factor.suggestedMitigation && (
                  <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
                    <span className="font-medium">
                      {t('ai.riskDashboard.alerts.recommendedAction')}:
                    </span>{' '}
                    {factor.suggestedMitigation}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main Page Component
// ---------------------------------------------------------------------------

const AiRiskDashboardPage: React.FC = () => {
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [_timeRange, setTimeRange] = useState<string>('30');

  const projectParam = selectedProjectId || undefined;

  const { data: prediction, isLoading: predictionLoading } = useQuery({
    queryKey: ['ai', 'risk-prediction', projectParam],
    queryFn: () => aiApi.getRiskPrediction(projectParam),
  });

  const { data: factors = [], isLoading: factorsLoading } = useQuery({
    queryKey: ['ai', 'risk-factors', projectParam],
    queryFn: () => aiApi.getRiskFactors(projectParam),
  });

  return (
    <div>
      <PageHeader
        title={t('ai.riskDashboard.title')}
        subtitle={t('ai.riskDashboard.subtitle')}
        breadcrumbs={[
          { label: t('ai.riskDashboard.breadcrumbAi'), href: '/ai-assistant' },
          { label: t('ai.riskDashboard.breadcrumbRiskDashboard') },
        ]}
        actions={
          <div className="flex items-center gap-3">
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="text-sm border border-neutral-200 dark:border-neutral-700 rounded-lg px-3 py-2 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 focus:outline-none focus:ring-1 focus:ring-primary-500"
              aria-label={t('ai.riskDashboard.filters.project')}
            >
              <option value="">{t('ai.riskDashboard.filters.allProjects')}</option>
            </select>
            <select
              value={_timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="text-sm border border-neutral-200 dark:border-neutral-700 rounded-lg px-3 py-2 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 focus:outline-none focus:ring-1 focus:ring-primary-500"
              aria-label={t('ai.riskDashboard.filters.timeRange')}
            >
              <option value="7">{t('ai.riskDashboard.filters.last7Days')}</option>
              <option value="30">{t('ai.riskDashboard.filters.last30Days')}</option>
              <option value="90">{t('ai.riskDashboard.filters.last90Days')}</option>
            </select>
          </div>
        }
      />

      {/* Risk Score Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard
          icon={<ShieldAlert size={18} />}
          label={t('ai.riskDashboard.overallRisk')}
          value={predictionLoading ? '...' : prediction?.overallScore ?? '-'}
          trend={prediction ? getRiskTrend(prediction.overallScore) : undefined}
          loading={predictionLoading}
        />
        <MetricCard
          icon={<Calendar size={18} />}
          label={t('ai.riskDashboard.scheduleRisk')}
          value={predictionLoading ? '...' : prediction?.scheduleRisk ?? '-'}
          trend={prediction ? getRiskTrend(prediction.scheduleRisk) : undefined}
          loading={predictionLoading}
        />
        <MetricCard
          icon={<DollarSign size={18} />}
          label={t('ai.riskDashboard.costRisk')}
          value={predictionLoading ? '...' : prediction?.costRisk ?? '-'}
          trend={prediction ? getRiskTrend(prediction.costRisk) : undefined}
          loading={predictionLoading}
        />
        <MetricCard
          icon={<AlertTriangle size={18} />}
          label={t('ai.riskDashboard.safetyRisk')}
          value={predictionLoading ? '...' : prediction?.safetyRisk ?? '-'}
          trend={prediction ? getRiskTrend(prediction.safetyRisk) : undefined}
          loading={predictionLoading}
        />
      </div>

      {/* Prediction timestamp */}
      {prediction?.predictedAt && (
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-6">
          {t('ai.riskDashboard.predictedAt')}:{' '}
          {formatDateTime(prediction.predictedAt)}
        </p>
      )}

      {/* Risk Trend Chart + Critical Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <RiskTrendPlaceholder />
        <CriticalAlerts factors={factors} />
      </div>

      {/* Risk Factors Table */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700">
        <div className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-700">
          <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            {t('ai.riskDashboard.factors.title')}
          </h2>
        </div>
        <RiskFactorsTable factors={factors} loading={factorsLoading} />
      </div>
    </div>
  );
};

export default AiRiskDashboardPage;
