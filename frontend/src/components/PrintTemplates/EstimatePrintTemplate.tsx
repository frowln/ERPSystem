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
  orderedAmount?: number;
  invoicedAmount?: number;
  totalSpent?: number;
  balance?: number;
  createdBy?: string;
  createdAt?: string;
  notes?: string;
  items: EstimatePrintItem[];
}

export interface EstimatePrintItem {
  rowNumber: number;
  name: string;
  unitOfMeasure: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  unitPriceCustomer?: number;
  amountCustomer?: number;
}

/**
 * Generate and print an Estimate document.
 */
export function printEstimate(data: EstimatePrintData): void {
  const itemRows = data.items
    .map(
      (item) => `
    <tr>
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

  const hasCustomerPrices = data.items.some((item) => item.unitPriceCustomer != null);

  const totalCustomer = hasCustomerPrices
    ? data.items.reduce((sum, item) => sum + (item.amountCustomer ?? 0), 0)
    : null;

  const colCount = hasCustomerPrices ? 8 : 6;

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
          <td colspan="5" class="text-right">${t('export.estimate.total')}</td>
          <td class="num">${formatRuMoney(data.totalAmount)}</td>
          ${hasCustomerPrices ? `<td></td><td class="num">${formatRuMoney(totalCustomer)}</td>` : ''}
        </tr>
      </tbody>
    </table>

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
