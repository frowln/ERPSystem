import { describe, expect, it } from 'vitest';
import { cn } from './cn';

describe('cn utility', () => {
  it('merges tailwind classes', () => {
    const result = cn('px-2 py-1', 'px-4');
    // px-4 should replace px-2, py-1 should remain
    expect(result).toContain('px-4');
    expect(result).toContain('py-1');
    expect(result).not.toContain('px-2');
  });

  it('handles conditional classes', () => {
    expect(cn('base', false && 'hidden', 'extra')).toBe('base extra');
  });

  it('handles undefined and null', () => {
    expect(cn('base', undefined, null, 'end')).toBe('base end');
  });

  it('returns empty string for no args', () => {
    expect(cn()).toBe('');
  });

  it('deduplicates conflicting classes', () => {
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
  });
});
