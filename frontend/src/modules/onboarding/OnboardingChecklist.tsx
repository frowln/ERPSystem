import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FolderKanban,
  ClipboardList,
  FileText,
  BarChart3,
  CheckCircle2,
  Circle,
  X,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';
import { useOnboardingStore } from '@/stores/onboardingStore';

interface StepConfig {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  href: string;
}

const getStepConfigs = (): StepConfig[] => [
  {
    id: 'view-projects',
    title: t('onboarding.stepViewProjects'),
    description: t('onboarding.stepViewProjectsDesc'),
    icon: FolderKanban,
    href: '/projects',
  },
  {
    id: 'create-task',
    title: t('onboarding.stepCreateTask'),
    description: t('onboarding.stepCreateTaskDesc'),
    icon: ClipboardList,
    href: '/tasks',
  },
  {
    id: 'explore-documents',
    title: t('onboarding.stepExploreDocuments'),
    description: t('onboarding.stepExploreDocumentsDesc'),
    icon: FileText,
    href: '/documents',
  },
  {
    id: 'check-analytics',
    title: t('onboarding.stepCheckAnalytics'),
    description: t('onboarding.stepCheckAnalyticsDesc'),
    icon: BarChart3,
    href: '/analytics',
  },
];

export const OnboardingChecklist: React.FC = () => {
  const navigate = useNavigate();
  const { steps, dismissed, completeStep, dismiss, isAllComplete } = useOnboardingStore();

  const handleStepClick = useCallback(
    (step: StepConfig) => {
      completeStep(step.id);
      navigate(step.href);
    },
    [completeStep, navigate],
  );

  if (dismissed || isAllComplete()) return null;

  const completedCount = steps.filter((s) => s.completed).length;
  const progressPercent = Math.round((completedCount / steps.length) * 100);
  const stepConfigs = getStepConfigs();

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 dark:border-neutral-800 p-5 mb-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center">
            <Sparkles size={20} className="text-primary-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              {t('onboarding.welcomeTitle')}
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              {t('onboarding.progressLabel', { completed: completedCount, total: steps.length })}
            </p>
          </div>
        </div>
        <button
          onClick={dismiss}
          aria-label={t('common.close')}
          className="p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 dark:hover:bg-neutral-800 transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full mb-4 overflow-hidden">
        <div
          className="h-full bg-primary-500 rounded-full transition-all duration-500"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Steps */}
      <div className="space-y-1">
        {stepConfigs.map((config) => {
          const step = steps.find((s) => s.id === config.id);
          const isCompleted = step?.completed ?? false;
          const Icon = config.icon;

          return (
            <button
              key={config.id}
              onClick={() => handleStepClick(config)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors',
                isCompleted
                  ? 'bg-success-50 dark:bg-success-500/10'
                  : 'hover:bg-neutral-50 dark:hover:bg-neutral-800 dark:hover:bg-neutral-800',
              )}
            >
              {isCompleted ? (
                <CheckCircle2 size={18} className="text-success-500 flex-shrink-0" />
              ) : (
                <Circle size={18} className="text-neutral-300 dark:text-neutral-600 flex-shrink-0" />
              )}
              <Icon
                size={16}
                className={cn(
                  'flex-shrink-0',
                  isCompleted ? 'text-success-600' : 'text-neutral-400',
                )}
              />
              <div className="flex-1 min-w-0">
                <p
                  className={cn(
                    'text-sm font-medium',
                    isCompleted
                      ? 'text-success-700 dark:text-success-400 line-through'
                      : 'text-neutral-700 dark:text-neutral-300 dark:text-neutral-200',
                  )}
                >
                  {config.title}
                </p>
                {!isCompleted && (
                  <p className="text-xs text-neutral-400 mt-0.5 truncate">
                    {config.description}
                  </p>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
