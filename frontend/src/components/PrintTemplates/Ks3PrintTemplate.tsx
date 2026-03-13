import React from 'react';
import { printDocument, formatRuMoney } from '@/lib/printDocument';
import { t } from '@/i18n';

export interface Ks3PrintData {
  number: string;
  documentDate: string;
  name: string;
  periodFrom: string;
  periodTo: string;
  projectName?: string;
  contractNumber?: string;
  contractDate?: string;
  contractorName?: string;
  clientName?: string;
  constructionName?: string;
  constructionAddress?: string;
  totalAmount: number;
  retentionPercent?: number;
  retentionAmount?: number;
  netAmount?: number;
  linkedKs2: Ks3LinkedKs2[];
}

export interface Ks3LinkedKs2 {
  number: string;
  name: string;
  documentDate: string;
  totalAmount: number;
}

/**
 * Generate and print a KS-3 document in Russian standard format.
 */
export function printKs3(data: Ks3PrintData): void {
  const ks2Rows = data.linkedKs2
    .map(
      (doc, idx) => `
    <tr>
      <td class="text-center">${idx + 1}</td>
      <td>${escapeHtml(doc.number)}</td>
      <td>${escapeHtml(doc.name)}</td>
      <td class="text-center">${doc.documentDate}</td>
      <td class="num">${formatRuMoney(doc.totalAmount)}</td>
    </tr>`,
    )
    .join('');

  const retentionPercent = data.retentionPercent ?? 0;
  const retentionAmount = data.retentionAmount ?? data.totalAmount * (retentionPercent / 100);
  const netAmount = data.netAmount ?? data.totalAmount - retentionAmount;

  const bodyHtml = `
    <div class="doc-header">
      <div class="form-name">${t('export.ks3.formTitle')}</div>
      <div class="doc-title">${t('export.ks3.certTitle', { number: data.number })}</div>
      <div class="doc-date">${t('export.ks2.dateLabel')}: ${data.documentDate}</div>
    </div>

    <div class="parties-grid">
      <div class="party-block">
        <div class="party-label">${t('export.ks2.contractor')}</div>
        <div class="party-name">${escapeHtml(data.contractorName ?? t('export.ks2.notSpecified'))}</div>
      </div>
      <div class="party-block">
        <div class="party-label">${t('export.ks2.client')}</div>
        <div class="party-name">${escapeHtml(data.clientName ?? t('export.ks2.notSpecified'))}</div>
      </div>
    </div>

    ${data.constructionName ? `<div class="meta-info"><span class="meta-label">${t('export.ks2.object')}:</span> <span class="meta-value">${escapeHtml(data.constructionName)}</span></div>` : ''}
    ${data.contractNumber ? `<div class="meta-info"><span class="meta-label">${t('export.ks2.contractNumber')}:</span> <span class="meta-value">${escapeHtml(data.contractNumber)}${data.contractDate ? ` ${t('export.ks2.fromDate')} ${data.contractDate}` : ''}</span></div>` : ''}

    <div class="meta-info">
      <span class="meta-label">${t('export.ks3.period')}:</span>
      <span class="meta-value">${data.periodFrom} &mdash; ${data.periodTo}</span>
    </div>

    ${data.linkedKs2.length > 0 ? `
    <h3 style="margin: 16pt 0 8pt; font-size: 10pt;">${t('export.ks3.linkedKs2Title')}</h3>
    <table>
      <thead>
        <tr>
          <th style="width: 30px">№</th>
          <th style="width: 100px">${t('export.ks3.colKs2Number')}</th>
          <th>${t('export.ks3.colKs2Name')}</th>
          <th style="width: 90px">${t('export.ks2.dateLabel')}</th>
          <th style="width: 120px">${t('export.ks3.colKs2Amount')}</th>
        </tr>
      </thead>
      <tbody>
        ${ks2Rows}
      </tbody>
    </table>
    ` : ''}

    <table style="margin-top: 16pt;">
      <tbody>
        <tr>
          <td style="width: 70%;">${t('export.ks3.totalAmount')}</td>
          <td class="num">${formatRuMoney(data.totalAmount)}</td>
        </tr>
        ${retentionPercent > 0 ? `
        <tr>
          <td>${t('export.ks3.retention', { percent: String(retentionPercent) })}</td>
          <td class="num">${formatRuMoney(retentionAmount)}</td>
        </tr>` : ''}
        <tr class="totals-row">
          <td><strong>${t('export.ks3.netAmount')}</strong></td>
          <td class="num"><strong>${formatRuMoney(netAmount)}</strong></td>
        </tr>
      </tbody>
    </table>

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
    `${t('export.ks3.formTitle')} - ${data.number}`,
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

export const Ks3PrintButton: React.FC<{
  data: Ks3PrintData;
  className?: string;
  children?: React.ReactNode;
}> = ({ data, className, children }) => (
  <button type="button" className={className} onClick={() => printKs3(data)}>
    {children ?? t('export.common.print')}
  </button>
);
