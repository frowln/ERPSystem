import { printDocument, formatRuNumber, stampCircleHtml } from '@/lib/printDocument';
import { t } from '@/i18n';

export interface T13PrintTemplateProps {
  organizationName: string;
  department: string;
  okpoCode: string;
  documentNumber: string;
  reportingPeriod: { year: number; month: number };
  employees: Array<{
    rowNumber: number;
    fullName: string;
    personnelNumber: string;
    position: string;
    days: Array<{ date: number; code: string; hours: number }>;
    totalDaysWorked: number;
    totalHoursWorked: number;
    overtimeHours: number;
    nightHours: number;
    holidayHours: number;
  }>;
  hrManagerName: string;
  departmentHeadName: string;
}

function getMonthName(month: number): string {
  const key = `hrRussian.t13.month${month}` as Parameters<typeof t>[0];
  return t(key);
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Generate and print a T-13 Timesheet document (Goskomstat form T-13).
 * A4 landscape orientation, small font for dense table.
 */
export function printT13(data: T13PrintTemplateProps): void {
  const { year, month } = data.reportingPeriod;
  const totalDays = getDaysInMonth(year, month);
  const firstHalfDays = 15;
  const secondHalfDays = totalDays - firstHalfDays;

  const monthLabel = getMonthName(month);
  const periodLabel = `${monthLabel} ${year}`;

  // Build employee rows
  const employeeRows = data.employees
    .map((emp) => {
      const dayMap = new Map(emp.days.map((d) => [d.date, d]));

      // First half cells (days 1-15)
      let firstHalfCells = '';
      let firstHalfHours = 0;
      let firstHalfDaysWorked = 0;
      for (let d = 1; d <= firstHalfDays; d++) {
        const dayData = dayMap.get(d);
        const code = dayData?.code ?? '';
        const hours = dayData?.hours ?? 0;
        if (code && code !== t('hrRussian.t13.codeWeekend') && code !== t('hrRussian.t13.codeAbsence')) {
          firstHalfHours += hours;
          firstHalfDaysWorked++;
        }
        firstHalfCells += `<td class="text-center" style="font-size:7pt;padding:1pt 2pt;">${escapeHtml(code)}<br/>${hours > 0 ? hours : ''}</td>`;
      }

      // Second half cells (days 16-end)
      let secondHalfCells = '';
      let secondHalfHours = 0;
      let secondHalfDaysWorked = 0;
      for (let d = firstHalfDays + 1; d <= totalDays; d++) {
        const dayData = dayMap.get(d);
        const code = dayData?.code ?? '';
        const hours = dayData?.hours ?? 0;
        if (code && code !== t('hrRussian.t13.codeWeekend') && code !== t('hrRussian.t13.codeAbsence')) {
          secondHalfHours += hours;
          secondHalfDaysWorked++;
        }
        secondHalfCells += `<td class="text-center" style="font-size:7pt;padding:1pt 2pt;">${escapeHtml(code)}<br/>${hours > 0 ? hours : ''}</td>`;
      }
      // Pad remaining cells if month has fewer than 31 days
      for (let d = totalDays + 1; d <= 31; d++) {
        if (d <= firstHalfDays) {
          // won't happen since firstHalfDays=15
        } else {
          secondHalfCells += '<td style="background:#eee;"></td>';
        }
      }

      return `
      <tr>
        <td class="text-center" style="font-size:8pt;">${emp.rowNumber}</td>
        <td style="font-size:8pt;white-space:nowrap;">${escapeHtml(emp.fullName)}<br/><span style="color:#666;font-size:7pt;">${escapeHtml(emp.position)}</span></td>
        <td class="text-center" style="font-size:8pt;">${escapeHtml(emp.personnelNumber)}</td>
        ${firstHalfCells}
        <td class="num" style="font-size:8pt;font-weight:bold;">${firstHalfDaysWorked}<br/>${formatRuNumber(firstHalfHours, 1)}</td>
        ${secondHalfCells}
        <td class="num" style="font-size:8pt;font-weight:bold;">${secondHalfDaysWorked}<br/>${formatRuNumber(secondHalfHours, 1)}</td>
        <td class="num" style="font-size:8pt;font-weight:bold;">${emp.totalDaysWorked}</td>
        <td class="num" style="font-size:8pt;font-weight:bold;">${formatRuNumber(emp.totalHoursWorked, 1)}</td>
        <td class="num" style="font-size:8pt;">${emp.overtimeHours > 0 ? formatRuNumber(emp.overtimeHours, 1) : ''}</td>
        <td class="num" style="font-size:8pt;">${emp.nightHours > 0 ? formatRuNumber(emp.nightHours, 1) : ''}</td>
        <td class="num" style="font-size:8pt;">${emp.holidayHours > 0 ? formatRuNumber(emp.holidayHours, 1) : ''}</td>
      </tr>`;
    })
    .join('');

  // Day number header cells
  let dayHeaderFirst = '';
  for (let d = 1; d <= firstHalfDays; d++) {
    dayHeaderFirst += `<th style="width:18px;font-size:7pt;padding:1pt;">${d}</th>`;
  }
  let dayHeaderSecond = '';
  for (let d = firstHalfDays + 1; d <= totalDays; d++) {
    dayHeaderSecond += `<th style="width:18px;font-size:7pt;padding:1pt;">${d}</th>`;
  }
  for (let d = totalDays + 1; d <= 31; d++) {
    dayHeaderSecond += '<th style="width:18px;font-size:7pt;padding:1pt;background:#eee;"></th>';
  }

  const bodyHtml = `
    <div class="doc-header">
      <div class="form-name">${t('hrRussian.t13.formTitle')}</div>
      <div style="font-size:7pt;color:#999;margin-bottom:4pt;">${t('hrRussian.t13.formSubtitle')}</div>
      <div class="doc-title">${t('hrRussian.t13.title')}</div>
    </div>

    <div style="display:flex;justify-content:space-between;margin-bottom:8pt;font-size:9pt;">
      <div>
        <span style="color:#666;">${t('hrRussian.t13.organization')}:</span>
        <strong>${escapeHtml(data.organizationName)}</strong>
      </div>
      <div>
        <span style="color:#666;">${t('hrRussian.t13.okpo')}:</span>
        <strong>${escapeHtml(data.okpoCode)}</strong>
      </div>
    </div>
    <div style="display:flex;justify-content:space-between;margin-bottom:8pt;font-size:9pt;">
      <div>
        <span style="color:#666;">${t('hrRussian.t13.department')}:</span>
        <strong>${escapeHtml(data.department)}</strong>
      </div>
      <div>
        <span style="color:#666;">${t('hrRussian.t13.documentNumber')}:</span>
        <strong>${escapeHtml(data.documentNumber)}</strong>
      </div>
    </div>
    <div style="margin-bottom:10pt;font-size:9pt;">
      <span style="color:#666;">${t('hrRussian.t13.reportingPeriod')}:</span>
      <strong>${periodLabel}</strong>
    </div>

    <table style="font-size:8pt;min-width:100%;">
      <thead>
        <tr>
          <th rowspan="2" style="width:30px;">${t('hrRussian.t13.colRowNum')}</th>
          <th rowspan="2" style="min-width:120px;">${t('hrRussian.t13.colFullName')}</th>
          <th rowspan="2" style="width:50px;">${t('hrRussian.t13.colPersonnelNumber')}</th>
          <th colspan="${firstHalfDays}">${t('hrRussian.t13.colFirstHalf')}</th>
          <th rowspan="2" style="width:40px;">${t('hrRussian.t13.colFirstHalf')}</th>
          <th colspan="${16}">${t('hrRussian.t13.colSecondHalf')}</th>
          <th rowspan="2" style="width:40px;">${t('hrRussian.t13.colSecondHalf')}</th>
          <th rowspan="2" style="width:35px;">${t('hrRussian.t13.colTotalDays')}</th>
          <th rowspan="2" style="width:40px;">${t('hrRussian.t13.colTotalHours')}</th>
          <th rowspan="2" style="width:35px;">${t('hrRussian.t13.colOvertime')}</th>
          <th rowspan="2" style="width:35px;">${t('hrRussian.t13.colNightHours')}</th>
          <th rowspan="2" style="width:35px;">${t('hrRussian.t13.colHolidayHours')}</th>
        </tr>
        <tr>
          ${dayHeaderFirst}
          ${dayHeaderSecond}
        </tr>
      </thead>
      <tbody>
        ${employeeRows}
      </tbody>
    </table>

    <div class="signatures" style="grid-template-columns:1fr 1fr;margin-top:20pt;">
      <div class="signature-block">
        <div class="sig-role">${t('hrRussian.t13.signatureHrManager')}</div>
        <div class="sig-line"></div>
        <div class="sig-name">${escapeHtml(data.hrManagerName)}</div>
        ${stampCircleHtml()}
      </div>
      <div class="signature-block">
        <div class="sig-role">${t('hrRussian.t13.signatureDepartmentHead')}</div>
        <div class="sig-line"></div>
        <div class="sig-name">${escapeHtml(data.departmentHeadName)}</div>
        ${stampCircleHtml()}
      </div>
    </div>
  `;

  const landscapeCss = `
    @page { size: A4 landscape; margin: 10mm 15mm; }
    body { font-size: 9pt; }
    table th, table td { padding: 1pt 2pt; }
  `;

  printDocument(
    `${t('hrRussian.t13.title')} - ${periodLabel}`,
    bodyHtml,
    landscapeCss,
  );
}
