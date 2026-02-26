import React, { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  User,
  Calendar,
  DollarSign,
  Phone,
  Mail,
  FileText,
  MessageSquare,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  CheckSquare,
  Square,
  Sparkles,
  Save,
} from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { portfolioApi } from '@/api/portfolio';
import { formatDateLong, formatMoney, formatMoneyCompact, formatRelativeTime } from '@/lib/format';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';
import type { Opportunity, OpportunityActivity } from './types';
import toast from 'react-hot-toast';

const stageColorMap: Record<string, 'gray' | 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'orange' | 'cyan'> = {
  LEAD: 'gray',
  QUALIFICATION: 'blue',
  PROPOSAL: 'yellow',
  NEGOTIATION: 'orange',
  WON: 'green',
  LOST: 'red',
};

const getStageLabels = (): Record<string, string> => ({
  LEAD: t('portfolio.opportunities.stageLead'),
  QUALIFICATION: t('portfolio.opportunities.stageQualification'),
  PROPOSAL: t('portfolio.opportunities.stageProposal'),
  NEGOTIATION: t('portfolio.opportunities.stageNegotiation'),
  WON: t('portfolio.opportunities.stageWon'),
  LOST: t('portfolio.opportunities.stageLost'),
});

const stageFlow: Opportunity['stage'][] = ['LEAD', 'QUALIFICATION', 'PROPOSAL', 'NEGOTIATION', 'WON'];

const activityTypeIcons: Record<string, React.ReactNode> = {
  CALL: <Phone size={14} />,
  MEETING: <User size={14} />,
  EMAIL: <Mail size={14} />,
  NOTE: <FileText size={14} />,
  TASK: <MessageSquare size={14} />,
};

const getActivityTypeLabels = (): Record<string, string> => ({
  CALL: t('portfolio.opportunityDetail.activityCall'),
  MEETING: t('portfolio.opportunityDetail.activityMeeting'),
  EMAIL: t('portfolio.opportunityDetail.activityEmail'),
  NOTE: t('portfolio.opportunityDetail.activityNote'),
  TASK: t('portfolio.opportunityDetail.activityTask'),
});

const GO_NO_GO_FIELDS = [
  'resourceAvailability',
  'competencyMatch',
  'teamCapacity',
  'riskAcceptable',
  'marginTargetMet',
  'regionExperience',
  'clientHistory',
  'equipmentAvailable',
] as const;

type GoNoGoField = typeof GO_NO_GO_FIELDS[number];
type GoNoGoChecklist = Record<GoNoGoField, boolean>;

const defaultChecklist = (): GoNoGoChecklist =>
  Object.fromEntries(GO_NO_GO_FIELDS.map((f) => [f, false])) as GoNoGoChecklist;

const OpportunityDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: opportunity, isLoading } = useQuery<Opportunity>({
    queryKey: ['opportunity', id],
    queryFn: () => portfolioApi.getOpportunity(id!),
    enabled: !!id,
  });

  const { data: activities } = useQuery<OpportunityActivity[]>({
    queryKey: ['opportunity-activities', id],
    queryFn: () => portfolioApi.getOpportunityActivities(id!),
    enabled: !!id,
  });

  const stageLabels = getStageLabels();
  const activityTypeLabels = getActivityTypeLabels();

  if (isLoading || !opportunity) {
    return <div className="animate-fade-in p-8 text-center text-neutral-500 dark:text-neutral-400">{t('common.loading')}</div>;
  }

  const o = opportunity;
  const acts = activities ?? [];
  const [stageOverride, setStageOverride] = useState<Opportunity['stage'] | null>(null);
  const effectiveStage = stageOverride ?? o.stage;

  // Go/No-Go checklist state
  const [goNoGoOpen, setGoNoGoOpen] = useState(false);
  const [checklist, setChecklist] = useState<GoNoGoChecklist>(defaultChecklist);
  const [analogResult, setAnalogResult] = useState<{ analogCount: number; avgEstimatedValue?: number; avgWinProbability?: number; recommendation: string } | null>(null);

  const goNoGoScore = useMemo(() => GO_NO_GO_FIELDS.filter((f) => checklist[f]).length, [checklist]);

  const saveChecklistMutation = useMutation({
    mutationFn: () => portfolioApi.updateGoNoGoChecklist(id!, checklist, goNoGoScore),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['opportunity', id] });
      toast.success(t('portfolio.goNoGo.saved'));
    },
    onError: () => toast.error(t('portfolio.goNoGo.saveError')),
  });

  const analogMutation = useMutation({
    mutationFn: () => portfolioApi.getAnalogAssessment(id!),
    onSuccess: (data) => setAnalogResult(data),
    onError: () => toast.error(t('portfolio.goNoGo.analogError')),
  });

  const stageActions = useMemo(() => {
    const idx = stageFlow.indexOf(effectiveStage);
    if (idx >= 0 && idx < stageFlow.length - 1) {
      return [{ label: t('portfolio.opportunityDetail.moveToStage', { stage: stageLabels[stageFlow[idx + 1]] }), targetStage: stageFlow[idx + 1] }];
    }
    return [];
  }, [effectiveStage]);

  const currentStageIdx = stageFlow.indexOf(effectiveStage);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={o.name}
        subtitle={o.clientName}
        backTo="/portfolio/opportunities"
        breadcrumbs={[
          { label: t('nav.dashboard'), href: '/' },
          { label: t('nav.portfolio'), href: '/portfolio/opportunities' },
          { label: t('portfolio.opportunities.breadcrumb'), href: '/portfolio/opportunities' },
          { label: o.name.slice(0, 30) + '...' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <StatusBadge
              status={effectiveStage}
              colorMap={stageColorMap}
              label={stageLabels[effectiveStage] ?? effectiveStage}
              size="md"
            />
            {stageActions.map((action) => (
              <Button
                key={action.targetStage}
                variant="secondary"
                size="sm"
                onClick={() => {
                  setStageOverride(action.targetStage);
                  toast.success(t('portfolio.opportunityDetail.stageChanged', { stage: stageLabels[action.targetStage] ?? action.targetStage }));
                }}
              >
                {action.label}
              </Button>
            ))}
          </div>
        }
      />

      {/* Stage pipeline */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-6">
        <div className="flex items-center gap-2">
          {stageFlow.map((stage, idx) => {
            const isCompleted = idx < currentStageIdx;
            const isCurrent = idx === currentStageIdx;
            return (
              <React.Fragment key={stage}>
                <div
                  className={cn(
                    'flex-1 py-2 px-3 rounded-lg text-center text-xs font-medium',
                    isCompleted && 'bg-success-50 text-success-700',
                    isCurrent && 'bg-primary-50 text-primary-700 ring-2 ring-primary-200',
                    !isCompleted && !isCurrent && 'bg-neutral-50 dark:bg-neutral-800 text-neutral-400',
                  )}
                >
                  {stageLabels[stage]}
                </div>
                {idx < stageFlow.length - 1 && (
                  <ArrowRight size={14} className="text-neutral-300 flex-shrink-0" />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Key metrics */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4">
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">{t('portfolio.opportunityDetail.projectValue')}</p>
              <p className="text-lg font-bold text-neutral-900 dark:text-neutral-100 tabular-nums">{formatMoneyCompact(o.value)}</p>
            </div>
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4">
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">{t('portfolio.opportunityDetail.probability')}</p>
              <div className="flex items-center gap-2">
                <p className="text-lg font-bold text-neutral-900 dark:text-neutral-100 tabular-nums">{o.probability}%</p>
                <div className="flex-1 h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-primary-500" style={{ width: `${o.probability}%` }} />
                </div>
              </div>
            </div>
            <div className="bg-primary-50 rounded-xl border border-primary-100 p-4">
              <p className="text-xs text-primary-600 mb-1">{t('portfolio.opportunityDetail.weightedValue')}</p>
              <p className="text-lg font-bold text-primary-700 tabular-nums">{formatMoneyCompact(o.weightedValue)}</p>
            </div>
          </div>

          {/* Description */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center gap-2">
              <FileText size={16} className="text-primary-500" />
              {t('common.description')}
            </h3>
            <div className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed whitespace-pre-wrap">
              {o.description ?? t('portfolio.opportunityDetail.noDescription')}
            </div>
          </div>

          {/* Go/No-Go Checklist */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700">
            <button
              type="button"
              className="w-full flex items-center justify-between px-6 py-4 text-left"
              onClick={() => setGoNoGoOpen(!goNoGoOpen)}
            >
              <div className="flex items-center gap-2">
                <CheckSquare size={16} className="text-primary-500" />
                <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                  {t('portfolio.goNoGo.title')}
                </h3>
                <span className={cn(
                  'ml-2 text-xs font-bold px-2 py-0.5 rounded-full',
                  goNoGoScore >= 6 ? 'bg-success-100 text-success-700' :
                  goNoGoScore >= 4 ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700',
                )}>
                  {goNoGoScore}/8
                </span>
              </div>
              {goNoGoOpen ? <ChevronUp size={16} className="text-neutral-400" /> : <ChevronDown size={16} className="text-neutral-400" />}
            </button>

            {goNoGoOpen && (
              <div className="px-6 pb-6 border-t border-neutral-100 dark:border-neutral-800 pt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                  {GO_NO_GO_FIELDS.map((field) => (
                    <label
                      key={field}
                      className="flex items-center gap-3 p-3 rounded-lg border border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800 cursor-pointer transition-colors"
                    >
                      <button
                        type="button"
                        className="flex-shrink-0 text-neutral-400"
                        onClick={() => setChecklist((prev) => ({ ...prev, [field]: !prev[field] }))}
                      >
                        {checklist[field]
                          ? <CheckSquare size={20} className="text-primary-500" />
                          : <Square size={20} />
                        }
                      </button>
                      <span className="text-sm text-neutral-700 dark:text-neutral-300">
                        {t(`portfolio.goNoGo.${field}` as 'portfolio.goNoGo.resourceAvailability')}
                      </span>
                    </label>
                  ))}
                </div>

                {analogResult && (
                  <div className="mb-4 p-3 rounded-lg bg-primary-50 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-800">
                    <p className="text-xs text-primary-600 dark:text-primary-400 mb-1">
                      {t('portfolio.goNoGo.analogCount', { count: String(analogResult.analogCount) })}
                    </p>
                    <span className={cn(
                      'inline-block text-xs font-bold px-2.5 py-1 rounded-full',
                      analogResult.recommendation === 'GO' ? 'bg-success-100 text-success-700' :
                      analogResult.recommendation === 'CONDITIONAL' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700',
                    )}>
                      {analogResult.recommendation}
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    iconLeft={<Sparkles size={14} />}
                    loading={analogMutation.isPending}
                    onClick={() => analogMutation.mutate()}
                  >
                    {t('portfolio.goNoGo.analogBtn')}
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    iconLeft={<Save size={14} />}
                    loading={saveChecklistMutation.isPending}
                    onClick={() => saveChecklistMutation.mutate()}
                  >
                    {t('portfolio.goNoGo.saveBtn')}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Activity timeline */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
              {t('portfolio.opportunityDetail.activityHistory')} ({acts.length})
            </h3>
            <div className="space-y-4">
              {acts.map((activity, idx) => (
                <div key={activity.id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center',
                      activity.activityType === 'MEETING' ? 'bg-primary-100 text-primary-600' :
                      activity.activityType === 'CALL' ? 'bg-green-100 text-green-600' :
                      activity.activityType === 'EMAIL' ? 'bg-blue-100 text-blue-600' :
                      'bg-neutral-100 dark:bg-neutral-800 text-neutral-600',
                    )}>
                      {activityTypeIcons[activity.activityType]}
                    </div>
                    {idx < acts.length - 1 && <div className="w-px flex-1 bg-neutral-200 mt-1" />}
                  </div>
                  <div className="flex-1 pb-4">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                          {activityTypeLabels[activity.activityType]}
                        </span>
                        <span className="text-xs text-neutral-400">--</span>
                        <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">{activity.performedByName}</span>
                      </div>
                      <span className="text-xs text-neutral-400">{formatRelativeTime(activity.performedAt)}</span>
                    </div>
                    <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">{activity.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">{t('common.details')}</h3>
            <div className="space-y-4">
              <InfoItem icon={<User size={15} />} label={t('portfolio.opportunityDetail.responsible')} value={o.ownerName} />
              <InfoItem icon={<User size={15} />} label={t('portfolio.opportunityDetail.client')} value={o.clientName} />
              <InfoItem icon={<DollarSign size={15} />} label={t('portfolio.opportunities.colValue')} value={formatMoney(o.value)} />
              <InfoItem icon={<DollarSign size={15} />} label={t('portfolio.opportunityDetail.weighted')} value={formatMoney(o.weightedValue)} />
              <InfoItem icon={<Calendar size={15} />} label={t('portfolio.opportunities.colExpectedClose')} value={formatDateLong(o.expectedCloseDate)} />
              <InfoItem icon={<FileText size={15} />} label={t('portfolio.opportunityDetail.source')} value={o.source ?? '---'} />
              <InfoItem icon={<Calendar size={15} />} label={t('portfolio.opportunityDetail.created')} value={formatDateLong(o.createdAt)} />
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">{t('common.actions')}</h3>
            <div className="space-y-2">
              <Button variant="secondary" size="sm" className="w-full justify-start" onClick={() => toast.success(t('portfolio.opportunityDetail.activityAdded'))}>
                {t('portfolio.opportunityDetail.addActivity')}
              </Button>
              <Button variant="secondary" size="sm" className="w-full justify-start" onClick={() => navigate('/portfolio/tenders')}>
                {t('portfolio.opportunityDetail.createBid')}
              </Button>
              <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => toast.success(t('portfolio.opportunityDetail.exportStarted'))}>
                {t('portfolio.opportunityDetail.exportPdf')}
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

export default OpportunityDetailPage;
