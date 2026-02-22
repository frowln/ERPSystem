import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  GraduationCap,
  User,
  Calendar,
  Clock,
  FileText,
  Users,
  CheckCircle2,
  XCircle,
  Pencil,
  Trash2,
  CalendarClock,
  BookOpen,
} from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { ConfirmDialog } from '@/design-system/components/ConfirmDialog';
import { safetyApi, type SafetyTraining, type TrainingStatus } from '@/api/safety';
import { formatDateLong, formatRelativeTime } from '@/lib/format';
import { t } from '@/i18n';
import { AuditFooter } from '@/design-system/components/AuditFooter';
import toast from 'react-hot-toast';

const statusColorMap: Record<string, 'gray' | 'blue' | 'green' | 'yellow' | 'red' | 'orange'> = {
  PLANNED: 'blue',
  IN_PROGRESS: 'yellow',
  COMPLETED: 'green',
  CANCELLED: 'gray',
};

const getStatusLabels = (): Record<string, string> => ({
  PLANNED: t('safety.training.statusPlanned'),
  IN_PROGRESS: t('safety.training.statusInProgress'),
  COMPLETED: t('safety.training.statusCompleted'),
  CANCELLED: t('safety.training.statusCancelled'),
});

const typeColorMap: Record<string, 'blue' | 'green' | 'yellow' | 'orange' | 'red'> = {
  INITIAL: 'blue',
  PRIMARY: 'green',
  PERIODIC: 'yellow',
  UNSCHEDULED: 'orange',
  SPECIAL: 'red',
};

const getTypeLabels = (): Record<string, string> => ({
  INITIAL: t('safety.training.typeInitial'),
  PRIMARY: t('safety.training.typePrimary'),
  PERIODIC: t('safety.training.typePeriodic'),
  UNSCHEDULED: t('safety.training.typeUnscheduled'),
  SPECIAL: t('safety.training.typeSpecial'),
});

const SafetyTrainingDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);

  const { data: training } = useQuery<SafetyTraining>({
    queryKey: ['safety-training', id],
    queryFn: () => safetyApi.getTraining(id!),
    enabled: !!id,
  });

  const completeMutation = useMutation({
    mutationFn: () => safetyApi.completeTraining(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['safety-training', id] });
      queryClient.invalidateQueries({ queryKey: ['safety-trainings'] });
      toast.success(t('safety.training.detail.toastCompleted'));
    },
    onError: () => toast.error(t('safety.training.detail.toastCompleteError')),
  });

  const cancelMutation = useMutation({
    mutationFn: () => safetyApi.cancelTraining(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['safety-training', id] });
      queryClient.invalidateQueries({ queryKey: ['safety-trainings'] });
      toast.success(t('safety.training.detail.toastCancelled'));
    },
    onError: () => toast.error(t('safety.training.detail.toastCancelError')),
  });

  const deleteMutation = useMutation({
    mutationFn: () => safetyApi.deleteTraining(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['safety-trainings'] });
      toast.success(t('safety.training.detail.toastDeleted'));
      navigate('/safety/trainings');
    },
    onError: () => toast.error(t('safety.training.detail.toastDeleteError')),
  });

  const participants = useMemo(() => {
    if (!training?.participants) return [];
    try {
      const parsed = JSON.parse(training.participants);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return training.participants.split('\n').filter(Boolean).map((name: string) => ({ name: name.trim() }));
    }
  }, [training?.participants]);

  const canComplete = training?.status === 'PLANNED' || training?.status === 'IN_PROGRESS';
  const canCancel = training?.status !== 'COMPLETED' && training?.status !== 'CANCELLED';
  const canEdit = training?.status !== 'COMPLETED' && training?.status !== 'CANCELLED';

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={training?.title ?? ''}
        subtitle={training ? `${training.trainingTypeDisplayName} — ${formatDateLong(training.date)}` : ''}
        backTo="/safety/trainings"
        breadcrumbs={[
          { label: t('common.home'), href: '/' },
          { label: t('safety.title'), href: '/safety' },
          { label: t('safety.training.breadcrumbTrainings'), href: '/safety/trainings' },
          { label: training?.title ?? '' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            {training && (
              <StatusBadge
                status={training.status}
                colorMap={statusColorMap}
                label={getStatusLabels()[training.status] ?? training.status}
                size="md"
              />
            )}
            {training && (
              <StatusBadge
                status={training.trainingType}
                colorMap={typeColorMap}
                label={getTypeLabels()[training.trainingType] ?? training.trainingType}
                size="md"
              />
            )}
            {canComplete && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => completeMutation.mutate()}
                loading={completeMutation.isPending}
              >
                <CheckCircle2 size={14} className="mr-1.5" />
                {t('safety.training.detail.actionComplete')}
              </Button>
            )}
            {canCancel && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => cancelMutation.mutate()}
                loading={cancelMutation.isPending}
              >
                <XCircle size={14} className="mr-1.5" />
                {t('safety.training.detail.actionCancel')}
              </Button>
            )}
            {canEdit && (
              <Button variant="secondary" size="sm" onClick={() => navigate(`/safety/trainings/${id}/edit`)}>
                <Pencil size={14} className="mr-1.5" />
                {t('common.edit')}
              </Button>
            )}
            <Button variant="danger" size="sm" onClick={() => setShowDeleteDialog(true)}>
              <Trash2 size={14} className="mr-1.5" />
              {t('common.delete')}
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Topics */}
          {training?.topics && (
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center gap-2">
                <BookOpen size={16} className="text-primary-500" />
                {t('safety.training.detail.sectionTopics')}
              </h3>
              <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed whitespace-pre-wrap">
                {training.topics}
              </p>
            </div>
          )}

          {/* Participants */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center gap-2">
              <Users size={16} className="text-primary-500" />
              {t('safety.training.detail.sectionParticipants')}
              <span className="ml-auto text-xs font-normal text-neutral-500 dark:text-neutral-400">
                {training?.participantCount ?? 0} {t('safety.training.detail.participantsUnit')}
              </span>
            </h3>
            {participants.length > 0 ? (
              <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {participants.map((p: { name?: string; position?: string } | string, idx: number) => {
                  const name = typeof p === 'string' ? p : p.name ?? '';
                  const position = typeof p === 'string' ? '' : p.position ?? '';
                  return (
                    <div key={idx} className="flex items-center gap-3 py-2.5">
                      <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-xs font-medium text-primary-700 dark:text-primary-300">
                        {name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{name}</p>
                        {position && (
                          <p className="text-xs text-neutral-500 dark:text-neutral-400">{position}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-neutral-500 dark:text-neutral-400">{t('safety.training.detail.noParticipants')}</p>
            )}
          </div>

          {/* Notes */}
          {training?.notes && (
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center gap-2">
                <FileText size={16} className="text-primary-500" />
                {t('common.notes')}
              </h3>
              <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed whitespace-pre-wrap">
                {training.notes}
              </p>
            </div>
          )}

          {/* Completion info */}
          {training?.status === 'COMPLETED' && training.completedAt && (
            <div className="bg-success-50 dark:bg-success-900/20 rounded-xl border border-success-200 dark:border-success-800 p-6">
              <h3 className="text-sm font-semibold text-success-800 dark:text-success-300 mb-2 flex items-center gap-2">
                <CheckCircle2 size={16} className="text-success-600 dark:text-success-400" />
                {t('safety.training.detail.completedTitle')}
              </h3>
              <p className="text-sm text-success-700 dark:text-success-400">
                {formatDateLong(training.completedAt)} ({formatRelativeTime(training.completedAt)})
              </p>
              {training.nextScheduledDate && (
                <p className="text-sm text-success-600 dark:text-success-400 mt-2 flex items-center gap-1.5">
                  <CalendarClock size={14} />
                  {t('safety.training.detail.nextScheduled')}: {formatDateLong(training.nextScheduledDate)}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
              {t('common.details')}
            </h3>
            <div className="space-y-4">
              <InfoItem
                icon={<GraduationCap size={15} />}
                label={t('safety.training.detail.labelType')}
                value={getTypeLabels()[training?.trainingType ?? ''] ?? training?.trainingType ?? ''}
              />
              <InfoItem
                icon={<Calendar size={15} />}
                label={t('safety.training.detail.labelDate')}
                value={training?.date ? formatDateLong(training.date) : ''}
              />
              <InfoItem
                icon={<User size={15} />}
                label={t('safety.training.detail.labelInstructor')}
                value={training?.instructorName ?? '—'}
              />
              <InfoItem
                icon={<Users size={15} />}
                label={t('safety.training.detail.labelParticipantCount')}
                value={`${training?.participantCount ?? 0} ${t('safety.training.detail.participantsUnit')}`}
              />
              <InfoItem
                icon={<Clock size={15} />}
                label={t('safety.training.detail.labelDuration')}
                value={training?.duration ? `${training.duration} ${t('safety.training.durationMinutes')}` : '—'}
              />
              <InfoItem
                icon={<FileText size={15} />}
                label={t('safety.training.detail.labelGost')}
                value={`${t('safety.training.detail.gostPrefix')} ${training?.gostNumber ?? '12.0.004-2015'}`}
              />
              <InfoItem
                icon={<Clock size={15} />}
                label={t('safety.training.detail.labelCreated')}
                value={training?.createdAt ? formatRelativeTime(training.createdAt) : ''}
              />
            </div>
          </div>
        </div>
      </div>

      <AuditFooter data={training} />

      <ConfirmDialog
        open={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={() => deleteMutation.mutate()}
        title={t('safety.training.detail.confirmDeleteTitle')}
        description={t('safety.training.detail.confirmDeleteDescription')}
        confirmLabel={t('safety.training.detail.confirmDeleteConfirm')}
        cancelLabel={t('common.cancel')}
        confirmVariant="danger"
      />
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

export default SafetyTrainingDetailPage;
