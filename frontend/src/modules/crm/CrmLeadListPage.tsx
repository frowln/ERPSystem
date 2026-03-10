import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, TrendingUp, DollarSign, Users, Target, Trash2 } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { useConfirmDialog } from '@/design-system/components/ConfirmDialog/provider';
import { MetricCard } from '@/design-system/components/MetricCard';
import {
  StatusBadge,
  crmLeadStatusColorMap,
  crmLeadStatusLabels,
  crmLeadPriorityColorMap,
  crmLeadPriorityLabels,
} from '@/design-system/components/StatusBadge';
import { Input, Select } from '@/design-system/components/FormField';
import { PageSkeleton } from '@/design-system/components/Skeleton';
import { crmApi } from '@/api/crm';
import { formatDate, formatMoneyCompact } from '@/lib/format';
import toast from 'react-hot-toast';
import { t } from '@/i18n';
import type { CrmLead, CrmStage } from './types';
import type { PaginatedResponse } from '@/types';

const getTeamFilterOptions = () => [
  { value: '', label: t('crm.leadList.allTeams') },
  { value: 'Команда продаж А', label: t('crm.leadList.salesTeamA') },
  { value: 'Команда продаж Б', label: t('crm.leadList.salesTeamB') },
];

const CrmLeadListPage: React.FC = () => {
  const navigate = useNavigate();
  const confirm = useConfirmDialog();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [teamFilter, setTeamFilter] = useState('');
  const [viewMode, setViewMode] = useState<'pipeline' | 'list'>('pipeline');

  const deleteLeadMutation = useMutation({
    mutationFn: (id: string) => crmApi.deleteLead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-leads'] });
      toast.success(t('crm.leadList.toastDeleted'));
    },
    onError: () => {
      toast.error(t('crm.leadList.toastDeleteError'));
    },
  });

  const handleDeleteLead = async (e: React.MouseEvent, leadId: string) => {
    e.stopPropagation();
    const isConfirmed = await confirm({
      title: t('crm.leadList.confirmDeleteTitle'),
      description: t('crm.leadList.confirmDeleteDescription'),
      confirmLabel: t('crm.leadList.confirmDeleteConfirm'),
      cancelLabel: t('common.cancel'),
    });
    if (!isConfirmed) return;

    deleteLeadMutation.mutate(leadId);
  };

  const { data: leadData, isLoading } = useQuery<PaginatedResponse<CrmLead>>({
    queryKey: ['crm-leads'],
    queryFn: () => crmApi.getLeads({ size: 500 }),
  });

  const { data: stages } = useQuery<CrmStage[]>({
    queryKey: ['crm-stages'],
    queryFn: () => crmApi.getStages(),
  });

  const leads = leadData?.content ?? [];
  const stageList = stages ?? [];

  const filteredLeads = useMemo(() => {
    let filtered = leads;
    if (teamFilter) {
      filtered = filtered.filter((l) => l.teamName === teamFilter);
    }
    if (search) {
      const lower = search.toLowerCase();
      filtered = filtered.filter(
        (l) =>
          (l.number ?? '').toLowerCase().includes(lower) ||
          l.name.toLowerCase().includes(lower) ||
          (l.partnerName ?? l.contactName ?? '').toLowerCase().includes(lower) ||
          (l.companyName ?? '').toLowerCase().includes(lower),
      );
    }
    return filtered;
  }, [leads, teamFilter, search]);

  const metrics = useMemo(() => {
    const totalRevenue = leads.reduce((s, l) => s + (l.expectedRevenue ?? 0), 0);
    const wonRevenue = leads.filter((l) => l.status === 'WON').reduce((s, l) => s + (l.expectedRevenue ?? 0), 0);
    const activeLeads = leads.filter((l) => ![ 'WON', 'LOST'].includes(l.status)).length;
    const conversionRate = leads.length > 0
      ? Math.round((leads.filter((l) => l.status === 'WON').length / leads.length) * 100)
      : 0;
    return { total: leads.length, totalRevenue, wonRevenue, activeLeads, conversionRate };
  }, [leads]);

  const pipelineStages = useMemo(() => {
    // Map lead status to stage name for fallback grouping
    const statusToStageName: Record<string, string> = {};
    for (const stage of stageList) {
      if (stage.isWon) statusToStageName['WON'] = stage.name;
      if (stage.isClosed && !stage.isWon) statusToStageName['LOST'] = stage.name;
    }
    return stageList.map((stage) => {
      const stageLeads = filteredLeads.filter((l) => {
        // Primary: match by stageId or stageName
        if (l.stageId === stage.id || l.stageName === stage.name) return true;
        // Fallback: match WON/LOST status to the correct stage
        const mappedStageName = statusToStageName[l.status];
        if (mappedStageName === stage.name) return true;
        return false;
      });
      return {
        ...stage,
        leads: stageLeads,
        stageRevenue: stageLeads.reduce((s, l) => s + (l.expectedRevenue ?? 0), 0),
      };
    });
  }, [stageList, filteredLeads]);

  const handleLeadClick = useCallback(
    (leadId: string) => navigate(`/crm/leads/${leadId}`),
    [navigate],
  );

  if (isLoading && leads.length === 0) {
    return <PageSkeleton variant="list" />;
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('crm.leadList.title')}
        subtitle={`${leads.length} ${t('crm.leadList.leadsCount')}`}
        breadcrumbs={[
          { label: t('crm.leadList.breadcrumbHome'), href: '/' },
          { label: t('crm.leadList.breadcrumbCrm') },
          { label: t('crm.leadList.breadcrumbLeads') },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border border-neutral-200 dark:border-neutral-700 overflow-hidden">
              <button
                className={`px-3 py-1.5 text-xs font-medium ${viewMode === 'pipeline' ? 'bg-primary-50 text-primary-700' : 'bg-white dark:bg-neutral-900 text-neutral-600 hover:bg-neutral-50 dark:hover:bg-neutral-800'}`}
                onClick={() => setViewMode('pipeline')}
              >
                {t('crm.leadList.viewPipeline')}
              </button>
              <button
                className={`px-3 py-1.5 text-xs font-medium border-l border-neutral-200 dark:border-neutral-700 ${viewMode === 'list' ? 'bg-primary-50 text-primary-700' : 'bg-white dark:bg-neutral-900 text-neutral-600 hover:bg-neutral-50 dark:hover:bg-neutral-800'}`}
                onClick={() => setViewMode('list')}
              >
                {t('crm.leadList.viewList')}
              </button>
            </div>
            <Button iconLeft={<Plus size={16} />} onClick={() => navigate('/crm/leads/new')}>
              {t('crm.leadList.newLead')}
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard icon={<Users size={18} />} label={t('crm.leadList.metricTotal')} value={metrics.total} />
        <MetricCard icon={<Target size={18} />} label={t('crm.leadList.metricActive')} value={metrics.activeLeads} />
        <MetricCard icon={<DollarSign size={18} />} label={t('crm.leadList.metricWonRevenue')} value={formatMoneyCompact(metrics.wonRevenue)} />
        <MetricCard icon={<TrendingUp size={18} />} label={t('crm.leadList.metricConversion')} value={`${metrics.conversionRate}%`} />
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input
            placeholder={t('crm.leadList.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          options={getTeamFilterOptions()}
          value={teamFilter}
          onChange={(e) => setTeamFilter(e.target.value)}
          className="w-52"
        />
      </div>

      {viewMode === 'pipeline' ? (
        /* Pipeline / Kanban view */
        <div className="flex gap-4 overflow-x-auto pb-4">
          {pipelineStages.map((stage) => (
            <div key={stage.id} className="min-w-[280px] max-w-[300px] flex-shrink-0">
              <div className="bg-neutral-100 dark:bg-neutral-800 rounded-xl p-3">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{stage.name}</h3>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                      {stage.leads.length} {t('crm.leadList.leadsCount')} | {formatMoneyCompact(stage.stageRevenue)}
                    </p>
                  </div>
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-neutral-200 text-xs font-bold text-neutral-700 dark:text-neutral-300">
                    {stage.leads.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {stage.leads.map((lead) => (
                    <div
                      key={lead.id}
                      className="bg-white dark:bg-neutral-900 rounded-lg p-3 border border-neutral-200 dark:border-neutral-700 hover:shadow-md cursor-pointer transition-shadow"
                      onClick={() => handleLeadClick(lead.id)}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-mono text-xs text-neutral-400">{lead.number}</span>
                        <div className="flex items-center gap-1">
                          <StatusBadge
                            status={lead.priority}
                            colorMap={crmLeadPriorityColorMap}
                            label={lead.priorityDisplayName ?? crmLeadPriorityLabels[lead.priority] ?? lead.priority}
                          />
                          <button
                            onClick={(e) => handleDeleteLead(e, lead.id)}
                            className="p-1 text-neutral-300 hover:text-danger-600 hover:bg-danger-50 rounded transition-colors"
                            title={t('common.delete')}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                      <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 mb-1 line-clamp-2">{lead.name}</p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-2">{lead.companyName ?? lead.contactName}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-primary-600 tabular-nums">
                          {lead.expectedRevenue ? formatMoneyCompact(lead.expectedRevenue) : '---'}
                        </span>
                        {lead.expectedCloseDate && (
                          <span className="text-xs text-neutral-400 tabular-nums">{formatDate(lead.expectedCloseDate)}</span>
                        )}
                      </div>
                      {lead.assignedToName && (
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1.5 border-t border-neutral-100 pt-1.5">
                          {lead.assignedToName}
                        </p>
                      )}
                    </div>
                  ))}
                  {stage.leads.length === 0 && (
                    <div className="text-center py-6">
                      <p className="text-xs text-neutral-400">{t('crm.leadList.noLeads')}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* List / Table view */
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-neutral-50 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700">
                <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600">#</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600">{t('crm.leadList.colLead')}</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600">{t('crm.leadList.colStage')}</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600">{t('crm.leadList.colPriority')}</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600">{t('crm.leadList.colRevenue')}</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600">{t('crm.leadList.colProbability')}</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600">{t('crm.leadList.colAssignee')}</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600">{t('crm.leadList.colCloseDate')}</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600"></th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.map((lead) => (
                <tr
                  key={lead.id}
                  className="border-b border-neutral-100 hover:bg-neutral-50 dark:hover:bg-neutral-800 cursor-pointer"
                  onClick={() => handleLeadClick(lead.id)}
                >
                  <td className="px-4 py-3 font-mono text-xs text-neutral-500 dark:text-neutral-400">{lead.number}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-neutral-900 dark:text-neutral-100 truncate max-w-[250px]">{lead.name}</p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{lead.companyName ?? lead.contactName}</p>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge
                      status={lead.status}
                      colorMap={crmLeadStatusColorMap}
                      label={lead.stageName ?? lead.statusDisplayName ?? crmLeadStatusLabels[lead.status] ?? lead.status}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge
                      status={lead.priority}
                      colorMap={crmLeadPriorityColorMap}
                      label={lead.priorityDisplayName ?? crmLeadPriorityLabels[lead.priority] ?? lead.priority}
                    />
                  </td>
                  <td className="px-4 py-3 tabular-nums text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    {lead.expectedRevenue ? formatMoneyCompact(lead.expectedRevenue) : '---'}
                  </td>
                  <td className="px-4 py-3 tabular-nums text-sm text-neutral-700 dark:text-neutral-300">
                    {lead.probability != null ? `${lead.probability}%` : '---'}
                  </td>
                  <td className="px-4 py-3 text-neutral-700 dark:text-neutral-300">{lead.assignedToName ?? '---'}</td>
                  <td className="px-4 py-3 tabular-nums text-xs text-neutral-600">{formatDate(lead.expectedCloseDate)}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={(e) => handleDeleteLead(e, lead.id)}
                      className="p-1.5 text-neutral-400 hover:text-danger-600 hover:bg-danger-50 rounded-md transition-colors"
                      title={t('common.delete')}
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredLeads.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-neutral-500 dark:text-neutral-400">{t('crm.leadList.noLeads')}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default CrmLeadListPage;
