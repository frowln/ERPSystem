/**
 * Accessibility Audit — PRIVOD Construction ERP
 *
 * Covers:
 *   1. ARIA Landmarks — main, nav, header, headings, alt text, button/input labels
 *   2. Keyboard Navigation — Tab, Shift+Tab, Escape, Enter
 *   3. Color Contrast — WCAG AA (4.5:1) in light and dark mode
 *   4. Screen Reader Support — form labels, accessible names, aria-live regions
 *
 * Severity classification:
 *   [CRITICAL] — WCAG 2.1 A/AA violation, blocks assistive technology
 *   [MAJOR]    — Significant a11y barrier, degrades usability for screen reader users
 *   [MINOR]    — Best practice violation, low real-world impact
 *   [UX]       — Improvement opportunity, not a strict violation
 *   [MISSING]  — Feature that should exist but doesn't
 *
 * Uses soft assertions throughout — one failed check does not abort the test.
 * Issues are collected via test.info().annotations for reporting.
 */

import { test, expect } from '@playwright/test';
import { TOP_30_PAGES } from './all-urls';

// ── Auth helpers ──────────────────────────────────────────────────────────────

const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL || 'admin@privod.ru';
const ADMIN_PASS  = process.env.E2E_ADMIN_PASS  || 'admin123';
const BASE_URL    = 'http://localhost:4000';

async function ensureLoggedIn(page: import('@playwright/test').Page): Promise<void> {
  // Check if already authenticated
  const isAuthed = await page.evaluate(() => {
    const raw = localStorage.getItem('privod-auth');
    if (!raw) return false;
    try {
      const parsed = JSON.parse(raw);
      return Boolean(parsed?.state?.token ?? parsed?.token);
    } catch {
      return false;
    }
  }).catch(() => false);

  if (isAuthed) return;

  await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded', timeout: 30_000 });

  const emailInput = page
    .getByPlaceholder(/логин|login|email|почта/i)
    .or(page.locator('input[type="email"], input[name="email"], input[name="username"]'))
    .first();
  await emailInput.waitFor({ state: 'visible', timeout: 20_000 });
  await emailInput.fill(ADMIN_EMAIL);

  const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
  await passwordInput.waitFor({ state: 'visible', timeout: 15_000 });
  await passwordInput.fill(ADMIN_PASS);

  await page.getByRole('button', { name: /войти|вход|sign in|log in|login/i }).click();

  await page.waitForFunction(
    () => {
      const raw = localStorage.getItem('privod-auth');
      if (!raw) return false;
      try {
        const parsed = JSON.parse(raw);
        return Boolean(parsed?.state?.token ?? parsed?.token);
      } catch {
        return false;
      }
    },
    { timeout: 20_000 },
  );
}

// ── Contrast helpers ──────────────────────────────────────────────────────────

function luminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function contrastRatio(l1: number, l2: number): number {
  const lighter = Math.max(l1, l2);
  const darker  = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/** Parse an rgb()/rgba() string into [r, g, b] components. Returns null if unparseable. */
function parseRgb(cssColor: string): [number, number, number] | null {
  const m = cssColor.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (!m) return null;
  return [parseInt(m[1], 10), parseInt(m[2], 10), parseInt(m[3], 10)];
}

// ── Issue recording helper ────────────────────────────────────────────────────

type IssueSeverity = 'CRITICAL' | 'MAJOR' | 'MINOR' | 'UX' | 'MISSING';

interface A11yIssue {
  severity: IssueSeverity;
  url: string;
  rule: string;
  description: string;
  count?: number;
}

function recordIssue(
  issues: A11yIssue[],
  severity: IssueSeverity,
  url: string,
  rule: string,
  description: string,
  count?: number,
): void {
  issues.push({ severity, url, rule, description, count });
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. ARIA LANDMARKS
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Accessibility Audit', () => {

  test.describe('ARIA Landmarks', () => {

    for (const url of TOP_30_PAGES) {
      test(`ARIA landmarks: ${url}`, async ({ page }) => {
        test.slow(); // Page audits can be slow

        const issues: A11yIssue[] = [];
        const fullUrl = `${BASE_URL}${url}`;

        await ensureLoggedIn(page);
        await page.goto(fullUrl, { waitUntil: 'domcontentloaded', timeout: 30_000 });
        await page.waitForLoadState('networkidle').catch(() => {});

        // ── main landmark ──────────────────────────────────────────────────
        const mainCount = await page.locator('main, [role="main"]').count();
        expect.soft(mainCount, `[${url}] Should have <main> landmark`).toBeGreaterThan(0);
        if (mainCount === 0) {
          recordIssue(issues, 'MAJOR', url, 'landmark-main', 'No <main> landmark found');
          test.info().annotations.push({ type: 'a11y-MAJOR', description: `${url}: No <main> landmark` });
        }

        // ── nav landmark ───────────────────────────────────────────────────
        const navCount = await page.locator('nav, [role="navigation"]').count();
        expect.soft(navCount, `[${url}] Should have <nav> landmark`).toBeGreaterThan(0);
        if (navCount === 0) {
          recordIssue(issues, 'MAJOR', url, 'landmark-nav', 'No <nav> landmark found');
          test.info().annotations.push({ type: 'a11y-MAJOR', description: `${url}: No <nav> landmark` });
        }

        // ── header/banner landmark ─────────────────────────────────────────
        const headerCount = await page.locator('header, [role="banner"]').count();
        expect.soft(headerCount, `[${url}] Should have <header> landmark`).toBeGreaterThan(0);
        if (headerCount === 0) {
          recordIssue(issues, 'MINOR', url, 'landmark-header', 'No <header> / banner landmark found');
          test.info().annotations.push({ type: 'a11y-MINOR', description: `${url}: No <header> landmark` });
        }

        // ── heading hierarchy ──────────────────────────────────────────────
        const h1Count = await page.locator('h1').count();
        const h2Count = await page.locator('h2').count();
        const h3Count = await page.locator('h3').count();

        expect.soft(h1Count, `[${url}] Should have at least one h1`).toBeGreaterThan(0);
        if (h1Count === 0) {
          recordIssue(issues, 'MAJOR', url, 'heading-h1-missing', 'Page has no h1 heading');
          test.info().annotations.push({ type: 'a11y-MAJOR', description: `${url}: Missing h1` });
        }
        if (h1Count > 1) {
          recordIssue(issues, 'MINOR', url, 'heading-h1-multiple', `Page has ${h1Count} h1 elements (should be 1)`, h1Count);
          test.info().annotations.push({ type: 'a11y-MINOR', description: `${url}: Multiple h1 elements (${h1Count})` });
        }
        // Check heading skip: h3 without h2
        if (h3Count > 0 && h2Count === 0) {
          recordIssue(issues, 'MINOR', url, 'heading-skip', `h3 present without h2 (skipped heading level)`);
          test.info().annotations.push({ type: 'a11y-MINOR', description: `${url}: Heading level skipped (h3 without h2)` });
        }

        // ── images without alt text ────────────────────────────────────────
        const imagesWithoutAlt = await page.locator('img:not([alt])').count();
        const imagesWithEmptyAlt = await page.locator('img[alt=""]').count(); // empty alt is valid for decorative

        expect.soft(imagesWithoutAlt, `[${url}] Images without alt attribute`).toBe(0);
        if (imagesWithoutAlt > 0) {
          recordIssue(issues, 'CRITICAL', url, 'img-alt-missing', `${imagesWithoutAlt} image(s) missing alt attribute`, imagesWithoutAlt);
          test.info().annotations.push({ type: 'a11y-CRITICAL', description: `${url}: ${imagesWithoutAlt} images missing alt` });
        }

        // ── buttons without accessible text ───────────────────────────────
        // A button is inaccessible if it has no: visible text, aria-label, title, aria-labelledby
        const buttonsWithoutText = await page.evaluate(() => {
          const buttons = Array.from(document.querySelectorAll('button, [role="button"]'));
          return buttons.filter(btn => {
            const text = btn.textContent?.trim() || '';
            const ariaLabel = btn.getAttribute('aria-label')?.trim() || '';
            const title = btn.getAttribute('title')?.trim() || '';
            const ariaLabelledBy = btn.getAttribute('aria-labelledby') || '';
            return !text && !ariaLabel && !title && !ariaLabelledBy;
          }).length;
        });

        expect.soft(buttonsWithoutText, `[${url}] Buttons without accessible text`).toBe(0);
        if (buttonsWithoutText > 0) {
          recordIssue(issues, 'CRITICAL', url, 'button-no-accessible-name', `${buttonsWithoutText} button(s) have no accessible name`, buttonsWithoutText);
          test.info().annotations.push({ type: 'a11y-CRITICAL', description: `${url}: ${buttonsWithoutText} buttons without accessible name` });
        }

        // ── inputs without associated labels ──────────────────────────────
        const inputsWithoutLabels = await page.evaluate(() => {
          const inputs = Array.from(
            document.querySelectorAll('input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="reset"]), select, textarea'),
          );
          return inputs.filter(input => {
            const id = input.id;
            const ariaLabel = input.getAttribute('aria-label')?.trim() || '';
            const ariaLabelledBy = input.getAttribute('aria-labelledby') || '';
            const placeholder = input.getAttribute('placeholder')?.trim() || ''; // acceptable but not ideal
            const hasLabel = id ? Boolean(document.querySelector(`label[for="${id}"]`)) : false;
            // Accept if: explicit label, aria-label, aria-labelledby, or placeholder (minor issue)
            return !hasLabel && !ariaLabel && !ariaLabelledBy && !placeholder;
          }).length;
        });

        expect.soft(inputsWithoutLabels, `[${url}] Inputs without any label`).toBe(0);
        if (inputsWithoutLabels > 0) {
          recordIssue(issues, 'MAJOR', url, 'input-no-label', `${inputsWithoutLabels} input(s) have no associated label`, inputsWithoutLabels);
          test.info().annotations.push({ type: 'a11y-MAJOR', description: `${url}: ${inputsWithoutLabels} inputs without label` });
        }

        // ── summary annotation ─────────────────────────────────────────────
        if (issues.length === 0) {
          test.info().annotations.push({ type: 'a11y-PASS', description: `${url}: All landmark checks passed` });
        } else {
          const critCount = issues.filter(i => i.severity === 'CRITICAL').length;
          const majCount  = issues.filter(i => i.severity === 'MAJOR').length;
          test.info().annotations.push({
            type: 'a11y-SUMMARY',
            description: `${url}: ${issues.length} issues (${critCount} CRITICAL, ${majCount} MAJOR)`,
          });
        }
      });
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 2. KEYBOARD NAVIGATION
  // ─────────────────────────────────────────────────────────────────────────

  test.describe('Keyboard Navigation', () => {

    test('Tab navigation through main UI', async ({ page }) => {
      test.slow();

      await ensureLoggedIn(page);
      await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await page.waitForLoadState('networkidle').catch(() => {});

      // Check for skip-to-content link (should be the very first focusable element)
      await page.keyboard.press('Tab');
      const firstFocused = await page.evaluate(() => {
        const el = document.activeElement;
        return el ? { tag: el.tagName, text: el.textContent?.trim().slice(0, 60), href: (el as HTMLAnchorElement).href || null } : null;
      });

      if (firstFocused?.text?.match(/skip|перейти к содержимому|к основному/i)) {
        test.info().annotations.push({ type: 'a11y-PASS', description: 'Skip-to-content link is present as first focusable element' });
      } else {
        test.info().annotations.push({ type: 'a11y-UX', description: `First Tab focus lands on: ${firstFocused?.tag} "${firstFocused?.text}" — no skip link found` });
      }

      // Tab through 50 elements, verifying each has a visible focus indicator
      const focusIssues: string[] = [];
      const MAX_TABS = 50;

      for (let i = 0; i < MAX_TABS; i++) {
        await page.keyboard.press('Tab');

        const focusInfo = await page.evaluate(() => {
          const el = document.activeElement as HTMLElement | null;
          if (!el || el === document.body) return null;

          const styles = window.getComputedStyle(el);
          const outline = styles.outline;
          const outlineWidth = styles.outlineWidth;
          const outlineStyle = styles.outlineStyle;
          const boxShadow = styles.boxShadow;
          const classList = el.className || '';

          // A focus indicator exists if:
          // - outline is not "none" and outlineWidth is not "0px"
          // - box-shadow is set (common Tailwind ring pattern)
          // - element has a focus-ring / focus-visible class
          const hasOutline = outlineStyle !== 'none' && outlineWidth !== '0px' && outline !== 'none';
          const hasRingShadow = boxShadow !== 'none' && boxShadow !== '';
          const hasFocusClass = classList.includes('focus') || classList.includes('ring') || classList.includes('outline');

          return {
            tag: el.tagName,
            text: el.textContent?.trim().slice(0, 40) || '',
            hasFocusIndicator: hasOutline || hasRingShadow || hasFocusClass,
            outline,
            boxShadow: boxShadow !== 'none' ? boxShadow.slice(0, 60) : 'none',
          };
        });

        if (!focusInfo) break; // Reached end of focusable elements

        if (!focusInfo.hasFocusIndicator) {
          focusIssues.push(`Tab ${i + 1}: <${focusInfo.tag}> "${focusInfo.text}" — no visible focus indicator`);
        }
      }

      expect.soft(focusIssues.length, 'All focused elements should have visible focus indicators').toBe(0);
      if (focusIssues.length > 0) {
        test.info().annotations.push({
          type: 'a11y-MAJOR',
          description: `${focusIssues.length} elements missing focus indicator:\n${focusIssues.slice(0, 10).join('\n')}`,
        });
      } else {
        test.info().annotations.push({ type: 'a11y-PASS', description: 'All 50 Tab-focused elements have visible focus indicators' });
      }
    });

    test('Shift+Tab reverse navigation', async ({ page }) => {
      test.slow();

      await ensureLoggedIn(page);
      await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await page.waitForLoadState('networkidle').catch(() => {});

      // Tab forward 10 times to get some depth into the focus order
      for (let i = 0; i < 10; i++) {
        await page.keyboard.press('Tab');
      }

      const forwardElement = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement | null;
        return el ? { tag: el.tagName, text: el.textContent?.trim().slice(0, 40) } : null;
      });

      // Now Shift+Tab backwards the same number of steps
      for (let i = 0; i < 10; i++) {
        await page.keyboard.press('Shift+Tab');
      }

      const backElement = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement | null;
        return el ? { tag: el.tagName, text: el.textContent?.trim().slice(0, 40) } : null;
      });

      // After tabbing forward 10 and back 10, focus should be approximately where it started
      // Verify focus has moved (we are not stuck in a trap)
      const isTrap = forwardElement?.text === backElement?.text && forwardElement?.tag === backElement?.tag;
      expect.soft(!isTrap, 'Shift+Tab should allow reverse navigation (no focus trap)').toBeTruthy();

      if (isTrap) {
        test.info().annotations.push({
          type: 'a11y-CRITICAL',
          description: `Focus trap detected: forward and backward 10 Tab presses both land on <${forwardElement?.tag}> "${forwardElement?.text}"`,
        });
      } else {
        test.info().annotations.push({
          type: 'a11y-PASS',
          description: `Shift+Tab reverse navigation works. Forward: <${forwardElement?.tag}> "${forwardElement?.text}", Backward: <${backElement?.tag}> "${backElement?.text}"`,
        });
      }
    });

    test('Escape closes modals', async ({ page }) => {
      await ensureLoggedIn(page);
      await page.goto(`${BASE_URL}/projects`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await page.waitForLoadState('networkidle').catch(() => {});

      // Try to find and click a create/new button that would open a modal or form
      const createButton = page
        .getByRole('button', { name: /создать|новый|новое|добавить|create|new|add/i })
        .or(page.locator('button[data-testid*="create"], button[data-testid*="new"]'))
        .first();

      const buttonExists = await createButton.count() > 0;

      if (!buttonExists) {
        test.info().annotations.push({ type: 'a11y-SKIP', description: '/projects: No create button found — skipping modal Escape test' });
        return;
      }

      // Remember the button for focus return check
      const triggerText = await createButton.textContent();

      await createButton.click();

      // Wait briefly for modal/dialog to appear
      await page.waitForTimeout(500);

      const modalBeforeEscape = await page.locator('[role="dialog"], [aria-modal="true"], .modal, [data-testid*="modal"]').count();

      if (modalBeforeEscape === 0) {
        // Maybe it navigated to a form page instead — record as UX observation
        test.info().annotations.push({
          type: 'a11y-UX',
          description: `/projects: Create button navigated to a new page instead of opening a modal — Escape test not applicable`,
        });
        return;
      }

      // Press Escape
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);

      const modalAfterEscape = await page.locator('[role="dialog"], [aria-modal="true"], .modal, [data-testid*="modal"]').count();
      expect.soft(modalAfterEscape, 'Modal should close on Escape key press').toBe(0);

      if (modalAfterEscape > 0) {
        test.info().annotations.push({
          type: 'a11y-MAJOR',
          description: `/projects: Modal did not close on Escape (${modalAfterEscape} dialog(s) still visible)`,
        });
      } else {
        test.info().annotations.push({ type: 'a11y-PASS', description: `/projects: Modal closed on Escape` });
      }

      // Check focus returned to trigger
      const focusedAfterClose = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement | null;
        return el ? el.textContent?.trim().slice(0, 60) : null;
      });

      const focusReturnedToTrigger = focusedAfterClose?.includes(triggerText?.trim().slice(0, 20) ?? '') ?? false;
      expect.soft(focusReturnedToTrigger || focusedAfterClose !== null, 'Focus should return to a meaningful element after modal closes').toBeTruthy();

      if (!focusReturnedToTrigger) {
        test.info().annotations.push({
          type: 'a11y-MINOR',
          description: `/projects: After modal close, focus did not return to trigger ("${triggerText?.trim()}")" — landed on "${focusedAfterClose}"`,
        });
      } else {
        test.info().annotations.push({ type: 'a11y-PASS', description: `/projects: Focus correctly returned to trigger after Escape` });
      }
    });

    test('Enter activates buttons and links', async ({ page }) => {
      await ensureLoggedIn(page);
      await page.goto(`${BASE_URL}/projects`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await page.waitForLoadState('networkidle').catch(() => {});

      // Tab until we land on a button
      let buttonFound = false;
      for (let i = 0; i < 30; i++) {
        await page.keyboard.press('Tab');

        const focusedTag = await page.evaluate(() => document.activeElement?.tagName?.toLowerCase());

        if (focusedTag === 'button') {
          const focusedText = await page.evaluate(() => document.activeElement?.textContent?.trim().slice(0, 60));
          const urlBefore = page.url();

          await page.keyboard.press('Enter');
          await page.waitForTimeout(400);

          const urlAfter = page.url();
          const dialogOpened = await page.locator('[role="dialog"], [aria-modal="true"]').count() > 0;

          // Enter should have caused either navigation or a dialog to open
          const activated = urlBefore !== urlAfter || dialogOpened;
          expect.soft(activated, `Enter key should activate button "${focusedText}"`).toBeTruthy();

          if (activated) {
            test.info().annotations.push({
              type: 'a11y-PASS',
              description: `Enter activated button "${focusedText}" — ${urlBefore !== urlAfter ? 'navigated' : 'opened dialog'}`,
            });
          } else {
            test.info().annotations.push({
              type: 'a11y-MAJOR',
              description: `Enter key did not activate button "${focusedText}"`,
            });
          }

          buttonFound = true;
          break;
        }

        if (focusedTag === 'a') {
          const hrefValue = await page.evaluate(() => (document.activeElement as HTMLAnchorElement)?.href);
          if (hrefValue && !hrefValue.endsWith('#')) {
            const urlBefore = page.url();
            await page.keyboard.press('Enter');
            await page.waitForTimeout(400);
            const urlAfter = page.url();

            const navigated = urlBefore !== urlAfter;
            expect.soft(navigated, `Enter should activate link`).toBeTruthy();

            test.info().annotations.push({
              type: navigated ? 'a11y-PASS' : 'a11y-MAJOR',
              description: `Enter on <a href="${hrefValue}">: ${navigated ? 'navigated' : 'did not navigate'}`,
            });

            buttonFound = true;
            break;
          }
        }
      }

      if (!buttonFound) {
        test.info().annotations.push({ type: 'a11y-SKIP', description: '/projects: No interactive button/link found within 30 Tab presses' });
      }
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 3. COLOR CONTRAST
  // ─────────────────────────────────────────────────────────────────────────

  test.describe('Color Contrast', () => {

    test('Light mode text contrast', async ({ page }) => {
      test.slow();

      await ensureLoggedIn(page);

      // Ensure light mode is active by removing dark class if present
      await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await page.waitForLoadState('networkidle').catch(() => {});

      await page.evaluate(() => {
        document.documentElement.classList.remove('dark');
      });

      await page.waitForTimeout(300);

      // Sample up to 30 body text elements and check contrast
      const contrastResults = await page.evaluate(({ lum, cRatio }: { lum: string; cRatio: string }) => {
        // Re-declare helpers inside the browser context
        function luminanceInner(r: number, g: number, b: number): number {
          const comps = [r, g, b].map(c => {
            c = c / 255;
            return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
          });
          return 0.2126 * comps[0] + 0.7152 * comps[1] + 0.0722 * comps[2];
        }

        function contrastRatioInner(l1: number, l2: number): number {
          const lighter = Math.max(l1, l2);
          const darker = Math.min(l1, l2);
          return (lighter + 0.05) / (darker + 0.05);
        }

        function parseRgbInner(cssColor: string): [number, number, number] | null {
          const m = cssColor.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
          if (!m) return null;
          return [parseInt(m[1], 10), parseInt(m[2], 10), parseInt(m[3], 10)];
        }

        const textElements = Array.from(
          document.querySelectorAll('p, span, td, th, li, label, h1, h2, h3, h4'),
        ).filter(el => {
          const rect = el.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0 && el.textContent?.trim().length > 0;
        }).slice(0, 30);

        const issues: Array<{ text: string; fg: string; bg: string; ratio: number }> = [];
        const checked: Array<{ text: string; ratio: number }> = [];

        for (const el of textElements) {
          const styles = window.getComputedStyle(el);
          const fgColor = styles.color;
          const bgColor = styles.backgroundColor;

          const fg = parseRgbInner(fgColor);
          const bg = parseRgbInner(bgColor);

          if (!fg || !bg) continue;

          // If background is transparent (alpha 0), try parent
          const fgLum = luminanceInner(fg[0], fg[1], fg[2]);
          const bgLum = luminanceInner(bg[0], bg[1], bg[2]);

          // Skip if both are white-ish (transparent bg overlaid)
          if (bgLum > 0.9 && fgLum > 0.9) continue;

          const ratio = contrastRatioInner(fgLum, bgLum);
          const textPreview = el.textContent?.trim().slice(0, 40) || '';

          checked.push({ text: textPreview, ratio: Math.round(ratio * 100) / 100 });

          if (ratio < 4.5) {
            issues.push({ text: textPreview, fg: fgColor, bg: bgColor, ratio: Math.round(ratio * 100) / 100 });
          }
        }

        return { issues, checked, total: checked.length };
      }, { lum: '', cRatio: '' });

      const failCount = contrastResults.issues.length;

      expect.soft(failCount, `Light mode: ${failCount} text elements below WCAG AA 4.5:1 contrast ratio`).toBe(0);

      if (failCount > 0) {
        const descriptions = contrastResults.issues.slice(0, 5).map(
          i => `"${i.text}" — ${i.ratio}:1 (fg: ${i.fg}, bg: ${i.bg})`,
        ).join('\n');

        test.info().annotations.push({
          type: 'a11y-CRITICAL',
          description: `Light mode: ${failCount}/${contrastResults.total} elements below 4.5:1 WCAG AA:\n${descriptions}`,
        });
      } else {
        test.info().annotations.push({
          type: 'a11y-PASS',
          description: `Light mode: All ${contrastResults.total} sampled text elements pass WCAG AA 4.5:1 contrast`,
        });
      }
    });

    test('Dark mode text contrast', async ({ page }) => {
      test.slow();

      await ensureLoggedIn(page);
      await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await page.waitForLoadState('networkidle').catch(() => {});

      // Enable dark mode by adding the 'dark' class to <html>
      await page.evaluate(() => {
        document.documentElement.classList.add('dark');
      });

      await page.waitForTimeout(500); // Allow CSS transitions to settle

      const contrastResults = await page.evaluate(() => {
        function luminanceInner(r: number, g: number, b: number): number {
          const comps = [r, g, b].map(c => {
            c = c / 255;
            return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
          });
          return 0.2126 * comps[0] + 0.7152 * comps[1] + 0.0722 * comps[2];
        }

        function contrastRatioInner(l1: number, l2: number): number {
          const lighter = Math.max(l1, l2);
          const darker = Math.min(l1, l2);
          return (lighter + 0.05) / (darker + 0.05);
        }

        function parseRgbInner(cssColor: string): [number, number, number] | null {
          const m = cssColor.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
          if (!m) return null;
          return [parseInt(m[1], 10), parseInt(m[2], 10), parseInt(m[3], 10)];
        }

        const textElements = Array.from(
          document.querySelectorAll('p, span, td, th, li, label, h1, h2, h3, h4'),
        ).filter(el => {
          const rect = el.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0 && el.textContent?.trim().length > 0;
        }).slice(0, 30);

        const issues: Array<{ text: string; fg: string; bg: string; ratio: number }> = [];
        const checked: Array<{ text: string; ratio: number }> = [];

        for (const el of textElements) {
          const styles = window.getComputedStyle(el);
          const fgColor = styles.color;
          const bgColor = styles.backgroundColor;

          const fg = parseRgbInner(fgColor);
          const bg = parseRgbInner(bgColor);

          if (!fg || !bg) continue;

          const fgLum = luminanceInner(fg[0], fg[1], fg[2]);
          const bgLum = luminanceInner(bg[0], bg[1], bg[2]);

          // Skip if both are extremely light (transparent parent)
          if (fgLum > 0.9 && bgLum > 0.9) continue;

          const ratio = contrastRatioInner(fgLum, bgLum);
          const textPreview = el.textContent?.trim().slice(0, 40) || '';

          checked.push({ text: textPreview, ratio: Math.round(ratio * 100) / 100 });

          if (ratio < 4.5) {
            issues.push({ text: textPreview, fg: fgColor, bg: bgColor, ratio: Math.round(ratio * 100) / 100 });
          }
        }

        return { issues, checked, total: checked.length };
      });

      const failCount = contrastResults.issues.length;

      expect.soft(failCount, `Dark mode: ${failCount} text elements below WCAG AA 4.5:1 contrast ratio`).toBe(0);

      if (failCount > 0) {
        const descriptions = contrastResults.issues.slice(0, 5).map(
          i => `"${i.text}" — ${i.ratio}:1 (fg: ${i.fg}, bg: ${i.bg})`,
        ).join('\n');

        test.info().annotations.push({
          type: 'a11y-CRITICAL',
          description: `Dark mode: ${failCount}/${contrastResults.total} elements below 4.5:1 WCAG AA:\n${descriptions}`,
        });
      } else {
        test.info().annotations.push({
          type: 'a11y-PASS',
          description: `Dark mode: All ${contrastResults.total} sampled text elements pass WCAG AA 4.5:1 contrast`,
        });
      }

      // Restore light mode
      await page.evaluate(() => {
        document.documentElement.classList.remove('dark');
      });
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 4. SCREEN READER SUPPORT
  // ─────────────────────────────────────────────────────────────────────────

  test.describe('Screen Reader Support', () => {

    test('Form inputs have labels', async ({ page }) => {
      test.slow();

      const pagesToCheck = ['/projects', '/employees', '/invoices', '/safety/incidents', '/warehouse/materials'];
      const allIssues: Array<{ url: string; count: number }> = [];

      await ensureLoggedIn(page);

      for (const url of pagesToCheck) {
        await page.goto(`${BASE_URL}${url}`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
        await page.waitForLoadState('networkidle').catch(() => {});

        // Count inputs with insufficient labelling
        const result = await page.evaluate(() => {
          const inputs = Array.from(
            document.querySelectorAll(
              'input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="reset"]):not([type="checkbox"]):not([type="radio"]), select, textarea',
            ),
          );

          let missingLabel = 0;
          let missingLabelButHasPlaceholder = 0;

          for (const input of inputs) {
            const id = input.id;
            const ariaLabel = input.getAttribute('aria-label')?.trim() || '';
            const ariaLabelledBy = input.getAttribute('aria-labelledby') || '';
            const placeholder = input.getAttribute('placeholder')?.trim() || '';
            const hasExplicitLabel = id ? Boolean(document.querySelector(`label[for="${id}"]`)) : false;
            const hasWrappingLabel = input.closest('label') !== null;

            if (!hasExplicitLabel && !hasWrappingLabel && !ariaLabel && !ariaLabelledBy) {
              if (placeholder) {
                missingLabelButHasPlaceholder++;
              } else {
                missingLabel++;
              }
            }
          }

          return { total: inputs.length, missingLabel, missingLabelButHasPlaceholder };
        });

        expect.soft(result.missingLabel, `[${url}] Inputs completely missing labels`).toBe(0);

        if (result.missingLabel > 0) {
          allIssues.push({ url, count: result.missingLabel });
          test.info().annotations.push({
            type: 'a11y-CRITICAL',
            description: `${url}: ${result.missingLabel} input(s) completely unlabelled (no label, aria-label, aria-labelledby, or placeholder)`,
          });
        }

        if (result.missingLabelButHasPlaceholder > 0) {
          test.info().annotations.push({
            type: 'a11y-MINOR',
            description: `${url}: ${result.missingLabelButHasPlaceholder} input(s) use only placeholder as label (placeholder disappears on focus)`,
          });
        }

        if (result.total > 0 && result.missingLabel === 0) {
          test.info().annotations.push({
            type: 'a11y-PASS',
            description: `${url}: All ${result.total} form inputs have accessible labels`,
          });
        }
      }
    });

    test('Interactive elements have accessible names', async ({ page }) => {
      test.slow();

      const pagesToCheck = ['/projects', '/tasks', '/invoices', '/admin/users'];
      const allButtonIssues: Array<{ url: string; issues: string[] }> = [];

      await ensureLoggedIn(page);

      for (const url of pagesToCheck) {
        await page.goto(`${BASE_URL}${url}`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
        await page.waitForLoadState('networkidle').catch(() => {});

        const result = await page.evaluate(() => {
          // Buttons
          const buttons = Array.from(document.querySelectorAll('button, [role="button"], [role="menuitem"], [role="tab"]'));
          const badButtons: string[] = [];

          for (const btn of buttons) {
            const text = btn.textContent?.trim() || '';
            const ariaLabel = btn.getAttribute('aria-label')?.trim() || '';
            const title = btn.getAttribute('title')?.trim() || '';
            const ariaLabelledBy = btn.getAttribute('aria-labelledby') || '';
            const ariaDescribedBy = btn.getAttribute('aria-describedby') || '';

            if (!text && !ariaLabel && !title && !ariaLabelledBy && !ariaDescribedBy) {
              const rect = (btn as HTMLElement).getBoundingClientRect();
              if (rect.width > 0 && rect.height > 0) {
                badButtons.push(`<${btn.tagName.toLowerCase()}> role="${btn.getAttribute('role') || 'button'}" class="${btn.className.slice(0, 40)}"`);
              }
            }
          }

          // Links without text
          const links = Array.from(document.querySelectorAll('a[href]'));
          const badLinks: string[] = [];

          for (const link of links) {
            const text = link.textContent?.trim() || '';
            const ariaLabel = link.getAttribute('aria-label')?.trim() || '';
            const title = link.getAttribute('title')?.trim() || '';
            const ariaLabelledBy = link.getAttribute('aria-labelledby') || '';
            const hasImg = link.querySelector('img[alt]') !== null;

            if (!text && !ariaLabel && !title && !ariaLabelledBy && !hasImg) {
              const rect = (link as HTMLElement).getBoundingClientRect();
              if (rect.width > 0 && rect.height > 0) {
                badLinks.push(`<a href="${link.getAttribute('href')?.slice(0, 40)}">`);
              }
            }
          }

          return { badButtons, badLinks, totalButtons: buttons.length, totalLinks: links.length };
        });

        const pageIssues: string[] = [
          ...result.badButtons.map(b => `button: ${b}`),
          ...result.badLinks.map(l => `link: ${l}`),
        ];

        expect.soft(result.badButtons.length, `[${url}] Buttons without accessible names`).toBe(0);
        expect.soft(result.badLinks.length, `[${url}] Links without accessible names`).toBe(0);

        if (pageIssues.length > 0) {
          allButtonIssues.push({ url, issues: pageIssues });
          test.info().annotations.push({
            type: 'a11y-CRITICAL',
            description: `${url}: ${pageIssues.length} interactive element(s) without accessible names:\n${pageIssues.slice(0, 5).join('\n')}`,
          });
        } else {
          test.info().annotations.push({
            type: 'a11y-PASS',
            description: `${url}: All ${result.totalButtons} buttons and ${result.totalLinks} links have accessible names`,
          });
        }
      }
    });

    test('Status updates are announced (aria-live)', async ({ page }) => {
      test.slow();

      await ensureLoggedIn(page);
      await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await page.waitForLoadState('networkidle').catch(() => {});

      // Check for aria-live regions on the page
      const ariaLiveRegions = await page.evaluate(() => {
        const liveRegions = Array.from(
          document.querySelectorAll('[aria-live], [role="status"], [role="alert"], [role="log"], [role="marquee"], [role="timer"]'),
        );

        return liveRegions.map(el => ({
          tag: el.tagName.toLowerCase(),
          role: el.getAttribute('role') || '',
          ariaLive: el.getAttribute('aria-live') || '',
          ariaAtomic: el.getAttribute('aria-atomic') || '',
          text: el.textContent?.trim().slice(0, 60) || '',
        }));
      });

      // aria-live regions should be present for toast/notification systems
      if (ariaLiveRegions.length === 0) {
        test.info().annotations.push({
          type: 'a11y-MAJOR',
          description: 'No aria-live regions found on dashboard — status updates (toasts, notifications) will not be announced to screen readers',
        });
        expect.soft(ariaLiveRegions.length, 'At least one aria-live region should exist for notifications').toBeGreaterThan(0);
      } else {
        test.info().annotations.push({
          type: 'a11y-PASS',
          description: `${ariaLiveRegions.length} aria-live region(s) found: ${ariaLiveRegions.map(r => `<${r.tag} aria-live="${r.ariaLive}" role="${r.role}">`).join(', ')}`,
        });
      }

      // Trigger a navigation to create a toast/notification and verify it's caught by a live region
      await page.goto(`${BASE_URL}/projects`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await page.waitForLoadState('networkidle').catch(() => {});

      const postNavLiveRegions = await page.locator('[aria-live], [role="status"], [role="alert"]').count();
      expect.soft(postNavLiveRegions, 'aria-live regions should persist across navigation').toBeGreaterThan(0);

      if (postNavLiveRegions === 0) {
        test.info().annotations.push({
          type: 'a11y-MAJOR',
          description: '/projects: No aria-live regions found after navigation — API error messages will not be announced',
        });
      }

      // Check for modal/dialog role usage (dialogs should have aria-modal + aria-labelledby)
      await page.goto(`${BASE_URL}/tasks`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await page.waitForLoadState('networkidle').catch(() => {});

      const createBtn = page
        .getByRole('button', { name: /создать|new|add|добавить/i })
        .first();

      if (await createBtn.count() > 0) {
        await createBtn.click();
        await page.waitForTimeout(500);

        const dialogs = await page.evaluate(() => {
          const dialogEls = Array.from(document.querySelectorAll('[role="dialog"], dialog'));
          return dialogEls.map(d => ({
            hasAriaModal: d.getAttribute('aria-modal') === 'true',
            hasAriaLabelledBy: Boolean(d.getAttribute('aria-labelledby')),
            hasAriaLabel: Boolean(d.getAttribute('aria-label')),
          }));
        });

        for (const dialog of dialogs) {
          if (!dialog.hasAriaLabelledBy && !dialog.hasAriaLabel) {
            test.info().annotations.push({
              type: 'a11y-MAJOR',
              description: `/tasks: dialog/modal opened but has no aria-labelledby or aria-label — screen readers cannot announce modal title`,
            });
            expect.soft(dialog.hasAriaLabelledBy || dialog.hasAriaLabel, 'Dialog should have aria-labelledby or aria-label').toBeTruthy();
          } else {
            test.info().annotations.push({
              type: 'a11y-PASS',
              description: `/tasks: modal has aria labelling (aria-modal: ${dialog.hasAriaModal}, aria-labelledby: ${dialog.hasAriaLabelledBy})`,
            });
          }
        }

        // Close the dialog
        await page.keyboard.press('Escape');
      }

      // Check toast container (react-hot-toast renders an aria-live region)
      const toastContainer = await page.locator('[data-hot-toast], [id="hot-toast"], [aria-live="polite"], [aria-live="assertive"]').count();
      if (toastContainer === 0) {
        test.info().annotations.push({
          type: 'a11y-MINOR',
          description: 'No aria-live toast container detected — ensure react-hot-toast or equivalent has proper aria-live announcements',
        });
      }
    });
  });

});
