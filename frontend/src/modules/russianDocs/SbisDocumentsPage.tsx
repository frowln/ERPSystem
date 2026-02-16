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
import { t } from '@/i18n';
import type { SbisDocument } from './types';

const sbisStatusColorMap: Record<string, 'gray' | 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'orange' | 'cyan'> = {
  draft: 'gray',
  sent: 'blue',
  delivered: 'cyan',
  signed: 'green',
  rejected: 'red',
  cancelled: 'gray',
};

const getSbisStatusLabels = (): Record<string, string> => ({
  draft: t('russianDocs.sbisStatusDraft'),
  sent: t('russianDocs.sbisStatusSent'),
  delivered: t('russianDocs.sbisStatusDelivered'),
  signed: t('russianDocs.sbisStatusSigned'),
  rejected: t('russianDocs.sbisStatusRejected'),
  cancelled: t('russianDocs.sbisStatusCancelled'),
});

const getSbisDocTypeLabels = (): Record<string, string> => ({
  invoice: t('russianDocs.sbisTypeInvoice'),
  act: t('russianDocs.sbisTypeAct'),
  waybill: t('russianDocs.sbisTypeWaybill'),
  power_of_attorney: t('russianDocs.sbisTypePowerOfAttorney'),
  contract: t('russianDocs.sbisTypeContract'),
  other: t('russianDocs.sbisTypeOther'),
});

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
    () => {
      const sbisStatusLabels = getSbisStatusLabels();
      const sbisDocTypeLabels = getSbisDocTypeLabels();
      return [
        {
          accessorKey: 'number',
          header: t('russianDocs.number'),
          size: 140,
          cell: ({ getValue }) => <span className="font-mono text-neutral-500 dark:text-neutral-400 text-xs">{getValue<string>()}</span>,
        },
        {
          accessorKey: 'name',
          header: t('russianDocs.document'),
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
          header: t('russianDocs.status'),
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
          header: t('russianDocs.counterparty'),
          size: 200,
          cell: ({ row }) => (
            <div>
              <p className="text-neutral-900 dark:text-neutral-100">{row.original.counterpartyName}</p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{t('russianDocs.inn')}: {row.original.counterpartyInn}</p>
            </div>
          ),
        },
        {
          accessorKey: 'totalAmount',
          header: t('russianDocs.amount'),
          size: 150,
          cell: ({ getValue }) => <span className="tabular-nums font-medium text-neutral-900 dark:text-neutral-100">{formatMoney(getValue<number>())}</span>,
        },
        {
          accessorKey: 'documentDate',
          header: t('russianDocs.date'),
          size: 110,
          cell: ({ getValue }) => <span className="tabular-nums text-neutral-700 dark:text-neutral-300">{formatDate(getValue<string>())}</span>,
        },
        {
          id: 'actions',
          header: '',
          size: 100,
          cell: ({ row }) => (
            row.original.status === 'DRAFT' ? (
              <Button variant="ghost" size="xs" iconLeft={<Send size={14} />}>{t('russianDocs.send')}</Button>
            ) : null
          ),
        },
      ];
    },
    [],
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('russianDocs.sbisTitle')}
        subtitle={t('russianDocs.sbisSubtitle', { count: documents.length })}
        breadcrumbs={[
          { label: t('russianDocs.breadcrumbHome'), href: '/' },
          { label: t('russianDocs.breadcrumbRussianDocs'), href: '/russian-docs' },
          { label: t('russianDocs.breadcrumbSbis') },
        ]}
        tabs={[
          { id: 'all', label: t('russianDocs.tabAll'), count: tabCounts.all },
          { id: 'DRAFT', label: t('russianDocs.tabDrafts'), count: tabCounts.draft },
          { id: 'SENT', label: t('russianDocs.tabSent'), count: tabCounts.sent },
          { id: 'SIGNED', label: t('russianDocs.tabSigned'), count: tabCounts.signed },
          { id: 'REJECTED', label: t('russianDocs.tabRejected'), count: tabCounts.rejected },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as TabId)}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard icon={<FileText size={18} />} label={t('russianDocs.metricTotalDocs')} value={metrics.total} />
        <MetricCard icon={<CheckCircle size={18} />} label={t('russianDocs.metricSignedAmount')} value={formatMoney(metrics.signedAmount)} />
        <MetricCard icon={<Clock size={18} />} label={t('russianDocs.metricTotalAmount')} value={formatMoney(metrics.totalAmount)} />
        <MetricCard
          icon={<AlertTriangle size={18} />}
          label={t('russianDocs.metricRejected')}
          value={metrics.rejected}
          trend={{ direction: metrics.rejected > 0 ? 'down' : 'neutral', value: metrics.rejected > 0 ? t('russianDocs.metricRequireAttention') : t('russianDocs.metricNone') }}
        />
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input placeholder={t('russianDocs.searchByNumberNameCounterparty')} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
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
        emptyTitle={t('russianDocs.sbisEmptyTitle')}
        emptyDescription={t('russianDocs.sbisEmptyDescription')}
      />
    </div>
  );
};

export default SbisDocumentsPage;
