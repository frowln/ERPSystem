/**
 * Unified documents hub combining:
 * - General documents (/documents)
 * - Russian docs (KS-2, KS-3, EDO) (/russian-docs)
 * - PTO documents (/pto/documents)
 * - CDE documents (/cde/documents)
 *
 * This provides a single aggregated view with type filters, addressing audit item M15.
 */
import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import {
  Plus,
  Search,
  ChevronDown,
  FileText,
  FileCheck,
  ClipboardList,
  FolderOpen,
} from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { DataTable } from '@/design-system/components/DataTable';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { Input } from '@/design-system/components/FormField';
import { TableSkeleton } from '@/design-system/components/Skeleton';
import { EmptyState } from '@/design-system/components/EmptyState';
import { documentsApi } from '@/api/documents';
import { russianDocsApi } from '@/api/russianDocs';
import { ptoApi } from '@/modules/pto/api';
import { cdeApi } from '@/modules/cde/api';
import type { Document as BaseDocument } from '@/types';
import type { RussianDocument } from '@/modules/russianDocs/types';
import type { PtoDocument } from '@/modules/pto/types';
import type { DocumentContainer } from '@/modules/cde/api';
import { formatDate } from '@/lib/format';
import { t } from '@/i18n';
import { cn } from '@/lib/cn';

// ---------------------------------------------------------------------------
// Unified row type
// ---------------------------------------------------------------------------

type DocSource = 'GENERAL' | 'RUSSIAN' | 'PTO' | 'CDE';

interface UnifiedDocument {
  id: string;
  source: DocSource;
  typeBadge: string;
  title: string;
  number: string;
  status: string;
  createdAt: string;
  author: string;
  project: string;
}

// ---------------------------------------------------------------------------
// Source badge config
// ---------------------------------------------------------------------------

const sourceColorMap: Record<DocSource, 'blue' | 'red' | 'green' | 'purple'> = {
  GENERAL: 'blue',
  RUSSIAN: 'red',
  PTO: 'green',
  CDE: 'purple',
};

const getSourceLabels = (): Record<DocSource, string> => ({
  GENERAL: t('documents.title'),
  RUSSIAN: t('russianDocs.breadcrumbRussianDocs'),
  PTO: t('pto.breadcrumbPto'),
  CDE: t('cde.breadcrumbCDE'),
});

// ---------------------------------------------------------------------------
// Status color
// ---------------------------------------------------------------------------

const statusColor = (s: string): 'yellow' | 'blue' | 'green' | 'gray' | 'red' => {
  const upper = s.toUpperCase();
  if (['DRAFT', 'WIP', 'WORK_IN_PROGRESS'].includes(upper)) return 'yellow';
  if (['UNDER_REVIEW', 'IN_REVIEW', 'ON_SIGNING', 'SIGNING'].includes(upper)) return 'blue';
  if (['APPROVED', 'ACTIVE', 'SIGNED', 'PUBLISHED', 'SHARED'].includes(upper)) return 'green';
  if (['ARCHIVED', 'CANCELLED', 'EXPIRED'].includes(upper)) return 'gray';
  if (['REJECTED'].includes(upper)) return 'red';
  return 'gray';
};

// ---------------------------------------------------------------------------
// Tabs
// ---------------------------------------------------------------------------

type TabId = 'all' | 'GENERAL' | 'RUSSIAN' | 'PTO' | 'CDE';

// ---------------------------------------------------------------------------
// Normalizers
// ---------------------------------------------------------------------------

function normalizeGeneral(d: BaseDocument): UnifiedDocument {
  return {
    id: d.id,
    source: 'GENERAL',
    typeBadge: d.category ?? 'OTHER',
    title: d.title,
    number: d.documentNumber ?? '—',
    status: d.status,
    createdAt: d.createdAt,
    author: d.authorName ?? '—',
    project: d.projectName ?? '',
  };
}

function normalizeRussian(d: RussianDocument): UnifiedDocument {
  return {
    id: d.id,
    source: 'RUSSIAN',
    typeBadge: d.documentType,
    title: d.name,
    number: d.number,
    status: d.status,
    createdAt: d.createdAt,
    author: d.createdByName ?? '—',
    project: d.projectName ?? '',
  };
}

function normalizePto(d: PtoDocument): UnifiedDocument {
  return {
    id: d.id,
    source: 'PTO',
    typeBadge: d.type,
    title: d.title,
    number: d.number,
    status: d.status,
    createdAt: d.createdDate,
    author: d.author ?? '—',
    project: d.projectName ?? '',
  };
}

