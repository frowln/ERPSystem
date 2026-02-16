import React, { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CalendarDays,
  Cloud,
  Users,
  Package,
  AlertTriangle,
  User,
  Calendar,
  Clock,
  Edit,
  Trash2,
  ClipboardList,
} from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { useConfirmDialog } from '@/design-system/components/ConfirmDialog/provider';
import {
  StatusBadge,
  dailyLogStatusColorMap,
  dailyLogStatusLabels,
  weatherColorMap,
  weatherLabels,
} from '@/design-system/components/StatusBadge';
import { formatDateLong, formatNumber } from '@/lib/format';
import { t } from '@/i18n';
import toast from 'react-hot-toast';
import { operationsApi } from '@/api/operations';

interface LogEntry {
  id: string;
  time: string;
  category: string;
  description: string;
}

interface WorkforceEntry {
  trade: string;
  count: number;
  hours: number;
}

interface MaterialReceived {
  name: string;
  quantity: number;
  unit: string;
  supplier: string;
}

interface Incident {
  id: string;
  type: string;
  description: string;
  severity: string;
}

interface DailyLog {
  id: string;
  number: string;
  date: string;
  status: string;
  weather: string;
  temperatureMin: number;
  temperatureMax: number;
  windSpeed: string;
  projectName: string;
  location: string;
  totalWorkers: number;
  totalHours: number;
  authorName: string;
  approvedByName: string | null;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

const emptyDailyLog: DailyLog = {
  id: '',
  number: '',
  date: '',
  status: 'DRAFT',
  weather: '',
  temperatureMin: 0,
  temperatureMax: 0,
  windSpeed: '',
  projectName: '',
  location: '',
  totalWorkers: 0,
  totalHours: 0,
  authorName: '',
  approvedByName: null,
  notes: '',
  createdAt: '',
  updatedAt: '',
};
const getStatusActions = (): Record<string, { label: string; target: string }[]> => ({
  draft: [{ label: t('operations.dailyLogDetail.actionSubmit'), target: 'SUBMITTED' }],
  submitted: [
    { label: t('operations.dailyLogDetail.actionApprove'), target: 'APPROVED' },
    { label: t('operations.dailyLogDetail.actionReject'), target: 'REJECTED' },
  ],
  rejected: [{ label: t('operations.dailyLogDetail.actionResubmit'), target: 'SUBMITTED' }],
});

const DailyLogDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const confirm = useConfirmDialog();
  const queryClient = useQueryClient();

  const { data: apiLog } = useQuery({
    queryKey: ['daily-log', id],
    queryFn: () => operationsApi.getDailyLog(id!),
    enabled: !!id,
    select: (log): DailyLog => ({
      id: log.id,
      number: log.number,
      date: log.logDate,
      status: log.status,
      weather: log.weather,
      temperatureMin: log.temperatureMin,
      temperatureMax: log.temperatureMax,
      windSpeed: '',
      projectName: log.projectName ?? '',
      location: '',
      totalWorkers: log.workersOnSite,
      totalHours: 0,
      authorName: log.supervisorName,
      approvedByName: log.approvedByName ?? null,
      notes: log.issuesNotes ?? '',
      createdAt: log.createdAt,
      updatedAt: log.updatedAt,
    }),
  });

  const { data: apiEntries } = useQuery({
    queryKey: ['daily-log-entries', id],
    queryFn: () => operationsApi.getDailyLogEntries(id!),
    enabled: !!id,
  });

  const logEntries: LogEntry[] = (apiEntries ?? []).map((e) => ({
    id: e.id,
    time: '',
    category: e.workArea,
    description: e.workDescription,
  }));

  const workforce: WorkforceEntry[] = (apiEntries ?? []).map((e) => ({
    trade: e.workArea,
    count: e.workersCount,
    hours: e.hoursWorked,
  }));

  const materials: MaterialReceived[] = [];
  const incidents: Incident[] = [];

