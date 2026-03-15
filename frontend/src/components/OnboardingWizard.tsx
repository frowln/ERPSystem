import React, { useState, useCallback } from 'react';
import { Rocket, FolderPlus, Users, X } from 'lucide-react';
import { Button } from '@/design-system/components/Button';
import { FormField, Input, Select } from '@/design-system/components/FormField';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';
import { projectsApi } from '@/api/projects';
import toast from 'react-hot-toast';
import type { ProjectType } from '@/types';

interface OnboardingWizardProps {
  onComplete: () => void;
}

const TOTAL_STEPS = 3;

const STORAGE_KEY = 'privod-onboarding-complete';

function markComplete() {
  localStorage.setItem(STORAGE_KEY, 'true');
}

/* ---------- Step Dots ---------- */

const StepDots: React.FC<{ current: number }> = ({ current }) => (
  <div className="flex items-center justify-center gap-2 mb-6">
    {Array.from({ length: TOTAL_STEPS }, (_, i) => (
      <div
        key={i}
        className={cn(
          'rounded-full transition-all duration-300',
          i === current
            ? 'w-6 h-2 bg-primary-600 dark:bg-primary-500'
            : i < current
              ? 'w-2 h-2 bg-primary-300 dark:bg-primary-700'
              : 'w-2 h-2 bg-neutral-200 dark:bg-neutral-700',
        )}
      />
    ))}
    <span className="sr-only">
      {t('onboarding.stepOf', { step: String(current + 1), total: String(TOTAL_STEPS) })}
    </span>
  </div>
);

/* ---------- Step Icons ---------- */

const STEP_ICONS: React.ElementType[] = [Rocket, FolderPlus, Users];
const STEP_ICON_BG = [
  'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400',
  'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
  'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
];

/* ============================================================
 *  Main Wizard Component
 * ============================================================ */

const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ onComplete }) => {
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [projectName, setProjectName] = useState('');
  const [projectType, setProjectType] = useState('');
  const [emails, setEmails] = useState('');
  const [creating, setCreating] = useState(false);

  const handleClose = useCallback(() => {
    markComplete();
    onComplete();
  }, [onComplete]);

  const handleSkip = useCallback(() => {
    markComplete();
    onComplete();
  }, [onComplete]);

  const handleNext = useCallback(() => {
    if (step < 2) {
      setStep((s) => (s + 1) as 0 | 1 | 2);
    }
  }, [step]);

  const handleCreateProject = useCallback(async () => {
    if (!projectName.trim()) {
      handleNext();
      return;
    }
    setCreating(true);
    try {
      await projectsApi.createProject({
        name: projectName.trim(),
        type: (projectType || 'RESIDENTIAL') as ProjectType,
        // status PLANNING is set by the backend default
      });
      toast.success(t('onboarding.projectCreated'));
      handleNext();
    } catch {
      toast.error(t('common.error'));
    } finally {
      setCreating(false);
    }
  }, [projectName, projectType, handleNext]);

  const handleFinish = useCallback(() => {
    // Invite emails (optional) — fire-and-forget or skip
    // In the future this could POST each email to /api/organizations/invite
    markComplete();
    onComplete();
  }, [onComplete]);

  const projectTypeOptions = [
    { value: 'RESIDENTIAL', label: t('onboarding.residential') },
    { value: 'COMMERCIAL', label: t('onboarding.commercial') },
    { value: 'INDUSTRIAL', label: t('onboarding.industrial') },
    { value: 'INFRASTRUCTURE', label: t('onboarding.infrastructure') },
  ];

  const Icon = STEP_ICONS[step];
  const titles = [
    t('onboarding.welcome'),
    t('onboarding.createProject'),
    t('onboarding.inviteTeam'),
  ];
  const descriptions = [
    t('onboarding.welcomeDesc'),
    t('onboarding.createProjectDesc'),
    t('onboarding.inviteTeamDesc'),
  ];

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={t('onboarding.welcome')}
    >
      <div className="relative w-full max-w-lg mx-4 bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl overflow-hidden">
        {/* Close / Skip (X) button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-1.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors z-10"
          aria-label={t('common.close')}
        >
          <X size={18} />
        </button>

        <div className="px-6 pt-8 pb-6 sm:px-8 sm:pt-10 sm:pb-8">
          {/* Step dots */}
          <StepDots current={step} />

          {/* Icon */}
          <div
            className={cn(
              'w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-5',
              STEP_ICON_BG[step],
            )}
          >
            <Icon size={28} />
          </div>

          {/* Title */}
          <h2 className="text-xl sm:text-2xl font-semibold text-neutral-900 dark:text-neutral-100 text-center mb-2">
            {titles[step]}
          </h2>

          {/* Description */}
          <p className="text-sm sm:text-base text-neutral-500 dark:text-neutral-400 text-center leading-relaxed max-w-md mx-auto mb-6">
            {descriptions[step]}
          </p>

          {/* Step-specific content */}
          {step === 1 && (
            <div className="space-y-4 mb-6">
              <FormField label={t('onboarding.projectName')}>
                <Input
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder={t('onboarding.projectName')}
                  autoFocus
                />
              </FormField>
              <FormField label={t('onboarding.projectType')}>
                <Select
                  value={projectType}
                  onChange={(e) => setProjectType(e.target.value)}
                  options={projectTypeOptions}
                  placeholder={t('onboarding.projectType')}
                />
              </FormField>
            </div>
          )}

          {step === 2 && (
            <div className="mb-6">
              <FormField label={t('onboarding.inviteEmails')}>
                <Input
                  value={emails}
                  onChange={(e) => setEmails(e.target.value)}
                  placeholder="user@example.com, user2@example.com"
                  autoFocus
                />
              </FormField>
            </div>
          )}

          {/* Step counter text */}
          <p className="text-xs text-neutral-400 dark:text-neutral-500 text-center mb-4">
            {t('onboarding.stepOf', { step: String(step + 1), total: String(TOTAL_STEPS) })}
          </p>

          {/* Footer buttons */}
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={handleSkip}
              className="text-sm text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors"
            >
              {t('onboarding.skip')}
            </button>

            {step === 0 && (
              <Button onClick={handleNext}>
                {t('onboarding.next')}
              </Button>
            )}

            {step === 1 && (
              <Button
                onClick={handleCreateProject}
                loading={creating}
              >
                {t('onboarding.next')}
              </Button>
            )}

            {step === 2 && (
              <Button onClick={handleFinish}>
                {t('onboarding.finish')}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingWizard;
