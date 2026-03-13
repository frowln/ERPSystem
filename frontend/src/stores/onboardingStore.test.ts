// @vitest-environment jsdom
import { describe, expect, it, beforeEach } from 'vitest';
import { useOnboardingStore } from './onboardingStore';

describe('onboardingStore', () => {
  beforeEach(() => {
    useOnboardingStore.getState().reset();
  });

  // ---- Checklist (existing) ----

  it('starts with 4 incomplete steps and not dismissed', () => {
    const state = useOnboardingStore.getState();
    expect(state.dismissed).toBe(false);
    expect(state.steps).toHaveLength(4);
    expect(state.steps.every((s) => !s.completed)).toBe(true);
  });

  it('completeStep marks a specific step as completed', () => {
    useOnboardingStore.getState().completeStep('view-projects');
    const steps = useOnboardingStore.getState().steps;
    expect(steps.find((s) => s.id === 'view-projects')?.completed).toBe(true);
    expect(steps.find((s) => s.id === 'create-task')?.completed).toBe(false);
  });

  it('isAllComplete returns false when not all steps done', () => {
    useOnboardingStore.getState().completeStep('view-projects');
    expect(useOnboardingStore.getState().isAllComplete()).toBe(false);
  });

  it('isAllComplete returns true when all steps done', () => {
    const store = useOnboardingStore.getState();
    store.completeStep('view-projects');
    store.completeStep('create-task');
    store.completeStep('explore-documents');
    store.completeStep('check-analytics');
    expect(useOnboardingStore.getState().isAllComplete()).toBe(true);
  });

  it('dismiss sets dismissed to true', () => {
    useOnboardingStore.getState().dismiss();
    expect(useOnboardingStore.getState().dismissed).toBe(true);
  });

  it('reset restores initial state', () => {
    const store = useOnboardingStore.getState();
    store.completeStep('view-projects');
    store.dismiss();
    store.reset();
    const state = useOnboardingStore.getState();
    expect(state.dismissed).toBe(false);
    expect(state.steps.every((s) => !s.completed)).toBe(true);
  });

  // ---- Welcome overlay (new) ----

  it('starts with hasCompletedOnboarding false and step 0', () => {
    const state = useOnboardingStore.getState();
    expect(state.hasCompletedOnboarding).toBe(false);
    expect(state.currentStep).toBe(0);
    expect(state.totalSteps).toBe(5);
  });

  it('nextStep increments currentStep', () => {
    useOnboardingStore.getState().nextStep();
    expect(useOnboardingStore.getState().currentStep).toBe(1);
    useOnboardingStore.getState().nextStep();
    expect(useOnboardingStore.getState().currentStep).toBe(2);
  });

  it('nextStep does not exceed totalSteps - 1', () => {
    const store = useOnboardingStore.getState();
    for (let i = 0; i < 10; i++) store.nextStep();
    expect(useOnboardingStore.getState().currentStep).toBe(4);
  });

  it('prevStep decrements currentStep', () => {
    const store = useOnboardingStore.getState();
    store.nextStep();
    store.nextStep();
    store.prevStep();
    expect(useOnboardingStore.getState().currentStep).toBe(1);
  });

  it('prevStep does not go below 0', () => {
    useOnboardingStore.getState().prevStep();
    expect(useOnboardingStore.getState().currentStep).toBe(0);
  });

  it('skipOnboarding marks completed and resets step', () => {
    const store = useOnboardingStore.getState();
    store.nextStep();
    store.nextStep();
    store.skipOnboarding();
    const state = useOnboardingStore.getState();
    expect(state.hasCompletedOnboarding).toBe(true);
    expect(state.currentStep).toBe(0);
  });

  it('completeOnboarding marks completed and resets step', () => {
    const store = useOnboardingStore.getState();
    store.nextStep();
    store.nextStep();
    store.nextStep();
    store.nextStep();
    store.completeOnboarding();
    const state = useOnboardingStore.getState();
    expect(state.hasCompletedOnboarding).toBe(true);
    expect(state.currentStep).toBe(0);
  });

  it('reset also resets overlay state', () => {
    const store = useOnboardingStore.getState();
    store.nextStep();
    store.completeOnboarding();
    store.reset();
    const state = useOnboardingStore.getState();
    expect(state.hasCompletedOnboarding).toBe(false);
    expect(state.currentStep).toBe(0);
  });
});
