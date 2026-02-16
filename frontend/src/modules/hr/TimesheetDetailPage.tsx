import React, { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  User,
  Calendar,
  Clock,
  CheckCircle2,
  Edit,
  Trash2,
  Building2,
} from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import {
  StatusBadge,
  timesheetStatusColorMap,
  timesheetStatusLabels,
} from '@/design-system/components/StatusBadge';
import { hrApi } from '@/api/hr';
import { formatDateLong } from '@/lib/format';
import { t } from '@/i18n';
import toast from 'react-hot-toast';

interface DayEntry {
  date: string;
  dayOfWeek: string;
  hours: number;
  overtime: number;
  isWeekend: boolean;
}

interface Timesheet {
  id: string;
  number: string;
  status: string;
  employeeId: string;
  employeeName: string;
  employeePosition: string;
  department: string;
  projectName: string;
  period: string;
  periodStart: string;
  periodEnd: string;
  totalHours: number;
  totalOvertime: number;
  workDays: number;
  approvedByName: string | null;
  approvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  dayEntries?: DayEntry[];
}

const statusActions: Record<string, { label: string; target: string }[]> = {
  draft: [{ label: t('hr.timesheetDetail.actionSubmit'), target: 'SUBMITTED' }],
  submitted: [
    { label: t('hr.timesheetDetail.actionApprove'), target: 'APPROVED' },
    { label: t('hr.timesheetDetail.actionReject'), target: 'REJECTED' },
  ],
  rejected: [{ label: t('hr.timesheetDetail.actionResubmit'), target: 'SUBMITTED' }],
};

const TimesheetDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: timesheet } = useQuery({
    queryKey: ['timesheet', id],
    queryFn: () => hrApi.getTimesheet(id!),
    enabled: !!id,
  });

  const ts = timesheet as Timesheet | undefined;
  const [statusOverride, setStatusOverride] = useState<string | null>(null);
  const effectiveStatus = statusOverride ?? ts?.status ?? '';
  const dayEntries = ts?.dayEntries ?? [];
  const actions = useMemo(() => statusActions[effectiveStatus] ?? [], [effectiveStatus]);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={`${t('hr.timesheetDetail.title')} ${ts?.period ?? ''}`}
        subtitle={`${ts?.number ?? ''} / ${ts?.employeeName ?? ''}`}
        backTo="/timesheets"
        breadcrumbs={[
          { label: t('hr.timesheetDetail.breadcrumbHome'), href: '/' },
          { label: t('hr.timesheetDetail.breadcrumbTimesheets'), href: '/timesheets' },
          { label: ts?.number ?? '' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <StatusBadge status={effectiveStatus} colorMap={timesheetStatusColorMap} label={timesheetStatusLabels[effectiveStatus] ?? effectiveStatus} size="md" />
            {actions.map((a) => (
              <Button
                key={a.target}
                variant={a.target === 'APPROVED' ? 'success' : a.target === 'REJECTED' ? 'danger' : 'secondary'}
                size="sm"
                onClick={() => {
                  setStatusOverride(a.target);
                  toast.success(`${t('hr.timesheetDetail.toastStatusChanged')}: ${timesheetStatusLabels[a.target] ?? a.target}`);
                }}
              >
                {a.label}
              </Button>
            ))}
            <Button
              variant="secondary"
              size="sm"
              iconLeft={<Edit size={14} />}
              onClick={() => {
                toast(t('hr.timesheetDetail.toastEditAvailable'));
                navigate('/timesheets');
              }}
            >
              {t('hr.timesheetDetail.btnEdit')}
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Summary */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center gap-2">
              <Clock size={16} className="text-primary-500" />
              {t('hr.timesheetDetail.sectionPeriodResults')}
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-primary-50 rounded-lg text-center">
                <p className="text-xs text-primary-600 mb-1">{t('hr.timesheetDetail.workDays')}</p>
                <p className="text-2xl font-bold text-primary-700">{ts?.workDays ?? 0}</p>
              </div>
              <div className="p-4 bg-success-50 rounded-lg text-center">
                <p className="text-xs text-success-600 mb-1">{t('hr.timesheetDetail.mainHours')}</p>
                <p className="text-2xl font-bold text-success-700">{ts?.totalHours ?? 0}</p>
              </div>
              <div className="p-4 bg-warning-50 rounded-lg text-center">
                <p className="text-xs text-warning-600 mb-1">{t('hr.timesheetDetail.overtime')}</p>
                <p className="text-2xl font-bold text-warning-700">{ts?.totalOvertime ?? 0}</p>
              </div>
            </div>
          </div>

          {/* Day-by-day grid */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center gap-2">
              <Calendar size={16} className="text-primary-500" />
              {t('hr.timesheetDetail.sectionDailyDetail')}
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-200 dark:border-neutral-700">
                    <th className="text-left py-2 pr-4 text-xs font-medium text-neutral-500 dark:text-neutral-400">{t('hr.timesheetDetail.headerDate')}</th>
                    <th className="text-center py-2 px-4 text-xs font-medium text-neutral-500 dark:text-neutral-400">{t('hr.timesheetDetail.headerDay')}</th>
                    <th className="text-right py-2 px-4 text-xs font-medium text-neutral-500 dark:text-neutral-400">{t('hr.timesheetDetail.headerHours')}</th>
                    <th className="text-right py-2 pl-4 text-xs font-medium text-neutral-500 dark:text-neutral-400">{t('hr.timesheetDetail.headerOvertime')}</th>
                    <th className="text-right py-2 pl-4 text-xs font-medium text-neutral-500 dark:text-neutral-400">{t('hr.timesheetDetail.headerTotal')}</th>
                  </tr>
                </thead>
                <tbody>
                  {dayEntries.map((day) => (
                    <tr key={day.date} className={`border-b border-neutral-100 ${day.isWeekend ? 'bg-neutral-50 dark:bg-neutral-800' : ''}`}>
                      <td className="py-2.5 pr-4 text-neutral-800 dark:text-neutral-200">{day.date.slice(5)}</td>
                      <td className={`py-2.5 px-4 text-center ${day.isWeekend ? 'text-danger-500 font-medium' : 'text-neutral-600'}`}>{day.dayOfWeek}</td>
                      <td className="py-2.5 px-4 text-right text-neutral-700 dark:text-neutral-300">{day.hours}</td>
                      <td className={`py-2.5 pl-4 text-right ${day.overtime > 0 ? 'text-warning-600 font-medium' : 'text-neutral-400'}`}>{day.overtime || '---'}</td>
                      <td className="py-2.5 pl-4 text-right font-medium text-neutral-900 dark:text-neutral-100">{day.hours + day.overtime}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">{t('hr.timesheetDetail.sectionEmployee')}</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-sm font-semibold text-primary-700">
                  {(ts?.employeeName ?? '').split(' ').map((n) => n[0]).join('')}
                </div>
                <div>
                  <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 cursor-pointer text-primary-600 hover:text-primary-700" onClick={() => navigate(`/employees/${ts?.employeeId}`)}>{ts?.employeeName ?? ''}</p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">{ts?.employeePosition ?? ''}</p>
                </div>
              </div>
              <InfoItem icon={<Building2 size={15} />} label={t('hr.timesheetDetail.labelDepartment')} value={ts?.department ?? ''} />
              <InfoItem icon={<Building2 size={15} />} label={t('hr.timesheetDetail.labelProject')} value={ts?.projectName ?? ''} />
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center gap-2">
              <CheckCircle2 size={15} />
              {t('hr.timesheetDetail.sectionApproval')}
            </h3>
            <div className="space-y-4">
              <InfoItem icon={<Calendar size={15} />} label={t('hr.timesheetDetail.labelPeriod')} value={`${formatDateLong(ts?.periodStart ?? '')} - ${formatDateLong(ts?.periodEnd ?? '')}`} />
              <InfoItem icon={<User size={15} />} label={t('hr.timesheetDetail.labelApprovedBy')} value={ts?.approvedByName ?? t('hr.timesheetDetail.awaitingApproval')} />
              <InfoItem icon={<Clock size={15} />} label={t('hr.timesheetDetail.labelApprovalDate')} value={ts?.approvedAt ? formatDateLong(ts.approvedAt) : '---'} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const InfoItem: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
  <div className="flex items-start gap-3">
    <span className="text-neutral-400 mt-0.5 flex-shrink-0">{icon}</span>
    <div>
      <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-0.5">{label}</p>
      <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">{value}</p>
    </div>
  </div>
);

export default TimesheetDetailPage;
