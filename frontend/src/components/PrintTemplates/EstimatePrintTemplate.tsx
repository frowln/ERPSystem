import React from 'react';
import { printDocument, formatRuMoney, formatRuNumber } from '@/lib/printDocument';
import { t } from '@/i18n';

export interface EstimatePrintData {
  name: string;
  projectName: string;
  contractNumber?: string;
  status: string;
  statusDisplayName?: string;
  totalAmount: number;
  // МДС 81-33/81-25 breakdown (direct costs / overhead / profit / VAT)
  directCosts?: number;    // ПЗ — прямые затраты
  laborCosts?: number;     // ОЗП — основная зарплата
  overheadCosts?: number;  // НР — накладные расходы (80% от ОЗП)
  profitCosts?: number;    // СП — сметная прибыль (50% от ОЗП)
  vatAmount?: number;      // НДС 20%
  totalWithVat?: number;   // Итого с НДС
  orderedAmount?: number;
  invoicedAmount?: number;
  totalSpent?: number;
  balance?: number;
  createdBy?: string;
  createdAt?: string;
  notes?: string;
  sections?: EstimatePrintSection[];
  items: EstimatePrintItem[];
}

export interface EstimatePrintSection {
  sectionNumber: string;
  sectionName: string;
  total: number;
}

export interface EstimatePrintItem {
  rowNumber: number;
  code?: string;           // Нормативный код (ГЭСН/ФЕР/ТЕР)
  name: string;
  unitOfMeasure: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  laborAmount?: number;    // ОЗП в позиции
  unitPriceCustomer?: number;
  amountCustomer?: number;
}

/**
 * Generate and print an Estimate document.
 */
