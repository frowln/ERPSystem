import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { Plus, Search, FileText, FilePlus2, ClipboardCheck, Archive } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { DataTable } from '@/design-system/components/DataTable';
import { MetricCard } from '@/design-system/components/MetricCard';
import {
  StatusBadge,
  russianDocStatusColorMap,
  russianDocStatusLabels,
  russianDocTypeColorMap,
  russianDocTypeLabels,
} from '@/design-system/components/StatusBadge';
import { Input, Select } from '@/design-system/components/FormField';
import { russianDocsApi } from '@/api/russianDocs';
import { formatDate, formatMoney } from '@/lib/format';
import { t } from '@/i18n';
import type { RussianDocument } from './types';

type TabId = 'all' | 'DRAFT' | 'IN_REVIEW' | 'SIGNED' | 'ARCHIVED';

const getTypeFilterOptions = () => [
  { value: '', label: t('russianDocs.allTypes') },
  { value: 'KS2', label: t('russianDocs.typeKs2') },
  { value: 'KS3', label: t('russianDocs.typeKs3') },
  { value: 'M29', label: t('russianDocs.typeM29') },
  { value: 'EXECUTIVE_SCHEME', label: t('russianDocs.typeExecScheme') },
  { value: 'HIDDEN_WORKS_ACT', label: t('russianDocs.typeHiddenWorksAct') },
  { value: 'GENERAL_JOURNAL', label: t('russianDocs.typeGeneralJournal') },
];

const DocumentListPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const { data: docData, isLoading } = useQuery({
    queryKey: ['russian-docs'],
    queryFn: () => russianDocsApi.getDocuments(),
  });

  const documents = docData?.content ?? [];

  const filteredDocs = useMemo(() => {
    let filtered = documents;

    if (activeTab === 'DRAFT') filtered = filtered.filter((d) => d.status === 'DRAFT');
    else if (activeTab === 'IN_REVIEW') filtered = filtered.filter((d) => ['IN_REVIEW', 'ON_SIGNING'].includes(d.status));
    else if (activeTab === 'SIGNED') filtered = filtered.filter((d) => d.status === 'SIGNED');
    else if (activeTab === 'ARCHIVED') filtered = filtered.filter((d) => d.status === 'ARCHIVED');

    if (typeFilter) filtered = filtered.filter((d) => d.documentType === typeFilter);

    if (search) {
      const lower = search.toLowerCase();
      filtered = filtered.filter(
        (d) =>
          d.number.toLowerCase().includes(lower) ||
          d.name.toLowerCase().includes(lower) ||
          (d.projectName ?? '').toLowerCase().includes(lower),
      );
    }

    return filtered;
  }, [documents, activeTab, typeFilter, search]);

  const tabCounts = useMemo(() => ({
    all: documents.length,
    draft: documents.filter((d) => d.status === 'DRAFT').length,
    in_review: documents.filter((d) => ['IN_REVIEW', 'ON_SIGNING'].includes(d.status)).length,
    signed: documents.filter((d) => d.status === 'SIGNED').length,
    archived: documents.filter((d) => d.status === 'ARCHIVED').length,
  }), [documents]);

  const metrics = useMemo(() => {
    const signedTotal = documents.filter((d) => d.status === 'SIGNED').reduce((s, d) => s + d.totalWithVat, 0);
    const pendingTotal = documents.filter((d) => ['IN_REVIEW', 'ON_SIGNING'].includes(d.status)).reduce((s, d) => s + d.totalWithVat, 0);
    return {
      total: documents.length,
      signedCount: documents.filter((d) => d.status === 'SIGNED').length,
      signedTotal,
      pendingTotal,
    };
  }, [documents]);

  const columns = useMemo<ColumnDef<RussianDocument, unknown>[]>(
    () => [
      {
        accessorKey: 'number',
        header: t('russianDocs.number'),
        size: 130,
        cell: ({ getValue }) => (
          <span className="font-mono text-neutral-500 dark:text-neutral-400 text-xs">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'name',
        header: t('russianDocs.docListColumnName'),
        size: 280,
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-neutral-900 dark:text-neutral-100 truncate max-w-[260px]">{row.original.name}</p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{row.original.projectName ?? '---'}</p>
          </div>
        ),
      },
      {
        accessorKey: 'documentType',
        header: t('russianDocs.docListColumnType'),
        size: 140,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={russianDocTypeColorMap}
            label={russianDocTypeLabels[getValue<string>()] ?? getValue<string>()}
          />
        ),
      },
      {
        accessorKey: 'status',
        header: t('russianDocs.status'),
        size: 130,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={russianDocStatusColorMap}
            label={russianDocStatusLabels[getValue<string>()] ?? getValue<string>()}
          />
        ),
      },
      {
        accessorKey: 'totalWithVat',
        header: t('russianDocs.docListColumnAmountWithVat'),
        size: 150,
        cell: ({ getValue }) => {
          const val = getValue<number>();
          return (
            <span className="tabular-nums text-neutral-700 dark:text-neutral-300">
              {val > 0 ? formatMoney(val) : '---'}
            </span>
          );
        },
      },
      {
        accessorKey: 'documentDate',
        header: t('russianDocs.date'),
        size: 110,
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
              navigate(`/russian-docs/${row.original.id}`);
            }}
          >
            {t('russianDocs.open')}
          </Button>
        ),
      },
    ],
    [navigate],
  );

  const handleRowClick = useCallback(
    (doc: RussianDocument) => navigate(`/russian-docs/${doc.id}`),
    [navigate],
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('russianDocs.docListTitle')}
        subtitle={t('russianDocs.docListSubtitle', { count: documents.length })}
        breadcrumbs={[
          { label: t('russianDocs.breadcrumbHome'), href: '/' },
          { label: t('russianDocs.breadcrumbExecDocs') },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="secondary" iconLeft={<FilePlus2 size={16} />} onClick={() => navigate('/russian-docs/ks2/new')}>
              {t('russianDocs.typeKs2')}
            </Button>
            <Button variant="secondary" iconLeft={<FilePlus2 size={16} />} onClick={() => navigate('/russian-docs/ks3/new')}>
              {t('russianDocs.typeKs3')}
            </Button>
            <Button iconLeft={<Plus size={16} />} onClick={() => navigate('/russian-docs/new')}>
              {t('russianDocs.newDocument')}
            </Button>
          </div>
        }
        tabs={[
          { id: 'all', label: t('russianDocs.tabAll'), count: tabCounts.all },
          { id: 'DRAFT', label: t('russianDocs.tabDrafts'), count: tabCounts.draft },
          { id: 'IN_REVIEW', label: t('russianDocs.tabInReview'), count: tabCounts.in_review },
          { id: 'SIGNED', label: t('russianDocs.tabSigned'), count: tabCounts.signed },
          { id: 'ARCHIVED', label: t('russianDocs.tabArchive'), count: tabCounts.archived },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as TabId)}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard icon={<FileText size={18} />} label={t('russianDocs.metricTotalDocs')} value={metrics.total} />
        <MetricCard icon={<ClipboardCheck size={18} />} label={t('russianDocs.metricSigned')} value={metrics.signedCount} />
        <MetricCard icon={<FileText size={18} />} label={t('russianDocs.metricSignedAmount')} value={formatMoney(metrics.signedTotal)} />
        <MetricCard icon={<Archive size={18} />} label={t('russianDocs.metricOnSigning')} value={formatMoney(metrics.pendingTotal)} />
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input placeholder={t('russianDocs.searchByNumberName')} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select options={getTypeFilterOptions()} value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="w-48" />
      </div>

      <DataTable<RussianDocument>
        data={filteredDocs}
        columns={columns}
        loading={isLoading}
        onRowClick={handleRowClick}
        enableRowSelection
        enableColumnVisibility
        enableDensityToggle
        enableExport
        pageSize={20}
        emptyTitle={t('russianDocs.docListEmptyTitle')}
        emptyDescription={t('russianDocs.docListEmptyDescription')}
      />
    </div>
  );
};

export default DocumentListPage;
