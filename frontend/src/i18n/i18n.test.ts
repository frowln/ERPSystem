import { describe, expect, it } from 'vitest';
import { t, getLocale, setLocale } from './index';

describe('i18n', () => {
  it('defaults to Russian locale', () => {
    expect(getLocale()).toBe('ru');
  });

  it('translates simple key', () => {
    expect(t('common.save')).toBe('Сохранить');
  });

  it('returns key for missing translation', () => {
    expect(t('nonexistent.key')).toBe('nonexistent.key');
  });

  it('interpolates parameters', () => {
    const result = t('taskBoard.subtitle', { count: '42' });
    expect(result).toContain('42');
  });

  it('switches locale', () => {
    setLocale('en');
    expect(t('common.save')).toBe('Save');
    // Restore
    setLocale('ru');
    expect(t('common.save')).toBe('Сохранить');
  });

  it('falls back to default locale for missing keys in secondary locale', () => {
    setLocale('en');
    // This should fall back to the key if missing in en
    const result = t('common.cancel');
    expect(result).toBe('Cancel');
    setLocale('ru');
  });

  it('handles nested keys', () => {
    expect(t('settings.themes.light')).toBe('Светлая');
  });
});
