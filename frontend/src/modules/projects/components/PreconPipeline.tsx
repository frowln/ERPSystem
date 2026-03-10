import React from 'react';
import { CheckCircle2, Circle, Loader2, AlertOctagon } from 'lucide-react';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';
import type { PreconStageKey } from '@/types';

interface StageInfo {
  key: PreconStageKey;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED';
  completionPercent: number;
}

interface Props {
  stages: StageInfo[];
  onStageClick?: (key: PreconStageKey) => void;
}

const STAGE_LABELS: Record<PreconStageKey, () => string> = {
  LEAD: () => t('projects.preconPipeline.stages.LEAD'),
  FEASIBILITY: () => t('projects.preconPipeline.stages.FEASIBILITY'),
  SITE_ASSESSMENT: () => t('projects.preconPipeline.stages.SITE_ASSESSMENT'),
  SURVEYS: () => t('projects.preconPipeline.stages.SURVEYS'),
  GPZU: () => t('projects.preconPipeline.stages.GPZU'),
  TECHNICAL_CONDITIONS: () => t('projects.preconPipeline.stages.TECHNICAL_CONDITIONS'),
  ENGINEERING_SURVEYS: () => t('projects.preconPipeline.stages.SURVEYS'),
  PROJECT_DESIGN: () => t('projects.preconPipeline.stages.DESIGN_PD'),
  DESIGN_PD: () => t('projects.preconPipeline.stages.DESIGN_PD'),
  EXPERTISE: () => t('projects.preconPipeline.stages.EXPERTISE'),
  PERMITS: () => t('projects.preconPipeline.stages.PERMITS'),
  CONSTRUCTION_PERMITS: () => t('projects.preconPipeline.stages.PERMITS'),
  TENDERS: () => t('projects.preconPipeline.stages.TENDERS'),
  CONTRACTS: () => t('projects.preconPipeline.stages.CONTRACTS'),
  MOBILIZATION: () => t('projects.preconPipeline.stages.MOBILIZATION'),
};

const STATUS_ICON: Record<string, React.ReactNode> = {
  NOT_STARTED: <Circle size={16} className="text-neutral-300 dark:text-neutral-600" />,
  IN_PROGRESS: <Loader2 size={16} className="text-blue-500 animate-spin" />,
  COMPLETED: <CheckCircle2 size={16} className="text-green-500" />,
  BLOCKED: <AlertOctagon size={16} className="text-red-500" />,
};

const STATUS_LINE_COLOR: Record<string, string> = {
  NOT_STARTED: 'bg-neutral-200 dark:bg-neutral-700',
  IN_PROGRESS: 'bg-blue-400',
  COMPLETED: 'bg-green-500',
  BLOCKED: 'bg-red-400',
};

const STATUS_BG: Record<string, string> = {
  NOT_STARTED: 'bg-neutral-50 dark:bg-neutral-800/50 border-neutral-200 dark:border-neutral-700',
  IN_PROGRESS: 'bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800',
  COMPLETED: 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800',
  BLOCKED: 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800',
};

const PreconPipeline: React.FC<Props> = ({ stages, onStageClick }) => {
  const overallDone = stages.filter(s => s.status === 'COMPLETED').length;
  const overallPct = stages.length > 0 ? Math.round((overallDone / stages.length) * 100) : 0;

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
          {t('projects.preconPipeline.title')}
        </h3>
        <span className={cn(
          'text-xs font-bold px-2 py-0.5 rounded-full',
          overallPct === 100
            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
            : overallPct >= 50
              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
              : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400',
        )}>
          {overallDone}/{stages.length}
        </span>
      </div>

      {/* Overall progress bar */}
      <div className="h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden mb-5">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500',
            overallPct === 100 ? 'bg-green-500' : overallPct > 0 ? 'bg-blue-500' : 'bg-neutral-300',
          )}
          style={{ width: `${overallPct}%` }}
        />
      </div>

      {/* Pipeline stages */}
      <div className="flex items-start gap-0 overflow-x-auto pb-2">
        {stages.map((stage, idx) => (
          <React.Fragment key={stage.key}>
            {/* Stage card */}
            <button
              type="button"
              onClick={() => onStageClick?.(stage.key)}
              className={cn(
                'flex flex-col items-center gap-1.5 min-w-[80px] max-w-[90px] p-2 rounded-lg border transition-all',
                STATUS_BG[stage.status],
                onStageClick && 'hover:shadow-sm cursor-pointer',
              )}
            >
              {STATUS_ICON[stage.status]}
              <span className="text-[10px] font-medium text-center leading-tight text-neutral-700 dark:text-neutral-300">
                {STAGE_LABELS[stage.key]()}
              </span>
              {stage.status === 'IN_PROGRESS' && stage.completionPercent > 0 && (
                <span className="text-[9px] tabular-nums text-blue-600 dark:text-blue-400 font-semibold">
                  {stage.completionPercent}%
                </span>
              )}
            </button>
            {/* Connector line */}
            {idx < stages.length - 1 && (
              <div className="flex items-center self-center mt-3 mx-0.5">
                <div className={cn('h-0.5 w-3 rounded-full', STATUS_LINE_COLOR[stage.status])} />
                <div className={cn(
                  'w-0 h-0 border-t-[3px] border-t-transparent border-b-[3px] border-b-transparent border-l-[4px]',
                  stage.status === 'COMPLETED' ? 'border-l-green-500' : stage.status === 'IN_PROGRESS' ? 'border-l-blue-400' : 'border-l-neutral-300 dark:border-l-neutral-600',
                )} />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default PreconPipeline;
