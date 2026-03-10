import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { Plus, Search, FolderTree, Layers } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { DataTable } from '@/design-system/components/DataTable';
import { MetricCard } from '@/design-system/components/MetricCard';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { Input } from '@/design-system/components/FormField';
import { designApi } from '@/api/design';
import { formatDate } from '@/lib/format';
import { t } from '@/i18n';
import type { DesignSection } from './types';
import type { PaginatedResponse } from '@/types';

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

const DesignSectionListPage: React.FC = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const { data: sectionsData, isLoading } = useQuery<PaginatedResponse<DesignSection>>({
    queryKey: ['design-sections'],
    queryFn: () => designApi.getSections(),
  });

  const sections = sectionsData?.content ?? [];

  const filteredSections = useMemo(() => {
    if (!search) return sections;
    const lower = search.toLowerCase();
    return sections.filter(
      (s) =>
        s.code.toLowerCase().includes(lower) ||
        s.name.toLowerCase().includes(lower) ||
        s.projectName.toLowerCase().includes(lower) ||
        (s.leadDesignerName ?? '').toLowerCase().includes(lower),
    );
  }, [sections, search]);

  const totalVersions = useMemo(() => sections.reduce((s, sec) => s + sec.versionCount, 0), [sections]);

  const columns = useMemo<ColumnDef<DesignSection, unknown>[]>(
    () => [
      {
        accessorKey: 'code',
        header: t('design.colCode'),
        size: 90,
        cell: ({ getValue }) => (
          <span className="font-mono font-medium text-primary-600">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'name',
        header: t('design.colName'),
        size: 280,
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-neutral-900 dark:text-neutral-100">{row.original.name}</p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{row.original.projectName}</p>
          </div>
        ),
      },
      {
        accessorKey: 'leadDesignerName',
        header: t('design.colLeadDesigner'),
        size: 180,
        cell: ({ getValue }) => (
          <span className="text-neutral-700 dark:text-neutral-300">{getValue<string>() ?? '---'}</span>
        ),
      },
      {
        accessorKey: 'versionCount',
        header: t('design.colVersionCount'),
        size: 90,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-neutral-600">{getValue<number>()}</span>
        ),
      },
      {
        accessorKey: 'latestVersion',
        header: t('design.colLatestVersion'),
        size: 100,
        cell: ({ getValue }) => (
          <span className="font-mono text-neutral-700 dark:text-neutral-300">{getValue<string>() ?? '---'}</span>
        ),
      },
      {
        accessorKey: 'latestVersionStatus',
        header: t('design.colStatus'),
        size: 130,
        cell: ({ getValue }) => {
          const status = getValue<string>();
          if (!status) return <span className="text-neutral-400">---</span>;
          return (
            <StatusBadge
              status={status}
              colorMap={versionStatusColorMap}
              label={getVersionStatusLabels()[status] ?? status}
            />
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
    ],
    [],
  );

  const handleRowClick = useCallback(
    (section: DesignSection) => navigate(`/design/sections/${section.id}`),
    [navigate],
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('design.sectionsTitle')}
        subtitle={t('design.sectionsSubtitle', { count: String(sections.length) })}
        breadcrumbs={[
          { label: t('design.breadcrumbHome'), href: '/' },
          { label: t('design.breadcrumbDesign') },
          { label: t('design.breadcrumbSections') },
        ]}
        actions={
          <Button iconLeft={<Plus size={16} />} onClick={() => navigate('/design/sections/new')}>
            {t('design.newSection')}
          </Button>
        }
      />

      {/* Metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <MetricCard
          icon={<FolderTree size={18} />}
          label={t('design.metricTotalSections')}
          value={sections.length}
        />
        <MetricCard
          icon={<Layers size={18} />}
          label={t('design.metricTotalVersions')}
          value={totalVersions}
        />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input
            placeholder={t('design.searchSectionPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Table */}
      <DataTable<DesignSection>
        data={filteredSections}
        columns={columns}
        loading={isLoading}
        onRowClick={handleRowClick}
        enableColumnVisibility
        enableDensityToggle
        enableExport
        pageSize={20}
        emptyTitle={t('design.emptySectionsTitle')}
        emptyDescription={t('design.emptySectionsDescription')}
      />
    </div>
  );
};

export default DesignSectionListPage;
