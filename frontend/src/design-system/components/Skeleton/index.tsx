import React from 'react';
import { cn } from '@/lib/cn';

/* ---------- Base Skeleton ---------- */

interface SkeletonProps {
  className?: string;
  /** Width — any CSS value or Tailwind class via className */
  width?: string | number;
  /** Height — any CSS value or Tailwind class via className */
  height?: string | number;
  /** Shape variant */
  variant?: 'rectangular' | 'circular' | 'text';
  /** Inline styles override */
  style?: React.CSSProperties;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className,
  width,
  height,
  variant = 'rectangular',
  style,
}) => (
  <div
    aria-hidden
    className={cn(
      'animate-pulse bg-neutral-200 dark:bg-neutral-700',
      variant === 'circular' && 'rounded-full',
      variant === 'rectangular' && 'rounded-lg',
      variant === 'text' && 'rounded h-4',
      className,
    )}
    style={{
      width: typeof width === 'number' ? `${width}px` : width,
      height: typeof height === 'number' ? `${height}px` : height,
      ...style,
    }}
  />
);

/* ---------- Standalone TableSkeleton ---------- */

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  hasActions?: boolean;
  className?: string;
}

export const TableSkeleton: React.FC<TableSkeletonProps> = ({
  rows = 8,
  columns = 5,
  hasActions = false,
  className,
}) => {
  const totalCols = hasActions ? columns + 1 : columns;
  return (
    <div className={cn('bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden', className)}>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100 dark:border-neutral-800">
        <Skeleton className="h-8 w-56" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-8" variant="rectangular" />
          <Skeleton className="h-8 w-8" variant="rectangular" />
        </div>
      </div>
      {/* Header row */}
      <div className="flex gap-4 px-4 py-3 border-b border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800">
        {Array.from({ length: totalCols }).map((_, i) => (
          <Skeleton key={i} className="h-3" style={{ width: `${100 / totalCols}%` }} />
        ))}
      </div>
      {/* Data rows */}
      {Array.from({ length: rows }).map((_, rIdx) => (
        <div key={rIdx} className="flex gap-4 px-4 py-3 border-b border-neutral-100 dark:border-neutral-800">
          {Array.from({ length: totalCols }).map((_, cIdx) => (
            <Skeleton
              key={cIdx}
              className="h-4"
              style={{ width: `${50 + ((rIdx * 13 + cIdx * 7) % 40)}%`, maxWidth: `${100 / totalCols}%` }}
            />
          ))}
        </div>
      ))}
      {/* Pagination */}
      <div className="flex items-center justify-between px-4 py-3">
        <Skeleton className="h-4 w-32" />
        <div className="flex gap-1">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-8" variant="rectangular" />
          ))}
        </div>
      </div>
    </div>
  );
};

/* ---------- Standalone MetricCardSkeleton ---------- */

interface MetricCardSkeletonProps {
  className?: string;
}

export const MetricCardSkeleton: React.FC<MetricCardSkeletonProps> = ({ className }) => (
  <div className={cn('bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-5', className)}>
    <div className="flex items-start justify-between mb-3">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-8 w-8" variant="circular" />
    </div>
    <Skeleton className="h-7 w-20 mb-2" />
    <Skeleton className="h-3 w-16" />
  </div>
);

/* ---------- Page Skeleton Variants ---------- */

type PageSkeletonVariant = 'list' | 'detail' | 'dashboard' | 'form';

interface PageSkeletonProps {
  variant?: PageSkeletonVariant;
  className?: string;
}

/** Header skeleton shared across variants */
const SkeletonHeader: React.FC = () => (
  <div className="space-y-3 mb-6">
    <Skeleton className="h-7 w-48" />
    <Skeleton className="h-4 w-72" />
  </div>
);

/** Metric cards row (for dashboard/detail) */
const SkeletonMetrics: React.FC<{ count?: number }> = ({ count = 4 }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
    {Array.from({ length: count }).map((_, i) => (
      <MetricCardSkeleton key={i} />
    ))}
  </div>
);

/** Table skeleton (for list pages) */
const SkeletonTable: React.FC<{ rows?: number; cols?: number }> = ({ rows = 8, cols = 5 }) => (
  <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
    {/* Toolbar */}
    <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100 dark:border-neutral-800">
      <Skeleton className="h-8 w-56" />
      <div className="flex gap-2">
        <Skeleton className="h-8 w-8" variant="rectangular" />
        <Skeleton className="h-8 w-8" variant="rectangular" />
      </div>
    </div>
    {/* Header row */}
    <div className="flex gap-4 px-4 py-3 border-b border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800">
      {Array.from({ length: cols }).map((_, i) => (
        <Skeleton key={i} className="h-3" style={{ width: `${100 / cols}%` }} />
      ))}
    </div>
    {/* Data rows */}
    {Array.from({ length: rows }).map((_, rIdx) => (
      <div key={rIdx} className="flex gap-4 px-4 py-3 border-b border-neutral-100 dark:border-neutral-800">
        {Array.from({ length: cols }).map((_, cIdx) => (
          <Skeleton
            key={cIdx}
            className="h-4"
            style={{ width: `${50 + ((rIdx * 13 + cIdx * 7) % 40)}%`, maxWidth: `${100 / cols}%` }}
          />
        ))}
      </div>
    ))}
  </div>
);

/** Form skeleton */
const SkeletonForm: React.FC = () => (
  <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 space-y-6 max-w-2xl">
    {Array.from({ length: 5 }).map((_, i) => (
      <div key={i} className="space-y-2">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-9 w-full" />
      </div>
    ))}
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-9 w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-9 w-full" />
      </div>
    </div>
    <div className="flex gap-3 pt-4">
      <Skeleton className="h-9 w-28" />
      <Skeleton className="h-9 w-20" />
    </div>
  </div>
);

/** Detail page skeleton */
const SkeletonDetail: React.FC = () => (
  <div className="space-y-6">
    <SkeletonMetrics count={4} />
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 space-y-4">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <div className="grid grid-cols-2 gap-4 pt-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-1">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-4 w-32" />
            </div>
          ))}
        </div>
      </div>
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 space-y-4">
        <Skeleton className="h-5 w-28" />
        <Skeleton className="h-8 w-36" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-2 w-full rounded-full" />
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="space-y-1">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
      </div>
    </div>
  </div>
);

/** Dashboard skeleton */
const SkeletonDashboard: React.FC = () => (
  <div className="space-y-6">
    <SkeletonMetrics count={4} />
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 space-y-4">
        <Skeleton className="h-5 w-36" />
        <Skeleton className="h-48 w-full" />
      </div>
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 space-y-4">
        <Skeleton className="h-5 w-36" />
        <Skeleton className="h-48 w-full" />
      </div>
    </div>
    <TableSkeleton rows={5} columns={4} />
  </div>
);

const variants: Record<PageSkeletonVariant, React.FC> = {
  list: () => (
    <>
      <SkeletonHeader />
      <SkeletonMetrics count={4} />
      <TableSkeleton />
    </>
  ),
  detail: () => (
    <>
      <SkeletonHeader />
      <SkeletonDetail />
    </>
  ),
  dashboard: () => (
    <>
      <SkeletonHeader />
      <SkeletonDashboard />
    </>
  ),
  form: () => (
    <>
      <SkeletonHeader />
      <SkeletonForm />
    </>
  ),
};

export const PageSkeleton: React.FC<PageSkeletonProps> = ({ variant = 'list', className }) => {
  const Variant = variants[variant];
  return (
    <div className={cn('animate-fade-in', className)}>
      <Variant />
    </div>
  );
};
