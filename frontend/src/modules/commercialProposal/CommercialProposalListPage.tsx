import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { Plus, Search } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { DataTable } from '@/design-system/components/DataTable';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { Input } from '@/design-system/components/FormField';
import { financeApi } from '@/api/finance';
import { formatMoney, formatDate } from '@/lib/format';
import { t } from '@/i18n';
import type { CommercialProposal, ProposalStatus } from '@/types';

type TabId = 'all' | ProposalStatus;

const proposalStatusColorMap: Record<string, string> = {
  DRAFT: 'gray',
  IN_REVIEW: 'yellow',
  APPROVED: 'green',
  ACTIVE: 'blue',
};

const proposalStatusLabels: Record<string, string> = {
  DRAFT: t('commercialProposal.statusDraft'),
  IN_REVIEW: t('commercialProposal.statusInReview'),
  APPROVED: t('commercialProposal.statusApproved'),
  ACTIVE: t('commercialProposal.statusActive'),
};

const CommercialProposalListPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const projectIdFilter = searchParams.get('projectId') ?? '';
  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [search, setSearch] = useState('');

  const { data: proposalsData, isLoading } = useQuery({
    queryKey: ['COMMERCIAL_PROPOSALS', projectIdFilter],
    queryFn: () =>
      financeApi.getCommercialProposals({
        projectId: projectIdFilter || undefined,
        size: 500,
      }),
  });

  const proposals = proposalsData?.content ?? [];

  const filteredProposals = useMemo(() => {
    let filtered = proposals;

    if (activeTab !== 'all') {
      filtered = filtered.filter((p) => p.status === activeTab);
    }

    if (search) {
      const lower = search.toLowerCase();
      filtered = filtered.filter((p) => p.name.toLowerCase().includes(lower));
    }

    return filtered;
  }, [proposals, activeTab, search]);

  const tabCounts = useMemo(
    () => ({
      all: proposals.length,
      DRAFT: proposals.filter((p) => p.status === 'DRAFT').length,
      IN_REVIEW: proposals.filter((p) => p.status === 'IN_REVIEW').length,
      APPROVED: proposals.filter((p) => p.status === 'APPROVED').length,
      ACTIVE: proposals.filter((p) => p.status === 'ACTIVE').length,
    }),
    [proposals],
  );

  const columns = useMemo<ColumnDef<CommercialProposal, unknown>[]>(
    () => [
      {
        accessorKey: 'name',
        header: t('commercialProposal.colName'),
        size: 280,
        cell: ({ getValue }) => (
          <span className="font-medium text-neutral-900 dark:text-neutral-100">
            {getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: 'status',
        header: t('commercialProposal.colStatus'),
        size: 140,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={proposalStatusColorMap}
            label={proposalStatusLabels[getValue<string>()] ?? getValue<string>()}
          />
        ),
      },
      {
        accessorKey: 'totalCostPrice',
        header: t('commercialProposal.colTotalCost'),
        size: 180,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-right block font-semibold text-neutral-900 dark:text-neutral-100">
            {formatMoney(getValue<number>())}
          </span>
        ),
      },
      {
        accessorKey: 'createdAt',
        header: t('commercialProposal.colCreatedAt'),
        size: 130,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-neutral-500 dark:text-neutral-400">
            {formatDate(getValue<string>())}
          </span>
        ),
      },
    ],
    [],
  );

  const handleRowClick = useCallback(
    (proposal: CommercialProposal) => navigate(`/commercial-proposals/${proposal.id}`),
    [navigate],
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('commercialProposal.listTitle')}
        subtitle={t('commercialProposal.listSubtitle', { count: String(proposals.length) })}
        breadcrumbs={[
          { label: t('common.home'), href: '/' },
          { label: t('commercialProposal.breadcrumbFinance') },
          { label: t('commercialProposal.breadcrumbProposals') },
        ]}
        actions={
          <Button iconLeft={<Plus size={16} />} onClick={() => navigate('/commercial-proposals/new')}>
            {t('commercialProposal.create')}
          </Button>
        }
        tabs={[
          { id: 'all', label: t('commercialProposal.tabAll'), count: tabCounts.all },
          { id: 'DRAFT', label: t('commercialProposal.tabDraft'), count: tabCounts.DRAFT },
          { id: 'IN_REVIEW', label: t('commercialProposal.tabInReview'), count: tabCounts.IN_REVIEW },
          { id: 'APPROVED', label: t('commercialProposal.tabApproved'), count: tabCounts.APPROVED },
          { id: 'ACTIVE', label: t('commercialProposal.tabActive'), count: tabCounts.ACTIVE },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as TabId)}
      />

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input
            placeholder={t('commercialProposal.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Table */}
      <DataTable<CommercialProposal>
        data={filteredProposals}
        columns={columns}
        loading={isLoading}
        onRowClick={handleRowClick}
        enableRowSelection
        enableColumnVisibility
        enableDensityToggle
        enableExport
        pageSize={20}
        emptyTitle={t('commercialProposal.emptyTitle')}
        emptyDescription={t('commercialProposal.emptyDescription')}
      />
    </div>
  );
};

export default CommercialProposalListPage;
