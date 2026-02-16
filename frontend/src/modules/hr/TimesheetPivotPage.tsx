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

const getEmployees = () => [
  t('mockData.employeeKozlov'),
  t('mockData.employeePetrov'),
  t('mockData.employeeSidorov'),
  t('mockData.employeeMorozova'),
  t('mockData.employeeBelov'),
  t('mockData.employeeIvanovDN'),
  t('mockData.employeeNovikova'),
  t('mockData.employeeFedorov'),
];

const getWeeks = () => [t('mockData.week1'), t('mockData.week2'), t('mockData.week3'), t('mockData.week4')];
const getTimesheetData = (): TimesheetRecord[] => {
  const e = getEmployees();
  const w = getWeeks();
  const pSol = t('mockData.projectSolnechny');
  const pGor = t('mockData.projectGorizont');
  const pBri = t('mockData.projectBridgeVyatka');
  const dCon = t('mockData.deptConstruction');
  const dElc = t('mockData.deptElectrical');
  const dFin = t('mockData.deptFinishing');
  const dLog = t('mockData.deptLogistics');
  const dPto = t('mockData.deptPto');
  return [
    // Week 1
    { id: '1', employee: e[0], week: w[0], hours: 42, projectName: pSol, department: dCon },
    { id: '2', employee: e[1], week: w[0], hours: 40, projectName: pSol, department: dCon },
    { id: '3', employee: e[2], week: w[0], hours: 45, projectName: pBri, department: dCon },
    { id: '4', employee: e[3], week: w[0], hours: 38, projectName: pGor, department: dElc },
    { id: '5', employee: e[4], week: w[0], hours: 40, projectName: pGor, department: dFin },
    { id: '6', employee: e[5], week: w[0], hours: 36, projectName: pSol, department: dLog },
    { id: '7', employee: e[6], week: w[0], hours: 40, projectName: pGor, department: dPto },
    { id: '8', employee: e[7], week: w[0], hours: 44, projectName: pBri, department: dCon },
    // Week 2
    { id: '9', employee: e[0], week: w[1], hours: 44, projectName: pSol, department: dCon },
    { id: '10', employee: e[1], week: w[1], hours: 40, projectName: pSol, department: dCon },
    { id: '11', employee: e[2], week: w[1], hours: 48, projectName: pBri, department: dCon },
    { id: '12', employee: e[3], week: w[1], hours: 40, projectName: pGor, department: dElc },
    { id: '13', employee: e[4], week: w[1], hours: 42, projectName: pGor, department: dFin },
    { id: '14', employee: e[5], week: w[1], hours: 40, projectName: pSol, department: dLog },
    { id: '15', employee: e[6], week: w[1], hours: 38, projectName: pGor, department: dPto },
    { id: '16', employee: e[7], week: w[1], hours: 40, projectName: pBri, department: dCon },
    // Week 3
    { id: '17', employee: e[0], week: w[2], hours: 40, projectName: pSol, department: dCon },
    { id: '18', employee: e[1], week: w[2], hours: 44, projectName: pSol, department: dCon },
    { id: '19', employee: e[2], week: w[2], hours: 40, projectName: pBri, department: dCon },
    { id: '20', employee: e[3], week: w[2], hours: 42, projectName: pGor, department: dElc },
    { id: '21', employee: e[4], week: w[2], hours: 40, projectName: pGor, department: dFin },
    { id: '22', employee: e[5], week: w[2], hours: 40, projectName: pSol, department: dLog },
    { id: '23', employee: e[6], week: w[2], hours: 40, projectName: pGor, department: dPto },
    { id: '24', employee: e[7], week: w[2], hours: 46, projectName: pBri, department: dCon },
    // Week 4
    { id: '25', employee: e[0], week: w[3], hours: 43, projectName: pSol, department: dCon },
    { id: '26', employee: e[1], week: w[3], hours: 41, projectName: pSol, department: dCon },
    { id: '27', employee: e[2], week: w[3], hours: 44, projectName: pBri, department: dCon },
    { id: '28', employee: e[3], week: w[3], hours: 39, projectName: pGor, department: dElc },
    { id: '29', employee: e[4], week: w[3], hours: 40, projectName: pGor, department: dFin },
    { id: '30', employee: e[5], week: w[3], hours: 37, projectName: pSol, department: dLog },
    { id: '31', employee: e[6], week: w[3], hours: 41, projectName: pGor, department: dPto },
    { id: '32', employee: e[7], week: w[3], hours: 45, projectName: pBri, department: dCon },
  ];
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const TimesheetPivotPage: React.FC = () => {
  const [aggregation, setAggregation] = useState<AggregationType>('sum');

  const employees = getEmployees();
  const weeks = getWeeks();
  const timesheetData = getTimesheetData();

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
