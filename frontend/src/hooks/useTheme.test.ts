// @vitest-environment jsdom
import { describe, it, expect, beforeEach, beforeAll } from 'vitest';

// Polyfill matchMedia for jsdom (useTheme.ts has top-level side effects)
const matchMediaMock = (query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: () => {},
  removeListener: () => {},
  addEventListener: () => {},
  removeEventListener: () => {},
  dispatchEvent: () => false,
});

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  configurable: true,
  value: matchMediaMock,
});

describe('useThemeStore', () => {
  let useThemeStore: typeof import('./useTheme').useThemeStore;

  beforeAll(async () => {
    const mod = await import('./useTheme');
    useThemeStore = mod.useThemeStore;
  });

  beforeEach(() => {
    localStorage.clear();
    useThemeStore.setState({ theme: 'light', resolved: 'light' });
    document.documentElement.classList.remove('dark');
    document.documentElement.removeAttribute('data-theme');
    document.body.classList.remove('dark');
    document.body.removeAttribute('data-theme');
  });

  it('initializes with light theme by default', () => {
    const state = useThemeStore.getState();
    expect(state.theme).toBe('light');
    expect(state.resolved).toBe('light');
  });

  it('setTheme("dark") updates state and applies class', () => {
    useThemeStore.getState().setTheme('dark');

    const state = useThemeStore.getState();
    expect(state.theme).toBe('dark');
    expect(state.resolved).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('setTheme("light") removes dark class', () => {
    useThemeStore.getState().setTheme('dark');
    useThemeStore.getState().setTheme('light');

    const state = useThemeStore.getState();
    expect(state.theme).toBe('light');
    expect(state.resolved).toBe('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('persists theme to localStorage', () => {
    useThemeStore.getState().setTheme('dark');
    expect(localStorage.getItem('privod_theme')).toBe('dark');

    useThemeStore.getState().setTheme('light');
    expect(localStorage.getItem('privod_theme')).toBe('light');
  });

  it('setTheme("system") resolves to light when matchMedia returns false', () => {
    useThemeStore.getState().setTheme('system');

    const state = useThemeStore.getState();
    expect(state.theme).toBe('system');
    expect(state.resolved).toBe('light');
  });

  it('toggles between themes correctly', () => {
    const { setTheme } = useThemeStore.getState();

    setTheme('dark');
    expect(useThemeStore.getState().resolved).toBe('dark');

    setTheme('light');
    expect(useThemeStore.getState().resolved).toBe('light');
  });

  it('applies theme to document body', () => {
    useThemeStore.getState().setTheme('dark');
    expect(document.body.classList.contains('dark')).toBe(true);
    expect(document.body.getAttribute('data-theme')).toBe('dark');
  });
});
