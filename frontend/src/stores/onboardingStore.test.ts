// @vitest-environment jsdom
import { describe, expect, it, beforeEach } from 'vitest';
import { useOnboardingStore } from './onboardingStore';

describe('onboardingStore', () => {
  beforeEach(() => {
    useOnboardingStore.getState().reset();
  });

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
});
