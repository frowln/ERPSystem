import React, { useMemo } from 'react';
import { TrendingUp, TrendingDown, PieChart, BarChart3, Clock, Target } from 'lucide-react';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';
import { formatMoneyCompact, formatPercent } from '@/lib/format';
import type { CrmLead, CrmStage } from './types';

interface Props {
  leads: CrmLead[];
  stages: CrmStage[];
}

const CrmAnalyticsPanel: React.FC<Props> = ({ leads, stages }) => {
  const analytics = useMemo(() => {
    const wonLeads = leads.filter(l => l.status === 'WON');
    const lostLeads = leads.filter(l => l.status === 'LOST');
    const closedLeads = wonLeads.length + lostLeads.length;
    const winRate = closedLeads > 0 ? (wonLeads.length / closedLeads) * 100 : 0;

    // Average cycle time (days from creation to close for WON leads)
    const cycleTimes = wonLeads
      .filter(l => l.wonDate && l.createdAt)
      .map(l => {
        const created = new Date(l.createdAt).getTime();
        const won = new Date(l.wonDate!).getTime();
        return Math.round((won - created) / (1000 * 60 * 60 * 24));
      })
      .filter(d => d > 0 && d < 365);
    const avgCycleTime = cycleTimes.length > 0
      ? Math.round(cycleTimes.reduce((s, d) => s + d, 0) / cycleTimes.length)
      : 0;

    // Revenue analysis
    const wonRevenue = wonLeads.reduce((s, l) => s + (l.expectedRevenue ?? 0), 0);
    const lostRevenue = lostLeads.reduce((s, l) => s + (l.expectedRevenue ?? 0), 0);
    const pipelineRevenue = leads
      .filter(l => l.status !== 'WON' && l.status !== 'LOST')
      .reduce((s, l) => s + (l.expectedRevenue ?? 0), 0);

    // Loss reasons
    const lossReasonMap = new Map<string, number>();
    for (const l of lostLeads) {
      const reason = l.lostReason || t('crm.analytics.noReason');
      lossReasonMap.set(reason, (lossReasonMap.get(reason) ?? 0) + 1);
    }
    const topLossReasons = [...lossReasonMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    // Conversion funnel
    const statusOrder: Array<{ status: string; label: string }> = [
      { status: 'NEW', label: t('crm.analytics.funnelNew') },
      { status: 'QUALIFIED', label: t('crm.analytics.funnelQualified') },
      { status: 'PROPOSITION', label: t('crm.analytics.funnelProposition') },
      { status: 'NEGOTIATION', label: t('crm.analytics.funnelNegotiation') },
      { status: 'WON', label: t('crm.analytics.funnelWon') },
    ];
    const funnelCounts = statusOrder.map(({ status, label }) => ({
      label,
      count: leads.filter(l => l.status === status).length,
    }));
    // For conversion rate, count leads that passed through or are at each stage
    const totalEverCreated = leads.length;
    const funnel = funnelCounts.map(item => ({
      ...item,
      percent: totalEverCreated > 0 ? (item.count / totalEverCreated) * 100 : 0,
    }));

    return {
      winRate,
      avgCycleTime,
      wonRevenue,
      lostRevenue,
      pipelineRevenue,
      wonCount: wonLeads.length,
      lostCount: lostLeads.length,
      topLossReasons,
      funnel,
    };
  }, [leads]);

  const maxFunnel = Math.max(...analytics.funnel.map(f => f.count), 1);

  return (
    <div className="space-y-6">
      {/* KPI Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target size={14} className="text-green-500" />
            <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">{t('crm.analytics.winRate')}</span>
          </div>
          <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{formatPercent(analytics.winRate)}</p>
          <p className="text-xs text-neutral-400 mt-1">{analytics.wonCount}W / {analytics.lostCount}L</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock size={14} className="text-blue-500" />
            <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">{t('crm.analytics.avgCycle')}</span>
          </div>
          <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
            {analytics.avgCycleTime > 0 ? `${analytics.avgCycleTime}` : '—'}
          </p>
          <p className="text-xs text-neutral-400 mt-1">{t('crm.analytics.days')}</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={14} className="text-green-500" />
            <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">{t('crm.analytics.wonRevenue')}</span>
          </div>
          <p className="text-2xl font-bold text-green-600">{formatMoneyCompact(analytics.wonRevenue)}</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown size={14} className="text-red-500" />
            <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">{t('crm.analytics.lostRevenue')}</span>
          </div>
          <p className="text-2xl font-bold text-red-600">{formatMoneyCompact(analytics.lostRevenue)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Conversion Funnel */}
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center gap-2">
            <BarChart3 size={16} className="text-primary-500" />
            {t('crm.analytics.conversionFunnel')}
          </h3>
          <div className="space-y-3">
            {analytics.funnel.map((item, idx) => {
              const widthPct = Math.max((item.count / maxFunnel) * 100, 8);
              const isWon = idx === analytics.funnel.length - 1;
              return (
                <div key={item.label} className="flex items-center gap-3">
                  <span className="w-24 text-xs font-medium text-neutral-600 dark:text-neutral-400 flex-shrink-0">{item.label}</span>
                  <div className="flex-1 h-7 bg-neutral-100 dark:bg-neutral-800 rounded overflow-hidden">
                    <div
                      className={cn('h-full rounded flex items-center px-2', isWon ? 'bg-green-500' : 'bg-primary-400')}
                      style={{ width: `${widthPct}%` }}
                    >
                      <span className="text-xs font-bold text-white whitespace-nowrap">{item.count}</span>
                    </div>
                  </div>
                  <span className="w-12 text-xs tabular-nums text-right text-neutral-500">{formatPercent(item.percent)}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Loss Reasons */}
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center gap-2">
            <PieChart size={16} className="text-red-500" />
            {t('crm.analytics.topLossReasons')}
          </h3>
          {analytics.topLossReasons.length === 0 ? (
            <p className="text-sm text-neutral-400 dark:text-neutral-500">{t('crm.analytics.noLossData')}</p>
          ) : (
            <div className="space-y-3">
              {analytics.topLossReasons.map(([reason, count]) => {
                const maxCount = analytics.topLossReasons[0]?.[1] ?? 1;
                const pct = (count / maxCount) * 100;
                return (
                  <div key={reason}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-neutral-700 dark:text-neutral-300 truncate">{reason}</span>
                      <span className="text-xs font-bold text-neutral-500 tabular-nums ml-2">{count}</span>
                    </div>
                    <div className="h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                      <div className="h-full bg-red-400 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CrmAnalyticsPanel;
