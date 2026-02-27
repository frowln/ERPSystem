import React, { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { crmApi } from '@/api/crm';
import toast from 'react-hot-toast';
import {
  User,
  Calendar,
  DollarSign,
  Mail,
  Phone,
  Building2,
  FileText,
  ArrowRight,
  Clock,
  Activity,
  CheckCircle,
  HardHat,
  ExternalLink,
} from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { Modal } from '@/design-system/components/Modal';
import {
  StatusBadge,
  crmLeadStatusColorMap,
  crmLeadStatusLabels,
  crmLeadPriorityColorMap,
  crmLeadPriorityLabels,
} from '@/design-system/components/StatusBadge';
import { MetricCard } from '@/design-system/components/MetricCard';
import { formatDateLong, formatMoney, formatMoneyCompact, formatPercent } from '@/lib/format';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';
import type { CrmLead, CrmActivity as CrmActivityType } from './types';

const getStageFlow = () => [
  { status: 'NEW', label: t('crm.detail.stageNew') },
  { status: 'QUALIFIED', label: t('crm.detail.stageQualified') },
  { status: 'PROPOSITION', label: t('crm.detail.stageProposition') },
  { status: 'NEGOTIATION', label: t('crm.detail.stageNegotiation') },
  { status: 'WON', label: t('crm.detail.stageWon') },
];

const getActivityTypeLabels = (): Record<string, string> => ({
  call: t('crm.detail.activityCall'), email: 'Email', meeting: t('crm.detail.activityMeeting'), note: t('crm.detail.activityNote'), task: t('crm.detail.activityTask'), presentation: t('crm.detail.activityPresentation'),
});

const activityTypeIcons: Record<string, string> = {
  call: 'text-green-500', email: 'text-blue-500', meeting: 'text-purple-500',
  note: 'text-neutral-500 dark:text-neutral-400', task: 'text-orange-500', presentation: 'text-cyan-500',
};

const CrmLeadDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [convertOpen, setConvertOpen] = useState(false);
  const [convertForm, setConvertForm] = useState({ projectName: '', projectCode: '' });

  const statusMutation = useMutation({
    mutationFn: ({ leadId, status }: { leadId: string; status: string }) =>
      crmApi.updateLead(leadId, { status } as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-lead', id] });
      queryClient.invalidateQueries({ queryKey: ['crm-leads'] });
    },
  });

  const convertMutation = useMutation({
    mutationFn: () => crmApi.convertToProject(id!, {
      projectName: convertForm.projectName,
      projectCode: convertForm.projectCode,
    }),
    onSuccess: (updatedLead) => {
      queryClient.invalidateQueries({ queryKey: ['crm-lead', id] });
      queryClient.invalidateQueries({ queryKey: ['crm-leads'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success(t('crm.detail.convertSuccess'));
      setConvertOpen(false);
      if (updatedLead.projectId) {
        navigate(`/projects/${updatedLead.projectId}`);
      }
    },
    onError: () => toast.error(t('crm.detail.convertError')),
  });

  const { data: lead, isLoading: isLeadLoading } = useQuery<CrmLead>({
    queryKey: ['crm-lead', id],
    queryFn: () => crmApi.getLead(id!),
    enabled: !!id,
  });

  const { data: activities } = useQuery<CrmActivityType[]>({
    queryKey: ['crm-lead-activities', id],
    queryFn: () => crmApi.getActivities(id!),
    enabled: !!id,
  });

  const activityList = activities ?? [];

  if (isLeadLoading || !lead) {
    return (
      <div className="animate-fade-in flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-neutral-500 dark:text-neutral-400">{t('crm.detail.loading')}</p>
        </div>
      </div>
    );
  }

  const l = lead;

  const statusActions = useMemo(() => {
    switch (l.status) {
      case 'NEW': return [{ label: t('crm.detail.actionQualify'), targetStatus: 'QUALIFIED' }];
      case 'QUALIFIED': return [
        { label: t('crm.detail.actionPrepareProposal'), targetStatus: 'PROPOSITION' },
        { label: t('crm.detail.actionLost'), targetStatus: 'LOST' },
      ];
      case 'PROPOSITION': return [
        { label: t('crm.detail.actionGoToNegotiation'), targetStatus: 'NEGOTIATION' },
        { label: t('crm.detail.actionLost'), targetStatus: 'LOST' },
      ];
      case 'NEGOTIATION': return [
        { label: t('crm.detail.actionWon'), targetStatus: 'WON' },
        { label: t('crm.detail.actionLost'), targetStatus: 'LOST' },
      ];
      default: return [];
    }
  }, [l.status]);

  const stageFlow = getStageFlow();
  const activityTypeLabels = getActivityTypeLabels();
  const currentStepIndex = stageFlow.findIndex((s) => s.status === l.status);

  const pendingActivities = activityList.filter((a) => !a.isDone);
  const completedActivities = activityList.filter((a) => a.isDone);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={l.name}
        subtitle={`${l.number ?? l.id.slice(0, 8)} / ${l.companyName ?? l.partnerName ?? l.contactName ?? ''}`}
        backTo="/crm/leads"
        breadcrumbs={[
          { label: t('crm.detail.breadcrumbHome'), href: '/' },
          { label: t('crm.detail.breadcrumbCrm'), href: '/crm/leads' },
          { label: l.number ?? l.name },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <StatusBadge
              status={l.status}
              colorMap={crmLeadStatusColorMap}
              label={crmLeadStatusLabels[l.status] ?? l.status}
              size="md"
            />
            <StatusBadge
              status={l.priority}
              colorMap={crmLeadPriorityColorMap}
              label={crmLeadPriorityLabels[l.priority] ?? l.priority}
              size="md"
            />
            {statusActions.map((action) => (
              <Button
                key={action.targetStatus}
                variant={action.targetStatus === 'WON' ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => statusMutation.mutate({ leadId: id!, status: action.targetStatus })}
              >
                {action.label}
              </Button>
            ))}
          </div>
        }
      />

      {/* Stage flow */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-6">
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">{t('crm.detail.salesPipeline')}</h3>
        <div className="flex items-center gap-2">
          {stageFlow.map((step, idx) => {
            const isCompleted = idx < currentStepIndex;
            const isCurrent = idx === currentStepIndex;
            return (
              <React.Fragment key={step.status}>
                <div
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium',
                    isCompleted && 'bg-success-50 text-success-700',
                    isCurrent && 'bg-primary-50 text-primary-700 ring-2 ring-primary-200',
                    !isCompleted && !isCurrent && 'bg-neutral-50 dark:bg-neutral-800 text-neutral-400',
                  )}
                >
                  <span className={cn(
                    'w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold',
                    isCompleted && 'bg-success-500 text-white',
                    isCurrent && 'bg-primary-500 text-white',
                    !isCompleted && !isCurrent && 'bg-neutral-200 text-neutral-400',
                  )}>
                    {idx + 1}
                  </span>
                  {step.label}
                </div>
                {idx < stageFlow.length - 1 && (
                  <ArrowRight size={16} className="text-neutral-300 flex-shrink-0" />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard icon={<DollarSign size={18} />} label={t('crm.detail.metricExpectedRevenue')} value={l.expectedRevenue ? formatMoneyCompact(l.expectedRevenue) : '---'} />
        <MetricCard icon={<Activity size={18} />} label={t('crm.detail.metricProbability')} value={l.probability != null ? formatPercent(l.probability) : '---'} />
        <MetricCard icon={<Clock size={18} />} label={t('crm.detail.metricActivities')} value={l.activityCount ?? 0} />
        <MetricCard icon={<Calendar size={18} />} label={t('crm.detail.metricCloseDate')} value={formatDateLong(l.expectedCloseDate)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center gap-2">
              <FileText size={16} className="text-primary-500" />
              {t('crm.detail.description')}
            </h3>
            <div className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed whitespace-pre-wrap">
              {l.description ?? t('crm.detail.noDescription')}
            </div>
          </div>

          {/* Upcoming activities */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                <Clock size={16} className="text-warning-500" />
                {t('crm.detail.upcomingActivities')} ({pendingActivities.length})
              </h3>
              <Button variant="secondary" size="sm" onClick={() => navigate(`/crm/leads/${id}/activities/new`)}>
                {t('crm.detail.schedule')}
              </Button>
            </div>
            {pendingActivities.length === 0 ? (
              <p className="text-sm text-neutral-500 dark:text-neutral-400">{t('crm.detail.noPendingActivities')}</p>
            ) : (
              <div className="space-y-2">
                {pendingActivities.map((act) => (
                  <div key={act.id} className="flex items-center gap-3 p-3 rounded-lg border border-warning-100 bg-warning-50/30">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${activityTypeIcons[act.type] ?? 'bg-neutral-400'}`}
                      style={{ backgroundColor: 'currentColor' }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{act.title}</p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">
                        {activityTypeLabels[act.type] ?? act.type} | {act.assignedToName} | {formatDateLong(act.scheduledAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Completed activities */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center gap-2">
              <CheckCircle size={16} className="text-success-500" />
              {t('crm.detail.completedActivities')} ({completedActivities.length})
            </h3>
            {completedActivities.length === 0 ? (
              <p className="text-sm text-neutral-500 dark:text-neutral-400">{t('crm.detail.noCompletedActivities')}</p>
            ) : (
              <div className="space-y-2">
                {completedActivities.map((act) => (
                  <div key={act.id} className="flex items-center gap-3 p-3 rounded-lg border border-neutral-100">
                    <CheckCircle size={14} className="text-success-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-neutral-700 dark:text-neutral-300">{act.title}</p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">
                        {activityTypeLabels[act.type] ?? act.type} | {act.assignedToName} | {formatDateLong(act.completedAt)}
                      </p>
                      {act.description && (
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 italic">"{act.description}"</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">{t('crm.detail.contact')}</h3>
            <div className="space-y-4">
              <InfoItem icon={<User size={15} />} label={t('crm.detail.contactPerson')} value={l.partnerName ?? l.contactName ?? '---'} />
              <InfoItem icon={<Building2 size={15} />} label={t('crm.detail.company')} value={l.companyName ?? '---'} />
              <InfoItem icon={<Mail size={15} />} label="Email" value={l.email ?? l.contactEmail ?? '---'} />
              <InfoItem icon={<Phone size={15} />} label={t('crm.detail.phone')} value={l.phone ?? l.contactPhone ?? '---'} />
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">{t('crm.detail.details')}</h3>
            <div className="space-y-4">
              <InfoItem icon={<User size={15} />} label={t('crm.detail.assignee')} value={l.assignedToName ?? '---'} />
              <InfoItem icon={<User size={15} />} label={t('crm.detail.team')} value={l.teamName ?? '---'} />
              <InfoItem icon={<FileText size={15} />} label={t('crm.detail.source')} value={l.source ?? '---'} />
              <InfoItem icon={<Calendar size={15} />} label={t('crm.detail.created')} value={formatDateLong(l.createdAt)} />
              <InfoItem icon={<Calendar size={15} />} label={t('crm.detail.updated')} value={formatDateLong(l.updatedAt)} />
            </div>
          </div>

          {/* Financial */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">{t('crm.detail.finances')}</h3>
            <div className="space-y-3">
              <div className="p-3 bg-primary-50 rounded-lg border border-primary-100">
                <p className="text-xs font-medium text-primary-600 mb-1">{t('crm.detail.expectedRevenue')}</p>
                <p className="text-lg font-bold text-primary-700 tabular-nums">
                  {l.expectedRevenue ? formatMoney(l.expectedRevenue) : '---'}
                </p>
              </div>
              <div className="p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg border border-neutral-100">
                <p className="text-xs font-medium text-neutral-600 mb-1">{t('crm.detail.closeProbability')}</p>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 bg-neutral-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary-500 rounded-full"
                      style={{ width: `${l.probability ?? 0}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold text-neutral-700 dark:text-neutral-300 tabular-nums">{l.probability ?? 0}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Project link (if converted) */}
          {l.projectId && (
            <div className="bg-success-50 dark:bg-success-900/20 rounded-xl border border-success-200 dark:border-success-800 p-6">
              <h3 className="text-sm font-semibold text-success-800 dark:text-success-200 mb-3 flex items-center gap-2">
                <HardHat size={16} />
                {t('crm.detail.projectLinked')}
              </h3>
              <Button
                variant="primary"
                size="sm"
                className="w-full"
                iconLeft={<ExternalLink size={14} />}
                onClick={() => navigate(`/projects/${l.projectId}`)}
              >
                {t('crm.detail.goToProject')}
              </Button>
            </div>
          )}

          {/* Actions */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">{t('crm.detail.actions')}</h3>
            <div className="space-y-2">
              {l.status === 'WON' && !l.projectId && (
                <Button
                  variant="primary"
                  size="sm"
                  className="w-full justify-start"
                  iconLeft={<HardHat size={14} />}
                  onClick={() => {
                    setConvertForm({
                      projectName: l.name,
                      projectCode: l.number?.replace(/^L-/, '') || '',
                    });
                    setConvertOpen(true);
                  }}
                >
                  {t('crm.detail.convertToProject')}
                </Button>
              )}
              <Button variant="secondary" size="sm" className="w-full justify-start" onClick={() => navigate(`/crm/leads/${id}/activities/new`)}>
                {t('crm.detail.addActivity')}
              </Button>
              <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => window.open(`/api/crm/leads/${id}/export?format=pdf`, '_blank')}>
                {t('crm.detail.exportPdf')}
              </Button>
            </div>
          </div>
        </div>
      </div>
      {/* Convert to project modal */}
      {convertOpen && (
        <Modal
          open={convertOpen}
          onClose={() => setConvertOpen(false)}
          title={t('crm.detail.convertModalTitle')}
          size="md"
          footer={
            <>
              <Button variant="secondary" size="sm" onClick={() => setConvertOpen(false)}>
                {t('common.cancel')}
              </Button>
              <Button
                variant="primary"
                size="sm"
                iconLeft={<HardHat size={14} />}
                loading={convertMutation.isPending}
                disabled={!convertForm.projectName.trim() || !convertForm.projectCode.trim()}
                onClick={() => convertMutation.mutate()}
              >
                {t('crm.detail.convertModalSubmit')}
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              {t('crm.detail.convertToProjectDesc')}
            </p>
            <div>
              <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                {t('crm.detail.convertModalName')}
              </label>
              <input
                type="text"
                value={convertForm.projectName}
                onChange={(e) => setConvertForm((prev) => ({ ...prev, projectName: e.target.value }))}
                className="w-full h-9 px-3 text-sm border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                {t('crm.detail.convertModalCode')}
              </label>
              <input
                type="text"
                value={convertForm.projectCode}
                onChange={(e) => setConvertForm((prev) => ({ ...prev, projectCode: e.target.value }))}
                className="w-full h-9 px-3 text-sm border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            {l.companyName && (
              <div className="p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg text-sm">
                <span className="text-neutral-500 dark:text-neutral-400">{t('crm.detail.company')}:</span>{' '}
                <span className="font-medium text-neutral-800 dark:text-neutral-200">{l.companyName}</span>
              </div>
            )}
            {l.expectedRevenue != null && l.expectedRevenue > 0 && (
              <div className="p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg text-sm">
                <span className="text-primary-600 dark:text-primary-400">{t('crm.detail.expectedRevenue')}:</span>{' '}
                <span className="font-bold text-primary-700 dark:text-primary-300">{formatMoney(l.expectedRevenue)}</span>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};

const InfoItem: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({
  icon,
  label,
  value,
}) => (
  <div className="flex items-start gap-3">
    <span className="text-neutral-400 mt-0.5 flex-shrink-0">{icon}</span>
    <div>
      <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-0.5">{label}</p>
      <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">{value}</p>
    </div>
  </div>
);

export default CrmLeadDetailPage;
