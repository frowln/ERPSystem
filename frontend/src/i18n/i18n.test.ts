import { describe, expect, it } from 'vitest';
import { t, getLocale, setLocale, getMessages } from './index';

describe('i18n', () => {
  it('defaults to Russian locale', () => {
    expect(getLocale()).toBe('ru');
  });

  it('translates simple key', () => {
    expect(t('common.save')).toBe('Сохранить');
  });

  it('humanizes missing translation keys', () => {
    expect(t('nonexistent.key')).toBe('Key');
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

  it('does not expose placeholder values equal to dotted i18n keys', () => {
    const messages = getMessages() as Record<string, any>;
    const previous = messages.common.save;
    messages.common.save = 'common.save';
    expect(t('common.save')).toBe('Save');
    messages.common.save = previous;
  });
});
