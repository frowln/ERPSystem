import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { Search } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { DataTable } from '@/design-system/components/DataTable';
import {
  StatusBadge,
  closingDocStatusColorMap,
  closingDocStatusLabels,
} from '@/design-system/components/StatusBadge';
import { Input } from '@/design-system/components/FormField';
import { closingApi } from '@/api/closing';
import { formatMoney, formatDate } from '@/lib/format';
import { t } from '@/i18n';
import type { Ks2Document, PaginatedResponse } from '@/types';

type TabId = 'all' | 'DRAFT' | 'SUBMITTED' | 'SIGNED' | 'CLOSED';


const Ks2ListPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [search, setSearch] = useState('');

  const { data: ks2Data, isLoading } = useQuery<PaginatedResponse<Ks2Document>>({
    queryKey: ['ks2-documents'],
    queryFn: () => closingApi.getKs2Documents(),
  });

  const documents = ks2Data?.content ?? [];

  const filteredDocs = useMemo(() => {
    let filtered = documents;

    if (activeTab !== 'all') {
      filtered = filtered.filter((d) => d.status === activeTab);
    }

    if (search) {
      const lower = search.toLowerCase();
      filtered = filtered.filter(
        (d) =>
          d.name.toLowerCase().includes(lower) ||
          d.number.toLowerCase().includes(lower) ||
          (d.projectName ?? '').toLowerCase().includes(lower),
      );
    }

    return filtered;
  }, [documents, activeTab, search]);

  const tabCounts = useMemo(() => ({
    all: documents.length,
    draft: documents.filter((d) => d.status === 'DRAFT').length,
    submitted: documents.filter((d) => d.status === 'SUBMITTED').length,
    signed: documents.filter((d) => d.status === 'SIGNED').length,
    closed: documents.filter((d) => d.status === 'CLOSED').length,
  }), [documents]);

  const columns = useMemo<ColumnDef<Ks2Document, unknown>[]>(
    () => [
      {
        accessorKey: 'number',
        header: t('closing.ks2.colNumber'),
        size: 120,
        cell: ({ getValue }) => (
          <span className="font-mono text-neutral-500 dark:text-neutral-400 text-xs">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'name',
        header: t('closing.ks2.colName'),
        size: 300,
        cell: ({ getValue }) => (
          <span className="font-medium text-neutral-900 dark:text-neutral-100">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'documentDate',
        header: t('closing.ks2.colDate'),
        size: 110,
        cell: ({ getValue }) => (
          <span className="tabular-nums">{formatDate(getValue<string>())}</span>
        ),
      },
      {
        accessorKey: 'projectName',
        header: t('closing.ks2.colProject'),
        size: 180,
        cell: ({ getValue }) => (
          <span className="text-neutral-600">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'contractName',
        header: t('closing.ks2.colContract'),
        size: 140,
        cell: ({ getValue }) => (
          <span className="text-neutral-600 font-mono text-xs">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'status',
        header: t('closing.ks2.colStatus'),
        size: 130,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={closingDocStatusColorMap}
            label={closingDocStatusLabels[getValue<string>()] ?? getValue<string>()}
          />
        ),
      },
      {
        accessorKey: 'totalAmount',
        header: t('closing.ks2.colAmount'),
        size: 160,
        cell: ({ getValue }) => (
          <span className="font-medium tabular-nums text-right block">
            {formatMoney(getValue<number>())}
          </span>
        ),
      },
      {
        accessorKey: 'lineCount',
        header: t('closing.ks2.colVolume'),
        size: 80,
        cell: ({ row }) => (
          <span className="text-neutral-600 text-xs">{row.original.lineCount} {t('closing.ks2.posUnit')}</span>
        ),
      },
    ],
    [],
  );

  const handleRowClick = useCallback(
    (doc: Ks2Document) => navigate(`/ks2/${doc.id}`),
    [navigate],
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('closing.ks2.title')}
        subtitle={t('closing.ks2.subtitle', { count: documents.length })}
        breadcrumbs={[
          { label: t('closing.ks2.breadcrumbHome'), href: '/' },
          { label: t('closing.ks2.breadcrumbKs2') },
        ]}
        tabs={[
          { id: 'all', label: t('closing.ks2.tabAll'), count: tabCounts.all },
          { id: 'DRAFT', label: t('closing.ks2.tabDraft'), count: tabCounts.draft },
          { id: 'SUBMITTED', label: t('closing.ks2.tabSubmitted'), count: tabCounts.submitted },
          { id: 'SIGNED', label: t('closing.ks2.tabSigned'), count: tabCounts.signed },
          { id: 'CLOSED', label: t('closing.ks2.tabClosed'), count: tabCounts.closed },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as TabId)}
      />

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input
            placeholder={t('closing.ks2.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Table */}
      <DataTable<Ks2Document>
        data={filteredDocs}
        columns={columns}
        loading={isLoading}
        onRowClick={handleRowClick}
        enableColumnVisibility
        enableDensityToggle
        enableExport
        pageSize={20}
        emptyTitle={t('closing.ks2.emptyTitle')}
        emptyDescription={t('closing.ks2.emptyDescription')}
      />
    </div>
  );
};

export default Ks2ListPage;
