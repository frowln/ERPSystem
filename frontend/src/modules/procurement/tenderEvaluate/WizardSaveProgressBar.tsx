import React from 'react';
import { t } from '@/i18n';
import type { ScoringSaveProgress } from './types';

interface WizardSaveProgressBarProps {
  progress: ScoringSaveProgress;
}

export const WizardSaveProgressBar: React.FC<WizardSaveProgressBarProps> = React.memo(({ progress }) => (
  <div className="mb-4 rounded-lg border border-primary-200 bg-primary-50 dark:border-primary-900 dark:bg-primary-950/30 px-3 py-2">
    <div className="flex items-center justify-between gap-2 text-xs">
      <span className="text-primary-800 dark:text-primary-200">
        {t('procurement.tenderEvaluate.savingScoresProgress', {
          saved: String(progress.saved),
          total: String(progress.total),
        })}
      </span>
      {progress.retryAttempt > 0 && (
        <span className="text-warning-700 dark:text-warning-300">
          {t('procurement.tenderEvaluate.savingScoresRetry', {
            attempt: String(progress.retryAttempt),
          })}
        </span>
      )}
    </div>
    <div className="mt-2 h-1.5 rounded bg-primary-100 dark:bg-primary-900/60">
      <div
        className="h-1.5 rounded bg-primary-600 transition-all duration-300"
        style={{ width: `${Math.min(100, (progress.saved / progress.total) * 100)}%` }}
      />
    </div>
  </div>
));

WizardSaveProgressBar.displayName = 'WizardSaveProgressBar';
