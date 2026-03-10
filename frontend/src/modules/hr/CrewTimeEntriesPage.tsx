import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { Search, Plus, Clock, HardHat, Calendar } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { DataTable } from '@/design-system/components/DataTable';
import { MetricCard } from '@/design-system/components/MetricCard';
import { Input } from '@/design-system/components/FormField';
import { crewTimeApi } from '@/api/crewTime';
import { formatDate } from '@/lib/format';
import { t } from '@/i18n';
import type { CrewTimeEntry } from './types';
import type { PaginatedResponse } from '@/types';


const CrewTimeEntriesPage: React.FC = () => {
  const [search, setSearch] = useState('');

  const navigate = useNavigate();
  const { data, isLoading } = useQuery<PaginatedResponse<CrewTimeEntry>>({
    queryKey: ['crew-time-entries'],
    queryFn: () => crewTimeApi.getTimeEntries(),
  });

  const entries = data?.content ?? [];

  const filtered = useMemo(() => {
    if (!search) return entries;
    const lower = search.toLowerCase();
    return entries.filter(
      (e) =>
        e.crewName.toLowerCase().includes(lower) ||
        e.workDescription.toLowerCase().includes(lower) ||
        (e.location ?? '').toLowerCase().includes(lower),
    );
  }, [entries, search]);

  const metrics = useMemo(() => {
    const totalHours = entries.reduce((s, e) => s + e.hoursWorked, 0);
    const totalOvertime = entries.reduce((s, e) => s + e.overtimeHours, 0);
    const totalWorkerHours = entries.reduce((s, e) => s + (e.hoursWorked + e.overtimeHours) * e.workersCount, 0);
    return { total: entries.length, totalHours, totalOvertime, totalWorkerHours };
  }, [entries]);

  const columns = useMemo<ColumnDef<CrewTimeEntry, unknown>[]>(
    () => [
      {
        accessorKey: 'workDate',
        header: t('hr.crewTimeEntries.columnDate'),
        size: 110,
        cell: ({ getValue }) => <span className="tabular-nums text-neutral-700 dark:text-neutral-300">{formatDate(getValue<string>())}</span>,
      },
      {
        accessorKey: 'crewName',
        header: t('hr.crewTimeEntries.columnCrew'),
        size: 180,
        cell: ({ getValue }) => <span className="font-medium text-neutral-900 dark:text-neutral-100">{getValue<string>()}</span>,
      },
      {
        accessorKey: 'workDescription',
        header: t('hr.crewTimeEntries.columnDescription'),
        size: 300,
        cell: ({ row }) => (
          <div>
            <p className="text-neutral-900 dark:text-neutral-100 truncate max-w-[280px]">{row.original.workDescription}</p>
            {row.original.location && (
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{row.original.location}</p>
            )}
          </div>
        ),
      },
      {
        accessorKey: 'workersCount',
        header: t('hr.crewTimeEntries.columnWorkers'),
        size: 90,
        cell: ({ getValue }) => <span className="tabular-nums text-neutral-700 dark:text-neutral-300">{getValue<number>()} {t('hr.crewTimeEntries.personsSuffix')}</span>,
      },
      {
        accessorKey: 'hoursWorked',
        header: t('hr.crewTimeEntries.columnHours'),
        size: 80,
        cell: ({ getValue }) => <span className="tabular-nums font-medium text-neutral-900 dark:text-neutral-100">{getValue<number>()} {t('hr.crewTimeEntries.hoursSuffix')}</span>,
      },
      {
        accessorKey: 'overtimeHours',
        header: t('hr.crewTimeEntries.columnOvertime'),
        size: 100,
        cell: ({ getValue }) => {
          const val = getValue<number>();
          return <span className={`tabular-nums ${val > 0 ? 'text-warning-600 font-medium' : 'text-neutral-500 dark:text-neutral-400'}`}>{val} {t('hr.crewTimeEntries.hoursSuffix')}</span>;
        },
      },
      {
        accessorKey: 'weatherConditions',
        header: t('hr.crewTimeEntries.columnWeather'),
        size: 120,
        cell: ({ getValue }) => <span className="text-neutral-500 dark:text-neutral-400 text-xs">{getValue<string>() ?? '---'}</span>,
      },
    ],
    [],
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('hr.crewTimeEntries.title')}
        subtitle={`${entries.length} ${t('hr.crewTimeEntries.subtitle')}`}
        breadcrumbs={[
          { label: t('hr.crewTimeEntries.breadcrumbHome'), href: '/' },
          { label: t('hr.breadcrumbPersonnel'), href: '/hr' },
          { label: t('hr.crewTimeEntries.breadcrumbTimeEntries') },
        ]}
        actions={
          <Button iconLeft={<Plus size={16} />} onClick={() => navigate('/hr/crew-time/new')}>{t('hr.crewTimeEntries.newEntry')}</Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard icon={<Calendar size={18} />} label={t('hr.crewTimeEntries.metricTotal')} value={metrics.total} />
        <MetricCard icon={<Clock size={18} />} label={t('hr.crewTimeEntries.metricTotalHours')} value={`${metrics.totalHours} ${t('hr.crewTimeEntries.hoursSuffix')}`} />
        <MetricCard icon={<Clock size={18} />} label={t('hr.crewTimeEntries.metricOvertime')} value={`${metrics.totalOvertime} ${t('hr.crewTimeEntries.hoursSuffix')}`} />
        <MetricCard icon={<HardHat size={18} />} label={t('hr.crewTimeEntries.metricManHours')} value={`${metrics.totalWorkerHours} ${t('hr.crewTimeEntries.hoursSuffix')}`} />
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input placeholder={t('hr.crewTimeEntries.searchPlaceholder')} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>

      <DataTable<CrewTimeEntry>
        data={filtered}
        columns={columns}
        loading={isLoading}
        enableColumnVisibility
        enableDensityToggle
        enableExport
        pageSize={20}
        emptyTitle={t('hr.crewTimeEntries.emptyTitle')}
        emptyDescription={t('hr.crewTimeEntries.emptyDescription')}
      />
    </div>
  );
};

export default CrewTimeEntriesPage;
