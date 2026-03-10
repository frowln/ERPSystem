import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { Plus, Search, Layers, CheckCircle, Clock, FileText } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { DataTable } from '@/design-system/components/DataTable';
import { MetricCard } from '@/design-system/components/MetricCard';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { Input, Select } from '@/design-system/components/FormField';
import { designApi } from '@/api/design';
import { formatDate } from '@/lib/format';
import type { DesignVersion } from './types';
import type { PaginatedResponse } from '@/types';
import { t } from '@/i18n';

const versionStatusColorMap: Record<string, 'gray' | 'yellow' | 'green' | 'purple' | 'red' | 'blue'> = {
  draft: 'gray',
  in_review: 'yellow',
  approved: 'green',
  superseded: 'purple',
  rejected: 'red',
  archived: 'blue',
};

const getVersionStatusLabels = (): Record<string, string> => ({
  draft: t('design.versionStatusDraft'),
  in_review: t('design.versionStatusInReview'),
  approved: t('design.versionStatusApproved'),
  superseded: t('design.versionStatusSuperseded'),
  rejected: t('design.versionStatusRejected'),
  archived: t('design.versionStatusArchived'),
});

const getStatusFilterOptions = () => [
  { value: '', label: t('design.filterAllStatuses') },
  { value: 'DRAFT', label: t('design.filterDraft') },
  { value: 'IN_REVIEW', label: t('design.filterInReview') },
  { value: 'APPROVED', label: t('design.filterApproved') },
  { value: 'SUPERSEDED', label: t('design.filterSuperseded') },
  { value: 'REJECTED', label: t('design.filterRejected') },
];

type TabId = 'all' | 'DRAFT' | 'IN_REVIEW' | 'APPROVED';

const DesignVersionListPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { data: versionsData, isLoading } = useQuery<PaginatedResponse<DesignVersion>>({
    queryKey: ['design-versions'],
    queryFn: () => designApi.getVersions(),
  });

  const versions = versionsData?.content ?? [];

  const filteredVersions = useMemo(() => {
    let filtered = versions;

    if (activeTab !== 'all') {
      filtered = filtered.filter((v) => v.status === activeTab);
    }

    if (statusFilter) {
      filtered = filtered.filter((v) => v.status === statusFilter);
    }

    if (search) {
      const lower = search.toLowerCase();
      filtered = filtered.filter(
        (v) =>
          v.number.toLowerCase().includes(lower) ||
          v.title.toLowerCase().includes(lower) ||
          v.sectionName.toLowerCase().includes(lower) ||
          v.authorName.toLowerCase().includes(lower),
      );
    }

    return filtered;
  }, [versions, activeTab, statusFilter, search]);

  const tabCounts = useMemo(() => ({
    all: versions.length,
    draft: versions.filter((v) => v.status === 'DRAFT').length,
    in_review: versions.filter((v) => v.status === 'IN_REVIEW').length,
    approved: versions.filter((v) => v.status === 'APPROVED').length,
  }), [versions]);

  const metrics = useMemo(() => {
    const inReview = versions.filter((v) => v.status === 'IN_REVIEW').length;
    const approved = versions.filter((v) => v.status === 'APPROVED').length;
    const rejected = versions.filter((v) => v.status === 'REJECTED').length;
    return { total: versions.length, inReview, approved, rejected };
  }, [versions]);

  const columns = useMemo<ColumnDef<DesignVersion, unknown>[]>(
    () => [
      {
        accessorKey: 'number',
        header: '\u2116',
        size: 100,
        cell: ({ getValue }) => (
          <span className="font-mono text-neutral-500 dark:text-neutral-400 text-xs">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'title',
        header: t('design.colTitle'),
        size: 300,
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-neutral-900 dark:text-neutral-100 truncate max-w-[280px]">{row.original.title}</p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{row.original.sectionName} | {row.original.projectName}</p>
          </div>
        ),
      },
      {
        accessorKey: 'version',
        header: t('design.colVersion'),
        size: 90,
        cell: ({ getValue }) => (
          <span className="font-mono font-medium text-primary-600">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'status',
        header: t('design.colStatus'),
        size: 130,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={versionStatusColorMap}
            label={getVersionStatusLabels()[getValue<string>()] ?? getValue<string>()}
          />
        ),
      },
      {
        accessorKey: 'authorName',
        header: t('design.colAuthor'),
        size: 160,
        cell: ({ getValue }) => (
          <span className="text-neutral-700 dark:text-neutral-300">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'reviewCount',
        header: t('design.colReviewCount'),
        size: 100,
        cell: ({ getValue }) => {
          const count = getValue<number>();
          return (
            <span className="text-neutral-600">{count > 0 ? count : '---'}</span>
          );
        },
      },
      {
        accessorKey: 'updatedAt',
        header: t('design.colUpdatedAt'),
        size: 120,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-neutral-700 dark:text-neutral-300">{formatDate(getValue<string>())}</span>
        ),
      },
      {
        id: 'actions',
        header: '',
        size: 80,
        cell: ({ row }) => (
          <Button
            variant="ghost"
            size="xs"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/design/versions/${row.original.id}`);
            }}
          >
            {t('design.openAction')}
          </Button>
        ),
      },
    ],
    [navigate],
  );

  const handleRowClick = useCallback(
    (ver: DesignVersion) => navigate(`/design/versions/${ver.id}`),
    [navigate],
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('design.versionsTitle')}
        subtitle={t('design.versionsSubtitle', { count: String(versions.length) })}
        breadcrumbs={[
          { label: t('design.breadcrumbHome'), href: '/' },
          { label: t('design.breadcrumbDesign') },
          { label: t('design.breadcrumbVersions') },
        ]}
        actions={
          <Button iconLeft={<Plus size={16} />} onClick={() => navigate('/design/versions/new')}>
            {t('design.newVersion')}
          </Button>
        }
        tabs={[
          { id: 'all', label: t('design.tabAll'), count: tabCounts.all },
          { id: 'DRAFT', label: t('design.tabDrafts'), count: tabCounts.draft },
          { id: 'IN_REVIEW', label: t('design.tabOnReview'), count: tabCounts.in_review },
          { id: 'APPROVED', label: t('design.tabApproved'), count: tabCounts.approved },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as TabId)}
      />

      {/* Metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard
          icon={<Layers size={18} />}
          label={t('design.metricTotalVersionsList')}
          value={metrics.total}
        />
        <MetricCard
          icon={<Clock size={18} />}
          label={t('design.metricOnReview')}
          value={metrics.inReview}
          trend={metrics.inReview > 0 ? { direction: 'up', value: t('design.trendItemsCount', { count: String(metrics.inReview) }) } : undefined}
        />
        <MetricCard
          icon={<CheckCircle size={18} />}
          label={t('design.metricApproved')}
          value={metrics.approved}
        />
        <MetricCard
          icon={<FileText size={18} />}
          label={t('design.metricRejected')}
          value={metrics.rejected}
          trend={metrics.rejected > 0 ? { direction: 'down', value: t('design.trendNeedRevision') } : undefined}
        />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input
            placeholder={t('design.searchVersionPlaceholder')}
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
      <DataTable<DesignVersion>
        data={filteredVersions}
        columns={columns}
        loading={isLoading}
        onRowClick={handleRowClick}
        enableRowSelection
        enableColumnVisibility
        enableDensityToggle
        enableExport
        pageSize={20}
        emptyTitle={t('design.emptyVersionsTitle')}
        emptyDescription={t('design.emptyVersionsDescription')}
      />
    </div>
  );
};

export default DesignVersionListPage;
