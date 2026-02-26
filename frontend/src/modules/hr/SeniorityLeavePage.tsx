import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import {
  Search,
  Calendar,
  Clock,
  Users,
  Briefcase,
} from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { DataTable } from '@/design-system/components/DataTable';
import { MetricCard } from '@/design-system/components/MetricCard';
import { Input } from '@/design-system/components/FormField';
import { hrApi } from '@/api/hr';
import { formatDate } from '@/lib/format';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';
import type { SeniorityRecord } from './types';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const SeniorityLeavePage: React.FC = () => {
  const [search, setSearch] = useState('');

  const { data: records = [], isLoading } = useQuery({
    queryKey: ['hr-seniority-report'],
    queryFn: () => hrApi.getSeniorityReport(),
  });

  const filtered = useMemo(() => {
    if (!search) return records;
    const lower = search.toLowerCase();
    return records.filter((r) => r.employeeName.toLowerCase().includes(lower));
  }, [records, search]);

  // Metrics
  const avgSeniority = useMemo(() => {
    if (records.length === 0) return 0;
    const totalYears = records.reduce((s, r) => s + r.seniorityYears + r.seniorityMonths / 12 + r.seniorityDays / 365, 0);
    return Math.round((totalYears / records.length) * 10) / 10;
  }, [records]);

  const totalLeaveBalance = useMemo(
    () => records.reduce((s, r) => s + r.remainingLeave, 0),
    [records],
  );

  const over28Days = useMemo(
    () => records.filter((r) => r.remainingLeave > 28).length,
    [records],
  );

  const columns = useMemo<ColumnDef<SeniorityRecord, unknown>[]>(
    () => [
      {
        accessorKey: 'employeeName',
        header: t('hr.seniority.columnEmployee'),
        size: 220,
        cell: ({ getValue }) => (
          <span className="font-medium text-neutral-900 dark:text-neutral-100">
            {getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: 'hireDate',
        header: t('hr.seniority.columnHireDate'),
        size: 120,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-neutral-600 dark:text-neutral-400">
            {formatDate(getValue<string>())}
          </span>
        ),
      },
      {
        id: 'seniority',
        header: t('hr.seniority.columnSeniority'),
        size: 150,
        cell: ({ row }) => {
          const { seniorityYears, seniorityMonths, seniorityDays } =
            row.original;
          return (
            <span className="tabular-nums text-neutral-700 dark:text-neutral-300">
              {t('hr.seniority.seniorityFormat', {
                years: seniorityYears,
                months: seniorityMonths,
                days: seniorityDays,
              })}
            </span>
          );
        },
      },
      {
        accessorKey: 'baseLeave',
        header: t('hr.seniority.columnBaseLeave'),
        size: 100,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-center block text-neutral-700 dark:text-neutral-300">
            {getValue<number>()}
          </span>
        ),
      },
      {
        accessorKey: 'additionalLeave',
        header: t('hr.seniority.columnAdditionalLeave'),
        size: 120,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-center block text-neutral-700 dark:text-neutral-300">
            {getValue<number>()}
          </span>
        ),
      },
      {
        accessorKey: 'totalLeave',
        header: t('hr.seniority.columnTotalLeave'),
        size: 90,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-center block font-medium text-neutral-900 dark:text-neutral-100">
            {getValue<number>()}
          </span>
        ),
      },
      {
        accessorKey: 'usedLeave',
        header: t('hr.seniority.columnUsedLeave'),
        size: 110,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-center block text-neutral-600 dark:text-neutral-400">
            {getValue<number>()}
          </span>
        ),
      },
      {
        accessorKey: 'remainingLeave',
        header: t('hr.seniority.columnRemainingLeave'),
        size: 100,
        cell: ({ row }) => {
          const remaining = row.original.remainingLeave;
          return (
            <span
              className={cn(
                'tabular-nums text-center block font-semibold',
                remaining > 28
                  ? 'text-warning-600 dark:text-warning-400'
                  : remaining > 0
                    ? 'text-success-600 dark:text-success-400'
                    : 'text-danger-600 dark:text-danger-400',
              )}
            >
              {remaining}
            </span>
          );
        },
      },
    ],
    [],
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('hr.seniority.title')}
        subtitle={t('hr.seniority.subtitle')}
        breadcrumbs={[
          { label: t('hr.breadcrumbHome'), href: '/' },
          { label: t('hr.breadcrumbPersonnel'), href: '/hr/employees' },
          { label: t('hr.seniority.title') },
        ]}
      />

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard
          icon={<Clock size={18} />}
          label={t('hr.seniority.metricAvgSeniority')}
          value={t('hr.seniority.metricAvgSeniorityYears', {
            value: avgSeniority,
          })}
        />
        <MetricCard
          icon={<Calendar size={18} />}
          label={t('hr.seniority.metricTotalLeaveBalance')}
          value={t('hr.seniority.metricTotalLeaveBalanceDays', {
            value: totalLeaveBalance,
          })}
        />
        <MetricCard
          icon={<Briefcase size={18} />}
          label={t('hr.seniority.metricOver28Days')}
          value={over28Days}
          trend={
            over28Days > 0
              ? { direction: 'up', value: String(over28Days) }
              : undefined
          }
        />
        <MetricCard
          icon={<Users size={18} />}
          label={t('hr.seniority.metricEmployees')}
          value={records.length}
        />
      </div>

      {/* Search */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
          />
          <Input
            placeholder={t('hr.seniority.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <DataTable<SeniorityRecord>
        data={filtered}
        columns={columns}
        loading={isLoading}
        enableRowSelection
        enableColumnVisibility
        enableExport
        pageSize={20}
        emptyTitle={t('hr.seniority.emptyTitle')}
        emptyDescription={t('hr.seniority.emptyDescription')}
      />
    </div>
  );
};

export default SeniorityLeavePage;
