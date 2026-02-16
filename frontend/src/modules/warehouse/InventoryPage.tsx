import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { Plus, Search, ClipboardList, CheckCircle2, AlertTriangle, Package } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { DataTable } from '@/design-system/components/DataTable';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { MetricCard } from '@/design-system/components/MetricCard';
import { Input, Select } from '@/design-system/components/FormField';
import { Modal } from '@/design-system/components/Modal';
import { FormField } from '@/design-system/components/FormField';
import { formatDate, formatNumber } from '@/lib/format';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';
import { warehouseApi } from '@/api/warehouse';
import type { InventoryCheck, InventoryItem } from './types';

// ---------------------------------------------------------------------------
// Types & constants
// ---------------------------------------------------------------------------

const checkStatusColorMap: Record<string, 'blue' | 'yellow' | 'green' | 'gray'> = {
  planned: 'blue',
  in_progress: 'yellow',
  completed: 'green',
  cancelled: 'gray',
};

const getCheckStatusLabels = (): Record<string, string> => ({
  planned: t('warehouse.inventory.statusPlanned'),
  in_progress: t('warehouse.inventory.statusInProgress'),
  completed: t('warehouse.inventory.statusCompleted'),
  cancelled: t('warehouse.inventory.statusCancelled'),
});

const itemStatusColorMap: Record<string, 'green' | 'red' | 'orange'> = {
  match: 'green',
  shortage: 'red',
  surplus: 'orange',
};

