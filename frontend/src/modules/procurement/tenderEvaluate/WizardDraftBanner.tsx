import React from 'react';
import { t } from '@/i18n';
import { formatDateTime } from '@/lib/format';

interface WizardDraftBannerProps {
  restoredDraftAt: number | null;
  lastDraftSavedAt: number | null;
  onClearDraft: () => void;
  disabled: boolean;
}

export const WizardDraftBanner: React.FC<WizardDraftBannerProps> = React.memo(({
  restoredDraftAt,
  lastDraftSavedAt,
  onClearDraft,
  disabled,
}) => (
  <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 px-3 py-2">
    <div className="text-xs text-neutral-600 dark:text-neutral-300">
      {restoredDraftAt
        ? t('procurement.tenderEvaluate.draftRestored', { date: formatDateTime(new Date(restoredDraftAt).toISOString()) })
        : t('procurement.tenderEvaluate.draftAutoSave')}
    </div>
    <div className="flex items-center gap-3">
      {lastDraftSavedAt && (
        <span className="text-xs text-neutral-500 dark:text-neutral-400">
          {t('procurement.tenderEvaluate.draftSavedAt', { date: formatDateTime(new Date(lastDraftSavedAt).toISOString()) })}
        </span>
      )}
      <button
        type="button"
        className="text-xs text-primary-700 hover:text-primary-800 dark:text-primary-300 dark:hover:text-primary-200"
        onClick={onClearDraft}
        disabled={disabled}
      >
        {t('procurement.tenderEvaluate.clearDraft')}
      </button>
    </div>
  </div>
));

WizardDraftBanner.displayName = 'WizardDraftBanner';
