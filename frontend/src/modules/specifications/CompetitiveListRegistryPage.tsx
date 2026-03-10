import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { financeApi } from '@/api/finance';
import { PageHeader } from '@/design-system/components/PageHeader';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { Input } from '@/design-system/components/FormField';
import { formatMoney, formatDate } from '@/lib/format';
import { t } from '@/i18n';
import { cn } from '@/lib/cn';
import type { CompetitiveList, CompetitiveListStatus } from '@/types';

const statusColorMap: Record<CompetitiveListStatus, 'gray' | 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'orange' | 'cyan'> = {
  DRAFT: 'gray',
  COLLECTING: 'blue',
  EVALUATING: 'yellow',
  DECIDED: 'green',
  APPROVED: 'green',
};

const getStatusLabels = (): Record<CompetitiveListStatus, string> => ({
  DRAFT: t('competitiveList.statuses.DRAFT'),
  COLLECTING: t('competitiveList.statuses.COLLECTING'),
  EVALUATING: t('competitiveList.statuses.EVALUATING'),
  DECIDED: t('competitiveList.statuses.DECIDED'),
  APPROVED: t('competitiveList.statuses.APPROVED'),
});

type TabId = 'ALL' | CompetitiveListStatus;

// Column filter component
function ColumnFilter({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="relative mt-1">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? '...'}
        className={cn(
          'w-full rounded border border-neutral-200 dark:border-neutral-600',
          'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100',
          'px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary-500',
          'placeholder:text-neutral-400 dark:placeholder:text-neutral-500',
        )}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute right-1 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
        >
          <X size={12} />
        </button>
      )}
    </div>
  );
}

