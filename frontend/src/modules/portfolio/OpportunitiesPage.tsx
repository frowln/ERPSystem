import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { Plus, Search, Target, DollarSign, TrendingUp, BarChart3 } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { DataTable } from '@/design-system/components/DataTable';
import { MetricCard } from '@/design-system/components/MetricCard';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { Input, Select } from '@/design-system/components/FormField';
import { portfolioApi } from '@/api/portfolio';
import { formatDate, formatMoneyCompact, formatPercent } from '@/lib/format';
import { t } from '@/i18n';
import type { Opportunity, OpportunityStage } from './types';

const stageColorMap: Record<string, 'gray' | 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'orange' | 'cyan'> = {
  LEAD: 'gray',
  QUALIFICATION: 'blue',
  PROPOSAL: 'yellow',
  NEGOTIATION: 'orange',
  WON: 'green',
  LOST: 'red',
};

const getStageLabels = (): Record<string, string> => ({
  LEAD: t('portfolio.opportunities.stageLead'),
  QUALIFICATION: t('portfolio.opportunities.stageQualification'),
  PROPOSAL: t('portfolio.opportunities.stageProposal'),
  NEGOTIATION: t('portfolio.opportunities.stageNegotiation'),
  WON: t('portfolio.opportunities.stageWon'),
  LOST: t('portfolio.opportunities.stageLost'),
});

type TabId = 'all' | 'ACTIVE' | 'WON' | 'LOST';

const getStageFilterOptions = () => [
  { value: '', label: t('portfolio.opportunities.allStages') },
  { value: 'LEAD', label: t('portfolio.opportunities.stageLead') },
  { value: 'QUALIFICATION', label: t('portfolio.opportunities.stageQualification') },
  { value: 'PROPOSAL', label: t('portfolio.opportunities.stageProposal') },
  { value: 'NEGOTIATION', label: t('portfolio.opportunities.stageNegotiation') },
  { value: 'WON', label: t('portfolio.opportunities.stageWon') },
  { value: 'LOST', label: t('portfolio.opportunities.stageLost') },
];

