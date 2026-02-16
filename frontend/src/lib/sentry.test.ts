import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock @sentry/react before importing
vi.mock('@sentry/react', () => ({
  init: vi.fn(),
  captureException: vi.fn(),
  captureMessage: vi.fn(),
}));

describe('sentry', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv('VITE_SENTRY_DSN', '');
  });

  it('exports initSentry function', async () => {
    const { initSentry } = await import('./sentry');
    expect(typeof initSentry).toBe('function');
  });

  it('exports Sentry namespace', async () => {
    const { Sentry } = await import('./sentry');
    expect(Sentry).toBeDefined();
    expect(typeof Sentry.captureException).toBe('function');
  });

  it('does not throw when DSN is not set', async () => {
    const { initSentry } = await import('./sentry');
    expect(() => initSentry()).not.toThrow();
  });
});
