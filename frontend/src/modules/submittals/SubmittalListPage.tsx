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
  submittalStatusColorMap,
  submittalStatusLabels,
  submittalTypeColorMap,
  submittalTypeLabels,
} from '@/design-system/components/StatusBadge';
import { Input, Select } from '@/design-system/components/FormField';
import { submittalsApi } from '@/api/submittals';
import { formatDate } from '@/lib/format';
import { t } from '@/i18n';
import type { Submittal } from './types';
import { SubmittalCreateModal } from './SubmittalCreateModal';

type TabId = 'all' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'revise';

const getTypeFilterOptions = () => [
  { value: '', label: t('submittals.filterAllTypes') },
  { value: 'SHOP_DRAWING', label: t('submittals.filterTypeShopDrawing') },
  { value: 'PRODUCT_DATA', label: t('submittals.filterTypeProductData') },
  { value: 'SAMPLE', label: t('submittals.filterTypeSample') },
  { value: 'TEST_REPORT', label: t('submittals.filterTypeTestReport') },
  { value: 'CERTIFICATE', label: t('submittals.filterTypeCertificate') },
  { value: 'DESIGN_DATA', label: t('submittals.filterTypeDesignData') },
];

const SubmittalListPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const { data: submittalData, isLoading } = useQuery({
    queryKey: ['submittals'],
    queryFn: () => submittalsApi.getSubmittals(),
  });

  const submittals = submittalData?.content ?? [];

  const filteredSubmittals = useMemo(() => {
    let filtered = submittals;

    if (activeTab === 'SUBMITTED') {
      filtered = filtered.filter((s) => s.status === 'SUBMITTED');
    } else if (activeTab === 'UNDER_REVIEW') {
      filtered = filtered.filter((s) => s.status === 'UNDER_REVIEW');
    } else if (activeTab === 'APPROVED') {
      filtered = filtered.filter((s) => ['APPROVED', 'APPROVED_AS_NOTED'].includes(s.status));
    } else if (activeTab === 'revise') {
      filtered = filtered.filter((s) => ['REVISE_RESUBMIT', 'REJECTED'].includes(s.status));
    }

    if (typeFilter) {
      filtered = filtered.filter((s) => s.type === typeFilter);
    }

    if (search) {
      const lower = search.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.number.toLowerCase().includes(lower) ||
          s.title.toLowerCase().includes(lower) ||
          (s.ballInCourt ?? '').toLowerCase().includes(lower),
      );
    }

    return filtered;
  }, [submittals, activeTab, typeFilter, search]);

  const tabCounts = useMemo(() => ({
    all: submittals.length,
    submitted: submittals.filter((s) => s.status === 'SUBMITTED').length,
    under_review: submittals.filter((s) => s.status === 'UNDER_REVIEW').length,
    approved: submittals.filter((s) => ['APPROVED', 'APPROVED_AS_NOTED'].includes(s.status)).length,
    revise: submittals.filter((s) => ['REVISE_RESUBMIT', 'REJECTED'].includes(s.status)).length,
  }), [submittals]);

  const columns = useMemo<ColumnDef<Submittal, unknown>[]>(
    () => [
      {
        accessorKey: 'number',
        header: '\u2116',
        size: 110,
        cell: ({ getValue }) => (
          <span className="font-mono text-neutral-500 dark:text-neutral-400 text-xs">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'title',
        header: t('submittals.colTitle'),
        size: 280,
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-neutral-900 dark:text-neutral-100 truncate max-w-[260px]">{row.original.title}</p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{row.original.specSection ?? '---'}</p>
          </div>
        ),
      },
      {
        accessorKey: 'type',
        header: t('submittals.colType'),
        size: 150,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={submittalTypeColorMap}
            label={submittalTypeLabels[getValue<string>()] ?? getValue<string>()}
          />
        ),
      },
      {
        accessorKey: 'status',
        header: t('submittals.colStatus'),
        size: 160,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={submittalStatusColorMap}
            label={submittalStatusLabels[getValue<string>()] ?? getValue<string>()}
          />
        ),
      },
      {
        accessorKey: 'ballInCourt',
        header: t('submittals.colBallInCourt'),
        size: 140,
        cell: ({ getValue }) => (
          <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{getValue<string>() ?? '---'}</span>
        ),
      },
      {
        accessorKey: 'dueDate',
        header: t('submittals.colDueDate'),
        size: 120,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-neutral-700 dark:text-neutral-300">{formatDate(getValue<string>())}</span>
        ),
      },
      {
        accessorKey: 'leadTimeDays',
        header: 'Lead Time',
        size: 100,
        cell: ({ getValue }) => {
          const days = getValue<number>();
          return days != null ? (
            <span className="text-sm text-neutral-600">{days} {t('submittals.days')}</span>
          ) : (
            <span className="text-neutral-400">---</span>
          );
        },
      },
    ],
    [],
  );

  const handleRowClick = useCallback(
    (submittal: Submittal) => navigate(`/submittals/${submittal.id}`),
    [navigate],
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('submittals.listTitle')}
        subtitle={t('submittals.listSubtitle', { count: String(submittals.length) })}
        breadcrumbs={[
          { label: t('submittals.breadcrumbHome'), href: '/' },
          { label: t('submittals.breadcrumbSubmittals') },
        ]}
        actions={
          <Button iconLeft={<Plus size={16} />} onClick={() => setCreateModalOpen(true)}>
            {t('submittals.newSubmittal')}
          </Button>
        }
        tabs={[
          { id: 'all', label: t('submittals.tabAll'), count: tabCounts.all },
          { id: 'SUBMITTED', label: t('submittals.tabSubmitted'), count: tabCounts.submitted },
          { id: 'UNDER_REVIEW', label: t('submittals.tabUnderReview'), count: tabCounts.under_review },
          { id: 'APPROVED', label: t('submittals.tabApproved'), count: tabCounts.approved },
          { id: 'revise', label: t('submittals.tabRevise'), count: tabCounts.revise },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as TabId)}
      />

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input
            placeholder={t('submittals.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          options={getTypeFilterOptions()}
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="w-52"
        />
      </div>

      {/* Table */}
      <DataTable<Submittal>
        data={filteredSubmittals}
        columns={columns}
        loading={isLoading}
        onRowClick={handleRowClick}
        enableRowSelection
        enableColumnVisibility
        enableDensityToggle
        enableExport
        pageSize={20}
        emptyTitle={t('submittals.emptyTitle')}
        emptyDescription={t('submittals.emptyDescription')}
      />

      <SubmittalCreateModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
      />
    </div>
  );
};

export default SubmittalListPage;