const getItemStatusLabels = (): Record<string, string> => ({
  match: t('warehouse.inventory.itemStatusMatch'),
  shortage: t('warehouse.inventory.itemStatusShortage'),
  surplus: t('warehouse.inventory.itemStatusSurplus'),
});

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const InventoryPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedCheck, setSelectedCheck] = useState<InventoryCheck | null>(null);

  const { data: checkData, isLoading: loadingChecks } = useQuery({
    queryKey: ['inventory-checks'],
    queryFn: () => warehouseApi.getInventoryChecks(),
  });

  const checks = checkData?.content ?? [];

  const filtered = useMemo(() => {
    if (!search) return checks;
    const lower = search.toLowerCase();
    return checks.filter(
      (c) => c.number.toLowerCase().includes(lower) || c.location.toLowerCase().includes(lower) || c.responsible.toLowerCase().includes(lower),
    );
  }, [checks, search]);

  const completedChecks = checks.filter((c) => c.status === 'COMPLETED');
  const totalShortages = completedChecks.reduce((s, c) => s + c.shortageCount, 0);
  const totalSurplus = completedChecks.reduce((s, c) => s + c.surplusCount, 0);

  const checkColumns = useMemo<ColumnDef<InventoryCheck, unknown>[]>(() => [
    { accessorKey: 'number', header: t('warehouse.inventory.columnNumber'), size: 100, cell: ({ getValue }) => <span className="font-mono text-xs text-neutral-500 dark:text-neutral-400">{getValue<string>()}</span> },
    {
      accessorKey: 'location',
      header: t('warehouse.inventory.columnLocation'),
      size: 220,
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-neutral-900 dark:text-neutral-100">{row.original.location}</p>
          {row.original.projectName && <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{row.original.projectName}</p>}
        </div>
      ),
    },
    { accessorKey: 'date', header: t('warehouse.inventory.columnDate'), size: 100, cell: ({ getValue }) => <span className="tabular-nums">{formatDate(getValue<string>())}</span> },
    { accessorKey: 'status', header: t('warehouse.inventory.columnStatus'), size: 130, cell: ({ getValue }) => <StatusBadge status={getValue<string>()} colorMap={checkStatusColorMap} label={getCheckStatusLabels()[getValue<string>()] ?? getValue<string>()} /> },
    { accessorKey: 'itemsCount', header: t('warehouse.inventory.columnItemsCount'), size: 90, cell: ({ getValue }) => <span className="tabular-nums">{getValue<number>()}</span> },
    {
      accessorKey: 'matchedCount',
      header: t('warehouse.inventory.columnMatched'),
      size: 90,
      cell: ({ getValue, row }) => {
        if (row.original.status === 'PLANNED') return <span className="text-neutral-400">---</span>;
        return <span className="tabular-nums text-success-600 font-medium">{getValue<number>()}</span>;
      },
    },
    {
      accessorKey: 'shortageCount',
      header: t('warehouse.inventory.columnShortage'),
      size: 100,
      cell: ({ getValue, row }) => {
        if (row.original.status === 'PLANNED') return <span className="text-neutral-400">---</span>;
        const val = getValue<number>();
        return <span className={cn('tabular-nums', val > 0 ? 'text-danger-600 font-medium' : 'text-neutral-600')}>{val}</span>;
      },
    },
    {
      accessorKey: 'surplusCount',
      header: t('warehouse.inventory.columnSurplus'),
      size: 90,
      cell: ({ getValue, row }) => {
        if (row.original.status === 'PLANNED') return <span className="text-neutral-400">---</span>;
        const val = getValue<number>();
        return <span className={cn('tabular-nums', val > 0 ? 'text-warning-600 font-medium' : 'text-neutral-600')}>{val}</span>;
      },
    },
    { accessorKey: 'responsible', header: t('warehouse.inventory.columnResponsible'), size: 150 },
  ], []);

  const itemColumns = useMemo<ColumnDef<InventoryItem, unknown>[]>(() => [
    { accessorKey: 'materialName', header: t('warehouse.inventory.columnMaterial'), size: 220, cell: ({ getValue }) => <span className="font-medium text-neutral-900 dark:text-neutral-100">{getValue<string>()}</span> },
    { accessorKey: 'unit', header: t('warehouse.inventory.columnUnit'), size: 70 },
    { accessorKey: 'plannedQty', header: t('warehouse.inventory.columnPlanned'), size: 90, cell: ({ getValue }) => <span className="tabular-nums">{formatNumber(getValue<number>())}</span> },
    { accessorKey: 'actualQty', header: t('warehouse.inventory.columnActual'), size: 90, cell: ({ getValue }) => <span className="tabular-nums">{formatNumber(getValue<number>())}</span> },
    {
      accessorKey: 'variance',
      header: t('warehouse.inventory.columnVariance'),
      size: 110,
      cell: ({ getValue }) => {
        const val = getValue<number>();
        return <span className={cn('tabular-nums font-medium', val < 0 ? 'text-danger-600' : val > 0 ? 'text-warning-600' : 'text-success-600')}>{val > 0 ? '+' : ''}{formatNumber(val)}</span>;
      },
    },
    { accessorKey: 'status', header: t('warehouse.inventory.columnItemStatus'), size: 120, cell: ({ getValue }) => <StatusBadge status={getValue<string>()} colorMap={itemStatusColorMap} label={getItemStatusLabels()[getValue<string>()] ?? getValue<string>()} /> },
  ], []);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('warehouse.inventory.title')}
        subtitle={t('warehouse.inventory.subtitle')}
        breadcrumbs={[{ label: t('warehouse.inventory.breadcrumbHome'), href: '/' }, { label: t('warehouse.breadcrumbWarehouse'), href: '/warehouse/materials' }, { label: t('warehouse.inventory.title') }]}
        actions={<Button iconLeft={<Plus size={16} />} onClick={() => setShowCreateModal(true)}>{t('warehouse.inventory.newCheck')}</Button>}
      />

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard icon={<ClipboardList size={18} />} label={t('warehouse.inventory.metricTotalChecks')} value={checks.length} />
        <MetricCard icon={<CheckCircle2 size={18} />} label={t('warehouse.inventory.metricCompleted')} value={completedChecks.length} />
        <MetricCard icon={<AlertTriangle size={18} />} label={t('warehouse.inventory.metricShortages')} value={totalShortages} trend={totalShortages > 0 ? { direction: 'up', value: `${totalShortages}` } : { direction: 'neutral', value: '0' }} />
        <MetricCard icon={<Package size={18} />} label={t('warehouse.inventory.metricSurplus')} value={totalSurplus} />
      </div>

      {/* Search */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input placeholder={t('warehouse.inventory.searchPlaceholder')} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>

      {/* Checks table */}
      <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-3">{t('warehouse.inventory.sectionChecks')}</h3>
      <DataTable<InventoryCheck>
        data={filtered}
        columns={checkColumns}
        loading={loadingChecks}
        onRowClick={(c) => setSelectedCheck(c)}
        enableRowSelection
        enableColumnVisibility
        enableExport
        pageSize={20}
        emptyTitle={t('warehouse.inventory.emptyChecksTitle')}
        emptyDescription={t('warehouse.inventory.emptyChecksDescription')}
        className="mb-6"
      />

      {/* Items preview */}
      <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-3">{t('warehouse.inventory.sectionLastCheckItems')}</h3>
      <DataTable<InventoryItem>
        data={[]}
        columns={itemColumns}
        pageSize={10}
        enableExport
        emptyTitle={t('warehouse.inventory.emptyItemsTitle')}
        emptyDescription={t('warehouse.inventory.emptyItemsDescription')}
      />

      {/* Create modal */}
      <Modal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title={t('warehouse.inventory.modalTitle')}
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>{t('warehouse.inventory.modalCancel')}</Button>
            <Button onClick={() => setShowCreateModal(false)}>{t('warehouse.inventory.modalCreate')}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <FormField label={t('warehouse.inventory.modalFieldLocation')} required>
            <Select
              options={[
                { value: 'wh1', label: 'Центральный склад' },
                { value: 'st1', label: 'Площадка ЖК "Солнечный"' },
                { value: 'st2', label: 'Площадка "Горизонт"' },
              ]}
              placeholder={t('warehouse.inventory.modalLocationPlaceholder')}
            />
          </FormField>
          <FormField label={t('warehouse.inventory.modalFieldDate')} required>
            <Input type="date" />
          </FormField>
          <FormField label={t('warehouse.inventory.modalFieldResponsible')} required>
            <Input placeholder={t('warehouse.inventory.modalResponsiblePlaceholder')} />
          </FormField>
        </div>
      </Modal>
    </div>
  );
};

export default InventoryPage;
