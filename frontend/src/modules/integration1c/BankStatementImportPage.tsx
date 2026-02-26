import React, { useState, useMemo, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import {
  Upload,
  FileText,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  ArrowDownToLine,
  Hash,
  Calendar,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { DataTable } from '@/design-system/components/DataTable';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { MetricCard } from '@/design-system/components/MetricCard';
import { cn } from '@/lib/cn';
import { formatDateTime } from '@/lib/format';
import { integration1cApi } from '@/api/integration1c';
import { t } from '@/i18n';
import type { BankStatementImportResult, ImportRecord } from './types';

const importStatusColorMap: Record<string, 'green' | 'yellow' | 'red'> = {
  success: 'green',
  partial: 'yellow',
  failed: 'red',
};

const BankStatementImportPage: React.FC = () => {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<BankStatementImportResult | null>(null);

  const { data: importHistory = [] } = useQuery({
    queryKey: ['1c-import-history'],
    queryFn: async () => {
      try {
        return await integration1cApi.getImportHistory();
      } catch {
        return [];
      }
    },
  });

  const importMutation = useMutation({
    mutationFn: (file: File) => integration1cApi.importBankStatement(file),
    onSuccess: (result) => {
      setImportResult(result);
      setSelectedFile(null);
      queryClient.invalidateQueries({ queryKey: ['1c-import-history'] });
      if (result.errors.length === 0) {
        toast.success(t('integration1c.importSuccess'));
      } else {
        toast(t('integration1c.importPartial'), { icon: '!' });
      }
    },
    onError: () => toast.error(t('integration1c.importError')),
  });

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
      setImportResult(null);
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setImportResult(null);
    }
  }, []);

  // Metrics
  const totalImported = importHistory.length;
  const successfulImports = importHistory.filter((r) => r.status === 'success').length;
  const lastImportDate = importHistory.length > 0
    ? formatDateTime(importHistory[0].importDate)
    : '--';

  const historyColumns = useMemo<ColumnDef<ImportRecord, unknown>[]>(
    () => [
      {
        accessorKey: 'fileName',
        header: t('integration1c.colFileName'),
        size: 220,
        cell: ({ getValue }) => (
          <div className="flex items-center gap-2">
            <FileText size={14} className="text-neutral-400" />
            <span className="text-sm text-neutral-900 dark:text-neutral-100">
              {getValue<string>()}
            </span>
          </div>
        ),
      },
      {
        accessorKey: 'type',
        header: t('integration1c.colType'),
        size: 120,
      },
      {
        accessorKey: 'recordsCount',
        header: t('integration1c.colRecords'),
        size: 100,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-neutral-700 dark:text-neutral-300">
            {getValue<number>()}
          </span>
        ),
      },
      {
        accessorKey: 'status',
        header: t('integration1c.colStatus'),
        size: 120,
        cell: ({ getValue }) => {
          const status = getValue<string>();
          const labelMap: Record<string, string> = {
            success: t('integration1c.statusSuccess'),
            partial: t('integration1c.statusPartial'),
            failed: t('integration1c.statusFailed'),
          };
          return (
            <StatusBadge
              status={status}
              colorMap={importStatusColorMap}
              label={labelMap[status] ?? status}
            />
          );
        },
      },
      {
        accessorKey: 'importDate',
        header: t('integration1c.colImportDate'),
        size: 160,
        cell: ({ getValue }) => (
          <span className="text-xs text-neutral-700 dark:text-neutral-300">
            {formatDateTime(getValue<string>())}
          </span>
        ),
      },
    ],
    [],
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('integration1c.bankImportTitle')}
        subtitle={t('integration1c.bankImportSubtitle')}
        breadcrumbs={[
          { label: t('common.home'), href: '/' },
          { label: t('integration1c.breadcrumbSettings'), href: '/settings' },
          { label: t('integration1c.dashboardTitle'), href: '/settings/1c' },
          { label: t('integration1c.bankImportTitle') },
        ]}
        backTo="/settings/1c"
      />

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <MetricCard
          icon={<ArrowDownToLine size={16} />}
          label={t('integration1c.metricTotalImported')}
          value={totalImported}
        />
        <MetricCard
          icon={<CheckCircle2 size={16} />}
          label={t('integration1c.metricSuccessful')}
          value={successfulImports}
        />
        <MetricCard
          icon={<Calendar size={16} />}
          label={t('integration1c.metricLastImport')}
          value={lastImportDate}
        />
      </div>

      {/* Upload zone */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-6">
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
          {t('integration1c.uploadBankStatement')}
        </h3>

        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
            dragActive
              ? 'border-primary-400 bg-primary-50 dark:bg-primary-900/20'
              : 'border-neutral-300 dark:border-neutral-600 hover:border-primary-300 dark:hover:border-primary-600',
          )}
        >
          <Upload
            size={32}
            className={cn(
              'mx-auto mb-3',
              dragActive ? 'text-primary-500' : 'text-neutral-400',
            )}
          />
          <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
            {t('integration1c.dropFileHere')}
          </p>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            {t('integration1c.supportedFormats')}
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.xml,.1cx"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        {/* Selected file */}
        {selectedFile && (
          <div className="mt-4 flex items-center justify-between bg-neutral-50 dark:bg-neutral-800 rounded-lg p-3">
            <div className="flex items-center gap-3">
              <FileText size={18} className="text-primary-500" />
              <div>
                <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedFile(null)}
              >
                {t('common.cancel')}
              </Button>
              <Button
                iconLeft={importMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                onClick={() => importMutation.mutate(selectedFile)}
                disabled={importMutation.isPending}
              >
                {t('integration1c.importBtn')}
              </Button>
            </div>
          </div>
        )}

        {/* Import result */}
        {importResult && (
          <div className="mt-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-3">
              {t('integration1c.importResultTitle')}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
              <div className="flex items-center gap-2">
                <Hash size={14} className="text-neutral-500" />
                <span className="text-sm text-neutral-700 dark:text-neutral-300">
                  {t('integration1c.totalTransactions')}: <strong>{importResult.totalTransactions}</strong>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-green-500" />
                <span className="text-sm text-neutral-700 dark:text-neutral-300">
                  {t('integration1c.matched')}: <strong>{importResult.matched}</strong>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <AlertTriangle size={14} className="text-yellow-500" />
                <span className="text-sm text-neutral-700 dark:text-neutral-300">
                  {t('integration1c.unmatched')}: <strong>{importResult.unmatched}</strong>
                </span>
              </div>
            </div>
            {importResult.errors.length > 0 && (
              <div className="mt-2 bg-red-50 dark:bg-red-900/20 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <XCircle size={14} className="text-red-500" />
                  <span className="text-sm font-medium text-red-700 dark:text-red-300">
                    {t('integration1c.errorsFound', { count: String(importResult.errors.length) })}
                  </span>
                </div>
                <ul className="list-disc list-inside text-xs text-red-600 dark:text-red-400 space-y-0.5">
                  {importResult.errors.map((err, idx) => (
                    <li key={idx}>{err}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Import history */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
          {t('integration1c.importHistoryTitle')}
        </h3>
      </div>
      <DataTable<ImportRecord>
        data={importHistory}
        columns={historyColumns}
        enableColumnVisibility
        enableDensityToggle
        enableExport
        pageSize={20}
        emptyTitle={t('integration1c.emptyImportTitle')}
        emptyDescription={t('integration1c.emptyImportDescription')}
      />
    </div>
  );
};

export default BankStatementImportPage;
