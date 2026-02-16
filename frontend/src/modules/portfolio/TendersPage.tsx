import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { Plus, Search, FileSearch, DollarSign, Clock, Award } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { DataTable } from '@/design-system/components/DataTable';
import { MetricCard } from '@/design-system/components/MetricCard';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { Input, Select } from '@/design-system/components/FormField';
import { portfolioApi } from '@/api/portfolio';
import { formatDate, formatMoneyCompact } from '@/lib/format';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';
import type { BidPackage } from './types';

const bidStatusColorMap: Record<string, 'gray' | 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'orange' | 'cyan'> = {
  DRAFT: 'gray',
  SUBMITTED: 'blue',
  UNDER_REVIEW: 'yellow',
  SHORTLISTED: 'cyan',
  AWARDED: 'green',
  REJECTED: 'red',
  WITHDRAWN: 'gray',
};

const getBidStatusLabels = (): Record<string, string> => ({
  DRAFT: t('portfolio.tenders.statusDraft'),
  SUBMITTED: t('portfolio.tenders.statusSubmitted'),
  UNDER_REVIEW: t('portfolio.tenders.statusUnderReview'),
  SHORTLISTED: t('portfolio.tenders.statusShortlisted'),
  AWARDED: t('portfolio.tenders.statusAwarded'),
  REJECTED: t('portfolio.tenders.statusRejected'),
  WITHDRAWN: t('portfolio.tenders.statusWithdrawn'),
});

type TabId = 'all' | 'ACTIVE' | 'AWARDED' | 'REJECTED';

const getStatusFilterOptions = () => [
  { value: '', label: t('portfolio.tenders.allStatuses') },
  { value: 'DRAFT', label: t('portfolio.tenders.statusDraft') },
  { value: 'SUBMITTED', label: t('portfolio.tenders.statusSubmitted') },
  { value: 'UNDER_REVIEW', label: t('portfolio.tenders.statusUnderReview') },
  { value: 'SHORTLISTED', label: t('portfolio.tenders.statusShortlisted') },
  { value: 'AWARDED', label: t('portfolio.tenders.statusAwarded') },
  { value: 'REJECTED', label: t('portfolio.tenders.statusRejected') },
];