const OpportunitiesPage: React.FC = () => {
  const navigate = useNavigate();
  const stageLabels = getStageLabels();
  const stageFilterOptions = getStageFilterOptions();
  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('');

  const { data: oppData, isLoading } = useQuery({
    queryKey: ['opportunities'],
    queryFn: () => portfolioApi.getOpportunities(),
  });

  const opportunities = oppData?.content ?? [];

  const filtered = useMemo(() => {
    let result = opportunities;
    if (activeTab === 'ACTIVE') {
      result = result.filter((o) => !['WON', 'LOST'].includes(o.stage));
    } else if (activeTab === 'WON') {
      result = result.filter((o) => o.stage === 'WON');
    } else if (activeTab === 'LOST') {
      result = result.filter((o) => o.stage === 'LOST');
    }
    if (stageFilter) {
      result = result.filter((o) => o.stage === stageFilter);
    }
    if (search) {
      const lower = search.toLowerCase();
      result = result.filter(
        (o) =>
          o.name.toLowerCase().includes(lower) ||
          o.clientName.toLowerCase().includes(lower) ||
          o.ownerName.toLowerCase().includes(lower),
      );
    }
    return result;
  }, [opportunities, activeTab, stageFilter, search]);

  const tabCounts = useMemo(() => ({
    all: opportunities.length,
    active: opportunities.filter((o) => !['WON', 'LOST'].includes(o.stage)).length,
    won: opportunities.filter((o) => o.stage === 'WON').length,
    lost: opportunities.filter((o) => o.stage === 'LOST').length,
  }), [opportunities]);

  const metrics = useMemo(() => {
    const pipeline = opportunities.filter((o) => !['WON', 'LOST'].includes(o.stage));
    const totalPipeline = pipeline.reduce((s, o) => s + o.value, 0);
    const weightedPipeline = pipeline.reduce((s, o) => s + o.weightedValue, 0);
    const wonValue = opportunities.filter((o) => o.stage === 'WON').reduce((s, o) => s + o.value, 0);
    const avgProbability = pipeline.length > 0
      ? Math.round(pipeline.reduce((s, o) => s + o.probability, 0) / pipeline.length)
      : 0;
    return { totalPipeline, weightedPipeline, wonValue, avgProbability, activeCount: pipeline.length };
  }, [opportunities]);

  const columns = useMemo<ColumnDef<Opportunity, unknown>[]>(
    () => [
      {
        accessorKey: 'name',
        header: t('portfolio.opportunities.colOpportunity'),
        size: 300,
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-neutral-900 dark:text-neutral-100 truncate max-w-[280px]">{row.original.name}</p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{row.original.clientName}</p>
          </div>
        ),
      },
      {
        accessorKey: 'stage',
        header: t('portfolio.opportunities.colStage'),
        size: 140,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={stageColorMap}
            label={stageLabels[getValue<string>()] ?? getValue<string>()}
          />
        ),
      },
      {
        accessorKey: 'value',
        header: t('portfolio.opportunities.colValue'),
        size: 150,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-sm font-medium text-neutral-900 dark:text-neutral-100">{formatMoneyCompact(getValue<number>())}</span>
        ),
      },
      {
        accessorKey: 'probability',
        header: t('portfolio.opportunities.colProbability'),
        size: 120,
        cell: ({ getValue }) => {
          const pct = getValue<number>();
          return (
            <div className="flex items-center gap-2">
              <div className="w-12 h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-primary-500" style={{ width: `${pct}%` }} />
              </div>
              <span className="text-xs font-medium text-neutral-600 tabular-nums">{pct}%</span>
            </div>
          );
        },
      },
      {
        accessorKey: 'weightedValue',
        header: t('portfolio.opportunities.colWeightedValue'),
        size: 170,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-sm text-neutral-600">{formatMoneyCompact(getValue<number>())}</span>
        ),
      },
      {
        accessorKey: 'ownerName',
        header: t('portfolio.opportunities.colOwner'),
        size: 150,
        cell: ({ getValue }) => (
          <span className="text-neutral-700 dark:text-neutral-300">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'expectedCloseDate',
        header: t('portfolio.opportunities.colExpectedClose'),
        size: 130,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-neutral-600 text-xs">{formatDate(getValue<string>())}</span>
        ),
      },
    ],
    [],
  );

  const handleRowClick = useCallback(
    (opp: Opportunity) => navigate(`/portfolio/opportunities/${opp.id}`),
    [navigate],
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('portfolio.opportunities.title')}
        subtitle={t('portfolio.opportunities.subtitle', { count: String(opportunities.length) })}
        breadcrumbs={[
          { label: t('nav.dashboard'), href: '/' },
          { label: t('nav.portfolio') },
          { label: t('portfolio.opportunities.breadcrumb') },
        ]}
        actions={
          <Button iconLeft={<Plus size={16} />} onClick={() => navigate('/portfolio/opportunities/new')}>
            {t('portfolio.opportunities.newOpportunity')}
          </Button>
        }
        tabs={[
          { id: 'all', label: t('common.all'), count: tabCounts.all },
          { id: 'ACTIVE', label: t('portfolio.opportunities.tabActive'), count: tabCounts.active },
          { id: 'WON', label: t('portfolio.opportunities.tabWon'), count: tabCounts.won },
          { id: 'LOST', label: t('portfolio.opportunities.tabLost'), count: tabCounts.lost },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as TabId)}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard icon={<Target size={18} />} label={t('portfolio.opportunities.activeOpportunities')} value={metrics.activeCount} />
        <MetricCard icon={<DollarSign size={18} />} label={t('portfolio.opportunities.pipelineTotal')} value={formatMoneyCompact(metrics.totalPipeline)} />
        <MetricCard icon={<TrendingUp size={18} />} label={t('portfolio.opportunities.weightedPipeline')} value={formatMoneyCompact(metrics.weightedPipeline)} />
        <MetricCard icon={<BarChart3 size={18} />} label={t('portfolio.opportunities.avgProbability')} value={formatPercent(metrics.avgProbability)} />
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input
            placeholder={t('portfolio.opportunities.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          options={stageFilterOptions}
          value={stageFilter}
          onChange={(e) => setStageFilter(e.target.value)}
          className="w-48"
        />
      </div>

      <DataTable<Opportunity>
        data={filtered ?? []}
        columns={columns}
        loading={isLoading}
        onRowClick={handleRowClick}
        enableRowSelection
        enableColumnVisibility
        enableDensityToggle
        enableExport
        pageSize={20}
        emptyTitle={t('portfolio.opportunities.emptyTitle')}
        emptyDescription={t('portfolio.opportunities.emptyDescription')}
      />
    </div>
  );
};

export default OpportunitiesPage;
