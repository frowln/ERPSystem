import React from 'react';
import { Award, ListChecks, ShoppingCart, Users } from 'lucide-react';
import { MetricCard } from '@/design-system/components/MetricCard';
import { formatMoneyCompact } from '@/lib/format';
import { t } from '@/i18n';
import type { SummaryData } from './ClTypes';

interface ClSummaryMetricsProps {
  summary: SummaryData;
}

export const ClSummaryMetrics: React.FC<ClSummaryMetricsProps> = ({ summary }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
    <MetricCard
      icon={<ListChecks size={18} />}
      label={t('competitiveList.colPositions')}
      value={String(summary.totalPositions)}
    />
    <MetricCard
      icon={<Users size={18} />}
      label={t('competitiveList.detail.proposals')}
      value={String(summary.totalProposals)}
      subtitle={`${summary.decidedCount} ${t('competitiveList.detail.winner').toLowerCase()}`}
    />
    <MetricCard
      icon={<ShoppingCart size={18} />}
      label={t('competitiveList.detail.bestPrice')}
      value={formatMoneyCompact(summary.totalBestPrice)}
    />
    <MetricCard
      icon={<Award size={18} />}
      label={summary.savings < 0 ? t('competitiveList.detail.overrun', { defaultValue: 'Перерасход' }) : t('competitiveList.detail.savings')}
      value={summary.savings === 0 && summary.coveredPositions === 0 ? '—' : formatMoneyCompact(Math.abs(summary.savings))}
      subtitle={t('competitiveList.detail.savingsCoverage', {
        covered: String(summary.coveredPositions),
        total: String(summary.totalPositions),
        percent: summary.coveragePercent.toFixed(0),
        savingsPercent: Math.abs(summary.savingsPercent).toFixed(1),
      })}
    />
  </div>
);
