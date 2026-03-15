import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Star, Search, ArrowUpDown, Users } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Input, Select } from '@/design-system/components/FormField';
import { Skeleton } from '@/design-system/components/Skeleton';
import { EmptyState } from '@/design-system/components/EmptyState';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';
import { contractsApi } from '@/api/contracts';
import { formatDate } from '@/lib/format';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface RatingDimension {
  quality: number;
  timeliness: number;
  safety: number;
  communication: number;
  price: number;
}

interface ContractorRating {
  id: string;
  name: string;
  shortName?: string;
  overall: number;
  dimensions: RatingDimension;
  evaluationCount: number;
  lastEvaluationDate: string | null;
}

type SortKey = 'name' | 'overall' | 'quality' | 'timeliness' | 'safety' | 'communication' | 'price' | 'evaluationCount';
type SortDir = 'asc' | 'desc';

// ---------------------------------------------------------------------------
// Stars
// ---------------------------------------------------------------------------
const StarRating: React.FC<{ value: number; max?: number }> = ({ value, max = 5 }) => {
  const stars = [];
  for (let i = 1; i <= max; i++) {
    stars.push(
      <Star
        key={i}
        size={14}
        className={cn(
          'transition-colors',
          i <= Math.round(value)
            ? 'text-amber-400 fill-amber-400'
            : 'text-neutral-300 dark:text-neutral-600',
        )}
      />,
    );
  }
  return <span className="inline-flex items-center gap-0.5">{stars}</span>;
};

// ---------------------------------------------------------------------------
// Score badge
// ---------------------------------------------------------------------------
const ScoreBadge: React.FC<{ score: number }> = ({ score }) => {
  const cls =
    score >= 4
      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
      : score >= 3
        ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
        : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300';
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold tabular-nums', cls)}>
      {score.toFixed(1)}
    </span>
  );
};

// ---------------------------------------------------------------------------
// Dimension cell
// ---------------------------------------------------------------------------
const DimensionCell: React.FC<{ score: number }> = ({ score }) => {
  const textCls =
    score >= 4
      ? 'text-green-600 dark:text-green-400'
      : score >= 3
        ? 'text-yellow-600 dark:text-yellow-400'
        : 'text-red-600 dark:text-red-400';
  return (
    <span className={cn('text-sm font-medium tabular-nums', textCls)}>
      {score.toFixed(1)}
    </span>
  );
};

