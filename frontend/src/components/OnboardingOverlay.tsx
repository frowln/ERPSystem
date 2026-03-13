import React, { useEffect, useCallback } from 'react';
import {
  Rocket,
  LayoutDashboard,
  FolderPlus,
  FileText,
  LifeBuoy,
  ArrowRight,
  ArrowLeft,
  X,
  ChevronRight,
  Wallet,
  ShieldCheck,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { Button } from '@/design-system/components/Button';

// ---------------------------------------------------------------------------
// Step configuration
// ---------------------------------------------------------------------------

interface StepDef {
  icon: React.ElementType;
  iconBg: string;
  titleKey: string;
  descKey: string;
  highlights: { iconEl: React.ElementType; labelKey: string }[];
}

const getSteps = (): StepDef[] => [
  {
    icon: Rocket,
    iconBg: 'bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400',
    titleKey: 'onboarding.overlay.step1Title',
    descKey: 'onboarding.overlay.step1Desc',
    highlights: [],
  },
  {
    icon: LayoutDashboard,
    iconBg: 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400',
    titleKey: 'onboarding.overlay.step2Title',
    descKey: 'onboarding.overlay.step2Desc',
    highlights: [
      { iconEl: FolderPlus, labelKey: 'onboarding.overlay.navProjects' },
      { iconEl: Wallet, labelKey: 'onboarding.overlay.navFinance' },
      { iconEl: FileText, labelKey: 'onboarding.overlay.navDocuments' },
    ],
  },
  {
    icon: FolderPlus,
    iconBg: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400',
    titleKey: 'onboarding.overlay.step3Title',
    descKey: 'onboarding.overlay.step3Desc',
    highlights: [
      { iconEl: ChevronRight, labelKey: 'onboarding.overlay.projectTip1' },
      { iconEl: ChevronRight, labelKey: 'onboarding.overlay.projectTip2' },
      { iconEl: ChevronRight, labelKey: 'onboarding.overlay.projectTip3' },
    ],
  },
  {
    icon: FileText,
    iconBg: 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400',
    titleKey: 'onboarding.overlay.step4Title',
    descKey: 'onboarding.overlay.step4Desc',
    highlights: [
      { iconEl: FileText, labelKey: 'onboarding.overlay.featureDocs' },
      { iconEl: Wallet, labelKey: 'onboarding.overlay.featureFinance' },
      { iconEl: ShieldCheck, labelKey: 'onboarding.overlay.featureSafety' },
    ],
  },
  {
    icon: LifeBuoy,
    iconBg: 'bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400',
    titleKey: 'onboarding.overlay.step5Title',
    descKey: 'onboarding.overlay.step5Desc',
    highlights: [
      { iconEl: ChevronRight, labelKey: 'onboarding.overlay.helpTip1' },
      { iconEl: ChevronRight, labelKey: 'onboarding.overlay.helpTip2' },
      { iconEl: ChevronRight, labelKey: 'onboarding.overlay.helpTip3' },
    ],
  },
];

// ---------------------------------------------------------------------------
// Progress dots
// ---------------------------------------------------------------------------

const ProgressDots: React.FC<{ total: number; current: number }> = ({
  total,
  current,
}) => (
  <div className="flex items-center gap-2" role="progressbar" aria-valuenow={current + 1} aria-valuemin={1} aria-valuemax={total}>
    {Array.from({ length: total }, (_, i) => (
      <button
        key={i}
        aria-label={`${t('onboarding.overlay.step')} ${i + 1}`}
        className={cn(
          'rounded-full transition-all duration-300',
          i === current
            ? 'w-6 h-2 bg-primary-500'
            : 'w-2 h-2 bg-neutral-300 dark:bg-neutral-600 hover:bg-neutral-400 dark:hover:bg-neutral-500',
        )}
      />
    ))}
  </div>
);

// ---------------------------------------------------------------------------
// OnboardingOverlay
// ---------------------------------------------------------------------------

const OnboardingOverlay: React.FC = () => {
  const {
    hasCompletedOnboarding,
    currentStep,
    totalSteps,
    nextStep,
    prevStep,
    skipOnboarding,
    completeOnboarding,
  } = useOnboardingStore();

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (hasCompletedOnboarding) return;
      if (e.key === 'Escape') {
        skipOnboarding();
      } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
        if (currentStep < totalSteps - 1) {
          nextStep();
        } else {
          completeOnboarding();
        }
      } else if (e.key === 'ArrowLeft') {
        prevStep();
      }
    },
    [hasCompletedOnboarding, currentStep, totalSteps, nextStep, prevStep, skipOnboarding, completeOnboarding],
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Prevent body scroll while overlay is open
  useEffect(() => {
    if (!hasCompletedOnboarding) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [hasCompletedOnboarding]);

  if (hasCompletedOnboarding) return null;

  const steps = getSteps();
  const step = steps[currentStep];
  const Icon = step.icon;
  const isLastStep = currentStep === totalSteps - 1;

  return (
    <div
      className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label={t('onboarding.overlay.ariaLabel')}
    >
      {/* Card */}
      <div className="relative w-full max-w-lg mx-4 sm:mx-auto bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl overflow-hidden">
        {/* Skip button */}
        <button
          onClick={skipOnboarding}
          className="absolute top-4 right-4 p-1.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors z-10"
          aria-label={t('onboarding.overlay.skip')}
        >
          <X size={18} />
        </button>

        {/* Gradient header */}
        <div className="px-6 pt-8 pb-4 sm:px-8 sm:pt-10">
          {/* Icon */}
          <div
            className={cn(
              'w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-5',
              step.iconBg,
            )}
          >
            <Icon size={28} />
          </div>

          {/* Title */}
          <h2 className="text-xl sm:text-2xl font-semibold text-neutral-900 dark:text-neutral-100 text-center mb-2">
            {t(step.titleKey)}
          </h2>

          {/* Description */}
          <p className="text-sm sm:text-base text-neutral-500 dark:text-neutral-400 text-center leading-relaxed max-w-md mx-auto">
            {t(step.descKey)}
          </p>
        </div>

        {/* Highlights */}
        {step.highlights.length > 0 && (
          <div className="px-6 sm:px-8 pb-2">
            <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-xl p-4 space-y-3">
              {step.highlights.map((h, idx) => {
                const HIcon = h.iconEl;
                return (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="mt-0.5 flex-shrink-0">
                      <HIcon size={16} className="text-primary-500 dark:text-primary-400" />
                    </div>
                    <span className="text-sm text-neutral-700 dark:text-neutral-300">
                      {t(h.labelKey)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 sm:px-8 pt-4 pb-6 sm:pb-8">
          {/* Progress */}
          <div className="flex justify-center mb-5">
            <ProgressDots total={totalSteps} current={currentStep} />
          </div>

          {/* Step counter */}
          <p className="text-xs text-neutral-400 dark:text-neutral-500 text-center mb-4">
            {t('onboarding.overlay.stepOf', {
              current: String(currentStep + 1),
              total: String(totalSteps),
            })}
          </p>

          {/* Buttons */}
          <div className="flex items-center justify-between gap-3">
            <div>
              {currentStep > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={prevStep}
                  iconLeft={<ArrowLeft size={16} />}
                >
                  {t('onboarding.overlay.prev')}
                </Button>
              )}
            </div>

            <div className="flex items-center gap-3">
              {!isLastStep && (
                <button
                  onClick={skipOnboarding}
                  className="text-sm text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors"
                >
                  {t('onboarding.overlay.skip')}
                </button>
              )}
              <Button
                size="sm"
                onClick={isLastStep ? completeOnboarding : nextStep}
                iconRight={isLastStep ? undefined : <ArrowRight size={16} />}
              >
                {isLastStep
                  ? t('onboarding.overlay.getStarted')
                  : t('onboarding.overlay.next')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingOverlay;
