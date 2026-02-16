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
import type { ImportJob, ImportStatus, ImportEntityType } from './types';

const statusColorMap: Record<string, 'gray' | 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'orange'> = {
  PENDING: 'gray',
  VALIDATING: 'yellow',
  IN_PROGRESS: 'blue',
  COMPLETED: 'green',
  FAILED: 'red',
  PARTIALLY_COMPLETED: 'orange',
};

const statusLabels: Record<string, string> = {
  PENDING: 'Ожидание',
  VALIDATING: 'Валидация',
  IN_PROGRESS: 'В процессе',
  COMPLETED: 'Завершён',
  FAILED: 'Ошибка',
  PARTIALLY_COMPLETED: 'Частично',
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

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} Б`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} КБ`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`;
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
        header: 'Файл',
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
        header: 'Тип данных',
        size: 150,
        cell: ({ getValue }) => (
          <span className="text-neutral-700 dark:text-neutral-300">{entityTypeLabels[getValue<string>()] ?? getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Статус',
        size: 130,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={statusColorMap}
            label={statusLabels[getValue<string>()] ?? getValue<string>()}
          />
        ),
      },
      {
        id: 'progress',
        header: 'Прогресс',
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
        header: 'Результат',
        size: 120,
        cell: ({ row }) => (
          <div className="text-sm">
            <span className="text-green-600">{row.original.successCount}</span>
            {row.original.errorCount > 0 && (
              <span className="text-danger-600"> / {row.original.errorCount} ош.</span>
            )}
          </div>
        ),
      },
      {
        accessorKey: 'uploadedByName',
        header: 'Загрузил',
        size: 140,
      },
      {
        accessorKey: 'startedAt',
        header: 'Начало',
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
        title="Импорт данных"
        subtitle={`${imports.length} задач импорта`}
        breadcrumbs={[
          { label: 'Главная', href: '/' },
          { label: 'Обмен данными', href: '/data-exchange' },
          { label: 'Импорт' },
        ]}
        actions={
          <Button iconLeft={<Upload size={16} />}>
            Загрузить файл
          </Button>
        }
        tabs={[
          { id: 'all', label: 'Все', count: counts.all },
          { id: 'IN_PROGRESS', label: 'В процессе', count: counts.in_progress },
          { id: 'COMPLETED', label: 'Завершены', count: counts.completed },
          { id: 'FAILED', label: 'С ошибками', count: counts.failed },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as TabId)}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard icon={<FileUp size={18} />} label="Всего импортов" value={counts.all} />
        <MetricCard icon={<Clock size={18} />} label="В обработке" value={counts.in_progress} />
        <MetricCard icon={<CheckCircle2 size={18} />} label="Успешных" value={counts.completed} />
        <MetricCard icon={<AlertTriangle size={18} />} label="Всего строк" value={formatNumber(totalRows)} />
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input placeholder="Поиск по имени файла..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select
          options={[
            { value: '', label: 'Все типы данных' },
            ...Object.entries(entityTypeLabels).map(([value, label]) => ({ value, label })),
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
        emptyTitle="Нет задач импорта"
        emptyDescription="Загрузите файл для начала импорта данных"
      />
    </div>
  );
};

export default ImportJobListPage;
