import React, { useState, useMemo, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import {
  Box,
  Upload,
  Search,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Download,
  Trash2,
  Loader2,
  HardDrive,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { DataTable } from '@/design-system/components/DataTable';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { MetricCard } from '@/design-system/components/MetricCard';
import { Input } from '@/design-system/components/FormField';
import { apiClient } from '@/api/client';
import { formatDateTime, formatFileSize, formatNumber } from '@/lib/format';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface BimFile {
  id: string;
  fileName: string;
  format: string;
  fileSize: number;
  uploadedAt: string;
  uploadedBy: string;
  status: 'PROCESSING' | 'READY' | 'ERROR' | 'PENDING';
  elementCount: number;
  projectName: string;
}

interface ClashResult {
  id: string;
  modelA: string;
  modelB: string;
  clashType: string;
  severity: 'CRITICAL' | 'MAJOR' | 'MINOR';
  description: string;
  location: string;
  status: 'OPEN' | 'RESOLVED' | 'IGNORED';
  detectedAt: string;
}

const fileStatusColorMap: Record<string, 'green' | 'yellow' | 'red' | 'gray'> = {
  ready: 'green',
  processing: 'yellow',
  error: 'red',
  pending: 'gray',
};

const getFileStatusLabels = (): Record<string, string> => ({
  ready: t('integrations.bim.fileStatusReady'),
  processing: t('integrations.bim.fileStatusProcessing'),
  error: t('integrations.bim.fileStatusError'),
  pending: t('integrations.bim.fileStatusPending'),
});

const clashSeverityColorMap: Record<string, 'red' | 'orange' | 'yellow'> = {
  critical: 'red',
  major: 'orange',
  minor: 'yellow',
};

const getClashSeverityLabels = (): Record<string, string> => ({
  critical: t('integrations.bim.severityCritical'),
  major: t('integrations.bim.severityMajor'),
  minor: t('integrations.bim.severityMinor'),
});

const clashStatusColorMap: Record<string, 'blue' | 'green' | 'gray'> = {
  open: 'blue',
  resolved: 'green',
  ignored: 'gray',
};

const getClashStatusLabels = (): Record<string, string> => ({
  open: t('integrations.bim.clashStatusOpen'),
  resolved: t('integrations.bim.clashStatusResolved'),
  ignored: t('integrations.bim.clashStatusIgnored'),
});

// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

type TabId = 'files' | 'clashes';

const BimPage: React.FC = () => {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<TabId>('files');
  const [search, setSearch] = useState('');
  const [dragActive, setDragActive] = useState(false);

  // Fetch files
  const { data: files, isLoading: filesLoading } = useQuery({
    queryKey: ['bim-files'],
    queryFn: async () => {
      try {
        const res = await apiClient.get('/integrations/bim/files', { _silentErrors: true } as any);
        return res.data as BimFile[];
      } catch {
        return undefined;
      }
    },
  });

  // Fetch clashes
  const { data: clashes, isLoading: clashesLoading } = useQuery({
    queryKey: ['bim-clashes'],
    queryFn: async () => {
      try {
        const res = await apiClient.get('/integrations/bim/clashes', { _silentErrors: true } as any);
        return res.data as ClashResult[];
      } catch {
        return undefined;
      }
    },
  });

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      await apiClient.post('/integrations/bim/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
    onSuccess: () => {
      toast.success(t('integrations.bim.uploadSuccess'));
      queryClient.invalidateQueries({ queryKey: ['bim-files'] });
    },
    onError: () => {
      toast.error(t('integrations.bim.uploadError'));
    },
  });

  // Export quantity takeoff mutation
  const exportMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.get('/integrations/bim/quantity-takeoff/export', {
        responseType: 'blob',
      });
      const blob = new Blob([res.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `quantity_takeoff_${new Date().toISOString().slice(0, 10)}.xlsx`;
      link.click();
      URL.revokeObjectURL(url);
    },
    onSuccess: () => {
      toast.success(t('integrations.bim.exportSuccess'));
    },
    onError: () => {
      toast.error(t('integrations.bim.exportError'));
    },
  });

  const allFiles = files ?? [];
  const allClashes = clashes ?? [];

  const filteredFiles = useMemo(() => {
    if (!search) return allFiles;
    const lower = search.toLowerCase();
    return allFiles.filter(
      (f) =>
        f.fileName.toLowerCase().includes(lower) ||
        f.projectName.toLowerCase().includes(lower) ||
        f.uploadedBy.toLowerCase().includes(lower),
    );
  }, [allFiles, search]);

  const filteredClashes = useMemo(() => {
    if (!search) return allClashes;
    const lower = search.toLowerCase();
    return allClashes.filter(
      (c) =>
        c.description.toLowerCase().includes(lower) ||
        c.modelA.toLowerCase().includes(lower) ||
        c.modelB.toLowerCase().includes(lower) ||
        c.location.toLowerCase().includes(lower),
    );
  }, [allClashes, search]);

  const handleFileUpload = useCallback(
    (fileList: FileList | null) => {
      if (!fileList || fileList.length === 0) return;
      const file = fileList[0]!;
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (ext !== 'ifc') {
        toast.error(t('integrations.bim.onlyIfcSupported'));
        return;
      }
      uploadMutation.mutate(file);
    },
    [uploadMutation],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      handleFileUpload(e.dataTransfer.files);
    },
    [handleFileUpload],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragActive(false);
  }, []);

  const fileStatusLabels = getFileStatusLabels();
  const clashSeverityLabels = getClashSeverityLabels();
  const clashStatusLabels = getClashStatusLabels();

  // File columns
  const fileColumns = useMemo<ColumnDef<BimFile, unknown>[]>(
    () => [
      {
        accessorKey: 'fileName',
        header: t('integrations.bim.colFile'),
        size: 280,
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-neutral-900 dark:text-neutral-100">{row.original.fileName}</p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{row.original.projectName}</p>
          </div>
        ),
      },
      {
        accessorKey: 'format',
        header: t('integrations.bim.colFormat'),
        size: 80,
        cell: ({ getValue }) => (
          <span className="font-mono text-xs bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded">
            {getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: 'fileSize',
        header: t('integrations.bim.colSize'),
        size: 100,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-neutral-600 text-xs">
            {formatFileSize(getValue<number>())}
          </span>
        ),
      },
      {
        accessorKey: 'status',
        header: t('integrations.bim.colStatus'),
        size: 120,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={fileStatusColorMap}
            label={fileStatusLabels[getValue<string>()]}
          />
        ),
      },
      {
        accessorKey: 'elementCount',
        header: t('integrations.bim.colElements'),
        size: 110,
        cell: ({ getValue }) => {
          const v = getValue<number>();
          return v > 0 ? (
            <span className="tabular-nums text-neutral-700 dark:text-neutral-300">
              {formatNumber(v)}
            </span>
          ) : (
            <span className="text-neutral-400">--</span>
          );
        },
      },
      {
        accessorKey: 'uploadedAt',
        header: t('integrations.bim.colUploaded'),
        size: 150,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-neutral-700 dark:text-neutral-300 text-xs">
            {formatDateTime(getValue<string>())}
          </span>
        ),
      },
      {
        accessorKey: 'uploadedBy',
        header: t('integrations.bim.colUploadedBy'),
        size: 130,
        cell: ({ getValue }) => (
          <span className="text-neutral-500 dark:text-neutral-400">{getValue<string>()}</span>
        ),
      },
    ],
    [],
  );

  // Clash columns
  const clashColumns = useMemo<ColumnDef<ClashResult, unknown>[]>(
    () => [
      {
        accessorKey: 'description',
        header: t('integrations.bim.colDescription'),
        size: 320,
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-neutral-900 dark:text-neutral-100 text-xs">
              {row.original.description}
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              {row.original.modelA} / {row.original.modelB}
            </p>
          </div>
        ),
      },
      {
        accessorKey: 'clashType',
        header: t('integrations.bim.colType'),
        size: 130,
        cell: ({ getValue }) => (
          <span className="text-neutral-700 dark:text-neutral-300 text-xs">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'severity',
        header: t('integrations.bim.colSeverity'),
        size: 130,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={clashSeverityColorMap}
            label={clashSeverityLabels[getValue<string>()]}
          />
        ),
      },
      {
        accessorKey: 'location',
        header: t('integrations.bim.colLocation'),
        size: 160,
        cell: ({ getValue }) => (
          <span className="text-neutral-700 dark:text-neutral-300 text-xs">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'status',
        header: t('integrations.bim.colClashStatus'),
        size: 140,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={clashStatusColorMap}
            label={clashStatusLabels[getValue<string>()]}
          />
        ),
      },
      {
        accessorKey: 'detectedAt',
        header: t('integrations.bim.colDetected'),
        size: 150,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-neutral-700 dark:text-neutral-300 text-xs">
            {formatDateTime(getValue<string>())}
          </span>
        ),
      },
    ],
    [],
  );

  const readyFiles = allFiles.filter((f) => f.status === 'READY').length;
  const openClashes = allClashes.filter((c) => c.status === 'OPEN').length;
  const criticalClashes = allClashes.filter(
    (c) => c.severity === 'CRITICAL' && c.status === 'OPEN',
  ).length;
  const totalElements = allFiles.reduce((s, f) => s + f.elementCount, 0);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="BIM / Renga"
        subtitle={t('integrations.bim.subtitle')}
        breadcrumbs={[
          { label: t('integrations.bim.breadcrumbHome'), href: '/' },
          { label: t('integrations.bim.breadcrumbSettings'), href: '/settings' },
          { label: t('integrations.bim.breadcrumbIntegrations'), href: '/integrations' },
          { label: 'BIM / Renga' },
        ]}
        backTo="/integrations"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              iconLeft={<Download size={16} />}
              onClick={() => exportMutation.mutate()}
              loading={exportMutation.isPending}
            >
              {t('integrations.bim.exportVolumes')}
            </Button>
            <Button
              iconLeft={<Upload size={16} />}
              onClick={() => fileInputRef.current?.click()}
              loading={uploadMutation.isPending}
            >
              {t('integrations.bim.uploadIfc')}
            </Button>
          </div>
        }
        tabs={[
          { id: 'files', label: t('integrations.bim.tabFiles'), count: allFiles.length },
          { id: 'clashes', label: t('integrations.bim.tabClashes'), count: allClashes.length },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as TabId)}
      />

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".ifc"
        className="hidden"
        onChange={(e) => handleFileUpload(e.target.files)}
      />

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <MetricCard icon={<FileText size={18} />} label={t('integrations.bim.metricFilesUploaded')} value={allFiles.length} />
        <MetricCard icon={<CheckCircle2 size={18} />} label={t('integrations.bim.metricProcessed')} value={readyFiles} />
        <MetricCard icon={<Box size={18} />} label={t('integrations.bim.metricElements')} value={formatNumber(totalElements)} />
        <MetricCard
          icon={<AlertTriangle size={18} />}
          label={t('integrations.bim.metricOpenClashes')}
          value={openClashes}
          subtitle={criticalClashes > 0 ? `${criticalClashes} ${t('integrations.bim.criticalCount')}` : undefined}
        />
      </div>

      {/* Upload drop zone */}
      {activeTab === 'files' && (
        <div
          className={cn(
            'border-2 border-dashed rounded-xl p-8 mb-6 flex flex-col items-center justify-center transition-colors cursor-pointer',
            dragActive
              ? 'border-primary-400 bg-primary-50'
              : 'border-neutral-300 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-800 hover:border-primary-300 hover:bg-primary-25',
          )}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
        >
          {uploadMutation.isPending ? (
            <Loader2 size={36} className="text-primary-500 animate-spin mb-3" />
          ) : (
            <Upload size={36} className="text-neutral-400 mb-3" />
          )}
          <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
            {uploadMutation.isPending
              ? t('integrations.bim.uploading')
              : t('integrations.bim.dropZoneText')}
          </p>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            {t('integrations.bim.supportedFormat')}
          </p>
        </div>
      )}

      {/* Search */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
          />
          <Input
            placeholder={
              activeTab === 'files'
                ? t('integrations.bim.searchFiles')
                : t('integrations.bim.searchClashes')
            }
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Tables */}
      {activeTab === 'files' && (
        <DataTable<BimFile>
          data={filteredFiles ?? []}
          columns={fileColumns}
          loading={filesLoading}
          enableColumnVisibility
          enableDensityToggle
          enableExport
          pageSize={20}
          emptyTitle={t('integrations.bim.emptyFilesTitle')}
          emptyDescription={t('integrations.bim.emptyFilesDescription')}
        />
      )}

      {activeTab === 'clashes' && (
        <DataTable<ClashResult>
          data={filteredClashes ?? []}
          columns={clashColumns}
          loading={clashesLoading}
          enableColumnVisibility
          enableDensityToggle
          enableExport
          pageSize={20}
          emptyTitle={t('integrations.bim.emptyClashesTitle')}
          emptyDescription={t('integrations.bim.emptyClashesDescription')}
        />
      )}
    </div>
  );
};

export default BimPage;