const TendersPage: React.FC = () => {
  const navigate = useNavigate();
  const bidStatusLabels = getBidStatusLabels();
  const statusFilterOptions = getStatusFilterOptions();
  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { data: bidData, isLoading } = useQuery({
    queryKey: ['bid-packages'],
    queryFn: () => portfolioApi.getBidPackages(),
  });

  const bids = bidData?.content ?? [];

  const filtered = useMemo(() => {
    let result = bids;
    if (activeTab === 'ACTIVE') {
      result = result.filter((b) => ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'SHORTLISTED'].includes(b.status));
    } else if (activeTab === 'AWARDED') {
      result = result.filter((b) => b.status === 'AWARDED');
    } else if (activeTab === 'REJECTED') {
      result = result.filter((b) => ['REJECTED', 'WITHDRAWN'].includes(b.status));
    }
    if (statusFilter) {
      result = result.filter((b) => b.status === statusFilter);
    }
    if (search) {
      const lower = search.toLowerCase();
      result = result.filter(
        (b) =>
          b.bidNumber.toLowerCase().includes(lower) ||
          b.projectName.toLowerCase().includes(lower) ||
          b.clientName.toLowerCase().includes(lower),
      );
    }
    return result;
  }, [bids, activeTab, statusFilter, search]);

  const tabCounts = useMemo(() => ({
    all: bids.length,
    active: bids.filter((b) => ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'SHORTLISTED'].includes(b.status)).length,
    awarded: bids.filter((b) => b.status === 'AWARDED').length,
    rejected: bids.filter((b) => ['REJECTED', 'WITHDRAWN'].includes(b.status)).length,
  }), [bids]);

  const metrics = useMemo(() => {
    const totalAmount = bids.reduce((s, b) => s + b.amount, 0);
    const awardedAmount = bids.filter((b) => b.status === 'AWARDED').reduce((s, b) => s + b.amount, 0);
    const winRate = bids.filter((b) => ['AWARDED', 'REJECTED'].includes(b.status)).length > 0
      ? Math.round(
          (bids.filter((b) => b.status === 'AWARDED').length /
            bids.filter((b) => ['AWARDED', 'REJECTED'].includes(b.status)).length) *
            100,
        )
      : 0;
    const pendingCount = bids.filter((b) => ['SUBMITTED', 'UNDER_REVIEW', 'SHORTLISTED'].includes(b.status)).length;
    return { totalAmount, awardedAmount, winRate, pendingCount };
  }, [bids]);

  const columns = useMemo<ColumnDef<BidPackage, unknown>[]>(
    () => [
      {
        accessorKey: 'bidNumber',
        header: '\u2116',
        size: 100,
        cell: ({ getValue }) => (
          <span className="font-mono text-neutral-500 dark:text-neutral-400 text-xs">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'projectName',
        header: t('portfolio.tenders.colProject'),
        size: 280,
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-neutral-900 dark:text-neutral-100 truncate max-w-[260px]">{row.original.projectName}</p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{row.original.clientName}</p>
          </div>
        ),
      },
      {
        accessorKey: 'status',
        header: t('common.status'),
        size: 150,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={bidStatusColorMap}
            label={bidStatusLabels[getValue<string>()] ?? getValue<string>()}
          />
        ),
      },
      {
        accessorKey: 'amount',
        header: t('portfolio.tenders.colBidAmount'),
        size: 170,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-sm font-medium text-neutral-900 dark:text-neutral-100">{formatMoneyCompact(getValue<number>())}</span>
        ),
      },
      {
        accessorKey: 'evaluationScore',
        header: t('portfolio.tenders.colScore'),
        size: 100,
        cell: ({ getValue }) => {
          const score = getValue<number | undefined>();
          if (!score) return <span className="text-neutral-400">---</span>;
          return (
            <span className={cn(
              'text-sm font-medium tabular-nums',
              score >= 80 ? 'text-success-600' : score >= 60 ? 'text-warning-600' : 'text-danger-600',
            )}>
              {score}
            </span>
          );
        },
      },
      {
        accessorKey: 'responsibleName',
        header: t('portfolio.tenders.colResponsible'),
        size: 150,
        cell: ({ getValue }) => (
          <span className="text-neutral-700 dark:text-neutral-300">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'submissionDeadline',
        header: t('portfolio.tenders.colDeadline'),
        size: 120,
        cell: ({ row }) => {
          const deadline = row.original.submissionDeadline;
          const isOverdue = new Date(deadline) < new Date() && !['AWARDED', 'REJECTED', 'WITHDRAWN'].includes(row.original.status) && !row.original.submittedDate;
          return (
            <span className={cn(
              'tabular-nums text-xs',
              isOverdue ? 'text-danger-600 font-medium' : 'text-neutral-600',
            )}>
              {formatDate(deadline)}
            </span>
          );
        },
      },
      {
        accessorKey: 'submittedDate',
        header: t('portfolio.tenders.colSubmitted'),
        size: 110,
        cell: ({ getValue }) => {
          const val = getValue<string | undefined>();
          return val ? (
            <span className="tabular-nums text-neutral-600 text-xs">{formatDate(val)}</span>
          ) : (
            <span className="text-neutral-400 text-xs">---</span>
          );
        },
      },
    ],
    [],
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('portfolio.tenders.title')}
        subtitle={t('portfolio.tenders.subtitle', { count: String(bids.length) })}
        breadcrumbs={[
          { label: t('nav.dashboard'), href: '/' },
          { label: t('nav.portfolio') },
          { label: t('portfolio.tenders.title') },
        ]}
        actions={
          <Button iconLeft={<Plus size={16} />} onClick={() => navigate('/portfolio/tenders/new')}>
            {t('portfolio.tenders.newBid')}
          </Button>
        }
        tabs={[
          { id: 'all', label: t('common.all'), count: tabCounts.all },
          { id: 'ACTIVE', label: t('portfolio.tenders.tabActive'), count: tabCounts.active },
          { id: 'AWARDED', label: t('portfolio.tenders.tabAwarded'), count: tabCounts.awarded },
          { id: 'REJECTED', label: t('portfolio.tenders.tabRejected'), count: tabCounts.rejected },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as TabId)}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard icon={<FileSearch size={18} />} label={t('portfolio.tenders.totalTenders')} value={bids.length} />
        <MetricCard icon={<DollarSign size={18} />} label={t('portfolio.tenders.totalVolume')} value={formatMoneyCompact(metrics.totalAmount)} />
        <MetricCard icon={<Award size={18} />} label={t('portfolio.tenders.winRate')} value={`${metrics.winRate}%`} />
        <MetricCard icon={<Clock size={18} />} label={t('portfolio.tenders.underReview')} value={metrics.pendingCount} subtitle={t('portfolio.tenders.tendersSubtitle')} />
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input
            placeholder={t('portfolio.tenders.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          options={statusFilterOptions}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-52"
        />
      </div>

      <DataTable<BidPackage>
        data={filtered}
        columns={columns}
        loading={isLoading}
        enableRowSelection
        enableColumnVisibility
        enableDensityToggle
        enableExport
        pageSize={20}
        emptyTitle={t('portfolio.tenders.emptyTitle')}
        emptyDescription={t('portfolio.tenders.emptyDescription')}
      />
    </div>
  );
};

export default TendersPage;
