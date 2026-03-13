import React from 'react';
import { printDocument, formatRuMoney } from '@/lib/printDocument';
import { t } from '@/i18n';

export interface InvoicePrintItem {
  rowNumber: number;
  name: string;
  unitOfMeasure: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
  vatAmount: number;
  totalAmount: number;
}

export interface InvoicePrintData {
  number: string;
  invoiceDate: string;
  dueDate?: string;
  projectName: string;
  // Seller (Продавец)
  sellerName?: string;
  sellerInn?: string;
  sellerKpp?: string;
  sellerAddress?: string;
  sellerBank?: string;
  sellerBic?: string;
  sellerAccount?: string;
  sellerCorrespondentAccount?: string;
  // Buyer (Покупатель)
  partnerName?: string;
  partnerInn?: string;
  partnerKpp?: string;
  partnerAddress?: string;
  // Legacy fields
  invoiceTypeDisplayName?: string;
  status?: string;
  statusDisplayName?: string;
  subtotal: number;
  vatRate?: number;
  vatAmount?: number;
  totalAmount: number;
  paidAmount?: number;
  remainingAmount?: number;
  overdue?: boolean;
  notes?: string;
  createdBy?: string;
  items?: InvoicePrintItem[];
}

/**
 * Generate and print an Invoice document (Счёт на оплату).
 * Compliant with standard Russian "Счёт на оплату" format.
 */
