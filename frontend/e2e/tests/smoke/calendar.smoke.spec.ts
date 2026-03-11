import { test, expect } from '@playwright/test';
import { smokeCheck } from '../../helpers/smoke.helper';

/**
 * Calendar Module — Smoke Tests
 *
 * Persona: прораб / менеджер
 * Route: /calendar — calendar view (month/week/day)
 * Expected: month name, day grid, navigation arrows
 */
test.describe('Calendar — Smoke', () => {
  test('/calendar — календарь', async ({ page }) => {
    const { body } = await smokeCheck(page, '/calendar');

    // Calendar should show month name (Russian or English)
    const monthPattern =
      /январ|феврал|март|апрел|ма[йя]|июн|июл|август|сентябр|октябр|ноябр|декабр|january|february|march|april|june|july|august|september|october|november|december/i;
    const hasMonthName = monthPattern.test(body);

    // Or has navigation buttons
    const navButtons = page.locator(
      'button:has-text(/[<>←→◀▶]/), button:has-text(/prev|next|назад|вперёд/i)',
    );
    const hasNav = (await navButtons.count()) > 0;

    expect(
      hasMonthName || hasNav,
      'Calendar should display month name or navigation controls',
    ).toBe(true);
  });
});
