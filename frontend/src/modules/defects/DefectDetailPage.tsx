import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Edit, Trash2, Clock, MapPin, Camera, ArrowRight, RotateCcw, Timer, Building2 } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { useConfirmDialog } from '@/design-system/components/ConfirmDialog/provider';
import { defectsApi, type DefectStatus } from '@/api/defects';
import { formatDate, formatDateTime } from '@/lib/format';
import { t } from '@/i18n';
import toast from 'react-hot-toast';

const severityColorMap: Record<string, 'gray' | 'yellow' | 'red'> = {
  LOW: 'gray', MEDIUM: 'yellow', HIGH: 'red', CRITICAL: 'red',
};
const statusColorMap: Record<string, 'yellow' | 'blue' | 'green' | 'gray' | 'red'> = {
  OPEN: 'yellow', IN_PROGRESS: 'blue', FIXED: 'green', VERIFIED: 'green', CLOSED: 'gray', REJECTED: 'red',
};
const getSeverityLabels = (): Record<string, string> => ({
  LOW: t('defects.severityLow'), MEDIUM: t('defects.severityMedium'), HIGH: t('defects.severityHigh'), CRITICAL: t('defects.severityCritical'),
});
const getStatusLabels = (): Record<string, string> => ({
  OPEN: t('defects.statusOpen'), IN_PROGRESS: t('defects.statusInProgress'), FIXED: t('defects.statusFixed'),
  VERIFIED: t('defects.statusVerified'), CLOSED: t('defects.statusClosed'), REJECTED: t('defects.statusRejected'),
});

const TRANSITIONS: Record<string, DefectStatus[]> = {
  OPEN: ['IN_PROGRESS', 'REJECTED'],
  IN_PROGRESS: ['FIXED', 'OPEN'],
  FIXED: ['VERIFIED', 'IN_PROGRESS'],
  VERIFIED: ['CLOSED'],
};

function deadlineInfo(deadline?: string): { text: string; urgent: boolean } | null {
  if (!deadline) return null;
  const diff = Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return { text: t('defects.overdue', { days: String(Math.abs(diff)) }), urgent: true };
  if (diff === 0) return { text: t('defects.dueToday'), urgent: true };
  if (diff <= 3) return { text: t('defects.dueSoon', { days: String(diff) }), urgent: true };
  return { text: formatDate(deadline), urgent: false };
}

function slaInfo(assignedAt?: string, slaHours?: number): { elapsed: number; remaining: number; percent: number; overdue: boolean } | null {
  if (!assignedAt || !slaHours) return null;
  const elapsed = (Date.now() - new Date(assignedAt).getTime()) / (1000 * 60 * 60);
  const remaining = slaHours - elapsed;
  const percent = Math.min(100, (elapsed / slaHours) * 100);
  return { elapsed: Math.round(elapsed), remaining: Math.round(remaining), percent, overdue: remaining <= 0 };
}

const DefectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const confirm = useConfirmDialog();

  const { data: defect, isLoading } = useQuery({
    queryKey: ['defect', id],
    queryFn: () => defectsApi.getDefect(id!),
    enabled: !!id,
  });

  const transitionMutation = useMutation({
    mutationFn: ({ status, fixDescription }: { status: DefectStatus; fixDescription?: string }) =>
      defectsApi.transitionStatus(id!, status, fixDescription),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['defect', id] });
      queryClient.invalidateQueries({ queryKey: ['defects'] });
      toast.success(t('defects.toastStatusChanged'));
    },
    onError: () => toast.error(t('defects.toastTransitionError')),
  });

  const deleteMutation = useMutation({
    mutationFn: () => defectsApi.deleteDefect(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['defects'] });
      toast.success(t('defects.toastDeleted'));
      navigate('/defects');
    },
    onError: () => toast.error(t('defects.toastDeleteError')),
  });

  const handleTransition = async (newStatus: DefectStatus) => {
    let fixDescription: string | undefined;
    if (newStatus === 'FIXED') {
      fixDescription = window.prompt(t('defects.promptFixDescription')) ?? undefined;
    }
    transitionMutation.mutate({ status: newStatus, fixDescription });
  };

  const handleDelete = async () => {
    const ok = await confirm({
      title: t('defects.confirmDeleteTitle', { count: '1' }),
      description: t('defects.confirmDeleteDescription'),
      confirmLabel: t('defects.confirmDeleteBtn'),
      cancelLabel: t('common.cancel'),
    });
    if (ok) deleteMutation.mutate();
  };

  if (isLoading || !defect) {
    return <div className="animate-pulse p-8 space-y-4"><div className="h-8 bg-neutral-200 dark:bg-neutral-700 rounded w-1/3" /><div className="h-40 bg-neutral-200 dark:bg-neutral-700 rounded" /></div>;
  }

  const severityLabels = getSeverityLabels();
  const statusLabels = getStatusLabels();
  const photos: string[] = defect.photoUrls ? (() => { try { return JSON.parse(defect.photoUrls); } catch { return []; } })() : [];
  const deadlineInf = deadlineInfo(defect.fixDeadline);
  const availableTransitions = TRANSITIONS[defect.status] ?? [];
  const sla = slaInfo(defect.assignedAt, defect.slaDeadlineHours);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={defect.code}
        subtitle={defect.title}
        backTo="/defects"
        breadcrumbs={[
          { label: t('common.home'), href: '/' },
          { label: t('quality.list.breadcrumbQuality'), href: '/quality' },
          { label: t('defects.breadcrumb'), href: '/defects' },
          { label: defect.code },
        ]}
        actions={
          <div className="flex gap-2">
            <Button variant="secondary" iconLeft={<Edit size={16} />} onClick={() => navigate(`/defects/${id}/edit`)}>
              {t('common.edit')}
            </Button>
            <Button variant="danger" iconLeft={<Trash2 size={16} />} onClick={handleDelete}>
              {t('common.delete')}
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Info card */}
          <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <div className="flex items-center gap-3 flex-wrap mb-4">
              <StatusBadge status={defect.severity} colorMap={severityColorMap} label={severityLabels[defect.severity]} />
              <StatusBadge status={defect.status} colorMap={statusColorMap} label={statusLabels[defect.status]} />
              {deadlineInf && (
                <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${deadlineInf.urgent ? 'bg-danger-50 text-danger-700 dark:bg-danger-900/30 dark:text-danger-400' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'}`}>
                  <Clock size={12} />
                  {deadlineInf.text}
                </span>
              )}
              {defect.reinspectionCount > 0 && (
                <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                  <RotateCcw size={12} />
                  {t('defects.reinspectionCount', { count: String(defect.reinspectionCount) })}
                </span>
              )}
            </div>

            <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-3">{defect.title}</h2>

            {defect.description && (
              <p className="text-sm text-neutral-600 dark:text-neutral-400 whitespace-pre-wrap mb-4">{defect.description}</p>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
              {defect.location && (
                <div>
                  <span className="text-neutral-500 dark:text-neutral-400 text-xs">{t('defects.fieldLocation')}</span>
                  <p className="font-medium text-neutral-900 dark:text-neutral-100 flex items-center gap-1"><MapPin size={12} />{defect.location}</p>
                </div>
              )}
              {defect.fixDeadline && (
                <div>
                  <span className="text-neutral-500 dark:text-neutral-400 text-xs">{t('defects.fieldDeadline')}</span>
                  <p className="font-medium text-neutral-900 dark:text-neutral-100">{formatDate(defect.fixDeadline)}</p>
                </div>
              )}
              {defect.fixedAt && (
                <div>
                  <span className="text-neutral-500 dark:text-neutral-400 text-xs">{t('defects.fieldFixedAt')}</span>
                  <p className="font-medium text-neutral-900 dark:text-neutral-100">{formatDateTime(defect.fixedAt)}</p>
                </div>
              )}
            </div>

            {defect.fixDescription && (
              <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <span className="text-xs font-medium text-green-700 dark:text-green-400">{t('defects.fieldFixDescription')}</span>
                <p className="text-sm text-green-800 dark:text-green-300 mt-1">{defect.fixDescription}</p>
              </div>
            )}
          </section>

          {/* SLA Timer */}
          {sla && defect.status !== 'CLOSED' && defect.status !== 'REJECTED' && (
            <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
              <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center gap-2">
                <Timer size={16} />
                {t('defects.slaTimer')}
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-500 dark:text-neutral-400">
                    {t('defects.slaElapsed')}: {sla.elapsed} {t('defects.slaHours')}
                  </span>
                  <span className={`font-medium ${sla.overdue ? 'text-danger-600 dark:text-danger-400' : 'text-neutral-700 dark:text-neutral-300'}`}>
                    {sla.overdue
                      ? t('defects.slaOverdue', { hours: String(Math.abs(sla.remaining)) })
                      : t('defects.slaRemaining', { hours: String(sla.remaining) })}
                  </span>
                </div>
                <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-2.5">
                  <div
                    className={`h-2.5 rounded-full transition-all ${
                      sla.overdue ? 'bg-danger-500' : sla.percent > 75 ? 'bg-amber-500' : 'bg-primary-500'
                    }`}
                    style={{ width: `${Math.min(100, sla.percent)}%` }}
                  />
                </div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  SLA: {defect.slaDeadlineHours} {t('defects.slaHours')} {t('defects.slaFromAssignment')}
                </p>
              </div>
            </section>
          )}

          {/* Photos */}
          {photos.length > 0 && (
            <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
              <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center gap-2">
                <Camera size={16} />
                {t('defects.sectionPhotos')} ({photos.length})
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {photos.map((url, i) => (
                  <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="block aspect-square rounded-lg overflow-hidden border border-neutral-200 dark:border-neutral-700 hover:border-primary-400 transition-colors">
                    <img src={url} alt={`${t('defects.photoAlt')} ${i + 1}`} className="w-full h-full object-cover" />
                  </a>
                ))}
              </div>
            </section>
          )}

          {/* Status transitions */}
          {availableTransitions.length > 0 && (
            <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
              <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-4">{t('defects.sectionActions')}</h3>
              <div className="flex flex-wrap gap-2">
                {availableTransitions.map(status => (
                  <Button
                    key={status}
                    variant="secondary"
                    size="sm"
                    iconLeft={<ArrowRight size={14} />}
                    onClick={() => handleTransition(status)}
                    loading={transitionMutation.isPending}
                  >
                    {statusLabels[status]}
                  </Button>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">{t('defects.sectionDetails')}</h3>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-neutral-500 dark:text-neutral-400 text-xs">{t('defects.fieldCode')}</dt>
                <dd className="font-mono text-neutral-900 dark:text-neutral-100">{defect.code}</dd>
              </div>
              <div>
                <dt className="text-neutral-500 dark:text-neutral-400 text-xs">{t('defects.fieldSeverity')}</dt>
                <dd><StatusBadge status={defect.severity} colorMap={severityColorMap} label={severityLabels[defect.severity]} /></dd>
              </div>
              <div>
                <dt className="text-neutral-500 dark:text-neutral-400 text-xs">{t('defects.fieldStatus')}</dt>
                <dd><StatusBadge status={defect.status} colorMap={statusColorMap} label={statusLabels[defect.status]} /></dd>
              </div>
              {defect.contractorId && (
                <div>
                  <dt className="text-neutral-500 dark:text-neutral-400 text-xs">{t('defects.fieldContractor')}</dt>
                  <dd className="text-neutral-900 dark:text-neutral-100 flex items-center gap-1"><Building2 size={12} />{defect.contractorId}</dd>
                </div>
              )}
              {defect.reinspectionCount > 0 && (
                <div>
                  <dt className="text-neutral-500 dark:text-neutral-400 text-xs">{t('defects.fieldReinspections')}</dt>
                  <dd className="text-amber-600 dark:text-amber-400 font-medium">{defect.reinspectionCount}</dd>
                </div>
              )}
              <div>
                <dt className="text-neutral-500 dark:text-neutral-400 text-xs">{t('defects.fieldCreated')}</dt>
                <dd className="text-neutral-900 dark:text-neutral-100">{formatDateTime(defect.createdAt)}</dd>
              </div>
              {defect.createdBy && (
                <div>
                  <dt className="text-neutral-500 dark:text-neutral-400 text-xs">{t('defects.fieldCreatedBy')}</dt>
                  <dd className="text-neutral-900 dark:text-neutral-100">{defect.createdBy}</dd>
                </div>
              )}
              <div>
                <dt className="text-neutral-500 dark:text-neutral-400 text-xs">{t('defects.fieldPhotos')}</dt>
                <dd className="text-neutral-900 dark:text-neutral-100">{photos.length}</dd>
              </div>
            </dl>
          </section>
        </div>
      </div>
    </div>
  );
};

export default DefectDetailPage;
