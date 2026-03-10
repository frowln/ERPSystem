import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FileText, Upload, Plus } from 'lucide-react';
import { Button } from '@/design-system/components/Button';
import { projectsApi } from '@/api/projects';
import { t } from '@/i18n';
import toast from 'react-hot-toast';
import type { ConstructionPlan, ConstructionPlanType, ConstructionPlanStatus } from '@/types';

const PLAN_TYPES: ConstructionPlanType[] = ['POS', 'PPR', 'SITE_PLAN'];

const STATUS_COLORS: Record<ConstructionPlanStatus, string> = {
  NOT_STARTED: 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300',
  DRAFT: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  REVIEW: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  APPROVED: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
};

const ConstructionPlansPanel: React.FC<{ projectId: string }> = ({ projectId }) => {
  const queryClient = useQueryClient();

  const { data: plans = [] } = useQuery({
    queryKey: ['construction-plans', projectId],
    queryFn: () => projectsApi.getConstructionPlans(projectId),
  });

  const initMutation = useMutation({
    mutationFn: () => projectsApi.initializeConstructionPlans(projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['construction-plans', projectId] });
      toast.success(t('common.saved'));
    },
    onError: () => toast.error(t('common.operationError')),
  });

  const updateMutation = useMutation({
    mutationFn: ({ planId, data }: { planId: string; data: Partial<ConstructionPlan> }) =>
      projectsApi.updateConstructionPlan(projectId, planId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['construction-plans', projectId] });
      toast.success(t('common.saved'));
    },
    onError: () => {
      toast.error(t('common.operationError'));
    },
  });

  const planByType = new Map(plans.map(p => [p.planType, p]));
  const hasPlans = plans.length > 0;

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
          {t('projects.constructionPlans.title')}
        </h3>
        {!hasPlans && (
          <Button size="sm" variant="ghost" onClick={() => initMutation.mutate()} loading={initMutation.isPending}>
            <Plus size={14} className="mr-1" /> {t('common.create')}
          </Button>
        )}
      </div>

      <div className="space-y-2">
        {PLAN_TYPES.map(type => {
          const plan = planByType.get(type);
          const status: ConstructionPlanStatus = plan?.status ?? 'NOT_STARTED';
          return (
            <div
              key={type}
              className="flex items-center justify-between p-3 rounded-lg border border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <FileText size={16} className="text-neutral-500 dark:text-neutral-400" />
                <div>
                  <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
                    {t(`projects.constructionPlans.types.${type}`)}
                  </p>
                  {plan?.author && (
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      {plan.author}{plan.version > 1 ? ` (v${plan.version})` : ''}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[status]}`}>
                  {t(`projects.constructionPlans.statuses.${status}`)}
                </span>
                {plan && status !== 'APPROVED' && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      const nextStatus: Record<string, ConstructionPlanStatus> = {
                        NOT_STARTED: 'DRAFT',
                        DRAFT: 'REVIEW',
                        REVIEW: 'APPROVED',
                      };
                      const next = nextStatus[status];
                      if (next) updateMutation.mutate({ planId: plan.id, data: { status: next } });
                    }}
                  >
                    <Upload size={13} className="mr-1" />
                    {t('projects.constructionPlans.advance')}
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ConstructionPlansPanel;
