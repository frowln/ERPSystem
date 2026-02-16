// @vitest-environment jsdom
import { describe, expect, it, beforeEach } from 'vitest';
import { useSidebarStore } from './sidebarStore';

describe('sidebarStore', () => {
  beforeEach(() => {
    useSidebarStore.getState().setCollapsed(false);
    useSidebarStore.getState().setMobileOpen(false);
  });

  it('toggle flips collapsed state', () => {
    expect(useSidebarStore.getState().collapsed).toBe(false);
    useSidebarStore.getState().toggle();
    expect(useSidebarStore.getState().collapsed).toBe(true);
    useSidebarStore.getState().toggle();
    expect(useSidebarStore.getState().collapsed).toBe(false);
  });

  it('setCollapsed sets exact value', () => {
    useSidebarStore.getState().setCollapsed(true);
    expect(useSidebarStore.getState().collapsed).toBe(true);
  });

  it('setMobileOpen controls mobile sidebar', () => {
    useSidebarStore.getState().setMobileOpen(true);
    expect(useSidebarStore.getState().mobileOpen).toBe(true);
    useSidebarStore.getState().setMobileOpen(false);
    expect(useSidebarStore.getState().mobileOpen).toBe(false);
  });
});
