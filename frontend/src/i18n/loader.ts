// =============================================================================
// PRIVOD NEXT -- i18n Lazy Loader
// Loads translation bundles on demand via dynamic import() for code splitting.
// Each locale becomes its own chunk — only the active language is loaded.
// =============================================================================

import type { TranslationKeys } from './ru';

export type { TranslationKeys };

/**
 * In-memory cache of already-loaded locale bundles.
 * Prevents redundant dynamic imports on repeated locale switches.
 */
const cache = new Map<string, TranslationKeys>();

/**
 * Loads the translation bundle for the given locale.
 * Returns a cached bundle if already loaded.
 * Uses dynamic import() so Vite/Rollup can split each locale into its own chunk.
 */
export async function loadLocale(locale: 'ru' | 'en'): Promise<TranslationKeys> {
  const cached = cache.get(locale);
  if (cached) return cached;

  let bundle: TranslationKeys;

  if (locale === 'ru') {
    const mod = await import('./ru');
    bundle = mod.ru as TranslationKeys;
  } else {
    const mod = await import('./en');
    bundle = mod.en;
  }

  cache.set(locale, bundle);
  return bundle;
}

/**
 * Synchronously retrieve a locale bundle that was previously loaded.
 * Returns undefined if the bundle has not been loaded yet.
 */
export function getCachedLocale(locale: string): TranslationKeys | undefined {
  return cache.get(locale);
}

/**
 * Pre-seed the cache (used during SSR or testing when dynamic import is unavailable).
 */
export function seedCache(locale: string, bundle: TranslationKeys): void {
  cache.set(locale, bundle);
}
