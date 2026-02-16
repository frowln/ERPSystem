import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { Search, Users, UserPlus, Building2, Briefcase } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { DataTable } from '@/design-system/components/DataTable';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { MetricCard } from '@/design-system/components/MetricCard';
import { Input, Select } from '@/design-system/components/FormField';
import { formatMoney, formatDate } from '@/lib/format';
import { hrRussianApi } from './api';
import type { StaffingEntry } from './types';

const staffingStatusColorMap: Record<string, 'gray' | 'blue' | 'green' | 'yellow' | 'red' | 'purple'> = {
  active: 'green',
  vacant: 'yellow',
  reserved: 'blue',
  eliminated: 'gray',
};

const staffingStatusLabels: Record<string, string> = {
  active: 'Укомплектовано',
  vacant: 'Вакантно',
  reserved: 'В резерве',
  eliminated: 'Исключено',
};

type TabId = 'all' | 'ACTIVE' | 'VACANT' | 'ELIMINATED';

const departmentOptions = [
  { value: '', label: 'Все подразделения' },
  { value: 'Строительный отдел', label: 'Строительный отдел' },
  { value: 'ПТО', label: 'ПТО' },
  { value: 'Бухгалтерия', label: 'Бухгалтерия' },
  { value: 'Контроль качества', label: 'Контроль качества' },
  { value: 'Охрана труда', label: 'Охрана труда' },
  { value: 'Механизация', label: 'Механизация' },
  { value: 'Проектный отдел', label: 'Проектный отдел' },
  { value: 'Администрация', label: 'Администрация' },
];


const StaffingTablePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['staffing-table'],
    queryFn: () => hrRussianApi.getStaffingTable({ size: 1000 }),
  });

  const entries = data?.content ?? [];

  const filtered = useMemo(() => {
    let result = entries;

    if (activeTab === 'ACTIVE') {
      result = result.filter((e) => e.status === 'ACTIVE' && e.vacantCount === 0);
    } else if (activeTab === 'VACANT') {
      result = result.filter((e) => e.vacantCount > 0 && e.status !== 'ELIMINATED');
    } else if (activeTab === 'ELIMINATED') {
      result = result.filter((e) => e.status === 'ELIMINATED');
    }

    if (departmentFilter) {
      result = result.filter((e) => e.department === departmentFilter);
    }

    if (search) {
      const lower = search.toLowerCase();
      result = result.filter(
        (e) => e.position.toLowerCase().includes(lower) || e.department.toLowerCase().includes(lower),
      );
    }

    return result;
  }, [entries, activeTab, departmentFilter, search]);

  const metrics = useMemo(() => {
    const totalHeadcount = entries.reduce((sum, e) => sum + e.headcount, 0);
    const totalFilled = entries.reduce((sum, e) => sum + e.filledCount, 0);
    const totalVacant = entries.filter((e) => e.status !== 'ELIMINATED').reduce((sum, e) => sum + e.vacantCount, 0);
    const departments = new Set(entries.map((e) => e.department)).size;
    return { totalHeadcount, totalFilled, totalVacant, departments };
  }, [entries]);

  const tabCounts = useMemo(() => ({
    all: entries.length,
    active: entries.filter((e) => e.status === 'ACTIVE' && e.vacantCount === 0).length,
    vacant: entries.filter((e) => e.vacantCount > 0 && e.status !== 'ELIMINATED').length,
    eliminated: entries.filter((e) => e.status === 'ELIMINATED').length,
  }), [entries]);

  const columns = useMemo<ColumnDef<StaffingEntry, unknown>[]>(() => [
    {
      accessorKey: 'department',
      header: 'Подразделение',
      size: 180,
      cell: ({ getValue }) => (
        <span className="text-neutral-700 dark:text-neutral-300 font-medium text-sm">{getValue<string>()}</span>
      ),
    },
    {
      accessorKey: 'position',
      header: 'Должность',
      size: 220,
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-neutral-900 dark:text-neutral-100">{row.original.position}</p>
          {row.original.grade && <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{row.original.grade}</p>}
        </div>
      ),
    },
    {
      accessorKey: 'headcount',
      header: 'Штат',
      size: 80,
      cell: ({ getValue }) => (
        <span className="tabular-nums font-medium text-center block">{getValue<number>()}</span>
      ),
    },
    {
      accessorKey: 'filledCount',
      header: 'Занято',
      size: 80,
      cell: ({ row }) => {
        const filled = row.original.filledCount;
        const total = row.original.headcount;
        return (
          <span className={`tabular-nums font-medium text-center block ${filled < total ? 'text-warning-600' : 'text-success-600'}`}>
            {filled}
          </span>
        );
      },
    },
    {
      accessorKey: 'vacantCount',
      header: 'Вакансии',
      size: 90,
      cell: ({ getValue }) => {
        const vacant = getValue<number>();
        return (
          <span className={`tabular-nums font-medium text-center block ${vacant > 0 ? 'text-danger-600' : 'text-neutral-400'}`}>
            {vacant}
          </span>
        );
      },
    },
    {
      id: 'salaryRange',
      header: 'Вилка оклада',
      size: 200,
      cell: ({ row }) => (
        <span className="tabular-nums text-neutral-700 dark:text-neutral-300 text-sm">
          {formatMoney(row.original.salaryMin)} - {formatMoney(row.original.salaryMax)}
        </span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Статус',
      size: 140,
      cell: ({ getValue }) => (
        <StatusBadge
          status={getValue<string>()}
          colorMap={staffingStatusColorMap}
          label={staffingStatusLabels[getValue<string>()] ?? getValue<string>()}
        />
      ),
    },
  ], []);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Штатное расписание"
        subtitle={`${entries.length} позиций в штатном расписании`}
        breadcrumbs={[
          { label: 'Главная', href: '/' },
          { label: 'Кадры РФ' },
          { label: 'Штатное расписание' },
        ]}
        actions={<Button iconLeft={<UserPlus size={16} />}>Добавить позицию</Button>}
        tabs={[
          { id: 'all', label: 'Все', count: tabCounts.all },
          { id: 'ACTIVE', label: 'Укомплектованы', count: tabCounts.active },
          { id: 'VACANT', label: 'С вакансиями', count: tabCounts.vacant },
          { id: 'ELIMINATED', label: 'Исключённые', count: tabCounts.eliminated },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as TabId)}
      />

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard icon={<Users size={18} />} label="Всего штатных ед." value={metrics.totalHeadcount} />
        <MetricCard icon={<Briefcase size={18} />} label="Занято" value={metrics.totalFilled} />
        <MetricCard
          icon={<UserPlus size={18} />}
          label="Вакансий"
          value={metrics.totalVacant}
          trend={{ direction: metrics.totalVacant > 0 ? 'down' : 'neutral', value: metrics.totalVacant > 0 ? 'Открытые вакансии' : 'Нет' }}
        />
        <MetricCard icon={<Building2 size={18} />} label="Подразделений" value={metrics.departments} />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input
            placeholder="Поиск по должности, подразделению..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          options={departmentOptions}
          value={departmentFilter}
          onChange={(e) => setDepartmentFilter(e.target.value)}
          className="w-56"
        />
      </div>

      {/* Table */}
      <DataTable<StaffingEntry>
        data={filtered}
        columns={columns}
        loading={isLoading}
        enableRowSelection
        enableColumnVisibility
        enableDensityToggle
        enableExport
        pageSize={20}
        emptyTitle="Нет позиций"
        emptyDescription="Штатное расписание пусто"
      />
    </div>
  );
};

export default StaffingTablePage;
