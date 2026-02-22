import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, FileDown, Trophy, AlertTriangle } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { Skeleton } from '@/design-system/components/Skeleton';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';
import {
  bidScoringApi,
  type BidScore,
} from '@/api/bidScoring';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getScoreColor(score: number, maxScore: number): string {
  if (maxScore <= 0) return '';
  const pct = (score / maxScore) * 100;
  if (pct >= 75)
    return 'bg-success-50 dark:bg-success-900/20 text-success-700 dark:text-success-300';
  if (pct >= 50)
    return 'bg-warning-50 dark:bg-warning-900/20 text-warning-700 dark:text-warning-300';
  return 'bg-danger-50 dark:bg-danger-900/20 text-danger-700 dark:text-danger-300';
}

const RANK_BADGES = ['', '\u{1F947}', '\u{1F948}', '\u{1F949}'] as const; // 1st, 2nd, 3rd

function getRankBadge(rank: number): string {
  return RANK_BADGES[rank] ?? `#${rank}`;
}

// ---------------------------------------------------------------------------
// SVG Bar Chart (simple, no chart library)
// ---------------------------------------------------------------------------

interface BarChartProps {
  entries: { label: string; value: number; isWinner: boolean }[];
  maxValue: number;
}

const SimpleBarChart: React.FC<BarChartProps> = ({ entries, maxValue }) => {
  if (entries.length === 0 || maxValue <= 0) return null;
  const barHeight = 32;
  const gap = 8;
  const labelWidth = 140;
  const chartWidth = 400;
  const svgHeight = entries.length * (barHeight + gap) - gap + 16;

  return (
    <div className="overflow-x-auto">
      <svg
        width={labelWidth + chartWidth + 80}
        height={svgHeight}
        className="text-sm"
        role="img"
        aria-label={t('procurement.bidComparison.totalScore')}
      >
        {entries.map((entry, idx) => {
          const y = idx * (barHeight + gap);
          const barW = Math.max(4, (entry.value / maxValue) * chartWidth);
          return (
            <g key={entry.label}>
              {/* Vendor label */}
              <text
                x={labelWidth - 8}
                y={y + barHeight / 2 + 4}
                textAnchor="end"
                className="fill-neutral-700 dark:fill-neutral-300"
                fontSize={13}
              >
                {entry.label.length > 18
                  ? entry.label.slice(0, 16) + '...'
                  : entry.label}
              </text>
              {/* Bar */}
              <rect
                x={labelWidth}
                y={y}
                width={barW}
                height={barHeight}
                rx={6}
                className={cn(
                  entry.isWinner
                    ? 'fill-amber-400 dark:fill-amber-500'
                    : 'fill-primary-400 dark:fill-primary-600',
                )}
              />
              {/* Score value */}
              <text
                x={labelWidth + barW + 8}
                y={y + barHeight / 2 + 5}
                className="fill-neutral-600 dark:fill-neutral-400 font-medium"
                fontSize={13}
              >
                {entry.value.toFixed(1)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------

const ComparisonSkeleton: React.FC = () => (
  <div className="animate-fade-in p-6 space-y-6">
    <div className="space-y-3 mb-6">
      <Skeleton className="h-7 w-72" />
      <Skeleton className="h-4 w-48" />
    </div>
    <div className="flex gap-4 overflow-x-auto pb-2">
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-28 w-56 flex-shrink-0 rounded-xl" />
      ))}
    </div>
    <Skeleton className="h-72 w-full rounded-xl" />
  </div>
);

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

const EmptyState: React.FC = () => (
  <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
    <div className="w-14 h-14 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
      <AlertTriangle size={28} className="text-neutral-400" />
    </div>
    <p className="text-base font-medium text-neutral-700 dark:text-neutral-300">
      {t('procurement.bidComparison.noData')}
    </p>
  </div>
);

// ---------------------------------------------------------------------------
// Main page component
// ---------------------------------------------------------------------------

const BidComparisonPage: React.FC = () => {
  const { comparisonId } = useParams<{ comparisonId: string }>();
  const navigate = useNavigate();

  // --- Data fetching ---

  const {
    data: comparison,
    isLoading: comparisonLoading,
    isError: comparisonError,
  } = useQuery({
    queryKey: ['bid-comparison', comparisonId],
    queryFn: () => bidScoringApi.getComparison(comparisonId!),
    enabled: !!comparisonId,
  });

  const { data: criteria = [], isLoading: criteriaLoading } = useQuery({
    queryKey: ['bid-comparison-criteria', comparisonId],
    queryFn: () => bidScoringApi.getCriteria(comparisonId!),
    enabled: !!comparisonId,
  });

  const { data: scores = [], isLoading: scoresLoading } = useQuery({
    queryKey: ['bid-comparison-scores', comparisonId],
    queryFn: () => bidScoringApi.getScores(comparisonId!),
    enabled: !!comparisonId,
  });

  const { data: ranking = [], isLoading: rankingLoading } = useQuery({
    queryKey: ['bid-comparison-ranking', comparisonId],
    queryFn: () => bidScoringApi.getRanking(comparisonId!),
    enabled: !!comparisonId,
  });

  const isLoading =
    comparisonLoading || criteriaLoading || scoresLoading || rankingLoading;

  // --- Derived data ---

  const sortedCriteria = useMemo(
    () =>
      [...criteria].sort(
        (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0),
      ),
    [criteria],
  );

  const sortedRanking = useMemo(
    () =>
      [...ranking].sort(
        (a, b) => b.totalWeightedScore - a.totalWeightedScore,
      ),
    [ranking],
  );

  // Map: vendorId -> rank (1-based)
  const vendorRankMap = useMemo(() => {
    const map = new Map<string, number>();
    sortedRanking.forEach((v, idx) => map.set(v.vendorId, idx + 1));
    return map;
  }, [sortedRanking]);

  // Map: `${criteriaId}:${vendorId}` -> BidScore
  const scoreMap = useMemo(() => {
    const map = new Map<string, BidScore>();
    scores.forEach((s) => map.set(`${s.criteriaId}:${s.vendorId}`, s));
    return map;
  }, [scores]);

  // Unique vendors (ordered by ranking)
  const vendors = useMemo(() => {
    if (sortedRanking.length > 0) {
      return sortedRanking.map((r) => ({
        id: r.vendorId,
        name: r.vendorName,
        total: r.totalWeightedScore,
      }));
    }
    // Fallback: derive from scores
    const seen = new Map<string, string>();
    scores.forEach((s) => {
      if (!seen.has(s.vendorId)) {
        seen.set(s.vendorId, s.vendorName ?? s.vendorId);
      }
    });
    return Array.from(seen.entries()).map(([id, name]) => ({
      id,
      name,
      total: 0,
    }));
  }, [sortedRanking, scores]);

  const winnerId = sortedRanking.length > 0 ? sortedRanking[0].vendorId : null;
  const maxTotal =
    sortedRanking.length > 0
      ? Math.max(...sortedRanking.map((r) => r.totalWeightedScore), 1)
      : 1;

  // --- Handlers ---

  const handleExportPdf = () => {
    // Trigger browser print as a basic PDF export
    window.print();
  };

  // --- Render ---

  if (isLoading) {
    return <ComparisonSkeleton />;
  }

  if (comparisonError || !comparison) {
    return (
      <div className="animate-fade-in p-6">
        <PageHeader
          title={t('procurement.bidComparison.title')}
          breadcrumbs={[
            { label: t('forms.common.home'), href: '/' },
            {
              label: t('procurement.bidComparison.breadcrumbTenders'),
              href: '/tenders',
            },
            { label: t('procurement.bidComparison.title') },
          ]}
          backTo="/tenders"
        />
        <EmptyState />
      </div>
    );
  }

  const hasData = vendors.length > 0 && sortedCriteria.length > 0;

  return (
    <div className="animate-fade-in print:animate-none">
      <PageHeader
        title={`${t('procurement.bidComparison.title')} \u2014 ${comparison.title}`}
        breadcrumbs={[
          { label: t('forms.common.home'), href: '/' },
          {
            label: t('procurement.bidComparison.breadcrumbTenders'),
            href: '/tenders',
          },
          { label: comparison.title },
        ]}
        actions={
          <div className="flex items-center gap-2 print:hidden">
            <Button
              variant="secondary"
              size="sm"
              iconLeft={<FileDown size={14} />}
              onClick={handleExportPdf}
            >
              {t('procurement.bidComparison.exportPdf')}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              iconLeft={<ArrowLeft size={14} />}
              onClick={() => navigate('/tenders')}
            >
              {t('procurement.bidComparison.back')}
            </Button>
          </div>
        }
      />

      {!hasData ? (
        <div className="p-6">
          <EmptyState />
        </div>
      ) : (
        <div className="p-6 space-y-8">
          {/* ---- Vendor summary cards ---- */}
          <div className="flex gap-4 overflow-x-auto pb-2 print:flex-wrap print:overflow-visible">
            {vendors.map((vendor) => {
              const rank = vendorRankMap.get(vendor.id) ?? 0;
              const isWinner = vendor.id === winnerId;
              return (
                <div
                  key={vendor.id}
                  className={cn(
                    'flex-shrink-0 w-56 rounded-xl border p-4 space-y-2 transition-shadow',
                    'bg-white dark:bg-neutral-800',
                    isWinner
                      ? 'border-amber-400 dark:border-amber-500 shadow-lg ring-2 ring-amber-200 dark:ring-amber-700'
                      : 'border-neutral-200 dark:border-neutral-700 shadow-sm',
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-neutral-800 dark:text-neutral-100 truncate">
                      {vendor.name}
                    </span>
                    <span className="text-lg" title={`${t('procurement.bidComparison.rank')} ${rank}`}>
                      {getRankBadge(rank)}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">
                      {vendor.total.toFixed(1)}
                    </span>
                    <span className="text-xs text-neutral-400">
                      {t('procurement.bidComparison.totalScore').toLowerCase()}
                    </span>
                  </div>
                  {isWinner && (
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                      <Trophy size={12} className="text-amber-600 dark:text-amber-400 shrink-0" />
                      <span className="text-xs font-medium text-amber-700 dark:text-amber-300">
                        {t('procurement.bidComparison.winner')}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* ---- Comparison matrix table ---- */}
          <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="border-b border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/80">
                    <th className="text-left px-4 py-3 font-semibold text-neutral-600 dark:text-neutral-300 sticky left-0 bg-neutral-50 dark:bg-neutral-800/80 z-10 min-w-[200px]">
                      {t('procurement.bidComparison.criterion')}{' '}
                      <span className="font-normal text-neutral-400">
                        ({t('procurement.bidComparison.weight')})
                      </span>
                    </th>
                    {vendors.map((vendor) => {
                      const isWinner = vendor.id === winnerId;
                      return (
                        <th
                          key={vendor.id}
                          className={cn(
                            'text-center px-4 py-3 font-semibold min-w-[120px]',
                            isWinner
                              ? 'text-amber-700 dark:text-amber-300 bg-amber-50/50 dark:bg-amber-900/10'
                              : 'text-neutral-700 dark:text-neutral-200',
                          )}
                        >
                          <div className="flex flex-col items-center gap-0.5">
                            <span className="truncate max-w-[140px]">
                              {vendor.name}
                            </span>
                            {isWinner && (
                              <span className="text-xs font-normal text-amber-500">
                                {getRankBadge(1)}
                              </span>
                            )}
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {sortedCriteria.map((criterion, rowIdx) => (
                    <tr
                      key={criterion.id}
                      className={cn(
                        'border-b border-neutral-100 dark:border-neutral-700/50',
                        rowIdx % 2 === 0
                          ? 'bg-white dark:bg-neutral-900'
                          : 'bg-neutral-50/50 dark:bg-neutral-800/40',
                      )}
                    >
                      {/* Criterion name + weight */}
                      <td className="px-4 py-3 font-medium text-neutral-700 dark:text-neutral-200 sticky left-0 bg-inherit z-10">
                        <div>
                          <span>{criterion.name}</span>
                          <span className="ml-2 text-xs text-neutral-400 font-normal">
                            {criterion.weight}%
                          </span>
                        </div>
                        {criterion.criteriaTypeDisplayName && (
                          <span className="text-xs text-neutral-400">
                            {criterion.criteriaTypeDisplayName}
                          </span>
                        )}
                      </td>
                      {/* Vendor scores */}
                      {vendors.map((vendor) => {
                        const key = `${criterion.id}:${vendor.id}`;
                        const score = scoreMap.get(key);
                        const scoreVal = score?.score ?? 0;
                        const maxScore = criterion.maxScore || 10;
                        const isWinner = vendor.id === winnerId;

                        return (
                          <td
                            key={vendor.id}
                            className={cn(
                              'px-4 py-3 text-center',
                              isWinner && 'bg-amber-50/30 dark:bg-amber-900/5',
                            )}
                          >
                            {score ? (
                              <span
                                className={cn(
                                  'inline-flex items-center justify-center px-2.5 py-1 rounded-md font-medium text-sm min-w-[60px]',
                                  getScoreColor(scoreVal, maxScore),
                                )}
                                title={score.comments || undefined}
                              >
                                {scoreVal}
                                <span className="text-xs font-normal opacity-60 ml-0.5">
                                  /{maxScore}
                                </span>
                              </span>
                            ) : (
                              <span className="text-neutral-300 dark:text-neutral-600">
                                &mdash;
                              </span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}

                  {/* ---- Total row ---- */}
                  <tr className="border-t-2 border-neutral-300 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-800/80 font-semibold">
                    <td className="px-4 py-3 text-neutral-800 dark:text-neutral-100 sticky left-0 bg-neutral-50 dark:bg-neutral-800/80 z-10">
                      {t('procurement.bidComparison.totalScore')}
                    </td>
                    {vendors.map((vendor) => {
                      const isWinner = vendor.id === winnerId;
                      return (
                        <td
                          key={vendor.id}
                          className={cn(
                            'px-4 py-3 text-center text-base',
                            isWinner
                              ? 'text-amber-700 dark:text-amber-300 bg-amber-50/50 dark:bg-amber-900/10'
                              : 'text-neutral-800 dark:text-neutral-100',
                          )}
                        >
                          {vendor.total.toFixed(1)}
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* ---- Bar chart visualization ---- */}
          {vendors.length >= 2 && (
            <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 print:break-inside-avoid">
              <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-200 mb-4">
                {t('procurement.bidComparison.totalScore')} &mdash;{' '}
                {vendors.length} {t('procurement.bidComparison.vendors')}
              </h3>
              <SimpleBarChart
                entries={vendors.map((v) => ({
                  label: v.name,
                  value: v.total,
                  isWinner: v.id === winnerId,
                }))}
                maxValue={maxTotal}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BidComparisonPage;
