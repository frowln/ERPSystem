import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Target,
  Activity,
  BarChart3,
} from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { MetricCard } from '@/design-system/components/MetricCard';
import { Select } from '@/design-system/components/FormField';
import { formatMoneyCompact } from '@/lib/format';
import { cn } from '@/lib/cn';
import { planningApi } from './api';
import { projectsApi } from '@/api/projects';
import { t } from '@/i18n';
import type { EvmIndicators } from './types';
import type { Project, PaginatedResponse } from '@/types';

const defaultIndicators: EvmIndicators = {
  cpi: 1,
  spi: 1,
  eac: 0,
  etc: 0,
  vac: 0,
  bac: 0,
  pv: 0,
  ev: 0,
  ac: 0,
  svPercent: 0,
  cvPercent: 0,
  sCurve: [],
};

function getTrafficColor(value: number): 'green' | 'yellow' | 'red' {
  if (value >= 0.95) return 'green';
  if (value >= 0.85) return 'yellow';
  return 'red';
}

function TrafficLight({ status }: { status: 'green' | 'yellow' | 'red' }) {
  return (
    <div className="flex items-center gap-1.5">
      <div
        className={cn(
          'w-3.5 h-3.5 rounded-full border-2',
          status === 'red'
            ? 'bg-danger-500 border-danger-600'
            : 'bg-neutral-200 dark:bg-neutral-700 border-neutral-300 dark:border-neutral-600',
        )}
      />
      <div
        className={cn(
          'w-3.5 h-3.5 rounded-full border-2',
          status === 'yellow'
            ? 'bg-warning-500 border-warning-600'
            : 'bg-neutral-200 dark:bg-neutral-700 border-neutral-300 dark:border-neutral-600',
        )}
      />
      <div
        className={cn(
          'w-3.5 h-3.5 rounded-full border-2',
          status === 'green'
            ? 'bg-success-500 border-success-600'
            : 'bg-neutral-200 dark:bg-neutral-700 border-neutral-300 dark:border-neutral-600',
        )}
      />
    </div>
  );
}

function IndexGauge({
  value,
  label,
  description,
}: {
  value: number;
  label: string;
  description: string;
}) {
  const status = getTrafficColor(value);
  const colorClass =
    status === 'green'
      ? 'text-success-600 dark:text-success-400'
      : status === 'yellow'
        ? 'text-warning-600 dark:text-warning-400'
        : 'text-danger-600 dark:text-danger-400';
  const bgClass =
    status === 'green'
      ? 'bg-success-100 dark:bg-success-900/30 ring-success-200 dark:ring-success-800'
      : status === 'yellow'
        ? 'bg-warning-100 dark:bg-warning-900/30 ring-warning-200 dark:ring-warning-800'
        : 'bg-danger-100 dark:bg-danger-900/30 ring-danger-200 dark:ring-danger-800';

  return (
    <div className="flex flex-col items-center">
      <div className={cn('w-20 h-20 rounded-full flex items-center justify-center ring-4', bgClass)}>
        <span className={cn('text-lg font-bold tabular-nums', colorClass)}>
          {value.toFixed(2)}
        </span>
      </div>
      <p className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 mt-2 text-center">
        {label}
      </p>
      <p className="text-[10px] text-neutral-500 dark:text-neutral-400 text-center mt-0.5">
        {description}
      </p>
    </div>
  );
}

