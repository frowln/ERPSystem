import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { Plus, Search, ClipboardCheck, Calendar, CheckCircle, XCircle } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { DataTable } from '@/design-system/components/DataTable';
import { MetricCard } from '@/design-system/components/MetricCard';
import {
  StatusBadge,
  inspectionStatusColorMap,
  inspectionStatusLabels,
  inspectionTypeColorMap,
  inspectionTypeLabels,
  complianceResultColorMap,
  complianceResultLabels,
} from '@/design-system/components/StatusBadge';
import { Input, Select } from '@/design-system/components/FormField';
import { regulatoryApi } from '@/api/regulatory';
import { formatDate } from '@/lib/format';
import type { Inspection } from './types';

type TabId = 'all' | 'SCHEDULED' | 'PASSED' | 'FAILED';

const typeFilterOptions = [
  { value: '', label: 'Все типы' },
  { value: 'ROSTECHNADZOR', label: 'Ростехнадзор' },
  { value: 'FIRE_INSPECTION', label: 'Пожарная инспекция' },
  { value: 'SANITARY', label: 'Роспотребнадзор' },
  { value: 'ENVIRONMENTAL', label: 'Экологическая' },
  { value: 'INTERNAL_AUDIT', label: 'Внутренний аудит' },
  { value: 'CUSTOMER_INSPECTION', label: 'Инспекция заказчика' },
];

const InspectionsPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const { data: inspData, isLoading } = useQuery({
    queryKey: ['inspections'],
    queryFn: () => regulatoryApi.getInspections(),
  });

  const inspections = inspData?.content ?? [];

  const filteredInspections = useMemo(() => {
    let filtered = inspections;
    if (activeTab === 'SCHEDULED') filtered = filtered.filter((i) => ['SCHEDULED', 'IN_PROGRESS'].includes(i.status));
    else if (activeTab === 'PASSED') filtered = filtered.filter((i) => i.status === 'PASSED');
    else if (activeTab === 'FAILED') filtered = filtered.filter((i) => i.status === 'FAILED');
    if (typeFilter) filtered = filtered.filter((i) => i.inspectionType === typeFilter);
    if (search) {
      const lower = search.toLowerCase();
      filtered = filtered.filter(
        (i) =>
          i.number.toLowerCase().includes(lower) ||
          i.name.toLowerCase().includes(lower) ||
          (i.projectName ?? '').toLowerCase().includes(lower),
      );
    }
    return filtered;
  }, [inspections, activeTab, typeFilter, search]);

  const tabCounts = useMemo(() => ({
    all: inspections.length,
    scheduled: inspections.filter((i) => ['SCHEDULED', 'IN_PROGRESS'].includes(i.status)).length,
    passed: inspections.filter((i) => i.status === 'PASSED').length,
    failed: inspections.filter((i) => i.status === 'FAILED').length,
  }), [inspections]);

  const columns = useMemo<ColumnDef<Inspection, unknown>[]>(
    () => [
      {
        accessorKey: 'number',
        header: '\u2116',
        size: 90,
        cell: ({ getValue }) => (
          <span className="font-mono text-neutral-500 dark:text-neutral-400 text-xs">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'name',
        header: 'Проверка',
        size: 260,
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-neutral-900 dark:text-neutral-100 truncate max-w-[240px]">{row.original.name}</p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{row.original.projectName ?? '---'}</p>
          </div>
        ),
      },
      {
        accessorKey: 'inspectionType',
        header: 'Тип',
        size: 160,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={inspectionTypeColorMap}
            label={inspectionTypeLabels[getValue<string>()] ?? getValue<string>()}
          />
        ),
      },
      {
        accessorKey: 'status',
        header: 'Статус',
        size: 120,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={inspectionStatusColorMap}
            label={inspectionStatusLabels[getValue<string>()] ?? getValue<string>()}
          />
        ),
      },
      {
        accessorKey: 'result',
        header: 'Результат',
        size: 130,
        cell: ({ getValue }) => {
          const result = getValue<string | undefined>();
          if (!result) return <span className="text-neutral-400">---</span>;
          return (
            <StatusBadge
              status={result}
              colorMap={complianceResultColorMap}
              label={complianceResultLabels[result] ?? result}
            />
          );
        },
      },
      {
        accessorKey: 'scheduledDate',
        header: 'Дата',
        size: 110,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-neutral-700 dark:text-neutral-300">{formatDate(getValue<string>())}</span>
        ),
      },
      {
        accessorKey: 'inspectorOrganization',
        header: 'Организация',
        size: 180,
        cell: ({ getValue }) => (
          <span className="text-neutral-700 dark:text-neutral-300 text-xs">{getValue<string>()}</span>
        ),
      },
    ],
    [],
  );

  const handleRowClick = useCallback(
    (inspection: Inspection) => navigate(`/regulatory/inspections/${inspection.id}`),
    [navigate],
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Проверки и инспекции"
        subtitle={`${inspections.length} проверок в системе`}
        breadcrumbs={[
          { label: 'Главная', href: '/' },
          { label: 'Регуляторика', href: '/regulatory' },
          { label: 'Проверки' },
        ]}
        actions={
          <Button iconLeft={<Plus size={16} />} onClick={() => navigate('/regulatory/inspections/new')}>
            Запланировать проверку
          </Button>
        }
        tabs={[
          { id: 'all', label: 'Все', count: tabCounts.all },
          { id: 'SCHEDULED', label: 'Запланированные', count: tabCounts.scheduled },
          { id: 'PASSED', label: 'Пройденные', count: tabCounts.passed },
          { id: 'FAILED', label: 'Не пройденные', count: tabCounts.failed },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as TabId)}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard icon={<ClipboardCheck size={18} />} label="Всего проверок" value={inspections.length} />
        <MetricCard icon={<Calendar size={18} />} label="Запланировано" value={tabCounts.scheduled} />
        <MetricCard icon={<CheckCircle size={18} />} label="Пройдено" value={tabCounts.passed} />
        <MetricCard icon={<XCircle size={18} />} label="Не пройдено" value={tabCounts.failed}
          trend={tabCounts.failed > 0 ? { direction: 'down', value: 'Требуют корр. мер' } : undefined} />
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input placeholder="Поиск по номеру, названию..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select options={typeFilterOptions} value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="w-56" />
      </div>

      <DataTable<Inspection>
        data={filteredInspections ?? []}
        columns={columns}
        loading={isLoading}
        onRowClick={handleRowClick}
        enableRowSelection
        enableColumnVisibility
        enableDensityToggle
        enableExport
        pageSize={20}
        emptyTitle="Нет проверок"
        emptyDescription="Запланируйте первую проверку или инспекцию"
      />
    </div>
  );
};

export default InspectionsPage;
