import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { Search, Send, FileText, CheckCircle, AlertTriangle, Clock } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { DataTable } from '@/design-system/components/DataTable';
import { MetricCard } from '@/design-system/components/MetricCard';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { Input, Select } from '@/design-system/components/FormField';
import { sbisApi } from '@/api/sbis';
import { formatDate, formatMoney } from '@/lib/format';
import type { SbisDocument } from './types';

const sbisStatusColorMap: Record<string, 'gray' | 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'orange' | 'cyan'> = {
  draft: 'gray',
  sent: 'blue',
  delivered: 'cyan',
  signed: 'green',
  rejected: 'red',
  cancelled: 'gray',
};

const sbisStatusLabels: Record<string, string> = {
  draft: 'Черновик',
  sent: 'Отправлен',
  delivered: 'Доставлен',
  signed: 'Подписан',
  rejected: 'Отклонён',
  cancelled: 'Отменён',
};

const sbisDocTypeLabels: Record<string, string> = {
  invoice: 'Счёт-фактура',
  act: 'Акт',
  waybill: 'Накладная',
  power_of_attorney: 'Доверенность',
  contract: 'Договор',
  other: 'Прочее',
};

type TabId = 'all' | 'DRAFT' | 'SENT' | 'SIGNED' | 'REJECTED';

const SbisDocumentsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['sbis-documents'],
    queryFn: () => sbisApi.getDocuments(),
  });

  const documents = data?.content ?? [];

  const filtered = useMemo(() => {
    let result = documents;
    if (activeTab !== 'all') result = result.filter((d) => d.status === activeTab);
    if (search) {
      const lower = search.toLowerCase();
      result = result.filter(
        (d) =>
          d.number.toLowerCase().includes(lower) ||
          d.name.toLowerCase().includes(lower) ||
          d.counterpartyName.toLowerCase().includes(lower),
      );
    }
    return result;
  }, [documents, activeTab, search]);

  const tabCounts = useMemo(() => ({
    all: documents.length,
    draft: documents.filter((d) => d.status === 'DRAFT').length,
    sent: documents.filter((d) => ['SENT', 'DELIVERED'].includes(d.status)).length,
    signed: documents.filter((d) => d.status === 'SIGNED').length,
    rejected: documents.filter((d) => d.status === 'REJECTED').length,
  }), [documents]);

  const metrics = useMemo(() => {
    const totalAmount = documents.reduce((s, d) => s + d.totalAmount, 0);
    const signedAmount = documents.filter((d) => d.status === 'SIGNED').reduce((s, d) => s + d.totalAmount, 0);
    return {
      total: documents.length,
      totalAmount,
      signedAmount,
      rejected: documents.filter((d) => d.status === 'REJECTED').length,
    };
  }, [documents]);

  const columns = useMemo<ColumnDef<SbisDocument, unknown>[]>(
    () => [
      {
        accessorKey: 'number',
        header: '\u2116',
        size: 140,
        cell: ({ getValue }) => <span className="font-mono text-neutral-500 dark:text-neutral-400 text-xs">{getValue<string>()}</span>,
      },
      {
        accessorKey: 'name',
        header: 'Документ',
        size: 260,
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-neutral-900 dark:text-neutral-100 truncate max-w-[240px]">{row.original.name}</p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{sbisDocTypeLabels[row.original.documentType] ?? row.original.documentType}</p>
          </div>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Статус',
        size: 120,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={sbisStatusColorMap}
            label={sbisStatusLabels[getValue<string>()] ?? getValue<string>()}
          />
        ),
      },
      {
        accessorKey: 'counterpartyName',
        header: 'Контрагент',
        size: 200,
        cell: ({ row }) => (
          <div>
            <p className="text-neutral-900 dark:text-neutral-100">{row.original.counterpartyName}</p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">ИНН: {row.original.counterpartyInn}</p>
          </div>
        ),
      },
      {
        accessorKey: 'totalAmount',
        header: 'Сумма',
        size: 150,
        cell: ({ getValue }) => <span className="tabular-nums font-medium text-neutral-900 dark:text-neutral-100">{formatMoney(getValue<number>())}</span>,
      },
      {
        accessorKey: 'documentDate',
        header: 'Дата',
        size: 110,
        cell: ({ getValue }) => <span className="tabular-nums text-neutral-700 dark:text-neutral-300">{formatDate(getValue<string>())}</span>,
      },
      {
        id: 'actions',
        header: '',
        size: 100,
        cell: ({ row }) => (
          row.original.status === 'DRAFT' ? (
            <Button variant="ghost" size="xs" iconLeft={<Send size={14} />}>Отправить</Button>
          ) : null
        ),
      },
    ],
    [],
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Документы СБИС"
        subtitle={`${documents.length} документов`}
        breadcrumbs={[
          { label: 'Главная', href: '/' },
          { label: 'Российские документы', href: '/russian-docs' },
          { label: 'СБИС' },
        ]}
        tabs={[
          { id: 'all', label: 'Все', count: tabCounts.all },
          { id: 'DRAFT', label: 'Черновики', count: tabCounts.draft },
          { id: 'SENT', label: 'Отправленные', count: tabCounts.sent },
          { id: 'SIGNED', label: 'Подписанные', count: tabCounts.signed },
          { id: 'REJECTED', label: 'Отклонённые', count: tabCounts.rejected },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as TabId)}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard icon={<FileText size={18} />} label="Всего документов" value={metrics.total} />
        <MetricCard icon={<CheckCircle size={18} />} label="Подписано на сумму" value={formatMoney(metrics.signedAmount)} />
        <MetricCard icon={<Clock size={18} />} label="Общая сумма" value={formatMoney(metrics.totalAmount)} />
        <MetricCard
          icon={<AlertTriangle size={18} />}
          label="Отклонено"
          value={metrics.rejected}
          trend={{ direction: metrics.rejected > 0 ? 'down' : 'neutral', value: metrics.rejected > 0 ? 'Требуют внимания' : 'Нет' }}
        />
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input placeholder="Поиск по номеру, названию, контрагенту..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>

      <DataTable<SbisDocument>
        data={filtered ?? []}
        columns={columns}
        loading={isLoading}
        enableRowSelection
        enableColumnVisibility
        enableDensityToggle
        enableExport
        pageSize={20}
        emptyTitle="Нет документов СБИС"
        emptyDescription="Документы появятся после настройки интеграции с СБИС"
      />
    </div>
  );
};

export default SbisDocumentsPage;
