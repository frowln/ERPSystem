import React, { useState, useMemo, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import {
  FileCheck,
  Clock,
  AlertTriangle,
  Download,
  Paperclip,
  BarChart3,
  Upload,
  Package,
  AlertCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { DataTable } from '@/design-system/components/DataTable';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { MetricCard } from '@/design-system/components/MetricCard';
import { Modal } from '@/design-system/components/Modal';
import { Select } from '@/design-system/components/FormField';
import { closeoutApi } from '@/api/closeout';
import { projectsApi } from '@/api/projects';
import { formatDate } from '@/lib/format';
import { t } from '@/i18n';
import type { StroyNadzorDocument, StroyNadzorDocStatus } from './types';
import type { PaginatedResponse } from '@/types';

const statusColorMap: Record<string, 'green' | 'yellow' | 'red' | 'gray'> = {
  attached: 'green',
  pending: 'yellow',
  missing: 'red',
  expired: 'gray',
};

const getStatusLabel = (status: StroyNadzorDocStatus): string => {
  switch (status) {
    case 'attached':
      return t('closeout.stroyNadzorStatusAttached');
    case 'pending':
      return t('closeout.stroyNadzorStatusPending');
    case 'missing':
      return t('closeout.stroyNadzorStatusMissing');
    case 'expired':
      return t('closeout.stroyNadzorStatusExpired');
  }
};

const CATEGORIES = [
  'design_docs',
  'permits',
  'inspection_acts',
  'test_protocols',
  'certificates',
  'as_built',
] as const;

const getCategoryLabel = (category: string): string => {
  switch (category) {
    case 'design_docs':
      return t('closeout.stroyNadzorCatDesignDocs');
    case 'permits':
      return t('closeout.stroyNadzorCatPermits');
    case 'inspection_acts':
      return t('closeout.stroyNadzorCatInspectionActs');
    case 'test_protocols':
      return t('closeout.stroyNadzorCatTestProtocols');
    case 'certificates':
      return t('closeout.stroyNadzorCatCertificates');
    case 'as_built':
      return t('closeout.stroyNadzorCatAsBuilt');
    default:
      return category;
  }
};

type TabId = 'all' | 'attached' | 'pending' | 'missing' | 'expired';

const StroyNadzorPackagePage: React.FC = () => {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [uploadingDocId, setUploadingDocId] = useState<string | null>(null);
  const [generatingPackage, setGeneratingPackage] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [confirmGenerateModal, setConfirmGenerateModal] = useState(false);

  const { data: projectsData } = useQuery({
    queryKey: ['projects-list'],
    queryFn: () => projectsApi.getProjects({ size: 200 }),
  });

  const projects = (projectsData as PaginatedResponse<{ id: string; name: string }> | undefined)?.content ?? [];

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['stroynadzor-documents', selectedProjectId],
    queryFn: () => closeoutApi.getStroyNadzorDocuments(selectedProjectId || undefined),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status, fileName }: { id: string; status: StroyNadzorDocStatus; fileName?: string }) =>
      closeoutApi.updateStroyNadzorDocStatus(id, status, fileName),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['stroynadzor-documents'] });
      toast.success(t('closeout.stroyNadzorStatusUpdated'));
    },
    onError: () => {
      toast.error(t('closeout.stroyNadzorStatusError'));
    },
  });

  const uploadMutation = useMutation({
    mutationFn: ({ itemId, file }: { itemId: string; file: File }) =>
      closeoutApi.uploadStroyNadzorDocument(selectedProjectId, itemId, file),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['stroynadzor-documents'] });
      setUploadingDocId(null);
      toast.success(t('closeout.stroyNadzorUploadSuccess'));
    },
    onError: () => {
      setUploadingDocId(null);
      toast.error(t('closeout.stroyNadzorUploadError'));
    },
  });

  const filtered = useMemo(() => {
    let result = documents;
    if (activeTab !== 'all') {
      result = result.filter((d) => d.status === activeTab);
    }
    if (categoryFilter) {
      result = result.filter((d) => d.category === categoryFilter);
    }
    return result;
  }, [documents, activeTab, categoryFilter]);

  const metrics = useMemo(() => {
    const total = documents.length;
    const attached = documents.filter((d) => d.status === 'attached').length;
    const pending = documents.filter((d) => d.status === 'pending').length;
    const missing = documents.filter((d) => d.status === 'missing').length;
    const expired = documents.filter((d) => d.status === 'expired').length;
    const required = documents.filter((d) => d.required).length;
    const requiredAttached = documents.filter((d) => d.required && d.status === 'attached').length;
    const percent = total > 0 ? Math.round((attached / total) * 100) : 0;
    const requiredPercent = required > 0 ? Math.round((requiredAttached / required) * 100) : 0;
    return { total, attached, pending, missing, expired, required, requiredAttached, percent, requiredPercent };
  }, [documents]);

  const handleFileUpload = useCallback(
    (docId: string) => {
      setUploadingDocId(docId);
      fileInputRef.current?.click();
    },
    [],
  );

  const handleFileSelected = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !uploadingDocId) {
        setUploadingDocId(null);
        return;
      }
      uploadMutation.mutate({ itemId: uploadingDocId, file });
      // Reset input
      e.target.value = '';
    },
    [uploadingDocId, uploadMutation],
  );

  const handleMarkAttached = useCallback(
    (doc: StroyNadzorDocument) => {
      updateStatusMutation.mutate({ id: doc.id, status: 'attached', fileName: doc.fileName });
    },
    [updateStatusMutation],
  );

  const handleGeneratePackage = useCallback(async () => {
    if (!selectedProjectId) {
      toast.error(t('closeout.stroyNadzorSelectProject'));
      return;
    }
    setGeneratingPackage(true);
    setConfirmGenerateModal(false);
    try {
      const blob = await closeoutApi.generateStroyNadzorPackage(selectedProjectId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `stroynadzor-package-${selectedProjectId.slice(0, 8)}.zip`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success(t('closeout.stroyNadzorPackageGenerated'));
    } catch {
      toast.error(t('closeout.stroyNadzorPackageError'));
    } finally {
      setGeneratingPackage(false);
    }
  }, [selectedProjectId]);

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const columns = useMemo<ColumnDef<StroyNadzorDocument, unknown>[]>(
    () => [
      {
        accessorKey: 'documentName',
        header: t('closeout.stroyNadzorColName'),
        size: 280,
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-neutral-900 dark:text-neutral-100 truncate max-w-[260px]">
              {row.original.documentName}
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              {getCategoryLabel(row.original.category)}
            </p>
          </div>
        ),
      },
      {
        accessorKey: 'required',
        header: t('closeout.stroyNadzorColRequired'),
        size: 100,
        cell: ({ getValue }) => (
          <span className={`text-xs font-medium ${getValue<boolean>() ? 'text-red-600 dark:text-red-400' : 'text-neutral-400'}`}>
            {getValue<boolean>() ? t('closeout.stroyNadzorRequired') : t('closeout.stroyNadzorOptional')}
          </span>
        ),
      },
      {
        accessorKey: 'status',
        header: t('closeout.stroyNadzorColStatus'),
        size: 140,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={statusColorMap}
            label={getStatusLabel(getValue<StroyNadzorDocStatus>())}
          />
        ),
      },
      {
        accessorKey: 'fileName',
        header: t('closeout.stroyNadzorColFile'),
        size: 200,
        cell: ({ row }) => {
          const { fileName, fileSize } = row.original;
          return fileName ? (
            <div className="flex items-center gap-1 text-sm text-primary-600 dark:text-primary-400">
              <Paperclip size={14} />
              <span className="truncate max-w-[120px]">{fileName}</span>
              {fileSize != null && fileSize > 0 && (
                <span className="text-xs text-neutral-400 ml-1">
                  ({formatFileSize(fileSize)})
                </span>
              )}
            </div>
          ) : (
            <span className="text-neutral-400">{'\u2014'}</span>
          );
        },
      },
      {
        accessorKey: 'uploadDate',
        header: t('closeout.stroyNadzorColUploadDate'),
        size: 120,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-neutral-600 dark:text-neutral-400">
            {getValue<string>() ? formatDate(getValue<string>()) : '\u2014'}
          </span>
        ),
      },
      {
        accessorKey: 'expiryDate',
        header: t('closeout.stroyNadzorColExpiryDate'),
        size: 120,
        cell: ({ row }) => {
          const expiry = row.original.expiryDate;
          if (!expiry) return <span className="text-neutral-400">{'\u2014'}</span>;
          const isExpired = new Date(expiry) < new Date();
          return (
            <span className={`tabular-nums ${isExpired ? 'text-red-600 dark:text-red-400 font-medium' : 'text-neutral-600 dark:text-neutral-400'}`}>
              {formatDate(expiry)}
            </span>
          );
        },
      },
      {
        accessorKey: 'notes',
        header: t('closeout.stroyNadzorColNotes'),
        size: 180,
        cell: ({ getValue }) => (
          <span className="text-neutral-600 dark:text-neutral-400 truncate max-w-[160px] block text-sm">
            {getValue<string>() || '\u2014'}
          </span>
        ),
      },
      {
        id: 'actions',
        header: '',
        size: 160,
        cell: ({ row }) => (
          <div className="flex gap-1">
            {row.original.status !== 'attached' && (
              <>
                <Button
                  variant="ghost"
                  size="xs"
                  iconLeft={<Upload size={12} />}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleFileUpload(row.original.id);
                  }}
                  loading={uploadingDocId === row.original.id && uploadMutation.isPending}
                >
                  {t('closeout.stroyNadzorUploadFile')}
                </Button>
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMarkAttached(row.original);
                  }}
                >
                  {t('closeout.stroyNadzorMarkAttached')}
                </Button>
              </>
            )}
          </div>
        ),
      },
    ],
    [handleFileUpload, handleMarkAttached, uploadingDocId, uploadMutation.isPending],
  );

  const projectOptions = useMemo(
    () => [
      { value: '', label: t('closeout.stroyNadzorAllProjects') },
      ...projects.map((p) => ({ value: p.id, label: p.name })),
    ],
    [projects],
  );

  const categoryOptions = useMemo(
    () => [
      { value: '', label: t('closeout.stroyNadzorAllCategories') },
      ...CATEGORIES.map((c) => ({ value: c, label: getCategoryLabel(c) })),
    ],
    [],
  );

  return (
    <div className="animate-fade-in">
      {/* Hidden file input for per-document upload */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileSelected}
      />

      <PageHeader
        title={t('closeout.stroyNadzorTitle')}
        subtitle={t('closeout.stroyNadzorSubtitle')}
        breadcrumbs={[
          { label: t('closeout.breadcrumbHome'), href: '/' },
          { label: t('closeout.breadcrumbCloseout'), href: '/closeout/dashboard' },
          { label: t('closeout.stroyNadzorTitle') },
        ]}
        actions={
          <div className="flex gap-2">
            <Button
              variant="secondary"
              iconLeft={<Package size={16} />}
              onClick={() => setConfirmGenerateModal(true)}
              disabled={metrics.attached === 0 || !selectedProjectId}
              loading={generatingPackage}
            >
              {t('closeout.stroyNadzorGeneratePackage')}
            </Button>
            <Button
              iconLeft={<Download size={16} />}
              onClick={() => void handleGeneratePackage()}
              disabled={metrics.attached === 0 || !selectedProjectId}
            >
              {t('closeout.stroyNadzorDownloadAll')}
            </Button>
          </div>
        }
        tabs={[
          { id: 'all', label: t('common.all'), count: metrics.total },
          { id: 'attached', label: t('closeout.stroyNadzorStatusAttached'), count: metrics.attached },
          { id: 'pending', label: t('closeout.stroyNadzorStatusPending'), count: metrics.pending },
          { id: 'missing', label: t('closeout.stroyNadzorStatusMissing'), count: metrics.missing },
          { id: 'expired', label: t('closeout.stroyNadzorStatusExpired'), count: metrics.expired },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as TabId)}
      />

      {/* Project and Category selectors */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
            {t('closeout.stroyNadzorProject')}:
          </label>
          <Select
            options={projectOptions}
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="w-64"
          />
        </div>
        <Select
          options={categoryOptions}
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="w-56"
        />
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <MetricCard
          icon={<FileCheck size={18} />}
          label={t('closeout.stroyNadzorMetricTotal')}
          value={metrics.total}
        />
        <MetricCard
          icon={<Paperclip size={18} />}
          label={t('closeout.stroyNadzorMetricAttached')}
          value={metrics.attached}
        />
        <MetricCard
          icon={<Clock size={18} />}
          label={t('closeout.stroyNadzorMetricPending')}
          value={metrics.pending}
        />
        <MetricCard
          icon={<AlertTriangle size={18} />}
          label={t('closeout.stroyNadzorMetricMissing')}
          value={metrics.missing}
        />
        <MetricCard
          icon={<BarChart3 size={18} />}
          label={t('closeout.stroyNadzorMetricProgress')}
          value={`${metrics.percent}%`}
        />
      </div>

      {/* Progress bars */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
              {t('closeout.stroyNadzorProgress')}
            </span>
            <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 tabular-nums">
              {metrics.attached}/{metrics.total} ({metrics.percent}%)
            </span>
          </div>
          <div className="h-3 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 rounded-full transition-all duration-500"
              style={{ width: `${metrics.percent}%` }}
            />
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
              {t('closeout.stroyNadzorRequiredProgress')}
            </span>
            <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 tabular-nums">
              {metrics.requiredAttached}/{metrics.required} ({metrics.requiredPercent}%)
            </span>
          </div>
          <div className="h-3 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                metrics.requiredPercent === 100 ? 'bg-green-500' : 'bg-yellow-500'
              }`}
              style={{ width: `${metrics.requiredPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Missing required documents warning */}
      {metrics.required > metrics.requiredAttached && (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3">
          <AlertCircle size={18} className="text-red-600 dark:text-red-400 flex-shrink-0" />
          <span className="text-sm text-red-700 dark:text-red-300">
            {t('closeout.stroyNadzorMissingRequired', {
              count: String(metrics.required - metrics.requiredAttached),
            })}
          </span>
        </div>
      )}

      <DataTable<StroyNadzorDocument>
        data={filtered}
        columns={columns}
        loading={isLoading}
        enableColumnVisibility
        enableExport
        pageSize={20}
        emptyTitle={t('closeout.stroyNadzorEmpty')}
        emptyDescription={t('closeout.stroyNadzorEmptyDesc')}
      />

      {/* Generate Package Confirmation Modal */}
      <Modal
        open={confirmGenerateModal}
        onClose={() => setConfirmGenerateModal(false)}
        title={t('closeout.stroyNadzorGeneratePackageTitle')}
      >
        <div className="space-y-4">
          <p className="text-sm text-neutral-700 dark:text-neutral-300">
            {t('closeout.stroyNadzorGeneratePackageDesc', {
              attached: String(metrics.attached),
              total: String(metrics.total),
            })}
          </p>
          {metrics.missing > 0 && (
            <div className="flex items-center gap-2 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 px-3 py-2">
              <AlertTriangle size={16} className="text-yellow-600 dark:text-yellow-400" />
              <span className="text-xs text-yellow-700 dark:text-yellow-300">
                {t('closeout.stroyNadzorGeneratePackageWarning', { missing: String(metrics.missing) })}
              </span>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setConfirmGenerateModal(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              iconLeft={<Package size={16} />}
              onClick={() => void handleGeneratePackage()}
              loading={generatingPackage}
            >
              {t('closeout.stroyNadzorGeneratePackage')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default StroyNadzorPackagePage;
