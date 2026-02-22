import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { Plus, Search } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { DataTable } from '@/design-system/components/DataTable';
import {
  StatusBadge,
  limitFenceSheetStatusColorMap,
  limitFenceSheetStatusLabels,
} from '@/design-system/components/StatusBadge';
import { Input } from '@/design-system/components/FormField';
import { limitFenceSheetsApi, type LimitFenceSheet } from '@/api/limitFenceSheets';
import { formatDate } from '@/lib/format';
import { t } from '@/i18n';

type TabId = 'all' | 'ACTIVE' | 'EXHAUSTED' | 'CLOSED';

const LimitFenceSheetListPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['limit-fence-sheets'],
    queryFn: () => limitFenceSheetsApi.getSheets({ size: 200 }),
  });

  const sheets = data?.content ?? [];

  const filteredSheets = useMemo(() => {
    let filtered = sheets;
    if (activeTab !== 'all') {
      filtered = filtered.filter((s) => s.status === activeTab);
    }
    if (search) {
      const lower = search.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.sheetNumber.toLowerCase().includes(lower) ||
          (s.materialName ?? '').toLowerCase().includes(lower),
      );
    }
    return filtered;
  }, [sheets, activeTab, search]);

  const tabCounts = useMemo(
    () => ({
      all: sheets.length,
      active: sheets.filter((s) => s.status === 'ACTIVE').length,
      exhausted: sheets.filter((s) => s.status === 'EXHAUSTED').length,
      closed: sheets.filter((s) => s.status === 'CLOSED' || s.status === 'CANCELLED').length,
    }),
    [sheets],
  );

  const columns = useMemo<ColumnDef<LimitFenceSheet, unknown>[]>(
    () => [
      {
        accessorKey: 'sheetNumber',
        header: t('warehouse.limitFenceSheet.columnNumber'),
        size: 130,
        cell: ({ getValue }) => (
          <span className="font-mono text-neutral-500 dark:text-neutral-400 text-xs">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'materialName',
        header: t('warehouse.limitFenceSheet.columnMaterial'),
        size: 200,
      },
      {
        accessorKey: 'unit',
        header: t('warehouse.limitFenceSheet.columnUnit'),
        size: 80,
      },
      {
        accessorKey: 'limitQuantity',
        header: t('warehouse.limitFenceSheet.columnLimit'),
        size: 100,
        cell: ({ getValue }) => (
          <span className="tabular-nums font-medium">{getValue<number>()?.toLocaleString('ru-RU')}</span>
        ),
      },
      {
        accessorKey: 'issuedQuantity',
        header: t('warehouse.limitFenceSheet.columnIssued'),
        size: 100,
        cell: ({ getValue }) => (
          <span className="tabular-nums">{getValue<number>()?.toLocaleString('ru-RU')}</span>
        ),
      },
      {
        id: 'remaining',
        header: t('warehouse.limitFenceSheet.columnRemaining'),
        size: 130,
        cell: ({ row }) => {
          const sheet = row.original;
          const remaining = sheet.limitQuantity - sheet.issuedQuantity + sheet.returnedQuantity;
          const pct = sheet.limitQuantity > 0 ? ((sheet.issuedQuantity - sheet.returnedQuantity) / sheet.limitQuantity) * 100 : 0;
          return (
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${pct >= 90 ? 'bg-danger-500' : pct >= 70 ? 'bg-warning-500' : 'bg-primary-500'}`}
                  style={{ width: `${Math.min(pct, 100)}%` }}
                />
              </div>
              <span className="tabular-nums text-xs text-neutral-600 dark:text-neutral-400 w-12 text-right">
                {remaining.toLocaleString('ru-RU')}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: 'periodStart',
        header: t('warehouse.limitFenceSheet.columnPeriod'),
        size: 180,
        cell: ({ row }) => (
          <span className="tabular-nums text-xs">
            {formatDate(row.original.periodStart)} — {formatDate(row.original.periodEnd)}
          </span>
        ),
      },
      {
        accessorKey: 'status',
        header: t('warehouse.limitFenceSheet.columnStatus'),
        size: 130,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={limitFenceSheetStatusColorMap}
            label={limitFenceSheetStatusLabels[getValue<string>()] ?? getValue<string>()}
          />
        ),
      },
    ],
    [],
  );

  const handleRowClick = useCallback(
    (sheet: LimitFenceSheet) => navigate(`/warehouse/limit-fence-sheets/${sheet.id}`),
    [navigate],
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('warehouse.limitFenceSheet.title')}
        subtitle={t('warehouse.limitFenceSheet.subtitle', { count: sheets.length })}
        breadcrumbs={[
          { label: t('warehouse.breadcrumbHome'), href: '/' },
          { label: t('warehouse.breadcrumbWarehouse'), href: '/warehouse/materials' },
          { label: t('warehouse.limitFenceSheet.breadcrumb') },
        ]}
        actions={
          <Button iconLeft={<Plus size={16} />} onClick={() => navigate('/warehouse/limit-fence-sheets/new')}>
            {t('warehouse.limitFenceSheet.newSheet')}
          </Button>
        }
        tabs={[
          { id: 'all', label: t('warehouse.limitFenceSheet.filterAll'), count: tabCounts.all },
          { id: 'ACTIVE', label: t('warehouse.limitFenceSheet.filterActive'), count: tabCounts.active },
          { id: 'EXHAUSTED', label: t('warehouse.limitFenceSheet.filterExhausted'), count: tabCounts.exhausted },
          { id: 'CLOSED', label: t('warehouse.limitFenceSheet.filterClosed'), count: tabCounts.closed },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as TabId)}
      />

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input
            placeholder={t('warehouse.limitFenceSheet.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <DataTable<LimitFenceSheet>
        data={filteredSheets}
        columns={columns}
        loading={isLoading}
        onRowClick={handleRowClick}
        enableRowSelection
        enableColumnVisibility
        enableDensityToggle
        enableExport
        pageSize={20}
        emptyTitle={t('warehouse.limitFenceSheet.emptyTitle')}
        emptyDescription={t('warehouse.limitFenceSheet.emptyDescription')}
      />
    </div>
  );
};

export default LimitFenceSheetListPage;
