import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { legalApi } from '@/api/legal';
import {
  User,
  Calendar,
  DollarSign,
  FileText,
  Scale,
  Landmark,
  ArrowRight,
  MessageSquare,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import {
  StatusBadge,
  legalCaseStatusColorMap,
  legalCaseStatusLabels,
  legalCaseTypeColorMap,
  legalCaseTypeLabels,
} from '@/design-system/components/StatusBadge';
import { MetricCard } from '@/design-system/components/MetricCard';
import { formatDateLong, formatMoney, formatMoneyCompact } from '@/lib/format';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';
import type { LegalCase, LegalDecision, LegalRemark } from './types';
import toast from 'react-hot-toast';

const getStatusFlow = () => [
  { status: 'OPEN', label: t('legal.caseStatusOpen') },
  { status: 'IN_PROGRESS', label: t('legal.caseStatusInProgress') },
  { status: 'RESOLVED', label: t('legal.caseStatusResolved') },
  { status: 'CLOSED', label: t('legal.caseStatusClosed') },
];

const getDecisionTypeLabels = (): Record<string, string> => ({
  court_ruling: t('legal.decisionCourtRuling'), settlement: t('legal.decisionSettlement'), mediation: t('legal.decisionMediation'),
  arbitration_award: t('legal.decisionArbitrationAward'), internal: t('legal.decisionInternal'),
});


const LegalCaseDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const statusMutation = useMutation({
    mutationFn: ({ caseId, status }: { caseId: string; status: string }) =>
      legalApi.updateCase(caseId, { status } as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['legal-case', id] });
      queryClient.invalidateQueries({ queryKey: ['legal-cases'] });
    },
    onError: () => {
      toast.error(t('common.operationError'));
    },
  });

  const { data: legalCase, isLoading } = useQuery<LegalCase>({
    queryKey: ['legal-case', id],
    queryFn: () => legalApi.getCase(id!),
    enabled: !!id,
  });

  const { data: decisions } = useQuery<LegalDecision[]>({
    queryKey: ['legal-case-decisions', id],
    queryFn: () => legalApi.getCaseDecisions(id!),
    enabled: !!id,
  });

  const { data: remarks } = useQuery<LegalRemark[]>({
    queryKey: ['legal-case-remarks', id],
    queryFn: () => legalApi.getCaseRemarks(id!),
    enabled: !!id,
  });

  const c = legalCase!;
  const decisionList = decisions ?? [];
  const remarkList = remarks ?? [];

  if (isLoading || !legalCase) {
    return <div className="animate-fade-in p-8 text-center text-neutral-500 dark:text-neutral-400">{t('common.loading')}</div>;
  }

  const statusFlow = getStatusFlow();
  const decisionTypeLabels = getDecisionTypeLabels();

  const statusActions = useMemo(() => {
    switch (c.status) {
      case 'DRAFT': return [{ label: t('legal.actionOpenCase'), targetStatus: 'OPEN' }];
      case 'OPEN': return [{ label: t('legal.actionStartWork'), targetStatus: 'IN_PROGRESS' }];
      case 'IN_PROGRESS': return [
        { label: t('legal.actionResolved'), targetStatus: 'RESOLVED' },
        { label: t('legal.actionSuspend'), targetStatus: 'ON_HOLD' },
      ];
      case 'ON_HOLD': return [{ label: t('legal.actionResume'), targetStatus: 'IN_PROGRESS' }];
      case 'RESOLVED': return [{ label: t('legal.actionCloseCase'), targetStatus: 'CLOSED' }];
      default: return [];
    }
  }, [c.status]);

  const currentStepIndex = statusFlow.findIndex((s) => s.status === c.status);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={c.title}
        subtitle={`${c.number}${c.caseNumber ? ` / ${c.caseNumber}` : ''}`}
        backTo="/legal/cases"
        breadcrumbs={[
          { label: t('legal.breadcrumbHome'), href: '/' },
          { label: t('legal.breadcrumbLegal'), href: '/legal/cases' },
          { label: c.number },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <StatusBadge
              status={c.status}
              colorMap={legalCaseStatusColorMap}
              label={legalCaseStatusLabels[c.status] ?? c.status}
              size="md"
            />
            <StatusBadge
              status={c.caseType}
              colorMap={legalCaseTypeColorMap}
              label={legalCaseTypeLabels[c.caseType] ?? c.caseType}
              size="md"
            />
            {statusActions.map((action) => (
              <Button
                key={action.targetStatus}
                variant="secondary"
                size="sm"
                onClick={() => statusMutation.mutate({ caseId: id!, status: action.targetStatus })}
              >
                {action.label}
              </Button>
            ))}
          </div>
        }
      />

      {/* Status flow */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-6">
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">{t('legal.caseProgress')}</h3>
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

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard icon={<DollarSign size={18} />} label={t('legal.metricClaimAmount')} value={c.claimAmount ? formatMoneyCompact(c.claimAmount) : '---'} />
        <MetricCard icon={<DollarSign size={18} />} label={t('legal.metricResolved')} value={c.resolvedAmount ? formatMoneyCompact(c.resolvedAmount) : '---'} />
        <MetricCard icon={<Scale size={18} />} label={t('legal.metricDecisions')} value={c.decisionCount} />
        <MetricCard icon={<MessageSquare size={18} />} label={t('legal.metricComments')} value={c.remarkCount} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center gap-2">
              <FileText size={16} className="text-primary-500" />
              {t('legal.descriptionTitle')}
            </h3>
            <div className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed whitespace-pre-wrap">
              {c.description ?? t('legal.noDescription')}
            </div>
          </div>

          {/* Decisions */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                <Scale size={16} className="text-primary-500" />
                {t('legal.decisionsTitle')}
              </h3>
              <Button variant="secondary" size="sm" onClick={() => navigate(`/legal/cases/${id}/decisions/new`)}>
                {t('legal.addDecision')}
              </Button>
            </div>
            {decisionList.length === 0 ? (
              <p className="text-sm text-neutral-500 dark:text-neutral-400">{t('legal.noDecisions')}</p>
            ) : (
              <div className="space-y-3">
                {decisionList.map((decision) => (
                  <div key={decision.id} className="p-4 rounded-lg border border-neutral-100 dark:border-neutral-700">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{decision.title}</span>
                      <div className="flex items-center gap-2">
                        {decision.isInFavor ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-success-600">
                            <CheckCircle size={14} /> {t('legal.inOurFavor')}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-danger-600">
                            <XCircle size={14} /> {t('legal.notInOurFavor')}
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">
                      {decisionTypeLabels[decision.decisionType] ?? decision.decisionType} | {formatDateLong(decision.decisionDate)}
                    </p>
                    {decision.description && (
                      <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-2">{decision.description}</p>
                    )}
                    {decision.amount && (
                      <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mt-2">{t('legal.amountLabel')}: {formatMoneyCompact(decision.amount)}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Remarks */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center gap-2">
              <MessageSquare size={16} className="text-primary-500" />
              {t('legal.commentsTitle')}
            </h3>
            {remarkList.length === 0 ? (
              <p className="text-sm text-neutral-500 dark:text-neutral-400">{t('legal.noComments')}</p>
            ) : (
              <div className="space-y-3">
                {remarkList.map((remark) => (
                  <div key={remark.id} className={cn(
                    'p-4 rounded-lg border',
                    remark.isInternal ? 'border-warning-100 bg-warning-50/30' : 'border-neutral-100 dark:border-neutral-700',
                  )}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{remark.authorName}</span>
                      <div className="flex items-center gap-2">
                        {remark.isInternal && (
                          <span className="text-xs text-warning-600 font-medium">{t('legal.internalRemark')}</span>
                        )}
                        <span className="text-xs text-neutral-500 dark:text-neutral-400">{formatDateLong(remark.createdAt)}</span>
                      </div>
                    </div>
                    <p className="text-sm text-neutral-700 dark:text-neutral-300">{remark.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">{t('legal.caseDetails')}</h3>
            <div className="space-y-4">
              <InfoItem icon={<User size={15} />} label={t('legal.labelLawyer')} value={c.assignedLawyerName ?? '---'} />
              <InfoItem icon={<User size={15} />} label={t('legal.labelResponsible')} value={c.responsibleName ?? '---'} />
              <InfoItem icon={<Scale size={15} />} label={t('legal.labelOpponent')} value={c.opposingParty ?? '---'} />
              <InfoItem icon={<Landmark size={15} />} label={t('legal.labelCourt')} value={c.courtName ?? '---'} />
              <InfoItem icon={<FileText size={15} />} label={t('legal.labelCaseNumber')} value={c.caseNumber ?? '---'} />
              <InfoItem icon={<FileText size={15} />} label={t('legal.labelProject')} value={c.projectName ?? '---'} />
              <InfoItem icon={<FileText size={15} />} label={t('legal.labelContract')} value={c.contractName ?? '---'} />
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">{t('legal.datesTitle')}</h3>
            <div className="space-y-4">
              <InfoItem icon={<Calendar size={15} />} label={t('legal.labelFilingDate')} value={formatDateLong(c.filingDate)} />
              <InfoItem icon={<Calendar size={15} />} label={t('legal.labelHearingDate')} value={formatDateLong(c.hearingDate)} />
              <InfoItem icon={<Calendar size={15} />} label={t('legal.labelCreatedAt')} value={formatDateLong(c.createdAt)} />
              <InfoItem icon={<Calendar size={15} />} label={t('legal.labelResolutionDate')} value={formatDateLong(c.resolutionDate)} />
            </div>
          </div>

          {/* Financial summary */}
          {c.claimAmount && (
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">{t('legal.financesTitle')}</h3>
              <div className="space-y-3">
                <div className="p-3 bg-danger-50 rounded-lg border border-danger-100">
                  <p className="text-xs font-medium text-danger-600 mb-1">{t('legal.metricClaimAmount')}</p>
                  <p className="text-lg font-bold text-danger-700 tabular-nums">{formatMoney(c.claimAmount)}</p>
                </div>
                {c.resolvedAmount != null && (
                  <div className="p-3 bg-success-50 rounded-lg border border-success-100">
                    <p className="text-xs font-medium text-success-600 mb-1">{t('legal.metricResolved')}</p>
                    <p className="text-lg font-bold text-success-700 tabular-nums">{formatMoney(c.resolvedAmount)}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">{t('legal.actionsTitle')}</h3>
            <div className="space-y-2">
              <Button variant="secondary" size="sm" className="w-full justify-start" onClick={() => navigate(`/legal/cases/${id}/decisions/new`)}>
                {t('legal.addDecision')}
              </Button>
              <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => window.open(`/api/legal/cases/${id}/export?format=pdf`, '_blank')}>
                {t('legal.exportPdf')}
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

export default LegalCaseDetailPage;
