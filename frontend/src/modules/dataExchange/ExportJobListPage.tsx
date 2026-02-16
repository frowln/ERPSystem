import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { Download, Search, FileDown, CheckCircle2, Clock, FileSpreadsheet } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { DataTable } from '@/design-system/components/DataTable';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { MetricCard } from '@/design-system/components/MetricCard';
import { Input, Select } from '@/design-system/components/FormField';
import { Modal } from '@/design-system/components/Modal';
import { dataExchangeApi } from '@/api/dataExchange';
import { formatDateTime, formatNumber } from '@/lib/format';
import { t } from '@/i18n';
import type { ExportJob, ExportFormat, ImportEntityType } from './types';

const statusColorMap: Record<string, 'gray' | 'blue' | 'green' | 'yellow' | 'red'> = {
  PENDING: 'gray',
  IN_PROGRESS: 'blue',
  COMPLETED: 'green',
  FAILED: 'red',
};

const getStatusLabels = (): Record<string, string> => ({
  PENDING: t('dataExchange.statusPending'),
  IN_PROGRESS: t('dataExchange.statusInProgress'),
  COMPLETED: t('dataExchange.statusCompleted'),
  FAILED: t('dataExchange.statusFailed'),
});

const getEntityTypeLabels = (): Record<string, string> => ({
  PROJECTS: t('dataExchange.entityProjects'),
  CONTRACTS: t('dataExchange.entityContracts'),
  MATERIALS: t('dataExchange.entityMaterials'),
  EMPLOYEES: t('dataExchange.entityEmployees'),
  DOCUMENTS: t('dataExchange.entityDocuments'),
  WBS: t('dataExchange.entityWbs'),
  BUDGET_ITEMS: t('dataExchange.entityBudgetItems'),
  INVOICES: t('dataExchange.entityInvoices'),
});

const formatLabels: Record<string, string> = {
  CSV: 'CSV',
  XLSX: 'Excel',
  PDF: 'PDF',
  JSON: 'JSON',
};

function formatFileSize(bytes: number | undefined): string {
  if (!bytes) return '---';
  if (bytes < 1024) return t('dataExchange.fileSizeB', { size: String(bytes) });
  if (bytes < 1024 * 1024) return t('dataExchange.fileSizeKB', { size: (bytes / 1024).toFixed(1) });
  return t('dataExchange.fileSizeMB', { size: (bytes / (1024 * 1024)).toFixed(1) });
}

type TabId = 'all' | 'COMPLETED' | 'IN_PROGRESS';

const ExportJobListPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [search, setSearch] = useState('');
  const [formatFilter, setFormatFilter] = useState('');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [exportEntity, setExportEntity] = useState<ImportEntityType>('PROJECTS');
  const [exportFormat, setExportFormat] = useState<ExportFormat>('XLSX');

  const { data, isLoading } = useQuery({
    queryKey: ['export-jobs'],
    queryFn: () => dataExchangeApi.getExportJobs(),
  });

  const exports = data?.content ?? [];

  const filtered = useMemo(() => {
    let result = exports;
    if (activeTab === 'COMPLETED') result = result.filter((j) => j.status === 'COMPLETED');
    else if (activeTab === 'IN_PROGRESS') result = result.filter((j) => ['PENDING', 'IN_PROGRESS'].includes(j.status));

    if (formatFilter) result = result.filter((j) => j.format === formatFilter);
    if (search) {
      const lower = search.toLowerCase();
      result = result.filter(
        (j) =>
          (j.fileName ?? '').toLowerCase().includes(lower) ||
          getEntityTypeLabels()[j.entityType]?.toLowerCase().includes(lower),
      );
    }
    return result;
  }, [exports, activeTab, formatFilter, search]);

  const counts = useMemo(() => ({
    all: exports.length,
    completed: exports.filter((j) => j.status === 'COMPLETED').length,
    in_progress: exports.filter((j) => ['PENDING', 'IN_PROGRESS'].includes(j.status)).length,
  }), [exports]);

  const totalRecords = useMemo(() => exports.reduce((sum, j) => sum + j.totalRecords, 0), [exports]);

  const columns = useMemo<ColumnDef<ExportJob, unknown>[]>(
    () => [
      {
        accessorKey: 'entityType',
        header: t('dataExchange.colDataType'),
        size: 160,
        cell: ({ getValue }) => (
          <span className="font-medium text-neutral-900 dark:text-neutral-100">{getEntityTypeLabels()[getValue<string>()] ?? getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'format',
        header: t('dataExchange.colFormat'),
        size: 100,
        cell: ({ getValue }) => (
          <span className="font-mono text-xs px-2 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded">{formatLabels[getValue<string>()] ?? getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'status',
        header: t('dataExchange.colStatus'),
        size: 120,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={statusColorMap}
            label={getStatusLabels()[getValue<string>()] ?? getValue<string>()}
          />
        ),
      },
      {
        accessorKey: 'totalRecords',
        header: t('dataExchange.colRecords'),
        size: 100,
        cell: ({ getValue }) => (
          <span className="font-mono text-neutral-600 tabular-nums">{formatNumber(getValue<number>())}</span>
        ),
      },
      {
        accessorKey: 'fileSize',
        header: t('dataExchange.colSize'),
        size: 100,
        cell: ({ getValue }) => (
          <span className="text-neutral-600">{formatFileSize(getValue<number>())}</span>
        ),
      },
      {
        accessorKey: 'createdAt',
        header: t('dataExchange.colCreated'),
        size: 160,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-sm">{formatDateTime(getValue<string>())}</span>
        ),
      },
      {
        id: 'actions',
        header: '',
        size: 120,
        cell: ({ row }) => (
          row.original.status === 'COMPLETED' && row.original.downloadUrl ? (
            <Button variant="outline" size="xs" iconLeft={<Download size={12} />}>
              {t('dataExchange.downloadButton')}
            </Button>
          ) : null
        ),
      },
    ],
    [],
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('dataExchange.exportTitle')}
        subtitle={t('dataExchange.exportSubtitle', { count: String(exports.length) })}
        breadcrumbs={[
          { label: t('dataExchange.breadcrumbHome'), href: '/' },
          { label: t('dataExchange.breadcrumbDataExchange'), href: '/data-exchange' },
          { label: t('dataExchange.breadcrumbExport') },
        ]}
        actions={
          <Button iconLeft={<Download size={16} />} onClick={() => setCreateModalOpen(true)}>
            {t('dataExchange.newExport')}
          </Button>
        }
        tabs={[
          { id: 'all', label: t('dataExchange.tabAll'), count: counts.all },
          { id: 'COMPLETED', label: t('dataExchange.tabReady'), count: counts.completed },
          { id: 'IN_PROGRESS', label: t('dataExchange.tabProcessing'), count: counts.in_progress },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as TabId)}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard icon={<FileDown size={18} />} label={t('dataExchange.metricTotalExports')} value={counts.all} />
        <MetricCard icon={<CheckCircle2 size={18} />} label={t('dataExchange.metricReadyToDownload')} value={counts.completed} />
        <MetricCard icon={<Clock size={18} />} label={t('dataExchange.metricInProcessing')} value={counts.in_progress} />
        <MetricCard icon={<FileSpreadsheet size={18} />} label={t('dataExchange.metricTotalRecords')} value={formatNumber(totalRecords)} />
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input placeholder={t('dataExchange.searchExportPlaceholder')} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select
          options={[
            { value: '', label: t('dataExchange.filterAllFormats') },
            ...Object.entries(formatLabels).map(([value, label]) => ({ value, label })),
          ]}
          value={formatFilter}
          onChange={(e) => setFormatFilter(e.target.value)}
          className="w-40"
        />
      </div>

      <DataTable<ExportJob>
        data={filtered}
        columns={columns}
        loading={isLoading}
        enableRowSelection
        enableColumnVisibility
        enableDensityToggle
        enableExport
        pageSize={20}
        emptyTitle={t('dataExchange.emptyExportTitle')}
        emptyDescription={t('dataExchange.emptyExportDescription')}
      />

      {/* Create Export Modal */}
      <Modal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title={t('dataExchange.newExportModalTitle')}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">{t('dataExchange.newExportDataTypeLabel')}</label>
            <Select
              options={Object.entries(getEntityTypeLabels()).map(([value, label]) => ({ value, label }))}
              value={exportEntity}
              onChange={(e) => setExportEntity(e.target.value as ImportEntityType)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">{t('dataExchange.newExportFormatLabel')}</label>
            <Select
              options={Object.entries(formatLabels).map(([value, label]) => ({ value, label }))}
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value as ExportFormat)}
            />
          </div>
          <div className="bg-neutral-50 dark:bg-neutral-800 rounded-lg p-3">
            <p className="text-sm text-neutral-600" dangerouslySetInnerHTML={{ __html: t('dataExchange.newExportDescription', { format: formatLabels[exportFormat], entity: getEntityTypeLabels()[exportEntity] }) }} />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setCreateModalOpen(false)}>{t('dataExchange.newExportCancel')}</Button>
            <Button onClick={() => setCreateModalOpen(false)}>{t('dataExchange.newExportCreate')}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ExportJobListPage;
