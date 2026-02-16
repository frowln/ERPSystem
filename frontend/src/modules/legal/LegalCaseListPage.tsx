import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { Plus, Search, Scale, Clock, AlertTriangle, DollarSign } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { DataTable } from '@/design-system/components/DataTable';
import { MetricCard } from '@/design-system/components/MetricCard';
import {
  StatusBadge,
  legalCaseStatusColorMap,
  legalCaseStatusLabels,
  legalCaseTypeColorMap,
  legalCaseTypeLabels,
} from '@/design-system/components/StatusBadge';
import { Input, Select } from '@/design-system/components/FormField';
import { legalApi } from '@/api/legal';
import { formatDate, formatMoneyCompact } from '@/lib/format';
import { t } from '@/i18n';
import type { LegalCase } from './types';
import type { PaginatedResponse } from '@/types';

type TabId = 'all' | 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

const getStatusFilterOptions = () => [
  { value: '', label: t('legal.filterAllStatuses') },
  { value: 'DRAFT', label: t('legal.statusDraft') },
  { value: 'OPEN', label: t('legal.caseStatusOpen') },
  { value: 'IN_PROGRESS', label: t('legal.caseStatusInProgress') },
  { value: 'ON_HOLD', label: t('legal.caseStatusOnHold') },
  { value: 'RESOLVED', label: t('legal.caseStatusResolved') },
  { value: 'CLOSED', label: t('legal.caseStatusClosed') },
  { value: 'APPEAL', label: t('legal.caseStatusAppeal') },
];

const getTypeFilterOptions = () => [
  { value: '', label: t('legal.filterAllTypes') },
  { value: 'LITIGATION', label: t('legal.caseTypeLitigation') },
  { value: 'ARBITRATION', label: t('legal.caseTypeArbitration') },
  { value: 'CLAIM', label: t('legal.caseTypeClaim') },
  { value: 'CONSULTATION', label: t('legal.caseTypeConsultation') },
  { value: 'CONTRACT_DISPUTE', label: t('legal.caseTypeContractDispute') },
  { value: 'REGULATORY', label: t('legal.caseTypeRegulatory') },
];


const LegalCaseListPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const { data: caseData, isLoading } = useQuery<PaginatedResponse<LegalCase>>({
    queryKey: ['legal-cases'],
    queryFn: () => legalApi.getCases(),
  });

  const cases = caseData?.content ?? [];

  const filteredCases = useMemo(() => {
    let filtered = cases;
    if (activeTab !== 'all') {
      filtered = filtered.filter((c) => c.status === activeTab);
    }
    if (typeFilter) {
      filtered = filtered.filter((c) => c.caseType === typeFilter);
    }
    if (search) {
      const lower = search.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.number.toLowerCase().includes(lower) ||
          c.title.toLowerCase().includes(lower) ||
          (c.opposingParty ?? '').toLowerCase().includes(lower) ||
          (c.assignedLawyerName ?? '').toLowerCase().includes(lower),
      );
    }
    return filtered;
  }, [cases, activeTab, typeFilter, search]);

  const tabCounts = useMemo(() => ({
    all: cases.length,
    open: cases.filter((c) => c.status === 'OPEN').length,
    in_progress: cases.filter((c) => c.status === 'IN_PROGRESS').length,
    resolved: cases.filter((c) => c.status === 'RESOLVED').length,
    closed: cases.filter((c) => c.status === 'CLOSED').length,
  }), [cases]);

  const metrics = useMemo(() => {
    const active = cases.filter((c) => [ 'OPEN', 'IN_PROGRESS', 'APPEAL'].includes(c.status)).length;
    const totalClaimAmount = cases.reduce((s, c) => s + (c.claimAmount ?? 0), 0);
    const totalResolved = cases.reduce((s, c) => s + (c.resolvedAmount ?? 0), 0);
    return { total: cases.length, active, totalClaimAmount, totalResolved };
  }, [cases]);

  const columns = useMemo<ColumnDef<LegalCase, unknown>[]>(
    () => [
      {
        accessorKey: 'number',
        header: t('legal.colNumber'),
        size: 100,
        cell: ({ getValue }) => (
          <span className="font-mono text-neutral-500 dark:text-neutral-400 text-xs">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'title',
        header: t('legal.colCase'),
        size: 300,
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-neutral-900 dark:text-neutral-100 truncate max-w-[280px]">{row.original.title}</p>
            {row.original.opposingParty && (
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{t('legal.opposingPartyLabel')}: {row.original.opposingParty}</p>
            )}
          </div>
        ),
      },
      {
        accessorKey: 'status',
        header: t('legal.colStatus'),
        size: 130,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={legalCaseStatusColorMap}
            label={legalCaseStatusLabels[getValue<string>()] ?? getValue<string>()}
          />
        ),
      },
      {
        accessorKey: 'caseType',
        header: t('legal.colType'),
        size: 150,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={legalCaseTypeColorMap}
            label={legalCaseTypeLabels[getValue<string>()] ?? getValue<string>()}
          />
        ),
      },
      {
        accessorKey: 'claimAmount',
        header: t('legal.colClaimAmount'),
        size: 140,
        cell: ({ getValue }) => {
          const val = getValue<number>();
          return (
            <span className={`tabular-nums text-sm font-medium ${val ? 'text-danger-600' : 'text-neutral-500 dark:text-neutral-400'}`}>
              {val ? formatMoneyCompact(val) : '---'}
            </span>
          );
        },
      },
      {
        accessorKey: 'assignedLawyerName',
        header: t('legal.colLawyer'),
        size: 150,
        cell: ({ getValue }) => (
          <span className="text-neutral-700 dark:text-neutral-300">{getValue<string>() ?? '---'}</span>
        ),
      },
      {
        accessorKey: 'hearingDate',
        header: t('legal.colHearing'),
        size: 110,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-neutral-600 text-xs">{formatDate(getValue<string>())}</span>
        ),
      },
      {
        accessorKey: 'createdAt',
        header: t('legal.colCreated'),
        size: 110,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-neutral-600 text-xs">{formatDate(getValue<string>())}</span>
        ),
      },
    ],
    [],
  );

  const handleRowClick = useCallback(
    (legalCase: LegalCase) => navigate(`/legal/cases/${legalCase.id}`),
    [navigate],
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('legal.casesTitle')}
        subtitle={t('legal.casesCount', { count: cases.length })}
        breadcrumbs={[
          { label: t('legal.breadcrumbHome'), href: '/' },
          { label: t('legal.breadcrumbLegal') },
          { label: t('legal.breadcrumbCases') },
        ]}
        actions={
          <Button iconLeft={<Plus size={16} />} onClick={() => navigate('/legal/cases/new')}>
            {t('legal.newCase')}
          </Button>
        }
        tabs={[
          { id: 'all', label: t('legal.tabAll'), count: tabCounts.all },
          { id: 'OPEN', label: t('legal.tabOpen'), count: tabCounts.open },
          { id: 'IN_PROGRESS', label: t('legal.tabInProgress'), count: tabCounts.in_progress },
          { id: 'RESOLVED', label: t('legal.tabResolved'), count: tabCounts.resolved },
          { id: 'CLOSED', label: t('legal.tabClosed'), count: tabCounts.closed },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as TabId)}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard icon={<Scale size={18} />} label={t('legal.metricTotalCases')} value={metrics.total} />
        <MetricCard icon={<Clock size={18} />} label={t('legal.metricActiveCases')} value={metrics.active} />
        <MetricCard icon={<AlertTriangle size={18} />} label={t('legal.metricClaimAmount')} value={formatMoneyCompact(metrics.totalClaimAmount)} />
        <MetricCard icon={<DollarSign size={18} />} label={t('legal.metricResolved')} value={formatMoneyCompact(metrics.totalResolved)} />
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input
            placeholder={t('legal.searchCasePlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          options={getTypeFilterOptions()}
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="w-48"
        />
      </div>

      <DataTable<LegalCase>
        data={filteredCases}
        columns={columns}
        loading={isLoading}
        onRowClick={handleRowClick}
        enableRowSelection
        enableColumnVisibility
        enableDensityToggle
        enableExport
        pageSize={20}
        emptyTitle={t('legal.emptyCasesTitle')}
        emptyDescription={t('legal.emptyCasesDescription')}
      />
    </div>
  );
};

export default LegalCaseListPage;