function normalizeCde(d: DocumentContainer): UnifiedDocument {
  return {
    id: d.id,
    source: 'CDE',
    typeBadge: d.classification,
    title: d.title,
    number: d.code,
    status: d.lifecycleState,
    createdAt: d.createdAt,
    author: d.authorName ?? '—',
    project: d.projectName ?? '',
  };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const UnifiedDocumentsPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);

  // ---- Data fetching ----
  const { data: generalData, isLoading: loadingGeneral } = useQuery({
    queryKey: ['unified-docs-general'],
    queryFn: () => documentsApi.getDocuments({ size: 200 }),
  });

  const { data: russianData, isLoading: loadingRussian } = useQuery({
    queryKey: ['unified-docs-russian'],
    queryFn: () => russianDocsApi.getDocuments({ size: 200 }),
  });

  const { data: ptoData, isLoading: loadingPto } = useQuery({
    queryKey: ['unified-docs-pto'],
    queryFn: () => ptoApi.getDocuments({ size: 200 }),
  });

  const { data: cdeData, isLoading: loadingCde } = useQuery({
    queryKey: ['unified-docs-cde'],
    queryFn: () => cdeApi.getAll({ size: 200 }),
  });

  const isLoading = loadingGeneral || loadingRussian || loadingPto || loadingCde;

  // ---- Unified items ----
  const allItems = useMemo<UnifiedDocument[]>(() => {
    const general = (generalData?.content ?? []).map(normalizeGeneral);
    const russian = (russianData?.content ?? []).map(normalizeRussian);
    const pto = (ptoData?.content ?? []).map(normalizePto);
    const cde = (cdeData?.content ?? []).map(normalizeCde);
    return [...general, ...russian, ...pto, ...cde].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }, [generalData, russianData, ptoData, cdeData]);

  // ---- Filtering ----
  const filteredItems = useMemo(() => {
    let items = allItems;
    if (activeTab !== 'all') items = items.filter((i) => i.source === activeTab);
    if (search) {
      const lower = search.toLowerCase();
      items = items.filter(
        (i) =>
          i.title.toLowerCase().includes(lower) ||
          i.number.toLowerCase().includes(lower) ||
          i.author.toLowerCase().includes(lower) ||
          i.project.toLowerCase().includes(lower) ||
          i.typeBadge.toLowerCase().includes(lower),
      );
    }
    return items;
  }, [allItems, activeTab, search]);

  // ---- Tab counts ----
  const tabCounts = useMemo(
    () => ({
      all: allItems.length,
      general: allItems.filter((i) => i.source === 'GENERAL').length,
      russian: allItems.filter((i) => i.source === 'RUSSIAN').length,
      pto: allItems.filter((i) => i.source === 'PTO').length,
      cde: allItems.filter((i) => i.source === 'CDE').length,
    }),
    [allItems],
  );

  // ---- Columns ----
  const columns = useMemo<ColumnDef<UnifiedDocument, unknown>[]>(() => {
    const sourceLabels = getSourceLabels();
    return [
      {
        accessorKey: 'source',
        header: t('documents.documentType'),
        size: 140,
        cell: ({ getValue }) => {
          const src = getValue<DocSource>();
          return (
            <StatusBadge
              status={src}
              colorMap={sourceColorMap}
              label={sourceLabels[src]}
            />
          );
        },
      },
      {
        accessorKey: 'title',
        header: t('documents.documentName'),
        size: 300,
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-neutral-900 dark:text-neutral-100 truncate max-w-[280px]">
              {row.original.title}
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              {row.original.typeBadge}
            </p>
          </div>
        ),
      },
      {
        accessorKey: 'number',
        header: t('russianDocs.number'),
        size: 100,
        cell: ({ getValue }) => (
          <span className="font-mono text-neutral-500 dark:text-neutral-400 text-xs">
            {getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: 'status',
        header: t('common.status'),
        size: 130,
        cell: ({ getValue }) => {
          const val = getValue<string>();
          return (
            <StatusBadge
              status={val}
              colorMap={{ [val]: statusColor(val) }}
              label={val}
            />
          );
        },
      },
      {
        accessorKey: 'createdAt',
        header: t('documents.uploadDate'),
        size: 110,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-xs">{formatDate(getValue<string>())}</span>
        ),
      },
      {
        accessorKey: 'author',
        header: t('documents.author'),
        size: 150,
        cell: ({ getValue }) => (
          <span className="text-neutral-700 dark:text-neutral-300 text-sm">
            {getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: 'project',
        header: t('russianDocs.project'),
        size: 160,
        cell: ({ getValue }) => (
          <span className="text-neutral-600 dark:text-neutral-400 text-sm truncate max-w-[140px]">
            {getValue<string>() || '—'}
          </span>
        ),
      },
    ];
  }, []);

  // ---- Row click ----
  const handleRowClick = useCallback(
    (row: UnifiedDocument) => {
      switch (row.source) {
        case 'GENERAL':
          navigate(`/documents`);
          break;
        case 'RUSSIAN':
          navigate(`/russian-docs/${row.id}`);
          break;
        case 'PTO':
          navigate(`/pto/documents/${row.id}`);
          break;
        case 'CDE':
          navigate(`/cde/documents/${row.id}`);
          break;
      }
    },
    [navigate],
  );

  // ---- Loading ----
  if (isLoading && allItems.length === 0) {
    return (
      <>
        <PageHeader title={t('documents.title')} />
        <TableSkeleton rows={8} />
      </>
    );
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('documents.title')}
        subtitle={`${allItems.length} ${t('documents.title').toLowerCase()}`}
        breadcrumbs={[
          { label: t('common.home'), href: '/' },
          { label: t('documents.title') },
        ]}
        actions={
          <div className="flex gap-2">
            {/* Create dropdown */}
            <div className="relative">
              <Button
                iconLeft={<Plus size={16} />}
                onClick={() => setCreateOpen(!createOpen)}
              >
                {t('common.create')}
                <ChevronDown size={14} className="ml-1" />
              </Button>
              {createOpen && (
                <div className="absolute right-0 top-full mt-1 z-50 w-64 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 shadow-lg py-1 animate-fade-in">
                  <button
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                    onClick={() => {
                      setCreateOpen(false);
                      navigate('/documents');
                    }}
                  >
                    <FileText size={14} className="text-blue-500" />
                    {t('documents.uploadDocument')}
                  </button>
                  <button
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                    onClick={() => {
                      setCreateOpen(false);
                      navigate('/russian-docs/create');
                    }}
                  >
                    <FileCheck size={14} className="text-red-500" />
                    {t('russianDocs.newDocument')}
                  </button>
                  <button
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                    onClick={() => {
                      setCreateOpen(false);
                      navigate('/pto/documents/new');
                    }}
                  >
                    <ClipboardList size={14} className="text-green-500" />
                    {t('pto.breadcrumbPto')}
                  </button>
                  <button
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                    onClick={() => {
                      setCreateOpen(false);
                      navigate('/cde/documents');
                    }}
                  >
                    <FolderOpen size={14} className="text-purple-500" />
                    {t('cde.breadcrumbCDE')}
                  </button>
                </div>
              )}
            </div>
          </div>
        }
        tabs={[
          { id: 'all', label: t('common.all'), count: tabCounts.all },
          { id: 'GENERAL', label: t('documents.title'), count: tabCounts.general },
          { id: 'RUSSIAN', label: t('russianDocs.breadcrumbRussianDocs'), count: tabCounts.russian },
          { id: 'PTO', label: t('pto.breadcrumbPto'), count: tabCounts.pto },
          { id: 'CDE', label: t('cde.breadcrumbCDE'), count: tabCounts.cde },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as TabId)}
      />

      {/* Search */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-md">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
          />
          <Input
            placeholder={t('documents.list.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <DocSummaryCard
          icon={<FileText size={18} className="text-blue-500" />}
          label={t('documents.title')}
          count={tabCounts.general}
          color="blue"
        />
        <DocSummaryCard
          icon={<FileCheck size={18} className="text-red-500" />}
          label={t('russianDocs.breadcrumbRussianDocs')}
          count={tabCounts.russian}
          color="red"
        />
        <DocSummaryCard
          icon={<ClipboardList size={18} className="text-green-500" />}
          label={t('pto.breadcrumbPto')}
          count={tabCounts.pto}
          color="green"
        />
        <DocSummaryCard
          icon={<FolderOpen size={18} className="text-purple-500" />}
          label={t('cde.breadcrumbCDE')}
          count={tabCounts.cde}
          color="purple"
        />
      </div>

      {/* Table */}
      <DataTable<UnifiedDocument>
        data={filteredItems}
        columns={columns}
        loading={isLoading}
        enableColumnVisibility
        enableDensityToggle
        enableExport
        pageSize={20}
        onRowClick={handleRowClick}
        emptyTitle={t('documents.emptyState')}
        emptyDescription={t('documents.emptyStateDescription')}
      />
    </div>
  );
};

// ---------------------------------------------------------------------------
// Summary card mini component
// ---------------------------------------------------------------------------

interface DocSummaryCardProps {
  icon: React.ReactNode;
  label: string;
  count: number;
  color: 'blue' | 'red' | 'green' | 'purple';
}

const docColorBg: Record<string, string> = {
  blue: 'bg-blue-50 dark:bg-blue-950/30',
  red: 'bg-red-50 dark:bg-red-950/30',
  green: 'bg-green-50 dark:bg-green-950/30',
  purple: 'bg-purple-50 dark:bg-purple-950/30',
};

const DocSummaryCard: React.FC<DocSummaryCardProps> = ({ icon, label, count, color }) => (
  <div
    className={cn(
      'flex items-center gap-3 px-4 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700',
      docColorBg[color],
    )}
  >
    {icon}
    <div>
      <p className="text-sm text-neutral-600 dark:text-neutral-400">{label}</p>
      <p className="text-xl font-semibold text-neutral-900 dark:text-white">{count}</p>
    </div>
  </div>
);

export default UnifiedDocumentsPage;
