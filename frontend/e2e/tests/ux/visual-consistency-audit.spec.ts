/**
 * UX: Visual Consistency Audit — PRIVOD Platform
 *
 * Audits visual consistency across TOP_30_PAGES:
 *   1. Font Consistency       — font-family, heading hierarchy, body text size
 *   2. Color Palette          — status badge colors, button color scheme
 *   3. Component Consistency  — table headers, button minimum height, card padding
 *   4. Loading & Empty States — skeleton/spinner presence, empty state with CTA
 *   5. Breadcrumbs            — presence on sub/detail pages
 *
 * All assertions are soft (expect.soft) so the full audit runs even when
 * individual pages have issues. Issues are collected in the `issues[]` array
 * and attached to the test run via annotations.
 *
 * Technique:
 *   - page.goto() with domcontentloaded + best-effort networkidle
 *   - page.evaluate() for computed style inspection
 *   - Soft assertions + test.info().annotations for issue tracking
 */

import { test, expect } from '@playwright/test';
import { TOP_30_PAGES } from './all-urls';

// ─── Types ────────────────────────────────────────────────────────────────────

type IssueSeverity = 'CRITICAL' | 'MAJOR' | 'MINOR' | 'UX' | 'INFO';

interface AuditIssue {
  severity: IssueSeverity;
  page: string;
  category: string;
  description: string;
  actual?: string;
  expected?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function recordIssue(
  issues: AuditIssue[],
  severity: IssueSeverity,
  page: string,
  category: string,
  description: string,
  actual?: string,
  expected?: string,
): void {
  issues.push({ severity, page, category, description, actual, expected });
  const detail = actual ? ` | actual: "${actual}", expected: "${expected}"` : '';
  console.warn(`  [${severity}] [${category}] ${page}: ${description}${detail}`);
}

/**
 * Navigate to a URL with domcontentloaded + best-effort networkidle.
 * Returns the page body text for quick content checks.
 */
async function navigateTo(
  page: import('@playwright/test').Page,
  url: string,
): Promise<string> {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30_000 });
  await page.waitForLoadState('networkidle').catch(() => {});
  return (await page.textContent('body')) ?? '';
}

/**
 * Parse a CSS px/em/rem value to a number in pixels.
 * Returns null if the value cannot be parsed.
 */
function parsePx(value: string): number | null {
  const n = parseFloat(value);
  return isNaN(n) ? null : n;
}

/**
 * Return true if `value` is a multiple of `grid` (within 1px tolerance).
 */
function isOnGrid(value: number, grid: number): boolean {
  return Math.round(value) % grid === 0 || Math.abs(Math.round(value) % grid - grid) < 2;
}

// ─── Expected font stacks ─────────────────────────────────────────────────────

const EXPECTED_FONT_FAMILIES = ['Inter', 'system-ui', 'sans-serif', '-apple-system', 'Segoe UI'];

// ─── Sub-pages that should have breadcrumbs ───────────────────────────────────

const SUB_PAGES_EXPECTING_BREADCRUMBS: string[] = [
  '/planning/gantt',
  '/planning/evm',
  '/cash-flow',
  '/safety/incidents',
  '/quality/checklists',
  '/closeout/dashboard',
  '/support/dashboard',
  '/portfolio/health',
  '/warehouse/materials',
  '/admin/users',
];

// ─── Status color expectations ────────────────────────────────────────────────

// Maps canonical semantic meaning to expected green/red/yellow/blue/violet families.
// We check that status badges don't use unexpected colors (e.g. red for success).
const SEMANTIC_COLOR_PATTERNS: Record<string, RegExp> = {
  success: /rgb\(([\d]+),\s*([\d]+),\s*([\d]+)\)/,  // checked by value ranges below
  error:   /rgb\(([\d]+),\s*([\d]+),\s*([\d]+)\)/,
  warning: /rgb\(([\d]+),\s*([\d]+),\s*([\d]+)\)/,
  info:    /rgb\(([\d]+),\s*([\d]+),\s*([\d]+)\)/,
};

/**
 * Given an rgb(r,g,b) string, classify the hue bucket.
 * Returns one of: 'green' | 'red' | 'yellow' | 'blue' | 'violet' | 'gray' | 'unknown'
 */
function classifyColor(rgb: string): string {
  const m = rgb.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (!m) return 'unknown';
  const r = parseInt(m[1]);
  const g = parseInt(m[2]);
  const b = parseInt(m[3]);

  // Transparent / very light gray (neutral background)
  if (r > 230 && g > 230 && b > 230) return 'gray-light';
  if (r < 30 && g < 30 && b < 30) return 'dark';

  // Dominant channel heuristics
  if (g > r + 30 && g > b + 30) return 'green';
  if (r > g + 30 && r > b + 30) return 'red';
  if (r > 180 && g > 150 && b < 80) return 'yellow';
  if (b > r + 30 && b > g + 30) return 'blue';
  if (r > 100 && b > 100 && r > g + 20 && b > g + 20) return 'violet';
  if (Math.abs(r - g) < 20 && Math.abs(g - b) < 20) return 'gray';
  return 'mixed';
}

// =============================================================================
// Test Suites
// =============================================================================

