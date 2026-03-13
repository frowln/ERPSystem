/**
 * Dark Mode Audit — All 244 Pages
 *
 * Scans every navigation URL for dark-mode regressions:
 *   1. White / near-white backgrounds leaking through (bg not converted to dark)
 *   2. Dark-on-dark text (unreadable contrast)
 *   3. Invisible borders (border-color == background-color)
 *   4. Input fields that blend into the page background
 *
 * Component-level checks cover tables, modals, badges, toasts, skeletons, inputs.
 *
 * Issues are RECORDED (not failing hard) via test.info().annotations and
 * expect.soft() so the full scan always completes. A summary JSON report is
 * written to e2e/reports/dark-mode-issues.json at the end.
 *
 * Run:
 *   npx playwright test --config=e2e/playwright.config.ts e2e/tests/ux/dark-mode-audit.spec.ts
 */

import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { ALL_URLS, URL_GROUPS } from './all-urls';

// ─── Types ───────────────────────────────────────────────────────────────────

interface DarkModeIssue {
  url: string;
  kind: 'white-bg' | 'dark-on-dark' | 'invisible-border' | 'input-blends';
  element: string;
  detail: string;
  count: number;
}

// Module-level accumulator: populated by per-page tests, consumed by summary.
const ALL_ISSUES: DarkModeIssue[] = [];

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Inject dark mode into the page via localStorage BEFORE the app boots.
 * Called in addInitScript — runs before any page JS.
 */
function injectDarkModeScript(): void {
  localStorage.setItem('privod-theme', 'dark');
  localStorage.setItem(
    'theme-storage',
    JSON.stringify({ state: { theme: 'dark' }, version: 0 }),
  );
}

/**
 * After navigation, force the `dark` class onto <html> in case the React store
 * hasn't applied it yet (e.g. first render before hydration).
 */
async function forceDarkClass(page: import('@playwright/test').Page): Promise<void> {
  await page.evaluate(() => {
    document.documentElement.classList.add('dark');
  });
}

/**
 * Navigate to a URL with a reasonable timeout; swallow networkidle errors
 * (some pages have long-polling or WebSocket connections that never settle).
 */
async function navigateTo(
  page: import('@playwright/test').Page,
  url: string,
): Promise<void> {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30_000 });
  await page.waitForLoadState('networkidle').catch(() => {});
  await forceDarkClass(page);
  // Give React a tick to finish rendering after dark class is applied
  await page.waitForTimeout(300);
}

// ─── Element Scanning (runs in browser context via page.evaluate) ─────────────

interface ScanResult {
  whiteBgElements: Array<{ tag: string; id: string; cls: string; bg: string; w: number; h: number }>;
  darkOnDarkElements: Array<{ tag: string; id: string; cls: string; color: string; bg: string }>;
  invisibleBorderElements: Array<{ tag: string; id: string; cls: string; border: string; bg: string }>;
  inputBlendsElements: Array<{ tag: string; type: string; inputBg: string; parentBg: string }>;
}

