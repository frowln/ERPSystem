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
import type { Ks3Document, PaginatedResponse } from '@/types';

type TabId = 'all' | 'DRAFT' | 'SUBMITTED' | 'SIGNED' | 'CLOSED';


const Ks3ListPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [search, setSearch] = useState('');

  const { data: ks3Data, isLoading } = useQuery<PaginatedResponse<Ks3Document>>({
    queryKey: ['ks3-documents'],
    queryFn: () => closingApi.getKs3Documents(),
  });

  const documents = ks3Data?.content ?? [];

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
          d.number.toLowerCase().includes(lower),
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

  const columns = useMemo<ColumnDef<Ks3Document, unknown>[]>(
    () => [
      {
        accessorKey: 'number',
        header: 'Номер',
        size: 120,
        cell: ({ getValue }) => (
          <span className="font-mono text-neutral-500 dark:text-neutral-400 text-xs">{getValue<string>()}</span>
        ),
      },
      {
        id: 'period',
        header: 'Период',
        size: 180,
        cell: ({ row }) => (
          <span className="text-neutral-700 dark:text-neutral-300 tabular-nums text-xs">
            {formatDate(row.original.periodFrom)} - {formatDate(row.original.periodTo)}
          </span>
        ),
      },
      {
        accessorKey: 'name',
        header: 'Название',
        size: 280,
        cell: ({ getValue }) => (
          <span className="font-medium text-neutral-900 dark:text-neutral-100">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Статус',
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
        header: 'Сумма КС-2',
        size: 160,
        cell: ({ getValue }) => (
          <span className="font-medium tabular-nums text-right block">
            {formatMoney(getValue<number>())}
          </span>
        ),
      },
      {
        accessorKey: 'retentionAmount',
        header: 'Удержание',
        size: 140,
        cell: ({ row }) => (
          <span className="tabular-nums text-right block text-warning-600">
            {formatMoney(row.original.retentionAmount)} ({row.original.retentionPercent}%)
          </span>
        ),
      },
      {
        accessorKey: 'netAmount',
        header: 'Итого к оплате',
        size: 160,
        cell: ({ getValue }) => (
          <span className="font-semibold tabular-nums text-right block text-success-700">
            {formatMoney(getValue<number>())}
          </span>
        ),
      },
      {
        accessorKey: 'ks2Count',
        header: 'КС-2',
        size: 70,
        cell: ({ getValue }) => (
          <span className="text-neutral-600 text-xs">{getValue<number>()} акт</span>
        ),
      },
    ],
    [],
  );

  const handleRowClick = useCallback(
    (doc: Ks3Document) => navigate(`/ks3/${doc.id}`),
    [navigate],
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Справки КС-3"
        subtitle={`${documents.length} справок в системе`}
        breadcrumbs={[
          { label: 'Главная', href: '/' },
          { label: 'КС-3' },
        ]}
        tabs={[
          { id: 'all', label: 'Все', count: tabCounts.all },
          { id: 'DRAFT', label: 'Черновик', count: tabCounts.draft },
          { id: 'SUBMITTED', label: 'Передан', count: tabCounts.submitted },
          { id: 'SIGNED', label: 'Подписан', count: tabCounts.signed },
          { id: 'CLOSED', label: 'Закрыт', count: tabCounts.closed },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as TabId)}
      />

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input
            placeholder="Поиск по номеру, названию..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Table */}
      <DataTable<Ks3Document>
        data={filteredDocs}
        columns={columns}
        loading={isLoading}
        onRowClick={handleRowClick}
        enableColumnVisibility
        enableDensityToggle
        enableExport
        pageSize={20}
        emptyTitle="Нет справок КС-3"
        emptyDescription="Справки КС-3 формируются на основании актов КС-2"
      />
    </div>
  );
};

export default Ks3ListPage;
