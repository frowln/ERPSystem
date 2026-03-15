import { printDocument, formatRuNumber, stampCircleHtml } from '@/lib/printDocument';
import { t } from '@/i18n';

export interface M29PrintTemplateProps {
  objectName: string;
  reportingPeriod: string;
  contractorName: string;
  lines: Array<{
    materialName: string;
    unit: string;
    normPerUnit: number;
    workVolume: number;
    normTotal: number;
    actualConsumption: number;
    deviation: number;
    deviationReason?: string;
  }>;
  foremanName: string;
  siteManagerName: string;
  accountantName: string;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Generate and print an M-29 Material Consumption Report.
 */
export function printM29(data: M29PrintTemplateProps): void {
  const lineRows = data.lines
    .map(
      (line, idx) => {
        const deviationClass = line.deviation > 0 ? 'color:red;' : line.deviation < 0 ? 'color:green;' : '';
        const deviationLabel = line.deviation > 0
          ? `+${formatRuNumber(line.deviation, 3)}`
          : formatRuNumber(line.deviation, 3);
        return `
      <tr>
        <td class="text-center">${idx + 1}</td>
        <td>${escapeHtml(line.materialName)}</td>
        <td class="text-center">${escapeHtml(line.unit)}</td>
        <td class="num">${formatRuNumber(line.normPerUnit, 4)}</td>
        <td class="num">${formatRuNumber(line.workVolume, 3)}</td>
        <td class="num">${formatRuNumber(line.normTotal, 3)}</td>
        <td class="num">${formatRuNumber(line.actualConsumption, 3)}</td>
        <td class="num" style="${deviationClass}">${deviationLabel}</td>
        <td style="font-size:8pt;">${escapeHtml(line.deviationReason ?? '')}</td>
      </tr>`;
      },
    )
    .join('');

  // Totals
  const totalNorm = data.lines.reduce((s, l) => s + l.normTotal, 0);
  const totalActual = data.lines.reduce((s, l) => s + l.actualConsumption, 0);
  const totalDeviation = totalActual - totalNorm;
  const totalDeviationLabel = totalDeviation > 0
    ? `+${formatRuNumber(totalDeviation, 3)}`
    : formatRuNumber(totalDeviation, 3);
  const totalDeviationClass = totalDeviation > 0 ? 'color:red;' : totalDeviation < 0 ? 'color:green;' : '';

  const bodyHtml = `
    <div class="doc-header">
      <div class="form-name">${t('warehouse.m29Print.formTitle')}</div>
      <div style="font-size:8pt;color:#666;margin-bottom:4pt;">${t('warehouse.m29Print.formSubtitle')}</div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8pt;margin-bottom:12pt;font-size:10pt;">
      <div>
        <span style="color:#666;">${t('warehouse.m29Print.objectName')}:</span>
        <strong>${escapeHtml(data.objectName)}</strong>
      </div>
      <div>
        <span style="color:#666;">${t('warehouse.m29Print.reportingPeriod')}:</span>
        <strong>${escapeHtml(data.reportingPeriod)}</strong>
      </div>
      <div>
        <span style="color:#666;">${t('warehouse.m29Print.contractor')}:</span>
        <strong>${escapeHtml(data.contractorName)}</strong>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th style="width:30px">&#8470;</th>
          <th>${t('warehouse.m29Print.colMaterial')}</th>
          <th style="width:55px">${t('warehouse.m29Print.colUnit')}</th>
          <th style="width:75px">${t('warehouse.m29Print.colNormPerUnit')}</th>
          <th style="width:75px">${t('warehouse.m29Print.colWorkVolume')}</th>
          <th style="width:80px">${t('warehouse.m29Print.colNormTotal')}</th>
          <th style="width:80px">${t('warehouse.m29Print.colActual')}</th>
          <th style="width:75px">${t('warehouse.m29Print.colDeviation')}</th>
          <th style="min-width:100px">${t('warehouse.m29Print.colReason')}</th>
        </tr>
      </thead>
      <tbody>
        ${lineRows}
        <tr class="totals-row">
          <td colspan="5" class="text-right">${t('warehouse.m29Print.totalRow')}</td>
          <td class="num">${formatRuNumber(totalNorm, 3)}</td>
          <td class="num">${formatRuNumber(totalActual, 3)}</td>
          <td class="num" style="${totalDeviationClass}">${totalDeviationLabel}</td>
          <td>${totalDeviation > 0 ? t('warehouse.m29Print.overuse') : totalDeviation < 0 ? t('warehouse.m29Print.saving') : ''}</td>
        </tr>
      </tbody>
    </table>

    <div class="signatures" style="grid-template-columns:1fr 1fr 1fr;">
      <div class="signature-block">
        <div class="sig-role">${t('warehouse.m29Print.signatureForeman')}</div>
        <div class="sig-line"></div>
        <div class="sig-name">${escapeHtml(data.foremanName)}</div>
        ${stampCircleHtml()}
      </div>
      <div class="signature-block">
        <div class="sig-role">${t('warehouse.m29Print.signatureSiteManager')}</div>
        <div class="sig-line"></div>
        <div class="sig-name">${escapeHtml(data.siteManagerName)}</div>
        ${stampCircleHtml()}
      </div>
      <div class="signature-block">
        <div class="sig-role">${t('warehouse.m29Print.signatureAccountant')}</div>
        <div class="sig-line"></div>
        <div class="sig-name">${escapeHtml(data.accountantName)}</div>
        ${stampCircleHtml()}
      </div>
    </div>
  `;

  printDocument(
    `${t('warehouse.m29Print.formTitle')} - ${data.objectName}`,
    bodyHtml,
  );
}