export default function CompetitiveListRegistryPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<TabId>('ALL');
  const [showFilters, setShowFilters] = useState(false);

  // Column filters
  const [filterName, setFilterName] = useState('');
  const [filterProject, setFilterProject] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterVendor, setFilterVendor] = useState('');

  const { data: lists = [], isLoading } = useQuery({
    queryKey: ['COMPETITIVE_LISTS_ALL'],
    queryFn: () => financeApi.getAllCompetitiveLists(),
  });

  const filtered = useMemo(() => {
    let result = lists;
    if (activeTab !== 'ALL') {
      result = result.filter((cl) => cl.status === activeTab);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (cl) =>
          (cl.name ?? '').toLowerCase().includes(q) ||
          (cl.title ?? '').toLowerCase().includes(q) ||
          (cl.bestVendorName ?? '').toLowerCase().includes(q) ||
          (cl.projectName ?? '').toLowerCase().includes(q),
      );
    }
    // Column filters
    if (filterName.trim()) {
      const q = filterName.toLowerCase();
      result = result.filter((cl) => (cl.name ?? cl.title ?? '').toLowerCase().includes(q));
    }
    if (filterProject.trim()) {
      const q = filterProject.toLowerCase();
      result = result.filter((cl) => (cl.projectName ?? '').toLowerCase().includes(q));
    }
    if (filterStatus.trim()) {
      const q = filterStatus.toLowerCase();
      const statusLabels = getStatusLabels();
      result = result.filter((cl) => (statusLabels[cl.status] ?? '').toLowerCase().includes(q));
    }
    if (filterVendor.trim()) {
      const q = filterVendor.toLowerCase();
      result = result.filter((cl) => (cl.bestVendorName ?? '').toLowerCase().includes(q));
    }
    return result;
  }, [lists, activeTab, search, filterName, filterProject, filterStatus, filterVendor]);

  const tabCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: lists.length };
    for (const cl of lists) {
      counts[cl.status] = (counts[cl.status] ?? 0) + 1;
    }
    return counts;
  }, [lists]);

  const handleRowClick = (cl: CompetitiveList) => {
    if (cl.specificationId) {
      navigate(`/specifications/${cl.specificationId}/competitive-list/${cl.id}`);
    } else {
      navigate(`/competitive-lists/${cl.id}`);
    }
  };

  const statusLabels = getStatusLabels();
  const hasAnyFilter = filterName || filterProject || filterStatus || filterVendor;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('competitiveList.registryTitle')}
        subtitle={t('competitiveList.registrySubtitle')}
        breadcrumbs={[
          { label: t('specifications.breadcrumbHome'), href: '/' },
          { label: t('specifications.breadcrumbSpecifications'), href: '/specifications' },
          { label: t('competitiveList.registryTitle') },
        ]}
        tabs={[
          { id: 'ALL', label: t('competitiveList.registryTabAll'), count: tabCounts['ALL'] ?? 0 },
          { id: 'DRAFT', label: t('competitiveList.statuses.DRAFT'), count: tabCounts['DRAFT'] ?? 0 },
          { id: 'COLLECTING', label: t('competitiveList.statuses.COLLECTING'), count: tabCounts['COLLECTING'] ?? 0 },
          { id: 'EVALUATING', label: t('competitiveList.statuses.EVALUATING'), count: tabCounts['EVALUATING'] ?? 0 },
          { id: 'DECIDED', label: t('competitiveList.statuses.DECIDED'), count: tabCounts['DECIDED'] ?? 0 },
          { id: 'APPROVED', label: t('competitiveList.statuses.APPROVED'), count: tabCounts['APPROVED'] ?? 0 },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as TabId)}
      />

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input
            placeholder={t('competitiveList.registrySearch')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            'flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg border transition-colors',
            showFilters || hasAnyFilter
              ? 'bg-primary-50 border-primary-300 text-primary-700 dark:bg-primary-900/30 dark:border-primary-600 dark:text-primary-300'
              : 'bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50 dark:bg-neutral-800 dark:border-neutral-600 dark:text-neutral-400',
          )}
        >
          <Filter size={14} />
          <span>{t('common.filter')}</span>
          {hasAnyFilter && (
            <span className="ml-1 h-4 w-4 flex items-center justify-center rounded-full bg-primary-600 text-[10px] text-white font-medium">
              {[filterName, filterProject, filterStatus, filterVendor].filter(Boolean).length}
            </span>
          )}
        </button>
        {hasAnyFilter && (
          <button
            type="button"
            onClick={() => {
              setFilterName('');
              setFilterProject('');
              setFilterStatus('');
              setFilterVendor('');
            }}
            className="text-xs text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
          >
            {t('common.reset')}
          </button>
        )}
      </div>

      {isLoading ? (
        <p className="text-neutral-500 text-center py-8">{t('competitiveList.registryLoading')}</p>
      ) : filtered.length === 0 ? (
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-12 text-center">
          <Filter size={48} className="mx-auto text-neutral-300 dark:text-neutral-600 mb-4" />
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">{t('competitiveList.registryEmpty')}</h3>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6 max-w-md mx-auto">
            {t('competitiveList.registryEmptyHint')}
          </p>
          <button
            onClick={() => navigate('/specifications')}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            {t('competitiveList.goToSpecifications')}
          </button>
        </div>
      ) : (
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50">
                <th className="text-left px-4 py-3 font-medium text-neutral-600 dark:text-neutral-400">
                  {t('competitiveList.registryColName')}
                  {showFilters && <ColumnFilter value={filterName} onChange={setFilterName} />}
                </th>
                <th className="text-left px-4 py-3 font-medium text-neutral-600 dark:text-neutral-400">
                  {t('competitiveList.registryColProject')}
                  {showFilters && <ColumnFilter value={filterProject} onChange={setFilterProject} />}
                </th>
                <th className="text-left px-4 py-3 font-medium text-neutral-600 dark:text-neutral-400">
                  {t('competitiveList.colStatus')}
                  {showFilters && <ColumnFilter value={filterStatus} onChange={setFilterStatus} />}
                </th>
                <th className="text-right px-4 py-3 font-medium text-neutral-600 dark:text-neutral-400">
                  {t('competitiveList.registryColPositions')}
                </th>
                <th className="text-right px-4 py-3 font-medium text-neutral-600 dark:text-neutral-400">
                  {t('competitiveList.registryColProposals')}
                </th>
                <th className="text-right px-4 py-3 font-medium text-neutral-600 dark:text-neutral-400">
                  {t('competitiveList.registryColVendors')}
                </th>
                <th className="text-right px-4 py-3 font-medium text-neutral-600 dark:text-neutral-400">
                  {t('competitiveList.registryColBestPrice')}
                </th>
                <th className="text-left px-4 py-3 font-medium text-neutral-600 dark:text-neutral-400">
                  {t('competitiveList.registryColBestVendor')}
                  {showFilters && <ColumnFilter value={filterVendor} onChange={setFilterVendor} />}
                </th>
                <th className="text-left px-4 py-3 font-medium text-neutral-600 dark:text-neutral-400">
                  {t('competitiveList.registryColDate')}
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((cl) => (
                <tr
                  key={cl.id}
                  onClick={() => handleRowClick(cl)}
                  className="border-b border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3 font-medium text-neutral-900 dark:text-neutral-100">
                    {cl.name || cl.title || cl.id.slice(0, 8)}
                  </td>
                  <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400 text-xs">
                    {cl.projectName || '—'}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge
                      status={cl.status}
                      colorMap={statusColorMap}
                      label={statusLabels[cl.status]}
                    />
                  </td>
                  <td className="px-4 py-3 text-right text-neutral-600 dark:text-neutral-400 tabular-nums">
                    {cl.positionCount ?? 0}
                  </td>
                  <td className="px-4 py-3 text-right text-neutral-600 dark:text-neutral-400 tabular-nums">
                    {cl.entryCount ?? 0}
                  </td>
                  <td className="px-4 py-3 text-right text-neutral-600 dark:text-neutral-400 tabular-nums">
                    {cl.vendorCount ?? 0}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-neutral-900 dark:text-neutral-100 tabular-nums">
                    {cl.bestPrice ? formatMoney(cl.bestPrice) : '—'}
                  </td>
                  <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">
                    {cl.bestVendorName || '—'}
                  </td>
                  <td className="px-4 py-3 text-neutral-500 text-xs tabular-nums">
                    {cl.createdAt ? formatDate(cl.createdAt) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
