import React from 'react';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';

export type ContractDirectionFilter = 'ALL' | 'CLIENT' | 'CONTRACTOR';

interface ContractDirectionTabsProps {
  value: ContractDirectionFilter;
  onChange: (value: ContractDirectionFilter) => void;
  className?: string;
}

const tabs: { key: ContractDirectionFilter; labelKey: string }[] = [
  { key: 'ALL', labelKey: 'contracts.direction.all' },
  { key: 'CONTRACTOR', labelKey: 'contracts.direction.contractor' },
  { key: 'CLIENT', labelKey: 'contracts.direction.client' },
];

const ContractDirectionTabs: React.FC<ContractDirectionTabsProps> = ({ value, onChange, className }) => {
  return (
    <div className={cn('inline-flex rounded-lg border border-neutral-200 dark:border-neutral-700 p-0.5 bg-neutral-100 dark:bg-neutral-800', className)}>
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={cn(
            'px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap',
            value === tab.key
              ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-sm'
              : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300',
          )}
        >
          {t(tab.labelKey)}
        </button>
      ))}
    </div>
  );
};

export default ContractDirectionTabs;
