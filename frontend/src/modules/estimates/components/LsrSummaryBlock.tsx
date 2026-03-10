import React from 'react';
import type { LocalEstimateSummary } from '@/types';
import { formatMoney } from '@/lib/format';
import { t } from '@/i18n';
import { cn } from '@/lib/cn';

interface LsrSummaryBlockProps {
  summary: LocalEstimateSummary;
}

const LsrSummaryBlock: React.FC<LsrSummaryBlockProps> = ({ summary }) => {
  const rows: Array<{ label: string; value: number; bold?: boolean; highlight?: boolean }> = [
    { label: t('estimates.normative.summaryDirectCosts'), value: Number(summary.directCostsTotal ?? 0) },
    { label: t('estimates.normative.summaryOverhead'), value: Number(summary.overheadTotal ?? 0) },
    { label: t('estimates.normative.summaryProfit'), value: Number(summary.profitTotal ?? 0) },
    { label: t('estimates.normative.summarySubtotal'), value: Number(summary.subtotal ?? 0), bold: true },
  ];

  if (Number(summary.winterSurcharge ?? 0) > 0) {
    rows.push({
      label: `${t('estimates.normative.summaryWinter')} (${summary.winterSurchargeRate}%)`,
      value: Number(summary.winterSurcharge),
    });
  }
  if (Number(summary.tempStructures ?? 0) > 0) {
    rows.push({
      label: `${t('estimates.normative.summaryTemp')} (${summary.tempStructuresRate}%)`,
      value: Number(summary.tempStructures),
    });
  }
  if (Number(summary.contingency ?? 0) > 0) {
    rows.push({
      label: `${t('estimates.normative.summaryContingency')} (${summary.contingencyRate}%)`,
      value: Number(summary.contingency),
    });
  }
  if (Number(summary.vatAmount ?? 0) > 0) {
    rows.push({
      label: `${t('estimates.normative.summaryVat')} (${summary.vatRate}%)`,
      value: Number(summary.vatAmount),
    });
  }

  rows.push({
    label: t('estimates.normative.summaryGrandTotal'),
    value: Number(summary.grandTotal ?? 0),
    bold: true,
    highlight: true,
  });

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
      <div className="px-6 py-3 bg-neutral-50 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700">
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
          {t('estimates.normative.summaryBlockTitle')}
        </h3>
      </div>
      <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
        {rows.map((row, i) => (
          <div
            key={i}
            className={cn(
              'flex items-center justify-between px-6 py-2',
              row.highlight && 'bg-blue-50 dark:bg-blue-900/20',
            )}
          >
            <span className={cn(
              'text-sm',
              row.bold ? 'font-semibold text-neutral-900 dark:text-neutral-100' : 'text-neutral-600 dark:text-neutral-400',
            )}>
              {row.label}
            </span>
            <span className={cn(
              'text-sm font-mono tabular-nums',
              row.bold ? 'font-bold text-neutral-900 dark:text-neutral-100' : 'text-neutral-700 dark:text-neutral-300',
            )}>
              {formatMoney(row.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LsrSummaryBlock;
