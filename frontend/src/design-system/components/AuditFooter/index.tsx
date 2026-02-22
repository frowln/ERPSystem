import React from 'react';
import { formatDateTime } from '@/lib/format';
import { t } from '@/i18n';
import { cn } from '@/lib/cn';

export interface AuditFooterProps {
  /** Any entity object — audit fields are extracted via optional chaining */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: Record<string, any> | null;
  className?: string;
}

export const AuditFooter: React.FC<AuditFooterProps> = ({ data, className }) => {
  if (!data) return null;

  const createdAt = data.createdAt as string | undefined;
  const createdBy = data.createdBy as string | undefined;
  const updatedAt = data.updatedAt as string | undefined;
  const updatedBy = data.updatedBy as string | undefined;

  if (!createdAt && !updatedAt) return null;

  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-neutral-400 dark:text-neutral-500 mt-6 pt-4 border-t border-neutral-100 dark:border-neutral-800',
        className,
      )}
    >
      {createdAt && (
        <span>
          {t('auditFooter.created')}
          {createdBy && <>{' '}{createdBy}</>}
          {', '}
          {formatDateTime(createdAt)}
        </span>
      )}
      {updatedAt && (
        <>
          <span className="hidden sm:inline text-neutral-300 dark:text-neutral-600" aria-hidden="true">|</span>
          <span>
            {t('auditFooter.modified')}
            {updatedBy && <>{' '}{updatedBy}</>}
            {', '}
            {formatDateTime(updatedAt)}
          </span>
        </>
      )}
    </div>
  );
};