async function scanPageForIssues(
  page: import('@playwright/test').Page,
): Promise<ScanResult> {
  return page.evaluate((): ScanResult => {
    // ── Parse RGB string → {r,g,b} ──
    function parseRgb(color: string): { r: number; g: number; b: number } | null {
      const m = color.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      if (!m) return null;
      return { r: parseInt(m[1], 10), g: parseInt(m[2], 10), b: parseInt(m[3], 10) };
    }

    function isWhiteOrNearWhite(color: string): boolean {
      const rgb = parseRgb(color);
      if (!rgb) return false;
      // rgb(255,255,255) | rgb(249,250,251) | rgb(243,244,246) and transparent
      const { r, g, b } = rgb;
      return r >= 240 && g >= 240 && b >= 240;
    }

    function isDarkOnDark(textColor: string, bgColor: string): boolean {
      const tc = parseRgb(textColor);
      const bc = parseRgb(bgColor);
      if (!tc || !bc) return false;
      // Both channels < 80 means both are dark — text is unreadable on dark bg
      const textDark = tc.r < 80 && tc.g < 80 && tc.b < 80;
      const bgDark = bc.r < 80 && bc.g < 80 && bc.b < 80;
      return textDark && bgDark;
    }

    function rgbClose(a: string, b: string, threshold = 20): boolean {
      const ra = parseRgb(a);
      const rb = parseRgb(b);
      if (!ra || !rb) return false;
      return (
        Math.abs(ra.r - rb.r) < threshold &&
        Math.abs(ra.g - rb.g) < threshold &&
        Math.abs(ra.b - rb.b) < threshold
      );
    }

    function shortId(el: Element): string {
      return el.id ? `#${el.id}` : el.className ? `.${String(el.className).split(' ')[0]}` : '';
    }

    const whiteBgElements: ScanResult['whiteBgElements'] = [];
    const darkOnDarkElements: ScanResult['darkOnDarkElements'] = [];
    const invisibleBorderElements: ScanResult['invisibleBorderElements'] = [];
    const inputBlendsElements: ScanResult['inputBlendsElements'] = [];

    // ── 1. White / near-white background scan ──
    const allEls = document.querySelectorAll('div, section, article, aside, header, main, nav, footer, table, tbody, thead, tr, td, th, li, ul, form, fieldset, card');
    allEls.forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.width < 50 || rect.height < 50) return;
      const styles = window.getComputedStyle(el);
      const bg = styles.backgroundColor;
      if (isWhiteOrNearWhite(bg) && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') {
        whiteBgElements.push({
          tag: el.tagName.toLowerCase(),
          id: shortId(el),
          cls: String(el.className).split(' ').slice(0, 3).join(' '),
          bg,
          w: Math.round(rect.width),
          h: Math.round(rect.height),
        });
      }
    });

    // ── 2. Dark-on-dark text scan ──
    const textEls = document.querySelectorAll('p, span, h1, h2, h3, h4, td, th, label, a');
    textEls.forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.width < 5 || rect.height < 5) return; // skip invisible
      const styles = window.getComputedStyle(el);
      const color = styles.color;
      const bg = styles.backgroundColor;
      if (bg === 'rgba(0, 0, 0, 0)' || bg === 'transparent') return; // skip transparent bg
      if (isDarkOnDark(color, bg)) {
        darkOnDarkElements.push({
          tag: el.tagName.toLowerCase(),
          id: shortId(el),
          cls: String(el.className).split(' ').slice(0, 2).join(' '),
          color,
          bg,
        });
      }
    });

    // ── 3. Invisible borders scan ──
    const borderEls = document.querySelectorAll('div, section, table, td, th, input, select, textarea, button, article');
    borderEls.forEach((el) => {
      const styles = window.getComputedStyle(el);
      const borderTop = styles.borderTopWidth;
      if (parseInt(borderTop, 10) < 1) return; // no visible border
      const borderColor = styles.borderTopColor;
      const bg = styles.backgroundColor;
      if (bg === 'rgba(0, 0, 0, 0)' || bg === 'transparent') return;
      if (rgbClose(borderColor, bg, 15)) {
        invisibleBorderElements.push({
          tag: el.tagName.toLowerCase(),
          id: shortId(el),
          cls: String(el.className).split(' ').slice(0, 2).join(' '),
          border: borderColor,
          bg,
        });
      }
    });

    // ── 4. Input field blending scan ──
    const formEls = document.querySelectorAll('input, select, textarea');
    formEls.forEach((el) => {
      const inputStyles = window.getComputedStyle(el);
      const inputBg = inputStyles.backgroundColor;
      if (inputBg === 'rgba(0, 0, 0, 0)' || inputBg === 'transparent') return;
      const parent = el.parentElement;
      if (!parent) return;
      const parentBg = window.getComputedStyle(parent).backgroundColor;
      if (parentBg === 'rgba(0, 0, 0, 0)' || parentBg === 'transparent') return;
      if (rgbClose(inputBg, parentBg, 10)) {
        const inputEl = el as HTMLInputElement;
        inputBlendsElements.push({
          tag: el.tagName.toLowerCase(),
          type: inputEl.type ?? '',
          inputBg,
          parentBg,
        });
      }
    });

    return {
      whiteBgElements: whiteBgElements.slice(0, 20), // cap to avoid huge reports
      darkOnDarkElements: darkOnDarkElements.slice(0, 20),
      invisibleBorderElements: invisibleBorderElements.slice(0, 20),
      inputBlendsElements: inputBlendsElements.slice(0, 20),
    };
  });
}

