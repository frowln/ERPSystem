import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { Plus, Search, Box, Upload, Eye } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { DataTable } from '@/design-system/components/DataTable';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { MetricCard } from '@/design-system/components/MetricCard';
import { Input } from '@/design-system/components/FormField';
import { bimApi, type BimModel } from '@/api/bim';
import { formatDate } from '@/lib/format';

const statusColorMap: Record<string, 'green' | 'yellow' | 'blue' | 'gray' | 'red'> = {
  active: 'green',
  processing: 'yellow',
  review: 'blue',
  archived: 'gray',
  error: 'red',
};
const statusLabels: Record<string, string> = {
  active: 'Активная',
  processing: 'Обработка',
  review: 'На проверке',
  archived: 'В архиве',
  error: 'Ошибка',
};

const BimModelListPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<string>('all');

  const { data: modelsData, isLoading } = useQuery({
    queryKey: ['bim-models'],
    queryFn: () => bimApi.getModels(),
  });

  const models = modelsData?.content ?? [];

  const filtered = useMemo(() => {
    let result = models;
    if (activeTab !== 'all') result = result.filter((m) => m.status === activeTab);
    if (search) {
      const lower = search.toLowerCase();
      result = result.filter(
        (m) => m.name.toLowerCase().includes(lower) || m.projectName.toLowerCase().includes(lower),
      );
    }
    return result;
  }, [models, activeTab, search]);

  const tabCounts = useMemo(() => ({
    all: models.length,
    active: models.filter((m) => m.status === 'ACTIVE').length,
    processing: models.filter((m) => m.status === 'PROCESSING').length,
    review: models.filter((m) => m.status === 'REVIEW').length,
  }), [models]);

  const columns = useMemo<ColumnDef<BimModel, unknown>[]>(() => [
    {
      accessorKey: 'name',
      header: 'Название модели',
      size: 280,
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-neutral-900 dark:text-neutral-100">{row.original.name}</p>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{row.original.projectName}</p>
        </div>
      ),
    },
    {
      accessorKey: 'format',
      header: 'Формат',
      size: 80,
      cell: ({ getValue }) => (
        <span className="font-mono text-xs bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded">{getValue<string>()}</span>
      ),
    },
    {
      accessorKey: 'version',
      header: 'Версия',
      size: 80,
      cell: ({ getValue }) => <span className="text-neutral-600 text-sm">{getValue<string>()}</span>,
    },
    {
      accessorKey: 'uploadDate',
      header: 'Дата загрузки',
      size: 120,
      cell: ({ getValue }) => <span className="tabular-nums">{formatDate(getValue<string>())}</span>,
    },
    {
      accessorKey: 'fileSize',
      header: 'Размер',
      size: 100,
      cell: ({ getValue }) => <span className="tabular-nums text-neutral-600">{getValue<string>()}</span>,
    },
    {
      accessorKey: 'status',
      header: 'Статус',
      size: 120,
      cell: ({ getValue }) => (
        <StatusBadge status={getValue<string>()} colorMap={statusColorMap} label={statusLabels[getValue<string>()]} />
      ),
    },
    {
      accessorKey: 'uploadedBy',
      header: 'Загрузил',
      size: 140,
    },
    {
      id: 'actions',
      header: '',
      size: 50,
      cell: () => (
        <button className="p-1.5 text-neutral-400 hover:text-primary-600 hover:bg-primary-50 rounded-md transition-colors">
          <Eye size={16} />
        </button>
      ),
    },
  ], []);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="BIM Модели"
        subtitle={`${models.length} моделей в системе`}
        breadcrumbs={[
          { label: 'Главная', href: '/' },
          { label: 'BIM' },
          { label: 'Модели' },
        ]}
        actions={
          <Button iconLeft={<Upload size={16} />}>
            Загрузить модель
          </Button>
        }
        tabs={[
          { id: 'all', label: 'Все', count: tabCounts.all },
          { id: 'ACTIVE', label: 'Активные', count: tabCounts.active },
          { id: 'PROCESSING', label: 'Обработка', count: tabCounts.processing },
          { id: 'REVIEW', label: 'На проверке', count: tabCounts.review },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <MetricCard icon={<Box size={18} />} label="Всего моделей" value={models.length} />
        <MetricCard icon={<Box size={18} />} label="Активных" value={tabCounts.active} />
        <MetricCard icon={<Box size={18} />} label="На обработке" value={tabCounts.processing} />
        <MetricCard icon={<Box size={18} />} label="На проверке" value={tabCounts.review} />
      </div>

      {/* 3D Viewer placeholder */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-8 mb-6 flex flex-col items-center justify-center min-h-[200px]">
        <Box size={48} className="text-neutral-300 mb-3" />
        <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">3D Просмотрщик</p>
        <p className="text-xs text-neutral-400 mt-1">Выберите модель для просмотра в 3D</p>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input placeholder="Поиск по названию..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>

      <DataTable<BimModel>
        data={filtered}
        columns={columns}
        loading={isLoading}
        enableRowSelection
        enableColumnVisibility
        enableDensityToggle
        enableExport
        pageSize={20}
        emptyTitle="Нет моделей"
        emptyDescription="Загрузите первую BIM модель"
      />
    </div>
  );
};

export default BimModelListPage;
