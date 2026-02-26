import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/design-system/components/PageHeader';
import { PivotTable, type AggregationType } from '@/design-system/components/PivotTable';
import { hrApi } from '@/api/hr';
import { t } from '@/i18n';
import type { Timesheet } from '@/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TimesheetRecord extends Record<string, unknown> {
  [key: string]: unknown;
  id: string;
  employee: string;
  week: string;
  hours: number;
  projectName: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Compute ISO-week label from a date string (e.g. "2026-02-16" -> "W08") */
function getWeekLabel(dateStr: string): string {
  const d = new Date(dateStr);
  const startOfYear = new Date(d.getFullYear(), 0, 1);
  const days = Math.floor((d.getTime() - startOfYear.getTime()) / 86_400_000);
  const weekNum = Math.ceil((days + startOfYear.getDay() + 1) / 7);
  return `W${String(weekNum).padStart(2, '0')}`;
}

/** Map raw API timesheets into PivotTable records grouped by employee + week */
function mapTimesheets(raw: Timesheet[]): TimesheetRecord[] {
  // Aggregate hours per (employee, week, project)
  const map = new Map<string, TimesheetRecord>();
  raw.forEach((ts) => {
    const weekLabel = getWeekLabel(ts.workDate);
    const key = `${ts.employeeName}__${weekLabel}`;
    const existing = map.get(key);
    if (existing) {
      existing.hours += ts.hoursWorked + (ts.overtimeHours ?? 0);
    } else {
      map.set(key, {
        id: key,
        employee: ts.employeeName,
        week: weekLabel,
        hours: ts.hoursWorked + (ts.overtimeHours ?? 0),
        projectName: ts.projectName,
      });
    }
  });
  return Array.from(map.values());
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const TimesheetPivotPage: React.FC = () => {
  const [aggregation, setAggregation] = useState<AggregationType>('sum');

  const { data: timesheetsData, isLoading } = useQuery({
    queryKey: ['timesheets', 'pivot'],
    queryFn: () => hrApi.getTimesheets({ size: 500 }),
  });

  const timesheetData = useMemo(
    () => mapTimesheets(timesheetsData?.content ?? []),
    [timesheetsData],
  );

  const employees = useMemo(
    () => [...new Set(timesheetData.map((r) => r.employee))].sort(),
    [timesheetData],
  );

  const weeks = useMemo(
    () => [...new Set(timesheetData.map((r) => r.week))].sort(),
    [timesheetData],
  );

  const totalHours = timesheetData.reduce((s, d) => s + d.hours, 0);
  const avgPerWeek = weeks.length > 0 ? totalHours / weeks.length : 0;
  const overtimeCount = timesheetData.filter((d) => d.hours > 40).length;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('hr.timesheetPivot.title')}
        subtitle={t('hr.timesheetPivot.subtitle')}
        breadcrumbs={[
          { label: t('hr.timesheetPivot.breadcrumbHome'), href: '/' },
          { label: t('hr.breadcrumbPersonnel'), href: '/employees' },
          { label: t('hr.timesheetPivot.breadcrumbTimesheets'), href: '/timesheets' },
          { label: t('hr.timesheetPivot.breadcrumbPivot') },
        ]}
      />

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="rounded-lg border bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700 px-4 py-3">
          <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{totalHours}</p>
          <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mt-0.5">{t('hr.timesheetPivot.totalHours')}</p>
        </div>
        <div className="rounded-lg border bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700 px-4 py-3">
          <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{employees.length}</p>
          <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mt-0.5">{t('hr.timesheetPivot.employeeCount')}</p>
        </div>
        <div className="rounded-lg border bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700 px-4 py-3">
          <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{Math.round(avgPerWeek)}</p>
          <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mt-0.5">{t('hr.timesheetPivot.avgPerWeek')}</p>
        </div>
        <div className="rounded-lg border bg-orange-50 border-orange-200 px-4 py-3">
          <p className="text-2xl font-bold text-orange-700">{overtimeCount}</p>
          <p className="text-xs font-medium text-orange-600 mt-0.5">{t('hr.timesheetPivot.overtimeCount')}</p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-neutral-500 dark:text-neutral-400">{t('hr.timesheetPivot.aggregationLabel')}:</span>
          <div className="flex items-center bg-neutral-100 dark:bg-neutral-800 rounded-lg p-0.5">
            {([
              ['sum', t('hr.timesheetPivot.aggSum')] as const,
              ['count', t('hr.timesheetPivot.aggCount')] as const,
              ['average', t('hr.timesheetPivot.aggAverage')] as const,
            ]).map(([value, label]) => (
              <button
                key={value}
                onClick={() => setAggregation(value)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  aggregation === value
                    ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-xs'
                    : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-neutral-400">{t('common.loading')}</div>
      ) : (
        <PivotTable<TimesheetRecord>
          data={timesheetData}
          rowField="employee"
          columnField="week"
          valueField="hours"
          aggregation={aggregation}
          rowLabel={t('hr.timesheetPivot.pivotRowLabel')}
          rowOrder={employees}
          columnOrder={weeks}
          formatValue={aggregation === 'count' ? (v) => String(Math.round(v)) : (v) => `${Math.round(v)} ${t('hr.timesheetPivot.hoursSuffix')}`}
          title={t('hr.timesheetPivot.pivotTitle')}
        />
      )}
    </div>
  );
};

export default TimesheetPivotPage;
