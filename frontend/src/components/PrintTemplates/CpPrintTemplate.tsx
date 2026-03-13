import React from 'react';
import { printDocument, formatRuMoney, formatRuNumber } from '@/lib/printDocument';
import { t } from '@/i18n';

export interface CpPrintData {
  name: string;
  projectName: string;
  status?: string;
  statusDisplayName?: string;
  companyName?: string;
  companyInn?: string;
  companyKpp?: string;
  companyAddress?: string;
  signatoryName?: string;
  signatoryPosition?: string;
  createdAt?: string;
  approvedAt?: string;
  notes?: string;
  totalCostPrice: number;
  totalCustomerPrice?: number;
  totalMargin?: number;
  marginPercent?: number;
  materialItems: CpPrintItem[];
  workItems: CpPrintItem[];
}

export interface CpPrintItem {
  rowNumber: number;
  name: string;
  unitOfMeasure: string;
  quantity: number;
  costPrice: number;
  customerPrice?: number;
  totalCost: number;
  totalCustomer?: number;
  notes?: string;
}

/**
 * Generate and print a Commercial Proposal document.
 */
export function printCommercialProposal(data: CpPrintData): void {
  const hasCustomerPrices = data.totalCustomerPrice != null && data.totalCustomerPrice > 0;

  function renderItemRows(items: CpPrintItem[]): string {
    return items
      .map(
        (item) => `
      <tr>
        <td class="text-center">${item.rowNumber}</td>
        <td>${escapeHtml(item.name)}</td>
        <td class="text-center">${escapeHtml(item.unitOfMeasure)}</td>
        <td class="num">${formatRuNumber(item.quantity, 3)}</td>
        ${hasCustomerPrices
          // Client view: show customer price only (never expose internal cost)
          ? `<td class="num">${formatRuMoney(item.customerPrice)}</td><td class="num">${formatRuMoney(item.totalCustomer)}</td>`
          // Internal/draft view: show cost price as fallback
          : `<td class="num">${formatRuMoney(item.costPrice)}</td><td class="num">${formatRuMoney(item.totalCost)}</td>`
        }
      </tr>`,
      )
      .join('');
  }

  const colCount = 6;

  const materialTotal = data.materialItems.reduce((s, i) => s + i.totalCost, 0);
  const workTotal = data.workItems.reduce((s, i) => s + i.totalCost, 0);
  const materialTotalCustomer = hasCustomerPrices
    ? data.materialItems.reduce((s, i) => s + (i.totalCustomer ?? 0), 0)
    : null;
  const workTotalCustomer = hasCustomerPrices
    ? data.workItems.reduce((s, i) => s + (i.totalCustomer ?? 0), 0)
    : null;

  const tableHeader = `
    <thead>
      <tr>
        <th style="width: 35px">${t('export.cp.colRowNum')}</th>
        <th>${t('export.cp.colName')}</th>
        <th style="width: 55px">${t('export.cp.colUnit')}</th>
        <th style="width: 65px">${t('export.cp.colQty')}</th>
        ${hasCustomerPrices
          ? `<th style="width: 85px">${t('export.cp.colCustomerPrice')}</th><th style="width: 95px">${t('export.cp.colTotalCustomer')}</th>`
          : `<th style="width: 85px">${t('export.cp.colCostPrice')}</th><th style="width: 95px">${t('export.cp.colTotalCost')}</th>`
        }
      </tr>
    </thead>`;

  const bodyHtml = `
    <div class="doc-header">
      <div class="form-name">${t('export.cp.formTitle')}</div>
      <div class="doc-title">${escapeHtml(data.name)}</div>
    </div>

    ${data.companyName ? `
    <div class="party-block" style="margin-bottom: 10pt;">
      <div class="party-label">${t('export.cp.company')}</div>
      <div class="party-name">${escapeHtml(data.companyName)}</div>
      ${data.companyInn ? `<div class="party-detail">${t('export.ks2.inn')}: ${data.companyInn}${data.companyKpp ? ` / ${t('export.cp.kpp')}: ${data.companyKpp}` : ''}</div>` : ''}
      ${data.companyAddress ? `<div class="party-detail">${data.companyAddress}</div>` : ''}
    </div>` : ''}

    <div class="meta-info">
      <span class="meta-label">${t('export.cp.project')}:</span>
      <span class="meta-value">${escapeHtml(data.projectName)}</span>
    </div>
    ${data.createdAt ? `<div class="meta-info"><span class="meta-label">${t('export.cp.createdAt')}:</span> <span class="meta-value">${data.createdAt}</span></div>` : ''}
    ${data.statusDisplayName ? `<div class="meta-info"><span class="meta-label">${t('export.cp.status')}:</span> <span class="meta-value">${escapeHtml(data.statusDisplayName)}</span></div>` : ''}

    ${data.materialItems.length > 0 ? `
    <div class="section-title">${t('export.cp.sectionMaterials')}</div>
    <table>
      ${tableHeader}
      <tbody>
        ${renderItemRows(data.materialItems)}
        <tr class="totals-row">
          <td colspan="4" class="text-right">${t('export.cp.subtotalMaterials')}</td>
          ${hasCustomerPrices
            ? `<td></td><td class="num">${formatRuMoney(materialTotalCustomer)}</td>`
            : `<td></td><td class="num">${formatRuMoney(materialTotal)}</td>`
          }
        </tr>
      </tbody>
    </table>` : ''}

    ${data.workItems.length > 0 ? `
    <div class="section-title">${t('export.cp.sectionWorks')}</div>
    <table>
      ${tableHeader}
      <tbody>
        ${renderItemRows(data.workItems)}
        <tr class="totals-row">
          <td colspan="4" class="text-right">${t('export.cp.subtotalWorks')}</td>
          ${hasCustomerPrices
            ? `<td></td><td class="num">${formatRuMoney(workTotalCustomer)}</td>`
            : `<td></td><td class="num">${formatRuMoney(workTotal)}</td>`
          }
        </tr>
      </tbody>
    </table>` : ''}

    <table style="margin-top: 10pt;">
      <tbody>
        <tr class="totals-row">
          <td style="width: 70%;" class="text-right"><strong>${t('export.cp.grandTotal')}</strong></td>
          <td class="num"><strong>${formatRuMoney(hasCustomerPrices ? data.totalCustomerPrice : data.totalCostPrice)}</strong></td>
        </tr>
        ${!hasCustomerPrices && data.totalMargin != null ? `
        <tr>
          <td class="text-right">${t('export.cp.margin')}</td>
          <td class="num">${formatRuMoney(data.totalMargin)}</td>
        </tr>` : ''}
      </tbody>
    </table>

    ${data.notes ? `<div class="notes-block"><strong>${t('export.common.notes')}:</strong> ${escapeHtml(data.notes)}</div>` : ''}

    <div class="signatures">
      <div class="signature-block">
        <div class="sig-role">${data.signatoryPosition ? escapeHtml(data.signatoryPosition) : t('export.cp.signatureRole')}</div>
        <div class="sig-line"></div>
        <div class="sig-name">${escapeHtml(data.signatoryName ?? '')}</div>
      </div>
      <div class="signature-block">
        <div class="sig-role">${t('export.cp.signatureClient')}</div>
        <div class="sig-line"></div>
        <div class="sig-name">(${t('export.ks2.signatureHint')})</div>
      </div>
    </div>
  `;

  printDocument(
    `${t('export.cp.formTitle')} - ${data.name}`,
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

export const CpPrintButton: React.FC<{
  data: CpPrintData;
  className?: string;
  children?: React.ReactNode;
}> = ({ data, className, children }) => (
  <button type="button" className={className} onClick={() => printCommercialProposal(data)}>
    {children ?? t('export.common.print')}
  </button>
);
