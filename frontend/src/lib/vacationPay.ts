/**
 * Russian vacation pay calculation per Labor Code Article 139.
 *
 * Average daily earnings = Total earnings for 12 months / adjusted calendar days
 * Full month coefficient = 29.3 (average monthly calendar days)
 * Partial month: (29.3 / calendar_days_in_month) * actual_worked_days
 */

export interface MonthEarnings {
  month: number; // 1-12
  year: number;
  totalEarnings: number; // gross salary for that month
  calendarDays: number; // total calendar days in the month
  actualWorkedDays: number; // days actually worked (for partial months)
  isFullMonth: boolean; // true if employee worked full month
}

export interface VacationPayResult {
  averageDailyEarnings: number;
  totalVacationPay: number;
  vacationDays: number;
  totalEarningsUsed: number;
  totalCalendarDays: number; // adjusted calendar days
  formula: string; // human-readable formula breakdown
}

/**
 * Calculate vacation pay per Russian Labor Code Article 139.
 *
 * @param months - Array of monthly earnings data (typically 12 months)
 * @param vacationDays - Number of vacation days
 * @returns Calculated vacation pay with formula breakdown
 */
export function calculateVacationPay(
  months: MonthEarnings[],
  vacationDays: number,
): VacationPayResult {
  let totalEarnings = 0;
  let totalCalendarDays = 0;

  for (const m of months) {
    totalEarnings += m.totalEarnings;

    if (m.isFullMonth) {
      totalCalendarDays += 29.3;
    } else {
      // Partial month: (29.3 / calendar_days) * worked_days
      totalCalendarDays += (29.3 / m.calendarDays) * m.actualWorkedDays;
    }
  }

  const averageDailyEarnings =
    totalCalendarDays > 0 ? totalEarnings / totalCalendarDays : 0;

  const totalVacationPay = averageDailyEarnings * vacationDays;

  return {
    averageDailyEarnings: Math.round(averageDailyEarnings * 100) / 100,
    totalVacationPay: Math.round(totalVacationPay * 100) / 100,
    vacationDays,
    totalEarningsUsed: totalEarnings,
    totalCalendarDays: Math.round(totalCalendarDays * 100) / 100,
    formula: `${totalEarnings.toLocaleString('ru-RU')} \u20BD / ${totalCalendarDays.toFixed(2)} \u0434\u043D. = ${averageDailyEarnings.toFixed(2)} \u20BD/\u0434\u0435\u043D\u044C \u00D7 ${vacationDays} \u0434\u043D. = ${totalVacationPay.toFixed(2)} \u20BD`,
  };
}
