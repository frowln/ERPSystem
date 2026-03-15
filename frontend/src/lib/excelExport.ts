/**
 * Budget Plan/Fact Excel export utility.
 * Uses xlsx (SheetJS) via dynamic import to keep initial bundle small.
 */

export interface BudgetPlanFactRow {
  category: string;
  name: string;
  planned: number;
  actual: number;
  deviation: number;
  deviationPercent: number;
}

/**
 * Export budget plan/fact data to a formatted .xlsx file.
 *
 * Layout:
 *  Row 1 — title ("Бюджет: План/Факт — {projectName}")
 *  Row 2 — period
 *  Row 3 — blank
 *  Row 4 — column headers
 *  Rows 5+ — data
 *  Last rows — blank + ИТОГО totals
 */
export async function exportBudgetPlanFact(
  data: BudgetPlanFactRow[],
  projectName: string,
  period: string,
): Promise<void> {
  const XLSX = await import('xlsx');
  const wb = XLSX.utils.book_new();

  // Header rows
  const header: unknown[][] = [
    [`Бюджет: План/Факт — ${projectName}`],
    [`Период: ${period}`],
    [],
    ['Категория', 'Статья', 'План, \u20BD', 'Факт, \u20BD', 'Отклонение, \u20BD', 'Отклонение, %'],
  ];

  const rows: unknown[][] = data.map((item) => [
    item.category,
    item.name,
    item.planned,
    item.actual,
    item.deviation,
    item.deviationPercent,
  ]);

  // Totals
  const totalPlanned = data.reduce((s, d) => s + d.planned, 0);
  const totalActual = data.reduce((s, d) => s + d.actual, 0);
  const totalDev = totalActual - totalPlanned;

  rows.push([]);
  rows.push([
    '',
    'ИТОГО',
    totalPlanned,
    totalActual,
    totalDev,
    totalPlanned ? (totalDev / totalPlanned) * 100 : 0,
  ]);

  const ws = XLSX.utils.aoa_to_sheet([...header, ...rows]);

  // Column widths
  ws['!cols'] = [
    { wch: 20 },
    { wch: 30 },
    { wch: 15 },
    { wch: 15 },
    { wch: 15 },
    { wch: 12 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'План-Факт');
  XLSX.writeFile(
    wb,
    `budget-plan-fact-${projectName.replace(/\s+/g, '-')}.xlsx`,
  );
}
