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
import type { RussianDocument } from './types';

type TabId = 'all' | 'DRAFT' | 'IN_REVIEW' | 'SIGNED' | 'ARCHIVED';

const typeFilterOptions = [
  { value: '', label: 'Все типы' },
  { value: 'KS2', label: 'КС-2' },
  { value: 'KS3', label: 'КС-3' },
  { value: 'M29', label: 'М-29' },
  { value: 'EXECUTIVE_SCHEME', label: 'Исп. схема' },
  { value: 'HIDDEN_WORKS_ACT', label: 'Акт скрытых работ' },
  { value: 'GENERAL_JOURNAL', label: 'Общий журнал' },
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
        header: '\u2116',
        size: 130,
        cell: ({ getValue }) => (
          <span className="font-mono text-neutral-500 dark:text-neutral-400 text-xs">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'name',
        header: 'Наименование',
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
        header: 'Тип',
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
        header: 'Статус',
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
        header: 'Сумма с НДС',
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
        header: 'Дата',
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
            Открыть
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
        title="Исполнительная документация"
        subtitle={`${documents.length} документов в системе`}
        breadcrumbs={[
          { label: 'Главная', href: '/' },
          { label: 'Исп. документация' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="secondary" iconLeft={<FilePlus2 size={16} />} onClick={() => navigate('/russian-docs/ks2/new')}>
              КС-2
            </Button>
            <Button variant="secondary" iconLeft={<FilePlus2 size={16} />} onClick={() => navigate('/russian-docs/ks3/new')}>
              КС-3
            </Button>
            <Button iconLeft={<Plus size={16} />} onClick={() => navigate('/russian-docs/new')}>
              Новый документ
            </Button>
          </div>
        }
        tabs={[
          { id: 'all', label: 'Все', count: tabCounts.all },
          { id: 'DRAFT', label: 'Черновики', count: tabCounts.draft },
          { id: 'IN_REVIEW', label: 'На проверке', count: tabCounts.in_review },
          { id: 'SIGNED', label: 'Подписанные', count: tabCounts.signed },
          { id: 'ARCHIVED', label: 'Архив', count: tabCounts.archived },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as TabId)}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard icon={<FileText size={18} />} label="Всего документов" value={metrics.total} />
        <MetricCard icon={<ClipboardCheck size={18} />} label="Подписано" value={metrics.signedCount} />
        <MetricCard icon={<FileText size={18} />} label="Подписано на сумму" value={formatMoney(metrics.signedTotal)} />
        <MetricCard icon={<Archive size={18} />} label="На подписании" value={formatMoney(metrics.pendingTotal)} />
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input placeholder="Поиск по номеру, названию..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select options={typeFilterOptions} value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="w-48" />
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
        emptyTitle="Нет документов"
        emptyDescription="Создайте первый документ исполнительной документации"
      />
    </div>
  );
};

export default DocumentListPage;
