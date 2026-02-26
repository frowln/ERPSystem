import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { Plus, Search } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { DataTable } from '@/design-system/components/DataTable';
import {
  StatusBadge,
  specificationStatusColorMap,
  specificationStatusLabels,
} from '@/design-system/components/StatusBadge';
import { Input } from '@/design-system/components/FormField';
import { specificationsApi } from '@/api/specifications';
import { formatMoney, formatDate } from '@/lib/format';
import { t } from '@/i18n';
import type { Specification } from '@/types';

type TabId = 'all' | 'DRAFT' | 'IN_REVIEW' | 'APPROVED' | 'ACTIVE';

const SpecificationListPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [search, setSearch] = useState('');

  const { data: specsData, isLoading } = useQuery({
    queryKey: ['specifications'],
    queryFn: () => specificationsApi.getSpecifications(),
  });

  const specifications = specsData?.content ?? [];

  const filteredSpecs = useMemo(() => {
    let filtered = specifications;

    if (activeTab !== 'all') {
      filtered = filtered.filter((s) => s.status === activeTab);
    }

    if (search) {
      const lower = search.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.name.toLowerCase().includes(lower) ||
          (s.projectName ?? '').toLowerCase().includes(lower),
      );
    }

    return filtered;
  }, [specifications, activeTab, search]);

  const tabCounts = useMemo(() => ({
    all: specifications.length,
    draft: specifications.filter((s) => s.status === 'DRAFT').length,
    in_review: specifications.filter((s) => s.status === 'IN_REVIEW').length,
    approved: specifications.filter((s) => s.status === 'APPROVED').length,
    active: specifications.filter((s) => s.status === 'ACTIVE').length,
  }), [specifications]);

  const columns = useMemo<ColumnDef<Specification, unknown>[]>(
    () => [
      {
        id: 'title',
        accessorFn: (row) => row.title ?? row.name,
        header: t('specifications.colName'),
        size: 300,
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-neutral-900 dark:text-neutral-100">{row.original.title ?? row.original.name}</p>
            <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-0.5 font-mono">{row.original.name}</p>
          </div>
        ),
      },
      {
        accessorKey: 'projectName',
        header: t('specifications.colProject'),
        size: 200,
        cell: ({ getValue }) => (
          <span className="text-neutral-600 dark:text-neutral-400">{getValue<string>() ?? '—'}</span>
        ),
      },
      {
        accessorKey: 'status',
        header: t('specifications.colStatus'),
        size: 140,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={specificationStatusColorMap}
            label={specificationStatusLabels[getValue<string>()] ?? getValue<string>()}
          />
        ),
      },
      {
        accessorKey: 'version',
        header: t('specifications.colVersion'),
        size: 80,
        cell: ({ getValue }) => {
          const v = getValue<number>();
          return <span className="font-mono text-neutral-500 dark:text-neutral-400 text-xs">{v != null ? `v${v}` : '—'}</span>;
        },
      },
      {
        accessorKey: 'itemCount',
        header: t('specifications.colItemCount'),
        size: 90,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-neutral-700 dark:text-neutral-300">{getValue<number>() ?? 0}</span>
        ),
      },
      {
        accessorKey: 'createdAt',
        header: t('specifications.colCreatedAt'),
        size: 130,
        cell: ({ getValue }) => (
          <span className="tabular-nums">{formatDate(getValue<string>())}</span>
        ),
      },
    ],
    [],
  );

  const handleRowClick = useCallback(
    (spec: Specification) => navigate(`/specifications/${spec.id}`),
    [navigate],
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('specifications.listTitle')}
        subtitle={t('specifications.listSubtitle', { count: String(specifications.length) })}
        breadcrumbs={[
          { label: t('specifications.breadcrumbHome'), href: '/' },
          { label: t('specifications.breadcrumbSpecifications') },
        ]}
        actions={
          <Button iconLeft={<Plus size={16} />} onClick={() => navigate('/specifications/new')}>
            {t('specifications.newSpecification')}
          </Button>
        }
        tabs={[
          { id: 'all', label: t('specifications.tabAll'), count: tabCounts.all },
          { id: 'DRAFT', label: t('specifications.tabDraft'), count: tabCounts.draft },
          { id: 'IN_REVIEW', label: t('specifications.tabInReview'), count: tabCounts.in_review },
          { id: 'APPROVED', label: t('specifications.tabApproved'), count: tabCounts.approved },
          { id: 'ACTIVE', label: t('specifications.tabActive'), count: tabCounts.active },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as TabId)}
      />

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input
            placeholder={t('specifications.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Table */}
      <DataTable<Specification>
        data={filteredSpecs}
        columns={columns}
        loading={isLoading}
        onRowClick={handleRowClick}
        enableColumnVisibility
        enableDensityToggle
        enableExport
        pageSize={20}
        emptyTitle={t('specifications.emptyTitle')}
        emptyDescription={t('specifications.emptyDescription')}
      />
    </div>
  );
};

export default SpecificationListPage;
