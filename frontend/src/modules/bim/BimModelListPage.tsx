import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { t } from '@/i18n';

const statusColorMap: Record<string, 'green' | 'yellow' | 'blue' | 'gray' | 'red'> = {
  active: 'green',
  processing: 'yellow',
  review: 'blue',
  archived: 'gray',
  error: 'red',
};
const getStatusLabels = (): Record<string, string> => ({
  active: t('bim.statusActive'),
  processing: t('bim.statusProcessing'),
  review: t('bim.statusReview'),
  archived: t('bim.statusArchived'),
  error: t('bim.statusError'),
});

const BimModelListPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<string>('all');

  const navigate = useNavigate();
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

  const columns = useMemo<ColumnDef<BimModel, unknown>[]>(() => {
    const stLabels = getStatusLabels();
    return [
    {
      accessorKey: 'name',
      header: t('bim.colModelName'),
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
      header: t('bim.colFormat'),
      size: 80,
      cell: ({ getValue }) => (
        <span className="font-mono text-xs bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded">{getValue<string>()}</span>
      ),
    },
    {
      accessorKey: 'version',
      header: t('bim.colVersion'),
      size: 80,
      cell: ({ getValue }) => <span className="text-neutral-600 text-sm">{getValue<string>()}</span>,
    },
    {
      accessorKey: 'uploadDate',
      header: t('bim.colUploadDate'),
      size: 120,
      cell: ({ getValue }) => <span className="tabular-nums">{formatDate(getValue<string>())}</span>,
    },
    {
      accessorKey: 'fileSize',
      header: t('bim.colSize'),
      size: 100,
      cell: ({ getValue }) => <span className="tabular-nums text-neutral-600">{getValue<string>()}</span>,
    },
    {
      accessorKey: 'status',
      header: t('bim.colStatus'),
      size: 120,
      cell: ({ getValue }) => (
        <StatusBadge status={getValue<string>()} colorMap={statusColorMap} label={stLabels[getValue<string>()]} />
      ),
    },
    {
      accessorKey: 'uploadedBy',
      header: t('bim.colUploadedBy'),
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
  ]; }, []);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('bim.modelsTitle')}
        subtitle={t('bim.modelsSubtitle', { count: String(models.length) })}
        breadcrumbs={[
          { label: t('bim.breadcrumbHome'), href: '/' },
          { label: t('bim.breadcrumbBim') },
          { label: t('bim.breadcrumbModels') },
        ]}
        actions={
          <Button iconLeft={<Upload size={16} />} onClick={() => navigate('/bim/models/upload')}>
            {t('bim.uploadModel')}
          </Button>
        }
        tabs={[
          { id: 'all', label: t('bim.tabAll'), count: tabCounts.all },
          { id: 'ACTIVE', label: t('bim.tabActive'), count: tabCounts.active },
          { id: 'PROCESSING', label: t('bim.tabProcessing'), count: tabCounts.processing },
          { id: 'REVIEW', label: t('bim.tabReview'), count: tabCounts.review },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <MetricCard icon={<Box size={18} />} label={t('bim.metricTotalModels')} value={models.length} />
        <MetricCard icon={<Box size={18} />} label={t('bim.metricActive')} value={tabCounts.active} />
        <MetricCard icon={<Box size={18} />} label={t('bim.metricProcessing')} value={tabCounts.processing} />
        <MetricCard icon={<Box size={18} />} label={t('bim.metricReview')} value={tabCounts.review} />
      </div>

      {/* 3D Viewer placeholder */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-8 mb-6 flex flex-col items-center justify-center min-h-[200px]">
        <Box size={48} className="text-neutral-300 mb-3" />
        <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">{t('bim.viewer3dTitle')}</p>
        <p className="text-xs text-neutral-400 mt-1">{t('bim.viewer3dHint')}</p>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input placeholder={t('bim.searchModelPlaceholder')} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
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
        emptyTitle={t('bim.emptyModelsTitle')}
        emptyDescription={t('bim.emptyModelsDescription')}
      />
    </div>
  );
};

export default BimModelListPage;
