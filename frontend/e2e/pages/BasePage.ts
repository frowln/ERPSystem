import { type Page, type Locator, expect } from '@playwright/test';

/**
 * Base Page Object Model for all page objects.
 *
 * Provides common navigation, waiting, toast handling, breadcrumbs,
 * and console error checking that every page shares.
 */
export class BasePage {
  readonly page: Page;

  /** Collected console errors during this page's lifecycle */
  private readonly consoleErrors: string[] = [];

  /** Known noisy errors to ignore */
  private static readonly IGNORED_PATTERNS = [
    'Failed to load resource',
    'favicon.ico',
    'ResizeObserver loop',
    'net::ERR_',
    'Download the React DevTools',
    'Warning: ',
    'ChunkLoadError',
    'Loading chunk',
  ];

  constructor(page: Page) {
    this.page = page;

    // Auto-collect console errors
    this.page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        const ignored = BasePage.IGNORED_PATTERNS.some((p) => text.includes(p));
        if (!ignored) {
          this.consoleErrors.push(text);
        }
      }
    });

    this.page.on('pageerror', (err) => {
      this.consoleErrors.push(`PAGE_ERROR: ${err.message}`);
    });
  }

  /**
   * Navigate to a path with retry logic (3 attempts, 45s timeout each).
   * Waits for DOM content to load and page to become interactive.
   */
  async navigateTo(path: string): Promise<void> {
    const maxAttempts = 3;
    const timeout = 45_000;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        await this.page.goto(path, {
          waitUntil: 'domcontentloaded',
          timeout,
        });
        await this.waitForPageReady();
        return;
      } catch (error) {
        if (attempt === maxAttempts) {
          throw new Error(
            `Failed to navigate to ${path} after ${maxAttempts} attempts: ${error}`,
          );
        }
        // Brief pause before retry
        await this.page.waitForTimeout(1000);
      }
    }
  }

  /**
   * Wait for the page to be fully loaded:
   * - Loading spinners disappear
   * - Skeleton placeholders disappear
   * - Main content area is visible
   */
  async waitForPageReady(timeout = 15_000): Promise<void> {
    // Wait for body to be visible
    await expect(this.page.locator('body')).toBeVisible({ timeout: 10_000 });

    // Wait for loading indicators to disappear
    const spinners = this.page.locator(
      '.animate-spin, .animate-pulse, [data-testid="loading"], [data-testid="skeleton"]',
    );

    try {
      // If spinners exist, wait for them to disappear
      const count = await spinners.count();
      if (count > 0) {
        await spinners.first().waitFor({ state: 'hidden', timeout });
      }
    } catch {
      // Spinners may have already disappeared — that's fine
    }
  }

  /**
   * Get toast notification message text (success or error).
   * Looks for common toast patterns: react-hot-toast, Sonner, custom.
   */
  async getToastMessage(timeout = 5_000): Promise<string | null> {
    const toastLocator = this.page
      .locator('[role="status"]')
      .or(this.page.locator('[data-sonner-toast]'))
      .or(this.page.locator('.Toastify__toast'))
      .or(this.page.locator('[data-testid="toast"]'));

    try {
      await toastLocator.first().waitFor({ state: 'visible', timeout });
      return toastLocator.first().innerText();
    } catch {
      return null;
    }
  }

  /**
   * Get the main page title (first h1 element).
   */
  async getPageTitle(): Promise<string | null> {
    const heading = this.page
      .locator('h1')
      .or(this.page.locator('[data-testid="page-title"]'))
      .first();

    try {
      await heading.waitFor({ state: 'visible', timeout: 10_000 });
      return heading.innerText();
    } catch {
      return null;
    }
  }

  /**
   * Parse breadcrumb trail into an array of strings.
   * Handles common patterns: nav[aria-label="breadcrumb"], .breadcrumbs, ol/ul with separators.
   */
  async getBreadcrumbs(): Promise<string[]> {
    const breadcrumbNav = this.page
      .locator('nav[aria-label*="breadcrumb" i]')
      .or(this.page.locator('[data-testid="breadcrumbs"]'))
      .or(this.page.locator('.breadcrumbs'));

    try {
      await breadcrumbNav.first().waitFor({ state: 'visible', timeout: 5_000 });
      const links = breadcrumbNav.first().locator('a, span, li');
      const texts: string[] = [];
      const count = await links.count();
      for (let i = 0; i < count; i++) {
        const text = (await links.nth(i).innerText()).trim();
        // Filter out separator characters
        if (text && text !== '/' && text !== '>' && text !== '\u203A') {
          texts.push(text);
        }
      }
      return texts;
    } catch {
      return [];
    }
  }

  /**
   * Assert that no unexpected console errors occurred.
   * Throws if any non-ignored console.error was captured.
   */
  expectNoConsoleErrors(): void {
    if (this.consoleErrors.length > 0) {
      throw new Error(
        `Unexpected console errors (${this.consoleErrors.length}):\n` +
          this.consoleErrors.map((e, i) => `  ${i + 1}. ${e}`).join('\n'),
      );
    }
  }

  /**
   * Get the list of collected console errors.
   */
  getConsoleErrors(): string[] {
    return [...this.consoleErrors];
  }

  /**
   * Check if a specific element is visible on the page.
   */
  async isVisible(locator: Locator, timeout = 5_000): Promise<boolean> {
    try {
      await locator.waitFor({ state: 'visible', timeout });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Wait for a network request to complete (useful after form submissions).
   */
  async waitForApiResponse(
    urlPattern: string | RegExp,
    timeout = 15_000,
  ): Promise<void> {
    await this.page.waitForResponse(
      (response) => {
        const url = response.url();
        if (typeof urlPattern === 'string') {
          return url.includes(urlPattern);
        }
        return urlPattern.test(url);
      },
      { timeout },
    );
  }

  /**
   * Take a screenshot with a descriptive name.
   */
  async screenshot(name: string): Promise<void> {
    await this.page.screenshot({
      path: `e2e/screenshots/${name}.png`,
      fullPage: true,
    });
  }
}
