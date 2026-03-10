import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ClipboardCheck,
  Users,
  Check,
  Clock,
  Calendar,
  ArrowLeft,
  CheckCircle2,
} from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { safetyBriefingApi } from '@/api/safetyBriefings';
import { formatDate } from '@/lib/format';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';
import toast from 'react-hot-toast';

const typeColorMap: Record<string, string> = {
  INITIAL: 'blue',
  PRIMARY: 'green',
  REPEAT: 'yellow',
  UNSCHEDULED: 'orange',
  TARGET: 'purple',
};

const statusColorMap: Record<string, string> = {
  PLANNED: 'blue',
  IN_PROGRESS: 'yellow',
  COMPLETED: 'green',
  CANCELLED: 'gray',
};

const getTypeLabels = (): Record<string, string> => ({
  INITIAL: t('safety.briefings.typeInitial'),
  PRIMARY: t('safety.briefings.typePrimary'),
  REPEAT: t('safety.briefings.typeRepeat'),
  UNSCHEDULED: t('safety.briefings.typeUnscheduled'),
  TARGET: t('safety.briefings.typeTarget'),
});

const getStatusLabels = (): Record<string, string> => ({
  PLANNED: t('safety.briefings.statusPlanned'),
  IN_PROGRESS: t('safety.briefings.statusInProgress'),
  COMPLETED: t('safety.briefings.statusCompleted'),
  CANCELLED: t('safety.briefings.statusCancelled'),
});

const SafetyBriefingDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: briefing, isLoading } = useQuery({
    queryKey: ['safety-briefing', id],
    queryFn: () => safetyBriefingApi.getBriefing(id!),
    enabled: !!id,
  });

  const completeMutation = useMutation({
    mutationFn: () => safetyBriefingApi.completeBriefing(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['safety-briefing', id] });
      toast.success(t('safety.briefings.toastCompleted'));
    },
    onError: () => {
      toast.error(t('common.operationError'));
    },
  });

  const signMutation = useMutation({
    mutationFn: (employeeId: string) => safetyBriefingApi.signBriefing(id!, employeeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['safety-briefing', id] });
      toast.success(t('safety.briefings.toastSigned'));
    },
    onError: () => {
      toast.error(t('common.operationError'));
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (!briefing) {
    return (
      <div className="text-center py-12">
        <p className="text-neutral-500">{t('safety.briefings.notFound')}</p>
      </div>
    );
  }

  const signedRatio = briefing.attendeeCount > 0
    ? Math.round((briefing.signedCount / briefing.attendeeCount) * 100)
    : 0;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={`${getTypeLabels()[briefing.briefingType]} \u2014 ${formatDate(briefing.briefingDate)}`}
        breadcrumbs={[
          { label: t('common.home'), href: '/' },
          { label: t('safety.title'), href: '/safety' },
          { label: t('safety.briefings.breadcrumbBriefings'), href: '/safety/briefings' },
          { label: t('safety.briefings.detailTitle') },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => navigate('/safety/briefings')} iconLeft={<ArrowLeft size={16} />}>
              {t('safety.briefings.btnBack')}
            </Button>
            {briefing.status !== 'COMPLETED' && briefing.status !== 'CANCELLED' && (
              <Button
                onClick={() => completeMutation.mutate()}
                loading={completeMutation.isPending}
                iconLeft={<CheckCircle2 size={16} />}
              >
                {t('safety.briefings.btnComplete')}
              </Button>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Details card */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-5">
            <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-4">
              {t('safety.briefings.sectionDetails')}
            </h3>
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-neutral-500 dark:text-neutral-400">{t('safety.briefings.labelType')}</dt>
                <dd className="mt-1">
                  <StatusBadge
                    status={briefing.briefingType}
                    colorMap={typeColorMap}
                    label={getTypeLabels()[briefing.briefingType]}
                  />
                </dd>
              </div>
              <div>
                <dt className="text-neutral-500 dark:text-neutral-400">{t('safety.briefings.colStatus')}</dt>
                <dd className="mt-1">
                  <StatusBadge
                    status={briefing.status}
                    colorMap={statusColorMap}
                    label={getStatusLabels()[briefing.status]}
                  />
                </dd>
              </div>
              <div>
                <dt className="text-neutral-500 dark:text-neutral-400">{t('safety.briefings.labelDate')}</dt>
                <dd className="mt-1 text-neutral-900 dark:text-neutral-100 tabular-nums">
                  {formatDate(briefing.briefingDate)}
                </dd>
              </div>
              <div>
                <dt className="text-neutral-500 dark:text-neutral-400">{t('safety.briefings.labelInstructor')}</dt>
                <dd className="mt-1 text-neutral-900 dark:text-neutral-100">
                  {briefing.instructorName || '\u2014'}
                </dd>
              </div>
              {briefing.nextBriefingDate && (
                <div>
                  <dt className="text-neutral-500 dark:text-neutral-400">{t('safety.briefings.colNextDate')}</dt>
                  <dd className="mt-1 text-neutral-900 dark:text-neutral-100 tabular-nums">
                    {formatDate(briefing.nextBriefingDate)}
                  </dd>
                </div>
              )}
            </dl>

            {briefing.topic && (
              <div className="mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-800">
                <dt className="text-sm text-neutral-500 dark:text-neutral-400 mb-1">{t('safety.briefings.labelTopic')}</dt>
                <dd className="text-sm text-neutral-900 dark:text-neutral-100">{briefing.topic}</dd>
              </div>
            )}

            {briefing.notes && (
              <div className="mt-3">
                <dt className="text-sm text-neutral-500 dark:text-neutral-400 mb-1">{t('safety.briefings.labelNotes')}</dt>
                <dd className="text-sm text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap">{briefing.notes}</dd>
              </div>
            )}
          </div>

          {/* Attendees */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                {t('safety.briefings.sectionAttendees')} ({briefing.attendeeCount})
              </h3>
              <span className="text-xs text-neutral-500">
                {t('safety.briefings.signedRatio', { signed: String(briefing.signedCount), total: String(briefing.attendeeCount) })}
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-full h-2 mb-4">
              <div
                className="h-2 rounded-full bg-success-500 transition-all"
                style={{ width: `${signedRatio}%` }}
              />
            </div>

            <div className="space-y-2">
              {briefing.attendees.map((a) => (
                <div
                  key={a.id}
                  className={cn(
                    'flex items-center justify-between rounded-lg px-3 py-2.5 border',
                    a.signed
                      ? 'bg-success-50 dark:bg-success-900/10 border-success-200 dark:border-success-800'
                      : 'bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700',
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Users size={14} className="text-neutral-400" />
                    <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                      {a.employeeName}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {a.signed ? (
                      <div className="flex items-center gap-1.5 text-success-600 dark:text-success-400">
                        <Check size={14} />
                        <span className="text-xs">
                          {a.signedAt ? formatDate(a.signedAt) : t('safety.briefings.signed')}
                        </span>
                      </div>
                    ) : (
                      briefing.status !== 'COMPLETED' && briefing.status !== 'CANCELLED' && (
                        <Button
                          variant="outline"
                          size="xs"
                          onClick={() => signMutation.mutate(a.employeeId)}
                          loading={signMutation.isPending}
                        >
                          {t('safety.briefings.btnSign')}
                        </Button>
                      )
                    )}
                  </div>
                </div>
              ))}

              {briefing.attendees.length === 0 && (
                <p className="text-sm text-neutral-400 text-center py-4">
                  {t('safety.briefings.noAttendees')}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-5">
            <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-3">
              {t('safety.briefings.sidebarSummary')}
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <ClipboardCheck size={16} className="text-primary-500" />
                <span className="text-neutral-700 dark:text-neutral-300">
                  {getTypeLabels()[briefing.briefingType]}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar size={16} className="text-primary-500" />
                <span className="text-neutral-700 dark:text-neutral-300 tabular-nums">
                  {formatDate(briefing.briefingDate)}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Users size={16} className="text-primary-500" />
                <span className="text-neutral-700 dark:text-neutral-300">
                  {briefing.attendeeCount} {t('safety.briefings.personsUnit')}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock size={16} className="text-primary-500" />
                <span className="text-neutral-700 dark:text-neutral-300">
                  {signedRatio}% {t('safety.briefings.signedLabel')}
                </span>
              </div>
            </div>
          </div>

          {/* GOST reference */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800 p-4">
            <p className="text-xs font-medium text-blue-800 dark:text-blue-200 mb-1">
              {t('safety.briefings.gostReference')}
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-300">
              GOST 12.0.004-2015
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SafetyBriefingDetailPage;
