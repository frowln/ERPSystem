import React, { useState } from 'react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { PivotTable, type AggregationType } from '@/design-system/components/PivotTable';
import { t } from '@/i18n';

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
  department: string;
}

// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------

const employees = [
  'Козлов И.П.',
  'Петров В.С.',
  'Сидоров М.Н.',
  'Морозова А.Д.',
  'Белов С.М.',
  'Иванов Д.Н.',
  'Новикова Е.В.',
  'Фёдоров А.К.',
];

const weeks = ['Нед 1 (03-07)', 'Нед 2 (10-14)', 'Нед 3 (17-21)', 'Нед 4 (24-28)'];
const timesheetData: TimesheetRecord[] = [
  // Week 1
  { id: '1', employee: 'Козлов И.П.', week: 'Нед 1 (03-07)', hours: 42, projectName: 'ЖК "Солнечный"', department: 'Строительство' },
  { id: '2', employee: 'Петров В.С.', week: 'Нед 1 (03-07)', hours: 40, projectName: 'ЖК "Солнечный"', department: 'Строительство' },
  { id: '3', employee: 'Сидоров М.Н.', week: 'Нед 1 (03-07)', hours: 45, projectName: 'Мост через р. Вятка', department: 'Строительство' },
  { id: '4', employee: 'Морозова А.Д.', week: 'Нед 1 (03-07)', hours: 38, projectName: 'БЦ "Горизонт"', department: 'Электромонтаж' },
  { id: '5', employee: 'Белов С.М.', week: 'Нед 1 (03-07)', hours: 40, projectName: 'БЦ "Горизонт"', department: 'Отделка' },
  { id: '6', employee: 'Иванов Д.Н.', week: 'Нед 1 (03-07)', hours: 36, projectName: 'ЖК "Солнечный"', department: 'Логистика' },
  { id: '7', employee: 'Новикова Е.В.', week: 'Нед 1 (03-07)', hours: 40, projectName: 'БЦ "Горизонт"', department: 'ПТО' },
  { id: '8', employee: 'Фёдоров А.К.', week: 'Нед 1 (03-07)', hours: 44, projectName: 'Мост через р. Вятка', department: 'Строительство' },
  // Week 2
  { id: '9', employee: 'Козлов И.П.', week: 'Нед 2 (10-14)', hours: 44, projectName: 'ЖК "Солнечный"', department: 'Строительство' },
  { id: '10', employee: 'Петров В.С.', week: 'Нед 2 (10-14)', hours: 40, projectName: 'ЖК "Солнечный"', department: 'Строительство' },
  { id: '11', employee: 'Сидоров М.Н.', week: 'Нед 2 (10-14)', hours: 48, projectName: 'Мост через р. Вятка', department: 'Строительство' },
  { id: '12', employee: 'Морозова А.Д.', week: 'Нед 2 (10-14)', hours: 40, projectName: 'БЦ "Горизонт"', department: 'Электромонтаж' },
  { id: '13', employee: 'Белов С.М.', week: 'Нед 2 (10-14)', hours: 42, projectName: 'БЦ "Горизонт"', department: 'Отделка' },
  { id: '14', employee: 'Иванов Д.Н.', week: 'Нед 2 (10-14)', hours: 40, projectName: 'ЖК "Солнечный"', department: 'Логистика' },
  { id: '15', employee: 'Новикова Е.В.', week: 'Нед 2 (10-14)', hours: 38, projectName: 'БЦ "Горизонт"', department: 'ПТО' },
  { id: '16', employee: 'Фёдоров А.К.', week: 'Нед 2 (10-14)', hours: 40, projectName: 'Мост через р. Вятка', department: 'Строительство' },
  // Week 3
  { id: '17', employee: 'Козлов И.П.', week: 'Нед 3 (17-21)', hours: 40, projectName: 'ЖК "Солнечный"', department: 'Строительство' },
  { id: '18', employee: 'Петров В.С.', week: 'Нед 3 (17-21)', hours: 44, projectName: 'ЖК "Солнечный"', department: 'Строительство' },
  { id: '19', employee: 'Сидоров М.Н.', week: 'Нед 3 (17-21)', hours: 40, projectName: 'Мост через р. Вятка', department: 'Строительство' },
  { id: '20', employee: 'Морозова А.Д.', week: 'Нед 3 (17-21)', hours: 42, projectName: 'БЦ "Горизонт"', department: 'Электромонтаж' },
  { id: '21', employee: 'Белов С.М.', week: 'Нед 3 (17-21)', hours: 40, projectName: 'БЦ "Горизонт"', department: 'Отделка' },
  { id: '22', employee: 'Иванов Д.Н.', week: 'Нед 3 (17-21)', hours: 40, projectName: 'ЖК "Солнечный"', department: 'Логистика' },
  { id: '23', employee: 'Новикова Е.В.', week: 'Нед 3 (17-21)', hours: 40, projectName: 'БЦ "Горизонт"', department: 'ПТО' },
  { id: '24', employee: 'Фёдоров А.К.', week: 'Нед 3 (17-21)', hours: 46, projectName: 'Мост через р. Вятка', department: 'Строительство' },
  // Week 4
  { id: '25', employee: 'Козлов И.П.', week: 'Нед 4 (24-28)', hours: 43, projectName: 'ЖК "Солнечный"', department: 'Строительство' },
  { id: '26', employee: 'Петров В.С.', week: 'Нед 4 (24-28)', hours: 41, projectName: 'ЖК "Солнечный"', department: 'Строительство' },
  { id: '27', employee: 'Сидоров М.Н.', week: 'Нед 4 (24-28)', hours: 44, projectName: 'Мост через р. Вятка', department: 'Строительство' },
  { id: '28', employee: 'Морозова А.Д.', week: 'Нед 4 (24-28)', hours: 39, projectName: 'БЦ "Горизонт"', department: 'Электромонтаж' },
  { id: '29', employee: 'Белов С.М.', week: 'Нед 4 (24-28)', hours: 40, projectName: 'БЦ "Горизонт"', department: 'Отделка' },
  { id: '30', employee: 'Иванов Д.Н.', week: 'Нед 4 (24-28)', hours: 37, projectName: 'ЖК "Солнечный"', department: 'Логистика' },
  { id: '31', employee: 'Новикова Е.В.', week: 'Нед 4 (24-28)', hours: 41, projectName: 'БЦ "Горизонт"', department: 'ПТО' },
  { id: '32', employee: 'Фёдоров А.К.', week: 'Нед 4 (24-28)', hours: 45, projectName: 'Мост через р. Вятка', department: 'Строительство' },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const TimesheetPivotPage: React.FC = () => {
  const [aggregation, setAggregation] = useState<AggregationType>('sum');

  const totalHours = timesheetData.reduce((s, d) => s + d.hours, 0);
  const avgPerWeek = totalHours / weeks.length;
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
    </div>
  );
};

export default TimesheetPivotPage;
