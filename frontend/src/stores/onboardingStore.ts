import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface OnboardingStep {
  id: string;
  completed: boolean;
}

interface OnboardingState {
  dismissed: boolean;
  steps: OnboardingStep[];
  completeStep: (stepId: string) => void;
  dismiss: () => void;
  reset: () => void;
  isAllComplete: () => boolean;
}

const initialSteps: OnboardingStep[] = [
  { id: 'view-projects', completed: false },
  { id: 'create-task', completed: false },
  { id: 'explore-documents', completed: false },
  { id: 'check-analytics', completed: false },
];

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set, get) => ({
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

      reset: () => set({ dismissed: false, steps: initialSteps }),

      isAllComplete: () => get().steps.every((s) => s.completed),
    }),
    {
      name: 'privod-onboarding',
    },
  ),
);
