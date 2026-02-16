import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { changeManagementApi } from '@/api/changeManagement';
import {
  User,
  Calendar,
  DollarSign,
  Clock,
  FileText,
  Link2,
  ArrowRight,
} from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import {
  StatusBadge,
  changeEventStatusColorMap,
  changeEventStatusLabels,
  changeEventSourceColorMap,
  changeEventSourceLabels,
} from '@/design-system/components/StatusBadge';
import { formatDateLong, formatMoney, formatMoneyCompact } from '@/lib/format';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';
import type { ChangeEvent } from './types';

const getStatusFlow = () => [
  { status: 'IDENTIFIED', label: t('changeManagement.eventDetail.statusIdentified') },
  { status: 'EVALUATING', label: t('changeManagement.eventDetail.statusEvaluating') },
  { status: 'PENDING_APPROVAL', label: t('changeManagement.eventDetail.statusPendingApproval') },
  { status: 'APPROVED', label: t('changeManagement.eventDetail.statusApproved') },
];

const ChangeEventDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const statusMutation = useMutation({
    mutationFn: ({ eventId, status }: { eventId: string; status: string }) =>
      changeManagementApi.createChangeEvent({ id: eventId, status } as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['change-event', id] });
      queryClient.invalidateQueries({ queryKey: ['change-events'] });
    },
  });

  const { data: event, isLoading } = useQuery<ChangeEvent>({
    queryKey: ['change-event', id],
    queryFn: () => changeManagementApi.getChangeEvent(id!),
    enabled: !!id,
  });

  if (isLoading || !event) {
    return <div className="animate-fade-in p-8 text-center text-neutral-500 dark:text-neutral-400">{t('common.loading')}</div>;
  }

  const e = event;

  const statusActions = useMemo(() => {
    switch (e.status) {
      case 'IDENTIFIED': return [{ label: t('changeManagement.eventDetail.actionStartEvaluation'), targetStatus: 'EVALUATING' }];
      case 'EVALUATING': return [{ label: t('changeManagement.eventDetail.actionSendForApproval'), targetStatus: 'PENDING_APPROVAL' }];
      case 'PENDING_APPROVAL': return [
        { label: t('changeManagement.eventDetail.actionApprove'), targetStatus: 'APPROVED' },
        { label: t('changeManagement.eventDetail.actionReject'), targetStatus: 'REJECTED' },
      ];
      default: return [];
    }
  }, [e.status]);

  const statusFlow = getStatusFlow();
  const currentStepIndex = statusFlow.findIndex((s) => s.status === e.status);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={e.title}
        subtitle={`${e.number} / ${e.projectName}`}
        backTo="/change-management/events"
        breadcrumbs={[
          { label: t('changeManagement.eventDetail.breadcrumbHome'), href: '/' },
          { label: t('changeManagement.eventDetail.breadcrumbChangeManagement'), href: '/change-management/events' },
          { label: e.number },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <StatusBadge
              status={e.status}
              colorMap={changeEventStatusColorMap}
              label={changeEventStatusLabels[e.status] ?? e.status}
              size="md"
            />
            <StatusBadge
              status={e.source}
              colorMap={changeEventSourceColorMap}
              label={changeEventSourceLabels[e.source] ?? e.source}
              size="md"
            />
            {statusActions.map((action) => (
              <Button
                key={action.targetStatus}
                variant="secondary"
                size="sm"
                onClick={() => statusMutation.mutate({ eventId: id!, status: action.targetStatus })}
              >
                {action.label}
              </Button>
            ))}
          </div>
        }
      />

      {/* Status flow */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-6">
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">{t('changeManagement.eventDetail.approvalProcess')}</h3>
        <div className="flex items-center gap-2">
          {statusFlow.map((step, idx) => {
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
                {idx < statusFlow.length - 1 && (
                  <ArrowRight size={16} className="text-neutral-300 flex-shrink-0" />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center gap-2">
              <FileText size={16} className="text-primary-500" />
              {t('changeManagement.eventDetail.description')}
            </h3>
            <div className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed whitespace-pre-wrap">
              {e.description ?? t('changeManagement.eventDetail.noDescription')}
            </div>
          </div>

          {/* Impact assessment */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">{t('changeManagement.eventDetail.impactAssessment')}</h3>
            <div className="grid grid-cols-2 gap-6">
              <div className="p-4 bg-danger-50 rounded-lg border border-danger-100">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign size={16} className="text-danger-500" />
                  <p className="text-xs font-medium text-danger-600">{t('changeManagement.eventDetail.costImpact')}</p>
                </div>
                <p className="text-xl font-bold text-danger-700 tabular-nums">
                  {e.costImpact > 0 ? `+${formatMoney(e.costImpact)}` : '---'}
                </p>
              </div>
              <div className="p-4 bg-warning-50 rounded-lg border border-warning-100">
                <div className="flex items-center gap-2 mb-2">
                  <Clock size={16} className="text-warning-500" />
                  <p className="text-xs font-medium text-warning-600">{t('changeManagement.eventDetail.scheduleImpact')}</p>
                </div>
                <p className="text-xl font-bold text-warning-700 tabular-nums">
                  {e.scheduleImpactDays > 0 ? `+${e.scheduleImpactDays} ${t('changeManagement.eventDetail.daysUnit')}` : t('changeManagement.eventDetail.noChange')}
                </p>
              </div>
            </div>
          </div>

          {/* Linked items */}
          {(e.linkedRfiId || e.linkedIssueId) && (
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center gap-2">
                <Link2 size={16} />
                {t('changeManagement.eventDetail.linkedItems')}
              </h3>
              <div className="space-y-2">
                {e.linkedRfiId && (
                  <div
                    className="flex items-center gap-2 p-3 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 cursor-pointer border border-neutral-100"
                    onClick={() => navigate(`/rfis/${e.linkedRfiId}`)}
                  >
                    <FileText size={15} className="text-primary-500" />
                    <span className="text-sm text-primary-600 font-medium">RFI: {e.linkedRfiId}</span>
                  </div>
                )}
                {e.linkedIssueId && (
                  <div
                    className="flex items-center gap-2 p-3 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 cursor-pointer border border-neutral-100"
                    onClick={() => navigate(`/issues/${e.linkedIssueId}`)}
                  >
                    <FileText size={15} className="text-orange-500" />
                    <span className="text-sm text-orange-600 font-medium">{t('changeManagement.eventDetail.issue')}: {e.linkedIssueId}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">{t('changeManagement.eventDetail.details')}</h3>
            <div className="space-y-4">
              <InfoItem icon={<User size={15} />} label={t('changeManagement.eventDetail.initiator')} value={e.requestedByName} />
              <InfoItem icon={<User size={15} />} label={t('changeManagement.eventDetail.approvedBy')} value={e.approvedByName ?? '---'} />
              <InfoItem icon={<Calendar size={15} />} label={t('changeManagement.eventDetail.created')} value={formatDateLong(e.createdAt)} />
              <InfoItem icon={<Calendar size={15} />} label={t('changeManagement.eventDetail.approved')} value={formatDateLong(e.approvedDate)} />
              <InfoItem icon={<FileText size={15} />} label={t('changeManagement.eventDetail.project')} value={e.projectName ?? '---'} />
              <InfoItem icon={<DollarSign size={15} />} label={t('changeManagement.eventDetail.cost')} value={e.costImpact > 0 ? formatMoneyCompact(e.costImpact) : '---'} />
              <InfoItem icon={<Clock size={15} />} label={t('changeManagement.eventDetail.schedule')} value={e.scheduleImpactDays > 0 ? `+${e.scheduleImpactDays} ${t('changeManagement.eventDetail.daysShort')}` : t('changeManagement.eventDetail.noChange')} />
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">{t('changeManagement.eventDetail.actions')}</h3>
            <div className="space-y-2">
              <Button variant="secondary" size="sm" className="w-full justify-start" onClick={() => navigate('/change-management/orders/new')}>
                {t('changeManagement.eventDetail.createChangeOrder')}
              </Button>
              <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => window.open(`/api/change-events/${id}/export?format=pdf`, '_blank')}>
                {t('changeManagement.eventDetail.exportPdf')}
              </Button>
            </div>
          </div>
        </div>
      </div>
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

export default ChangeEventDetailPage;
