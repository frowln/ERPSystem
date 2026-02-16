// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMediaQuery, useIsMobile, useIsTablet } from './useMediaQuery';

describe('useMediaQuery', () => {
  let listeners: Map<string, (e: MediaQueryListEvent) => void>;
  let matchesMap: Map<string, boolean>;

  beforeEach(() => {
    listeners = new Map();
    matchesMap = new Map();

    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: matchesMap.get(query) ?? false,
      media: query,
      addEventListener: (_event: string, handler: (e: MediaQueryListEvent) => void) => {
        listeners.set(query, handler);
      },
      removeEventListener: (_event: string, _handler: (e: MediaQueryListEvent) => void) => {
        listeners.delete(query);
      },
    }));
  });

  it('returns false by default for unmatched query', () => {
    const { result } = renderHook(() => useMediaQuery('(max-width: 768px)'));
    expect(result.current).toBe(false);
  });

  it('returns true when query matches', () => {
    matchesMap.set('(max-width: 768px)', true);
    const { result } = renderHook(() => useMediaQuery('(max-width: 768px)'));
    expect(result.current).toBe(true);
  });

  it('updates when media query changes', () => {
    const { result } = renderHook(() => useMediaQuery('(max-width: 768px)'));
    expect(result.current).toBe(false);

    act(() => {
      const handler = listeners.get('(max-width: 768px)');
      handler?.({ matches: true } as MediaQueryListEvent);
    });
    expect(result.current).toBe(true);
  });
});

describe('useIsMobile', () => {
  beforeEach(() => {
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: query === '(max-width: 768px)',
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
  });

  it('returns true when viewport is mobile-sized', () => {
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(true);
  });
});

describe('useIsTablet', () => {
  beforeEach(() => {
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: query === '(max-width: 1024px)',
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
  });

  it('returns true when viewport is tablet-sized', () => {
    const { result } = renderHook(() => useIsTablet());
    expect(result.current).toBe(true);
  });
});
