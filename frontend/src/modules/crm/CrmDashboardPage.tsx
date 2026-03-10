import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  DollarSign, Users, TrendingUp, Target, BarChart3, Clock,
  Phone, Calendar, ArrowRight, Zap, AlertTriangle, PieChart,
  Award, ChevronRight, ArrowUpRight, ArrowDownRight,
} from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { MetricCard } from '@/design-system/components/MetricCard';
import {
  StatusBadge,
  crmLeadPriorityColorMap,
  crmLeadPriorityLabels,
  crmLeadStatusColorMap,
  crmLeadStatusLabels,
} from '@/design-system/components/StatusBadge';
import { crmApi } from '@/api/crm';
import { formatDate, formatMoneyCompact, formatPercent } from '@/lib/format';
import { t } from '@/i18n';
import type { CrmLead } from './types';

/* ─── Color palette for source chart ─── */
const SOURCE_COLORS = [
  'bg-primary-500', 'bg-amber-500', 'bg-emerald-500', 'bg-violet-500',
  'bg-rose-500', 'bg-cyan-500', 'bg-orange-500', 'bg-indigo-500',
];

const CrmDashboardPage: React.FC = () => {
  const navigate = useNavigate();

  const { data: stagesData } = useQuery({
    queryKey: ['crm-stages'],
    queryFn: () => crmApi.getStages(),
  });

  const { data: pipelineData } = useQuery({
    queryKey: ['crm-pipeline'],
    queryFn: () => crmApi.getPipeline(),
  });

  const { data: leadsData } = useQuery({
    queryKey: ['crm-leads-dashboard'],
    queryFn: () => crmApi.getLeads({ size: 500 }),
  });

  const stages = stagesData ?? [];
  const leads = (leadsData?.content ?? []) as CrmLead[];
  const pipeline = pipelineData;

  /* ─── KPI Metrics ─── */
  const metrics = useMemo(() => {
    const totalPipeline = pipeline?.pipelineRevenue ?? 0;
    const weightedPipeline = pipeline?.weightedPipelineRevenue ?? 0;
    const wonRevenue = pipeline?.wonRevenue ?? 0;
    const totalLeads = pipeline?.totalLeads ?? leads.length;
    const wonLeads = pipeline?.wonLeads ?? leads.filter(l => l.status === 'WON').length;
    const lostLeads = pipeline?.lostLeads ?? leads.filter(l => l.status === 'LOST').length;
    const openLeads = pipeline?.openLeads ?? leads.filter(l => l.open !== false && l.status !== 'WON' && l.status !== 'LOST').length;
    const closedLeads = wonLeads + lostLeads;
    const winRate = closedLeads > 0 ? Math.round((wonLeads / closedLeads) * 100) : 0;
    const avgDeal = wonLeads > 0 ? Math.round(wonRevenue / wonLeads) : 0;
    const avgProbability = leads.length > 0
      ? Math.round(leads.reduce((s, l) => s + (l.probability ?? 0), 0) / leads.length)
      : 0;
    return {
      totalPipeline, weightedPipeline, wonRevenue, totalLeads,
      wonLeads, lostLeads, openLeads, winRate, avgDeal, avgProbability,
    };
  }, [pipeline, leads]);

  /* ─── Top Deals ─── */
  const topLeads = useMemo(() => {
    return [...leads]
      .filter(l => l.status !== 'LOST')
      .sort((a, b) => (b.expectedRevenue ?? 0) - (a.expectedRevenue ?? 0))
      .slice(0, 7);
  }, [leads]);

  /* ─── Upcoming Closings (within 30 days) ─── */
  const upcomingClosings = useMemo(() => {
    const now = new Date();
    const in30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    return [...leads]
      .filter(l => l.expectedCloseDate && l.status !== 'WON' && l.status !== 'LOST')
      .filter(l => {
        const d = new Date(l.expectedCloseDate!);
        return d >= now && d <= in30;
      })
      .sort((a, b) => new Date(a.expectedCloseDate!).getTime() - new Date(b.expectedCloseDate!).getTime())
      .slice(0, 5);
  }, [leads]);

  /* ─── Lead Sources ─── */
  const sourceData = useMemo(() => {
    const counts: Record<string, number> = {};
    leads.forEach(l => {
      const src = l.source || t('crm.dashboard.sourceUnknown');
      counts[src] = (counts[src] ?? 0) + 1;
    });
    const total = leads.length || 1;
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, count], i) => ({
        name,
        count,
        percent: Math.round((count / total) * 100),
        color: SOURCE_COLORS[i % SOURCE_COLORS.length],
      }));
  }, [leads]);

  /* ─── Funnel with conversion rates ─── */
  const funnelData = useMemo(() => {
    const maxRevenue = Math.max(...stages.map(s => s.totalRevenue ?? 0), 1);
    const openStages = stages.filter(s => !s.won && !s.closed);
    return stages.map((stage, idx) => {
      const prevStage = idx > 0 ? stages[idx - 1] : null;
      const prevCount = prevStage?.leadCount ?? 0;
      const curCount = stage.leadCount ?? 0;
      const conversion = prevCount > 0 ? Math.round((curCount / prevCount) * 100) : null;
      return {
        ...stage,
        leadCount: curCount,
        totalRevenue: stage.totalRevenue ?? 0,
        widthPercent: Math.max(((stage.totalRevenue ?? 0) / maxRevenue) * 100, 8),
        conversion,
        barColor: stage.won
          ? 'bg-success-500'
          : stage.closed
            ? 'bg-danger-400'
            : 'bg-primary-500',
      };
    });
  }, [stages]);

  /* ─── Loss Reasons ─── */
  const lossReasons = useMemo(() => {
    const counts: Record<string, number> = {};
    leads.filter(l => l.status === 'LOST' && l.lostReason).forEach(l => {
      counts[l.lostReason!] = (counts[l.lostReason!] ?? 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([reason, count]) => ({ reason, count }));
  }, [leads]);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('crm.dashboard.title')}
        subtitle={t('crm.dashboard.subtitle')}
        breadcrumbs={[
          { label: t('crm.dashboard.breadcrumbHome'), href: '/' },
          { label: t('crm.dashboard.breadcrumbCrm') },
          { label: t('crm.dashboard.breadcrumbDashboard') },
        ]}
        actions={
          <Button iconLeft={<Phone size={16} />} onClick={() => navigate('/crm/leads/new')}>
            {t('crm.dashboard.newLead')}
          </Button>
        }
      />

      {/* ── KPI Row: 6 metrics ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <MetricCard icon={<BarChart3 size={18} />} label={t('crm.dashboard.metricPipeline')} value={formatMoneyCompact(metrics.totalPipeline)} />
        <MetricCard icon={<Zap size={18} />} label={t('crm.dashboard.metricWeighted')} value={formatMoneyCompact(metrics.weightedPipeline)} />
        <MetricCard icon={<DollarSign size={18} />} label={t('crm.dashboard.metricWonRevenue')} value={formatMoneyCompact(metrics.wonRevenue)} />
        <MetricCard icon={<Users size={18} />} label={t('crm.dashboard.metricTotalLeads')} value={String(metrics.totalLeads)} />
        <MetricCard icon={<Award size={18} />} label={t('crm.dashboard.metricWinRate')} value={`${metrics.winRate}%`} />
        <MetricCard icon={<Target size={18} />} label={t('crm.dashboard.metricAvgDeal')} value={formatMoneyCompact(metrics.avgDeal)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Main Content (2/3) ── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Sales Funnel with conversion rates */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                <TrendingUp size={16} className="text-primary-500" />
                {t('crm.dashboard.salesFunnel')}
              </h3>
              <Button variant="ghost" size="sm" onClick={() => navigate('/crm/leads')}>
                {t('crm.dashboard.quickPipeline')}
              </Button>
            </div>
            <div className="space-y-2">
              {funnelData.map((stage, idx) => (
                <div key={stage.id}>
                  {/* Conversion arrow between stages */}
                  {stage.conversion !== null && idx > 0 && (
                    <div className="flex items-center gap-4 py-1">
                      <div className="w-28" />
                      <div className="flex items-center gap-1.5 text-xs text-neutral-400 dark:text-neutral-500">
                        <ArrowRight size={12} />
                        <span className="tabular-nums">{stage.conversion}%</span>
                        <span>{t('crm.dashboard.conversionLabel')}</span>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-4">
                    <div className="w-28 flex-shrink-0">
                      <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{stage.name}</p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 tabular-nums">
                        {stage.leadCount} {t('crm.dashboard.leadsUnit')}
                      </p>
                    </div>
                    <div className="flex-1">
                      <div className="h-9 bg-neutral-100 dark:bg-neutral-800 rounded-lg overflow-hidden">
                        <div
                          className={`h-full rounded-lg flex items-center px-3 transition-all duration-500 ${stage.barColor}`}
                          style={{ width: `${stage.widthPercent}%` }}
                        >
                          <span className="text-xs font-semibold text-white whitespace-nowrap drop-shadow-sm">
                            {formatMoneyCompact(stage.totalRevenue)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="w-12 text-right">
                      <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400 tabular-nums">{stage.probability}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Deals */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{t('crm.dashboard.topDeals')}</h3>
              <Button variant="ghost" size="sm" onClick={() => navigate('/crm/leads')}>
                {t('crm.dashboard.allLeads')}
              </Button>
            </div>
            <div className="space-y-2">
              {topLeads.map((lead, idx) => (
                <div
                  key={lead.id}
                  className="flex items-center gap-4 p-3 rounded-lg border border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800 cursor-pointer transition-colors group"
                  onClick={() => navigate(`/crm/leads/${lead.id}`)}
                >
                  <span className="w-6 h-6 rounded-full bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 text-xs font-bold flex items-center justify-center flex-shrink-0">
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-mono text-[11px] text-neutral-400">{lead.number}</span>
                      <StatusBadge
                        status={lead.priority}
                        colorMap={crmLeadPriorityColorMap}
                        label={lead.priorityDisplayName ?? crmLeadPriorityLabels[lead.priority] ?? lead.priority}
                      />
                    </div>
                    <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">{lead.name}</p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 truncate">
                      {lead.companyName ?? lead.contactName} · {lead.stageName} · {lead.assignedToName ?? t('crm.dashboard.notAssigned')}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="tabular-nums text-sm font-bold text-primary-600 dark:text-primary-400">
                      {lead.expectedRevenue ? formatMoneyCompact(lead.expectedRevenue) : '---'}
                    </p>
                    {lead.expectedCloseDate && (
                      <p className="text-[11px] text-neutral-400 mt-0.5 flex items-center gap-1 justify-end">
                        <Calendar size={10} /> {formatDate(lead.expectedCloseDate)}
                      </p>
                    )}
                  </div>
                  <ChevronRight size={14} className="text-neutral-300 dark:text-neutral-600 group-hover:text-primary-500 transition-colors flex-shrink-0" />
                </div>
              ))}
              {topLeads.length === 0 && (
                <p className="text-sm text-neutral-400 text-center py-6">{t('crm.dashboard.noDeals')}</p>
              )}
            </div>
          </div>
        </div>

        {/* ── Sidebar (1/3) ── */}
        <div className="space-y-6">

          {/* Pipeline Summary Card */}
          {pipeline && (
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center gap-2">
                <BarChart3 size={16} className="text-primary-500" />
                {t('crm.dashboard.pipelineSummary')}
              </h3>
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
                  <p className="text-xl font-bold text-primary-700 dark:text-primary-400 tabular-nums">{metrics.openLeads}</p>
                  <p className="text-[11px] text-primary-600 dark:text-primary-500 mt-0.5">{t('crm.dashboard.teamActive')}</p>
                </div>
                <div className="text-center p-3 bg-success-50 dark:bg-success-900/20 rounded-lg">
                  <p className="text-xl font-bold text-success-700 dark:text-success-400 tabular-nums">{metrics.wonLeads}</p>
                  <p className="text-[11px] text-success-600 dark:text-success-500 mt-0.5">{t('crm.dashboard.teamWon')}</p>
                </div>
                <div className="text-center p-3 bg-danger-50 dark:bg-danger-900/20 rounded-lg">
                  <p className="text-xl font-bold text-danger-700 dark:text-danger-400 tabular-nums">{metrics.lostLeads}</p>
                  <p className="text-[11px] text-danger-600 dark:text-danger-500 mt-0.5">{t('crm.dashboard.teamLost')}</p>
                </div>
              </div>
              {/* Win Rate Bar */}
              <div className="mt-4">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-neutral-600 dark:text-neutral-400">{t('crm.dashboard.metricWinRate')}</span>
                  <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100 tabular-nums">{metrics.winRate}%</span>
                </div>
                <div className="h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-success-500 rounded-full transition-all duration-700"
                    style={{ width: `${metrics.winRate}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Lead Sources */}
          {sourceData.length > 0 && (
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center gap-2">
                <PieChart size={16} className="text-primary-500" />
                {t('crm.dashboard.leadSources')}
              </h3>
              <div className="space-y-2.5">
                {sourceData.map((src) => (
                  <div key={src.name} className="flex items-center gap-3">
                    <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${src.color}`} />
                    <span className="text-sm text-neutral-700 dark:text-neutral-300 flex-1 truncate">{src.name}</span>
                    <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400 tabular-nums">{src.count}</span>
                    <span className="text-xs text-neutral-400 tabular-nums w-8 text-right">{src.percent}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upcoming Closings */}
          {upcomingClosings.length > 0 && (
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center gap-2">
                <Calendar size={16} className="text-amber-500" />
                {t('crm.dashboard.upcomingClosings')}
              </h3>
              <div className="space-y-2.5">
                {upcomingClosings.map((lead) => (
                  <div
                    key={lead.id}
                    className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 cursor-pointer transition-colors"
                    onClick={() => navigate(`/crm/leads/${lead.id}`)}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">{lead.name}</p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 tabular-nums">
                        {formatMoneyCompact(lead.expectedRevenue ?? 0)} · {lead.stageName}
                      </p>
                    </div>
                    <span className="text-xs font-medium text-amber-600 dark:text-amber-400 tabular-nums whitespace-nowrap">
                      {formatDate(lead.expectedCloseDate!)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Loss Reasons */}
          {lossReasons.length > 0 && (
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center gap-2">
                <AlertTriangle size={16} className="text-danger-500" />
                {t('crm.dashboard.lossReasons')}
              </h3>
              <div className="space-y-2">
                {lossReasons.map((item) => (
                  <div key={item.reason} className="flex items-center gap-3">
                    <span className="text-sm text-neutral-700 dark:text-neutral-300 flex-1 truncate">{item.reason}</span>
                    <span className="text-xs font-bold text-danger-600 tabular-nums bg-danger-50 dark:bg-danger-900/30 px-2 py-0.5 rounded-full">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center gap-2">
              <Clock size={16} className="text-primary-500" />
              {t('crm.dashboard.quickActions')}
            </h3>
            <div className="space-y-2">
              <Button variant="secondary" size="sm" className="w-full justify-start" onClick={() => navigate('/crm/leads')}>
                {t('crm.dashboard.quickPipeline')}
              </Button>
              <Button variant="secondary" size="sm" className="w-full justify-start" onClick={() => navigate('/crm/leads/new')}>
                {t('crm.dashboard.newLead')}
              </Button>
              <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => navigate('/crm/leads?view=list')}>
                {t('crm.dashboard.quickAllLeadsList')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CrmDashboardPage;
