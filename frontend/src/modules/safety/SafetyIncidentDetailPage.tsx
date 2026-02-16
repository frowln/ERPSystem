import React, { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Shield,
  User,
  Calendar,
  MapPin,
  Clock,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Search as SearchIcon,
  Activity,
} from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { safetyApi } from '@/api/safety';
import { formatDateLong, formatRelativeTime } from '@/lib/format';
import { t } from '@/i18n';
import type { SafetyIncident } from './types';
import toast from 'react-hot-toast';

const statusColorMap: Record<string, 'gray' | 'blue' | 'green' | 'yellow' | 'red' | 'orange'> = {
  reported: 'blue', under_investigation: 'yellow', corrective_action: 'orange', resolved: 'green', closed: 'gray',
};
const getStatusLabels = (): Record<string, string> => ({
  reported: t('safety.incidentDetail.statusReported'), under_investigation: t('safety.incidentDetail.statusUnderInvestigation'), corrective_action: t('safety.incidentDetail.statusCorrectiveAction'), resolved: t('safety.incidentDetail.statusResolved'), closed: t('safety.incidentDetail.statusClosed'),
});
const severityColorMap: Record<string, 'gray' | 'blue' | 'yellow' | 'orange' | 'red'> = {
  minor: 'gray', moderate: 'blue', serious: 'yellow', critical: 'orange', fatal: 'red',
};
const getSeverityLabels = (): Record<string, string> => ({
  minor: t('safety.incidentDetail.severityMinor'), moderate: t('safety.incidentDetail.severityModerate'), serious: t('safety.incidentDetail.severitySerious'), critical: t('safety.incidentDetail.severityCritical'), fatal: t('safety.incidentDetail.severityFatal'),
});
const getTypeLabels = (): Record<string, string> => ({
  fall: t('safety.incidentDetail.typeFall'), struck_by: t('safety.incidentDetail.typeStruckBy'), caught_in: t('safety.incidentDetail.typeCaughtIn'), electrocution: t('safety.incidentDetail.typeElectrocution'),
  collapse: t('safety.incidentDetail.typeCollapse'), fire: t('safety.incidentDetail.typeFire'), chemical: t('safety.incidentDetail.typeChemical'), equipment: t('safety.incidentDetail.typeEquipment'), other: t('safety.incidentDetail.typeOther'),
});

const timelineColor: Record<string, string> = {
  incident: 'bg-danger-500', action: 'bg-warning-500', system: 'bg-neutral-400', investigation: 'bg-primary-500',
};

const SafetyIncidentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: incident } = useQuery({
    queryKey: ['safety-incident', id],
    queryFn: () => safetyApi.getIncident(id!),
    enabled: !!id,
  });

  const inc = incident;
  const [statusOverride, setStatusOverride] = useState<SafetyIncident['status'] | null>(null);
  const effectiveStatus: SafetyIncident['status'] = statusOverride ?? inc?.status ?? 'REPORTED';

  const statusActions = useMemo<Array<{ label: string; targetStatus: SafetyIncident['status'] }>>(() => {
    switch (effectiveStatus) {
      case 'REPORTED': return [{ label: t('safety.incidentDetail.actionStartInvestigation'), targetStatus: 'UNDER_INVESTIGATION' as const }];
      case 'UNDER_INVESTIGATION': return [{ label: t('safety.incidentDetail.actionAssignMeasures'), targetStatus: 'CORRECTIVE_ACTION' as const }];
      case 'CORRECTIVE_ACTION': return [{ label: t('safety.incidentDetail.actionMarkResolved'), targetStatus: 'RESOLVED' as const }];
      case 'RESOLVED': return [{ label: t('safety.incidentDetail.actionClose'), targetStatus: 'CLOSED' as const }];
      default: return [];
    }
  }, [effectiveStatus]);

  const handleStatusChange = (targetStatus: SafetyIncident['status']) => {
    setStatusOverride(targetStatus);
    toast.success(`${t('safety.incidentDetail.toastStatusChanged')}: ${getStatusLabels()[targetStatus] ?? targetStatus}`);
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={`${t('safety.incidentDetail.titlePrefix')} ${inc?.number ?? ''}`}
        subtitle={`${inc?.projectName ?? ''} / ${inc?.location ?? ''}`}
        backTo="/safety/incidents"
        breadcrumbs={[
          { label: t('safety.incidentDetail.breadcrumbHome'), href: '/' },
          { label: t('safety.incidentDetail.breadcrumbIncidents'), href: '/safety/incidents' },
          { label: inc?.number ?? '' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            {inc?.severity && <StatusBadge status={inc.severity} colorMap={severityColorMap} label={getSeverityLabels()[inc.severity] ?? inc.severity} size="md" />}
            <StatusBadge status={effectiveStatus} colorMap={statusColorMap} label={getStatusLabels()[effectiveStatus] ?? effectiveStatus} size="md" />
            {statusActions.map((a) => (
              <Button key={a.targetStatus} variant="secondary" size="sm" onClick={() => handleStatusChange(a.targetStatus)}>
                {a.label}
              </Button>
            ))}
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center gap-2">
              <FileText size={16} className="text-primary-500" /> {t('safety.incidentDetail.sectionDescription')}
            </h3>
            <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed whitespace-pre-wrap">{inc?.description}</p>
          </div>

          {/* Key stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4 text-center">
              <p className={`text-2xl font-bold ${(inc?.injuredPersons ?? 0) > 0 ? 'text-danger-600' : 'text-success-600'}`}>{inc?.injuredPersons}</p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">{t('safety.incidentDetail.statInjured')}</p>
            </div>
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4 text-center">
              <p className="text-2xl font-bold text-warning-600">{inc?.workDaysLost}</p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">{t('safety.incidentDetail.statDaysLost')}</p>
            </div>
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4 text-center">
              <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{inc?.incidentType ? getTypeLabels()[inc.incidentType] : ''}</p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">{t('safety.incidentDetail.statIncidentType')}</p>
            </div>
          </div>

          {/* Root cause */}
          {inc?.rootCause && (
            <div className="bg-orange-50 rounded-xl border border-orange-200 p-6">
              <h3 className="text-sm font-semibold text-orange-800 mb-4 flex items-center gap-2">
                <SearchIcon size={16} className="text-orange-600" /> {t('safety.incidentDetail.sectionRootCause')}
              </h3>
              <p className="text-sm text-orange-900 leading-relaxed whitespace-pre-wrap">{inc.rootCause}</p>
            </div>
          )}

          {/* Corrective actions */}
          {inc?.correctiveActions && (
            <div className="bg-success-50 rounded-xl border border-success-200 p-6">
              <h3 className="text-sm font-semibold text-success-800 mb-4 flex items-center gap-2">
                <CheckCircle2 size={16} className="text-success-600" /> {t('safety.incidentDetail.sectionCorrectiveActions')}
              </h3>
              <p className="text-sm text-success-900 leading-relaxed whitespace-pre-wrap">{inc.correctiveActions}</p>
            </div>
          )}

          {/* Timeline */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center gap-2">
              <Activity size={16} className="text-primary-500" /> {t('safety.incidentDetail.sectionTimeline')}
            </h3>
            <div className="relative">
              <div className="absolute left-3 top-0 bottom-0 w-px bg-neutral-200" />
              <div className="space-y-4">
                {/* TODO: replace with real API call */}
                {(inc as any)?.timeline?.map((evt: any, idx: number) => (
                  <div key={idx} className="flex items-start gap-4 relative">
                    <div className={`w-6 h-6 rounded-full ${timelineColor[evt.type]} flex items-center justify-center flex-shrink-0 z-10`}>
                      <div className="w-2 h-2 rounded-full bg-white dark:bg-neutral-900" />
                    </div>
                    <div className="flex-1 pb-2">
                      <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">{evt.event}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-neutral-500 dark:text-neutral-400">{evt.author}</span>
                        <span className="text-xs text-neutral-400">{formatRelativeTime(evt.date)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">{t('safety.incidentDetail.sidebarDetails')}</h3>
            <div className="space-y-4">
              <InfoItem icon={<Calendar size={15} />} label={t('safety.incidentDetail.labelIncidentDate')} value={`${formatDateLong(inc?.incidentDate ?? '')}${inc?.incidentTime ? ` ${t('safety.incidentDetail.labelAtTime')} ${inc.incidentTime}` : ''}`} />
              <InfoItem icon={<MapPin size={15} />} label={t('safety.incidentDetail.labelLocation')} value={inc?.location ?? ''} />
              <InfoItem icon={<FileText size={15} />} label={t('safety.incidentDetail.labelProject')} value={inc?.projectName ?? ''} />
              <InfoItem icon={<Shield size={15} />} label={t('safety.incidentDetail.labelType')} value={inc?.incidentType ? (getTypeLabels()[inc.incidentType] ?? inc.incidentType) : ''} />
              <InfoItem icon={<User size={15} />} label={t('safety.incidentDetail.labelReportedBy')} value={inc?.reportedByName ?? ''} />
              {inc?.investigatorName && (
                <InfoItem icon={<User size={15} />} label={t('safety.incidentDetail.labelInvestigator')} value={inc.investigatorName} />
              )}
              <InfoItem icon={<Clock size={15} />} label={t('safety.incidentDetail.labelUpdated')} value={formatRelativeTime(inc?.updatedAt ?? '')} />
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">{t('safety.incidentDetail.sidebarActions')}</h3>
            <div className="space-y-2">
              <Button
                variant="secondary"
                className="w-full justify-start"
                size="sm"
                onClick={() => toast.success(t('safety.incidentDetail.toastActGenerated'))}
              >
                <FileText size={14} className="mr-2" /> {t('safety.incidentDetail.actionGenerateAct')}
              </Button>
              <Button
                variant="secondary"
                className="w-full justify-start"
                size="sm"
                onClick={() => toast.success(t('safety.incidentDetail.toastManagementNotified'))}
              >
                <AlertTriangle size={14} className="mr-2" /> {t('safety.incidentDetail.actionNotifyManagement')}
              </Button>
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

export default SafetyIncidentDetailPage;
