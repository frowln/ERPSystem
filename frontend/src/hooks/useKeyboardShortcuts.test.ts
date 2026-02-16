// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// Mock react-router-dom navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

import { useKeyboardShortcuts } from './useKeyboardShortcuts';

function fireKeyDown(key: string, options: Partial<KeyboardEvent> = {}) {
  const event = new KeyboardEvent('keydown', {
    key,
    bubbles: true,
    cancelable: true,
    ...options,
  });
  document.dispatchEvent(event);
  return event;
}

describe('useKeyboardShortcuts', () => {
  const mockOpenPalette = vi.fn();
  const mockOpenHelp = vi.fn();

  beforeEach(() => {
    vi.useFakeTimers();
    mockNavigate.mockReset();
    mockOpenPalette.mockReset();
    mockOpenHelp.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns shortcut definitions', () => {
    const { result, unmount } = renderHook(() =>
      useKeyboardShortcuts(mockOpenPalette, mockOpenHelp),
    );
    expect(result.current.length).toBeGreaterThan(0);
    expect(result.current.some((s) => s.key === '?')).toBe(true);
    expect(result.current.some((s) => s.key === 'h' && s.chord)).toBe(true);
    unmount();
  });

  it('? key opens shortcuts help', () => {
    const { unmount } = renderHook(() => useKeyboardShortcuts(mockOpenPalette, mockOpenHelp));
    act(() => {
      fireKeyDown('?');
    });
    expect(mockOpenHelp).toHaveBeenCalledTimes(1);
    unmount();
  });

  it('chord g+h navigates to home', () => {
    const { unmount } = renderHook(() => useKeyboardShortcuts(mockOpenPalette, mockOpenHelp));
    act(() => {
      fireKeyDown('g');
    });
    act(() => {
      fireKeyDown('h');
    });
    expect(mockNavigate).toHaveBeenCalledWith('/');
    unmount();
  });

  it('chord g+p navigates to projects', () => {
    const { unmount } = renderHook(() => useKeyboardShortcuts(mockOpenPalette, mockOpenHelp));
    act(() => {
      fireKeyDown('g');
      fireKeyDown('p');
    });
    expect(mockNavigate).toHaveBeenCalledWith('/projects');
    unmount();
  });

  it('chord g+t navigates to tasks', () => {
    const { unmount } = renderHook(() => useKeyboardShortcuts(mockOpenPalette, mockOpenHelp));
    act(() => {
      fireKeyDown('g');
      fireKeyDown('t');
    });
    expect(mockNavigate).toHaveBeenCalledWith('/tasks');
    unmount();
  });

  it('chord g+d navigates to documents', () => {
    const { unmount } = renderHook(() => useKeyboardShortcuts(mockOpenPalette, mockOpenHelp));
    act(() => {
      fireKeyDown('g');
      fireKeyDown('d');
    });
    expect(mockNavigate).toHaveBeenCalledWith('/documents');
    unmount();
  });

  it('chord expires after 500ms', () => {
    const { unmount } = renderHook(() => useKeyboardShortcuts(mockOpenPalette, mockOpenHelp));
    act(() => {
      fireKeyDown('g');
    });
    act(() => {
      vi.advanceTimersByTime(600);
    });
    act(() => {
      fireKeyDown('h');
    });
    // The chord should have expired, so navigate should NOT be called
    expect(mockNavigate).not.toHaveBeenCalled();
    unmount();
  });

  it('ignores shortcuts when typing in input', () => {
    const { unmount } = renderHook(() => useKeyboardShortcuts(mockOpenPalette, mockOpenHelp));
    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();

    const event = new KeyboardEvent('keydown', {
      key: '?',
      bubbles: true,
      cancelable: true,
    });
    Object.defineProperty(event, 'target', { value: input });
    act(() => {
      document.dispatchEvent(event);
    });
    expect(mockOpenHelp).not.toHaveBeenCalled();
    document.body.removeChild(input);
    unmount();
  });

  it('ignores shortcuts when modifier keys are held', () => {
    const { unmount } = renderHook(() => useKeyboardShortcuts(mockOpenPalette, mockOpenHelp));
    act(() => {
      fireKeyDown('?', { ctrlKey: true });
    });
    expect(mockOpenHelp).not.toHaveBeenCalled();

    act(() => {
      fireKeyDown('?', { metaKey: true });
    });
    expect(mockOpenHelp).not.toHaveBeenCalled();

    act(() => {
      fireKeyDown('?', { altKey: true });
    });
    expect(mockOpenHelp).not.toHaveBeenCalled();
    unmount();
  });

  it('unmatched chord key does nothing', () => {
    const { unmount } = renderHook(() => useKeyboardShortcuts(mockOpenPalette, mockOpenHelp));
    act(() => {
      fireKeyDown('g');
      fireKeyDown('z'); // not a valid chord
    });
    expect(mockNavigate).not.toHaveBeenCalled();
    unmount();
  });
});
