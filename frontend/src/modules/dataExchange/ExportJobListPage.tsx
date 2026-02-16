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
import type { ExportJob, ExportFormat, ImportEntityType } from './types';

const statusColorMap: Record<string, 'gray' | 'blue' | 'green' | 'yellow' | 'red'> = {
  PENDING: 'gray',
  IN_PROGRESS: 'blue',
  COMPLETED: 'green',
  FAILED: 'red',
};

const statusLabels: Record<string, string> = {
  PENDING: 'Ожидание',
  IN_PROGRESS: 'В процессе',
  COMPLETED: 'Готов',
  FAILED: 'Ошибка',
};

const entityTypeLabels: Record<string, string> = {
  PROJECTS: 'Проекты',
  CONTRACTS: 'Договоры',
  MATERIALS: 'Материалы',
  EMPLOYEES: 'Сотрудники',
  DOCUMENTS: 'Документы',
  WBS: 'Структура работ',
  BUDGET_ITEMS: 'Статьи бюджета',
  INVOICES: 'Счета',
};

const formatLabels: Record<string, string> = {
  CSV: 'CSV',
  XLSX: 'Excel',
  PDF: 'PDF',
  JSON: 'JSON',
};

function formatFileSize(bytes: number | undefined): string {
  if (!bytes) return '---';
  if (bytes < 1024) return `${bytes} Б`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} КБ`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`;
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
          entityTypeLabels[j.entityType]?.toLowerCase().includes(lower),
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
        header: 'Тип данных',
        size: 160,
        cell: ({ getValue }) => (
          <span className="font-medium text-neutral-900 dark:text-neutral-100">{entityTypeLabels[getValue<string>()] ?? getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'format',
        header: 'Формат',
        size: 100,
        cell: ({ getValue }) => (
          <span className="font-mono text-xs px-2 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded">{formatLabels[getValue<string>()] ?? getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Статус',
        size: 120,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={statusColorMap}
            label={statusLabels[getValue<string>()] ?? getValue<string>()}
          />
        ),
      },
      {
        accessorKey: 'totalRecords',
        header: 'Записей',
        size: 100,
        cell: ({ getValue }) => (
          <span className="font-mono text-neutral-600 tabular-nums">{formatNumber(getValue<number>())}</span>
        ),
      },
      {
        accessorKey: 'fileSize',
        header: 'Размер',
        size: 100,
        cell: ({ getValue }) => (
          <span className="text-neutral-600">{formatFileSize(getValue<number>())}</span>
        ),
      },
      {
        accessorKey: 'createdAt',
        header: 'Создан',
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
              Скачать
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
        title="Экспорт данных"
        subtitle={`${exports.length} задач экспорта`}
        breadcrumbs={[
          { label: 'Главная', href: '/' },
          { label: 'Обмен данными', href: '/data-exchange' },
          { label: 'Экспорт' },
        ]}
        actions={
          <Button iconLeft={<Download size={16} />} onClick={() => setCreateModalOpen(true)}>
            Новый экспорт
          </Button>
        }
        tabs={[
          { id: 'all', label: 'Все', count: counts.all },
          { id: 'COMPLETED', label: 'Готовые', count: counts.completed },
          { id: 'IN_PROGRESS', label: 'В процессе', count: counts.in_progress },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as TabId)}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard icon={<FileDown size={18} />} label="Всего экспортов" value={counts.all} />
        <MetricCard icon={<CheckCircle2 size={18} />} label="Готовы к скачиванию" value={counts.completed} />
        <MetricCard icon={<Clock size={18} />} label="В обработке" value={counts.in_progress} />
        <MetricCard icon={<FileSpreadsheet size={18} />} label="Всего записей" value={formatNumber(totalRecords)} />
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input placeholder="Поиск по типу, файлу..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select
          options={[
            { value: '', label: 'Все форматы' },
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
        emptyTitle="Нет задач экспорта"
        emptyDescription="Создайте новый экспорт данных"
      />

      {/* Create Export Modal */}
      <Modal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Новый экспорт данных"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Тип данных</label>
            <Select
              options={Object.entries(entityTypeLabels).map(([value, label]) => ({ value, label }))}
              value={exportEntity}
              onChange={(e) => setExportEntity(e.target.value as ImportEntityType)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Формат файла</label>
            <Select
              options={Object.entries(formatLabels).map(([value, label]) => ({ value, label }))}
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value as ExportFormat)}
            />
          </div>
          <div className="bg-neutral-50 dark:bg-neutral-800 rounded-lg p-3">
            <p className="text-sm text-neutral-600">
              Будет создан файл в формате <strong>{formatLabels[exportFormat]}</strong> с данными типа{' '}
              <strong>{entityTypeLabels[exportEntity]}</strong>. Файл будет доступен для скачивания после завершения обработки.
            </p>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setCreateModalOpen(false)}>Отмена</Button>
            <Button onClick={() => setCreateModalOpen(false)}>Создать экспорт</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ExportJobListPage;
