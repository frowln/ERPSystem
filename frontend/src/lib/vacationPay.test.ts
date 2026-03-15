// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { calculateVacationPay } from './vacationPay';

describe('calculateVacationPay', () => {
  it('calculates correctly for 12 full months', () => {
    const months = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      year: 2025,
      totalEarnings: 80000,
      calendarDays: 30,
      actualWorkedDays: 30,
      isFullMonth: true,
    }));

    const result = calculateVacationPay(months, 28);
    // 960000 / (29.3 * 12) = 960000 / 351.6 = 2730.375...
    expect(result.averageDailyEarnings).toBeCloseTo(2730.38, 0);
    expect(result.totalVacationPay).toBeCloseTo(2730.38 * 28, 0);
    expect(result.vacationDays).toBe(28);
    expect(result.totalEarningsUsed).toBe(960000);
    expect(result.totalCalendarDays).toBe(351.6);
  });

  it('handles partial months correctly', () => {
    const months = [
      {
        month: 1,
        year: 2025,
        totalEarnings: 40000,
        calendarDays: 31,
        actualWorkedDays: 15,
        isFullMonth: false,
      },
      ...Array.from({ length: 11 }, (_, i) => ({
        month: i + 2,
        year: 2025,
        totalEarnings: 80000,
        calendarDays: 30,
        actualWorkedDays: 30,
        isFullMonth: true,
      })),
    ];

    const result = calculateVacationPay(months, 14);
    // Partial month: (29.3/31)*15 = 14.177419...
    // Total days: 14.177419... + 11*29.3 = 14.177419... + 322.3 = 336.477419...
    // Total earnings: 40000 + 11*80000 = 920000
    // Average: 920000 / 336.477419... = 2734.21...
    const expectedDays = (29.3 / 31) * 15 + 11 * 29.3;
    const expectedAvg = 920000 / expectedDays;
    expect(result.averageDailyEarnings).toBeCloseTo(expectedAvg, 0);
    expect(result.totalVacationPay).toBeCloseTo(expectedAvg * 14, 0);
  });

  it('returns zero when no months provided', () => {
    const result = calculateVacationPay([], 14);
    expect(result.averageDailyEarnings).toBe(0);
    expect(result.totalVacationPay).toBe(0);
    expect(result.totalCalendarDays).toBe(0);
  });

  it('includes formula string', () => {
    const months = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      year: 2025,
      totalEarnings: 100000,
      calendarDays: 30,
      actualWorkedDays: 30,
      isFullMonth: true,
    }));

    const result = calculateVacationPay(months, 14);
    expect(result.formula).toContain('\u20BD');
    expect(result.formula).toContain('14');
    expect(result.formula).toContain('\u0434\u043D.');
  });
});
