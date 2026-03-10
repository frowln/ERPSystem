import React from 'react';
import { printDocument, formatRuMoney } from '@/lib/printDocument';
import { t } from '@/i18n';

export interface InvoicePrintData {
  number: string;
  invoiceDate: string;
  dueDate?: string;
  projectName: string;
  partnerName?: string;
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
}

/**
 * Generate and print an Invoice document.
 */
export function printInvoice(data: InvoicePrintData): void {
  const vatRate = data.vatRate ?? 20;
  const vatAmount = data.vatAmount ?? data.subtotal * (vatRate / 100);

  const bodyHtml = `
    <div class="doc-header">
      <div class="form-name">${t('export.invoice.formTitle')}</div>
      <div class="doc-title">${t('export.invoice.invoiceTitle', { number: data.number })}</div>
      <div class="doc-date">${t('export.invoice.dateLabel')}: ${data.invoiceDate}</div>
    </div>

    <div class="meta-info">
      <span class="meta-label">${t('export.invoice.project')}:</span>
      <span class="meta-value">${escapeHtml(data.projectName)}</span>
    </div>
    ${data.partnerName ? `<div class="meta-info"><span class="meta-label">${t('export.invoice.partner')}:</span> <span class="meta-value">${escapeHtml(data.partnerName)}</span></div>` : ''}
    ${data.invoiceTypeDisplayName ? `<div class="meta-info"><span class="meta-label">${t('export.invoice.type')}:</span> <span class="meta-value">${escapeHtml(data.invoiceTypeDisplayName)}</span></div>` : ''}
    ${data.dueDate ? `<div class="meta-info"><span class="meta-label">${t('export.invoice.dueDate')}:</span> <span class="meta-value">${data.dueDate}${data.overdue ? ` <span style="color: red; font-weight: bold;">(${t('export.invoice.overdue')})</span>` : ''}</span></div>` : ''}
    ${data.statusDisplayName ? `<div class="meta-info"><span class="meta-label">${t('export.invoice.status')}:</span> <span class="meta-value">${escapeHtml(data.statusDisplayName)}</span></div>` : ''}

    <table style="margin-top: 12pt;">
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
