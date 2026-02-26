import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ClipboardCheck,
  User,
  Calendar,
  MapPin,
  Star,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Camera,
} from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { safetyApi } from '@/api/safety';
import { formatDateLong } from '@/lib/format';
import { t } from '@/i18n';
import type { SafetyInspection } from './types';

const statusColorMap: Record<string, 'gray' | 'blue' | 'green' | 'yellow' | 'red'> = {
  scheduled: 'blue', in_progress: 'yellow', completed: 'green', failed: 'red', cancelled: 'gray',
};
const getStatusLabels = (): Record<string, string> => ({
  scheduled: t('safety.inspectionDetail.statusScheduled'), in_progress: t('safety.inspectionDetail.statusInProgress'), completed: t('safety.inspectionDetail.statusCompleted'), failed: t('safety.inspectionDetail.statusFailed'), cancelled: t('safety.inspectionDetail.statusCancelled'),
});
const ratingColorMap: Record<string, 'green' | 'yellow' | 'orange' | 'red'> = {
  satisfactory: 'green', needs_improvement: 'yellow', unsatisfactory: 'orange', critical: 'red',
};
const getRatingLabels = (): Record<string, string> => ({
  satisfactory: t('safety.inspectionDetail.ratingSatisfactory'), needs_improvement: t('safety.inspectionDetail.ratingNeedsImprovement'), unsatisfactory: t('safety.inspectionDetail.ratingUnsatisfactory'), critical: t('safety.inspectionDetail.ratingCritical'),
});
const getTypeLabels = (): Record<string, string> => ({
  routine: t('safety.inspectionDetail.typeRoutine'), unscheduled: t('safety.inspectionDetail.typeUnscheduled'), follow_up: t('safety.inspectionDetail.typeFollowUp'), pre_work: t('safety.inspectionDetail.typePreWork'), regulatory: t('safety.inspectionDetail.typeRegulatory'),
});

const severityColor: Record<string, string> = {
  low: 'text-neutral-600 bg-neutral-100 dark:bg-neutral-800', medium: 'text-warning-700 bg-warning-100',
  high: 'text-orange-700 bg-orange-100', critical: 'text-danger-700 bg-danger-100',
};
const getSeverityLabels = (): Record<string, string> => ({
  low: t('safety.inspectionDetail.severityLow'), medium: t('safety.inspectionDetail.severityMedium'), high: t('safety.inspectionDetail.severityHigh'), critical: t('safety.inspectionDetail.severityCritical'),
});
const getFindingStatusLabels = (): Record<string, string> => ({
  open: t('safety.inspectionDetail.findingStatusOpen'), in_progress: t('safety.inspectionDetail.findingStatusInProgress'), resolved: t('safety.inspectionDetail.findingStatusResolved'),
});

const SafetyInspectionDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: inspection } = useQuery({
    queryKey: ['safety-inspection', id],
    queryFn: () => safetyApi.getInspection(id!),
    enabled: !!id,
  });

  const insp = inspection;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={`${t('safety.inspectionDetail.titlePrefix')} ${insp?.number ?? ''}`}
        subtitle={`${insp?.projectName ?? ''} / ${insp?.location ?? ''}`}
        backTo="/safety/inspections"
        breadcrumbs={[
          { label: t('safety.inspectionDetail.breadcrumbHome'), href: '/' },
          { label: t('safety.inspectionDetail.breadcrumbInspections'), href: '/safety/inspections' },
          { label: insp?.number ?? '' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            {insp?.status && <StatusBadge status={insp.status} colorMap={statusColorMap} label={getStatusLabels()[insp.status] ?? insp.status} size="md" />}
            {insp?.rating && <StatusBadge status={insp.rating} colorMap={ratingColorMap} label={getRatingLabels()[insp.rating] ?? insp.rating} size="md" />}
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Score card */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                <Star size={16} className="text-primary-500" /> {t('safety.inspectionDetail.sectionResult')}
              </h3>
              <div className={`text-3xl font-bold tabular-nums ${(insp?.score ?? 0) >= 80 ? 'text-success-600' : (insp?.score ?? 0) >= 60 ? 'text-warning-600' : 'text-danger-600'}`}>
                {insp?.score ?? 0}/100
              </div>
            </div>
            <div className="w-full h-3 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${(insp?.score ?? 0) >= 80 ? 'bg-success-500' : (insp?.score ?? 0) >= 60 ? 'bg-warning-500' : 'bg-danger-500'}`}
                style={{ width: `${insp?.score ?? 0}%` }}
              />
            </div>
            <div className="grid grid-cols-3 gap-4 mt-4">
              <div className="text-center">
                <p className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">{insp?.findingsCount}</p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('safety.inspectionDetail.statFindings')}</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-semibold text-danger-600">{insp?.violationCount}</p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('safety.inspectionDetail.statViolations')}</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-semibold text-success-600">{(insp?.findingsCount ?? 0) - (insp?.violationCount ?? 0)}</p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('safety.inspectionDetail.statRecommendations')}</p>
              </div>
            </div>
          </div>

          {/* Findings list */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center gap-2">
              <AlertTriangle size={16} className="text-warning-500" />
              {t('safety.inspectionDetail.sectionFindings')} ({(insp as any)?.findings?.length ?? 0})
            </h3>
            <div className="space-y-3">
              {(insp as any)?.findings?.map((f: any, idx: number) => (
                <div key={f.id} className="flex items-start gap-3 p-3 rounded-lg border border-neutral-100">
                  <span className="text-xs font-mono text-neutral-400 mt-0.5 w-5">{idx + 1}.</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-neutral-800 dark:text-neutral-200">{f.description}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${severityColor[f.severity]}`}>
                        {getSeverityLabels()[f.severity]}
                      </span>
                      <span className="text-xs text-neutral-500 dark:text-neutral-400">{getFindingStatusLabels()[f.status]}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          {insp?.notes && (
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center gap-2">
                <FileText size={16} className="text-primary-500" /> {t('safety.inspectionDetail.sectionNotes')}
              </h3>
              <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed whitespace-pre-wrap">{insp.notes}</p>
            </div>
          )}

          {/* Corrective actions */}
          {insp?.correctiveActions && (
            <div className="bg-warning-50 rounded-xl border border-warning-200 p-6">
              <h3 className="text-sm font-semibold text-warning-800 mb-4 flex items-center gap-2">
                <CheckCircle2 size={16} className="text-warning-600" /> {t('safety.inspectionDetail.sectionCorrectiveActions')}
              </h3>
              <p className="text-sm text-warning-900 leading-relaxed whitespace-pre-wrap">{insp.correctiveActions}</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">{t('safety.inspectionDetail.sidebarDetails')}</h3>
            <div className="space-y-4">
              <InfoItem icon={<Calendar size={15} />} label={t('safety.inspectionDetail.labelInspectionDate')} value={formatDateLong(insp?.inspectionDate ?? '')} />
              <InfoItem icon={<User size={15} />} label={t('safety.inspectionDetail.labelInspector')} value={insp?.inspectorName ?? ''} />
              <InfoItem icon={<ClipboardCheck size={15} />} label={t('safety.inspectionDetail.labelType')} value={insp?.inspectionType ? (getTypeLabels()[insp.inspectionType] ?? insp.inspectionType) : ''} />
              <InfoItem icon={<MapPin size={15} />} label={t('safety.inspectionDetail.labelLocation')} value={insp?.location ?? ''} />
              <InfoItem icon={<FileText size={15} />} label={t('safety.inspectionDetail.labelProject')} value={insp?.projectName ?? ''} />
              {insp?.nextInspectionDate && (
                <InfoItem icon={<Calendar size={15} />} label={t('safety.inspectionDetail.labelNextInspection')} value={formatDateLong(insp.nextInspectionDate)} />
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center gap-2">
              <Camera size={15} /> {t('safety.inspectionDetail.sectionPhotos')}
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="aspect-square rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-400">
                  <Camera size={20} />
                </div>
              ))}
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2 text-center">{t('safety.inspectionDetail.photosCount')}</p>
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

export default SafetyInspectionDetailPage;
