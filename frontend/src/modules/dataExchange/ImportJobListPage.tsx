import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { Upload, Search, FileUp, CheckCircle2, XCircle, Clock, AlertTriangle } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { DataTable } from '@/design-system/components/DataTable';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { MetricCard } from '@/design-system/components/MetricCard';
import { Input, Select } from '@/design-system/components/FormField';
import { dataExchangeApi } from '@/api/dataExchange';
import { formatDateTime, formatNumber } from '@/lib/format';
import { t } from '@/i18n';
import type { ImportJob, ImportStatus, ImportEntityType } from './types';

const statusColorMap: Record<string, 'gray' | 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'orange'> = {
  PENDING: 'gray',
  VALIDATING: 'yellow',
  IN_PROGRESS: 'blue',
  COMPLETED: 'green',
  FAILED: 'red',
  PARTIALLY_COMPLETED: 'orange',
};

const getStatusLabels = (): Record<string, string> => ({
  PENDING: t('dataExchange.importStatusPending'),
  VALIDATING: t('dataExchange.importStatusValidating'),
  IN_PROGRESS: t('dataExchange.importStatusInProgress'),
  COMPLETED: t('dataExchange.importStatusCompleted'),
  FAILED: t('dataExchange.importStatusFailed'),
  PARTIALLY_COMPLETED: t('dataExchange.importStatusPartially'),
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

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return t('dataExchange.fileSizeB', { size: String(bytes) });
  if (bytes < 1024 * 1024) return t('dataExchange.fileSizeKB', { size: (bytes / 1024).toFixed(1) });
  return t('dataExchange.fileSizeMB', { size: (bytes / (1024 * 1024)).toFixed(1) });
}

type TabId = 'all' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';

const ImportJobListPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [search, setSearch] = useState('');
  const [entityFilter, setEntityFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['import-jobs'],
    queryFn: () => dataExchangeApi.getImportJobs(),
  });

  const imports = data?.content ?? [];

  const filtered = useMemo(() => {
    let result = imports;
    if (activeTab === 'IN_PROGRESS') result = result.filter((j) => ['PENDING', 'VALIDATING', 'IN_PROGRESS'].includes(j.status));
    else if (activeTab === 'COMPLETED') result = result.filter((j) => j.status === 'COMPLETED');
    else if (activeTab === 'FAILED') result = result.filter((j) => ['FAILED', 'PARTIALLY_COMPLETED'].includes(j.status));

    if (entityFilter) result = result.filter((j) => j.entityType === entityFilter);
    if (search) {
      const lower = search.toLowerCase();
      result = result.filter(
        (j) =>
          j.fileName.toLowerCase().includes(lower) ||
          j.uploadedByName.toLowerCase().includes(lower),
      );
    }
    return result;
  }, [imports, activeTab, entityFilter, search]);

  const counts = useMemo(() => ({
    all: imports.length,
    in_progress: imports.filter((j) => ['PENDING', 'VALIDATING', 'IN_PROGRESS'].includes(j.status)).length,
    completed: imports.filter((j) => j.status === 'COMPLETED').length,
    failed: imports.filter((j) => ['FAILED', 'PARTIALLY_COMPLETED'].includes(j.status)).length,
  }), [imports]);

  const totalRows = useMemo(() => imports.reduce((sum, j) => sum + j.totalRows, 0), [imports]);

  const columns = useMemo<ColumnDef<ImportJob, unknown>[]>(
    () => [
      {
        accessorKey: 'fileName',
        header: t('dataExchange.colFile'),
        size: 260,
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-neutral-900 dark:text-neutral-100 truncate max-w-[240px]">{row.original.fileName}</p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{formatFileSize(row.original.fileSize)}</p>
          </div>
        ),
      },
      {
        accessorKey: 'entityType',
        header: t('dataExchange.colDataType'),
        size: 150,
        cell: ({ getValue }) => (
          <span className="text-neutral-700 dark:text-neutral-300">{getEntityTypeLabels()[getValue<string>()] ?? getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'status',
        header: t('dataExchange.colStatus'),
        size: 130,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={statusColorMap}
            label={getStatusLabels()[getValue<string>()] ?? getValue<string>()}
          />
        ),
      },
      {
        id: 'progress',
        header: t('dataExchange.colProgress'),
        size: 160,
        cell: ({ row }) => {
          const pct = row.original.totalRows > 0 ? (row.original.processedRows / row.original.totalRows) * 100 : 0;
          return (
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    row.original.status === 'FAILED' ? 'bg-danger-500' : 'bg-primary-500'
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-xs text-neutral-600 tabular-nums w-16 text-right">
                {row.original.processedRows}/{row.original.totalRows}
              </span>
            </div>
          );
        },
      },
      {
        id: 'results',
        header: t('dataExchange.colResult'),
        size: 120,
        cell: ({ row }) => (
          <div className="text-sm">
            <span className="text-green-600">{row.original.successCount}</span>
            {row.original.errorCount > 0 && (
              <span className="text-danger-600"> / {row.original.errorCount} {t('dataExchange.errorsAbbrev')}</span>
            )}
          </div>
        ),
      },
      {
        accessorKey: 'uploadedByName',
        header: t('dataExchange.colUploadedBy'),
        size: 140,
      },
      {
        accessorKey: 'startedAt',
        header: t('dataExchange.colStarted'),
        size: 150,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-sm">{formatDateTime(getValue<string>())}</span>
        ),
      },
    ],
    [],
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('dataExchange.importTitle')}
        subtitle={t('dataExchange.importSubtitle', { count: String(imports.length) })}
        breadcrumbs={[
          { label: t('dataExchange.breadcrumbHome'), href: '/' },
          { label: t('dataExchange.breadcrumbDataExchange'), href: '/data-exchange' },
          { label: t('dataExchange.breadcrumbImport') },
        ]}
        actions={
          <Button iconLeft={<Upload size={16} />}>
            {t('dataExchange.uploadFile')}
          </Button>
        }
        tabs={[
          { id: 'all', label: t('dataExchange.tabAll'), count: counts.all },
          { id: 'IN_PROGRESS', label: t('dataExchange.tabInProgress'), count: counts.in_progress },
          { id: 'COMPLETED', label: t('dataExchange.tabCompleted'), count: counts.completed },
          { id: 'FAILED', label: t('dataExchange.tabFailed'), count: counts.failed },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as TabId)}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard icon={<FileUp size={18} />} label={t('dataExchange.metricTotalImports')} value={counts.all} />
        <MetricCard icon={<Clock size={18} />} label={t('dataExchange.metricInProcessing')} value={counts.in_progress} />
        <MetricCard icon={<CheckCircle2 size={18} />} label={t('dataExchange.metricSuccessful')} value={counts.completed} />
        <MetricCard icon={<AlertTriangle size={18} />} label={t('dataExchange.metricTotalRows')} value={formatNumber(totalRows)} />
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input placeholder={t('dataExchange.searchImportPlaceholder')} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select
          options={[
            { value: '', label: t('dataExchange.filterAllDataTypes') },
            ...Object.entries(getEntityTypeLabels()).map(([value, label]) => ({ value, label })),
          ]}
          value={entityFilter}
          onChange={(e) => setEntityFilter(e.target.value)}
          className="w-48"
        />
      </div>

      <DataTable<ImportJob>
        data={filtered}
        columns={columns}
        loading={isLoading}
        enableRowSelection
        enableColumnVisibility
        enableDensityToggle
        enableExport
        pageSize={20}
        emptyTitle={t('dataExchange.emptyImportTitle')}
        emptyDescription={t('dataExchange.emptyImportDescription')}
      />
    </div>
  );
};

export default ImportJobListPage;
