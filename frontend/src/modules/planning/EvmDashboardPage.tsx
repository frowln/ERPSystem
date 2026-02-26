import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { TrendingUp, TrendingDown, Activity, DollarSign, Target } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { MetricCard } from '@/design-system/components/MetricCard';
import { Select } from '@/design-system/components/FormField';
import { formatMoneyCompact, formatPercent } from '@/lib/format';
import { cn } from '@/lib/cn';
import { planningApi } from '@/api/planning';
import { projectsApi } from '@/api/projects';
import { t } from '@/i18n';
import type { EvmMetrics } from './types';
import type { Project, PaginatedResponse } from '@/types';

const defaultEvmMetrics: EvmMetrics = {
  projectId: '',
  projectName: '---',
  dataDate: new Date().toISOString().slice(0, 10),
  bac: 0, pv: 0, ev: 0, ac: 0,
  sv: 0, cv: 0, spi: 1, cpi: 1,
  eac: 0, etc: 0, vac: 0, tcpiEac: 1,
  percentComplete: 0,
  sCurveData: [],
};

function GaugeIndicator({ value, label, thresholds }: { value: number; label: string; thresholds: { good: number; warning: number } }) {
  const isGood = value >= thresholds.good;
  const isWarning = value >= thresholds.warning && value < thresholds.good;
  const color = isGood ? 'text-success-600' : isWarning ? 'text-warning-600' : 'text-danger-600';
  const bgColor = isGood ? 'bg-success-100' : isWarning ? 'bg-warning-100' : 'bg-danger-100';
  const ringColor = isGood ? 'ring-success-200' : isWarning ? 'ring-warning-200' : 'ring-danger-200';

  return (
    <div className="flex flex-col items-center">
      <div className={cn('w-20 h-20 rounded-full flex items-center justify-center ring-4', bgColor, ringColor)}>
        <span className={cn('text-lg font-bold tabular-nums', color)}>{value.toFixed(2)}</span>
      </div>
      <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mt-2 text-center">{label}</p>
    </div>
  );
}

function TrafficLight({ status }: { status: 'green' | 'yellow' | 'red' }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className={cn('w-3 h-3 rounded-full', status === 'red' ? 'bg-danger-500' : 'bg-neutral-200')} />
      <div className={cn('w-3 h-3 rounded-full', status === 'yellow' ? 'bg-warning-500' : 'bg-neutral-200')} />
      <div className={cn('w-3 h-3 rounded-full', status === 'green' ? 'bg-success-500' : 'bg-neutral-200')} />
    </div>
  );
}

