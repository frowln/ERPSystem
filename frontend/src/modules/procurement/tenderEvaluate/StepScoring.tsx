import React from 'react';
import { Input } from '@/design-system/components/FormField';
import { t } from '@/i18n';
import type { EditableCriteria, Participant } from './types';
import { parseInputNumber } from './types';

interface StepScoringProps {
  participants: Participant[];
  filteredSuppliers: Participant[];
  criteriaWithIds: (EditableCriteria & { id: string })[];
  scoresInput: Record<string, Record<string, string>>;
  supplierSearch: string;
  isComparisonLocked: boolean;
  onSupplierSearchChange: (value: string) => void;
  onScoreChange: (vendorId: string, criterionId: string, value: string) => void;
}

const ScoringTableRow: React.FC<{
  supplier: Participant;
  criteriaWithIds: (EditableCriteria & { id: string })[];
  scoresInput: Record<string, Record<string, string>>;
  isComparisonLocked: boolean;
  onScoreChange: (vendorId: string, criterionId: string, value: string) => void;
}> = React.memo(({ supplier, criteriaWithIds, scoresInput, isComparisonLocked, onScoreChange }) => {
  const hasAllScores = criteriaWithIds.every((criterion) => {
    const value = parseInputNumber(scoresInput[supplier.id]?.[criterion.id]);
    return value !== undefined && value >= 0 && value <= criterion.maxScore;
  });
  const total = hasAllScores
    ? criteriaWithIds.reduce((sum, criterion) => {
      const value = parseInputNumber(scoresInput[supplier.id]?.[criterion.id]);
      if (value === undefined) {
        return sum;
      }
      return sum + (value * criterion.weight) / Math.max(criterion.maxScore, 1);
    }, 0)
    : null;

  return (
    <tr className="border-b border-neutral-100 dark:border-neutral-800">
      <td className="py-2 pr-3">
        <p className="font-medium">{supplier.name}</p>
        {supplier.email && (
          <p className="text-xs text-neutral-500 dark:text-neutral-400">{supplier.email}</p>
        )}
      </td>
      {criteriaWithIds.map((criterion) => (
        <td key={criterion.id} className="py-2 px-2">
          <Input
            type="number"
            className="w-20 text-center"
            min={0}
            max={criterion.maxScore}
            step="0.1"
            value={scoresInput[supplier.id]?.[criterion.id] ?? ''}
            onChange={(event) => onScoreChange(supplier.id, criterion.id, event.target.value)}
            placeholder="0"
            disabled={isComparisonLocked}
          />
        </td>
      ))}
      <td className="py-2 pl-3 text-center font-semibold text-primary-700 dark:text-primary-300">
        {total === null ? '\u2014' : total.toFixed(2)}
      </td>
    </tr>
  );
});

ScoringTableRow.displayName = 'ScoringTableRow';

export const StepScoring: React.FC<StepScoringProps> = React.memo(({
  participants,
  filteredSuppliers,
  criteriaWithIds,
  scoresInput,
  supplierSearch,
  isComparisonLocked,
  onSupplierSearchChange,
  onScoreChange,
}) => (
  <div className="space-y-4">
    <p className="text-sm text-neutral-500 dark:text-neutral-400">
      {t('procurement.tenderEvaluate.step2Hint')}
    </p>
    {participants.length === 0 ? (
      <div className="rounded-lg border border-neutral-200 dark:border-neutral-700 p-4 text-sm text-neutral-500 dark:text-neutral-400">
        {t('procurement.tenderEvaluate.emptySuppliers')}
      </div>
    ) : (
      <div className="space-y-3">
        <Input
          value={supplierSearch}
          onChange={(event) => onSupplierSearchChange(event.target.value)}
          placeholder={`${t('common.search')}...`}
        />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-neutral-700">
                <th className="text-left py-2 pr-3 font-medium text-neutral-600 dark:text-neutral-300">
                  {t('procurement.tenderEvaluate.thParticipant')}
                </th>
                {criteriaWithIds.map((criterion) => (
                  <th key={criterion.id} className="text-center py-2 px-2 font-medium text-neutral-600 dark:text-neutral-300 whitespace-nowrap">
                    {criterion.name} ({criterion.weight}%)
                  </th>
                ))}
                <th className="text-center py-2 pl-3 font-medium text-neutral-600 dark:text-neutral-300">
                  {t('procurement.tenderEvaluate.thTotal')}
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredSuppliers.length === 0 && (
                <tr>
                  <td colSpan={criteriaWithIds.length + 2} className="py-4 text-center text-sm text-neutral-500 dark:text-neutral-400">
                    {t('search.noResults')}
                  </td>
                </tr>
              )}
              {filteredSuppliers.map((supplier) => (
                <ScoringTableRow
                  key={supplier.id}
                  supplier={supplier}
                  criteriaWithIds={criteriaWithIds}
                  scoresInput={scoresInput}
                  isComparisonLocked={isComparisonLocked}
                  onScoreChange={onScoreChange}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )}
  </div>
));

StepScoring.displayName = 'StepScoring';
