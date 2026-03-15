import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { t } from '@/i18n';

interface ClMinProposalsWarningProps {
  insufficientCount: number;
  totalCount: number;
}

export const ClMinProposalsWarning: React.FC<ClMinProposalsWarningProps> = ({
  insufficientCount,
  totalCount,
}) => (
  <div className="mb-4 flex items-start gap-3 rounded-lg border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 px-4 py-3">
    <AlertTriangle size={18} className="text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
    <div className="min-w-0">
      <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
        {t('specifications.clMinProposalsWarning')}
      </p>
      <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
        {t('specifications.clProposalsRequired')}: {insufficientCount}/{totalCount} {t('competitiveList.detail.position').toLowerCase()}
      </p>
    </div>
  </div>
);
