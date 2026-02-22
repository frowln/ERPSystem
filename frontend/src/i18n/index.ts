// =============================================================================
// PRIVOD NEXT -- i18n Infrastructure
// Lightweight translation system with type-safe keys
// =============================================================================

import { ru, type TranslationKeys } from './ru';
import { en } from './en';

// ---------------------------------------------------------------------------
// Supported locales
// ---------------------------------------------------------------------------
export type Locale = 'ru' | 'en';

export const SUPPORTED_LOCALES: readonly Locale[] = ['ru', 'en'] as const;

export const LOCALE_LABELS: Record<Locale, string> = {
  ru: 'Русский',
  en: 'English',
};

export const DEFAULT_LOCALE: Locale = 'ru';

// ---------------------------------------------------------------------------
// Message catalog
// ---------------------------------------------------------------------------
const messages: Record<Locale, TranslationKeys> = {
  ru,
  en,
};

// ---------------------------------------------------------------------------
// Current locale state
// ---------------------------------------------------------------------------
const STORAGE_KEY = 'privod_locale';

let currentLocale: Locale = getInitialLocale();

function getInitialLocale(): Locale {
  if (typeof window === 'undefined') return DEFAULT_LOCALE;

  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored && SUPPORTED_LOCALES.includes(stored as Locale)) {
    return stored as Locale;
  }

  // Try to detect from browser language
  const browserLang = navigator.language.split('-')[0];
  if (SUPPORTED_LOCALES.includes(browserLang as Locale)) {
    return browserLang as Locale;
  }

  return DEFAULT_LOCALE;
}

// ---------------------------------------------------------------------------
// Locale getters/setters
// ---------------------------------------------------------------------------
export function getLocale(): Locale {
  return currentLocale;
}

export function setLocale(locale: Locale): void {
  if (!SUPPORTED_LOCALES.includes(locale)) {
    console.warn(`Unsupported locale: ${locale}. Falling back to ${DEFAULT_LOCALE}.`);
    locale = DEFAULT_LOCALE;
  }
  currentLocale = locale;
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, locale);
    document.documentElement.lang = locale;
  }

  // Notify subscribers
  listeners.forEach((fn) => fn(locale));
}

// ---------------------------------------------------------------------------
// Subscription for reactive updates
// ---------------------------------------------------------------------------
type LocaleListener = (locale: Locale) => void;
const listeners = new Set<LocaleListener>();

export function onLocaleChange(fn: LocaleListener): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

// ---------------------------------------------------------------------------
// Translation function
// ---------------------------------------------------------------------------

/**
 * Resolve a dot-separated key path from a nested object.
 *
 * Example:
 *   resolve(messages.ru, 'projects.title') => 'Проекты'
 */
function resolve(obj: Record<string, unknown>, path: string): string | undefined {
  const parts = path.split('.');
  let current: unknown = obj;

  for (const part of parts) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return undefined;
    }
    current = (current as Record<string, unknown>)[part];
  }

  return typeof current === 'string' ? current : undefined;
}

/**
 * Human-friendly fallback for missing translation keys.
 * Turns `commercialProposal.colCostPrice` -> `Cost price` instead of showing the raw key.
 */
function humanizeMissingKey(key: string, locale: Locale): string {
  const segment = key.split('.').pop() || key;
  const normalized = segment
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!normalized) {
    return locale === 'ru' ? 'Нет перевода' : 'Missing translation';
  }

  const base = normalized.toLowerCase();
  return base.charAt(0).toUpperCase() + base.slice(1);
}

/**
 * Some dictionaries can accidentally contain placeholder values equal to the key
 * path (e.g. "estimates.list.title"). Treat them as missing translations.
 */
function isPlaceholderValue(value: string | undefined, key: string): boolean {
  if (!value) return true;
  if (value === key) return true;
  return /^[a-z][a-z0-9]*(\.[a-z0-9_-]+)+$/i.test(value);
}

/**
 * Translate a key with optional parameter interpolation.
 *
 * Usage:
 *   t('projects.title')                 => 'Проекты'
 *   t('table.selectedCount', { count: '5' }) => 'Выбрано: 5'
 *   t('error.invalid_state_transition', { '0': 'Draft', '1': 'Active' })
 *
 * Interpolation replaces `{paramName}` in the translation string.
 */
export function t(key: string, params?: Record<string, string | number>): string {
  let value = resolve(messages[currentLocale] as unknown as Record<string, unknown>, key);
  if (isPlaceholderValue(value, key)) {
    value = undefined;
  }

  // Fallback to default locale
  if (value === undefined && currentLocale !== DEFAULT_LOCALE) {
    value = resolve(messages[DEFAULT_LOCALE] as unknown as Record<string, unknown>, key);
    if (isPlaceholderValue(value, key)) {
      value = undefined;
    }
  }

  // Fallback to key itself
  // Never expose raw keys like `commercialProposal.colCostPrice` in UI.
  if (value === undefined) {
    if (import.meta.env?.DEV) {
      console.warn(`Missing translation key: "${key}" for locale "${currentLocale}"`);
    }
    return humanizeMissingKey(key, currentLocale);
  }

  // Interpolate parameters
  if (params) {
    for (const [paramKey, paramValue] of Object.entries(params)) {
      value = value.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(paramValue));
    }
  }

  return value;
}

// ---------------------------------------------------------------------------
// React hook
// ---------------------------------------------------------------------------
import { useState, useEffect, useCallback } from 'react';

/**
 * React hook for locale management with automatic re-renders on locale change.
 *
 * Usage:
 *   const { locale, setLocale, t } = useLocale();
 */
export function useLocale() {
  const [locale, setLocaleState] = useState<Locale>(currentLocale);

  useEffect(() => {
    const unsubscribe = onLocaleChange((newLocale) => {
      setLocaleState(newLocale);
    });
    return unsubscribe;
  }, []);

  const changeLocale = useCallback((newLocale: Locale) => {
    setLocale(newLocale);
  }, []);

  return {
    locale,
    setLocale: changeLocale,
    t,
  };
}

// ---------------------------------------------------------------------------
// Utility: get messages object for current locale (for direct access)
// ---------------------------------------------------------------------------
export function getMessages(): TranslationKeys {
  return messages[currentLocale];
}

// ---------------------------------------------------------------------------
// Re-exports
// ---------------------------------------------------------------------------
export type { TranslationKeys };
export { ru, en };
