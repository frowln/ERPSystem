import React from 'react';
import { printDocument, formatRuMoney, stampCircleHtml } from '@/lib/printDocument';
import { t } from '@/i18n';

export interface ReconciliationActProps {
  organizationName: string;
  organizationInn: string;
  counterpartyName: string;
  counterpartyInn: string;
  periodFrom: string;
  periodTo: string;
  ourEntries: Array<{ date: string; document: string; debit: number; credit: number }>;
  theirEntries: Array<{ date: string; document: string; debit: number; credit: number }>;
  openingBalance: number; // positive = they owe us
  signatoryOrg: string;
  signatoryCounterparty: string;
}

/**
 * Generate and print a Reconciliation Act (Акт сверки взаимных расчётов)
 * in Russian standard accounting format.
 */
export function printReconciliationAct(data: ReconciliationActProps): void {
  const ourTotalDebit = data.ourEntries.reduce((s, e) => s + e.debit, 0);
  const ourTotalCredit = data.ourEntries.reduce((s, e) => s + e.credit, 0);
  const theirTotalDebit = data.theirEntries.reduce((s, e) => s + e.debit, 0);
  const theirTotalCredit = data.theirEntries.reduce((s, e) => s + e.credit, 0);

  // Closing balance: opening + our debit - our credit
  const closingBalance = data.openingBalance + ourTotalDebit - ourTotalCredit;

  const balanceParty =
    closingBalance > 0 ? data.counterpartyName : data.organizationName;
  const absBalance = Math.abs(closingBalance);

  function renderEntryRows(
    entries: Array<{ date: string; document: string; debit: number; credit: number }>,
  ): string {
    if (entries.length === 0) {
      return '<tr><td colspan="4" class="text-center" style="color:#999;padding:8pt 4pt;">---</td></tr>';
    }
    return entries
      .map(
        (e) => `
      <tr>
        <td class="text-center" style="white-space:nowrap;">${escapeHtml(e.date)}</td>
        <td>${escapeHtml(e.document)}</td>
        <td class="num">${e.debit ? formatRuMoney(e.debit) : ''}</td>
        <td class="num">${e.credit ? formatRuMoney(e.credit) : ''}</td>
      </tr>`,
      )
      .join('');
  }

  const bodyHtml = `
    <div class="doc-header">
      <div class="form-name">АКТ СВЕРКИ</div>
      <div class="doc-title">Акт сверки взаимных расч\u0451тов</div>
      <div class="doc-date">за период с ${escapeHtml(data.periodFrom)} по ${escapeHtml(data.periodTo)}</div>
    </div>

    <div style="text-align:center;margin-bottom:12pt;font-size:10pt;">
      между <strong>${escapeHtml(data.organizationName)}</strong>
      (ИНН ${escapeHtml(data.organizationInn)})<br/>
      и <strong>${escapeHtml(data.counterpartyName)}</strong>
      (ИНН ${escapeHtml(data.counterpartyInn)})
    </div>

    <div style="margin-bottom:6pt;font-size:10pt;">
      <strong>Сальдо на начало периода:</strong>
      ${formatRuMoney(Math.abs(data.openingBalance))} руб.
      ${data.openingBalance > 0 ? `в пользу ${escapeHtml(data.organizationName)}` : data.openingBalance < 0 ? `в пользу ${escapeHtml(data.counterpartyName)}` : ''}
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8pt;margin-bottom:12pt;">
      <!-- Left column: our data -->
      <div>
        <div style="font-weight:bold;font-size:9pt;text-align:center;margin-bottom:4pt;border-bottom:0.5pt solid #999;padding-bottom:2pt;">
          По данным ${escapeHtml(data.organizationName)}
        </div>
        <table style="margin-bottom:0;">
          <thead>
            <tr>
              <th style="width:70px;">Дата</th>
              <th>Документ</th>
              <th style="width:90px;">Дебет</th>
              <th style="width:90px;">Кредит</th>
            </tr>
          </thead>
          <tbody>
            ${renderEntryRows(data.ourEntries)}
            <tr class="totals-row">
              <td colspan="2" class="text-right">Обороты за период:</td>
              <td class="num">${formatRuMoney(ourTotalDebit)}</td>
              <td class="num">${formatRuMoney(ourTotalCredit)}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <!-- Right column: their data -->
      <div>
        <div style="font-weight:bold;font-size:9pt;text-align:center;margin-bottom:4pt;border-bottom:0.5pt solid #999;padding-bottom:2pt;">
          По данным ${escapeHtml(data.counterpartyName)}
        </div>
        <table style="margin-bottom:0;">
          <thead>
            <tr>
              <th style="width:70px;">Дата</th>
              <th>Документ</th>
              <th style="width:90px;">Дебет</th>
              <th style="width:90px;">Кредит</th>
            </tr>
          </thead>
          <tbody>
            ${renderEntryRows(data.theirEntries)}
            <tr class="totals-row">
              <td colspan="2" class="text-right">Обороты за период:</td>
              <td class="num">${formatRuMoney(theirTotalDebit)}</td>
              <td class="num">${formatRuMoney(theirTotalCredit)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div style="margin:12pt 0;padding:8pt;border:1pt solid #333;font-size:11pt;text-align:center;">
      <strong>Сальдо на конец периода: ${formatRuMoney(absBalance)} руб.</strong>
      ${closingBalance !== 0 ? ` в пользу <strong>${escapeHtml(balanceParty)}</strong>` : ''}
    </div>

    <div class="signatures" style="grid-template-columns:1fr 1fr;gap:40pt;">
      <div class="signature-block" style="border-top:none;text-align:left;">
        <div style="font-weight:bold;font-size:10pt;margin-bottom:4pt;">
          От ${escapeHtml(data.organizationName)}:
        </div>
        <div style="margin-top:16pt;display:flex;align-items:flex-end;gap:12pt;">
          <div style="flex:1;">
            <div style="border-bottom:0.5pt solid #333;height:20pt;"></div>
            <div style="font-size:8pt;color:#666;text-align:center;margin-top:2pt;">(подпись)</div>
          </div>
          <div style="flex:1;">
            <div style="border-bottom:0.5pt solid #333;height:20pt;text-align:center;">${escapeHtml(data.signatoryOrg)}</div>
            <div style="font-size:8pt;color:#666;text-align:center;margin-top:2pt;">(Ф.И.О.)</div>
          </div>
        </div>
        <div style="margin-top:12pt;display:flex;justify-content:center;">
          ${stampCircleHtml()}
        </div>
      </div>

      <div class="signature-block" style="border-top:none;text-align:left;">
        <div style="font-weight:bold;font-size:10pt;margin-bottom:4pt;">
          От ${escapeHtml(data.counterpartyName)}:
        </div>
        <div style="margin-top:16pt;display:flex;align-items:flex-end;gap:12pt;">
          <div style="flex:1;">
            <div style="border-bottom:0.5pt solid #333;height:20pt;"></div>
            <div style="font-size:8pt;color:#666;text-align:center;margin-top:2pt;">(подпись)</div>
          </div>
          <div style="flex:1;">
            <div style="border-bottom:0.5pt solid #333;height:20pt;text-align:center;">${escapeHtml(data.signatoryCounterparty)}</div>
            <div style="font-size:8pt;color:#666;text-align:center;margin-top:2pt;">(Ф.И.О.)</div>
          </div>
        </div>
        <div style="margin-top:12pt;display:flex;justify-content:center;">
          ${stampCircleHtml()}
        </div>
      </div>
    </div>
  `;

  const extraCss = `
    .signatures {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 40pt;
      margin-top: 20pt;
      page-break-inside: avoid;
    }
  `;

  printDocument(
    `\u0410\u043A\u0442 \u0441\u0432\u0435\u0440\u043A\u0438 \u2014 ${data.organizationName} / ${data.counterpartyName}`,
    bodyHtml,
    extraCss,
  );
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export const ReconciliationActPrintButton: React.FC<{
  data: ReconciliationActProps;
  className?: string;
  children?: React.ReactNode;
}> = ({ data, className, children }) => (
  <button
    type="button"
    className={className}
    onClick={() => printReconciliationAct(data)}
  >
    {children ?? '\u041F\u0435\u0447\u0430\u0442\u044C'}
  </button>
);