  const dl = apiLog ?? emptyDailyLog;
  const [statusOverride, setStatusOverride] = useState<string | null>(null);
  const effectiveStatus = statusOverride ?? dl.status;
  const actions = useMemo(() => getStatusActions()[effectiveStatus] ?? [], [effectiveStatus]);

  const handleStatusChange = (targetStatus: string) => {
    setStatusOverride(targetStatus);
    toast.success(t('operations.dailyLogDetail.statusChanged', { status: dailyLogStatusLabels[targetStatus] ?? targetStatus }));
  };

  const deleteMutation = useMutation({
    mutationFn: () => operationsApi.updateDailyLog(id!, { status: 'REJECTED' as any }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-logs'] });
      toast.success(t('operations.dailyLogDetail.deleteSuccess'));
      navigate('/operations/daily-logs');
    },
  });

  const handleDelete = async () => {
    const isConfirmed = await confirm({
      title: t('operations.dailyLogDetail.deleteTitle'),
      description: t('operations.dailyLogDetail.deleteDescription'),
      confirmLabel: t('operations.dailyLogDetail.deleteConfirm'),
      cancelLabel: t('operations.dailyLogDetail.deleteCancel'),
      items: [dl.number],
    });
    if (!isConfirmed) return;

    deleteMutation.mutate();
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('operations.dailyLogDetail.title', { date: formatDateLong(dl.date) })}
        subtitle={`${dl.number} / ${dl.projectName}`}
        backTo="/operations/daily-logs"
        breadcrumbs={[
          { label: t('operations.dailyLogDetail.breadcrumbHome'), href: '/' },
          { label: t('operations.dailyLogDetail.breadcrumbDailyLogs'), href: '/operations/daily-logs' },
          { label: dl.number },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <StatusBadge status={effectiveStatus} colorMap={dailyLogStatusColorMap} label={dailyLogStatusLabels[effectiveStatus] ?? effectiveStatus} size="md" />
            {actions.map((a) => (
              <Button key={a.target} variant={a.target === 'APPROVED' ? 'success' : a.target === 'REJECTED' ? 'danger' : 'secondary'} size="sm" onClick={() => handleStatusChange(a.target)}>{a.label}</Button>
            ))}
            <Button
              variant="secondary"
              size="sm"
              iconLeft={<Edit size={14} />}
              onClick={() => {
                toast(t('operations.dailyLogDetail.editAvailableInList'));
                navigate('/operations/daily-logs');
              }}
            >
              {t('operations.dailyLogDetail.edit')}
            </Button>
            <Button variant="danger" size="sm" iconLeft={<Trash2 size={14} />} onClick={handleDelete}>{t('operations.dailyLogDetail.delete')}</Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Weather & Summary */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center gap-2">
              <Cloud size={16} className="text-primary-500" />
              {t('operations.dailyLogDetail.weatherAndSummary')}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 text-center">
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">{t('operations.dailyLogDetail.weather')}</p>
                <StatusBadge status={dl.weather} colorMap={weatherColorMap} label={weatherLabels[dl.weather] ?? dl.weather} />
              </div>
              <div className="p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 text-center">
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">{t('operations.dailyLogDetail.temperature')}</p>
                <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{dl.temperatureMin}...{dl.temperatureMax} C</p>
              </div>
              <div className="p-3 bg-primary-50 rounded-lg border border-primary-200 text-center">
                <p className="text-xs text-primary-600 mb-1">{t('operations.dailyLogDetail.workersCount')}</p>
                <p className="text-xl font-bold text-primary-700">{dl.totalWorkers}</p>
              </div>
              <div className="p-3 bg-success-50 rounded-lg border border-success-200 text-center">
                <p className="text-xs text-success-600 mb-1">{t('operations.dailyLogDetail.hoursCount')}</p>
                <p className="text-xl font-bold text-success-700">{dl.totalHours}</p>
              </div>
            </div>
          </div>

          {/* Log entries */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center gap-2">
              <ClipboardList size={16} className="text-primary-500" />
              {t('operations.dailyLogDetail.logEntries', { count: logEntries.length })}
            </h3>
            <div className="space-y-2">
              {logEntries.map((entry) => (
                <div key={entry.id} className="flex items-start gap-3 p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700">
                  <span className="text-xs font-mono font-bold text-primary-600 mt-0.5 flex-shrink-0 w-12">{entry.time}</span>
                  <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mt-0.5 flex-shrink-0 w-20">{entry.category}</span>
                  <p className="text-sm text-neutral-700 dark:text-neutral-300">{entry.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Workforce */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center gap-2">
              <Users size={16} className="text-primary-500" />
              {t('operations.dailyLogDetail.workforce')}
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-200 dark:border-neutral-700">
                    <th className="text-left py-2 pr-4 text-xs font-medium text-neutral-500 dark:text-neutral-400">{t('operations.dailyLogDetail.trade')}</th>
                    <th className="text-right py-2 px-4 text-xs font-medium text-neutral-500 dark:text-neutral-400">{t('operations.dailyLogDetail.people')}</th>
                    <th className="text-right py-2 pl-4 text-xs font-medium text-neutral-500 dark:text-neutral-400">{t('operations.dailyLogDetail.hours')}</th>
                  </tr>
                </thead>
                <tbody>
                  {workforce.map((w) => (
                    <tr key={w.trade} className="border-b border-neutral-100">
                      <td className="py-2.5 pr-4 text-neutral-800 dark:text-neutral-200">{w.trade}</td>
                      <td className="py-2.5 px-4 text-right text-neutral-700 dark:text-neutral-300">{w.count}</td>
                      <td className="py-2.5 pl-4 text-right font-medium text-neutral-900 dark:text-neutral-100">{w.hours}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Materials received */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center gap-2">
              <Package size={16} className="text-primary-500" />
              {t('operations.dailyLogDetail.materialsReceived', { count: materials.length })}
            </h3>
            {materials.length > 0 ? (
              <div className="space-y-2">
                {materials.map((mat, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700">
                    <div>
                      <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{mat.name}</p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">{mat.supplier}</p>
                    </div>
                    <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{formatNumber(mat.quantity)} {mat.unit}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-neutral-500 dark:text-neutral-400">{t('operations.dailyLogDetail.noMaterials')}</p>
            )}
          </div>

          {/* Incidents */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center gap-2">
              <AlertTriangle size={16} className="text-warning-500" />
              {t('operations.dailyLogDetail.incidents', { count: incidents.length })}
            </h3>
            {incidents.length > 0 ? (
              <div className="space-y-2">
                {incidents.map((inc) => (
                  <div key={inc.id} className="p-3 bg-danger-50 rounded-lg border border-danger-200">
                    <p className="text-sm text-danger-800">{inc.description}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 bg-success-50 rounded-lg border border-success-200 text-center">
                <p className="text-sm text-success-700">{t('operations.dailyLogDetail.noIncidents')}</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">{t('operations.dailyLogDetail.details')}</h3>
            <div className="space-y-4">
              <InfoItem icon={<CalendarDays size={15} />} label={t('operations.dailyLogDetail.date')} value={formatDateLong(dl.date)} />
              <InfoItem icon={<User size={15} />} label={t('operations.dailyLogDetail.author')} value={dl.authorName} />
              <InfoItem icon={<User size={15} />} label={t('operations.dailyLogDetail.approvedBy')} value={dl.approvedByName ?? t('operations.dailyLogDetail.awaitingApproval')} />
              <InfoItem icon={<Clock size={15} />} label={t('operations.dailyLogDetail.created')} value={formatDateLong(dl.createdAt)} />
            </div>
          </div>

          {dl.notes && (
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-3">{t('operations.dailyLogDetail.notes')}</h3>
              <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">{dl.notes}</p>
            </div>
          )}
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

export default DailyLogDetailPage;