// ─── Core per-page test factory ───────────────────────────────────────────────

function runDarkModePageTest(
  url: string,
  page: import('@playwright/test').Page,
): Promise<void> {
  return (async () => {
    await navigateTo(page, url);

    const result = await scanPageForIssues(page);

    // ── White background ──
    if (result.whiteBgElements.length > 0) {
      const issue: DarkModeIssue = {
        url,
        kind: 'white-bg',
        element: result.whiteBgElements.map((e) => `${e.tag}${e.id}`).join(', '),
        detail: `${result.whiteBgElements.length} element(s) with white/near-white bg in dark mode. First: ${result.whiteBgElements[0].tag}${result.whiteBgElements[0].id} bg=${result.whiteBgElements[0].bg} (${result.whiteBgElements[0].w}×${result.whiteBgElements[0].h}px)`,
        count: result.whiteBgElements.length,
      };
      ALL_ISSUES.push(issue);
      test.info().annotations.push({
        type: 'white-bg',
        description: issue.detail,
      });
      // Soft assertion: record but don't block
      expect
        .soft(result.whiteBgElements.length, `[${url}] White backgrounds in dark mode`)
        .toBe(0);
    }

    // ── Dark-on-dark text ──
    if (result.darkOnDarkElements.length > 0) {
      const issue: DarkModeIssue = {
        url,
        kind: 'dark-on-dark',
        element: result.darkOnDarkElements.map((e) => `${e.tag}${e.id}`).join(', '),
        detail: `${result.darkOnDarkElements.length} dark-on-dark text element(s). First: ${result.darkOnDarkElements[0].tag}${result.darkOnDarkElements[0].id} color=${result.darkOnDarkElements[0].color} bg=${result.darkOnDarkElements[0].bg}`,
        count: result.darkOnDarkElements.length,
      };
      ALL_ISSUES.push(issue);
      test.info().annotations.push({
        type: 'dark-on-dark',
        description: issue.detail,
      });
      expect
        .soft(result.darkOnDarkElements.length, `[${url}] Dark-on-dark text`)
        .toBe(0);
    }

    // ── Invisible borders ──
    if (result.invisibleBorderElements.length > 0) {
      const issue: DarkModeIssue = {
        url,
        kind: 'invisible-border',
        element: result.invisibleBorderElements.map((e) => `${e.tag}${e.id}`).join(', '),
        detail: `${result.invisibleBorderElements.length} element(s) with border matching background. First: ${result.invisibleBorderElements[0].tag}${result.invisibleBorderElements[0].id} border=${result.invisibleBorderElements[0].border} bg=${result.invisibleBorderElements[0].bg}`,
        count: result.invisibleBorderElements.length,
      };
      ALL_ISSUES.push(issue);
      test.info().annotations.push({
        type: 'invisible-border',
        description: issue.detail,
      });
      expect
        .soft(result.invisibleBorderElements.length, `[${url}] Invisible borders in dark mode`)
        .toBe(0);
    }

    // ── Input blends into page ──
    if (result.inputBlendsElements.length > 0) {
      const issue: DarkModeIssue = {
        url,
        kind: 'input-blends',
        element: result.inputBlendsElements.map((e) => `${e.tag}[type=${e.type}]`).join(', '),
        detail: `${result.inputBlendsElements.length} input(s) blend into parent bg. First: ${result.inputBlendsElements[0].tag}[type=${result.inputBlendsElements[0].type}] inputBg=${result.inputBlendsElements[0].inputBg} parentBg=${result.inputBlendsElements[0].parentBg}`,
        count: result.inputBlendsElements.length,
      };
      ALL_ISSUES.push(issue);
      test.info().annotations.push({
        type: 'input-blends',
        description: issue.detail,
      });
      expect
        .soft(result.inputBlendsElements.length, `[${url}] Input fields blend into background`)
        .toBe(0);
    }
  })();
}

