import React from 'react';
import { FormField, Input, Select } from '@/design-system/components/FormField';
import { t } from '@/i18n';
import type { EditableCriteria } from './types';

interface StepParametersProps {
  comparisonId: string;
  comparisonOptions: { value: string; label: string }[];
  comparisonsLoading: boolean;
  criteria: EditableCriteria[];
  totalWeight: number;
  isComparisonLocked: boolean;
  onComparisonChange: (value: string) => void;
  onWeightChange: (index: number, value: string) => void;
}

export const StepParameters: React.FC<StepParametersProps> = React.memo(({
  comparisonId,
  comparisonOptions,
  comparisonsLoading,
  criteria,
  totalWeight,
  isComparisonLocked,
  onComparisonChange,
  onWeightChange,
}) => (
  <div className="space-y-4">
    <FormField label={t('procurement.tenderEvaluate.labelTender')} required>
      {(!comparisonsLoading && comparisonOptions.length === 0) ? (
        <Input disabled placeholder={t('procurement.tenderEvaluate.emptyTenders')} />
      ) : (
        <Select
          options={comparisonOptions}
          value={comparisonId}
          onChange={(event) => onComparisonChange(event.target.value)}
          placeholder={comparisonsLoading ? t('common.loading') : t('procurement.tenderEvaluate.placeholderTender')}
        />
      )}
    </FormField>

    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
          {t('procurement.tenderEvaluate.criteriaLabel')}
        </span>
        <span className={`text-xs font-medium ${totalWeight === 100 ? 'text-success-600' : 'text-danger-600'}`}>
          {t('procurement.tenderEvaluate.criteriaWeightTotal', { total: String(totalWeight) })}
          {totalWeight !== 100 ? ` ${t('procurement.tenderEvaluate.criteriaWeightMustBe100')}` : ''}
        </span>
      </div>
      {isComparisonLocked && (
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-2">
          {t('procurement.tenderEvaluate.comparisonLockedHint')}
        </p>
      )}
      <div className="space-y-2">
        {criteria.map((criterion, index) => (
          <div key={`${criterion.type}-${criterion.sortOrder}-${criterion.id ?? index}`} className="flex items-center gap-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg px-3 py-2">
            <span className="text-sm flex-1">{criterion.name}</span>
            <Input
              type="number"
              className="w-20 text-center"
              value={String(criterion.weight)}
              onChange={(event) => onWeightChange(index, event.target.value)}
              min={0}
              max={100}
              disabled={isComparisonLocked}
            />
            <span className="text-sm text-neutral-500 dark:text-neutral-400">%</span>
          </div>
        ))}
      </div>
    </div>
  </div>
));

StepParameters.displayName = 'StepParameters';
