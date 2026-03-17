import React from 'react';
import { BarChart3, Layers, Percent, Users } from 'lucide-react';
import { MetricCard } from '@/design-system/components/MetricCard';
import { t } from '@/i18n';
import type { MatrixKpi } from '../lib/matrixBuilder';

interface ClKpiStripProps {
  kpi: MatrixKpi;
}

export const ClKpiStrip: React.FC<ClKpiStripProps> = ({ kpi }) => (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
    <MetricCard
      label={t('competitiveList.matrix.kpiPositions')}
      value={kpi.totalPositions}
      icon={<Layers size={18} />}
    />
    <MetricCard
      label={t('competitiveList.matrix.kpiVendors')}
      value={kpi.totalVendors}
      icon={<Users size={18} />}
    />
    <MetricCard
      label={t('competitiveList.matrix.kpiCoverage')}
      value={`${kpi.coveragePercent}%`}
      subtitle={`${kpi.coveredCount} / ${kpi.totalPositions}`}
      icon={<BarChart3 size={18} />}
    />
    <MetricCard
      label={t('competitiveList.matrix.kpiSavings')}
      value={kpi.totalSelected > 0 ? `${kpi.savingsPercent}%` : '—'}
      icon={<Percent size={18} />}
    />
  </div>
);
