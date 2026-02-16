import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { Search, Send, PenTool, FileCheck, FileText, AlertTriangle, Shield } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { DataTable } from '@/design-system/components/DataTable';
import { MetricCard } from '@/design-system/components/MetricCard';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { Input, Select } from '@/design-system/components/FormField';
import { edoApi } from '@/api/edo';
import { formatDate, formatMoney } from '@/lib/format';
import { t } from '@/i18n';
import type { EdoDocument } from './types';

const edoStatusColorMap: Record<string, 'gray' | 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'orange' | 'cyan'> = {
  created: 'gray',
  signing: 'yellow',
  signed: 'cyan',
  sent: 'blue',
  delivered: 'green',
  rejected: 'red',
  expired: 'orange',
};

const getEdoStatusLabels = (): Record<string, string> => ({
  created: t('russianDocs.edoStatusCreated'),
  signing: t('russianDocs.edoStatusSigning'),
  signed: t('russianDocs.edoStatusSigned'),
  sent: t('russianDocs.edoStatusSent'),
  delivered: t('russianDocs.edoStatusDelivered'),
  rejected: t('russianDocs.edoStatusRejected'),
  expired: t('russianDocs.edoStatusExpired'),
});

const edoProviderColorMap: Record<string, 'gray' | 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'orange' | 'cyan'> = {
  diadoc: 'blue',
  sbis: 'green',
  taxcom: 'purple',
  kaluga_astral: 'orange',
  other: 'gray',
};

const getEdoProviderLabels = (): Record<string, string> => ({
  diadoc: t('russianDocs.edoProviderDiadoc'),
  sbis: t('russianDocs.edoProviderSbis'),
  taxcom: t('russianDocs.edoProviderTaxcom'),
  kaluga_astral: t('russianDocs.edoProviderKalugaAstral'),
  other: t('russianDocs.edoProviderOther'),
});

type TabId = 'all' | 'SIGNING' | 'DELIVERED' | 'REJECTED';

const EdoDocumentsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['edo-documents'],
    queryFn: () => edoApi.getDocuments(),
  });

  const documents = data?.content ?? [];

  const filtered = useMemo(() => {
    let result = documents;
    if (activeTab !== 'all') {
      if (activeTab === 'SIGNING') result = result.filter((d) => d.status === 'SIGNING' || d.status === 'CREATED');
      else result = result.filter((d) => d.status === activeTab);
    }
    if (search) {
      const lower = search.toLowerCase();
      result = result.filter(
        (d) =>
          d.number.toLowerCase().includes(lower) ||
          d.name.toLowerCase().includes(lower) ||
          d.recipientName.toLowerCase().includes(lower) ||
          d.senderName.toLowerCase().includes(lower),
      );
    }
    return result;
  }, [documents, activeTab, search]);

  const tabCounts = useMemo(() => ({
    all: documents.length,
    signing: documents.filter((d) => d.status === 'SIGNING' || d.status === 'CREATED').length,
    delivered: documents.filter((d) => d.status === 'DELIVERED' || d.status === 'SIGNED').length,
    rejected: documents.filter((d) => d.status === 'REJECTED').length,
  }), [documents]);

  const metrics = useMemo(() => ({
    total: documents.length,
    signing: documents.filter((d) => d.status === 'SIGNING').length,
    delivered: documents.filter((d) => d.status === 'DELIVERED').length,
    rejected: documents.filter((d) => d.status === 'REJECTED').length,
  }), [documents]);

  const columns = useMemo<ColumnDef<EdoDocument, unknown>[]>(
    () => {
      const edoStatusLabels = getEdoStatusLabels();
      const edoProviderLabels = getEdoProviderLabels();
      return [
        {
          accessorKey: 'number',
          header: t('russianDocs.number'),
          size: 130,
          cell: ({ getValue }) => <span className="font-mono text-neutral-500 dark:text-neutral-400 text-xs">{getValue<string>()}</span>,
        },
        {
          accessorKey: 'name',
          header: t('russianDocs.document'),
          size: 250,
          cell: ({ row }) => (
            <div>
              <p className="font-medium text-neutral-900 dark:text-neutral-100 truncate max-w-[230px]">{row.original.name}</p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{row.original.documentType}</p>
            </div>
          ),
        },
        {
          accessorKey: 'status',
          header: t('russianDocs.status'),
          size: 130,
          cell: ({ getValue }) => (
            <StatusBadge
              status={getValue<string>()}
              colorMap={edoStatusColorMap}
              label={edoStatusLabels[getValue<string>()] ?? getValue<string>()}
            />
          ),
        },
        {
          accessorKey: 'provider',
          header: t('russianDocs.edoOperator'),
          size: 120,
          cell: ({ getValue }) => (
            <StatusBadge
              status={getValue<string>()}
              colorMap={edoProviderColorMap}
              label={edoProviderLabels[getValue<string>()] ?? getValue<string>()}
            />
          ),
        },
        {
          accessorKey: 'recipientName',
          header: t('russianDocs.recipient'),
          size: 200,
          cell: ({ row }) => (
            <div>
              <p className="text-neutral-900 dark:text-neutral-100 truncate max-w-[180px]">{row.original.recipientName}</p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{t('russianDocs.inn')}: {row.original.recipientInn}</p>
            </div>
          ),
        },
        {
          id: 'signatures',
          header: t('russianDocs.signatures'),
          size: 100,
          cell: ({ row }) => {
            const { signatureCount, requiredSignatures } = row.original;
            const isComplete = signatureCount >= requiredSignatures;
            return (
              <span className={`tabular-nums font-medium ${isComplete ? 'text-success-600' : 'text-warning-600'}`}>
                {signatureCount}/{requiredSignatures}
              </span>
            );
          },
        },
        {
          accessorKey: 'totalAmount',
          header: t('russianDocs.amount'),
          size: 140,
          cell: ({ getValue }) => {
            const val = getValue<number>();
            return val ? <span className="tabular-nums font-medium text-neutral-900 dark:text-neutral-100">{formatMoney(val)}</span> : <span className="text-neutral-400">---</span>;
          },
        },
        {
          accessorKey: 'documentDate',
          header: t('russianDocs.date'),
          size: 100,
          cell: ({ getValue }) => <span className="tabular-nums text-neutral-700 dark:text-neutral-300">{formatDate(getValue<string>())}</span>,
        },
        {
          id: 'actions',
          header: '',
          size: 100,
          cell: ({ row }) => {
            if (row.original.status === 'CREATED' || row.original.status === 'SIGNING') {
              return (
                <Button variant="ghost" size="xs" iconLeft={<PenTool size={14} />}>{t('russianDocs.sign')}</Button>
              );
            }
            return null;
          },
        },
      ];
    },
    [],
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('russianDocs.edoTitle')}
        subtitle={t('russianDocs.edoSubtitle', { count: documents.length })}
        breadcrumbs={[
          { label: t('russianDocs.breadcrumbHome'), href: '/' },
          { label: t('russianDocs.breadcrumbRussianDocs'), href: '/russian-docs' },
          { label: t('russianDocs.breadcrumbEdo') },
        ]}
        tabs={[
          { id: 'all', label: t('russianDocs.tabAll'), count: tabCounts.all },
          { id: 'SIGNING', label: t('russianDocs.tabSigning'), count: tabCounts.signing },
          { id: 'DELIVERED', label: t('russianDocs.tabDelivered'), count: tabCounts.delivered },
          { id: 'REJECTED', label: t('russianDocs.tabRejected'), count: tabCounts.rejected },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as TabId)}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard icon={<FileText size={18} />} label={t('russianDocs.metricTotalDocs')} value={metrics.total} />
        <MetricCard icon={<PenTool size={18} />} label={t('russianDocs.metricOnSigning')} value={metrics.signing} />
        <MetricCard icon={<FileCheck size={18} />} label={t('russianDocs.metricDelivered')} value={metrics.delivered} />
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
          <Input placeholder={t('russianDocs.searchByNumberDocCounterparty')} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>

      <DataTable<EdoDocument>
        data={filtered ?? []}
        columns={columns}
        loading={isLoading}
        enableRowSelection
        enableColumnVisibility
        enableDensityToggle
        enableExport
        pageSize={20}
        emptyTitle={t('russianDocs.edoEmptyTitle')}
        emptyDescription={t('russianDocs.edoEmptyDescription')}
      />
    </div>
  );
};

export default EdoDocumentsPage;