const EvmDashboardPage: React.FC = () => {
  const [projectId, setProjectId] = useState('');

  const { data: projectsData } = useQuery<PaginatedResponse<Project>>({
    queryKey: ['projects'],
    queryFn: () => projectsApi.getProjects({ page: 0, size: 100 }),
  });

  const projectOptions = (projectsData?.content ?? []).map((p) => ({ value: p.id, label: p.name }));

  const selectedProjectId = projectId || projectOptions[0]?.value || '1';

  const { data } = useQuery<EvmMetrics>({
    queryKey: ['evm-metrics', selectedProjectId],
    queryFn: () => planningApi.getEvmMetrics(selectedProjectId),
    enabled: !!selectedProjectId,
  });

  const evm = data ?? defaultEvmMetrics;
  const scheduleStatus = evm.spi >= 0.95 ? 'green' : evm.spi >= 0.85 ? 'yellow' : 'red';
  const costStatus = evm.cpi >= 0.95 ? 'green' : evm.cpi >= 0.85 ? 'yellow' : 'red';

  const maxVal = Math.max(...evm.sCurveData.map((d) => Math.max(d.pv, d.ev, d.ac)));

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('planning.evm.title')}
        subtitle={`${t('planning.evm.subtitleProject')}: ${evm.projectName} / ${t('planning.evm.subtitleDataDate')}: ${evm.dataDate}`}
        breadcrumbs={[
          { label: t('planning.evm.breadcrumbHome'), href: '/' },
          { label: t('planning.evm.breadcrumbPlanning') },
          { label: t('planning.evm.breadcrumbEvm') },
        ]}
        actions={
          <Select
            options={projectOptions}
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            placeholder={t('planning.evm.selectProject')}
            className="w-56"
          />
        }
      />

      {/* Top metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard icon={<Target size={18} />} label={t('planning.evm.bacLabel')} value={formatMoneyCompact(evm.bac)} />
        <MetricCard icon={<DollarSign size={18} />} label={t('planning.evm.eacLabel')} value={formatMoneyCompact(evm.eac)} trend={{ direction: evm.eac <= evm.bac ? 'up' : 'down', value: formatMoneyCompact(evm.vac) }} />
        <MetricCard icon={<Activity size={18} />} label={t('planning.evm.etcLabel')} value={formatMoneyCompact(evm.etc)} />
        <MetricCard label={t('planning.evm.completionLabel')} value={formatPercent(evm.percentComplete)} />
      </div>

      {/* Gauges and traffic lights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{t('planning.evm.performanceIndices')}</h3>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs text-neutral-500 dark:text-neutral-400">{t('planning.evm.scheduleLabel')}:</span>
                <TrafficLight status={scheduleStatus} />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-neutral-500 dark:text-neutral-400">{t('planning.evm.costLabel')}:</span>
                <TrafficLight status={costStatus} />
              </div>
            </div>
          </div>
          <div className="flex items-center justify-around">
            <GaugeIndicator value={evm.spi} label={t('planning.evm.spiLabel')} thresholds={{ good: 0.95, warning: 0.85 }} />
            <GaugeIndicator value={evm.cpi} label={t('planning.evm.cpiLabel')} thresholds={{ good: 0.95, warning: 0.85 }} />
            <GaugeIndicator value={evm.tcpiEac} label={t('planning.evm.tcpiLabel')} thresholds={{ good: 0.95, warning: 1.1 }} />
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">{t('planning.evm.variances')}</h3>
          <div className="space-y-4">
            <VarianceRow
              label={t('planning.evm.svLabel')}
              value={evm.sv}
              isPositiveGood={true}
            />
            <VarianceRow
              label={t('planning.evm.cvLabel')}
              value={evm.cv}
              isPositiveGood={true}
            />
            <VarianceRow
              label={t('planning.evm.vacLabel')}
              value={evm.vac}
              isPositiveGood={true}
            />
          </div>

          <div className="mt-6 pt-4 border-t border-neutral-100 grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-0.5">{t('planning.evm.pvShort')}</p>
              <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 tabular-nums">{formatMoneyCompact(evm.pv)}</p>
            </div>
            <div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-0.5">{t('planning.evm.evShort')}</p>
              <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 tabular-nums">{formatMoneyCompact(evm.ev)}</p>
            </div>
            <div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-0.5">{t('planning.evm.acShort')}</p>
              <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 tabular-nums">{formatMoneyCompact(evm.ac)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* S-Curve chart (simplified bar visualization) */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-2">{t('planning.evm.sCurveTitle')}</h3>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-6">{t('planning.evm.sCurveSubtitle')}</p>

        {/* Legend */}
        <div className="flex items-center gap-6 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-primary-400" />
            <span className="text-xs text-neutral-600">{t('planning.evm.legendPv')}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-success-500" />
            <span className="text-xs text-neutral-600">{t('planning.evm.legendEv')}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-danger-400" />
            <span className="text-xs text-neutral-600">{t('planning.evm.legendAc')}</span>
          </div>
        </div>

        {/* Simple bar chart */}
        <div className="flex items-end gap-1 h-48">
          {evm.sCurveData.map((point, idx) => (
            <div key={idx} className="flex-1 flex items-end gap-px">
              <div
                className="flex-1 bg-primary-200 rounded-t-sm"
                style={{ height: `${(point.pv / maxVal) * 100}%` }}
                title={`PV: ${formatMoneyCompact(point.pv)}`}
              />
              <div
                className="flex-1 bg-success-400 rounded-t-sm"
                style={{ height: `${(point.ev / maxVal) * 100}%` }}
                title={`EV: ${formatMoneyCompact(point.ev)}`}
              />
              <div
                className="flex-1 bg-danger-300 rounded-t-sm"
                style={{ height: `${(point.ac / maxVal) * 100}%` }}
                title={`AC: ${formatMoneyCompact(point.ac)}`}
              />
            </div>
          ))}
        </div>
        <div className="flex gap-1 mt-1">
          {evm.sCurveData.map((point, idx) => (
            <div key={idx} className="flex-1 text-center">
              <span className="text-[10px] text-neutral-400 leading-none">{point.period.slice(0, 3)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

function VarianceRow({ label, value, isPositiveGood }: { label: string; value: number; isPositiveGood: boolean }) {
  const isPositive = value >= 0;
  const isGood = isPositiveGood ? isPositive : !isPositive;

  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-neutral-600">{label}</span>
      <div className="flex items-center gap-2">
        {isGood ? (
          <TrendingUp size={14} className="text-success-500" />
        ) : (
          <TrendingDown size={14} className="text-danger-500" />
        )}
        <span className={cn('text-sm font-semibold tabular-nums', isGood ? 'text-success-600' : 'text-danger-600')}>
          {formatMoneyCompact(value)}
        </span>
      </div>
    </div>
  );
}

export default EvmDashboardPage;
