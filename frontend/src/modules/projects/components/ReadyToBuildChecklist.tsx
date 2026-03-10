import React, { useMemo, useCallback, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Circle, AlertTriangle, ShieldCheck, ChevronRight, ShieldAlert } from 'lucide-react';
import { Button } from '@/design-system/components/Button';
import { ConfirmDialog } from '@/design-system/components/ConfirmDialog';
import toast from 'react-hot-toast';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';
import { surveysApi } from '@/api/surveys';
import { permitsApi } from '@/api/permits';
import { risksApi } from '@/api/risks';
import { meetingsApi } from '@/api/meetings';
import { financeApi } from '@/api/finance';
import { safetyChecklistApi } from '@/api/safetyChecklist';
import { projectsApi } from '@/api/projects';
import { procurementApi } from '@/api/procurement';
import { gpzuApi } from '@/api/gpzu';
import { technicalConditionsApi } from '@/api/technicalConditions';
import { expertiseApi } from '@/api/expertise';
import { mobilizationApi } from '@/api/mobilization';

interface Props {
  projectId: string;
}

interface ChecklistItem {
  key: string;
  label: string;
  done: boolean;
  detail?: string;
  scrollTo?: string;
  navigateTo?: string;
}

const ReadyToBuildChecklist: React.FC<Props> = ({ projectId }) => {
  const navigate = useNavigate();
  // Fetch all required data
  const { data: siteAssessmentsRaw } = useQuery({
    queryKey: ['site-assessments', projectId],
    queryFn: async () => {
      const { siteAssessmentsApi } = await import('@/api/siteAssessments');
      return siteAssessmentsApi.getByProject(projectId);
    },
  });
  const siteAssessments = Array.isArray(siteAssessmentsRaw) ? siteAssessmentsRaw : [];

  const { data: permitsRaw } = useQuery({
    queryKey: ['permits', projectId],
    queryFn: () => permitsApi.getPermits(projectId),
  });
  const permits = Array.isArray(permitsRaw) ? permitsRaw : [];

  const { data: budgets } = useQuery({
    queryKey: ['project-budgets-rtb', projectId],
    queryFn: () => financeApi.getBudgets({ projectId, page: 0, size: 10 }),
  });

  const { data: proposals } = useQuery({
    queryKey: ['project-proposals-rtb', projectId],
    queryFn: () => financeApi.getCommercialProposals({ projectId, page: 0, size: 10 }),
  });

  const { data: prequalificationsRaw } = useQuery({
    queryKey: ['prequalifications-rtb'],
    queryFn: () => procurementApi.getPrequalifications(),
  });
  // API may return array or paginated { content: [...] } — normalize
  const prequalifications = Array.isArray(prequalificationsRaw)
    ? prequalificationsRaw
    : Array.isArray((prequalificationsRaw as any)?.content)
      ? (prequalificationsRaw as any).content
      : [];

  const { data: meeting } = useQuery({
    queryKey: ['meeting', projectId],
    queryFn: () => meetingsApi.getMeeting(projectId),
  });

  const { data: risksRaw } = useQuery({
    queryKey: ['risks', projectId],
    queryFn: () => risksApi.getRisks(projectId),
  });
  const risks = Array.isArray(risksRaw) ? risksRaw : [];

  const { data: surveysRaw } = useQuery({
    queryKey: ['surveys', projectId],
    queryFn: () => surveysApi.getSurveys(projectId),
  });
  const surveys = Array.isArray(surveysRaw) ? surveysRaw : [];

  const { data: safetyRaw } = useQuery({
    queryKey: ['safety-checklist', projectId],
    queryFn: () => safetyChecklistApi.getChecklist(projectId),
  });
  const safety = Array.isArray(safetyRaw) ? safetyRaw : [];

  const { data: plansRaw } = useQuery({
    queryKey: ['construction-plans', projectId],
    queryFn: () => projectsApi.getConstructionPlans(projectId),
  });
  const plans = Array.isArray(plansRaw) ? plansRaw : [];

  const { data: gpzuRaw } = useQuery({
    queryKey: ['gpzu', projectId],
    queryFn: () => gpzuApi.getByProject(projectId),
  });
  const gpzuItems = Array.isArray(gpzuRaw) ? gpzuRaw : [];

  const { data: tuRaw } = useQuery({
    queryKey: ['technical-conditions', projectId],
    queryFn: () => technicalConditionsApi.getByProject(projectId),
  });
  const tuItems = Array.isArray(tuRaw) ? tuRaw : [];

  const { data: expertiseRaw } = useQuery({
    queryKey: ['expertise', projectId],
    queryFn: () => expertiseApi.getByProject(projectId),
  });
  const expertiseItems = Array.isArray(expertiseRaw) ? expertiseRaw : [];

  const { data: mobilizationRaw } = useQuery({
    queryKey: ['mobilization', projectId],
    queryFn: () => mobilizationApi.getByProject(projectId),
  });
  const mobilizationItems = Array.isArray(mobilizationRaw) ? mobilizationRaw : [];

  const items: ChecklistItem[] = useMemo(() => {
    // 1. Site Assessment — at least one completed/approved OR with GO/CONDITIONAL recommendation
    const saCompleted = siteAssessments.filter((s: any) =>
      s.status === 'COMPLETED' || s.status === 'APPROVED' || s.recommendation === 'GO' || s.recommendation === 'CONDITIONAL'
    ).length;
    const saDone = saCompleted > 0;

    // 2. Permits — all approved (or at least one exists and all approved)
    const permitsApproved = permits.filter(p => p.status === 'APPROVED').length;
    const permitsDone = permits.length > 0 && permitsApproved === permits.length;

    // 3. Financial Model (Budget) — at least one APPROVED/ACTIVE
    const budgetList = budgets?.content ?? [];
    const fmApproved = budgetList.filter((b: any) => b.status === 'APPROVED' || b.status === 'ACTIVE').length;
    const fmDone = fmApproved > 0;

    // 4. Commercial Proposal — at least one APPROVED/ACTIVE
    const cpList = proposals?.content ?? [];
    const cpApproved = cpList.filter((c: any) => c.status === 'APPROVED' || c.status === 'ACTIVE').length;
    const cpDone = cpApproved > 0;

    // 5. Prequalification — at least one QUALIFIED vendor
    const pqQualified = prequalifications.filter((p: any) => p.status === 'QUALIFIED').length;
    const pqDone = pqQualified > 0;

    // 6. Pre-construction meeting held
    const meetingDone = !!meeting && !!meeting.id;

    // 7. Risks identified
    const risksDone = risks.length > 0;

    // 8. Engineering surveys completed
    const surveysCompleted = surveys.filter(s => s.status === 'COMPLETED' || s.status === 'APPROVED').length;
    const surveysDone = surveys.length > 0 && surveysCompleted === surveys.length;

    // 9. Construction plans approved
    const plansApproved = plans.filter(p => p.status === 'APPROVED').length;
    const plansDone = plans.length > 0 && plansApproved === plans.length;

    // 10. Safety checklist complete
    const safetyRequired = safety.filter(s => s.required);
    const safetyCompleted = safetyRequired.filter(s => s.completed).length;
    const safetyDone = safetyRequired.length > 0 && safetyCompleted === safetyRequired.length;

    const notStarted = t('projects.readyToBuild.statusNotStarted');

    return [
      { key: 'siteAssessment', label: t('projects.readyToBuild.itemSiteAssessment'), done: saDone, detail: siteAssessments.length > 0 ? `${saCompleted}/${siteAssessments.length}` : notStarted, scrollTo: 'section-site-assessments' },
      { key: 'permits', label: t('projects.readyToBuild.itemPermits'), done: permitsDone, detail: permits.length > 0 ? `${permitsApproved}/${permits.length}` : notStarted, scrollTo: 'section-permits' },
      { key: 'surveys', label: t('projects.readyToBuild.itemSurveys'), done: surveysDone, detail: surveys.length > 0 ? `${surveysCompleted}/${surveys.length}` : notStarted, scrollTo: 'section-surveys' },
      { key: 'plans', label: t('projects.readyToBuild.itemPlans'), done: plansDone, detail: plans.length > 0 ? `${plansApproved}/${plans.length}` : notStarted, scrollTo: 'section-plans' },
      { key: 'fm', label: t('projects.readyToBuild.itemFm'), done: fmDone, detail: fmDone ? t('projects.readyToBuild.statusApproved') : budgetList.length > 0 ? `${budgetList.length} ${t('projects.readyToBuild.created')}` : notStarted, navigateTo: `/finance/budgets?projectId=${projectId}` },
      { key: 'cp', label: t('projects.readyToBuild.itemCp'), done: cpDone, detail: cpDone ? t('projects.readyToBuild.statusApproved') : cpList.length > 0 ? `${cpList.length} ${t('projects.readyToBuild.created')}` : notStarted, navigateTo: `/commercial-proposals?projectId=${projectId}` },
      { key: 'prequalification', label: t('projects.readyToBuild.itemPrequalification'), done: pqDone, detail: pqDone ? `${pqQualified} ${t('projects.readyToBuild.qualified')}` : prequalifications.length > 0 ? `${prequalifications.length} ${t('projects.readyToBuild.total')}` : notStarted, navigateTo: '/prequalification' },
      { key: 'meeting', label: t('projects.readyToBuild.itemMeeting'), done: meetingDone, detail: meetingDone ? t('projects.readyToBuild.statusDone') : notStarted, navigateTo: `/projects/${projectId}/pre-construction-meeting` },
      { key: 'risks', label: t('projects.readyToBuild.itemRisks'), done: risksDone, detail: risksDone ? `${risks.length} ${t('projects.readyToBuild.identified')}` : notStarted, navigateTo: `/projects/${projectId}/risks` },
      { key: 'safety', label: t('projects.readyToBuild.itemSafety'), done: safetyDone, detail: safetyRequired.length > 0 ? `${safetyCompleted}/${safetyRequired.length} (${t('projects.readyToBuild.requiredOnly')})` : notStarted, scrollTo: 'section-safety' },
      // New preconstruction items
      { key: 'gpzu', label: t('projects.readyToBuild.itemGpzu'), done: gpzuItems.some((g: any) => g.status === 'ISSUED'), detail: gpzuItems.length > 0 ? `${gpzuItems.filter((g: any) => g.status === 'ISSUED').length}/${gpzuItems.length}` : notStarted, scrollTo: 'section-gpzu' },
      { key: 'tu', label: t('projects.readyToBuild.itemTu'), done: tuItems.length > 0 && tuItems.filter((tc: any) => tc.status === 'ISSUED' || tc.status === 'CONNECTED').length === tuItems.length, detail: tuItems.length > 0 ? `${tuItems.filter((tc: any) => tc.status === 'ISSUED' || tc.status === 'CONNECTED').length}/${tuItems.length}` : notStarted, scrollTo: 'section-tu' },
      { key: 'design', label: t('projects.readyToBuild.itemDesign'), done: false, detail: notStarted, scrollTo: 'section-design' },
      { key: 'expertise', label: t('projects.readyToBuild.itemExpertise'), done: expertiseItems.some((e: any) => e.status === 'POSITIVE' || e.status === 'CONDITIONAL'), detail: expertiseItems.length > 0 ? `${expertiseItems.filter((e: any) => e.status === 'POSITIVE' || e.status === 'CONDITIONAL').length}/${expertiseItems.length}` : notStarted, scrollTo: 'section-expertise' },
      { key: 'mobilization', label: t('projects.readyToBuild.itemMobilization'), done: mobilizationItems.length > 0 && mobilizationItems.filter((m: any) => m.status === 'COMPLETED').length === mobilizationItems.length, detail: mobilizationItems.length > 0 ? `${mobilizationItems.filter((m: any) => m.status === 'COMPLETED').length}/${mobilizationItems.length}` : notStarted, scrollTo: 'section-mobilization' },
    ];
  }, [siteAssessments, permits, budgets, proposals, prequalifications, meeting, risks, surveys, plans, safety, gpzuItems, tuItems, expertiseItems, mobilizationItems]);

  const doneCount = items.filter(i => i.done).length;
  const totalCount = items.length;
  const pct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;
  const allDone = doneCount === totalCount;

  // #93: Force Go override
  const [forceGoConfirmOpen, setForceGoConfirmOpen] = useState(false);
  const [forceGoActive, setForceGoActive] = useState(false);

  const handleForceGo = () => {
    setForceGoActive(true);
    setForceGoConfirmOpen(false);
    toast.success(t('projects.readyToBuild.forceGoApplied'));
  };

  return (
    <div className={cn(
      'rounded-xl border p-5',
      allDone
        ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800'
        : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700',
    )}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ShieldCheck size={20} className={allDone ? 'text-green-600' : 'text-neutral-400'} />
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            {t('projects.readyToBuild.title')}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          {!allDone && !forceGoActive && pct >= 40 && (
            <Button size="xs" variant="ghost" onClick={() => setForceGoConfirmOpen(true)}>
              <ShieldAlert size={13} className="mr-1 text-amber-500" />
              {t('projects.readyToBuild.forceGo')}
            </Button>
          )}
          <span className={cn(
            'text-xs font-bold px-2 py-0.5 rounded-full',
            allDone || forceGoActive
              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
              : pct >= 70
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
          )}>
            {doneCount}/{totalCount} ({pct}%)
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden mb-4" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={t('projects.readyToBuild.title')}>
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500',
            allDone ? 'bg-green-500' : pct >= 70 ? 'bg-blue-500' : 'bg-amber-400',
          )}
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Checklist items */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {items.map(item => {
          const isClickable = !!(item.scrollTo || item.navigateTo);
          const handleClick = () => {
            if (item.navigateTo) {
              navigate(item.navigateTo);
            } else if (item.scrollTo) {
              document.getElementById(item.scrollTo)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          };
          return (
            <button
              key={item.key}
              type="button"
              onClick={isClickable ? handleClick : undefined}
              className={cn(
                'flex items-center gap-2 py-1.5 px-2 rounded-md text-left w-full transition-colors',
                isClickable && 'hover:bg-neutral-50 dark:hover:bg-neutral-800/50 cursor-pointer',
              )}
            >
              {item.done ? (
                <CheckCircle2 size={16} className="text-green-500 flex-shrink-0" />
              ) : (
                <Circle size={16} className="text-neutral-300 dark:text-neutral-600 flex-shrink-0" />
              )}
              <span className={cn(
                'text-sm',
                item.done
                  ? 'text-neutral-700 dark:text-neutral-300'
                  : 'text-neutral-500 dark:text-neutral-400',
              )}>
                {item.label}
              </span>
              {item.detail && (
                <span className="text-xs text-neutral-400 dark:text-neutral-500 ml-auto tabular-nums">
                  {item.detail}
                </span>
              )}
              {isClickable && (
                <ChevronRight size={14} className="text-neutral-300 dark:text-neutral-600 flex-shrink-0 ml-1" />
              )}
            </button>
          );
        })}
      </div>

      {allDone && (
        <div className="mt-3 flex items-center gap-2 text-green-600 dark:text-green-400">
          <AlertTriangle size={14} className="rotate-180" />
          <span className="text-xs font-medium">{t('projects.readyToBuild.allComplete')}</span>
        </div>
      )}

      {forceGoActive && !allDone && (
        <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800">
          <ShieldAlert size={14} className="text-amber-500 flex-shrink-0" />
          <span className="text-xs font-medium text-amber-700 dark:text-amber-400">
            {t('projects.readyToBuild.forceGoActive')}
          </span>
        </div>
      )}

      <ConfirmDialog
        open={forceGoConfirmOpen}
        onClose={() => setForceGoConfirmOpen(false)}
        onConfirm={handleForceGo}
        title={t('projects.readyToBuild.forceGoTitle')}
        description={t('projects.readyToBuild.forceGoDesc', { done: String(doneCount), total: String(totalCount) })}
        confirmLabel={t('projects.readyToBuild.forceGoConfirm')}
      />
    </div>
  );
};

export default ReadyToBuildChecklist;