export function printEstimate(data: EstimatePrintData): void {
  const hasCustomerPrices = data.items.some((item) => item.unitPriceCustomer != null);
  const hasCode = data.items.some((item) => item.code);

  const totalCustomer = hasCustomerPrices
    ? data.items.reduce((sum, item) => sum + (item.amountCustomer ?? 0), 0)
    : null;

  const colCount = (hasCode ? 1 : 0) + (hasCustomerPrices ? 8 : 6);

  // МДС 81 totals (auto-compute from totalAmount if not provided)
  const pz = data.directCosts ?? data.totalAmount;
  const ozp = data.laborCosts ?? 0;
  const nr = data.overheadCosts ?? (ozp > 0 ? ozp * 0.8 : 0);
  const sp = data.profitCosts ?? (ozp > 0 ? ozp * 0.5 : 0);
  const vatBase = pz + nr + sp;
  const vatAmt = data.vatAmount ?? vatBase * 0.2;
  const totalWithVat = data.totalWithVat ?? vatBase + vatAmt;

  const itemRows = data.items
    .map(
      (item) => `
    <tr>
      ${hasCode ? `<td class="text-center" style="font-size:7pt;color:#555;">${escapeHtml(item.code ?? '')}</td>` : ''}
      <td class="text-center">${item.rowNumber}</td>
      <td>${escapeHtml(item.name)}</td>
      <td class="text-center">${escapeHtml(item.unitOfMeasure)}</td>
      <td class="num">${formatRuNumber(item.quantity, 3)}</td>
      <td class="num">${formatRuMoney(item.unitPrice)}</td>
      <td class="num">${formatRuMoney(item.amount)}</td>
      ${item.unitPriceCustomer != null ? `<td class="num">${formatRuMoney(item.unitPriceCustomer)}</td>` : ''}
      ${item.amountCustomer != null ? `<td class="num">${formatRuMoney(item.amountCustomer)}</td>` : ''}
    </tr>`,
    )
    .join('');

  const bodyHtml = `
    <div class="doc-header">
      <div class="form-name">${t('export.estimate.formTitle')}</div>
      <div class="doc-title">${escapeHtml(data.name)}</div>
    </div>

    <div class="meta-info">
      <span class="meta-label">${t('export.estimate.project')}:</span>
      <span class="meta-value">${escapeHtml(data.projectName)}</span>
    </div>
    ${data.contractNumber ? `<div class="meta-info"><span class="meta-label">${t('export.estimate.contract')}:</span> <span class="meta-value">${escapeHtml(data.contractNumber)}</span></div>` : ''}
    ${data.statusDisplayName ? `<div class="meta-info"><span class="meta-label">${t('export.estimate.status')}:</span> <span class="meta-value">${escapeHtml(data.statusDisplayName)}</span></div>` : ''}
    ${data.createdAt ? `<div class="meta-info"><span class="meta-label">${t('export.estimate.createdAt')}:</span> <span class="meta-value">${data.createdAt}</span></div>` : ''}

    <table>
      <thead>
        <tr>
          ${hasCode ? `<th style="width: 70px">${t('export.estimate.colCode')}</th>` : ''}
          <th style="width: 40px">${t('export.estimate.colRowNum')}</th>
          <th>${t('export.estimate.colName')}</th>
          <th style="width: 60px">${t('export.estimate.colUnit')}</th>
          <th style="width: 70px">${t('export.estimate.colQty')}</th>
          <th style="width: 90px">${t('export.estimate.colUnitPrice')}</th>
          <th style="width: 100px">${t('export.estimate.colAmount')}</th>
          ${hasCustomerPrices ? `<th style="width: 90px">${t('export.estimate.colCustomerPrice')}</th>` : ''}
          ${hasCustomerPrices ? `<th style="width: 100px">${t('export.estimate.colCustomerAmount')}</th>` : ''}
        </tr>
      </thead>
      <tbody>
        ${itemRows}
        <tr class="totals-row">
          <td colspan="${(hasCode ? 2 : 1) + 4}" class="text-right">${t('export.estimate.subtotalPz')}</td>
          <td class="num">${formatRuMoney(pz)}</td>
          ${hasCustomerPrices ? `<td></td><td class="num">${formatRuMoney(totalCustomer)}</td>` : ''}
        </tr>
      </tbody>
    </table>

    ${data.sections && data.sections.length > 0 ? `
    <div class="section-title" style="margin-top:10pt;">${t('export.estimate.sectionBreakdown')}</div>
    <table style="margin-top:4pt; font-size:8pt;">
      <thead><tr><th>${t('export.estimate.sectionNum')}</th><th>${t('export.estimate.sectionName')}</th><th style="width:110px" class="num">${t('export.estimate.colAmount')}</th></tr></thead>
      <tbody>
        ${data.sections.map(s => `<tr><td class="text-center">${escapeHtml(s.sectionNumber)}</td><td>${escapeHtml(s.sectionName)}</td><td class="num">${formatRuMoney(s.total)}</td></tr>`).join('')}
      </tbody>
    </table>` : ''}

    <table style="margin-top: 10pt; float:right; min-width:300pt;">
      <tbody>
        <tr><td style="width:70%">${t('export.estimate.subtotalPz')}</td><td class="num">${formatRuMoney(pz)}</td></tr>
        ${ozp > 0 ? `<tr><td>${t('export.estimate.subtotalOzp')}</td><td class="num">${formatRuMoney(ozp)}</td></tr>` : ''}
        ${nr > 0 ? `<tr><td>${t('export.estimate.subtotalNr')}</td><td class="num">${formatRuMoney(nr)}</td></tr>` : ''}
        ${sp > 0 ? `<tr><td>${t('export.estimate.subtotalSp')}</td><td class="num">${formatRuMoney(sp)}</td></tr>` : ''}
        <tr class="totals-row"><td><strong>${t('export.estimate.subtotalNoVat')}</strong></td><td class="num"><strong>${formatRuMoney(vatBase)}</strong></td></tr>
        <tr><td>${t('export.estimate.vatRow')}</td><td class="num">${formatRuMoney(vatAmt)}</td></tr>
        <tr class="totals-row"><td><strong>${t('export.estimate.totalWithVat')}</strong></td><td class="num"><strong>${formatRuMoney(totalWithVat)}</strong></td></tr>
      </tbody>
    </table>
    <div style="clear:both;"></div>

    ${data.notes ? `<div class="notes-block"><strong>${t('export.common.notes')}:</strong> ${escapeHtml(data.notes)}</div>` : ''}

    <div class="signatures">
      <div class="signature-block">
        <div class="sig-role">${t('export.estimate.signatureCompiler')}</div>
        <div class="sig-line"></div>
        <div class="sig-name">${escapeHtml(data.createdBy ?? '')}</div>
      </div>
      <div class="signature-block">
        <div class="sig-role">${t('export.estimate.signatureApprover')}</div>
        <div class="sig-line"></div>
        <div class="sig-name">(${t('export.ks2.signatureHint')})</div>
      </div>
    </div>
  `;

  printDocument(
    `${t('export.estimate.formTitle')} - ${data.name}`,
    bodyHtml,
  );
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export const EstimatePrintButton: React.FC<{
  data: EstimatePrintData;
  className?: string;
  children?: React.ReactNode;
}> = ({ data, className, children }) => (
  <button type="button" className={className} onClick={() => printEstimate(data)}>
    {children ?? t('export.common.print')}
  </button>
);
