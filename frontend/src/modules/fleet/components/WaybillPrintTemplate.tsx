import { printDocument, formatRuNumber, stampCircleHtml } from '@/lib/printDocument';
import { t } from '@/i18n';

export interface WaybillPrintTemplateProps {
  organizationName: string;
  vehiclePlate: string;
  vehicleModel: string;
  driverName: string;
  date: string;
  route: string;
  departureTime: string;
  returnTime: string;
  speedometerStart: number;
  speedometerEnd: number;
  fuelType: string;
  fuelAtStart: number;
  fuelFilled: number;
  fuelConsumed: number;
  fuelAtEnd: number;
  routeEntries: Array<{ from: string; to: string; distance: number }>;
  dispatcherName: string;
  mechanicName: string;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Generate and print a Waybill document (form 4-P).
 */
export function printWaybill(data: WaybillPrintTemplateProps): void {
  const totalDistance = data.routeEntries.reduce((sum, r) => sum + r.distance, 0);
  const totalKm = data.speedometerEnd - data.speedometerStart;

  const routeRows = data.routeEntries
    .map(
      (entry, idx) => `
      <tr>
        <td class="text-center">${idx + 1}</td>
        <td>${escapeHtml(entry.from)}</td>
        <td>${escapeHtml(entry.to)}</td>
        <td class="num">${formatRuNumber(entry.distance, 1)}</td>
      </tr>`,
    )
    .join('');

  const bodyHtml = `
    <div class="doc-header">
      <div class="form-name">${t('fleet.waybillPrint.formSubtitle')}</div>
      <div class="doc-title">${t('fleet.waybillPrint.formTitle')}</div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10pt;margin-bottom:12pt;font-size:10pt;">
      <div>
        <span style="color:#666;">${t('fleet.waybillPrint.organization')}:</span>
        <strong>${escapeHtml(data.organizationName)}</strong>
      </div>
      <div>
        <span style="color:#666;">${t('fleet.waybillPrint.date')}:</span>
        <strong>${escapeHtml(data.date)}</strong>
      </div>
      <div>
        <span style="color:#666;">${t('fleet.waybillPrint.vehicleModel')}:</span>
        <strong>${escapeHtml(data.vehicleModel)}</strong>
      </div>
      <div>
        <span style="color:#666;">${t('fleet.waybillPrint.vehiclePlate')}:</span>
        <strong>${escapeHtml(data.vehiclePlate)}</strong>
      </div>
      <div>
        <span style="color:#666;">${t('fleet.waybillPrint.driver')}:</span>
        <strong>${escapeHtml(data.driverName)}</strong>
      </div>
      <div>
        <span style="color:#666;">${t('fleet.waybillPrint.route')}:</span>
        <strong>${escapeHtml(data.route)}</strong>
      </div>
    </div>

    <div class="section-title">${t('fleet.waybillPrint.workPeriod')}</div>
    <table style="font-size:10pt;">
      <tbody>
        <tr>
          <td style="width:50%;">${t('fleet.waybillPrint.departureTime')}</td>
          <td><strong>${escapeHtml(data.departureTime)}</strong></td>
        </tr>
        <tr>
          <td>${t('fleet.waybillPrint.returnTime')}</td>
          <td><strong>${escapeHtml(data.returnTime)}</strong></td>
        </tr>
      </tbody>
    </table>

    <div class="section-title">${t('fleet.waybillPrint.speedometer')}</div>
    <table style="font-size:10pt;">
      <tbody>
        <tr>
          <td style="width:50%;">${t('fleet.waybillPrint.speedometerStart')}</td>
          <td class="num"><strong>${formatRuNumber(data.speedometerStart, 0)}</strong></td>
        </tr>
        <tr>
          <td>${t('fleet.waybillPrint.speedometerEnd')}</td>
          <td class="num"><strong>${formatRuNumber(data.speedometerEnd, 0)}</strong></td>
        </tr>
        <tr class="totals-row">
          <td>${t('fleet.waybillPrint.totalKm')}</td>
          <td class="num"><strong>${formatRuNumber(totalKm, 0)}</strong></td>
        </tr>
      </tbody>
    </table>

    <div class="section-title">${t('fleet.waybillPrint.fuel')}</div>
    <table style="font-size:10pt;">
      <tbody>
        <tr>
          <td style="width:50%;">${t('fleet.waybillPrint.fuelType')}</td>
          <td><strong>${escapeHtml(data.fuelType)}</strong></td>
        </tr>
        <tr>
          <td>${t('fleet.waybillPrint.fuelAtStart')}</td>
          <td class="num">${formatRuNumber(data.fuelAtStart, 1)}</td>
        </tr>
        <tr>
          <td>${t('fleet.waybillPrint.fuelFilled')}</td>
          <td class="num">${formatRuNumber(data.fuelFilled, 1)}</td>
        </tr>
        <tr>
          <td>${t('fleet.waybillPrint.fuelConsumed')}</td>
          <td class="num"><strong>${formatRuNumber(data.fuelConsumed, 1)}</strong></td>
        </tr>
        <tr>
          <td>${t('fleet.waybillPrint.fuelAtEnd')}</td>
          <td class="num">${formatRuNumber(data.fuelAtEnd, 1)}</td>
        </tr>
      </tbody>
    </table>

    ${data.routeEntries.length > 0 ? `
    <div class="section-title">${t('fleet.waybillPrint.routeTable')}</div>
    <table style="font-size:10pt;">
      <thead>
        <tr>
          <th style="width:30px">&#8470;</th>
          <th>${t('fleet.waybillPrint.colFrom')}</th>
          <th>${t('fleet.waybillPrint.colTo')}</th>
          <th style="width:100px">${t('fleet.waybillPrint.colDistance')}</th>
        </tr>
      </thead>
      <tbody>
        ${routeRows}
        <tr class="totals-row">
          <td colspan="3" class="text-right">${t('fleet.waybillPrint.totalDistance')}</td>
          <td class="num"><strong>${formatRuNumber(totalDistance, 1)}</strong></td>
        </tr>
      </tbody>
    </table>` : ''}

    <div class="signatures" style="grid-template-columns:1fr 1fr 1fr;">
      <div class="signature-block">
        <div class="sig-role">${t('fleet.waybillPrint.signatureDriver')}</div>
        <div class="sig-line"></div>
        <div class="sig-name">${escapeHtml(data.driverName)}</div>
        ${stampCircleHtml()}
      </div>
      <div class="signature-block">
        <div class="sig-role">${t('fleet.waybillPrint.signatureDispatcher')}</div>
        <div class="sig-line"></div>
        <div class="sig-name">${escapeHtml(data.dispatcherName)}</div>
        ${stampCircleHtml()}
      </div>
      <div class="signature-block">
        <div class="sig-role">${t('fleet.waybillPrint.signatureMechanic')}</div>
        <div class="sig-line"></div>
        <div class="sig-name">${escapeHtml(data.mechanicName)}</div>
        ${stampCircleHtml()}
      </div>
    </div>
  `;

  printDocument(
    `${t('fleet.waybillPrint.formTitle')} - ${data.vehiclePlate} - ${data.date}`,
    bodyHtml,
  );
}
