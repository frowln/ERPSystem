import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { Plus, Search, FileText, ClipboardList, CheckCircle } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { DataTable } from '@/design-system/components/DataTable';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { MetricCard } from '@/design-system/components/MetricCard';
import { Input, Select } from '@/design-system/components/FormField';
import { formatDate } from '@/lib/format';
import { ptoApi, type PtoDocument as PtoDocumentApi } from '@/api/pto';

interface PtoDocument {
  id: string;
  number: string;
  title: string;
  type: string;
  status: string;
  projectName: string;
  author: string;
  createdDate: string;
  approvedDate: string | null;
  section: string;
}


const typeLabels: Record<string, string> = {
  akt_ov: 'Акт освидетельствования',
  protocol: 'Протокол испытаний',
  journal: 'Журнал работ',
  pppr: 'ППР',
  scheme: 'Схема операционного контроля',
  instruction: 'Инструкция',
  certificate: 'Сертификат/паспорт',
};

const statusColorMap: Record<string, 'green' | 'yellow' | 'blue' | 'gray' | 'red'> = {
  draft: 'gray',
  in_review: 'yellow',
  approved: 'green',
  rejected: 'red',
  archived: 'blue',
};
const statusLabels: Record<string, string> = {
  draft: 'Черновик',
  in_review: 'На проверке',
  approved: 'Утверждён',
  rejected: 'Отклонён',
  archived: 'В архиве',
};

const PtoDocumentListPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState('');

  const { data: paginatedData, isLoading } = useQuery({
    queryKey: ['pto-documents'],
    queryFn: () => ptoApi.getDocuments(),
  });

  const documents: PtoDocument[] = (paginatedData?.content ?? []).map((d) => ({
    id: d.id,
    number: d.number,
    title: d.title,
    type: d.type,
    status: d.status,
    projectName: d.projectName,
    author: d.author,
    createdDate: d.createdDate,
    approvedDate: d.approvedDate,
    section: d.section,
  }));

  const filtered = useMemo(() => {
    let result = documents;
    if (activeTab !== 'all') result = result.filter((d) => d.status === activeTab);
    if (typeFilter) result = result.filter((d) => d.type === typeFilter);
    if (search) {
      const lower = search.toLowerCase();
      result = result.filter(
        (d) => d.title.toLowerCase().includes(lower) || d.number.toLowerCase().includes(lower),
      );
    }
    return result;
  }, [documents, activeTab, typeFilter, search]);

  const tabCounts = useMemo(() => ({
    all: documents.length,
    draft: documents.filter((d) => d.status === 'DRAFT').length,
    in_review: documents.filter((d) => d.status === 'IN_REVIEW').length,
    approved: documents.filter((d) => d.status === 'APPROVED').length,
  }), [documents]);

  const columns = useMemo<ColumnDef<PtoDocument, unknown>[]>(() => [
    {
      accessorKey: 'number',
      header: '№',
      size: 100,
      cell: ({ getValue }) => <span className="font-mono text-xs text-neutral-500 dark:text-neutral-400">{getValue<string>()}</span>,
    },
    {
      accessorKey: 'title',
      header: 'Наименование',
      size: 300,
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-neutral-900 dark:text-neutral-100">{row.original.title}</p>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{row.original.projectName}</p>
        </div>
      ),
    },
    {
      accessorKey: 'type',
      header: 'Тип',
      size: 180,
      cell: ({ getValue }) => <span className="text-neutral-600">{typeLabels[getValue<string>()] ?? getValue<string>()}</span>,
    },
    {
      accessorKey: 'section',
      header: 'Раздел',
      size: 80,
      cell: ({ getValue }) => <span className="font-mono text-xs">{getValue<string>()}</span>,
    },
    {
      accessorKey: 'status',
      header: 'Статус',
      size: 130,
      cell: ({ getValue }) => (
        <StatusBadge status={getValue<string>()} colorMap={statusColorMap} label={statusLabels[getValue<string>()]} />
      ),
    },
    {
      accessorKey: 'author',
      header: 'Автор',
      size: 140,
    },
    {
      accessorKey: 'createdDate',
      header: 'Дата создания',
      size: 120,
      cell: ({ getValue }) => <span className="tabular-nums">{formatDate(getValue<string>())}</span>,
    },
  ], []);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Документация ПТО"
        subtitle={`${documents.length} документов в системе`}
        breadcrumbs={[
          { label: 'Главная', href: '/' },
          { label: 'ПТО' },
          { label: 'Документы' },
        ]}
        actions={<Button iconLeft={<Plus size={16} />}>Новый документ</Button>}
        tabs={[
          { id: 'all', label: 'Все', count: tabCounts.all },
          { id: 'DRAFT', label: 'Черновики', count: tabCounts.draft },
          { id: 'IN_REVIEW', label: 'На проверке', count: tabCounts.in_review },
          { id: 'APPROVED', label: 'Утверждённые', count: tabCounts.approved },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <MetricCard icon={<FileText size={18} />} label="Всего документов" value={documents.length} />
        <MetricCard icon={<ClipboardList size={18} />} label="На проверке" value={tabCounts.in_review} />
        <MetricCard icon={<CheckCircle size={18} />} label="Утверждённых" value={tabCounts.approved} />
        <MetricCard icon={<FileText size={18} />} label="Черновиков" value={tabCounts.draft} />
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input placeholder="Поиск по номеру, названию..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select
          options={[
            { value: '', label: 'Все типы' },
            ...Object.entries(typeLabels).map(([v, l]) => ({ value: v, label: l })),
          ]}
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="w-56"
        />
      </div>

      <DataTable<PtoDocument>
        data={filtered}
        columns={columns}
        loading={isLoading}
        enableRowSelection
        enableColumnVisibility
        enableDensityToggle
        enableExport
        pageSize={20}
        emptyTitle="Нет документов"
        emptyDescription="Создайте первый документ ПТО"
      />
    </div>
  );
};

export default PtoDocumentListPage;
