import React, { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { Modal } from '@/design-system/components/Modal';
import { FormField, Input, Select } from '@/design-system/components/FormField';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';
import { hrApi } from '@/api/hr';
import { useProjectOptions } from '@/hooks/useSelectOptions';
import toast from 'react-hot-toast';
import type {
  TimesheetT13Row,
  TimesheetT13Cell,
  UpdateTimesheetCellRequest,
} from './types';

// ---------------------------------------------------------------------------
// Attendance code colors
// ---------------------------------------------------------------------------

const codeColors: Record<string, string> = {
  '\u042F': 'bg-success-50 dark:bg-success-900/30 text-success-700 dark:text-success-300',     // Work
  '\u0411': 'bg-danger-50 dark:bg-danger-900/30 text-danger-700 dark:text-danger-300',          // Sick
  '\u041E': 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300',      // Vacation
  '\u041A': 'bg-warning-50 dark:bg-warning-900/30 text-warning-700 dark:text-warning-300',      // Business trip
  '\u041D\u041D': 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400',  // Absent
  '\u0412': 'bg-neutral-50 dark:bg-neutral-800/50 text-neutral-500 dark:text-neutral-500',      // Weekend
  '\u041D': 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',          // Night shift
};

function getCellClasses(code: string): string {
  return codeColors[code] ?? 'bg-neutral-50 dark:bg-neutral-800/50 text-neutral-600 dark:text-neutral-400';
}

// ---------------------------------------------------------------------------
// Month / Project options
// ---------------------------------------------------------------------------

const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1;

const monthOptions = [
  { value: '1', label: t('hr.crewTimeCalendar.months.january') },
  { value: '2', label: t('hr.crewTimeCalendar.months.february') },
  { value: '3', label: t('hr.crewTimeCalendar.months.march') },
  { value: '4', label: t('hr.crewTimeCalendar.months.april') },
  { value: '5', label: t('hr.crewTimeCalendar.months.may') },
  { value: '6', label: t('hr.crewTimeCalendar.months.june') },
  { value: '7', label: t('hr.crewTimeCalendar.months.july') },
  { value: '8', label: t('hr.crewTimeCalendar.months.august') },
  { value: '9', label: t('hr.crewTimeCalendar.months.september') },
  { value: '10', label: t('hr.crewTimeCalendar.months.october') },
  { value: '11', label: t('hr.crewTimeCalendar.months.november') },
  { value: '12', label: t('hr.crewTimeCalendar.months.december') },
];


const codeOptions = [
  { value: '\u042F', label: t('hr.timesheetT13.codes.work') },
  { value: '\u0411', label: t('hr.timesheetT13.codes.sick') },
  { value: '\u041E', label: t('hr.timesheetT13.codes.vacation') },
  { value: '\u041A', label: t('hr.timesheetT13.codes.businessTrip') },
  { value: '\u041D\u041D', label: t('hr.timesheetT13.codes.absent') },
  { value: '\u0412', label: t('hr.timesheetT13.codes.weekend') },
  { value: '\u041D', label: t('hr.timesheetT13.codes.nightShift') },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const TimesheetT13Page: React.FC = () => {
  const queryClient = useQueryClient();
  const { options: projectOpts } = useProjectOptions();
  const projectOptions = [{ value: '', label: t('hr.timesheetT13.projectPlaceholder') }, ...projectOpts];
  const [projectId, setProjectId] = useState('');
  const [month, setMonth] = useState(String(currentMonth));
  const [year] = useState(currentYear);
  const [editCell, setEditCell] = useState<{
    row: TimesheetT13Row;
    cell: TimesheetT13Cell;
  } | null>(null);
  const [editForm, setEditForm] = useState<UpdateTimesheetCellRequest>({
    employeeId: '',
    day: 1,
    code: '\u042F',
    dayHours: 8,
    nightHours: 0,
  });

  const numMonth = Number(month);

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ['timesheet-t13', projectId, numMonth, year],
    queryFn: () => hrApi.getTimesheetT13(projectId, numMonth, year),
    enabled: !!projectId,
  });

  const updateMutation = useMutation({
    mutationFn: (data: UpdateTimesheetCellRequest) =>
      hrApi.updateTimesheetCell(projectId, numMonth, year, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['timesheet-t13', projectId, numMonth, year],
      });
      setEditCell(null);
    },
    onError: () => {
      toast.error(t('common.operationError'));
    },
  });

  // How many days in this month
  const daysInMonth = useMemo(
    () => new Date(year, numMonth, 0).getDate(),
    [year, numMonth],
  );
  const dayNumbers = useMemo(
    () => Array.from({ length: daysInMonth }, (_, i) => i + 1),
    [daysInMonth],
  );

  const handleCellClick = useCallback(
    (row: TimesheetT13Row, day: number) => {
      const cell = row.cells.find((c) => c.day === day);
      const existing: TimesheetT13Cell = cell ?? {
        employeeId: row.employeeId,
        employeeName: row.employeeName,
        day,
        code: '',
        dayHours: 0,
        nightHours: 0,
      };
      setEditCell({ row, cell: existing });
      setEditForm({
        employeeId: row.employeeId,
        day,
        code: existing.code || '\u042F',
        dayHours: existing.dayHours,
        nightHours: existing.nightHours,
      });
    },
    [],
  );

  const handleSaveCell = useCallback(() => {
    updateMutation.mutate(editForm);
  }, [updateMutation, editForm]);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('hr.timesheetT13.title')}
        subtitle={t('hr.timesheetT13.subtitle')}
        breadcrumbs={[
          { label: t('hr.breadcrumbHome'), href: '/' },
          { label: t('hr.breadcrumbPersonnel'), href: '/hr/employees' },
          { label: t('hr.timesheetT13.title') },
        ]}
      />

      {/* Project & month selector */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <div className="flex items-center gap-2">
          <Calendar size={16} className="text-neutral-400" />
          <FormField label={t('hr.timesheetT13.projectLabel')}>
            <Select
              options={projectOptions}
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="w-56"
            />
          </FormField>
        </div>
        <FormField label={t('hr.timesheetT13.monthLabel')}>
          <Select
            options={monthOptions}
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="w-40"
          />
        </FormField>
      </div>

      {/* T-13 Grid */}
      {!projectId ? (
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-12 text-center">
          <p className="text-neutral-500 dark:text-neutral-400">
            {t('hr.timesheetT13.emptyDescription')}
          </p>
        </div>
      ) : isLoading ? (
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-8">
          <div className="animate-pulse space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-8 bg-neutral-100 dark:bg-neutral-800 rounded" />
            ))}
          </div>
        </div>
      ) : rows.length === 0 ? (
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-12 text-center">
          <p className="text-neutral-500 dark:text-neutral-400">
            {t('hr.timesheetT13.emptyTitle')}
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50">
                  <th className="sticky left-0 z-10 bg-neutral-50 dark:bg-neutral-800/50 px-3 py-2 text-left font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider min-w-[160px]">
                    {t('hr.timesheetT13.columnEmployee')}
                  </th>
                  <th className="px-2 py-2 text-left font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider min-w-[100px]">
                    {t('hr.timesheetT13.columnPosition')}
                  </th>
                  {dayNumbers.map((day) => (
                    <th
                      key={day}
                      className="px-0.5 py-2 text-center font-semibold text-neutral-500 dark:text-neutral-400 min-w-[36px]"
                    >
                      {day}
                    </th>
                  ))}
                  <th className="px-2 py-2 text-center font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                    {t('hr.timesheetT13.columnTotalDays')}
                  </th>
                  <th className="px-2 py-2 text-center font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                    {t('hr.timesheetT13.columnTotalHours')}
                  </th>
                  <th className="px-2 py-2 text-center font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                    {t('hr.timesheetT13.columnTotalNight')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, rowIdx) => {
                  const cellsByDay = new Map<number, TimesheetT13Cell>();
                  row.cells.forEach((c) => cellsByDay.set(c.day, c));

                  return (
                    <tr
                      key={row.employeeId}
                      className={cn(
                        'border-b border-neutral-100 dark:border-neutral-800',
                        rowIdx % 2 === 1
                          ? 'bg-neutral-25 dark:bg-neutral-800/30'
                          : 'bg-white dark:bg-neutral-900',
                      )}
                    >
                      <td className="sticky left-0 z-10 bg-inherit px-3 py-1.5">
                        <span className="font-medium text-neutral-900 dark:text-neutral-100 text-xs">
                          {row.employeeName}
                        </span>
                      </td>
                      <td className="px-2 py-1.5 text-neutral-600 dark:text-neutral-400">
                        {row.position}
                      </td>
                      {dayNumbers.map((day) => {
                        const cell = cellsByDay.get(day);
                        const code = cell?.code ?? '';
                        return (
                          <td key={day} className="px-0.5 py-0.5">
                            <button
                              type="button"
                              onClick={() => handleCellClick(row, day)}
                              className={cn(
                                'w-full h-7 rounded text-[10px] font-medium flex items-center justify-center cursor-pointer transition-colors hover:ring-1 hover:ring-primary-400',
                                code
                                  ? getCellClasses(code)
                                  : 'bg-neutral-50 dark:bg-neutral-800/50 text-neutral-400',
                              )}
                              title={
                                cell
                                  ? `${code} | ${cell.dayHours}/${cell.nightHours}`
                                  : ''
                              }
                            >
                              {code || '\u2014'}
                            </button>
                          </td>
                        );
                      })}
                      <td className="px-2 py-1.5 text-center tabular-nums font-medium text-neutral-700 dark:text-neutral-300">
                        {row.totalDays}
                      </td>
                      <td className="px-2 py-1.5 text-center tabular-nums font-medium text-neutral-700 dark:text-neutral-300">
                        {row.totalHours}
                      </td>
                      <td className="px-2 py-1.5 text-center tabular-nums font-medium text-neutral-700 dark:text-neutral-300">
                        {row.totalNightHours}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit cell modal */}
      <Modal
        open={!!editCell}
        onClose={() => setEditCell(null)}
        title={t('hr.timesheetT13.editCellTitle')}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditCell(null)}>
              {t('hr.timesheetT13.editCellCancel')}
            </Button>
            <Button
              onClick={handleSaveCell}
              loading={updateMutation.isPending}
            >
              {t('hr.timesheetT13.editCellSave')}
            </Button>
          </>
        }
      >
        {editCell && (
          <div className="space-y-4">
            <FormField label={t('hr.timesheetT13.editCellEmployee')}>
              <Input value={editCell.row.employeeName} disabled />
            </FormField>
            <FormField label={t('hr.timesheetT13.editCellDay')}>
              <Input value={String(editForm.day)} disabled />
            </FormField>
            <FormField label={t('hr.timesheetT13.editCellCode')} required>
              <Select
                options={codeOptions}
                value={editForm.code}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, code: e.target.value }))
                }
              />
            </FormField>
            <div className="grid grid-cols-2 gap-4">
              <FormField label={t('hr.timesheetT13.editCellDayHours')}>
                <Input
                  type="number"
                  min="0"
                  max="24"
                  value={editForm.dayHours}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      dayHours: Number(e.target.value),
                    }))
                  }
                />
              </FormField>
              <FormField label={t('hr.timesheetT13.editCellNightHours')}>
                <Input
                  type="number"
                  min="0"
                  max="24"
                  value={editForm.nightHours}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      nightHours: Number(e.target.value),
                    }))
                  }
                />
              </FormField>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default TimesheetT13Page;
