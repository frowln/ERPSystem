import React, { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { Plus, Search } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { DataTable } from '@/design-system/components/DataTable';
import { StatusBadge, documentStatusLowerColorMap, documentStatusLowerLabels, documentCategoryColorMap, documentCategoryLabels } from '@/design-system/components/StatusBadge';
import { Input, Select } from '@/design-system/components/FormField';
import { documentsApi } from '@/api/documents';
import { formatDate, formatFileSize } from '@/lib/format';
import { guardDemoModeAction } from '@/lib/demoMode';
import { t } from '@/i18n';
import type { Document } from '@/types';

type TabId = 'all' | 'ACTIVE' | 'UNDER_REVIEW' | 'ARCHIVED';

const getStatusFilterOptions = () => [
  { value: '', label: t('documents.list.allStatuses') },
  { value: 'DRAFT', label: documentStatusLowerLabels.DRAFT },
  { value: 'UNDER_REVIEW', label: documentStatusLowerLabels.UNDER_REVIEW },
  { value: 'APPROVED', label: documentStatusLowerLabels.APPROVED },
  { value: 'ACTIVE', label: documentStatusLowerLabels.ACTIVE },
  { value: 'ARCHIVED', label: documentStatusLowerLabels.ARCHIVED },
  { value: 'CANCELLED', label: documentStatusLowerLabels.CANCELLED },
];

const getCategoryFilterOptions = () => [
  { value: '', label: t('documents.list.allCategories') },
  { value: 'CONTRACT', label: documentCategoryLabels.CONTRACT },
  { value: 'APPENDIX', label: documentCategoryLabels.APPENDIX },
  { value: 'ESTIMATE', label: documentCategoryLabels.ESTIMATE },
  { value: 'LOCAL_ESTIMATE', label: documentCategoryLabels.LOCAL_ESTIMATE },
  { value: 'SPECIFICATION', label: documentCategoryLabels.SPECIFICATION },
  { value: 'DRAWING', label: documentCategoryLabels.DRAWING },
  { value: 'DESIGN_DOC', label: documentCategoryLabels.DESIGN_DOC },
  { value: 'PERMIT', label: documentCategoryLabels.PERMIT },
  { value: 'ACT', label: documentCategoryLabels.ACT },
  { value: 'INVOICE', label: documentCategoryLabels.INVOICE },
  { value: 'COMMERCIAL_PROPOSAL', label: documentCategoryLabels.COMMERCIAL_PROPOSAL },
  { value: 'PROTOCOL', label: documentCategoryLabels.PROTOCOL },
  { value: 'CORRESPONDENCE', label: documentCategoryLabels.CORRESPONDENCE },
  { value: 'CERTIFICATE', label: documentCategoryLabels.CERTIFICATE },
  { value: 'SCHEDULE', label: documentCategoryLabels.SCHEDULE },
  { value: 'PHOTO', label: documentCategoryLabels.PHOTO },
  { value: 'REPORT', label: documentCategoryLabels.REPORT },
  { value: 'TECHNICAL', label: documentCategoryLabels.TECHNICAL },
  { value: 'OTHER', label: documentCategoryLabels.OTHER },
];

const DocumentListPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const { data: documentsData, isLoading, isError } = useQuery({
    queryKey: ['DOCUMENTS'],
    queryFn: () => documentsApi.getDocuments({ size: 200 }),
  });

  const documents = useMemo(() => documentsData?.content ?? [], [documentsData]);

  const filteredDocuments = useMemo(() => {
    let filtered = documents;

    if (activeTab === 'ACTIVE') {
      filtered = filtered.filter((doc) => doc.status === 'ACTIVE' || doc.status === 'APPROVED');
    } else if (activeTab === 'UNDER_REVIEW') {
      filtered = filtered.filter((doc) => doc.status === 'UNDER_REVIEW');
    } else if (activeTab === 'ARCHIVED') {
      filtered = filtered.filter((doc) => doc.status === 'ARCHIVED');
    }

    if (statusFilter) {
      filtered = filtered.filter((doc) => doc.status === statusFilter);
    }

    if (categoryFilter) {
      filtered = filtered.filter((doc) => doc.category === categoryFilter);
    }

    if (search.trim()) {
      const query = search.trim().toLowerCase();
      filtered = filtered.filter((doc) =>
        doc.title.toLowerCase().includes(query)
        || (doc.documentNumber ?? '').toLowerCase().includes(query)
        || (doc.fileName ?? '').toLowerCase().includes(query)
        || (doc.projectName ?? '').toLowerCase().includes(query)
        || (doc.authorName ?? '').toLowerCase().includes(query),
      );
    }

    return filtered;
  }, [activeTab, categoryFilter, documents, search, statusFilter]);

  const tabCounts = useMemo(() => ({
    all: documents.length,
    active: documents.filter((doc) => doc.status === 'ACTIVE' || doc.status === 'APPROVED').length,
    underReview: documents.filter((doc) => doc.status === 'UNDER_REVIEW').length,
    archived: documents.filter((doc) => doc.status === 'ARCHIVED').length,
  }), [documents]);

  const columns = useMemo<ColumnDef<Document, unknown>[]>(
    () => [
      {
        accessorKey: 'title',
        header: t('documents.list.colDocument'),
        size: 300,
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-neutral-900 dark:text-neutral-100">{row.original.title}</p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              {(row.original.documentNumber ?? t('documents.list.noNumber'))} · v{row.original.docVersion}
            </p>
          </div>
        ),
      },
      {
        accessorKey: 'category',
        header: t('documents.list.colCategory'),
        size: 140,
        cell: ({ getValue }) => {
          const category = getValue<string>();
          return (
            <StatusBadge
              status={category}
              colorMap={documentCategoryColorMap}
              label={documentCategoryLabels[category] ?? category}
            />
          );
        },
      },
      {
        accessorKey: 'status',
        header: t('documents.list.colStatus'),
        size: 140,
        cell: ({ getValue }) => {
          const status = getValue<string>();
          return (
            <StatusBadge
              status={status}
              colorMap={documentStatusLowerColorMap}
              label={documentStatusLowerLabels[status] ?? status}
            />
          );
        },
      },
      {
        accessorKey: 'projectName',
        header: t('documents.list.colProject'),
        size: 180,
        cell: ({ getValue }) => (
          <span className="text-neutral-700 dark:text-neutral-300">{getValue<string>() ?? '---'}</span>
        ),
      },
      {
        accessorKey: 'fileName',
        header: t('documents.list.colFile'),
        size: 220,
        cell: ({ row }) => (
          <div>
            <p className="text-neutral-900 dark:text-neutral-100 truncate max-w-[210px]">{row.original.fileName ?? t('documents.list.notUploaded')}</p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{formatFileSize(row.original.fileSize)}</p>
          </div>
        ),
      },
      {
        accessorKey: 'authorName',
        header: t('documents.list.colAuthor'),
        size: 150,
      },
      {
        accessorKey: 'createdAt',
        header: t('documents.list.colCreated'),
        size: 120,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-neutral-700 dark:text-neutral-300">{formatDate(getValue<string>())}</span>
        ),
      },
    ],
    [],
  );

  const handleRowClick = useCallback((document: Document) => {
    navigate(`/documents/${document.id}/edit`);
  }, [navigate]);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('documents.list.title')}
        subtitle={t('documents.list.subtitle', { count: documents.length })}
        breadcrumbs={[
          { label: t('documents.list.breadcrumbHome'), href: '/' },
          { label: t('documents.list.breadcrumbDocuments') },
        ]}
        actions={
          <Button
            iconLeft={<Plus size={16} />}
            onClick={() => {
              if (guardDemoModeAction(t('documents.list.demoCreateAction'))) return;
              navigate('/documents/new');
            }}
          >
            {t('documents.list.newDocument')}
          </Button>
        }
        tabs={[
          { id: 'all', label: t('documents.list.tabAll'), count: tabCounts.all },
          { id: 'ACTIVE', label: t('documents.list.tabActive'), count: tabCounts.active },
          { id: 'UNDER_REVIEW', label: t('documents.list.tabUnderReview'), count: tabCounts.underReview },
          { id: 'ARCHIVED', label: t('documents.list.tabArchived'), count: tabCounts.archived },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as TabId)}
      />

      {isError && (
        <div className="mb-4 rounded-xl border border-warning-200 bg-warning-50 p-3 text-sm text-warning-800">
          {t('documents.list.loadError')}
        </div>
      )}

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input
            placeholder={t('documents.list.searchPlaceholder')}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="pl-9"
          />
        </div>

        <Select
          options={getStatusFilterOptions()}
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="w-48"
        />

        <Select
          options={getCategoryFilterOptions()}
          value={categoryFilter}
          onChange={(event) => setCategoryFilter(event.target.value)}
          className="w-56"
        />
      </div>

      <DataTable<Document>
        data={filteredDocuments}
        columns={columns}
        loading={isLoading}
        onRowClick={handleRowClick}
        enableColumnVisibility
        enableDensityToggle
        enableExport
        pageSize={20}
        emptyTitle={t('documents.list.emptyTitle')}
        emptyDescription={t('documents.list.emptyDescription')}
      />
    </div>
  );
};

export default DocumentListPage;