const EvmIndicatorsPage: React.FC = () => {
  const [projectId, setProjectId] = useState('');

  const { data: projectsData } = useQuery<PaginatedResponse<Project>>({
    queryKey: ['projects'],
    queryFn: () => projectsApi.getProjects({ page: 0, size: 100 }),
  });

  const projectOptions = (projectsData?.content ?? []).map((p) => ({
    value: p.id,
    label: p.name,
  }));

  const selectedProjectId = projectId || projectOptions[0]?.value || '';

  const { data } = useQuery<EvmIndicators>({
    queryKey: ['evm-indicators', selectedProjectId],
    queryFn: () => planningApi.getEvmIndicators(selectedProjectId),
    enabled: !!selectedProjectId,
  });

  const evm = data ?? defaultIndicators;

  const cpiStatus = getTrafficColor(evm.cpi);
  const spiStatus = getTrafficColor(evm.spi);

  // Interpretation
  const costInterpretation =
    evm.cpi >= 0.95
      ? t('planning.evmIndicators.interpretationUnderBudget')
      : evm.cpi >= 0.85
        ? t('planning.evmIndicators.interpretationNearBudget')
        : t('planning.evmIndicators.interpretationOverBudget');

  const scheduleInterpretation =
    evm.spi >= 0.95
      ? t('planning.evmIndicators.interpretationAheadSchedule')
      : evm.spi >= 0.85
        ? t('planning.evmIndicators.interpretationNearSchedule')
        : t('planning.evmIndicators.interpretationBehindSchedule');

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('planning.evmIndicators.title')}
        subtitle={t('planning.evmIndicators.subtitle')}
        breadcrumbs={[
          { label: t('planning.evmIndicators.breadcrumbHome'), href: '/' },
          { label: t('planning.evmIndicators.breadcrumbPlanning') },
          { label: t('planning.evmIndicators.breadcrumbEvmIndicators') },
        ]}
        actions={
          <Select
            options={projectOptions}
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            placeholder={t('planning.evmIndicators.selectProject')}
            className="w-56"
          />
        }
      />

      {/* Top metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        <MetricCard
          icon={<Activity size={18} />}
          label="CPI"
          value={evm.cpi.toFixed(2)}
          trend={{
            direction: evm.cpi >= 0.95 ? 'up' : 'down',
            value: cpiStatus === 'green' ? t('planning.evmIndicators.good') : t('planning.evmIndicators.attention'),
          }}
        />
        <MetricCard
          icon={<BarChart3 size={18} />}
          label="SPI"
          value={evm.spi.toFixed(2)}
          trend={{
            direction: evm.spi >= 0.95 ? 'up' : 'down',
            value: spiStatus === 'green' ? t('planning.evmIndicators.good') : t('planning.evmIndicators.attention'),
          }}
        />
        <MetricCard
          icon={<Target size={18} />}
          label="BAC"
          value={formatMoneyCompact(evm.bac)}
        />
        <MetricCard
          icon={<DollarSign size={18} />}
          label="EAC"
          value={formatMoneyCompact(evm.eac)}
        />
        <MetricCard
          label="ETC"
          value={formatMoneyCompact(evm.etc)}
        />
        <MetricCard
          label="VAC"
          value={formatMoneyCompact(evm.vac)}
          trend={{
            direction: evm.vac >= 0 ? 'up' : 'down',
            value: evm.vac >= 0 ? t('planning.evmIndicators.positive') : t('planning.evmIndicators.negative'),
          }}
        />
      </div>

      {/* Traffic lights and gauges */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              {t('planning.evmIndicators.performanceIndices')}
            </h3>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs text-neutral-500 dark:text-neutral-400">
                  {t('planning.evmIndicators.costLabel')}:
                </span>
                <TrafficLight status={cpiStatus} />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-neutral-500 dark:text-neutral-400">
                  {t('planning.evmIndicators.scheduleLabel')}:
                </span>
                <TrafficLight status={spiStatus} />
              </div>
            </div>
          </div>
          <div className="flex items-center justify-around">
            <IndexGauge
              value={evm.cpi}
              label="CPI"
              description={t('planning.evmIndicators.cpiDescription')}
            />
            <IndexGauge
              value={evm.spi}
              label="SPI"
              description={t('planning.evmIndicators.spiDescription')}
            />
          </div>
        </div>

        {/* Summary interpretation */}
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
            {t('planning.evmIndicators.summaryTitle')}
          </h3>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  'mt-0.5 w-2.5 h-2.5 rounded-full flex-shrink-0',
                  cpiStatus === 'green'
                    ? 'bg-success-500'
                    : cpiStatus === 'yellow'
                      ? 'bg-warning-500'
                      : 'bg-danger-500',
                )}
              />
              <div>
                <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  {t('planning.evmIndicators.costPerformance')}
                </p>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
                  {costInterpretation} (CV: {evm.cvPercent.toFixed(1)}%)
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  'mt-0.5 w-2.5 h-2.5 rounded-full flex-shrink-0',
                  spiStatus === 'green'
                    ? 'bg-success-500'
                    : spiStatus === 'yellow'
                      ? 'bg-warning-500'
                      : 'bg-danger-500',
                )}
              />
              <div>
                <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  {t('planning.evmIndicators.schedulePerformance')}
                </p>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
                  {scheduleInterpretation} (SV: {evm.svPercent.toFixed(1)}%)
                </p>
              </div>
            </div>

            {/* Value breakdown */}
            <div className="mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-800 grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-0.5">PV</p>
                <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 tabular-nums">
                  {formatMoneyCompact(evm.pv)}
                </p>
              </div>
              <div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-0.5">EV</p>
                <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 tabular-nums">
                  {formatMoneyCompact(evm.ev)}
                </p>
              </div>
              <div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-0.5">AC</p>
                <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 tabular-nums">
                  {formatMoneyCompact(evm.ac)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* S-Curve chart */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
          {t('planning.evmIndicators.sCurveTitle')}
        </h3>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-6">
          {t('planning.evmIndicators.sCurveSubtitle')}
        </p>

        {evm.sCurve.length > 0 ? (
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={evm.sCurve} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: '#9ca3af' }}
                tickFormatter={(val: string) => val.slice(5)}
              />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--color-neutral-50, #fafafa)',
                  borderColor: 'var(--color-neutral-200, #e5e7eb)',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="pv"
                stroke="#6366f1"
                name="PV"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="ev"
                stroke="#22c55e"
                name="EV"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="ac"
                stroke="#ef4444"
                name="AC"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-48 text-neutral-400 dark:text-neutral-500">
            {t('planning.evmIndicators.noData')}
          </div>
        )}
      </div>
    </div>
  );
};

export default EvmIndicatorsPage;
