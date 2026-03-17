import React from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/design-system/components/FormField';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';
import type { CoverageFilter } from '../lib/matrixBuilder';

interface ClToolbarProps {
  search: string;
  onSearchChange: (v: string) => void;
  sectionFilter: string;
  onSectionFilterChange: (v: string) => void;
  coverageFilter: CoverageFilter;
  onCoverageFilterChange: (v: CoverageFilter) => void;
  sections: string[];
  view: 'matrix' | 'summary';
  onViewChange: (v: 'matrix' | 'summary') => void;
}

export const ClToolbar: React.FC<ClToolbarProps> = ({
  search,
  onSearchChange,
  sectionFilter,
  onSectionFilterChange,
  coverageFilter,
  onCoverageFilterChange,
  sections,
  view,
  onViewChange,
}) => (
  <div className="flex items-center gap-3 flex-wrap">
    <div className="relative flex-1 min-w-[200px] max-w-sm">
      <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
      <Input
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder={t('common.search')}
        className="pl-8 h-8 text-sm"
      />
    </div>

    <select
      value={sectionFilter}
      onChange={(e) => onSectionFilterChange(e.target.value)}
      className="h-8 text-sm rounded-md border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 px-2"
    >
      <option value="">{t('competitiveList.matrix.allSections')}</option>
      {sections.map((s) => (
        <option key={s} value={s}>{s || t('competitiveList.matrix.noSection')}</option>
      ))}
    </select>

    <select
      value={coverageFilter}
      onChange={(e) => onCoverageFilterChange(e.target.value as CoverageFilter)}
      className="h-8 text-sm rounded-md border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 px-2"
    >
      <option value="all">{t('competitiveList.matrix.filterAll')}</option>
      <option value="covered">{t('competitiveList.matrix.filterCovered')}</option>
      <option value="uncovered">{t('competitiveList.matrix.filterUncovered')}</option>
      <option value="winner">{t('competitiveList.matrix.filterWinner')}</option>
      <option value="no-winner">{t('competitiveList.matrix.filterNoWinner')}</option>
    </select>

    <div className="flex rounded-md border border-neutral-300 dark:border-neutral-600 overflow-hidden ml-auto">
      <button
        onClick={() => onViewChange('matrix')}
        className={cn(
          'px-3 py-1 text-sm font-medium',
          view === 'matrix'
            ? 'bg-blue-600 text-white'
            : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700',
        )}
      >
        {t('competitiveList.matrix.viewMatrix')}
      </button>
      <button
        onClick={() => onViewChange('summary')}
        className={cn(
          'px-3 py-1 text-sm font-medium border-l border-neutral-300 dark:border-neutral-600',
          view === 'summary'
            ? 'bg-blue-600 text-white'
            : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700',
        )}
      >
        {t('competitiveList.matrix.viewSummary')}
      </button>
    </div>
  </div>
);
