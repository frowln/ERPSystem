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
import { t } from '@/i18n';

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


const getTypeLabels = (): Record<string, string> => ({
  akt_ov: t('pto.docListTypeAktOv'),
  protocol: t('pto.docListTypeProtocol'),
  journal: t('pto.docListTypeJournal'),
  pppr: t('pto.docListTypePppr'),
  scheme: t('pto.docListTypeScheme'),
  instruction: t('pto.docListTypeInstruction'),
  certificate: t('pto.docListTypeCertificate'),
});

const statusColorMap: Record<string, 'green' | 'yellow' | 'blue' | 'gray' | 'red'> = {
  draft: 'gray',
  in_review: 'yellow',
  approved: 'green',
  rejected: 'red',
  archived: 'blue',
};

const getStatusLabels = (): Record<string, string> => ({
  draft: t('pto.docListStatusDraft'),
  in_review: t('pto.docListStatusInReview'),
  approved: t('pto.docListStatusApproved'),
  rejected: t('pto.docListStatusRejected'),
  archived: t('pto.docListStatusArchived'),
});

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

  const typeLabels = getTypeLabels();
  const statusLabels = getStatusLabels();

  const columns = useMemo<ColumnDef<PtoDocument, unknown>[]>(() => [
    {
      accessorKey: 'number',
      header: t('pto.docListColNumber'),
      size: 100,
      cell: ({ getValue }) => <span className="font-mono text-xs text-neutral-500 dark:text-neutral-400">{getValue<string>()}</span>,
    },
    {
      accessorKey: 'title',
      header: t('pto.docListColTitle'),
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
      header: t('pto.docListColType'),
      size: 180,
      cell: ({ getValue }) => <span className="text-neutral-600">{typeLabels[getValue<string>()] ?? getValue<string>()}</span>,
    },
    {
      accessorKey: 'section',
      header: t('pto.docListColSection'),
      size: 80,
      cell: ({ getValue }) => <span className="font-mono text-xs">{getValue<string>()}</span>,
    },
    {
      accessorKey: 'status',
      header: t('pto.docListColStatus'),
      size: 130,
      cell: ({ getValue }) => (
        <StatusBadge status={getValue<string>()} colorMap={statusColorMap} label={statusLabels[getValue<string>()]} />
      ),
    },
    {
      accessorKey: 'author',
      header: t('pto.docListColAuthor'),
      size: 140,
    },
    {
      accessorKey: 'createdDate',
      header: t('pto.docListColCreatedDate'),
      size: 120,
      cell: ({ getValue }) => <span className="tabular-nums">{formatDate(getValue<string>())}</span>,
    },
  ], [typeLabels, statusLabels]);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('pto.docListTitle')}
        subtitle={t('pto.docListSubtitle', { count: String(documents.length) })}
        breadcrumbs={[
          { label: t('pto.breadcrumbHome'), href: '/' },
          { label: t('pto.breadcrumbPto') },
          { label: t('pto.breadcrumbDocuments') },
        ]}
        actions={<Button iconLeft={<Plus size={16} />}>{t('pto.docListNewDocument')}</Button>}
        tabs={[
          { id: 'all', label: t('pto.docListTabAll'), count: tabCounts.all },
          { id: 'DRAFT', label: t('pto.docListTabDrafts'), count: tabCounts.draft },
          { id: 'IN_REVIEW', label: t('pto.docListTabInReview'), count: tabCounts.in_review },
          { id: 'APPROVED', label: t('pto.docListTabApproved'), count: tabCounts.approved },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <MetricCard icon={<FileText size={18} />} label={t('pto.docListMetricTotal')} value={documents.length} />
        <MetricCard icon={<ClipboardList size={18} />} label={t('pto.docListMetricInReview')} value={tabCounts.in_review} />
        <MetricCard icon={<CheckCircle size={18} />} label={t('pto.docListMetricApproved')} value={tabCounts.approved} />
        <MetricCard icon={<FileText size={18} />} label={t('pto.docListMetricDrafts')} value={tabCounts.draft} />
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input placeholder={t('pto.docListSearchPlaceholder')} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select
          options={[
            { value: '', label: t('pto.docListAllTypes') },
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
        emptyTitle={t('pto.docListEmptyTitle')}
        emptyDescription={t('pto.docListEmptyDescription')}
      />
    </div>
  );
};

export default PtoDocumentListPage;