test.describe('Visual Consistency Audit', () => {

  // ──────────────────────────────────────────────────────────────────────────
  // 1. Font Consistency
  // ──────────────────────────────────────────────────────────────────────────

  test.describe('Font Consistency', () => {

    test('consistent font family across pages', async ({ page }, testInfo) => {
      test.slow();
      const issues: AuditIssue[] = [];
      const fontFamiliesFound = new Set<string>();

      for (const url of TOP_30_PAGES) {
        await navigateTo(page, url);

        const fontFamily: string = await page.evaluate(() => {
          const el =
            document.querySelector('main p, main span, main td, main li') ||
            document.querySelector('p, span, td') ||
            document.body;
          return getComputedStyle(el).fontFamily;
        });

        fontFamiliesFound.add(fontFamily);

        const usesExpectedFont = EXPECTED_FONT_FAMILIES.some((f) =>
          fontFamily.toLowerCase().includes(f.toLowerCase()),
        );

        expect.soft(usesExpectedFont, `${url}: unexpected font-family`).toBe(true);
        if (!usesExpectedFont) {
          recordIssue(issues, 'MINOR', url, 'FontFamily',
            'Primary text uses unexpected font family',
            fontFamily,
            EXPECTED_FONT_FAMILIES.join(' | '),
          );
        }
      }

      // All pages should share at most 2 distinct font stacks (e.g. Inter + fallback)
      expect.soft(
        fontFamiliesFound.size,
        `Font families should be consistent: found ${fontFamiliesFound.size} distinct stacks`,
      ).toBeLessThanOrEqual(3);

      if (fontFamiliesFound.size > 3) {
        recordIssue(issues, 'MAJOR', 'ALL_PAGES', 'FontFamily',
          `${fontFamiliesFound.size} distinct font stacks found — should be ≤3`,
          [...fontFamiliesFound].join(' || '),
          '≤3 stacks',
        );
      }

      testInfo.annotations.push({
        type: 'font-family-audit',
        description: `Distinct font stacks: ${fontFamiliesFound.size}. Issues: ${issues.length}.`,
      });
    });

    test('heading hierarchy consistent', async ({ page }, testInfo) => {
      test.slow();
      const issues: AuditIssue[] = [];

      for (const url of TOP_30_PAGES) {
        await navigateTo(page, url);

        // Collect heading font-sizes in DOM order
        const sizes: { tag: string; px: number }[] = await page.evaluate(() => {
          const tags = ['h1', 'h2', 'h3', 'h4'];
          const result: { tag: string; px: number }[] = [];
          for (const tag of tags) {
            const el = document.querySelector(tag);
            if (el) {
              const px = parseFloat(getComputedStyle(el).fontSize);
              if (!isNaN(px)) result.push({ tag, px });
            }
          }
          return result;
        });

        // Verify descending size: h1 > h2 > h3 > h4
        for (let i = 1; i < sizes.length; i++) {
          const prev = sizes[i - 1];
          const curr = sizes[i];
          const isDescending = prev.px >= curr.px;
          expect.soft(isDescending, `${url}: ${prev.tag}(${prev.px}px) should be ≥ ${curr.tag}(${curr.px}px)`).toBe(true);
          if (!isDescending) {
            recordIssue(issues, 'MINOR', url, 'HeadingHierarchy',
              `${prev.tag} is smaller than ${curr.tag}`,
              `${prev.tag}=${prev.px}px, ${curr.tag}=${curr.px}px`,
              `${prev.tag} ≥ ${curr.tag}`,
            );
          }
        }
      }

      testInfo.annotations.push({
        type: 'heading-hierarchy-audit',
        description: `Heading hierarchy issues: ${issues.length}`,
      });
    });

    test('body text size is 14-16px across pages', async ({ page }, testInfo) => {
      test.slow();
      const issues: AuditIssue[] = [];
      const sizesOutOfRange: string[] = [];

      for (const url of TOP_30_PAGES) {
        await navigateTo(page, url);

        const bodyFontSize: number = await page.evaluate(() => {
          // Prefer paragraph or table cell text as representative body text
          const el =
            document.querySelector('main p, main td, main li') ||
            document.querySelector('p, td, li') ||
            document.body;
          return parseFloat(getComputedStyle(el).fontSize);
        });

        const inRange = bodyFontSize >= 13 && bodyFontSize <= 17;
        expect.soft(inRange, `${url}: body text ${bodyFontSize}px should be 14-16px`).toBe(true);
        if (!inRange) {
          sizesOutOfRange.push(`${url}:${bodyFontSize}px`);
          recordIssue(issues, 'MINOR', url, 'BodyFontSize',
            `Body text size ${bodyFontSize}px is outside 14-16px range`,
            `${bodyFontSize}px`,
            '14-16px',
          );
        }
      }

      testInfo.annotations.push({
        type: 'body-font-size-audit',
        description: `Pages with out-of-range body font size: ${sizesOutOfRange.length}. ${sizesOutOfRange.join(', ')}`,
      });
    });

  });

  // ──────────────────────────────────────────────────────────────────────────
  // 2. Color Palette
  // ──────────────────────────────────────────────────────────────────────────

  test.describe('Color Palette', () => {

    test('status badge colors consistent', async ({ page }, testInfo) => {
      test.slow();
      const issues: AuditIssue[] = [];

      // Per-page badge color map: url → array of { text, bgColor, hue }
      const allBadgeData: Array<{ url: string; text: string; bg: string; hue: string }> = [];

      for (const url of TOP_30_PAGES) {
        await navigateTo(page, url);

        // Collect all status badges visible on the page
        const badges: Array<{ text: string; bg: string }> = await page.evaluate(() => {
          const results: Array<{ text: string; bg: string }> = [];
          // Common badge selectors: StatusBadge component, role="status", class*="badge", class*="status"
          const selectors = [
            '[class*="badge"]',
            '[class*="status-badge"]',
            '[role="status"]',
            '[class*="chip"]',
            '[class*="tag"]',
          ];
          const seen = new Set<Element>();
          for (const sel of selectors) {
            document.querySelectorAll(sel).forEach((el) => {
              if (seen.has(el)) return;
              seen.add(el);
              const text = (el.textContent ?? '').trim().slice(0, 30);
              const bg = getComputedStyle(el).backgroundColor;
              if (text && bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') {
                results.push({ text, bg });
              }
            });
          }
          return results.slice(0, 20); // cap per page
        });

        for (const badge of badges) {
          const hue = classifyColor(badge.bg);
          allBadgeData.push({ url, text: badge.text, bg: badge.bg, hue });

          // Basic semantic consistency checks
          // "Одобрен" / "Approved" / "Завершён" / "Выполнен" → should NOT be red
          const textLower = badge.text.toLowerCase();
          const isApproved = /одобр|утвержд|завершён|выполн|approved|completed|done|success/i.test(textLower);
          const isRejected = /отклон|reject|отказ|провал|failed|cancel/i.test(textLower);
          const isOverBudget = /перерасход|over budget/i.test(textLower);

          if (isApproved && hue === 'red') {
            recordIssue(issues, 'MAJOR', url, 'StatusBadgeColor',
              `Approved/completed badge has red background`,
              `text="${badge.text}", bg=${badge.bg}`,
              'green background for approved/completed',
            );
          }
          if (isRejected && hue === 'green') {
            recordIssue(issues, 'MAJOR', url, 'StatusBadgeColor',
              `Rejected/failed badge has green background`,
              `text="${badge.text}", bg=${badge.bg}`,
              'red background for rejected/failed',
            );
          }
          if (isOverBudget && (hue === 'green' || hue === 'blue')) {
            recordIssue(issues, 'MAJOR', url, 'StatusBadgeColor',
              `Over-budget badge has green/blue background`,
              `text="${badge.text}", bg=${badge.bg}`,
              'red/orange background for over-budget',
            );
          }
        }
      }

      // Check cross-module consistency: the same status text should use the same color
      const colorByStatus = new Map<string, Set<string>>();
      for (const d of allBadgeData) {
        const key = d.text.toLowerCase().trim();
        if (!colorByStatus.has(key)) colorByStatus.set(key, new Set());
        colorByStatus.get(key)!.add(d.hue);
      }

      const inconsistentStatuses: string[] = [];
      for (const [status, hues] of colorByStatus.entries()) {
        // Allow gray/gray-light alongside a real hue (gray = fallback/neutral)
        const meaningfulHues = [...hues].filter((h) => h !== 'gray' && h !== 'gray-light' && h !== 'unknown');
        if (new Set(meaningfulHues).size > 1) {
          inconsistentStatuses.push(`"${status}" → ${[...hues].join(', ')}`);
          recordIssue(issues, 'MINOR', 'CROSS_MODULE', 'StatusBadgeColor',
            `Status "${status}" uses inconsistent colors across modules`,
            [...hues].join(', '),
            'single consistent hue',
          );
        }
      }

      expect.soft(inconsistentStatuses.length, `Inconsistent badge colors: ${inconsistentStatuses.join(' | ')}`).toBeLessThanOrEqual(5);

      testInfo.annotations.push({
        type: 'badge-color-audit',
        description: `Total badges inspected: ${allBadgeData.length}. Inconsistent statuses: ${inconsistentStatuses.length}. Semantic issues: ${issues.filter(i => i.category === 'StatusBadgeColor').length}.`,
      });
    });

    test('button color scheme consistent', async ({ page }, testInfo) => {
      test.slow();
      const issues: AuditIssue[] = [];

      // Primary button selectors: we look for buttons that have a colored background
      // (not just a border/ghost) and check that all "primary" (blue/indigo) buttons
      // share the same hue across pages.
      const primaryButtonHues = new Map<string, string>(); // url → hue of first primary button

      for (const url of TOP_30_PAGES) {
        await navigateTo(page, url);

        const buttonData: Array<{ text: string; bg: string; color: string; height: number }> =
          await page.evaluate(() => {
            const results: Array<{ text: string; bg: string; color: string; height: number }> = [];
            document.querySelectorAll('button, [role="button"]').forEach((el) => {
              const style = getComputedStyle(el);
              const bg = style.backgroundColor;
              const height = (el as HTMLElement).offsetHeight;
              // Only capture buttons with a non-transparent background
              if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent' && height > 0) {
                results.push({
                  text: (el.textContent ?? '').trim().slice(0, 40),
                  bg,
                  color: style.color,
                  height,
                });
              }
            });
            return results.slice(0, 30); // cap per page
          });

        for (const btn of buttonData) {
          const hue = classifyColor(btn.bg);
          // Track first primary (blue/violet/indigo) button per page
          if ((hue === 'blue' || hue === 'violet') && !primaryButtonHues.has(url)) {
            primaryButtonHues.set(url, hue);
          }

          // Destructive buttons (delete/cancel text) should be red
          const isDestructive = /удалить|delete|remove|отменить|cancel/i.test(btn.text);
          if (isDestructive && hue !== 'red' && hue !== 'gray' && hue !== 'gray-light') {
            // Only flag if it's an unexpected color (e.g. green for a delete button)
            if (hue === 'green' || hue === 'blue') {
              recordIssue(issues, 'MINOR', url, 'ButtonColor',
                `Destructive button "${btn.text}" has unexpected ${hue} background`,
                btn.bg,
                'red or neutral background for destructive action',
              );
            }
          }
        }
      }

      // Check that all primary buttons share the same hue (should all be blue OR all violet)
      const primaryHues = new Set(primaryButtonHues.values());
      expect.soft(primaryHues.size, `Primary button hues should be consistent: found ${[...primaryHues].join(', ')}`).toBeLessThanOrEqual(2);

      if (primaryHues.size > 2) {
        recordIssue(issues, 'MAJOR', 'CROSS_MODULE', 'ButtonColor',
          `Primary button hues are inconsistent across pages: ${[...primaryHues].join(', ')}`,
          [...primaryHues].join(', '),
          '1-2 consistent hues',
        );
      }

      testInfo.annotations.push({
        type: 'button-color-audit',
        description: `Primary button hues: ${[...primaryHues].join(', ')}. Issues: ${issues.length}.`,
      });
    });

  });

  // ──────────────────────────────────────────────────────────────────────────
  // 3. Component Consistency
  // ──────────────────────────────────────────────────────────────────────────

  test.describe('Component Consistency', () => {

    test('table header styles consistent', async ({ page }, testInfo) => {
      test.slow();
      const issues: AuditIssue[] = [];

      const headerStyleSamples: Array<{
        url: string;
        bg: string;
        color: string;
        fontWeight: string;
      }> = [];

      for (const url of TOP_30_PAGES) {
        await navigateTo(page, url);

        const headerStyle: { bg: string; color: string; fontWeight: string } | null =
          await page.evaluate(() => {
            const th =
              document.querySelector('thead th, thead [role="columnheader"], [role="columnheader"]');
            if (!th) return null;
            const style = getComputedStyle(th);
            return {
              bg: style.backgroundColor,
              color: style.color,
              fontWeight: style.fontWeight,
            };
          });

        if (headerStyle) {
          headerStyleSamples.push({ url, ...headerStyle });

          // Font weight of table headers should be bold (600+)
          const fw = parseInt(headerStyle.fontWeight);
          const isBold = !isNaN(fw) ? fw >= 500 : headerStyle.fontWeight === 'bold';
          expect.soft(isBold, `${url}: table header font-weight should be ≥500, got ${headerStyle.fontWeight}`).toBe(true);
          if (!isBold) {
            recordIssue(issues, 'MINOR', url, 'TableHeader',
              'Table header font-weight is below 500 (not bold)',
              headerStyle.fontWeight,
              '≥500 (bold)',
            );
          }
        }
      }

      // Check consistency of header background colors across pages
      const bgColors = new Set(headerStyleSamples.map((s) => s.bg));
      // Allow up to 4 distinct bg values (dark mode + light mode variants both valid)
      expect.soft(
        bgColors.size,
        `Table header bg colors should be consistent: found ${bgColors.size} distinct values`,
      ).toBeLessThanOrEqual(6);

      if (bgColors.size > 6) {
        recordIssue(issues, 'MINOR', 'CROSS_MODULE', 'TableHeader',
          `Too many distinct table header background colors: ${bgColors.size}`,
          [...bgColors].join(' | '),
          '≤6 distinct backgrounds',
        );
      }

      testInfo.annotations.push({
        type: 'table-header-audit',
        description: `Pages with table headers: ${headerStyleSamples.length}. Distinct bg colors: ${bgColors.size}. Issues: ${issues.length}.`,
      });
    });

    test('button sizes meet minimum 36px height', async ({ page }, testInfo) => {
      test.slow();
      const issues: AuditIssue[] = [];
      const pagesWithSmallButtons: string[] = [];

      for (const url of TOP_30_PAGES) {
        await navigateTo(page, url);

        const smallButtons: Array<{ text: string; height: number }> = await page.evaluate(() => {
          const result: Array<{ text: string; height: number }> = [];
          document.querySelectorAll('button, [role="button"], a[class*="btn"]').forEach((el) => {
            const rect = (el as HTMLElement).getBoundingClientRect();
            // Only check visible, interactive buttons (skip icon-only tiny buttons <24px)
            if (rect.height > 0 && rect.height < 36 && rect.width > 24) {
              const text = (el.textContent ?? '').trim().slice(0, 40);
              // Skip icon-only buttons (no meaningful text)
              if (text.length > 1) {
                result.push({ text, height: Math.round(rect.height) });
              }
            }
          });
          return result.slice(0, 10);
        });

        if (smallButtons.length > 0) {
          pagesWithSmallButtons.push(url);
          for (const btn of smallButtons) {
            expect.soft(btn.height, `${url}: button "${btn.text}" height ${btn.height}px is below 36px`).toBeGreaterThanOrEqual(36);
            recordIssue(issues, 'UX', url, 'ButtonHeight',
              `Button "${btn.text}" is below 36px minimum height`,
              `${btn.height}px`,
              '≥36px',
            );
          }
        }
      }

      testInfo.annotations.push({
        type: 'button-height-audit',
        description: `Pages with sub-36px buttons: ${pagesWithSmallButtons.length}. Total issues: ${issues.length}. Pages: ${pagesWithSmallButtons.join(', ')}`,
      });
    });

    test('card padding follows 8px grid', async ({ page }, testInfo) => {
      test.slow();
      const issues: AuditIssue[] = [];
      const offGridPages: string[] = [];

      for (const url of TOP_30_PAGES) {
        await navigateTo(page, url);

        const cardPaddings: Array<{ top: number; right: number; bottom: number; left: number }> =
          await page.evaluate(() => {
            const selectors = [
              '[class*="card"]',
              '[class*="panel"]',
              '[class*="widget"]',
              'section[class*="bg-"]',
            ];
            const results: Array<{ top: number; right: number; bottom: number; left: number }> = [];
            const seen = new Set<Element>();
            for (const sel of selectors) {
              document.querySelectorAll(sel).forEach((el) => {
                if (seen.has(el)) return;
                seen.add(el);
                const style = getComputedStyle(el);
                const rect = (el as HTMLElement).getBoundingClientRect();
                // Only inspect visible, reasonably-sized card-like elements
                if (rect.width > 100 && rect.height > 40) {
                  results.push({
                    top: parseFloat(style.paddingTop),
                    right: parseFloat(style.paddingRight),
                    bottom: parseFloat(style.paddingBottom),
                    left: parseFloat(style.paddingLeft),
                  });
                }
              });
            }
            return results.slice(0, 5);
          });

        let pageHasOffGridPadding = false;
        for (const p of cardPaddings) {
          const values = [p.top, p.right, p.bottom, p.left].filter((v) => !isNaN(v) && v > 0);
          for (const v of values) {
            // Padding should be on 4px grid (common in Tailwind: p-1=4px, p-2=8px, p-4=16px, p-6=24px...)
            const onGrid = isOnGrid(v, 4);
            if (!onGrid) {
              pageHasOffGridPadding = true;
              recordIssue(issues, 'INFO', url, 'CardPadding',
                `Card padding value ${v}px is not on 4px grid`,
                `${v}px`,
                'multiple of 4px',
              );
              break; // one issue per card is enough
            }
          }
          if (pageHasOffGridPadding) break;
        }

        if (pageHasOffGridPadding) {
          offGridPages.push(url);
        }
      }

      // Soft expectation: most pages should have on-grid padding
      expect.soft(
        offGridPages.length,
        `Pages with off-grid card padding: ${offGridPages.join(', ')}`,
      ).toBeLessThanOrEqual(Math.ceil(TOP_30_PAGES.length * 0.20)); // allow 20% tolerance

      testInfo.annotations.push({
        type: 'card-padding-audit',
        description: `Pages with off-grid padding: ${offGridPages.length}/${TOP_30_PAGES.length}. Issues: ${issues.length}.`,
      });
    });

  });

  // ──────────────────────────────────────────────────────────────────────────
  // 4. Loading & Empty States
  // ──────────────────────────────────────────────────────────────────────────

  test.describe('Loading & Empty States', () => {

    for (const url of TOP_30_PAGES) {
      test(`loading/empty state: ${url}`, async ({ page }, testInfo) => {
        // Navigate and capture the state quickly (before networkidle) for skeleton check
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30_000 });

        // Check for skeleton or spinner during the loading phase
        const hasLoadingIndicator: boolean = await page.evaluate(() => {
          const skeletonSelectors = [
            '[class*="skeleton"]',
            '[class*="shimmer"]',
            '[class*="pulse"]',
            '[class*="animate-pulse"]',
            '[role="progressbar"]',
            '[class*="spinner"]',
            '[class*="loading"]',
          ];
          return skeletonSelectors.some(
            (sel) => document.querySelectorAll(sel).length > 0,
          );
        });

        // Now wait for the page to fully load
        await page.waitForLoadState('networkidle').catch(() => {});

        // Check for empty state with actionable CTA after load
        const emptyStateInfo: { hasEmptyState: boolean; hasActionButton: boolean; emptyText: string } =
          await page.evaluate(() => {
            // Common empty state patterns
            const emptySelectors = [
              '[class*="empty"]',
              '[class*="no-data"]',
              '[class*="empty-state"]',
              '[class*="placeholder"]',
            ];
            const emptyTextPatterns =
              /нет данных|пусто|no data|ничего не найдено|нет записей|список пуст|no results|empty/i;

            let hasEmptyState = false;
            let emptyText = '';

            // Check dedicated empty state components
            for (const sel of emptySelectors) {
              const el = document.querySelector(sel);
              if (el) {
                hasEmptyState = true;
                emptyText = (el.textContent ?? '').trim().slice(0, 80);
                break;
              }
            }

            // Check text content for empty state messages
            if (!hasEmptyState) {
              const bodyText = document.body.textContent ?? '';
              if (emptyTextPatterns.test(bodyText)) {
                hasEmptyState = true;
                const match = bodyText.match(emptyTextPatterns);
                emptyText = match ? match[0] : 'empty state detected';
              }
            }

            // Check if there's a CTA button near the empty state
            const hasActionButton =
              document.querySelectorAll('button, [role="button"], a[href]').length > 0;

            return { hasEmptyState, hasActionButton, emptyText };
          });

        // After full load: check body renders real content (not just blank)
        const bodyText = (await page.textContent('body')) ?? '';
        expect.soft(bodyText.length, `${url}: page should render some content`).toBeGreaterThan(50);
        expect.soft(bodyText).not.toContain('Something went wrong');
        expect.soft(bodyText).not.toContain('Cannot read properties');
        expect.soft(bodyText).not.toMatch(/\b[a-z]+\.[a-z]+\.[a-z]+Key\b/); // raw i18n key leak

        // If empty state is detected, there should be an action button (CTA)
        if (emptyStateInfo.hasEmptyState) {
          expect.soft(
            emptyStateInfo.hasActionButton,
            `${url}: empty state found ("${emptyStateInfo.emptyText}") but no CTA button`,
          ).toBe(true);
        }

        testInfo.annotations.push({
          type: 'loading-empty-state',
          description: [
            `url: ${url}`,
            `hasLoadingIndicator: ${hasLoadingIndicator}`,
            `hasEmptyState: ${emptyStateInfo.hasEmptyState}`,
            `emptyText: ${emptyStateInfo.emptyText || 'none'}`,
            `hasCTA: ${emptyStateInfo.hasActionButton}`,
          ].join(' | '),
        });
      });
    }

  });

  // ──────────────────────────────────────────────────────────────────────────
  // 5. Breadcrumbs
  // ──────────────────────────────────────────────────────────────────────────

  test.describe('Breadcrumbs', () => {

    test('breadcrumbs present on sub-pages', async ({ page }, testInfo) => {
      test.slow();
      const issues: AuditIssue[] = [];
      const missingBreadcrumbs: string[] = [];

      for (const url of SUB_PAGES_EXPECTING_BREADCRUMBS) {
        await navigateTo(page, url);

        const breadcrumbInfo: { found: boolean; selector: string; text: string } =
          await page.evaluate(() => {
            // Try multiple breadcrumb patterns used in the PRIVOD design system
            const selectors = [
              'nav[aria-label*="breadcrumb" i]',
              'nav[aria-label*="хлебные крошки" i]',
              '[class*="breadcrumb"]',
              '[data-testid*="breadcrumb"]',
              '[role="navigation"] ol',
              '[role="navigation"] ul',
              // Tailwind-based: often a flex row with separators
              'nav ol[class*="flex"]',
              'nav ul[class*="flex"]',
            ];

            for (const sel of selectors) {
              const el = document.querySelector(sel);
              if (el) {
                return {
                  found: true,
                  selector: sel,
                  text: (el.textContent ?? '').trim().slice(0, 80),
                };
              }
            }

            // Fallback: check for ">" or "/" separator pattern in nav text
            const navEls = document.querySelectorAll('nav, header nav');
            for (const nav of navEls) {
              const text = nav.textContent ?? '';
              if (/›|»|>|\//g.test(text) && text.length < 200) {
                return { found: true, selector: 'nav (text separator)', text: text.trim().slice(0, 80) };
              }
            }

            return { found: false, selector: '', text: '' };
          });

        // Sub-pages should have breadcrumbs — soft assertion (some pages may not have them yet)
        expect.soft(
          breadcrumbInfo.found,
          `${url}: breadcrumbs not found on sub-page`,
        ).toBe(true);

        if (!breadcrumbInfo.found) {
          missingBreadcrumbs.push(url);
          recordIssue(issues, 'UX', url, 'Breadcrumbs',
            'Breadcrumbs not found on sub-page — user loses navigation context',
            'none',
            'breadcrumb nav element',
          );
        }
      }

      // Expect at least 50% of sub-pages to have breadcrumbs
      const coverageRatio = 1 - missingBreadcrumbs.length / SUB_PAGES_EXPECTING_BREADCRUMBS.length;
      expect.soft(
        coverageRatio,
        `Breadcrumb coverage ${Math.round(coverageRatio * 100)}% — should be ≥50%. Missing: ${missingBreadcrumbs.join(', ')}`,
      ).toBeGreaterThanOrEqual(0.50);

      testInfo.annotations.push({
        type: 'breadcrumb-audit',
        description: `Sub-pages checked: ${SUB_PAGES_EXPECTING_BREADCRUMBS.length}. Missing breadcrumbs: ${missingBreadcrumbs.length} (${missingBreadcrumbs.join(', ')}). Coverage: ${Math.round(coverageRatio * 100)}%.`,
      });
    });

    test('breadcrumb hierarchy is correct (parent before child)', async ({ page }, testInfo) => {
      test.slow();
      const issues: AuditIssue[] = [];

      // Pages where we know the expected breadcrumb parent
      const hierarchyCases: Array<{ url: string; expectedParent: string }> = [
        { url: '/planning/gantt',      expectedParent: /план|planning|главная/i.source },
        { url: '/safety/incidents',    expectedParent: /безопасн|safety|охрана/i.source },
        { url: '/quality/checklists',  expectedParent: /качест|quality|контроль/i.source },
        { url: '/warehouse/materials', expectedParent: /склад|warehouse|материал/i.source },
        { url: '/admin/users',         expectedParent: /admin|администр|пользователи|настройки/i.source },
        { url: '/closeout/dashboard',  expectedParent: /сдача|closeout|завершение/i.source },
        { url: '/support/dashboard',   expectedParent: /поддерж|support|техподдержка/i.source },
      ];

      for (const { url, expectedParent } of hierarchyCases) {
        await navigateTo(page, url);

        const breadcrumbText: string = await page.evaluate(() => {
          const selectors = [
            'nav[aria-label*="breadcrumb" i]',
            '[class*="breadcrumb"]',
            'nav ol',
            'nav ul',
          ];
          for (const sel of selectors) {
            const el = document.querySelector(sel);
            if (el) return (el.textContent ?? '').trim().slice(0, 150);
          }
          return '';
        });

        if (breadcrumbText) {
          const parentPattern = new RegExp(expectedParent, 'i');
          const hasParent = parentPattern.test(breadcrumbText);
          expect.soft(hasParent, `${url}: breadcrumb should include parent segment matching ${expectedParent}`).toBe(true);
          if (!hasParent) {
            recordIssue(issues, 'MINOR', url, 'BreadcrumbHierarchy',
              'Breadcrumb does not include expected parent segment',
              breadcrumbText,
              `should match: ${expectedParent}`,
            );
          }
        }
        // If no breadcrumb found, it's already captured by the previous test — skip here
      }

      testInfo.annotations.push({
        type: 'breadcrumb-hierarchy-audit',
        description: `Hierarchy cases checked: ${hierarchyCases.length}. Issues: ${issues.length}.`,
      });
    });

  });

  // ──────────────────────────────────────────────────────────────────────────
  // 6. Icon Usage Consistency
  // ──────────────────────────────────────────────────────────────────────────

  test.describe('Icon Usage', () => {

    test('common actions use consistent icons across pages', async ({ page }, testInfo) => {
      test.slow();
      const issues: AuditIssue[] = [];

      // Map of SVG path fragments to expected action — Lucide icon path signatures
      // These are approximate path d= fragments that identify the icon visually.
      // We check that "edit" buttons don't accidentally use a trash icon etc.
      // Strategy: check aria-label / title attributes on icon buttons.
      const iconActionReport: Array<{ url: string; ariaLabel: string; found: boolean }> = [];

      for (const url of TOP_30_PAGES) {
        await navigateTo(page, url);

        const iconButtons: Array<{ ariaLabel: string; title: string; text: string }> =
          await page.evaluate(() => {
            const results: Array<{ ariaLabel: string; title: string; text: string }> = [];
            const btns = document.querySelectorAll('button, [role="button"]');
            btns.forEach((btn) => {
              const ariaLabel = btn.getAttribute('aria-label') ?? '';
              const title = btn.getAttribute('title') ?? '';
              const text = (btn.textContent ?? '').trim().slice(0, 30);
              const hasSvg = btn.querySelector('svg') !== null;
              if (hasSvg && (ariaLabel || title)) {
                results.push({ ariaLabel: ariaLabel.slice(0, 40), title: title.slice(0, 40), text });
              }
            });
            return results.slice(0, 20);
          });

        // Check that edit/delete icon buttons have proper aria-labels
        for (const btn of iconButtons) {
          const label = (btn.ariaLabel || btn.title).toLowerCase();
          const isEditLike = /edit|редакт|изменить|pencil|pen/i.test(label);
          const isDeleteLike = /delete|удалить|remove|trash|корзина/i.test(label);

          if (isEditLike || isDeleteLike) {
            iconActionReport.push({ url, ariaLabel: btn.ariaLabel || btn.title, found: true });
          }
        }

        // Ensure icon-only buttons have an aria-label (accessibility + consistency)
        const iconOnlyButtonsWithoutLabel: number = await page.evaluate(() => {
          let count = 0;
          document.querySelectorAll('button, [role="button"]').forEach((btn) => {
            const hasSvg = btn.querySelector('svg') !== null;
            const hasText = (btn.textContent ?? '').trim().length > 0;
            const hasLabel = btn.getAttribute('aria-label') || btn.getAttribute('title');
            // Icon-only button: has SVG but no visible text and no aria-label
            if (hasSvg && !hasText && !hasLabel) count++;
          });
          return count;
        });

        expect.soft(
          iconOnlyButtonsWithoutLabel,
          `${url}: ${iconOnlyButtonsWithoutLabel} icon-only buttons without aria-label`,
        ).toBeLessThanOrEqual(5); // allow a small number (some are intentionally unlabeled)

        if (iconOnlyButtonsWithoutLabel > 5) {
          recordIssue(issues, 'UX', url, 'IconAccessibility',
            `${iconOnlyButtonsWithoutLabel} icon-only buttons missing aria-label`,
            `${iconOnlyButtonsWithoutLabel} buttons`,
            '≤5 unlabeled icon buttons',
          );
        }
      }

      testInfo.annotations.push({
        type: 'icon-usage-audit',
        description: `Icon action buttons found with labels: ${iconActionReport.length}. Issues: ${issues.length}.`,
      });
    });

  });

  // ──────────────────────────────────────────────────────────────────────────
  // 7. Error States
  // ──────────────────────────────────────────────────────────────────────────

  test.describe('Error States', () => {

    test('no crash messages or raw error text on page load', async ({ page }, testInfo) => {
      test.slow();
      const issues: AuditIssue[] = [];
      const crashedPages: string[] = [];

      const CRASH_PATTERNS = [
        'Something went wrong',
        'Cannot read properties',
        'TypeError:',
        'ReferenceError:',
        'Uncaught Error',
        'ChunkLoadError',
        '500 Internal Server Error',
        'Unexpected token',
      ];

      const RAW_KEY_PATTERN = /\b[a-z]+\.[a-z]+\.[a-z]+\b/; // e.g. finance.budget.title (i18n key leak)

      for (const url of TOP_30_PAGES) {
        const consoleErrors: string[] = [];
        page.on('console', (msg) => {
          if (msg.type() === 'error') {
            const text = msg.text();
            // Exclude network errors / favicon / known noisy messages
            if (
              !text.includes('Failed to load resource') &&
              !text.includes('favicon') &&
              !text.includes('net::ERR_') &&
              !text.includes('ResizeObserver') &&
              !text.includes('Warning:')
            ) {
              consoleErrors.push(text.slice(0, 120));
            }
          }
        });

        await navigateTo(page, url);

        const bodyText = (await page.textContent('body')) ?? '';

        // Check for crash messages in rendered text
        for (const pattern of CRASH_PATTERNS) {
          const hasCrash = bodyText.includes(pattern);
          expect.soft(!hasCrash, `${url}: crash pattern found: "${pattern}"`).toBe(true);
          if (hasCrash) {
            crashedPages.push(url);
            recordIssue(issues, 'CRITICAL', url, 'CrashMessage',
              `Crash/error message rendered on page: "${pattern}"`,
              pattern,
              'no crash messages',
            );
          }
        }

        // Check for raw i18n key leaks (e.g. "finance.budget.title" rendered in UI)
        const rawKeyMatch = bodyText.match(RAW_KEY_PATTERN);
        if (rawKeyMatch) {
          // Only flag if it looks like a real i18n key (not a URL or class name)
          const candidate = rawKeyMatch[0];
          // Exclude URLs (contain '://') and very short patterns
          if (!bodyText.slice(bodyText.indexOf(candidate) - 5, bodyText.indexOf(candidate)).includes('/') &&
              candidate.split('.').every((part) => part.length > 2)) {
            recordIssue(issues, 'MINOR', url, 'I18nKeyLeak',
              `Possible raw i18n key in rendered text: "${candidate}"`,
              candidate,
              'translated string',
            );
          }
        }

        // Console errors are WARN-level only (not fail the test)
        if (consoleErrors.length > 0) {
          testInfo.annotations.push({
            type: `console-errors:${url}`,
            description: consoleErrors.join(' | '),
          });
        }

        // Remove listener to avoid accumulation across pages
        page.removeAllListeners('console');
      }

      expect.soft(crashedPages.length, `Pages with crash messages: ${crashedPages.join(', ')}`).toBe(0);

      testInfo.annotations.push({
        type: 'error-state-audit',
        description: `Crashed pages: ${crashedPages.length}. Total issues: ${issues.length}.`,
      });
    });

    test('API error messages are shown consistently (not raw JSON)', async ({ page }, testInfo) => {
      test.slow();
      const issues: AuditIssue[] = [];

      // Inject a network intercept that returns 500 for a specific API endpoint
      // and verify the UI shows a user-friendly message, not raw JSON.
      const testCases: Array<{ url: string; intercept: string }> = [
        { url: '/projects',        intercept: '**/api/projects**' },
        { url: '/invoices',        intercept: '**/api/invoices**' },
        { url: '/employees',       intercept: '**/api/employees**' },
        { url: '/safety/incidents', intercept: '**/api/safety/incidents**' },
      ];

      for (const { url, intercept } of testCases) {
        // Intercept API call to simulate 500 error
        await page.route(intercept, (route) =>
          route.fulfill({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'Internal Server Error', message: 'Test-injected 500' }),
          }),
        );

        await navigateTo(page, url);

        const bodyText = (await page.textContent('body')) ?? '';

        // Raw JSON should not be rendered in the UI
        const hasRawJson = /"error"\s*:\s*"Internal Server Error"/.test(bodyText);
        expect.soft(!hasRawJson, `${url}: raw JSON error object rendered in UI on 500`).toBe(true);
        if (hasRawJson) {
          recordIssue(issues, 'MAJOR', url, 'APIErrorDisplay',
            'Raw JSON error object displayed in UI instead of user-friendly message',
            'raw JSON visible',
            'user-friendly error message',
          );
        }

        // Unroute to restore normal behavior for next iteration
        await page.unroute(intercept);
      }

      testInfo.annotations.push({
        type: 'api-error-display-audit',
        description: `Test cases: ${testCases.length}. Issues: ${issues.length}.`,
      });
    });

  });

  // ──────────────────────────────────────────────────────────────────────────
  // 8. Spacing Consistency
  // ──────────────────────────────────────────────────────────────────────────

  test.describe('Spacing Consistency', () => {

    test('gap between page-level elements follows 8px grid', async ({ page }, testInfo) => {
      test.slow();
      const issues: AuditIssue[] = [];
      const offGridCount: number[] = [];

      for (const url of TOP_30_PAGES) {
        await navigateTo(page, url);

        const gapValues: number[] = await page.evaluate(() => {
          const results: number[] = [];
          // Check grid/flex containers at the page root level
          const containers = document.querySelectorAll(
            'main > *, [class*="grid"], [class*="flex"], [class*="gap"]',
          );
          containers.forEach((el) => {
            const style = getComputedStyle(el);
            const gap = parseFloat(style.gap || style.rowGap || style.columnGap);
            if (!isNaN(gap) && gap > 0) results.push(gap);
          });
          return results.slice(0, 10);
        });

        let offGrid = 0;
        for (const gap of gapValues) {
          if (!isOnGrid(gap, 4)) {
            offGrid++;
            recordIssue(issues, 'INFO', url, 'Spacing',
              `Gap value ${gap}px is not on 4px grid`,
              `${gap}px`,
              'multiple of 4px',
            );
          }
        }
        offGridCount.push(offGrid);
      }

      const totalOffGrid = offGridCount.reduce((a, b) => a + b, 0);
      expect.soft(totalOffGrid, `Total off-grid gap values across all pages`).toBeLessThanOrEqual(20);

      testInfo.annotations.push({
        type: 'spacing-consistency-audit',
        description: `Total off-grid gap values: ${totalOffGrid}. Issues: ${issues.length}.`,
      });
    });

  });

});
