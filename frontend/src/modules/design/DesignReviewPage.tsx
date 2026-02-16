import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { Search, ClipboardCheck, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { DataTable } from '@/design-system/components/DataTable';
import { MetricCard } from '@/design-system/components/MetricCard';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { Input, Select } from '@/design-system/components/FormField';
import { designApi } from '@/api/design';
import { formatDate } from '@/lib/format';
import { t } from '@/i18n';
import type { DesignReview } from './types';
import type { PaginatedResponse } from '@/types';

const reviewStatusColorMap: Record<string, 'gray' | 'yellow' | 'green' | 'red' | 'orange'> = {
  pending: 'gray',
  in_progress: 'yellow',
  approved: 'green',
  rejected: 'red',
  revision_requested: 'orange',
};

const getReviewStatusLabels = (): Record<string, string> => ({
  pending: t('design.statusPending'),
  in_progress: t('design.statusInProgress'),
  approved: t('design.statusApproved'),
  rejected: t('design.statusRejected'),
  revision_requested: t('design.statusRevisionRequested'),
});

const getStatusFilterOptions = () => [
  { value: '', label: t('design.filterAllStatuses') },
  { value: 'PENDING', label: t('design.statusPending') },
  { value: 'IN_PROGRESS', label: t('design.statusInProgress') },
  { value: 'APPROVED', label: t('design.statusApproved') },
  { value: 'REJECTED', label: t('design.statusRejected') },
  { value: 'REVISION_REQUESTED', label: t('design.statusRevisionRequested') },
];

type TabId = 'all' | 'PENDING' | 'IN_PROGRESS' | 'APPROVED' | 'REJECTED';

const DesignReviewPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { data: reviewsData, isLoading } = useQuery<PaginatedResponse<DesignReview>>({
    queryKey: ['design-reviews'],
    queryFn: () => designApi.getReviews(),
  });

  const reviews = reviewsData?.content ?? [];

  const filteredReviews = useMemo(() => {
    let filtered = reviews;

    if (activeTab !== 'all') {
      filtered = filtered.filter((r) => r.status === activeTab);
    }

    if (statusFilter) {
      filtered = filtered.filter((r) => r.status === statusFilter);
    }

    if (search) {
      const lower = search.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.number.toLowerCase().includes(lower) ||
          r.versionTitle.toLowerCase().includes(lower) ||
          r.reviewerName.toLowerCase().includes(lower),
      );
    }

    return filtered;
  }, [reviews, activeTab, statusFilter, search]);

  const tabCounts = useMemo(() => ({
    all: reviews.length,
    pending: reviews.filter((r) => r.status === 'PENDING').length,
    in_progress: reviews.filter((r) => r.status === 'IN_PROGRESS').length,
    approved: reviews.filter((r) => r.status === 'APPROVED').length,
    rejected: reviews.filter((r) => r.status === 'REJECTED' || r.status === 'REVISION_REQUESTED').length,
  }), [reviews]);

  const metrics = useMemo(() => {
    const pending = reviews.filter((r) => r.status === 'PENDING' || r.status === 'IN_PROGRESS').length;
    const approved = reviews.filter((r) => r.status === 'APPROVED').length;
    const rejected = reviews.filter((r) => r.status === 'REJECTED').length;
    const totalMarkups = reviews.reduce((s, r) => s + r.markupCount, 0);
    return { total: reviews.length, pending, approved, rejected, totalMarkups };
  }, [reviews]);

  const columns = useMemo<ColumnDef<DesignReview, unknown>[]>(
    () => [
      {
        accessorKey: 'number',
        header: t('design.colNumber'),
        size: 90,
        cell: ({ getValue }) => (
          <span className="font-mono text-neutral-500 dark:text-neutral-400 text-xs">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'versionTitle',
        header: t('design.colDocument'),
        size: 280,
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-neutral-900 dark:text-neutral-100 truncate max-w-[260px]">{row.original.versionTitle}</p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              {t('design.versionLabel', { version: row.original.versionNumber })} | {row.original.projectName}
            </p>
          </div>
        ),
      },
      {
        accessorKey: 'status',
        header: t('design.colStatus'),
        size: 130,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={reviewStatusColorMap}
            label={getReviewStatusLabels()[getValue<string>()] ?? getValue<string>()}
          />
        ),
      },
      {
        accessorKey: 'reviewerName',
        header: t('design.colReviewer'),
        size: 160,
        cell: ({ getValue }) => (
          <span className="text-neutral-700 dark:text-neutral-300">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'markupCount',
        header: t('design.colMarkups'),
        size: 110,
        cell: ({ getValue }) => {
          const count = getValue<number>();
          return count > 0 ? (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-danger-600">
              <AlertTriangle size={12} />
              {count}
            </span>
          ) : (
            <span className="text-xs text-neutral-400">0</span>
          );
        },
      },
      {
        accessorKey: 'dueDate',
        header: t('design.colDueDate'),
        size: 120,
        cell: ({ row }) => {
          const dueDate = row.original.dueDate;
          const completedAt = row.original.completedAt;
          const displayDate = completedAt ?? dueDate;
          const isOverdue = dueDate && !completedAt && new Date(dueDate) < new Date();
          return (
            <span className={isOverdue ? 'text-danger-600 font-medium tabular-nums' : 'tabular-nums text-neutral-700 dark:text-neutral-300'}>
              {formatDate(displayDate)}
            </span>
          );
        },
      },
      {
        id: 'actions',
        header: '',
        size: 80,
        cell: ({ row }) => (
          <button
            className="text-xs text-primary-600 hover:text-primary-700 font-medium"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/design/reviews/${row.original.id}`);
            }}
          >
            {t('design.openAction')}
          </button>
        ),
      },
    ],
    [navigate],
  );

  const handleRowClick = useCallback(
    (review: DesignReview) => navigate(`/design/reviews/${review.id}`),
    [navigate],
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('design.reviewsTitle')}
        subtitle={t('design.reviewsSubtitle', { count: String(reviews.length) })}
        breadcrumbs={[
          { label: t('design.breadcrumbHome'), href: '/' },
          { label: t('design.breadcrumbDesign') },
          { label: t('design.breadcrumbReviews') },
        ]}
        tabs={[
          { id: 'all', label: t('design.tabAll'), count: tabCounts.all },
          { id: 'PENDING', label: t('design.tabPending'), count: tabCounts.pending },
          { id: 'IN_PROGRESS', label: t('design.tabInProgress'), count: tabCounts.in_progress },
          { id: 'APPROVED', label: t('design.tabApproved'), count: tabCounts.approved },
          { id: 'REJECTED', label: t('design.tabRejected'), count: tabCounts.rejected },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as TabId)}
      />

      {/* Metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard
          icon={<ClipboardCheck size={18} />}
          label={t('design.metricTotalReviews')}
          value={metrics.total}
        />
        <MetricCard
          icon={<Clock size={18} />}
          label={t('design.metricInProgress')}
          value={metrics.pending}
        />
        <MetricCard
          icon={<CheckCircle size={18} />}
          label={t('design.metricApproved')}
          value={metrics.approved}
        />
        <MetricCard
          icon={<AlertTriangle size={18} />}
          label={t('design.metricTotalMarkups')}
          value={metrics.totalMarkups}
        />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input
            placeholder={t('design.searchReviewPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          options={getStatusFilterOptions()}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-44"
        />
      </div>

      {/* Table */}
      <DataTable<DesignReview>
        data={filteredReviews}
        columns={columns}
        loading={isLoading}
        onRowClick={handleRowClick}
        enableRowSelection
        enableColumnVisibility
        enableDensityToggle
        enableExport
        pageSize={20}
        emptyTitle={t('design.emptyReviewsTitle')}
        emptyDescription={t('design.emptyReviewsDescription')}
      />
    </div>
  );
};

export default DesignReviewPage;