// ─── Test Suite ───────────────────────────────────────────────────────────────

test.describe('Dark Mode Audit', () => {
  test.beforeEach(async ({ page }) => {
    // Inject dark mode into localStorage BEFORE the app boots
    await page.addInitScript(injectDarkModeScript);
  });

  // ── Per-module groups ──────────────────────────────────────────────────────

  test.describe('Home & Analytics', () => {
    test.slow();
    for (const url of URL_GROUPS.home) {
      test(`dark mode: ${url}`, async ({ page }) => {
        await runDarkModePageTest(url, page);
      });
    }
  });

  test.describe('Tasks', () => {
    test.slow();
    for (const url of URL_GROUPS.tasks) {
      test(`dark mode: ${url}`, async ({ page }) => {
        await runDarkModePageTest(url, page);
      });
    }
  });

  test.describe('Calendar', () => {
    test.slow();
    for (const url of URL_GROUPS.calendar) {
      test(`dark mode: ${url}`, async ({ page }) => {
        await runDarkModePageTest(url, page);
      });
    }
  });

  test.describe('Planning', () => {
    test.slow();
    for (const url of URL_GROUPS.planning) {
      test(`dark mode: ${url}`, async ({ page }) => {
        await runDarkModePageTest(url, page);
      });
    }
  });

  test.describe('Processes', () => {
    test.slow();
    for (const url of URL_GROUPS.processes) {
      test(`dark mode: ${url}`, async ({ page }) => {
        await runDarkModePageTest(url, page);
      });
    }
  });

  test.describe('Projects', () => {
    test.slow();
    for (const url of URL_GROUPS.projects) {
      test(`dark mode: ${url}`, async ({ page }) => {
        await runDarkModePageTest(url, page);
      });
    }
  });

  test.describe('CRM', () => {
    test.slow();
    for (const url of URL_GROUPS.crm) {
      test(`dark mode: ${url}`, async ({ page }) => {
        await runDarkModePageTest(url, page);
      });
    }
  });

  test.describe('Documents', () => {
    test.slow();
    for (const url of URL_GROUPS.documents) {
      test(`dark mode: ${url}`, async ({ page }) => {
        await runDarkModePageTest(url, page);
      });
    }
  });

  test.describe('Design (PIR)', () => {
    test.slow();
    for (const url of URL_GROUPS.design) {
      test(`dark mode: ${url}`, async ({ page }) => {
        await runDarkModePageTest(url, page);
      });
    }
  });

  test.describe('Executive Docs', () => {
    test.slow();
    for (const url of URL_GROUPS.execDocs) {
      test(`dark mode: ${url}`, async ({ page }) => {
        await runDarkModePageTest(url, page);
      });
    }
  });

  test.describe('Finance', () => {
    test.slow();
    for (const url of URL_GROUPS.finance) {
      test(`dark mode: ${url}`, async ({ page }) => {
        await runDarkModePageTest(url, page);
      });
    }
  });

  test.describe('Pricing', () => {
    test.slow();
    for (const url of URL_GROUPS.pricing) {
      test(`dark mode: ${url}`, async ({ page }) => {
        await runDarkModePageTest(url, page);
      });
    }
  });

  test.describe('Supply & Warehouse', () => {
    test.slow();
    for (const url of URL_GROUPS.supply) {
      test(`dark mode: ${url}`, async ({ page }) => {
        await runDarkModePageTest(url, page);
      });
    }
  });

  test.describe('HR', () => {
    test.slow();
    for (const url of URL_GROUPS.hr) {
      test(`dark mode: ${url}`, async ({ page }) => {
        await runDarkModePageTest(url, page);
      });
    }
  });

  test.describe('Safety', () => {
    test.slow();
    for (const url of URL_GROUPS.safety) {
      test(`dark mode: ${url}`, async ({ page }) => {
        await runDarkModePageTest(url, page);
      });
    }
  });

  test.describe('Quality & Regulatory', () => {
    test.slow();
    for (const url of URL_GROUPS.quality) {
      test(`dark mode: ${url}`, async ({ page }) => {
        await runDarkModePageTest(url, page);
      });
    }
  });

  test.describe('Fleet & IoT', () => {
    test.slow();
    for (const url of URL_GROUPS.fleet) {
      test(`dark mode: ${url}`, async ({ page }) => {
        await runDarkModePageTest(url, page);
      });
    }
  });

  test.describe('Site & BIM', () => {
    test.slow();
    for (const url of URL_GROUPS.site) {
      test(`dark mode: ${url}`, async ({ page }) => {
        await runDarkModePageTest(url, page);
      });
    }
  });

  test.describe('Closeout', () => {
    test.slow();
    for (const url of URL_GROUPS.closeout) {
      test(`dark mode: ${url}`, async ({ page }) => {
        await runDarkModePageTest(url, page);
      });
    }
  });

  test.describe('Maintenance', () => {
    test.slow();
    for (const url of URL_GROUPS.maintenance) {
      test(`dark mode: ${url}`, async ({ page }) => {
        await runDarkModePageTest(url, page);
      });
    }
  });

  test.describe('Legal', () => {
    test.slow();
    for (const url of URL_GROUPS.legal) {
      test(`dark mode: ${url}`, async ({ page }) => {
        await runDarkModePageTest(url, page);
      });
    }
  });

  test.describe('Portal', () => {
    test.slow();
    for (const url of URL_GROUPS.portal) {
      test(`dark mode: ${url}`, async ({ page }) => {
        await runDarkModePageTest(url, page);
      });
    }
  });

  test.describe('Messenger', () => {
    test.slow();
    for (const url of URL_GROUPS.messenger) {
      test(`dark mode: ${url}`, async ({ page }) => {
        await runDarkModePageTest(url, page);
      });
    }
  });

  test.describe('Mail', () => {
    test.slow();
    for (const url of URL_GROUPS.mail) {
      test(`dark mode: ${url}`, async ({ page }) => {
        await runDarkModePageTest(url, page);
      });
    }
  });

  test.describe('Admin', () => {
    test.slow();
    for (const url of URL_GROUPS.admin) {
      test(`dark mode: ${url}`, async ({ page }) => {
        await runDarkModePageTest(url, page);
      });
    }
  });

  // ── Component-level dark mode checks ─────────────────────────────────────

  test.describe('Component Dark Mode', () => {
    test.slow();

    test('Tables: alternating row colors in dark mode', async ({ page }) => {
      await navigateTo(page, '/projects');

      const rowColors = await page.evaluate((): string[] => {
        const rows = document.querySelectorAll('tbody tr');
        const colors: string[] = [];
        rows.forEach((row) => {
          const bg = window.getComputedStyle(row).backgroundColor;
          if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') {
            colors.push(bg);
          }
        });
        return colors;
      });

      if (rowColors.length >= 2) {
        // In dark mode, alternating rows must NOT be white/near-white
        const whiteRows = rowColors.filter((c) => {
          const m = c.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/);
          if (!m) return false;
          return parseInt(m[1]) >= 240 && parseInt(m[2]) >= 240 && parseInt(m[3]) >= 240;
        });
        if (whiteRows.length > 0) {
          ALL_ISSUES.push({
            url: '/projects',
            kind: 'white-bg',
            element: 'tbody tr',
            detail: `${whiteRows.length} table row(s) have white/near-white bg in dark mode: ${whiteRows.join(', ')}`,
            count: whiteRows.length,
          });
          test.info().annotations.push({
            type: 'table-white-rows',
            description: `${whiteRows.length} white rows in dark mode table`,
          });
        }
        expect.soft(whiteRows.length, 'Table rows should not be white in dark mode').toBe(0);
      } else {
        // No table rows visible — may be using card layout or data not loaded
        test.info().annotations.push({
          type: 'table-not-found',
          description: 'No tbody tr rows found at /projects (may be card layout)',
        });
      }
    });

    test('Modals: backdrop visible in dark mode', async ({ page }) => {
      await navigateTo(page, '/projects');

      // Try to open a create modal via any "create"/"add" button
      const createBtn = page
        .locator('button')
        .filter({ hasText: /создать|добавить|новый|new|create|add/i })
        .first();

      const btnVisible = await createBtn.isVisible().catch(() => false);
      if (!btnVisible) {
        test.info().annotations.push({
          type: 'modal-not-triggered',
          description: 'No create button found at /projects to trigger modal',
        });
        return;
      }

      await createBtn.click().catch(() => {});
      await page.waitForTimeout(500);

      const backdropOpacity = await page.evaluate((): number | null => {
        // Look for common modal backdrop selectors
        const selectors = [
          '[class*="backdrop"]',
          '[class*="overlay"]',
          '[class*="modal-bg"]',
          '[role="dialog"] + div',
          '.fixed.inset-0',
        ];
        for (const sel of selectors) {
          const el = document.querySelector(sel);
          if (el) {
            const styles = window.getComputedStyle(el);
            return parseFloat(styles.opacity);
          }
        }
        return null;
      });

      if (backdropOpacity !== null) {
        expect
          .soft(backdropOpacity, 'Modal backdrop should have opacity > 0')
          .toBeGreaterThan(0);

        if (backdropOpacity === 0) {
          ALL_ISSUES.push({
            url: '/projects',
            kind: 'white-bg',
            element: 'modal backdrop',
            detail: 'Modal backdrop has opacity=0 in dark mode — invisible',
            count: 1,
          });
        }
      } else {
        test.info().annotations.push({
          type: 'modal-backdrop-not-found',
          description: 'Modal opened but no backdrop element detected',
        });
      }

      // Close modal if open
      await page.keyboard.press('Escape').catch(() => {});
    });

    test('Status badges: colors visible in dark mode', async ({ page }) => {
      await navigateTo(page, '/projects');

      const badgeIssues = await page.evaluate((): string[] => {
        const issues: string[] = [];
        // Status badges typically have class patterns like "badge", "status", "chip"
        const badges = document.querySelectorAll(
          '[class*="badge"], [class*="status"], [class*="chip"], [class*="tag"]',
        );

        badges.forEach((badge) => {
          const rect = badge.getBoundingClientRect();
          if (rect.width < 10 || rect.height < 8) return; // too small
          const styles = window.getComputedStyle(badge);
          const color = styles.color;
          const bg = styles.backgroundColor;

          const parseRgb = (c: string) => {
            const m = c.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/);
            return m ? { r: +m[1], g: +m[2], b: +m[3] } : null;
          };

          const tc = parseRgb(color);
          const bc = parseRgb(bg);
          if (!tc || !bc) return;
          if (bg === 'rgba(0, 0, 0, 0)' || bg === 'transparent') return;

          // Badge bg should not be white in dark mode
          if (bc.r >= 240 && bc.g >= 240 && bc.b >= 240) {
            issues.push(
              `badge bg=${bg} cls=${String(badge.className).split(' ').slice(0, 2).join(' ')}`,
            );
          }

          // Badge text should not be invisible (very dark text on very dark bg)
          const textDark = tc.r < 50 && tc.g < 50 && tc.b < 50;
          const bgDark = bc.r < 50 && bc.g < 50 && bc.b < 50;
          if (textDark && bgDark) {
            issues.push(
              `badge dark-on-dark: text=${color} bg=${bg} cls=${String(badge.className).split(' ').slice(0, 2).join(' ')}`,
            );
          }
        });

        return issues.slice(0, 15);
      });

      if (badgeIssues.length > 0) {
        ALL_ISSUES.push({
          url: '/projects',
          kind: 'dark-on-dark',
          element: 'status badges',
          detail: `${badgeIssues.length} badge contrast issue(s): ${badgeIssues[0]}`,
          count: badgeIssues.length,
        });
        test.info().annotations.push({
          type: 'badge-contrast',
          description: badgeIssues.join(' | '),
        });
      }
      expect
        .soft(badgeIssues.length, 'Status badges should be visible in dark mode')
        .toBe(0);
    });

    test('Toast notifications: visible in dark mode', async ({ page }) => {
      await navigateTo(page, '/');

      const toastContainerBg = await page.evaluate((): string | null => {
        // React Hot Toast and similar libs use these selectors
        const selectors = [
          '[data-hot-toast]',
          '[class*="toast"]',
          '[class*="notification"]',
          '[class*="snackbar"]',
          '#toast-container',
          '#notifications',
          '[aria-live="polite"]',
          '[aria-live="assertive"]',
        ];
        for (const sel of selectors) {
          const el = document.querySelector(sel);
          if (el) {
            return window.getComputedStyle(el).backgroundColor;
          }
        }
        return null;
      });

      if (toastContainerBg !== null && toastContainerBg !== 'rgba(0, 0, 0, 0)') {
        const m = toastContainerBg.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/);
        if (m) {
          const r = parseInt(m[1]);
          const g = parseInt(m[2]);
          const b = parseInt(m[3]);
          const isWhite = r >= 240 && g >= 240 && b >= 240;
          if (isWhite) {
            ALL_ISSUES.push({
              url: '/',
              kind: 'white-bg',
              element: 'toast container',
              detail: `Toast container bg is white/near-white in dark mode: ${toastContainerBg}`,
              count: 1,
            });
          }
          expect
            .soft(isWhite, 'Toast container should not be white in dark mode')
            .toBe(false);
        }
      } else {
        // Toast container may not be mounted until a toast fires — this is OK
        test.info().annotations.push({
          type: 'toast-not-mounted',
          description: 'Toast container not found (may only render when active)',
        });
      }
    });

    test('Loading skeletons: visible in dark mode', async ({ page }) => {
      // Navigate without waiting for networkidle to catch loading state
      await page.addInitScript(injectDarkModeScript);
      await page.goto('/projects', { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await forceDarkClass(page);

      // Immediately scan for skeleton elements (may disappear quickly)
      const skeletonIssues = await page.evaluate((): string[] => {
        const issues: string[] = [];
        const skeletons = document.querySelectorAll(
          '[class*="skeleton"], [class*="shimmer"], [class*="pulse"], [class*="animate-pulse"]',
        );

        skeletons.forEach((el) => {
          const styles = window.getComputedStyle(el);
          const bg = styles.backgroundColor;
          if (bg === 'rgba(0, 0, 0, 0)' || bg === 'transparent') return;

          const m = bg.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/);
          if (!m) return;
          const r = +m[1], g = +m[2], b = +m[3];

          // Skeleton bg should not be white in dark mode
          if (r >= 240 && g >= 240 && b >= 240) {
            issues.push(
              `skeleton bg=${bg} cls=${String(el.className).split(' ').slice(0, 3).join(' ')}`,
            );
          }
        });

        return issues.slice(0, 10);
      });

      if (skeletonIssues.length > 0) {
        ALL_ISSUES.push({
          url: '/projects',
          kind: 'white-bg',
          element: 'loading skeletons',
          detail: `${skeletonIssues.length} skeleton(s) have white bg in dark mode: ${skeletonIssues[0]}`,
          count: skeletonIssues.length,
        });
        test.info().annotations.push({
          type: 'skeleton-white-bg',
          description: skeletonIssues.join(' | '),
        });
      }
      expect
        .soft(skeletonIssues.length, 'Skeletons should not be white in dark mode')
        .toBe(0);
    });

    test('Input fields: distinguishable in dark mode', async ({ page }) => {
      await navigateTo(page, '/projects');

      // Try to open a form/modal to expose inputs
      const createBtn = page
        .locator('button')
        .filter({ hasText: /создать|добавить|новый|new|create|add/i })
        .first();
      const btnVisible = await createBtn.isVisible().catch(() => false);
      if (btnVisible) {
        await createBtn.click().catch(() => {});
        await page.waitForTimeout(600);
      }

      const inputIssues = await page.evaluate((): string[] => {
        const issues: string[] = [];

        const parseRgb = (c: string) => {
          const m = c.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/);
          return m ? { r: +m[1], g: +m[2], b: +m[3] } : null;
        };

        const inputs = document.querySelectorAll('input:not([type="hidden"]), select, textarea');
        inputs.forEach((el) => {
          const rect = el.getBoundingClientRect();
          if (rect.width < 20 || rect.height < 10) return;

          const styles = window.getComputedStyle(el);
          const inputBg = styles.backgroundColor;
          if (inputBg === 'rgba(0, 0, 0, 0)' || inputBg === 'transparent') return;

          const parentEl = el.parentElement;
          if (!parentEl) return;
          const parentBg = window.getComputedStyle(parentEl).backgroundColor;
          if (parentBg === 'rgba(0, 0, 0, 0)' || parentBg === 'transparent') return;

          const ib = parseRgb(inputBg);
          const pb = parseRgb(parentBg);
          if (!ib || !pb) return;

          const diff =
            Math.abs(ib.r - pb.r) + Math.abs(ib.g - pb.g) + Math.abs(ib.b - pb.b);

          // Input should differ from parent by at least 15 total RGB units
          if (diff < 15) {
            issues.push(
              `${el.tagName.toLowerCase()} inputBg=${inputBg} parentBg=${parentBg} diff=${diff}`,
            );
          }
        });

        return issues.slice(0, 10);
      });

      if (inputIssues.length > 0) {
        ALL_ISSUES.push({
          url: '/projects',
          kind: 'input-blends',
          element: 'input fields',
          detail: `${inputIssues.length} input(s) not distinguishable from parent in dark mode. First: ${inputIssues[0]}`,
          count: inputIssues.length,
        });
        test.info().annotations.push({
          type: 'input-blends',
          description: inputIssues.join(' | '),
        });
      }
      expect
        .soft(inputIssues.length, 'Inputs should be distinguishable from background in dark mode')
        .toBe(0);

      // Close any open modal
      await page.keyboard.press('Escape').catch(() => {});
    });
  });

  // ── Summary / report writer ───────────────────────────────────────────────

  test('Summary: write dark-mode-issues.json report', async () => {
    // Aggregate stats
    const byKind: Record<string, number> = {};
    const byUrl: Record<string, number> = {};
    const byModule: Record<string, number> = {};

    for (const issue of ALL_ISSUES) {
      byKind[issue.kind] = (byKind[issue.kind] ?? 0) + issue.count;
      byUrl[issue.url] = (byUrl[issue.url] ?? 0) + issue.count;

      // Derive module from URL
      const module = issue.url.split('/')[1] || 'home';
      byModule[module] = (byModule[module] ?? 0) + issue.count;
    }

    // Top offenders
    const topUrls = Object.entries(byUrl)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([url, count]) => ({ url, count }));

    // Unique URLs with issues
    const affectedUrls = [...new Set(ALL_ISSUES.map((i) => i.url))];

    // Total pages scanned
    const totalPages = ALL_URLS.length;

    const report = {
      generatedAt: new Date().toISOString(),
      summary: {
        totalPagesScanned: totalPages,
        pagesWithIssues: affectedUrls.length,
        totalIssues: ALL_ISSUES.reduce((s, i) => s + i.count, 0),
        issuesByKind: byKind,
        issuesByModule: byModule,
      },
      topOffenders: topUrls,
      allIssues: ALL_ISSUES,
    };

    const reportPath = path.resolve('e2e/reports/dark-mode-issues.json');
    try {
      fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf-8');
      test.info().annotations.push({
        type: 'report-path',
        description: reportPath,
      });
    } catch (err) {
      // Writing the report should not fail the test, just annotate
      test.info().annotations.push({
        type: 'report-write-error',
        description: String(err),
      });
    }

    // Soft assertion: ideally zero issues, but we never hard-fail the summary
    expect.soft(
      ALL_ISSUES.reduce((s, i) => s + i.count, 0),
      `Total dark mode issues across all ${totalPages} pages`,
    );

    // Always pass — this test only writes and summarises
    expect(true).toBe(true);
  });
});
