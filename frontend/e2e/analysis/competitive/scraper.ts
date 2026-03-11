/**
 * Competitive intelligence scraper.
 *
 * Uses a Playwright Page to visit competitor websites and extract feature
 * information. Results are cached locally (24h TTL) so repeated runs don't
 * re-scrape blocked or slow sites.
 *
 * Usage:
 *   import { scrapeFeatures, getCachedFeatures } from './scraper';
 *   const features = await scrapeFeatures(page, 'https://procore.com/features', '.feature-card h3');
 */
import type { Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/* ───────────────────── Types ───────────────────── */

export interface ScrapedFeature {
  text: string;
  url: string;
  selector: string;
  scrapedAt: string;
}

export interface CompetitorCache {
  [url: string]: {
    features: ScrapedFeature[];
    scrapedAt: string;
    status: 'ok' | 'blocked' | 'error';
    errorMessage?: string;
  };
}

/* ──────────────── Cache management ────────────── */

const REPORTS_DIR = path.resolve(__dirname, '../../reports');
const CACHE_FILE = path.join(REPORTS_DIR, 'competitor-cache.json');
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

function ensureReportsDir(): void {
  if (!fs.existsSync(REPORTS_DIR)) {
    fs.mkdirSync(REPORTS_DIR, { recursive: true });
  }
}

function readCache(): CompetitorCache {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      return JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'));
    }
  } catch {
    // Corrupted — start fresh
  }
  return {};
}

function writeCache(cache: CompetitorCache): void {
  ensureReportsDir();
  fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2), 'utf-8');
}

function isCacheFresh(scrapedAt: string): boolean {
  const age = Date.now() - new Date(scrapedAt).getTime();
  return age < CACHE_TTL_MS;
}

/* ────────────── Public API ──────────────────── */

/**
 * Get cached features for a URL. Returns `null` if cache is stale or missing.
 */
export function getCachedFeatures(url: string): ScrapedFeature[] | null {
  const cache = readCache();
  const entry = cache[url];
  if (!entry) return null;
  if (!isCacheFresh(entry.scrapedAt)) return null;
  if (entry.status !== 'ok') return null;
  return entry.features;
}

/**
 * Scrape feature text from a competitor website.
 *
 * @param page - Playwright Page instance
 * @param url - Full URL to visit
 * @param selector - CSS selector to extract feature names / text
 * @returns Array of scraped features (or cached results)
 */
export async function scrapeFeatures(
  page: Page,
  url: string,
  selector: string,
): Promise<ScrapedFeature[]> {
  // Check cache first
  const cached = getCachedFeatures(url);
  if (cached) return cached;

  const cache = readCache();
  const now = new Date().toISOString();

  try {
    // Navigate with a short timeout — competitor sites may be slow
    const response = await page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: 15_000,
    });

    const status = response?.status() ?? 0;

    // Handle blocks: 403, 429, captcha pages
    if (status === 403 || status === 429) {
      cache[url] = {
        features: [],
        scrapedAt: now,
        status: 'blocked',
        errorMessage: `HTTP ${status}`,
      };
      writeCache(cache);

      // Fall back to stale cache if available
      const staleEntry = cache[url];
      if (staleEntry?.features?.length) return staleEntry.features;
      return [];
    }

    // Check for captcha / bot detection patterns
    const bodyText = await page.textContent('body').catch(() => '');
    const isCaptcha =
      /captcha|verify you are human|access denied|cloudflare/i.test(bodyText ?? '');
    if (isCaptcha) {
      cache[url] = {
        features: [],
        scrapedAt: now,
        status: 'blocked',
        errorMessage: 'Captcha/bot detection',
      };
      writeCache(cache);
      return [];
    }

    // Extract features using the selector
    const texts = await page.$$eval(selector, (els) =>
      els
        .map((el) => (el.textContent ?? '').trim())
        .filter((t) => t.length > 0 && t.length < 500),
    );

    const features: ScrapedFeature[] = texts.map((text) => ({
      text,
      url,
      selector,
      scrapedAt: now,
    }));

    cache[url] = { features, scrapedAt: now, status: 'ok' };
    writeCache(cache);
    return features;
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);

    cache[url] = {
      features: [],
      scrapedAt: now,
      status: 'error',
      errorMessage: errorMessage.slice(0, 300),
    };
    writeCache(cache);

    // Fall back to any stale cache
    const oldCache = readCache();
    const stale = oldCache[url];
    if (stale?.features?.length) return stale.features;

    return [];
  }
}

/**
 * Scrape multiple URLs in sequence with the same page.
 * Useful for scraping different sections of a competitor site.
 */
export async function scrapeMultiple(
  page: Page,
  targets: Array<{ url: string; selector: string }>,
): Promise<Map<string, ScrapedFeature[]>> {
  const results = new Map<string, ScrapedFeature[]>();

  for (const target of targets) {
    const features = await scrapeFeatures(page, target.url, target.selector);
    results.set(target.url, features);
  }

  return results;
}