export function printInvoice(data: InvoicePrintData): void {
  const vatRate = data.vatRate ?? 20;
  const vatAmount = data.vatAmount ?? data.subtotal * (vatRate / 100);
  const hasItems = data.items && data.items.length > 0;

  const bankBlock = (data.sellerBank || data.sellerBic || data.sellerAccount) ? `
    <table class="bank-table" style="margin-top: 6pt; font-size: 8.5pt; border-collapse: collapse; width: 100%;">
      <tbody>
        ${data.sellerBank ? `<tr><td style="width:40%; padding: 2px 4px; color:#555;">${t('export.invoice.bank')}:</td><td style="padding: 2px 4px;">${escapeHtml(data.sellerBank)}</td></tr>` : ''}
        ${data.sellerBic ? `<tr><td style="padding: 2px 4px; color:#555;">БИК:</td><td style="padding: 2px 4px;">${escapeHtml(data.sellerBic)}</td></tr>` : ''}
        ${data.sellerAccount ? `<tr><td style="padding: 2px 4px; color:#555;">${t('export.invoice.accountNo')}:</td><td style="padding: 2px 4px;">${escapeHtml(data.sellerAccount)}</td></tr>` : ''}
        ${data.sellerCorrespondentAccount ? `<tr><td style="padding: 2px 4px; color:#555;">${t('export.invoice.corrAccount')}:</td><td style="padding: 2px 4px;">${escapeHtml(data.sellerCorrespondentAccount)}</td></tr>` : ''}
      </tbody>
    </table>` : '';

  const itemsTable = hasItems ? `
    <table style="margin-top: 10pt; font-size: 8pt;">
      <thead>
        <tr>
          <th style="width:28px">№</th>
          <th>${t('export.invoice.colName')}</th>
          <th style="width:45px">${t('export.cp.colUnit')}</th>
          <th style="width:60px">${t('export.cp.colQty')}</th>
          <th style="width:80px">${t('export.invoice.colUnitPrice')}</th>
          <th style="width:60px">${t('export.invoice.colVatRate')}</th>
          <th style="width:80px">${t('export.invoice.colVatAmt')}</th>
          <th style="width:90px">${t('export.invoice.colTotal')}</th>
        </tr>
      </thead>
      <tbody>
        ${data.items!.map((item) => `
        <tr>
          <td class="text-center">${item.rowNumber}</td>
          <td>${escapeHtml(item.name)}</td>
          <td class="text-center">${escapeHtml(item.unitOfMeasure)}</td>
          <td class="num">${item.quantity}</td>
          <td class="num">${formatRuMoney(item.unitPrice)}</td>
          <td class="text-center">${item.vatRate}%</td>
          <td class="num">${formatRuMoney(item.vatAmount)}</td>
          <td class="num">${formatRuMoney(item.totalAmount)}</td>
        </tr>`).join('')}
      </tbody>
    </table>` : '';

  const bodyHtml = `
    <div class="doc-header">
      <div class="form-name">${t('export.invoice.formTitle')}</div>
      <div class="doc-title">${t('export.invoice.invoiceTitle', { number: data.number })}</div>
      <div class="doc-date">${t('export.invoice.dateLabel')}: ${data.invoiceDate}${data.dueDate ? ` &nbsp;·&nbsp; ${t('export.invoice.dueDate')}: ${data.dueDate}${data.overdue ? ' <span style="color:red;font-weight:bold;">(просрочен)</span>' : ''}` : ''}</div>
    </div>

    <div style="display:flex; gap:20pt; margin-top:8pt; font-size:9pt;">
      <div style="flex:1; border:1px solid #ccc; padding:6pt; border-radius:4px;">
        <div style="font-weight:bold; margin-bottom:4pt;">${t('export.invoice.seller')}</div>
        ${data.sellerName ? `<div>${escapeHtml(data.sellerName)}</div>` : ''}
        ${data.sellerInn ? `<div>${t('export.ks2.inn')}: ${escapeHtml(data.sellerInn)}${data.sellerKpp ? ` &nbsp;${t('export.cp.kpp')}: ${escapeHtml(data.sellerKpp)}` : ''}</div>` : ''}
        ${data.sellerAddress ? `<div>${escapeHtml(data.sellerAddress)}</div>` : ''}
        ${bankBlock}
      </div>
      <div style="flex:1; border:1px solid #ccc; padding:6pt; border-radius:4px;">
        <div style="font-weight:bold; margin-bottom:4pt;">${t('export.invoice.buyer')}</div>
        ${data.partnerName ? `<div>${escapeHtml(data.partnerName)}</div>` : ''}
        ${data.partnerInn ? `<div>${t('export.ks2.inn')}: ${escapeHtml(data.partnerInn)}${data.partnerKpp ? ` &nbsp;${t('export.cp.kpp')}: ${escapeHtml(data.partnerKpp)}` : ''}</div>` : ''}
        ${data.partnerAddress ? `<div>${escapeHtml(data.partnerAddress)}</div>` : ''}
        <div style="margin-top:4pt;">${t('export.invoice.project')}: ${escapeHtml(data.projectName)}</div>
      </div>
    </div>

    ${itemsTable}

    <table style="margin-top: ${hasItems ? '8' : '12'}pt; float:right; min-width:280pt;">
      <tbody>
        <tr>
          <td style="width: 70%;">${t('export.invoice.subtotal')}</td>
          <td class="num">${formatRuMoney(data.subtotal)}</td>
        </tr>
        <tr>
          <td>${t('export.invoice.vat', { rate: String(vatRate) })}</td>
          <td class="num">${formatRuMoney(vatAmount)}</td>
        </tr>
        <tr class="totals-row">
          <td><strong>${t('export.invoice.totalAmount')}</strong></td>
          <td class="num"><strong>${formatRuMoney(data.totalAmount)}</strong></td>
        </tr>
        ${data.paidAmount != null ? `
        <tr>
          <td>${t('export.invoice.paidAmount')}</td>
          <td class="num">${formatRuMoney(data.paidAmount)}</td>
        </tr>` : ''}
        ${data.remainingAmount != null ? `
        <tr>
          <td><strong>${t('export.invoice.remainingAmount')}</strong></td>
          <td class="num"><strong>${formatRuMoney(data.remainingAmount)}</strong></td>
        </tr>` : ''}
      </tbody>
    </table>
    <div style="clear:both;"></div>

    ${data.notes ? `<div class="notes-block"><strong>${t('export.common.notes')}:</strong> ${escapeHtml(data.notes)}</div>` : ''}

    <div class="signatures">
      <div class="signature-block">
        <div class="sig-role">${t('export.invoice.signatureSender')}</div>
        <div class="sig-line"></div>
        <div class="sig-name">${escapeHtml(data.createdBy ?? '')}</div>
      </div>
      <div class="signature-block">
        <div class="sig-role">${t('export.invoice.signatureReceiver')}</div>
        <div class="sig-line"></div>
        <div class="sig-name">(${t('export.ks2.signatureHint')})</div>
      </div>
    </div>
  `;

  printDocument(
    `${t('export.invoice.formTitle')} - ${data.number}`,
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

export const InvoicePrintButton: React.FC<{
  data: InvoicePrintData;
  className?: string;
  children?: React.ReactNode;
}> = ({ data, className, children }) => (
  <button type="button" className={className} onClick={() => printInvoice(data)}>
    {children ?? t('export.common.print')}
  </button>
);
