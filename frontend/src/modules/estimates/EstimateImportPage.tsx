import React, { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { Upload, FileUp, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { DataTable } from '@/design-system/components/DataTable';
import { Button } from '@/design-system/components/Button';
import { FormField, Select } from '@/design-system/components/FormField';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { FileUpload, type UploadedFile } from '@/design-system/components/FileUpload';
import { Modal } from '@/design-system/components/Modal';
import { estimatesApi } from '@/api/estimates';
import { formatDate } from '@/lib/format';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';
import type { ImportFormat, ImportHistory } from './types';

const importFormatOptions = [
  { value: 'arps', label: 'ARPS (.arp)' },
  { value: 'xml', label: 'XML' },
  { value: 'gsfx', label: 'GSFX' },
];

const importStatusColorMap: Record<string, string> = {
  success: 'green',
  partial: 'yellow',
  failed: 'red',
};

const EstimateImportPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [format, setFormat] = useState<ImportFormat>('arps');
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState<ImportHistory | null>(null);

  const { data: history = [], isLoading: historyLoading } = useQuery({
    queryKey: ['estimate-import-history'],
    queryFn: () => estimatesApi.getImportHistory(),
  });

  const importMutation = useMutation({
    mutationFn: async () => {
      const file = files[0]?.file;
      if (!file) throw new Error('No file selected');
      setImportProgress(10);
      const progressInterval = setInterval(() => {
        setImportProgress((prev) => Math.min(prev + 15, 90));
      }, 500);
      try {
        const result = await estimatesApi.importEstimate(file, format);
        clearInterval(progressInterval);
        setImportProgress(100);
        return result;
      } catch (err) {
        clearInterval(progressInterval);
        setImportProgress(0);
        throw err;
      }
    },
    onSuccess: (result) => {
      setImportResult(result);
      queryClient.invalidateQueries({ queryKey: ['estimate-import-history'] });
      setTimeout(() => {
        setImportProgress(0);
        setFiles([]);
      }, 2000);
    },
  });

  const handleImport = useCallback(() => {
    if (files.length === 0 || !files[0].file) return;
    setShowPreview(false);
    importMutation.mutate();
  }, [files, importMutation]);

  const historyColumns = useMemo<ColumnDef<ImportHistory, unknown>[]>(
    () => [
      {
        accessorKey: 'fileName',
        header: t('estimates.advancedImport.colFileName'),
        size: 250,
        cell: ({ getValue }) => (
          <div className="flex items-center gap-2">
            <FileUp size={16} className="text-neutral-400 flex-shrink-0" />
            <span className="font-medium text-neutral-900 dark:text-neutral-100 truncate">
              {getValue<string>()}
            </span>
          </div>
        ),
      },
      {
        accessorKey: 'format',
        header: t('estimates.advancedImport.colFormat'),
        size: 100,
        cell: ({ getValue }) => (
          <span className="uppercase text-xs font-medium text-neutral-600 dark:text-neutral-400">
            {getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: 'importDate',
        header: t('estimates.advancedImport.colDate'),
        size: 140,
        cell: ({ getValue }) => (
          <span className="text-neutral-600 dark:text-neutral-400 text-sm tabular-nums">
            {formatDate(getValue<string>())}
          </span>
        ),
      },
      {
        accessorKey: 'status',
        header: t('estimates.advancedImport.colStatus'),
        size: 120,
        cell: ({ getValue }) => {
          const status = getValue<string>();
          return (
            <StatusBadge
              status={status}
              colorMap={importStatusColorMap}
              label={t(`estimates.advancedImport.status${status.charAt(0).toUpperCase() + status.slice(1)}`)}
            />
          );
        },
      },
      {
        accessorKey: 'itemsImported',
        header: t('estimates.advancedImport.colItemsCount'),
        size: 120,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-neutral-700 dark:text-neutral-300 text-right block">
            {getValue<number>()}
          </span>
        ),
      },
    ],
    [],
  );

  const acceptFormats = format === 'arps' ? '.arp' : format === 'xml' ? '.xml' : '.gsfx';

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('estimates.advancedImport.title')}
        subtitle={t('estimates.advancedImport.subtitle')}
        backTo="/estimates"
        breadcrumbs={[
          { label: t('estimates.advancedImport.breadcrumbHome'), href: '/' },
          { label: t('estimates.advancedImport.breadcrumbEstimates'), href: '/estimates' },
          { label: t('estimates.advancedImport.breadcrumbImport') },
        ]}
      />

      {/* Upload section */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-6">
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
          {t('estimates.advancedImport.uploadSection')}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField label={t('estimates.advancedImport.labelFormat')} required>
            <Select
              value={format}
              onChange={(e) => setFormat(e.target.value as ImportFormat)}
              options={importFormatOptions}
            />
          </FormField>

          <div className="md:col-span-1">
            <FormField label={t('estimates.advancedImport.labelFile')} required>
              <FileUpload
                accept={acceptFormats}
                maxFiles={1}
                maxSizeMB={100}
                value={files}
                onChange={setFiles}
              />
            </FormField>
          </div>
        </div>

        {/* Progress bar */}
        {importProgress > 0 && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-neutral-600 dark:text-neutral-400">
                {importProgress < 100
                  ? t('estimates.advancedImport.importing')
                  : t('estimates.advancedImport.importComplete')}
              </span>
              <span className="text-sm font-medium tabular-nums text-neutral-700 dark:text-neutral-300">
                {importProgress}%
              </span>
            </div>
            <div className="w-full h-2.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-300',
                  importProgress >= 100 ? 'bg-success-500' : 'bg-primary-500',
                )}
                style={{ width: `${importProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Validation errors from import result */}
        {importResult && importResult.errors && importResult.errors.length > 0 && (
          <div className="mt-4 bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle size={16} className="text-danger-600" />
              <span className="text-sm font-medium text-danger-700 dark:text-danger-300">
                {t('estimates.advancedImport.validationErrors')}
              </span>
            </div>
            <ul className="space-y-1">
              {importResult.errors.map((err, idx) => (
                <li key={idx} className="text-sm text-danger-600 dark:text-danger-400 pl-6">
                  {err}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Import success */}
        {importResult && importResult.status === 'success' && (
          <div className="mt-4 bg-success-50 dark:bg-success-900/20 border border-success-200 dark:border-success-800 rounded-lg p-4 flex items-center gap-3">
            <CheckCircle2 size={18} className="text-success-600 flex-shrink-0" />
            <span className="text-sm text-success-700 dark:text-success-300">
              {t('estimates.advancedImport.importSuccessMsg', { count: String(importResult.itemsImported) })}
            </span>
          </div>
        )}

        <div className="flex items-center gap-3 mt-6">
          <Button
            variant="secondary"
            onClick={() => setShowPreview(true)}
            disabled={files.length === 0 || importMutation.isPending}
          >
            {t('estimates.advancedImport.btnPreview')}
          </Button>
          <Button
            iconLeft={<Upload size={16} />}
            onClick={handleImport}
            loading={importMutation.isPending}
            disabled={files.length === 0}
          >
            {t('estimates.advancedImport.btnImport')}
          </Button>
        </div>
      </div>

      {/* Import history */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center gap-2">
          <Clock size={16} className="text-neutral-400" />
          {t('estimates.advancedImport.historyTitle')}
        </h3>
        <DataTable<ImportHistory>
          data={history}
          columns={historyColumns}
          loading={historyLoading}
          pageSize={10}
          emptyTitle={t('estimates.advancedImport.historyEmpty')}
          emptyDescription={t('estimates.advancedImport.historyEmptyDesc')}
        />
      </div>

      {/* Preview modal */}
      <Modal
        open={showPreview}
        onClose={() => setShowPreview(false)}
        title={t('estimates.advancedImport.previewTitle')}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowPreview(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleImport} loading={importMutation.isPending}>
              {t('estimates.advancedImport.btnConfirmImport')}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-neutral-500 dark:text-neutral-400">{t('estimates.advancedImport.previewFile')}:</span>{' '}
              <span className="font-medium text-neutral-900 dark:text-neutral-100">{files[0]?.name ?? '—'}</span>
            </div>
            <div>
              <span className="text-neutral-500 dark:text-neutral-400">{t('estimates.advancedImport.previewFormat')}:</span>{' '}
              <span className="font-medium text-neutral-900 dark:text-neutral-100 uppercase">{format}</span>
            </div>
          </div>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            {t('estimates.advancedImport.previewHint')}
          </p>
        </div>
      </Modal>
    </div>
  );
};

export default EstimateImportPage;
