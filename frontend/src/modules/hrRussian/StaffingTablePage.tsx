import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { Search, Users, UserPlus, Building2, Briefcase } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { DataTable } from '@/design-system/components/DataTable';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { MetricCard } from '@/design-system/components/MetricCard';
import { Input, Select } from '@/design-system/components/FormField';
import { formatMoney } from '@/lib/format';
import { hrRussianApi } from './api';
import { t } from '@/i18n';
import type { StaffingEntry } from './types';

const staffingStatusColorMap: Record<string, 'gray' | 'blue' | 'green' | 'yellow' | 'red' | 'purple'> = {
  active: 'green',
  vacant: 'yellow',
  reserved: 'blue',
  eliminated: 'gray',
};

const getStaffingStatusLabels = (): Record<string, string> => ({
  active: t('hrRussian.staffing.statusActive'),
  vacant: t('hrRussian.staffing.statusVacant'),
  reserved: t('hrRussian.staffing.statusReserved'),
  eliminated: t('hrRussian.staffing.statusEliminated'),
});

type TabId = 'all' | 'ACTIVE' | 'VACANT' | 'ELIMINATED';

const getDepartmentOptions = () => [
  { value: '', label: t('hrRussian.staffing.allDepartments') },
  { value: 'Строительный отдел', label: t('hrRussian.staffing.deptConstruction') },
  { value: 'ПТО', label: t('hrRussian.staffing.deptPto') },
  { value: 'Бухгалтерия', label: t('hrRussian.staffing.deptAccounting') },
  { value: 'Контроль качества', label: t('hrRussian.staffing.deptQuality') },
  { value: 'Охрана труда', label: t('hrRussian.staffing.deptSafety') },
  { value: 'Механизация', label: t('hrRussian.staffing.deptMechanization') },
  { value: 'Проектный отдел', label: t('hrRussian.staffing.deptDesign') },
  { value: 'Администрация', label: t('hrRussian.staffing.deptAdmin') },
];


const StaffingTablePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');

  const navigate = useNavigate();
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

  const columns = useMemo<ColumnDef<StaffingEntry, unknown>[]>(() => {
    const staffingStatusLabels = getStaffingStatusLabels();
    return [
      {
        accessorKey: 'department',
        header: t('hrRussian.staffing.colDepartment'),
        size: 180,
        cell: ({ getValue }) => (
          <span className="text-neutral-700 dark:text-neutral-300 font-medium text-sm">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'position',
        header: t('hrRussian.staffing.colPosition'),
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
        header: t('hrRussian.staffing.colHeadcount'),
        size: 80,
        cell: ({ getValue }) => (
          <span className="tabular-nums font-medium text-center block">{getValue<number>()}</span>
        ),
      },
      {
        accessorKey: 'filledCount',
        header: t('hrRussian.staffing.colFilled'),
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
        header: t('hrRussian.staffing.colVacancies'),
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
        header: t('hrRussian.staffing.colSalaryRange'),
        size: 200,
        cell: ({ row }) => (
          <span className="tabular-nums text-neutral-700 dark:text-neutral-300 text-sm">
            {formatMoney(row.original.salaryMin)} - {formatMoney(row.original.salaryMax)}
          </span>
        ),
      },
      {
        accessorKey: 'status',
        header: t('hrRussian.staffing.colStatus'),
        size: 140,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={staffingStatusColorMap}
            label={staffingStatusLabels[getValue<string>()] ?? getValue<string>()}
          />
        ),
      },
    ];
  }, []);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('hrRussian.staffing.title')}
        subtitle={t('hrRussian.staffing.subtitlePositions', { count: String(entries.length) })}
        breadcrumbs={[
          { label: t('hrRussian.staffing.breadcrumbHome'), href: '/' },
          { label: t('hrRussian.staffing.breadcrumbHr') },
          { label: t('hrRussian.staffing.breadcrumbStaffing') },
        ]}
        actions={<Button iconLeft={<UserPlus size={16} />} onClick={() => navigate('/hr-russian/staffing/new')}>{t('hrRussian.staffing.addPosition')}</Button>}
        tabs={[
          { id: 'all', label: t('hrRussian.staffing.tabAll'), count: tabCounts.all },
          { id: 'ACTIVE', label: t('hrRussian.staffing.tabFilled'), count: tabCounts.active },
          { id: 'VACANT', label: t('hrRussian.staffing.tabVacant'), count: tabCounts.vacant },
          { id: 'ELIMINATED', label: t('hrRussian.staffing.tabEliminated'), count: tabCounts.eliminated },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as TabId)}
      />

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard icon={<Users size={18} />} label={t('hrRussian.staffing.metricHeadcount')} value={metrics.totalHeadcount} />
        <MetricCard icon={<Briefcase size={18} />} label={t('hrRussian.staffing.metricFilled')} value={metrics.totalFilled} />
        <MetricCard
          icon={<UserPlus size={18} />}
          label={t('hrRussian.staffing.metricVacancies')}
          value={metrics.totalVacant}
          trend={{ direction: metrics.totalVacant > 0 ? 'down' : 'neutral', value: metrics.totalVacant > 0 ? t('hrRussian.staffing.trendOpenVacancies') : t('hrRussian.staffing.trendNone') }}
        />
        <MetricCard icon={<Building2 size={18} />} label={t('hrRussian.staffing.metricDepartments')} value={metrics.departments} />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input
            placeholder={t('hrRussian.staffing.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          options={getDepartmentOptions()}
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
        emptyTitle={t('hrRussian.staffing.emptyTitle')}
        emptyDescription={t('hrRussian.staffing.emptyDescription')}
      />
    </div>
  );
};

export default StaffingTablePage;
