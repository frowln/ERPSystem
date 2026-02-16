import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { DollarSign, Users, TrendingUp, Target, BarChart3, Clock, Phone, Calendar } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { MetricCard } from '@/design-system/components/MetricCard';
import {
  StatusBadge,
  crmLeadPriorityColorMap,
  crmLeadPriorityLabels,
} from '@/design-system/components/StatusBadge';
import { crmApi } from '@/api/crm';
import { formatDate, formatMoneyCompact, formatPercent } from '@/lib/format';
import { t } from '@/i18n';
import type { CrmLead, CrmStage, CrmTeam } from './types';

const CrmDashboardPage: React.FC = () => {
  const navigate = useNavigate();

  const { data: stagesData } = useQuery({
    queryKey: ['crm-stages'],
    queryFn: () => crmApi.getStages(),
  });

  const { data: teamsData } = useQuery({
    queryKey: ['crm-teams'],
    queryFn: () => crmApi.getTeams(),
  });

  const { data: leadsData } = useQuery({
    queryKey: ['crm-leads'],
    queryFn: () => crmApi.getLeads({ size: 50 }),
  });

  const stages = stagesData ?? [];
  const teams = teamsData ?? [];
  const leads = leadsData?.content ?? [];

  const metrics = useMemo(() => {
    const totalPipeline = stages.reduce((s, st) => s + st.totalRevenue, 0);
    const wonRevenue = stages.filter((st) => st.isWon).reduce((s, st) => s + st.totalRevenue, 0);
    const totalLeads = stages.reduce((s, st) => s + st.leadCount, 0);
    const avgProbability = leads.length > 0
      ? Math.round(leads.reduce((s, l) => s + (l.probability ?? 0), 0) / leads.length)
      : 0;
    return { totalPipeline, wonRevenue, totalLeads, avgProbability };
  }, [stages, leads]);

  const topLeads = useMemo(() => {
    return [...leads]
      .filter((l) => l.status !== 'LOST')
      .sort((a, b) => (b.expectedRevenue ?? 0) - (a.expectedRevenue ?? 0))
      .slice(0, 5);
  }, [leads]);

  // Pipeline funnel data
  const funnelData = useMemo(() => {
    const maxRevenue = Math.max(...stages.map((s) => s.totalRevenue), 1);
    return stages.map((stage) => ({
      ...stage,
      widthPercent: Math.max((stage.totalRevenue / maxRevenue) * 100, 10),
    }));
  }, [stages]);

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

      {/* Key metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard icon={<BarChart3 size={18} />} label={t('crm.dashboard.metricPipeline')} value={formatMoneyCompact(metrics.totalPipeline)} />
        <MetricCard icon={<DollarSign size={18} />} label={t('crm.dashboard.metricWonRevenue')} value={formatMoneyCompact(metrics.wonRevenue)} />
        <MetricCard icon={<Users size={18} />} label={t('crm.dashboard.metricTotalLeads')} value={metrics.totalLeads} />
        <MetricCard icon={<Target size={18} />} label={t('crm.dashboard.metricAvgProbability')} value={formatPercent(metrics.avgProbability)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Funnel */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                <TrendingUp size={16} className="text-primary-500" />
                {t('crm.dashboard.salesFunnel')}
              </h3>
              <Button variant="ghost" size="sm" onClick={() => navigate('/crm/leads')}>
                Pipeline
              </Button>
            </div>
            <div className="space-y-3">
              {funnelData.map((stage) => (
                <div key={stage.id} className="flex items-center gap-4">
                  <div className="w-28 flex-shrink-0">
                    <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{stage.name}</p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">{stage.leadCount} {t('crm.dashboard.leadsUnit')}</p>
                  </div>
                  <div className="flex-1">
                    <div className="h-8 bg-neutral-100 dark:bg-neutral-800 rounded-lg overflow-hidden">
                      <div
                        className={`h-full rounded-lg flex items-center px-3 ${stage.isWon ? 'bg-success-500' : 'bg-primary-500'}`}
                        style={{ width: `${stage.widthPercent}%` }}
                      >
                        <span className="text-xs font-medium text-white whitespace-nowrap">
                          {formatMoneyCompact(stage.totalRevenue)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="w-12 text-right">
                    <span className="text-xs text-neutral-500 dark:text-neutral-400 tabular-nums">{stage.probability}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top leads */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{t('crm.dashboard.topDeals')}</h3>
              <Button variant="ghost" size="sm" onClick={() => navigate('/crm/leads')}>
                {t('crm.dashboard.allLeads')}
              </Button>
            </div>
            <div className="space-y-3">
              {topLeads.map((lead) => (
                <div
                  key={lead.id}
                  className="p-4 rounded-lg border border-neutral-100 hover:bg-neutral-50 dark:hover:bg-neutral-800 cursor-pointer"
                  onClick={() => navigate(`/crm/leads/${lead.id}`)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-neutral-500 dark:text-neutral-400">{lead.number}</span>
                      <StatusBadge
                        status={lead.priority}
                        colorMap={crmLeadPriorityColorMap}
                        label={crmLeadPriorityLabels[lead.priority] ?? lead.priority}
                      />
                    </div>
                    <span className="tabular-nums text-sm font-bold text-primary-600">
                      {lead.expectedRevenue ? formatMoneyCompact(lead.expectedRevenue) : '---'}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{lead.name}</p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                    {lead.companyName ?? lead.contactName} | {lead.stageName} | {lead.assignedToName ?? t('crm.dashboard.notAssigned')}
                  </p>
                  {lead.expectedCloseDate && (
                    <p className="text-xs text-neutral-400 mt-1 flex items-center gap-1">
                      <Calendar size={12} /> {t('crm.dashboard.closing')}: {formatDate(lead.expectedCloseDate)}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Teams */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center gap-2">
              <Users size={16} className="text-primary-500" />
              {t('crm.dashboard.teams')}
            </h3>
            <div className="space-y-4">
              {teams.map((team) => (
                <div key={team.id} className="p-3 rounded-lg border border-neutral-100">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{team.name}</p>
                  </div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-2">{t('crm.dashboard.teamLead')}: {team.leadName}</p>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="text-center p-1.5 bg-neutral-50 dark:bg-neutral-800 rounded">
                      <p className="font-bold text-neutral-700 dark:text-neutral-300">{team.activeLeads}</p>
                      <p className="text-neutral-500 dark:text-neutral-400">{t('crm.dashboard.teamActive')}</p>
                    </div>
                    <div className="text-center p-1.5 bg-success-50 rounded">
                      <p className="font-bold text-success-700">{team.wonLeads}</p>
                      <p className="text-success-600">{t('crm.dashboard.teamWon')}</p>
                    </div>
                    <div className="text-center p-1.5 bg-primary-50 rounded">
                      <p className="font-bold text-primary-700 tabular-nums">{formatMoneyCompact(team.totalRevenue)}</p>
                      <p className="text-primary-600">{t('crm.dashboard.teamVolume')}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick actions */}
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
