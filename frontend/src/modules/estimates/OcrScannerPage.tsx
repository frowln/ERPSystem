import React, { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { Upload, Scan, Check, Trash2, FileText, Loader2 } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { DataTable } from '@/design-system/components/DataTable';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { EmptyState } from '@/design-system/components/EmptyState';
import { ocrEstimateApi, type OcrEstimateResult, type OcrTask } from '@/api/ocrEstimate';
import { formatMoney, formatNumber } from '@/lib/format';
import { cn } from '@/lib/cn';
import { guardDemoModeAction } from '@/lib/demoMode';
import { t } from '@/i18n';
import toast from 'react-hot-toast';

const CONFIDENCE_COLOR_MAP: Record<string, string> = {
  high: 'green',
  medium: 'yellow',
  low: 'red',
};

function getConfidenceLevel(confidence: number): string {
  if (confidence >= 80) return 'high';
  if (confidence >= 60) return 'medium';
  return 'low';
}

const CONFIDENCE_LABELS: Record<string, string> = {
  high: '',
  medium: '',
  low: '',
};

const OcrScannerPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedTask, setSelectedTask] = useState<OcrTask | null>(null);
  const [selectedResultIds, setSelectedResultIds] = useState<Set<string>>(new Set());
  const [isDragOver, setIsDragOver] = useState(false);

  // ─── Queries ──────────────────────────────────────────────────────────────
  const { data: tasksData, isLoading: tasksLoading } = useQuery({
    queryKey: ['ocr-tasks'],
    queryFn: () => ocrEstimateApi.listTasks({ size: 100 }),
  });

  const tasks = tasksData?.content ?? [];

  const { data: results, isLoading: resultsLoading } = useQuery({
    queryKey: ['ocr-estimate-results', selectedTask?.id],
    queryFn: () => ocrEstimateApi.getEstimateResults(selectedTask!.id),
    enabled: !!selectedTask && selectedTask.status === 'COMPLETED',
  });

  // ─── Mutations ────────────────────────────────────────────────────────────
  const createTaskMutation = useMutation({
    mutationFn: ocrEstimateApi.createTask,
    onSuccess: (task) => {
      queryClient.invalidateQueries({ queryKey: ['ocr-tasks'] });
      setSelectedTask(task);
      toast.success(t('ocrEstimate.taskCreated'));
    },
    onError: () => toast.error(t('ocrEstimate.taskCreateError')),
  });

  const processEstimateMutation = useMutation({
    mutationFn: (taskId: string) => ocrEstimateApi.processEstimate(taskId),
    onSuccess: (_, taskId) => {
      queryClient.invalidateQueries({ queryKey: ['ocr-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['ocr-estimate-results', taskId] });
      // Refresh selected task
      ocrEstimateApi.getTask(taskId).then((task) => setSelectedTask(task));
      toast.success(t('ocrEstimate.processSuccess'));
    },
    onError: () => toast.error(t('ocrEstimate.processError')),
  });

  const acceptResultsMutation = useMutation({
    mutationFn: ocrEstimateApi.acceptResults,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ocr-estimate-results', selectedTask?.id] });
      setSelectedResultIds(new Set());
      toast.success(t('ocrEstimate.acceptSuccess'));
    },
    onError: () => toast.error(t('ocrEstimate.acceptError')),
  });

  const rejectResultMutation = useMutation({
    mutationFn: ocrEstimateApi.rejectResult,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ocr-estimate-results', selectedTask?.id] });
      toast.success(t('ocrEstimate.rejectSuccess'));
    },
    onError: () => toast.error(t('ocrEstimate.rejectError')),
  });

  // ─── Handlers ─────────────────────────────────────────────────────────────
  const handleFileDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      if (guardDemoModeAction(t('ocrEstimate.uploadFile'))) return;

      const file = e.dataTransfer.files[0];
      if (file) {
        createTaskMutation.mutate({
          fileUrl: `/uploads/${file.name}`,
          fileName: file.name,
        });
      }
    },
    [createTaskMutation],
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (guardDemoModeAction(t('ocrEstimate.uploadFile'))) return;
      const file = e.target.files?.[0];
      if (file) {
        createTaskMutation.mutate({
          fileUrl: `/uploads/${file.name}`,
          fileName: file.name,
        });
      }
    },
    [createTaskMutation],
  );

  const handleProcess = useCallback(() => {
    if (!selectedTask) return;
    if (guardDemoModeAction(t('ocrEstimate.processEstimate'))) return;
    processEstimateMutation.mutate(selectedTask.id);
  }, [selectedTask, processEstimateMutation]);

  const handleAcceptSelected = useCallback(() => {
    if (selectedResultIds.size === 0) return;
    if (guardDemoModeAction(t('ocrEstimate.acceptResults'))) return;
    acceptResultsMutation.mutate({ resultIds: Array.from(selectedResultIds) });
  }, [selectedResultIds, acceptResultsMutation]);

  const handleReject = useCallback(
    (resultId: string) => {
      if (guardDemoModeAction(t('ocrEstimate.rejectResult'))) return;
      rejectResultMutation.mutate(resultId);
    },
    [rejectResultMutation],
  );

  const toggleResultSelection = useCallback((resultId: string) => {
    setSelectedResultIds((prev) => {
      const next = new Set(prev);
      if (next.has(resultId)) {
        next.delete(resultId);
      } else {
        next.add(resultId);
      }
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (!results) return;
    const allIds = results.filter((r) => !r.accepted).map((r) => r.id);
    setSelectedResultIds((prev) => {
      if (prev.size === allIds.length) {
        return new Set();
      }
      return new Set(allIds);
    });
  }, [results]);

  // ─── Columns ──────────────────────────────────────────────────────────────
  const columns = useMemo<ColumnDef<OcrEstimateResult, unknown>[]>(
    () => [
      {
        id: 'select',
        header: () => (
          <input
            type="checkbox"
            checked={
              results != null &&
              results.filter((r) => !r.accepted).length > 0 &&
              selectedResultIds.size === results.filter((r) => !r.accepted).length
            }
            onChange={toggleSelectAll}
            className="rounded border-neutral-300 dark:border-neutral-600"
          />
        ),
        size: 40,
        cell: ({ row }) => (
          <input
            type="checkbox"
            checked={selectedResultIds.has(row.original.id) || row.original.accepted}
            disabled={row.original.accepted}
            onChange={() => toggleResultSelection(row.original.id)}
            className="rounded border-neutral-300 dark:border-neutral-600"
          />
        ),
      },
      {
        accessorKey: 'lineNumber',
        header: '#',
        size: 50,
        cell: ({ getValue }) => (
          <span className="text-neutral-500 dark:text-neutral-400 tabular-nums">
            {getValue<number>()}
          </span>
        ),
      },
      {
        accessorKey: 'rateCode',
        header: t('ocrEstimate.colCode'),
        size: 140,
        cell: ({ getValue }) => (
          <span className="font-mono text-xs text-neutral-700 dark:text-neutral-300">
            {getValue<string>() ?? '-'}
          </span>
        ),
      },
      {
        accessorKey: 'name',
        header: t('ocrEstimate.colName'),
        size: 280,
        cell: ({ getValue }) => (
          <span className="text-neutral-900 dark:text-neutral-100">
            {getValue<string>() ?? '-'}
          </span>
        ),
      },
      {
        accessorKey: 'unit',
        header: t('ocrEstimate.colUnit'),
        size: 70,
        cell: ({ getValue }) => (
          <span className="text-neutral-600 dark:text-neutral-400">
            {getValue<string>() ?? '-'}
          </span>
        ),
      },
      {
        accessorKey: 'quantity',
        header: t('ocrEstimate.colQty'),
        size: 100,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-right block text-neutral-700 dark:text-neutral-300">
            {formatNumber(getValue<number>())}
          </span>
        ),
      },
      {
        accessorKey: 'unitPrice',
        header: t('ocrEstimate.colUnitPrice'),
        size: 120,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-right block text-neutral-700 dark:text-neutral-300">
            {formatMoney(getValue<number>())}
          </span>
        ),
      },
      {
        accessorKey: 'totalPrice',
        header: t('ocrEstimate.colTotal'),
        size: 140,
        cell: ({ getValue }) => (
          <span className="font-medium tabular-nums text-right block text-neutral-900 dark:text-neutral-100">
            {formatMoney(getValue<number>())}
          </span>
        ),
      },
      {
        accessorKey: 'confidence',
        header: t('ocrEstimate.colConfidence'),
        size: 110,
        cell: ({ getValue }) => {
          const val = getValue<number>() ?? 0;
          const level = getConfidenceLevel(val);
          return (
            <StatusBadge
              status={level}
              colorMap={CONFIDENCE_COLOR_MAP}
              label={`${val.toFixed(0)}%`}
            />
          );
        },
      },
      {
        id: 'status',
        header: t('ocrEstimate.colStatus'),
        size: 100,
        cell: ({ row }) => {
          if (row.original.accepted) {
            return (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-success-600 dark:text-success-400">
                <Check size={14} />
                {t('ocrEstimate.statusAccepted')}
              </span>
            );
          }
          return (
            <span className="text-xs text-neutral-500 dark:text-neutral-400">
              {t('ocrEstimate.statusPending')}
            </span>
          );
        },
      },
      {
        id: 'actions',
        header: '',
        size: 50,
        cell: ({ row }) =>
          !row.original.accepted ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleReject(row.original.id);
              }}
              className="p-1 text-neutral-400 hover:text-danger-600 dark:hover:text-danger-400 transition-colors"
              title={t('ocrEstimate.reject')}
            >
              <Trash2 size={14} />
            </button>
          ) : null,
      },
    ],
    [selectedResultIds, results, toggleSelectAll, toggleResultSelection, handleReject],
  );

  // ─── Processing state ─────────────────────────────────────────────────────
  const isProcessing = processEstimateMutation.isPending;

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('ocrEstimate.title')}
        subtitle={t('ocrEstimate.subtitle')}
        breadcrumbs={[
          { label: t('ocrEstimate.breadcrumbHome'), href: '/' },
          { label: t('ocrEstimate.breadcrumbEstimates'), href: '/estimates' },
          { label: t('ocrEstimate.breadcrumbOcr') },
        ]}
      />

      {/* Upload zone */}
      <div
        className={cn(
          'border-2 border-dashed rounded-xl p-8 mb-6 text-center transition-colors',
          isDragOver
            ? 'border-primary-500 bg-primary-50 dark:bg-primary-950'
            : 'border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900',
        )}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleFileDrop}
      >
        <Upload
          size={40}
          className="mx-auto mb-3 text-neutral-400 dark:text-neutral-500"
        />
        <p className="text-neutral-700 dark:text-neutral-300 font-medium mb-1">
          {t('ocrEstimate.dropzoneTitle')}
        </p>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-3">
          {t('ocrEstimate.dropzoneHint')}
        </p>
        <label className="inline-block">
          <input
            type="file"
            accept=".pdf,.png,.jpg,.jpeg,.tiff"
            className="hidden"
            onChange={handleFileSelect}
          />
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg cursor-pointer hover:bg-primary-700 transition-colors text-sm font-medium">
            <Upload size={16} />
            {t('ocrEstimate.selectFile')}
          </span>
        </label>
      </div>

      {/* Task list */}
      {tasks.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-3">
            {t('ocrEstimate.tasksTitle')}
          </h3>
          <div className="flex flex-wrap gap-2">
            {tasks.map((task) => (
              <button
                key={task.id}
                onClick={() => {
                  setSelectedTask(task);
                  setSelectedResultIds(new Set());
                }}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors',
                  selectedTask?.id === task.id
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-950 text-primary-700 dark:text-primary-300'
                    : 'border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:border-neutral-400 dark:hover:border-neutral-500',
                )}
              >
                <FileText size={14} />
                <span className="truncate max-w-[200px]">{task.fileName}</span>
                <StatusBadge
                  status={task.status}
                  colorMap={{
                    PENDING: 'neutral',
                    PROCESSING: 'blue',
                    COMPLETED: 'green',
                    FAILED: 'red',
                  }}
                  label={task.statusDisplayName}
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Selected task actions */}
      {selectedTask && (
        <div className="flex items-center gap-3 mb-4">
          {selectedTask.status === 'PENDING' && (
            <Button
              iconLeft={isProcessing ? <Loader2 size={16} className="animate-spin" /> : <Scan size={16} />}
              onClick={handleProcess}
              disabled={isProcessing}
            >
              {isProcessing ? t('ocrEstimate.processing') : t('ocrEstimate.startProcessing')}
            </Button>
          )}

          {selectedTask.status === 'COMPLETED' && selectedResultIds.size > 0 && (
            <Button
              iconLeft={<Check size={16} />}
              onClick={handleAcceptSelected}
              disabled={acceptResultsMutation.isPending}
            >
              {t('ocrEstimate.acceptSelected', { count: String(selectedResultIds.size) })}
            </Button>
          )}

          {selectedTask.totalLinesDetected != null && selectedTask.totalLinesDetected > 0 && (
            <div className="text-sm text-neutral-500 dark:text-neutral-400 ml-auto">
              {t('ocrEstimate.statsInfo', {
                lines: String(selectedTask.totalLinesDetected),
                confidence: String(selectedTask.averageConfidence?.toFixed(1) ?? '0'),
                time: String(selectedTask.processingTimeMs ?? 0),
              })}
            </div>
          )}
        </div>
      )}

      {/* Processing spinner */}
      {isProcessing && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 size={40} className="animate-spin mx-auto mb-3 text-primary-500" />
            <p className="text-neutral-600 dark:text-neutral-400 font-medium">
              {t('ocrEstimate.processingMessage')}
            </p>
          </div>
        </div>
      )}

      {/* Results table */}
      {selectedTask?.status === 'COMPLETED' && !isProcessing && (
        <DataTable<OcrEstimateResult>
          data={results ?? []}
          columns={columns}
          loading={resultsLoading}
          enableColumnVisibility
          enableDensityToggle
          enableExport
          pageSize={20}
          emptyTitle={t('ocrEstimate.emptyTitle')}
          emptyDescription={t('ocrEstimate.emptyDescription')}
        />
      )}

      {/* Empty state when no tasks */}
      {!tasksLoading && tasks.length === 0 && !selectedTask && (
        <EmptyState
          icon={<Scan size={48} />}
          title={t('ocrEstimate.noTasksTitle')}
          description={t('ocrEstimate.noTasksDescription')}
        />
      )}
    </div>
  );
};

export default OcrScannerPage;
