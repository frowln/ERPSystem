import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { Plus, Search, Settings, CheckCircle, AlertTriangle, Wrench } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { DataTable } from '@/design-system/components/DataTable';
import { MetricCard } from '@/design-system/components/MetricCard';
import {
  StatusBadge,
  equipmentStatusColorMap,
  equipmentStatusLabels,
} from '@/design-system/components/StatusBadge';
import { Input, Select } from '@/design-system/components/FormField';
import { maintenanceApi } from '@/api/maintenance';
import { formatDate, formatMoneyCompact } from '@/lib/format';
import type { MaintenanceEquipment } from './types';

type TabId = 'all' | 'OPERATIONAL' | 'MAINTENANCE' | 'OUT_OF_SERVICE';

const statusFilterOptions = [
  { value: '', label: 'Все статусы' },
  { value: 'OPERATIONAL', label: 'В работе' },
  { value: 'MAINTENANCE', label: 'На обслуживании' },
  { value: 'OUT_OF_SERVICE', label: 'Не в работе' },
  { value: 'RETIRED', label: 'Списано' },
];

const EquipmentListPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { data: equipmentData, isLoading } = useQuery({
    queryKey: ['maintenance-equipment'],
    queryFn: () => maintenanceApi.getEquipment(),
  });

  const equipment = equipmentData?.content ?? [];

  const filteredEquipment = useMemo(() => {
    let filtered = equipment;
    if (activeTab !== 'all') {
      filtered = filtered.filter((e) => e.status === activeTab);
    }
    if (statusFilter) {
      filtered = filtered.filter((e) => e.status === statusFilter);
    }
    if (search) {
      const lower = search.toLowerCase();
      filtered = filtered.filter(
        (e) =>
          e.code.toLowerCase().includes(lower) ||
          e.name.toLowerCase().includes(lower) ||
          e.category.toLowerCase().includes(lower) ||
          (e.location ?? '').toLowerCase().includes(lower),
      );
    }
    return filtered;
  }, [equipment, activeTab, statusFilter, search]);

  const tabCounts = useMemo(() => ({
    all: equipment.length,
    operational: equipment.filter((e) => e.status === 'OPERATIONAL').length,
    maintenance: equipment.filter((e) => e.status === 'MAINTENANCE').length,
    out_of_service: equipment.filter((e) => e.status === 'OUT_OF_SERVICE').length,
  }), [equipment]);

  const metrics = useMemo(() => {
    const operational = equipment.filter((e) => e.status === 'OPERATIONAL').length;
    const inMaintenance = equipment.filter((e) => e.status === 'MAINTENANCE').length;
    const totalCost = equipment.reduce((s, e) => s + e.totalCost, 0);
    return { total: equipment.length, operational, inMaintenance, totalCost };
  }, [equipment]);

  const columns = useMemo<ColumnDef<MaintenanceEquipment, unknown>[]>(
    () => [
      {
        accessorKey: 'code',
        header: 'Код',
        size: 100,
        cell: ({ getValue }) => (
          <span className="font-mono text-neutral-500 dark:text-neutral-400 text-xs">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'name',
        header: 'Оборудование',
        size: 260,
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-neutral-900 dark:text-neutral-100 truncate max-w-[240px]">{row.original.name}</p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{row.original.category}</p>
          </div>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Статус',
        size: 140,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={equipmentStatusColorMap}
            label={equipmentStatusLabels[getValue<string>()] ?? getValue<string>()}
          />
        ),
      },
      {
        accessorKey: 'location',
        header: 'Расположение',
        size: 150,
        cell: ({ row }) => (
          <div>
            <p className="text-sm text-neutral-700 dark:text-neutral-300">{row.original.location ?? '---'}</p>
            {row.original.projectName && (
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{row.original.projectName}</p>
            )}
          </div>
        ),
      },
      {
        accessorKey: 'maintenanceCount',
        header: 'Обслуживаний',
        size: 120,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-sm text-neutral-700 dark:text-neutral-300">{getValue<number>()}</span>
        ),
      },
      {
        accessorKey: 'totalCost',
        header: 'Затраты',
        size: 130,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-sm text-neutral-700 dark:text-neutral-300">{formatMoneyCompact(getValue<number>())}</span>
        ),
      },
      {
        accessorKey: 'nextMaintenanceDate',
        header: 'След. ТО',
        size: 110,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-neutral-600 text-xs">{formatDate(getValue<string>())}</span>
        ),
      },
      {
        accessorKey: 'assignedTeamName',
        header: 'Бригада',
        size: 150,
        cell: ({ getValue }) => (
          <span className="text-neutral-700 dark:text-neutral-300">{getValue<string>() ?? '---'}</span>
        ),
      },
    ],
    [],
  );

  const handleRowClick = useCallback(
    (eq: MaintenanceEquipment) => navigate(`/maintenance/equipment/${eq.id}`),
    [navigate],
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Оборудование"
        subtitle={`${equipment.length} единиц`}
        breadcrumbs={[
          { label: 'Главная', href: '/' },
          { label: 'Обслуживание' },
          { label: 'Оборудование' },
        ]}
        actions={
          <Button iconLeft={<Plus size={16} />} onClick={() => navigate('/maintenance/equipment/new')}>
            Добавить оборудование
          </Button>
        }
        tabs={[
          { id: 'all', label: 'Все', count: tabCounts.all },
          { id: 'OPERATIONAL', label: 'В работе', count: tabCounts.operational },
          { id: 'MAINTENANCE', label: 'На ТО', count: tabCounts.maintenance },
          { id: 'OUT_OF_SERVICE', label: 'Не в работе', count: tabCounts.out_of_service },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as TabId)}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard icon={<Settings size={18} />} label="Всего единиц" value={metrics.total} />
        <MetricCard icon={<CheckCircle size={18} />} label="В работе" value={metrics.operational} />
        <MetricCard icon={<Wrench size={18} />} label="На обслуживании" value={metrics.inMaintenance} />
        <MetricCard icon={<AlertTriangle size={18} />} label="Общие затраты" value={formatMoneyCompact(metrics.totalCost)} />
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input
            placeholder="Поиск по коду, названию, категории..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          options={statusFilterOptions}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-48"
        />
      </div>

      <DataTable<MaintenanceEquipment>
        data={filteredEquipment ?? []}
        columns={columns}
        loading={isLoading}
        onRowClick={handleRowClick}
        enableRowSelection
        enableColumnVisibility
        enableDensityToggle
        enableExport
        pageSize={20}
        emptyTitle="Нет оборудования"
        emptyDescription="Добавьте первую единицу оборудования"
      />
    </div>
  );
};

export default EquipmentListPage;
