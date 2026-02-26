import React, { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import {
  FileText,
  Download,
  Calendar,
  Hash,
  Loader2,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { DataTable } from '@/design-system/components/DataTable';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { MetricCard } from '@/design-system/components/MetricCard';
import { Select } from '@/design-system/components/FormField';
import { cn } from '@/lib/cn';
import { formatDateTime, formatMoney } from '@/lib/format';
import { integration1cApi } from '@/api/integration1c';
import { t } from '@/i18n';
import type { Ks2Act, Ks3Certificate, ExportRecord } from './types';

type TabId = 'ks2' | 'ks3' | 'history';

const exportStatusColorMap: Record<string, 'green' | 'red'> = {
  success: 'green',
  failed: 'red',
};

const Ks2Ks3ExportPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('ks2');
  const [format, setFormat] = useState('xml');
  const [selectedKs2, setSelectedKs2] = useState<string[]>([]);
  const [selectedKs3, setSelectedKs3] = useState<string[]>([]);

  // Fetch data
  const { data: ks2Acts = [] } = useQuery({
    queryKey: ['1c-ks2-acts'],
    queryFn: async () => {
      try {
        return await integration1cApi.getKs2Acts();
      } catch {
        return [];
      }
    },
  });

  const { data: ks3Certs = [] } = useQuery({
    queryKey: ['1c-ks3-certificates'],
    queryFn: async () => {
      try {
        return await integration1cApi.getKs3Certificates();
      } catch {
        return [];
      }
    },
  });

  const { data: exportHistory = [] } = useQuery({
    queryKey: ['1c-export-history'],
    queryFn: async () => {
      try {
        return await integration1cApi.getExportHistory();
      } catch {
        return [];
      }
    },
  });

  const exportKs2Mutation = useMutation({
    mutationFn: () => integration1cApi.exportKs2(selectedKs2, format),
    onSuccess: (blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ks2_export_${Date.now()}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(t('integration1c.exportSuccess'));
      setSelectedKs2([]);
    },
    onError: () => toast.error(t('integration1c.exportError')),
  });

  const exportKs3Mutation = useMutation({
    mutationFn: () => integration1cApi.exportKs3(selectedKs3, format),
    onSuccess: (blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ks3_export_${Date.now()}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(t('integration1c.exportSuccess'));
      setSelectedKs3([]);
    },
    onError: () => toast.error(t('integration1c.exportError')),
  });

  const handleToggleKs2 = useCallback((id: string) => {
    setSelectedKs2((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }, []);

  const handleToggleKs3 = useCallback((id: string) => {
    setSelectedKs3((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }, []);

  const handleSelectAllKs2 = useCallback(() => {
    setSelectedKs2((prev) =>
      prev.length === ks2Acts.length ? [] : ks2Acts.map((a) => a.id),
    );
  }, [ks2Acts]);

  const handleSelectAllKs3 = useCallback(() => {
    setSelectedKs3((prev) =>
      prev.length === ks3Certs.length ? [] : ks3Certs.map((c) => c.id),
    );
  }, [ks3Certs]);

  // Metrics
  const totalExported = exportHistory.length;
  const thisMonthExported = exportHistory.filter((r) => {
    const d = new Date(r.exportDate);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;
  const lastExportDate = exportHistory.length > 0
    ? formatDateTime(exportHistory[0].exportDate)
    : '--';

  const ks2Columns = useMemo<ColumnDef<Ks2Act, unknown>[]>(
    () => [
      {
        id: 'select',
        header: () => (
          <input
            type="checkbox"
            checked={selectedKs2.length === ks2Acts.length && ks2Acts.length > 0}
            onChange={handleSelectAllKs2}
            className="rounded border-neutral-300 dark:border-neutral-600"
          />
        ),
        size: 40,
        cell: ({ row }) => (
          <input
            type="checkbox"
            checked={selectedKs2.includes(row.original.id)}
            onChange={() => handleToggleKs2(row.original.id)}
            className="rounded border-neutral-300 dark:border-neutral-600"
          />
        ),
      },
      {
        accessorKey: 'number',
        header: t('integration1c.colNumber'),
        size: 120,
        cell: ({ getValue }) => (
          <span className="font-mono text-sm text-neutral-900 dark:text-neutral-100">
            {getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: 'date',
        header: t('integration1c.colDate'),
        size: 120,
        cell: ({ getValue }) => (
          <span className="text-sm text-neutral-700 dark:text-neutral-300">
            {formatDateTime(getValue<string>())}
          </span>
        ),
      },
      {
        accessorKey: 'contractor',
        header: t('integration1c.colContractor'),
        size: 200,
      },
      {
        accessorKey: 'project',
        header: t('integration1c.colProject'),
        size: 180,
      },
      {
        accessorKey: 'amount',
        header: t('integration1c.colAmount'),
        size: 140,
        cell: ({ getValue }) => (
          <span className="tabular-nums font-medium text-neutral-900 dark:text-neutral-100">
            {formatMoney(getValue<number>())}
          </span>
        ),
      },
      {
        accessorKey: 'status',
        header: t('integration1c.colStatus'),
        size: 120,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={{ signed: 'green', draft: 'gray', pending: 'yellow' }}
          />
        ),
      },
    ],
    [selectedKs2, ks2Acts, handleSelectAllKs2, handleToggleKs2],
  );

  const ks3Columns = useMemo<ColumnDef<Ks3Certificate, unknown>[]>(
    () => [
      {
        id: 'select',
        header: () => (
          <input
            type="checkbox"
            checked={selectedKs3.length === ks3Certs.length && ks3Certs.length > 0}
            onChange={handleSelectAllKs3}
            className="rounded border-neutral-300 dark:border-neutral-600"
          />
        ),
        size: 40,
        cell: ({ row }) => (
          <input
            type="checkbox"
            checked={selectedKs3.includes(row.original.id)}
            onChange={() => handleToggleKs3(row.original.id)}
            className="rounded border-neutral-300 dark:border-neutral-600"
          />
        ),
      },
      {
        accessorKey: 'number',
        header: t('integration1c.colNumber'),
        size: 120,
        cell: ({ getValue }) => (
          <span className="font-mono text-sm text-neutral-900 dark:text-neutral-100">
            {getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: 'date',
        header: t('integration1c.colDate'),
        size: 120,
        cell: ({ getValue }) => (
          <span className="text-sm text-neutral-700 dark:text-neutral-300">
            {formatDateTime(getValue<string>())}
          </span>
        ),
      },
      {
        accessorKey: 'contractor',
        header: t('integration1c.colContractor'),
        size: 200,
      },
      {
        accessorKey: 'project',
        header: t('integration1c.colProject'),
        size: 180,
      },
      {
        accessorKey: 'amount',
        header: t('integration1c.colAmount'),
        size: 140,
        cell: ({ getValue }) => (
          <span className="tabular-nums font-medium text-neutral-900 dark:text-neutral-100">
            {formatMoney(getValue<number>())}
          </span>
        ),
      },
      {
        accessorKey: 'status',
        header: t('integration1c.colStatus'),
        size: 120,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={{ signed: 'green', draft: 'gray', pending: 'yellow' }}
          />
        ),
      },
    ],
    [selectedKs3, ks3Certs, handleSelectAllKs3, handleToggleKs3],
  );

  const historyColumns = useMemo<ColumnDef<ExportRecord, unknown>[]>(
    () => [
      {
        accessorKey: 'fileName',
        header: t('integration1c.colFileName'),
        size: 200,
        cell: ({ getValue }) => (
          <div className="flex items-center gap-2">
            <FileText size={14} className="text-neutral-400" />
            <span className="text-sm text-neutral-900 dark:text-neutral-100">{getValue<string>()}</span>
          </div>
        ),
      },
      {
        accessorKey: 'type',
        header: t('integration1c.colType'),
        size: 100,
      },
      {
        accessorKey: 'format',
        header: t('integration1c.colFormat'),
        size: 80,
        cell: ({ getValue }) => (
          <span className="font-mono text-xs uppercase text-neutral-600 dark:text-neutral-400">
            {getValue<string>()}
          </span>
        ),
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
        size: 100,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={exportStatusColorMap}
            label={getValue<string>() === 'success' ? t('integration1c.statusSuccess') : t('integration1c.statusFailed')}
          />
        ),
      },
      {
        accessorKey: 'exportDate',
        header: t('integration1c.colExportDate'),
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

  const isExporting = exportKs2Mutation.isPending || exportKs3Mutation.isPending;
  const currentSelected = activeTab === 'ks2' ? selectedKs2 : selectedKs3;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('integration1c.ksExportTitle')}
        subtitle={t('integration1c.ksExportSubtitle')}
        breadcrumbs={[
          { label: t('common.home'), href: '/' },
          { label: t('integration1c.breadcrumbSettings'), href: '/settings' },
          { label: t('integration1c.dashboardTitle'), href: '/settings/1c' },
          { label: t('integration1c.ksExportTitle') },
        ]}
        backTo="/settings/1c"
        tabs={[
          { id: 'ks2', label: t('integration1c.tabKs2'), count: ks2Acts.length },
          { id: 'ks3', label: t('integration1c.tabKs3'), count: ks3Certs.length },
          { id: 'history', label: t('integration1c.tabHistory'), count: exportHistory.length },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as TabId)}
      />

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <MetricCard
          icon={<FileSpreadsheet size={16} />}
          label={t('integration1c.metricTotalExported')}
          value={totalExported}
        />
        <MetricCard
          icon={<Calendar size={16} />}
          label={t('integration1c.metricThisMonth')}
          value={thisMonthExported}
        />
        <MetricCard
          icon={<Hash size={16} />}
          label={t('integration1c.metricLastExport')}
          value={lastExportDate}
        />
      </div>

      {/* Export controls */}
      {activeTab !== 'history' && (
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                {t('integration1c.format')}:
              </label>
              <Select
                options={[
                  { value: 'xml', label: t('integration1c.formatXml') },
                  { value: 'csv', label: t('integration1c.formatCsv') },
                ]}
                value={format}
                onChange={(e) => setFormat(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
              <CheckCircle2 size={14} className="text-primary-500" />
              {t('integration1c.selectedCount', { count: String(currentSelected.length) })}
            </div>
            <Button
              iconLeft={isExporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
              onClick={() => activeTab === 'ks2' ? exportKs2Mutation.mutate() : exportKs3Mutation.mutate()}
              disabled={currentSelected.length === 0 || isExporting}
            >
              {t('integration1c.exportBtn')}
            </Button>
          </div>
        </div>
      )}

      {/* Tables */}
      {activeTab === 'ks2' && (
        <DataTable<Ks2Act>
          data={ks2Acts}
          columns={ks2Columns}
          enableColumnVisibility
          enableDensityToggle
          pageSize={15}
          emptyTitle={t('integration1c.emptyKs2Title')}
          emptyDescription={t('integration1c.emptyKs2Description')}
        />
      )}

      {activeTab === 'ks3' && (
        <DataTable<Ks3Certificate>
          data={ks3Certs}
          columns={ks3Columns}
          enableColumnVisibility
          enableDensityToggle
          pageSize={15}
          emptyTitle={t('integration1c.emptyKs3Title')}
          emptyDescription={t('integration1c.emptyKs3Description')}
        />
      )}

      {activeTab === 'history' && (
        <DataTable<ExportRecord>
          data={exportHistory}
          columns={historyColumns}
          enableColumnVisibility
          enableDensityToggle
          enableExport
          pageSize={20}
          emptyTitle={t('integration1c.emptyHistoryTitle')}
          emptyDescription={t('integration1c.emptyHistoryDescription')}
        />
      )}
    </div>
  );
};

export default Ks2Ks3ExportPage;
