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
import type { Document } from '@/types';

type TabId = 'all' | 'ACTIVE' | 'UNDER_REVIEW' | 'ARCHIVED';

const statusFilterOptions = [
  { value: '', label: 'Все статусы' },
  { value: 'DRAFT', label: documentStatusLowerLabels.DRAFT },
  { value: 'UNDER_REVIEW', label: documentStatusLowerLabels.UNDER_REVIEW },
  { value: 'APPROVED', label: documentStatusLowerLabels.APPROVED },
  { value: 'ACTIVE', label: documentStatusLowerLabels.ACTIVE },
  { value: 'ARCHIVED', label: documentStatusLowerLabels.ARCHIVED },
  { value: 'CANCELLED', label: documentStatusLowerLabels.CANCELLED },
];

const categoryFilterOptions = [
  { value: '', label: 'Все категории' },
  { value: 'CONTRACT', label: documentCategoryLabels.CONTRACT },
  { value: 'ESTIMATE', label: documentCategoryLabels.ESTIMATE },
  { value: 'SPECIFICATION', label: documentCategoryLabels.SPECIFICATION },
  { value: 'DRAWING', label: documentCategoryLabels.DRAWING },
  { value: 'PERMIT', label: documentCategoryLabels.PERMIT },
  { value: 'ACT', label: documentCategoryLabels.ACT },
  { value: 'INVOICE', label: documentCategoryLabels.INVOICE },
  { value: 'PROTOCOL', label: documentCategoryLabels.PROTOCOL },
  { value: 'CORRESPONDENCE', label: documentCategoryLabels.CORRESPONDENCE },
  { value: 'PHOTO', label: documentCategoryLabels.PHOTO },
  { value: 'REPORT', label: documentCategoryLabels.REPORT },
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
        header: 'Документ',
        size: 300,
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-neutral-900 dark:text-neutral-100">{row.original.title}</p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              {(row.original.documentNumber ?? 'Без номера')} · v{row.original.docVersion}
            </p>
          </div>
        ),
      },
      {
        accessorKey: 'category',
        header: 'Категория',
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
        header: 'Статус',
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
        header: 'Проект',
        size: 180,
        cell: ({ getValue }) => (
          <span className="text-neutral-700 dark:text-neutral-300">{getValue<string>() ?? '---'}</span>
        ),
      },
      {
        accessorKey: 'fileName',
        header: 'Файл',
        size: 220,
        cell: ({ row }) => (
          <div>
            <p className="text-neutral-900 dark:text-neutral-100 truncate max-w-[210px]">{row.original.fileName ?? 'Не загружен'}</p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{formatFileSize(row.original.fileSize)}</p>
          </div>
        ),
      },
      {
        accessorKey: 'authorName',
        header: 'Автор',
        size: 150,
      },
      {
        accessorKey: 'createdAt',
        header: 'Создан',
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
        title="Документы"
        subtitle={`${documents.length} документов в системе`}
        breadcrumbs={[
          { label: 'Главная', href: '/' },
          { label: 'Документы' },
        ]}
        actions={
          <Button
            iconLeft={<Plus size={16} />}
            onClick={() => {
              if (guardDemoModeAction('Создание документа')) return;
              navigate('/documents/new');
            }}
          >
            Новый документ
          </Button>
        }
        tabs={[
          { id: 'all', label: 'Все', count: tabCounts.all },
          { id: 'ACTIVE', label: 'Активные', count: tabCounts.active },
          { id: 'UNDER_REVIEW', label: 'На проверке', count: tabCounts.underReview },
          { id: 'ARCHIVED', label: 'Архив', count: tabCounts.archived },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as TabId)}
      />

      {isError && (
        <div className="mb-4 rounded-xl border border-warning-200 bg-warning-50 p-3 text-sm text-warning-800">
          Не удалось загрузить часть данных документов. Проверьте подключение и обновите страницу.
        </div>
      )}

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input
            placeholder="Поиск по названию, номеру, файлу, автору..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="pl-9"
          />
        </div>

        <Select
          options={statusFilterOptions}
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="w-48"
        />

        <Select
          options={categoryFilterOptions}
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
        emptyTitle="Документы не найдены"
        emptyDescription="Загрузите первый документ или измените фильтры"
      />
    </div>
  );
};

export default DocumentListPage;
