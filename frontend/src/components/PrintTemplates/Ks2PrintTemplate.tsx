import React from 'react';
import { printDocument, formatRuMoney, formatRuNumber } from '@/lib/printDocument';
import { t } from '@/i18n';

export interface Ks2PrintData {
  documentNumber: string;
  documentDate: string;
  projectName: string;
  contractNumber?: string;
  contractDate?: string;
  contractorName?: string;
  contractorInn?: string;
  contractorAddress?: string;
  clientName?: string;
  clientInn?: string;
  clientAddress?: string;
  objectName?: string;
  items: Ks2PrintLineItem[];
  totalAmount: number;
  vatRate?: number;
  vatAmount?: number;
  totalWithVat?: number;
  notes?: string;
}

export interface Ks2PrintLineItem {
  rowNumber: number;
  name: string;
  unitOfMeasure: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

/**
 * Generate and print a KS-2 document in Russian standard format.
 */
export function printKs2(data: Ks2PrintData): void {
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
    </tr>`,
    )
    .join('');

  const vatRate = data.vatRate ?? 20;
  const vatAmount = data.vatAmount ?? data.totalAmount * (vatRate / 100);
  const totalWithVat = data.totalWithVat ?? data.totalAmount + vatAmount;

  const bodyHtml = `
    <div class="doc-header">
      <div class="form-name">${t('export.ks2.formTitle')}</div>
      <div class="doc-title">${t('export.ks2.actTitle', { number: data.documentNumber })}</div>
      <div class="doc-date">${t('export.ks2.dateLabel')}: ${data.documentDate}</div>
    </div>

    <div class="parties-grid">
      <div class="party-block">
        <div class="party-label">${t('export.ks2.contractor')}</div>
        <div class="party-name">${escapeHtml(data.contractorName ?? t('export.ks2.notSpecified'))}</div>
        ${data.contractorInn ? `<div class="party-detail">${t('export.ks2.inn')}: ${data.contractorInn}</div>` : ''}
        ${data.contractorAddress ? `<div class="party-detail">${data.contractorAddress}</div>` : ''}
      </div>
      <div class="party-block">
        <div class="party-label">${t('export.ks2.client')}</div>
        <div class="party-name">${escapeHtml(data.clientName ?? t('export.ks2.notSpecified'))}</div>
        ${data.clientInn ? `<div class="party-detail">${t('export.ks2.inn')}: ${data.clientInn}</div>` : ''}
        ${data.clientAddress ? `<div class="party-detail">${data.clientAddress}</div>` : ''}
      </div>
    </div>

    ${data.objectName ? `<div class="meta-info"><span class="meta-label">${t('export.ks2.object')}:</span> <span class="meta-value">${escapeHtml(data.objectName)}</span></div>` : ''}
    ${data.contractNumber ? `<div class="meta-info"><span class="meta-label">${t('export.ks2.contractNumber')}:</span> <span class="meta-value">${escapeHtml(data.contractNumber)}${data.contractDate ? ` ${t('export.ks2.fromDate')} ${data.contractDate}` : ''}</span></div>` : ''}

    <table>
      <thead>
        <tr>
          <th style="width: 40px">${t('export.ks2.colRowNum')}</th>
          <th>${t('export.ks2.colWorkName')}</th>
          <th style="width: 60px">${t('export.ks2.colUnit')}</th>
          <th style="width: 80px">${t('export.ks2.colQty')}</th>
          <th style="width: 100px">${t('export.ks2.colPrice')}</th>
          <th style="width: 110px">${t('export.ks2.colAmount')}</th>
        </tr>
      </thead>
      <tbody>
        ${itemRows}
        <tr class="totals-row">
          <td colspan="5" class="text-right">${t('export.ks2.subtotal')}</td>
          <td class="num">${formatRuMoney(data.totalAmount)}</td>
        </tr>
        <tr class="totals-row">
          <td colspan="5" class="text-right">${t('export.ks2.vat', { rate: String(vatRate) })}</td>
          <td class="num">${formatRuMoney(vatAmount)}</td>
        </tr>
        <tr class="totals-row">
          <td colspan="5" class="text-right"><strong>${t('export.ks2.totalWithVat')}</strong></td>
          <td class="num"><strong>${formatRuMoney(totalWithVat)}</strong></td>
        </tr>
      </tbody>
    </table>

    ${data.notes ? `<div class="notes-block"><strong>${t('export.common.notes')}:</strong> ${escapeHtml(data.notes)}</div>` : ''}

    <div class="signatures">
      <div class="signature-block">
        <div class="sig-role">${t('export.ks2.signatureContractor')}</div>
        <div class="sig-line"></div>
        <div class="sig-name">(${t('export.ks2.signatureHint')})</div>
      </div>
      <div class="signature-block">
        <div class="sig-role">${t('export.ks2.signatureClient')}</div>
        <div class="sig-line"></div>
        <div class="sig-name">(${t('export.ks2.signatureHint')})</div>
      </div>
    </div>
  `;

  printDocument(
    `${t('export.ks2.formTitle')} - ${data.documentNumber}`,
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

/**
 * React button component that triggers KS-2 print.
 * Can be used inline in detail pages.
 */
export const Ks2PrintButton: React.FC<{
  data: Ks2PrintData;
  className?: string;
  children?: React.ReactNode;
}> = ({ data, className, children }) => (
  <button type="button" className={className} onClick={() => printKs2(data)}>
    {children ?? t('export.common.print')}
  </button>
);
