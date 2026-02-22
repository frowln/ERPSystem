import React from 'react';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';
import type { ProposalStatus } from '@/types';

const STEPS: { key: ProposalStatus; labelKey: string }[] = [
  { key: 'DRAFT', labelKey: 'commercialProposal.statusDraft' },
  { key: 'IN_REVIEW', labelKey: 'commercialProposal.statusInReview' },
  { key: 'APPROVED', labelKey: 'commercialProposal.statusApproved' },
  { key: 'ACTIVE', labelKey: 'commercialProposal.statusActive' },
];

const STATUS_ORDER: Record<ProposalStatus, number> = {
  DRAFT: 0,
  IN_REVIEW: 1,
  APPROVED: 2,
  ACTIVE: 3,
};

interface CpStatusPipelineProps {
  status: ProposalStatus;
  className?: string;
}

const CpStatusPipeline: React.FC<CpStatusPipelineProps> = ({ status, className }) => {
  const currentIndex = STATUS_ORDER[status] ?? 0;

  return (
    <div className={cn('flex items-center gap-1', className)}>
      {STEPS.map((step, i) => {
        const isPast = i < currentIndex;
        const isCurrent = i === currentIndex;
        return (
          <React.Fragment key={step.key}>
            {i > 0 && (
              <div
                className={cn(
                  'h-0.5 w-6 flex-shrink-0',
                  isPast || isCurrent ? 'bg-primary-500' : 'bg-neutral-200 dark:bg-neutral-700',
                )}
              />
            )}
            <div
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors whitespace-nowrap',
                isCurrent && 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 ring-1 ring-primary-300 dark:ring-primary-700',
                isPast && 'bg-success-50 dark:bg-success-900/20 text-success-700 dark:text-success-300',
                !isPast && !isCurrent && 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-500',
              )}
            >
              <span
                className={cn(
                  'w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold',
                  isCurrent && 'bg-primary-500 text-white',
                  isPast && 'bg-success-500 text-white',
                  !isPast && !isCurrent && 'bg-neutral-300 dark:bg-neutral-600 text-neutral-500 dark:text-neutral-400',
                )}
              >
                {isPast ? '\u2713' : i + 1}
              </span>
              {t(step.labelKey)}
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default CpStatusPipeline;
