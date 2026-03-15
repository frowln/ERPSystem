import React from 'react';
import {
  Award,
  ChevronRight,
  CreditCard,
  Plus,
  Trash2,
  Trophy,
} from 'lucide-react';
import { Button } from '@/design-system/components/Button';
import { EditableCell } from '@/components/ui/EditableCell';
import { formatMoney } from '@/lib/format';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';
import { PriceIndicator } from '../PriceIndicator';
import type { CompetitiveListEntry, CompetitiveListStatus, SpecItem } from '@/types';

interface ClEntriesTableProps {
  selectedSpecItem: SpecItem | undefined;
  entries: CompetitiveListEntry[];
  clStatus: CompetitiveListStatus | undefined;
  onAddProposal: () => void;
  onSelectWinner: (entryId: string) => void;
  onDeleteEntry: (entryId: string) => void;
  onUpdateEntry: (entryId: string, field: string, value: string | number) => void;
}

export const ClEntriesTable: React.FC<ClEntriesTableProps> = ({
  selectedSpecItem,
  entries,
  clStatus,
  onAddProposal,
  onSelectWinner,
  onDeleteEntry,
  onUpdateEntry,
}) => {
  if (!selectedSpecItem) {
    return (
      <div className="p-10 text-center">
        <ChevronRight size={36} className="mx-auto mb-3 text-neutral-300 dark:text-neutral-600" />
        <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
          {t('competitiveList.detail.position')}
        </p>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
          {t('competitiveList.detail.selectPositionHint')}
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-700 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 truncate">
            {t('competitiveList.detail.proposals')}
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 truncate">
            {selectedSpecItem.name} &mdash; {new Intl.NumberFormat('ru-RU').format(selectedSpecItem.quantity)} {selectedSpecItem.unitOfMeasure}
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          iconLeft={<Plus size={14} />}
          onClick={onAddProposal}
          disabled={clStatus === 'APPROVED' || clStatus === 'DECIDED'}
        >
          {t('competitiveList.detail.addProposal')}
        </Button>
      </div>

      {/* Proposals table */}
      {entries.length === 0 ? (
        <div className="p-10 text-center">
          <CreditCard size={36} className="mx-auto mb-3 text-neutral-300 dark:text-neutral-600" />
          <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
            {t('competitiveList.emptyTitle')}
          </p>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            {t('competitiveList.emptyDescription')}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50">
                <th className="text-left px-4 py-2.5 text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                  {t('competitiveList.entry.vendor')}
                </th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                  {t('competitiveList.entry.price')}
                </th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                  {t('competitiveList.entry.total')}
                </th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                  {t('competitiveList.entry.deliveryDays')}
                </th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                  {t('competitiveList.entry.prepayment')}
                </th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                  {t('competitiveList.entry.warranty')}
                </th>
                <th className="text-center px-4 py-2.5 text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                  {t('competitiveList.entry.score')}
                </th>
                <th className="text-center px-4 py-2.5 text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                  {t('competitiveList.colStatus')}
                </th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                  {t('common.actions')}
                </th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => {
                const isBestPrice =
                  entries.length > 1 &&
                  entry.unitPrice === Math.min(...entries.map((e) => e.unitPrice).filter((p) => p > 0));
                return (
                  <tr
                    key={entry.id}
                    className={cn(
                      'border-b border-neutral-100 dark:border-neutral-800 transition-colors',
                      'hover:bg-neutral-50 dark:hover:bg-neutral-800/50',
                      entry.isWinner && 'bg-success-50/50 dark:bg-success-900/10',
                    )}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {entry.isWinner && <Trophy size={14} className="text-warning-500 flex-shrink-0" />}
                        <span className="font-medium text-neutral-900 dark:text-neutral-100">
                          {entry.vendorName || entry.supplierName || entry.contractorName || t('competitiveList.detail.unknownVendor', { defaultValue: 'Не указан' })}
                        </span>
                      </div>
                      {entry.selectionReason && (
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 italic">
                          {entry.selectionReason}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      <span className="inline-flex items-center gap-1.5">
                        <PriceIndicator
                          price={entry.unitPrice}
                          allPrices={entries.map((e) => e.unitPrice)}
                        />
                        <EditableCell
                          value={entry.unitPrice}
                          type="number"
                          onSave={(v) => onUpdateEntry(entry.id, 'unitPrice', v)}
                          format={formatMoney}
                          min={0}
                          disabled={clStatus === 'APPROVED'}
                          className={cn('font-medium', isBestPrice ? 'text-success-600 dark:text-success-400' : '')}
                        />
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-neutral-700 dark:text-neutral-300">
                      {formatMoney(entry.unitPrice * (entry.quantity ?? selectedSpecItem?.quantity ?? 0))}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      <EditableCell
                        value={entry.deliveryDays}
                        type="number"
                        onSave={(v) => onUpdateEntry(entry.id, 'deliveryDays', v)}
                        min={0}
                        step={1}
                        disabled={clStatus === 'APPROVED'}
                      />
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      <EditableCell
                        value={entry.prepaymentPercent}
                        type="number"
                        onSave={(v) => onUpdateEntry(entry.id, 'prepaymentPercent', v)}
                        format={(n) => `${n}%`}
                        min={0}
                        step={1}
                        disabled={clStatus === 'APPROVED'}
                      />
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      <EditableCell
                        value={entry.warrantyMonths}
                        type="number"
                        onSave={(v) => onUpdateEntry(entry.id, 'warrantyMonths', v)}
                        format={(n) => `${n} ${t('competitiveList.entry.months')}`}
                        min={0}
                        step={1}
                        disabled={clStatus === 'APPROVED'}
                      />
                    </td>
                    <td className="px-4 py-3 text-center">
                      {entry.score != null ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium">
                          <span className={cn(
                            'px-2 py-0.5 rounded-full',
                            entry.rankPosition === 1
                              ? 'bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-300'
                              : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400',
                          )}>
                            {entry.score.toFixed(1)}
                            {entry.rankPosition != null && ` (#${entry.rankPosition})`}
                          </span>
                        </span>
                      ) : (
                        <span className="text-xs text-neutral-400">---</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {entry.isWinner ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-success-50 dark:bg-success-900/30 text-success-700 dark:text-success-300">
                          <Trophy size={12} />
                          {t('competitiveList.detail.winner')}
                        </span>
                      ) : (
                        <span className="text-xs text-neutral-400 dark:text-neutral-500">---</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {!entry.isWinner && clStatus !== 'APPROVED' && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              type="button"
                              onClick={() => onSelectWinner(entry.id)}
                              aria-label={t('competitiveList.detail.selectWinner')}
                              className="!p-1.5 text-neutral-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30"
                            >
                              <Award size={15} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              type="button"
                              onClick={() => onDeleteEntry(entry.id)}
                              aria-label={t('common.delete')}
                              className="!p-1.5 text-neutral-400 hover:text-danger-600 dark:hover:text-danger-400 hover:bg-danger-50 dark:hover:bg-danger-900/30"
                            >
                              <Trash2 size={15} />
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
};