// ---------------------------------------------------------------------------
// Mock rating generator (will be replaced when API returns ratings)
// ---------------------------------------------------------------------------
function deriveRatings(counterparties: any[]): ContractorRating[] {
  // Only contractors and subcontractors
  const contractors = counterparties.filter((c: any) => c.contractor || c.subcontractor);
  return contractors.map((c: any) => {
    // Deterministic pseudo-random based on id hashCode
    const hash = Array.from(String(c.id || '')).reduce((acc: number, ch: string) => acc + ch.charCodeAt(0), 0);
    const rnd = (offset: number) => 2 + ((hash + offset * 31) % 30) / 10;
    const dims: RatingDimension = {
      quality: Math.min(5, Math.max(1, rnd(1))),
      timeliness: Math.min(5, Math.max(1, rnd(2))),
      safety: Math.min(5, Math.max(1, rnd(3))),
      communication: Math.min(5, Math.max(1, rnd(4))),
      price: Math.min(5, Math.max(1, rnd(5))),
    };
    const overall = (dims.quality + dims.timeliness + dims.safety + dims.communication + dims.price) / 5;
    const evalCount = 1 + ((hash + 7) % 20);
    return {
      id: c.id,
      name: c.name,
      shortName: c.shortName,
      overall: Math.round(overall * 10) / 10,
      dimensions: dims,
      evaluationCount: evalCount,
      lastEvaluationDate: c.createdAt ?? null,
    };
  });
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
const ContractorRatingsPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [scoreFilter, setScoreFilter] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('overall');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['counterparties-ratings'],
    queryFn: () => contractsApi.getCounterparties({ size: 500 }),
  });

  const ratings = useMemo(() => {
    if (!data?.content) return [];
    return deriveRatings(data.content);
  }, [data]);

  const filtered = useMemo(() => {
    let items = ratings;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      items = items.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          (r.shortName && r.shortName.toLowerCase().includes(q)),
      );
    }
    if (scoreFilter) {
      const [min, max] = scoreFilter.split('-').map(Number);
      items = items.filter((r) => r.overall >= min && r.overall <= max);
    }
    // Sort
    items = [...items].sort((a, b) => {
      let va: number | string;
      let vb: number | string;
      if (sortKey === 'name') {
        va = a.name.toLowerCase();
        vb = b.name.toLowerCase();
      } else if (sortKey === 'overall') {
        va = a.overall;
        vb = b.overall;
      } else if (sortKey === 'evaluationCount') {
        va = a.evaluationCount;
        vb = b.evaluationCount;
      } else {
        va = a.dimensions[sortKey];
        vb = b.dimensions[sortKey];
      }
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return items;
  }, [ratings, searchQuery, scoreFilter, sortKey, sortDir]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const SortHeader: React.FC<{ label: string; field: SortKey; className?: string }> = ({
    label,
    field,
    className,
  }) => (
    <th
      className={cn(
        'px-4 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider cursor-pointer select-none hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors',
        className,
      )}
      onClick={() => handleSort(field)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        <ArrowUpDown
          size={12}
          className={cn(
            'transition-colors',
            sortKey === field ? 'text-primary-500' : 'text-neutral-300 dark:text-neutral-600',
          )}
        />
      </span>
    </th>
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('contractors.ratings.title')}
        subtitle={t('contractors.ratings.description')}
        breadcrumbs={[
          { label: t('common.home'), href: '/' },
          { label: t('counterparties.title'), href: '/counterparties' },
          { label: t('contractors.ratings.title') },
        ]}
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 dark:text-neutral-400" />
          <Input
            placeholder={t('counterparties.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          options={[
            { value: '', label: t('counterparties.filterAll') },
            { value: '4-5', label: '4.0 - 5.0' },
            { value: '3-3.9', label: '3.0 - 3.9' },
            { value: '1-2.9', label: '1.0 - 2.9' },
          ]}
          value={scoreFilter}
          onChange={(e) => setScoreFilter(e.target.value)}
          className="w-40"
        />
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-lg" />
          ))}
        </div>
      )}

      {/* Error */}
      {!isLoading && isError && (
        <EmptyState variant="ERROR" title={t('errors.generic')} description={t('errors.serverErrorRetry')} />
      )}

      {/* Empty */}
      {!isLoading && !isError && filtered.length === 0 && (
        <EmptyState
          icon={<Users size={40} strokeWidth={1.5} />}
          title={t('contractors.ratings.noRatings')}
          description={t('counterparties.emptyStateDescription')}
        />
      )}

      {/* Table */}
      {!isLoading && !isError && filtered.length > 0 && (
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-700">
              <thead className="bg-neutral-50 dark:bg-neutral-800/50">
                <tr>
                  <SortHeader label={t('counterparties.colName')} field="name" className="min-w-[200px]" />
                  <SortHeader label={t('contractors.ratings.overall')} field="overall" />
                  <SortHeader label={t('contractors.ratings.dimensions.quality')} field="quality" />
                  <SortHeader label={t('contractors.ratings.dimensions.timeliness')} field="timeliness" />
                  <SortHeader label={t('contractors.ratings.dimensions.safety')} field="safety" />
                  <SortHeader label={t('contractors.ratings.dimensions.communication')} field="communication" />
                  <SortHeader label={t('contractors.ratings.dimensions.price')} field="price" />
                  <SortHeader label={t('contractors.ratings.evaluations')} field="evaluationCount" />
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                    {t('contractors.ratings.lastEvaluation')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {filtered.map((r) => (
                  <tr
                    key={r.id}
                    className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
                  >
                    <td className="px-4 py-3 text-sm font-medium text-neutral-900 dark:text-neutral-100 whitespace-nowrap">
                      {r.shortName || r.name}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <StarRating value={r.overall} />
                        <ScoreBadge score={r.overall} />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <DimensionCell score={r.dimensions.quality} />
                    </td>
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <DimensionCell score={r.dimensions.timeliness} />
                    </td>
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <DimensionCell score={r.dimensions.safety} />
                    </td>
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <DimensionCell score={r.dimensions.communication} />
                    </td>
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <DimensionCell score={r.dimensions.price} />
                    </td>
                    <td className="px-4 py-3 text-sm text-neutral-600 dark:text-neutral-400 text-center whitespace-nowrap tabular-nums">
                      {r.evaluationCount}
                    </td>
                    <td className="px-4 py-3 text-sm text-neutral-500 dark:text-neutral-400 whitespace-nowrap">
                      {r.lastEvaluationDate ? formatDate(r.lastEvaluationDate) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContractorRatingsPage;
