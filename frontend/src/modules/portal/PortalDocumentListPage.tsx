import React, { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { Search, FileText, Download, File, Image, FileSpreadsheet, Clock } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { DataTable } from '@/design-system/components/DataTable';
import { MetricCard } from '@/design-system/components/MetricCard';
import { Button } from '@/design-system/components/Button';
import { Input, Select } from '@/design-system/components/FormField';
import { portalApi } from '@/api/portal';
import { formatDate, formatRelativeTime, formatFileSize } from '@/lib/format';
import type { PortalDocument } from './types';
import toast from 'react-hot-toast';

const categoryLabels: Record<string, string> = {
  act: 'Акт', drawing: 'Чертёж', specification: 'Спецификация', contract: 'Договор',
  estimate: 'Смета', permit: 'Разрешение', report: 'Отчёт', photo: 'Фото', other: 'Прочее',
};

const categoryFilterOptions = [
  { value: '', label: 'Все категории' },
  ...Object.entries(categoryLabels).map(([v, l]) => ({ value: v, label: l })),
];

const getFileIcon = (fileName: string) => {
  if (fileName.endsWith('.pdf')) return <File size={16} className="text-danger-500" />;
  if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) return <FileSpreadsheet size={16} className="text-success-500" />;
  if (fileName.endsWith('.jpg') || fileName.endsWith('.png') || fileName.endsWith('.zip')) return <Image size={16} className="text-primary-500" />;
  return <FileText size={16} className="text-neutral-400" />;
};

const PortalDocumentListPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const { data: docData, isLoading } = useQuery({
    queryKey: ['portal-documents'],
    queryFn: () => portalApi.getDocuments(),
  });

  const documents = docData?.content ?? [];

  const filteredDocuments = useMemo(() => {
    let filtered = documents;
    if (categoryFilter) filtered = filtered.filter((d) => d.category === categoryFilter);
    if (search) {
      const lower = search.toLowerCase();
      filtered = filtered.filter(
        (d) => d.title.toLowerCase().includes(lower) || d.fileName.toLowerCase().includes(lower) || d.projectName.toLowerCase().includes(lower),
      );
    }
    return filtered;
  }, [documents, categoryFilter, search]);

  const metrics = useMemo(() => ({
    total: documents.length,
    totalSize: documents.reduce((s, d) => s + d.fileSize, 0),
    recentCount: documents.filter((d) => {
      const shared = new Date(d.sharedAt);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return shared >= weekAgo;
    }).length,
    projectCount: new Set(documents.map((d) => d.projectId)).size,
  }), [documents]);

  const handleDownload = useCallback((doc: PortalDocument) => {
    toast.success(`Загрузка файла начата: ${doc.fileName}`);
  }, []);

  const columns = useMemo<ColumnDef<PortalDocument, unknown>[]>(() => [
    {
      accessorKey: 'fileName', header: '', size: 40,
      cell: ({ row }) => getFileIcon(row.original.fileName),
    },
    {
      accessorKey: 'title', header: 'Название', size: 280,
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-neutral-900 dark:text-neutral-100 truncate max-w-[260px]">{row.original.title}</p>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{row.original.fileName}</p>
        </div>
      ),
    },
    {
      accessorKey: 'category', header: 'Категория', size: 130,
      cell: ({ getValue }) => <span className="text-sm text-neutral-700 dark:text-neutral-300">{categoryLabels[getValue<string>()] ?? getValue<string>()}</span>,
    },
    {
      accessorKey: 'projectName', header: 'Проект', size: 180,
      cell: ({ getValue }) => <span className="text-neutral-700 dark:text-neutral-300 truncate">{getValue<string>()}</span>,
    },
    {
      accessorKey: 'uploadedByName', header: 'Загрузил', size: 140,
      cell: ({ getValue }) => <span className="text-neutral-700 dark:text-neutral-300">{getValue<string>()}</span>,
    },
    {
      accessorKey: 'version', header: 'Версия', size: 80,
      cell: ({ getValue }) => <span className="text-neutral-500 dark:text-neutral-400 tabular-nums">v{getValue<number>()}</span>,
    },
    {
      accessorKey: 'fileSize', header: 'Размер', size: 100,
      cell: ({ getValue }) => <span className="text-neutral-500 dark:text-neutral-400 tabular-nums">{formatFileSize(getValue<number>())}</span>,
    },
    {
      accessorKey: 'sharedAt', header: 'Дата', size: 110,
      cell: ({ getValue }) => <span className="text-neutral-600 tabular-nums">{formatDate(getValue<string>())}</span>,
    },
    {
      id: 'actions', header: '', size: 90,
      cell: ({ row }) => (
        <Button variant="ghost" size="xs" iconLeft={<Download size={14} />} onClick={(e) => { e.stopPropagation(); handleDownload(row.original); }}>
          Скачать
        </Button>
      ),
    },
  ], [handleDownload]);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Документы портала"
        subtitle={`${documents.length} документов доступно`}
        breadcrumbs={[
          { label: 'Главная', href: '/' },
          { label: 'Портал', href: '/portal' },
          { label: 'Документы' },
        ]}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard icon={<FileText size={18} />} label="Всего документов" value={metrics.total} />
        <MetricCard icon={<Download size={18} />} label="Общий размер" value={formatFileSize(metrics.totalSize)} />
        <MetricCard icon={<Clock size={18} />} label="За последнюю неделю" value={metrics.recentCount} />
        <MetricCard icon={<FileText size={18} />} label="Проектов" value={metrics.projectCount} />
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input placeholder="Поиск по названию, файлу..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select options={categoryFilterOptions} value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="w-48" />
      </div>

      <DataTable<PortalDocument>
        data={filteredDocuments}
        columns={columns}
        loading={isLoading}
        enableRowSelection
        enableColumnVisibility
        enableDensityToggle
        enableExport
        pageSize={20}
        emptyTitle="Нет доступных документов"
        emptyDescription="Документы появятся после предоставления доступа к проектам"
      />
    </div>
  );
};

export default PortalDocumentListPage;
