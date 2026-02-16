import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { Plus, Search, FileText, TrendingDown, TrendingUp, AlertTriangle } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { DataTable } from '@/design-system/components/DataTable';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { MetricCard } from '@/design-system/components/MetricCard';
import { Input } from '@/design-system/components/FormField';
import { russianDocsApi } from '@/api/russianDocs';
import { formatDate, formatMoney, formatNumber } from '@/lib/format';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';
import type { PaginatedResponse } from '@/types';
import type { RussianDocument } from './types';

// ---------------------------------------------------------------------------
// Types & constants
// ---------------------------------------------------------------------------

type TabId = 'all' | 'DRAFT' | 'IN_REVIEW' | 'APPROVED';

const statusColorMap: Record<string, 'gray' | 'yellow' | 'green' | 'red'> = {
  draft: 'gray',
  in_review: 'yellow',
  approved: 'green',
  rejected: 'red',
};

const getStatusLabels = (): Record<string, string> => ({
  draft: t('russianDocs.m29StatusDraft'),
  in_review: t('russianDocs.m29StatusInReview'),
  approved: t('russianDocs.m29StatusApproved'),
  rejected: t('russianDocs.m29StatusRejected'),
});

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const M29ListPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [search, setSearch] = useState('');

  const { data: reportData, isLoading } = useQuery<PaginatedResponse<RussianDocument>>({
    queryKey: ['m29-reports'],
    queryFn: () => russianDocsApi.getDocuments({ documentType: 'M29' }),
  });

  const reports = reportData?.content ?? [];

  const filtered = useMemo(() => {
    let result = reports;
    if (activeTab === 'DRAFT') result = result.filter((r) => r.status === 'DRAFT');
    else if (activeTab === 'IN_REVIEW') result = result.filter((r) => r.status === 'IN_REVIEW');
    else if (activeTab === 'APPROVED') result = result.filter((r) => r.status === 'SIGNED');

    if (search) {
      const lower = search.toLowerCase();
      result = result.filter(
        (r) =>
          r.number.toLowerCase().includes(lower) ||
          (r.projectName ?? '').toLowerCase().includes(lower) ||
          (r.periodFrom ?? '').includes(lower) ||
          (r.periodTo ?? '').includes(lower),
      );
    }
    return result;
  }, [reports, activeTab, search]);

  const totalOveruse = 0;
  const totalSavings = 0;

  const tabCounts = useMemo(() => ({
    all: reports.length,
    draft: reports.filter((r) => r.status === 'DRAFT').length,
    in_review: reports.filter((r) => r.status === 'IN_REVIEW').length,
    approved: reports.filter((r) => r.status === 'SIGNED' || r.status === 'ON_SIGNING').length,
  }), [reports]);

  const columns = useMemo<ColumnDef<RussianDocument, unknown>[]>(() => {
    const statusLabels = getStatusLabels();
    return [
      {
        accessorKey: 'number',
        header: t('russianDocs.number'),
        size: 140,
        cell: ({ getValue }) => <span className="font-mono text-xs text-neutral-500 dark:text-neutral-400">{getValue<string>()}</span>,
      },
      {
        accessorKey: 'projectName',
        header: t('russianDocs.project'),
        size: 180,
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-neutral-900 dark:text-neutral-100">{row.original.projectName ?? '---'}</p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              {row.original.periodFrom && row.original.periodTo
                ? `${formatDate(row.original.periodFrom)} - ${formatDate(row.original.periodTo)}`
                : formatDate(row.original.documentDate)}
            </p>
          </div>
        ),
      },
      {
        accessorKey: 'status',
        header: t('russianDocs.status'),
        size: 130,
        cell: ({ getValue }) => <StatusBadge status={getValue<string>()} colorMap={statusColorMap} label={statusLabels[getValue<string>()] ?? getValue<string>()} />,
      },
      {
        accessorKey: 'lineCount',
        header: t('russianDocs.m29ColumnMaterials'),
        size: 110,
        cell: ({ getValue }) => <span className="tabular-nums">{getValue<number>()}</span>,
      },
      {
        accessorKey: 'totalAmount',
        header: t('russianDocs.amount'),
        size: 140,
        cell: ({ getValue }) => <span className="tabular-nums">{formatMoney(getValue<number>())}</span>,
      },
      {
        accessorKey: 'totalWithVat',
        header: t('russianDocs.m29ColumnWithVat'),
        size: 140,
        cell: ({ getValue }) => <span className="tabular-nums">{formatMoney(getValue<number>())}</span>,
      },
      {
        accessorKey: 'createdByName',
        header: t('russianDocs.responsible'),
        size: 140,
      },
    ];
  }, []);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('russianDocs.m29Title')}
        subtitle={t('russianDocs.m29Subtitle')}
        breadcrumbs={[{ label: t('russianDocs.breadcrumbHome'), href: '/' }, { label: t('russianDocs.breadcrumbSiteDocs') }, { label: t('russianDocs.breadcrumbM29') }]}
        actions={<Button iconLeft={<Plus size={16} />}>{t('russianDocs.newReport')}</Button>}
        tabs={[
          { id: 'all', label: t('russianDocs.tabAll'), count: tabCounts.all },
          { id: 'DRAFT', label: t('russianDocs.tabDraft'), count: tabCounts.draft },
          { id: 'IN_REVIEW', label: t('russianDocs.tabInReview'), count: tabCounts.in_review },
          { id: 'APPROVED', label: t('russianDocs.tabApproved'), count: tabCounts.approved },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as TabId)}
      />

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard icon={<FileText size={18} />} label={t('russianDocs.metricTotalReports')} value={reports.length} />
        <MetricCard icon={<AlertTriangle size={18} />} label={t('russianDocs.metricOveruse')} value={formatMoney(totalOveruse)} trend={totalOveruse > 0 ? { direction: 'up', value: formatMoney(totalOveruse) } : { direction: 'neutral', value: '0' }} />
        <MetricCard icon={<TrendingDown size={18} />} label={t('russianDocs.metricSavings')} value={formatMoney(totalSavings)} trend={{ direction: 'down', value: formatMoney(totalSavings) }} />
        <MetricCard
          icon={<TrendingUp size={18} />}
          label={t('russianDocs.tabInReview')}
          value={tabCounts.in_review}
        />
      </div>

      {/* Search */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input placeholder={t('russianDocs.searchByNumberProjectPeriod')} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>

      <DataTable<RussianDocument>
        data={filtered}
        columns={columns}
        loading={isLoading}
        onRowClick={(r) => navigate(`/russian-docs/${r.id}`)}
        enableRowSelection
        enableColumnVisibility
        enableExport
        pageSize={20}
        emptyTitle={t('russianDocs.m29EmptyTitle')}
        emptyDescription={t('russianDocs.m29EmptyDescription')}
      />
    </div>
  );
};

export default M29ListPage;
