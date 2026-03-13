import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface OnboardingStep {
  id: string;
  completed: boolean;
}

interface OnboardingState {
  // Checklist state (existing)
  dismissed: boolean;
  steps: OnboardingStep[];
  completeStep: (stepId: string) => void;
  dismiss: () => void;
  reset: () => void;
  isAllComplete: () => boolean;

  // Welcome overlay state (new)
  hasCompletedOnboarding: boolean;
  currentStep: number;
  totalSteps: number;
  nextStep: () => void;
  prevStep: () => void;
  skipOnboarding: () => void;
  completeOnboarding: () => void;
}

const TOTAL_OVERLAY_STEPS = 5;

const initialSteps: OnboardingStep[] = [
  { id: 'view-projects', completed: false },
  { id: 'create-task', completed: false },
  { id: 'explore-documents', completed: false },
  { id: 'check-analytics', completed: false },
];

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set, get) => ({
      // Checklist
      dismissed: false,
      steps: initialSteps,

      completeStep: (stepId) => {
        set((state) => ({
          steps: state.steps.map((s) =>
            s.id === stepId ? { ...s, completed: true } : s,
          ),
        }));
      },

      dismiss: () => set({ dismissed: true }),

      reset: () =>
        set({
          dismissed: false,
          steps: initialSteps,
          hasCompletedOnboarding: false,
          currentStep: 0,
        }),

      isAllComplete: () => get().steps.every((s) => s.completed),

      // Welcome overlay
      hasCompletedOnboarding: false,
      currentStep: 0,
      totalSteps: TOTAL_OVERLAY_STEPS,

      nextStep: () => {
        const { currentStep } = get();
        if (currentStep < TOTAL_OVERLAY_STEPS - 1) {
          set({ currentStep: currentStep + 1 });
        }
      },

      prevStep: () => {
        const { currentStep } = get();
        if (currentStep > 0) {
          set({ currentStep: currentStep - 1 });
        }
      },

      skipOnboarding: () => set({ hasCompletedOnboarding: true, currentStep: 0 }),

      completeOnboarding: () => set({ hasCompletedOnboarding: true, currentStep: 0 }),
    }),
    {
      name: 'privod-onboarding',
      partialize: (state) => ({
        dismissed: state.dismissed,
        steps: state.steps,
        hasCompletedOnboarding: state.hasCompletedOnboarding,
      }),
    },
  ),
);
