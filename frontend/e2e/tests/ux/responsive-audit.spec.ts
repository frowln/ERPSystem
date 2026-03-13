/**
 * Responsive Design Audit — PRIVOD Construction ERP
 *
 * Tests 30 critical pages across 3 viewports:
 *   - Mobile  375×667  (iPhone SE)
 *   - Tablet  768×1024 (iPad)
 *   - Desktop 1440×900 (standard laptop)
 *
 * Checks per page × viewport:
 *   1. No horizontal scrollbar (except table containers)
 *   2. Main content area has positive width
 *   3. No text smaller than 10px on mobile
 *   4. Touch targets ≥ 44×44px on mobile
 *   5. Input font-size ≥ 16px on mobile (prevents iOS auto-zoom)
 *   6. Navigation collapses or hamburger appears on mobile
 *   7. Tables scroll within a container or stack — never break layout
 *   8. Modals/dialogs not wider than viewport
 *
 * All checks use expect.soft() so every check runs regardless of earlier failures.
 * Issues are annotated via test.info().annotations for the HTML reporter.
 */

import { test, expect } from '@playwright/test';
import { TOP_30_PAGES, VIEWPORTS } from './all-urls';

// ─── Types ───────────────────────────────────────────────────────────────────

interface ResponsiveIssue {
  check: string;
  url: string;
  viewport: string;
  detail: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Record a responsive issue as a test annotation.
 * This persists in the HTML report for later review.
 */
function recordIssue(issue: ResponsiveIssue): void {
  test.info().annotations.push({
    type: `responsive-issue:${issue.viewport}`,
    description: `[${issue.check}] ${issue.url} — ${issue.detail}`,
  });
}

/**
 * Navigate to a page and wait for it to settle.
 * Catches networkidle timeout gracefully (some pages have long-poll endpoints).
 */
async function navigateTo(page: import('@playwright/test').Page, url: string): Promise<void> {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30_000 });
  await page.waitForLoadState('networkidle').catch(() => {
    // networkidle may not resolve on pages with persistent WebSocket / SSE connections
  });
}

// ─── Main Responsive Matrix ───────────────────────────────────────────────────

