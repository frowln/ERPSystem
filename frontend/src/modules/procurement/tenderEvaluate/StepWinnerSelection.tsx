import React from 'react';
import { FormField, Textarea } from '@/design-system/components/FormField';
import { t } from '@/i18n';
import type { RankingEntry } from './types';

interface StepWinnerSelectionProps {
  ranking: RankingEntry[];
  winnerId: string;
  winnerJustification: string;
  onWinnerChange: (id: string) => void;
  onJustificationChange: (value: string) => void;
}

const RankingRow: React.FC<{
  participant: RankingEntry;
  index: number;
  isSelected: boolean;
  onSelect: (id: string) => void;
}> = React.memo(({ participant, index, isSelected, onSelect }) => (
  <label
    className={`flex items-center gap-3 border rounded-lg px-4 py-3 cursor-pointer transition-colors ${
      isSelected
        ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/30'
        : 'border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800'
    }`}
    onClick={() => onSelect(participant.id)}
  >
    <div
      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
        index === 0
          ? 'bg-warning-100 text-warning-700'
          : index === 1
            ? 'bg-neutral-200 text-neutral-700'
            : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400'
      }`}
    >
      {index + 1}
    </div>
    <div className="flex-1">
      <p className="text-sm font-medium">{participant.name}</p>
    </div>
    <div className="text-right">
      <p className="text-lg font-bold text-primary-700 dark:text-primary-300">{participant.total.toFixed(2)}</p>
      <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('procurement.tenderEvaluate.pointsUnit')}</p>
    </div>
    <input
      type="radio"
      name="winner"
      checked={isSelected}
      onChange={() => onSelect(participant.id)}
      className="h-4 w-4 text-primary-600"
    />
  </label>
));

RankingRow.displayName = 'RankingRow';

export const StepWinnerSelection: React.FC<StepWinnerSelectionProps> = React.memo(({
  ranking,
  winnerId,
  winnerJustification,
  onWinnerChange,
  onJustificationChange,
}) => (
  <div className="space-y-4">
    <p className="text-sm text-neutral-500 dark:text-neutral-400">
      {t('procurement.tenderEvaluate.rankingTitle')}
    </p>
    <div className="space-y-2">
      {ranking.map((participant, index) => (
        <RankingRow
          key={participant.id}
          participant={participant}
          index={index}
          isSelected={winnerId === participant.id}
          onSelect={onWinnerChange}
        />
      ))}
    </div>

    {winnerId && (
      <div className="space-y-3">
        <div className="bg-success-50 border border-success-200 rounded-lg p-3 dark:bg-success-950/30 dark:border-success-900">
          <p className="text-sm text-success-800 dark:text-success-300">
            {t('procurement.tenderEvaluate.winnerLabel')} <strong>{ranking.find((item) => item.id === winnerId)?.name ?? '\u2014'}</strong>
          </p>
        </div>
        <FormField
          label={t('procurement.tenderEvaluate.winnerJustificationLabel')}
          hint={t('procurement.tenderEvaluate.winnerJustificationHint')}
        >
          <Textarea
            value={winnerJustification}
            onChange={(e) => onJustificationChange(e.target.value)}
            placeholder={t('procurement.tenderEvaluate.winnerJustificationPlaceholder')}
            rows={3}
          />
        </FormField>
      </div>
    )}
  </div>
));

StepWinnerSelection.displayName = 'StepWinnerSelection';
