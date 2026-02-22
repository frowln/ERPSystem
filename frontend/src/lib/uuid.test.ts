// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { asUuidOrUndefined, isUuid } from './uuid';

describe('uuid helpers', () => {
  it('validates UUID values', () => {
    expect(isUuid('61130180-7545-4272-b172-82c9125bb31c')).toBe(true);
    expect(isUuid('not-a-uuid')).toBe(false);
    expect(isUuid('')).toBe(false);
    expect(isUuid(undefined)).toBe(false);
  });

  it('normalizes UUID values and rejects invalid strings', () => {
    expect(asUuidOrUndefined(' 61130180-7545-4272-b172-82c9125bb31c ')).toBe('61130180-7545-4272-b172-82c9125bb31c');
    expect(asUuidOrUndefined('demo-user-id')).toBeUndefined();
    expect(asUuidOrUndefined(null)).toBeUndefined();
  });
});