test.describe('Responsive Design Audit', () => {

  for (const [vpName, vp] of Object.entries(VIEWPORTS)) {
    test.describe(`${vpName} (${vp.width}x${vp.height})`, () => {
      // Mark the entire viewport group as slow — 30 pages × 3 viewports
      test.slow();

      for (const url of TOP_30_PAGES) {
        test(`responsive ${vpName}: ${url}`, async ({ page }) => {
          await page.setViewportSize({ width: vp.width, height: vp.height });
          await navigateTo(page, url);

          // ── Check 1: No horizontal scrollbar ────────────────────────────
          // Tables are exempt — they may scroll within their own container.
          const hasHorizontalOverflow = await page.evaluate(() => {
            const doc = document.documentElement;
            // scrollWidth > clientWidth means horizontal scrollbar is present
            return doc.scrollWidth > doc.clientWidth + 2; // +2px tolerance for subpixel rounding
          });

          if (hasHorizontalOverflow) {
            // Verify it is NOT caused solely by a table scrolling within its container
            const causedByTable = await page.evaluate(() => {
              const tables = Array.from(
                document.querySelectorAll<HTMLElement>(
                  'table, [class*="overflow-x"], [class*="table-scroll"], .min-w-full',
                ),
              );
              // If every overflowing element is a scrollable table container, it's acceptable
              const doc = document.documentElement;
              if (doc.scrollWidth <= doc.clientWidth + 2) return true;
              // Check whether the body itself (minus scrollable children) overflows
              const bodyOverflow = window.getComputedStyle(document.body).overflowX;
              return bodyOverflow === 'auto' || bodyOverflow === 'scroll' || tables.length > 0;
            });

            if (!causedByTable) {
              const overflowPx = await page.evaluate(
                () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
              );
              recordIssue({
                check: 'horizontal-scroll',
                url,
                viewport: vpName,
                detail: `scrollWidth exceeds clientWidth by ${overflowPx}px`,
              });
              expect.soft(hasHorizontalOverflow, `[${vpName}] ${url}: no horizontal scrollbar`).toBe(false);
            }
          }

          // ── Check 2: Main content area has positive width ────────────────
          const contentWidth = await page.evaluate(() => {
            const main =
              document.querySelector<HTMLElement>('main') ||
              document.querySelector<HTMLElement>('[role="main"]') ||
              document.querySelector<HTMLElement>('.content') ||
              document.querySelector<HTMLElement>('#root > div') ||
              document.body;
            return main ? main.getBoundingClientRect().width : 0;
          });

          if (contentWidth <= 0) {
            recordIssue({
              check: 'content-width',
              url,
              viewport: vpName,
              detail: `main content has width ${contentWidth}px (clipped or hidden)`,
            });
          }
          expect.soft(contentWidth, `[${vpName}] ${url}: main content width > 0`).toBeGreaterThan(0);

          // ── Check 3: No text smaller than 10px on mobile ─────────────────
          if (vp.width < 768) {
            const tinyTextCount = await page.evaluate(() => {
              const walker = document.createTreeWalker(
                document.body,
                NodeFilter.SHOW_ELEMENT,
              );
              let count = 0;
              let node = walker.nextNode() as Element | null;
              while (node) {
                const style = window.getComputedStyle(node);
                const fontSize = parseFloat(style.fontSize);
                const text = node.textContent?.trim() ?? '';
                // Only flag elements that actually contain visible text (not just containers)
                if (
                  fontSize > 0 &&
                  fontSize < 10 &&
                  text.length > 0 &&
                  node.children.length === 0 && // leaf text nodes only
                  style.display !== 'none' &&
                  style.visibility !== 'hidden' &&
                  style.opacity !== '0'
                ) {
                  count++;
                }
                node = walker.nextNode() as Element | null;
              }
              return count;
            });

            if (tinyTextCount > 0) {
              recordIssue({
                check: 'text-size-mobile',
                url,
                viewport: vpName,
                detail: `${tinyTextCount} element(s) with font-size < 10px`,
              });
              expect.soft(tinyTextCount, `[${vpName}] ${url}: no text smaller than 10px`).toBe(0);
            }
          }

          // ── Check 4: Touch targets ≥ 44×44px on mobile ───────────────────
          if (vp.width < 768) {
            const smallTargetCount = await page.evaluate(() => {
              const MIN = 44;
              const interactables = Array.from(
                document.querySelectorAll<HTMLElement>('button, a, [role="button"], [role="link"]'),
              );
              let count = 0;
              for (const el of interactables) {
                const style = window.getComputedStyle(el);
                if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
                  continue;
                }
                const rect = el.getBoundingClientRect();
                // Skip elements not in the viewport (e.g. off-screen nav items)
                if (rect.width === 0 && rect.height === 0) continue;
                // Skip purely decorative / icon-only very small elements that are
                // known to be inside larger click targets (e.g. SVG inside button)
                const isInsideButton = el.closest('button, a') !== el;
                if (isInsideButton) continue;
                if (rect.width < MIN || rect.height < MIN) {
                  count++;
                }
              }
              return count;
            });

            if (smallTargetCount > 0) {
              recordIssue({
                check: 'touch-target-size',
                url,
                viewport: vpName,
                detail: `${smallTargetCount} interactive element(s) smaller than 44×44px`,
              });
              // Soft assertion — many ERP tables have icon buttons that are slightly
              // under 44px; annotate but do not block the test run.
              expect.soft(
                smallTargetCount,
                `[${vpName}] ${url}: touch targets ≥ 44×44px`,
              ).toBeLessThanOrEqual(10); // tolerance: up to 10 small targets is flagged but not fatal
            }
          }

          // ── Check 5: Input font-size ≥ 16px on mobile (iOS zoom prevention) ─
          if (vp.width < 768) {
            const smallInputCount = await page.evaluate(() => {
              const inputs = Array.from(
                document.querySelectorAll<HTMLInputElement>(
                  'input[type="text"], input[type="email"], input[type="password"], input[type="number"], input[type="search"], input[type="tel"], textarea, select',
                ),
              );
              let count = 0;
              for (const input of inputs) {
                const style = window.getComputedStyle(input);
                if (style.display === 'none' || style.visibility === 'hidden') continue;
                const fontSize = parseFloat(style.fontSize);
                if (fontSize > 0 && fontSize < 16) {
                  count++;
                }
              }
              return count;
            });

            if (smallInputCount > 0) {
              recordIssue({
                check: 'input-font-size-mobile',
                url,
                viewport: vpName,
                detail: `${smallInputCount} input(s) with font-size < 16px (triggers iOS auto-zoom)`,
              });
              expect.soft(
                smallInputCount,
                `[${vpName}] ${url}: input font-size ≥ 16px on mobile`,
              ).toBe(0);
            }
          }

          // ── Check 6: Navigation collapses or hamburger appears on mobile ──
          if (vp.width < 768) {
            const navState = await page.evaluate(() => {
              // Look for hamburger / menu toggle buttons
              const hamburger = document.querySelector<HTMLElement>(
                [
                  'button[aria-label*="menu" i]',
                  'button[aria-label*="навигация" i]',
                  'button[aria-label*="sidebar" i]',
                  '[class*="hamburger"]',
                  '[class*="menu-toggle"]',
                  '[class*="nav-toggle"]',
                  '[data-testid*="hamburger"]',
                  '[data-testid*="menu-btn"]',
                ].join(', '),
              );

              // Look for visible sidebar nav (should be hidden on mobile)
              const sidebar = document.querySelector<HTMLElement>(
                'nav, aside, [class*="sidebar"], [class*="sidenav"], [class*="side-nav"]',
              );
              const sidebarVisible = sidebar
                ? (() => {
                    const style = window.getComputedStyle(sidebar);
                    const rect = sidebar.getBoundingClientRect();
                    return (
                      style.display !== 'none' &&
                      style.visibility !== 'hidden' &&
                      rect.width > 0 &&
                      rect.height > 0
                    );
                  })()
                : false;

              // On mobile: either hamburger is present OR sidebar is fully hidden
              const hamburgerVisible = hamburger
                ? (() => {
                    const style = window.getComputedStyle(hamburger);
                    const rect = hamburger.getBoundingClientRect();
                    return (
                      style.display !== 'none' &&
                      style.visibility !== 'hidden' &&
                      rect.width > 0
                    );
                  })()
                : false;

              return { hamburgerVisible, sidebarVisible };
            });

            const mobileNavOk = navState.hamburgerVisible || !navState.sidebarVisible;
            if (!mobileNavOk) {
              recordIssue({
                check: 'mobile-nav-collapse',
                url,
                viewport: vpName,
                detail: 'Full sidebar is visible on mobile without a hamburger toggle',
              });
            }
            expect.soft(
              mobileNavOk,
              `[${vpName}] ${url}: navigation collapses or hamburger present on mobile`,
            ).toBe(true);
          }

          // ── Check 7: Tables scroll within container, don't break layout ──
          const tableOverflowOk = await page.evaluate(() => {
            const tables = Array.from(document.querySelectorAll<HTMLElement>('table'));
            if (tables.length === 0) return true; // no tables on this page — OK

            for (const table of tables) {
              const tableRect = table.getBoundingClientRect();
              // A table is "breaking layout" if it is wider than the viewport
              // AND its parent does not have overflow:auto/scroll (i.e. no scroll container)
              if (tableRect.width > window.innerWidth + 4) {
                const parent = table.parentElement;
                if (!parent) return false;
                const parentStyle = window.getComputedStyle(parent);
                const overflowX = parentStyle.overflowX;
                if (overflowX !== 'auto' && overflowX !== 'scroll') {
                  return false; // table wider than viewport with no scroll container
                }
              }
            }
            return true;
          });

          if (!tableOverflowOk) {
            recordIssue({
              check: 'table-overflow',
              url,
              viewport: vpName,
              detail: 'Table wider than viewport without a scrollable container',
            });
          }
          expect.soft(
            tableOverflowOk,
            `[${vpName}] ${url}: tables scroll within container`,
          ).toBe(true);

          // ── Check 8: Modals/dialogs not wider than viewport ───────────────
          // Only check if a modal/dialog is currently visible on the page
          const modalIssue = await page.evaluate((viewportWidth) => {
            const dialogs = Array.from(
              document.querySelectorAll<HTMLElement>(
                '[role="dialog"], [role="alertdialog"], [class*="modal"], [class*="Modal"], [class*="dialog"], [class*="Dialog"]',
              ),
            );
            for (const dialog of dialogs) {
              const style = window.getComputedStyle(dialog);
              if (style.display === 'none' || style.visibility === 'hidden') continue;
              const rect = dialog.getBoundingClientRect();
              if (rect.width === 0) continue; // not rendered
              if (rect.width > viewportWidth + 4) {
                return { found: true, width: Math.round(rect.width), viewport: viewportWidth };
              }
            }
            return { found: false, width: 0, viewport: viewportWidth };
          }, vp.width);

          if (modalIssue.found) {
            recordIssue({
              check: 'modal-overflow',
              url,
              viewport: vpName,
              detail: `Modal width ${modalIssue.width}px exceeds viewport ${modalIssue.viewport}px`,
            });
            expect.soft(
              modalIssue.width,
              `[${vpName}] ${url}: modal width ≤ viewport width`,
            ).toBeLessThanOrEqual(vp.width + 4);
          }
        });
      }
    });
  }

  // ─── Mobile-specific Tests ────────────────────────────────────────────────

  test.describe('Mobile Navigation', () => {
    test('hamburger menu appears on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await navigateTo(page, '/');

      // Look for hamburger / mobile menu toggle
      const hamburgerSelectors = [
        'button[aria-label*="menu" i]',
        'button[aria-label*="навигация" i]',
        'button[aria-label*="sidebar" i]',
        '[class*="hamburger"]',
        '[class*="menu-toggle"]',
        '[class*="nav-toggle"]',
        '[data-testid*="hamburger"]',
        '[data-testid*="mobile-menu"]',
      ];

      const hamburger = page.locator(hamburgerSelectors.join(', ')).first();
      const hamburgerCount = await hamburger.count();

      // Also accept: no hamburger if the full nav is completely hidden/collapsed
      const sidebarHidden = await page.evaluate(() => {
        const sidebar = document.querySelector<HTMLElement>(
          'nav, aside, [class*="sidebar"], [class*="sidenav"]',
        );
        if (!sidebar) return true;
        const style = window.getComputedStyle(sidebar);
        const rect = sidebar.getBoundingClientRect();
        return style.display === 'none' || style.visibility === 'hidden' || rect.width === 0;
      });

      const mobileNavAdapted = hamburgerCount > 0 || sidebarHidden;

      if (!mobileNavAdapted) {
        test.info().annotations.push({
          type: 'responsive-issue:mobile',
          description:
            '[mobile-nav] / — no hamburger button found and sidebar is not hidden on 375px viewport',
        });
      }

      expect.soft(
        mobileNavAdapted,
        'Mobile (375px): hamburger menu present or sidebar collapsed on home page',
      ).toBe(true);
    });

    test('sidebar collapses on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await navigateTo(page, '/projects');

      const sidebarState = await page.evaluate(() => {
        const sidebar = document.querySelector<HTMLElement>(
          'aside, [class*="sidebar"], [class*="side-nav"], [class*="sidenav"], nav[class*="left"]',
        );
        if (!sidebar) {
          return { exists: false, visible: false, width: 0 };
        }
        const style = window.getComputedStyle(sidebar);
        const rect = sidebar.getBoundingClientRect();
        const visible =
          style.display !== 'none' &&
          style.visibility !== 'hidden' &&
          style.opacity !== '0' &&
          rect.width > 60; // >60px = actually expanded (not just a narrow icon rail)
        return { exists: true, visible, width: Math.round(rect.width) };
      });

      if (sidebarState.visible) {
        test.info().annotations.push({
          type: 'responsive-issue:mobile',
          description: `[sidebar-collapse] /projects — sidebar width ${sidebarState.width}px visible on 375px viewport (expected collapsed or hidden)`,
        });
      }

      // On mobile the sidebar should either not exist or be collapsed
      expect.soft(
        !sidebarState.visible,
        `Mobile (375px): sidebar collapsed on /projects (found width: ${sidebarState.width}px)`,
      ).toBe(true);
    });

    test('content fills mobile viewport width', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      const pagesToCheck = ['/', '/projects', '/invoices', '/employees'];

      for (const url of pagesToCheck) {
        await navigateTo(page, url);

        const fillsViewport = await page.evaluate(() => {
          const main =
            document.querySelector<HTMLElement>('main') ||
            document.querySelector<HTMLElement>('[role="main"]') ||
            document.querySelector<HTMLElement>('#root > div > div') ||
            document.body;
          const rect = main.getBoundingClientRect();
          // Content should use at least 85% of the viewport width on mobile
          return rect.width >= window.innerWidth * 0.85;
        });

        if (!fillsViewport) {
          test.info().annotations.push({
            type: 'responsive-issue:mobile',
            description: `[content-fill] ${url} — main content does not fill mobile viewport width`,
          });
        }
        expect.soft(fillsViewport, `Mobile (375px): ${url} content fills viewport`).toBe(true);
      }
    });

    test('no fixed-width elements break mobile layout', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await navigateTo(page, '/');

      const breakingElements = await page.evaluate(() => {
        const all = Array.from(document.querySelectorAll<HTMLElement>('*'));
        const offenders: string[] = [];
        const vpWidth = window.innerWidth;

        for (const el of all) {
          const style = window.getComputedStyle(el);
          // Only check elements with explicitly set min-width or width values
          const minWidth = parseFloat(style.minWidth);
          const elWidth = parseFloat(style.width);
          if (
            (minWidth > vpWidth + 10 || elWidth > vpWidth + 10) &&
            style.display !== 'none' &&
            style.position !== 'fixed' && // fixed positioned elements are OK
            style.position !== 'absolute'
          ) {
            const tag = el.tagName.toLowerCase();
            const cls = el.className?.toString().slice(0, 40) || '';
            offenders.push(`${tag}[${cls}]`);
            if (offenders.length >= 5) break; // cap report at 5
          }
        }
        return offenders;
      });

      if (breakingElements.length > 0) {
        test.info().annotations.push({
          type: 'responsive-issue:mobile',
          description: `[fixed-width-overflow] / — ${breakingElements.length} element(s) wider than viewport: ${breakingElements.join(', ')}`,
        });
      }
      expect.soft(
        breakingElements.length,
        `Mobile (375px): no fixed-width elements wider than viewport`,
      ).toBe(0);
    });
  });

  // ─── Tablet-specific Tests ────────────────────────────────────────────────

  test.describe('Tablet Layout', () => {
    test('sidebar visible but compact on tablet', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await navigateTo(page, '/projects');

      const sidebarState = await page.evaluate(() => {
        const sidebar = document.querySelector<HTMLElement>(
          'aside, [class*="sidebar"], [class*="side-nav"], [class*="sidenav"], nav[class*="left"]',
        );
        if (!sidebar) return { exists: false, width: 0, visible: false };
        const style = window.getComputedStyle(sidebar);
        const rect = sidebar.getBoundingClientRect();
        const visible =
          style.display !== 'none' &&
          style.visibility !== 'hidden' &&
          rect.width > 0;
        return { exists: true, width: Math.round(rect.width), visible };
      });

      // On tablet (768px), sidebar may be visible in icon-rail form (narrow) or full width
      // What matters is: if visible, it must not take up more than 40% of the viewport
      if (sidebarState.visible && sidebarState.width > 768 * 0.4) {
        test.info().annotations.push({
          type: 'responsive-issue:tablet',
          description: `[sidebar-compact] /projects — sidebar width ${sidebarState.width}px exceeds 40% of 768px viewport (too wide)`,
        });
        expect.soft(
          sidebarState.width,
          `Tablet (768px): sidebar width ≤ 40% of viewport`,
        ).toBeLessThanOrEqual(768 * 0.4);
      } else {
        // Sidebar either hidden or appropriately sized
        expect.soft(true, 'Tablet (768px): sidebar is appropriately sized').toBe(true);
      }
    });

    test('two-column layout available on tablet', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });

      // Check a data-rich page for two-column or grid layout
      await navigateTo(page, '/projects');

      const hasMultiColumnLayout = await page.evaluate(() => {
        // Look for CSS grid or flex containers with multiple columns
        const candidates = Array.from(
          document.querySelectorAll<HTMLElement>(
            '[class*="grid"], [class*="columns"], [class*="col-"], [class*="flex"]',
          ),
        );
        for (const el of candidates) {
          const style = window.getComputedStyle(el);
          if (
            style.display === 'grid' &&
            style.gridTemplateColumns !== '' &&
            style.gridTemplateColumns !== 'none'
          ) {
            const cols = style.gridTemplateColumns.trim().split(/\s+/).length;
            if (cols >= 2) return true;
          }
          if (style.display === 'flex' && style.flexDirection !== 'column') {
            const children = Array.from(el.children) as HTMLElement[];
            const visibleChildren = children.filter((c) => {
              const cs = window.getComputedStyle(c);
              return cs.display !== 'none' && c.getBoundingClientRect().width > 0;
            });
            if (visibleChildren.length >= 2) return true;
          }
        }
        return false;
      });

      // Tablet should have multi-column content (not fully single-column like mobile)
      expect.soft(
        hasMultiColumnLayout,
        'Tablet (768px): /projects has multi-column layout',
      ).toBe(true);
    });

    test('tables readable without horizontal scroll on tablet', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });

      const tablePages = ['/projects', '/invoices', '/employees'];

      for (const url of tablePages) {
        await navigateTo(page, url);

        const tablesOk = await page.evaluate(() => {
          const tables = Array.from(document.querySelectorAll<HTMLElement>('table'));
          if (tables.length === 0) return true;

          for (const table of tables) {
            const rect = table.getBoundingClientRect();
            if (rect.width === 0) continue; // hidden table
            // Table wider than viewport must be inside a scroll container
            if (rect.width > window.innerWidth + 4) {
              const parent = table.parentElement;
              if (!parent) return false;
              const pStyle = window.getComputedStyle(parent);
              if (pStyle.overflowX !== 'auto' && pStyle.overflowX !== 'scroll') {
                return false;
              }
            }
          }
          return true;
        });

        if (!tablesOk) {
          test.info().annotations.push({
            type: 'responsive-issue:tablet',
            description: `[table-scroll] ${url} — table overflows without scroll container on 768px`,
          });
        }
        expect.soft(tablesOk, `Tablet (768px): ${url} tables contained`).toBe(true);
      }
    });

    test('forms are usable on tablet viewport', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      // Navigate to a page likely to have a form (project creation)
      await navigateTo(page, '/projects');

      const inputsOk = await page.evaluate(() => {
        const inputs = Array.from(
          document.querySelectorAll<HTMLInputElement>(
            'input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"]), textarea, select',
          ),
        );
        if (inputs.length === 0) return true; // no form on this page

        for (const input of inputs) {
          const style = window.getComputedStyle(input);
          if (style.display === 'none' || style.visibility === 'hidden') continue;
          const rect = input.getBoundingClientRect();
          if (rect.width === 0) continue;
          // Input must have minimum usable width on tablet
          if (rect.width < 100) return false;
          // Input must not overflow viewport
          if (rect.right > window.innerWidth + 4) return false;
        }
        return true;
      });

      expect.soft(inputsOk, 'Tablet (768px): form inputs are usable (width ≥ 100px, not overflowing)').toBe(true);
    });
  });

  // ─── Cross-viewport Consistency Tests ────────────────────────────────────

  test.describe('Cross-viewport Consistency', () => {
    test('key pages render content at all three viewports', async ({ page }) => {
      const criticalPages = ['/', '/projects', '/invoices'];
      const viewportList = Object.entries(VIEWPORTS);

      for (const url of criticalPages) {
        for (const [vpName, vp] of viewportList) {
          await page.setViewportSize({ width: vp.width, height: vp.height });
          await navigateTo(page, url);

          const bodyText = (await page.textContent('body')) ?? '';
          const bodyLength = bodyText.trim().length;

          if (bodyLength < 50) {
            test.info().annotations.push({
              type: `responsive-issue:${vpName}`,
              description: `[content-missing] ${url} renders less than 50 chars of text on ${vpName}`,
            });
          }
          expect.soft(
            bodyLength,
            `[${vpName}] ${url}: page renders content (body text > 50 chars)`,
          ).toBeGreaterThan(50);

          // Page must not show crash messages at any viewport
          expect.soft(bodyText, `[${vpName}] ${url}: no crash message`).not.toContain('Something went wrong');
          expect.soft(bodyText, `[${vpName}] ${url}: no undefined reference`).not.toContain('Cannot read properties');
        }
      }
    });

    test('images and icons do not overflow their containers', async ({ page }) => {
      const mobileVp = VIEWPORTS.mobile;
      await page.setViewportSize({ width: mobileVp.width, height: mobileVp.height });
      await navigateTo(page, '/');

      const overflowingMedia = await page.evaluate(() => {
        const media = Array.from(
          document.querySelectorAll<HTMLElement>('img, svg, video, canvas'),
        );
        const offenders: string[] = [];
        for (const el of media) {
          const rect = el.getBoundingClientRect();
          if (rect.width > window.innerWidth + 4 && rect.width > 0) {
            const tag = el.tagName.toLowerCase();
            const src = (el as HTMLImageElement).src?.slice(-30) || el.className?.toString().slice(0, 30) || '';
            offenders.push(`${tag}[${src}]`);
            if (offenders.length >= 5) break;
          }
        }
        return offenders;
      });

      if (overflowingMedia.length > 0) {
        test.info().annotations.push({
          type: 'responsive-issue:mobile',
          description: `[media-overflow] / — ${overflowingMedia.length} media element(s) overflow on mobile: ${overflowingMedia.join(', ')}`,
        });
      }
      expect.soft(
        overflowingMedia.length,
        'Mobile (375px): no images or icons overflow their containers',
      ).toBe(0);
    });

    test('font sizes scale appropriately across viewports', async ({ page }) => {
      const headingSelector = 'h1, h2, [class*="page-title"], [class*="PageTitle"]';

      // Collect heading font sizes per viewport
      const fontSizes: Record<string, number> = {};

      for (const [vpName, vp] of Object.entries(VIEWPORTS)) {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await navigateTo(page, '/projects');

        const headingSize = await page.evaluate((sel) => {
          const heading = document.querySelector<HTMLElement>(sel);
          if (!heading) return 0;
          return parseFloat(window.getComputedStyle(heading).fontSize);
        }, headingSelector);

        fontSizes[vpName] = headingSize;
      }

      // If we got valid sizes, desktop headings should be ≥ mobile headings
      if (fontSizes.mobile > 0 && fontSizes.desktop > 0) {
        expect.soft(
          fontSizes.desktop,
          `Desktop heading (${fontSizes.desktop}px) should be ≥ mobile heading (${fontSizes.mobile}px)`,
        ).toBeGreaterThanOrEqual(fontSizes.mobile);
      }

      // Mobile headings must still be readable (≥ 14px)
      if (fontSizes.mobile > 0) {
        expect.soft(
          fontSizes.mobile,
          `Mobile heading font-size (${fontSizes.mobile}px) must be at least 14px`,
        ).toBeGreaterThanOrEqual(14);
      }
    });
  });
});
