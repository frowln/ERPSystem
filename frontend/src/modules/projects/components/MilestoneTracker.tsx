import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Star, Trash2, CheckCircle2, ClipboardList } from 'lucide-react';
import { Button } from '@/design-system/components/Button';
import { ConfirmDialog } from '@/design-system/components/ConfirmDialog';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';
import { milestonesApi, type Milestone } from '@/api/milestones';
import toast from 'react-hot-toast';

interface MilestoneTrackerProps {
  projectId: string;
}

const statusColors: Record<Milestone['status'], string> = {
  COMPLETED: 'bg-green-500',
  IN_PROGRESS: 'bg-blue-500',
  DELAYED: 'bg-amber-500',
  PENDING: 'bg-neutral-300 dark:bg-neutral-600',
};

const statusRingColors: Record<Milestone['status'], string> = {
  COMPLETED: 'ring-green-200 dark:ring-green-900',
  IN_PROGRESS: 'ring-blue-200 dark:ring-blue-900',
  DELAYED: 'ring-amber-200 dark:ring-amber-900',
  PENDING: 'ring-neutral-200 dark:ring-neutral-700',
};

const MilestoneTracker: React.FC<MilestoneTrackerProps> = ({ projectId }) => {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [formName, setFormName] = useState('');
  const [formPlannedDate, setFormPlannedDate] = useState('');
  const [formStatus, setFormStatus] = useState<Milestone['status']>('PENDING');
  const [formIsKey, setFormIsKey] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const { data: milestonesRaw, isLoading } = useQuery({
    queryKey: ['milestones', projectId],
    queryFn: () => milestonesApi.getMilestones(projectId),
  });
  const milestones = Array.isArray(milestonesRaw) ? milestonesRaw : [];

  const createMutation = useMutation({
    mutationFn: (data: Partial<Milestone>) => milestonesApi.createMilestone(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['milestones', projectId] });
      setShowForm(false);
      setFormName('');
      setFormPlannedDate('');
      setFormStatus('PENDING');
      setFormIsKey(false);
    },
    onError: () => {
      toast.error(t('errors.unexpectedError'));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Milestone> }) =>
      milestonesApi.updateMilestone(projectId, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['milestones', projectId] });
    },
    onError: () => {
      toast.error(t('common.operationError'));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => milestonesApi.deleteMilestone(projectId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['milestones', projectId] });
    },
    onError: () => {
      toast.error(t('common.operationError'));
    },
  });

  const completedCount = milestones.filter((m) => m.status === 'COMPLETED').length;
  const totalCount = milestones.length;
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;
    createMutation.mutate({
      name: formName.trim(),
      plannedDate: formPlannedDate || undefined,
      status: formStatus,
      isKeyMilestone: formIsKey,
      sequence: totalCount,
    });
  };

  const cycleStatus = (m: Milestone) => {
    const order: Milestone['status'][] = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'DELAYED'];
    const nextIdx = (order.indexOf(m.status) + 1) % order.length;
    const nextStatus = order[nextIdx];
    const data: Partial<Milestone> = { status: nextStatus };
    if (nextStatus === 'COMPLETED' && !m.actualDate) {
      data.actualDate = new Date().toISOString().slice(0, 10);
    }
    updateMutation.mutate({ id: m.id, data });
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 animate-pulse">
        <div className="h-5 bg-neutral-200 dark:bg-neutral-700 rounded w-40 mb-4" />
        <div className="h-2 bg-neutral-200 dark:bg-neutral-700 rounded w-full mb-6" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 bg-neutral-100 dark:bg-neutral-800 rounded" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-neutral-800 dark:text-neutral-100">
          {t('projects.milestones.title')}
        </h3>
        <Button variant="ghost" size="xs" iconLeft={<Plus size={14} />} onClick={() => setShowForm(!showForm)}>
          {t('projects.milestones.add')}
        </Button>
      </div>

      {/* Progress bar */}
      {totalCount > 0 && (
        <div className="mb-5">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-neutral-500 dark:text-neutral-400">
              {t('projects.milestones.progress', { done: String(completedCount), total: String(totalCount) })}
            </span>
            <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">{progressPct}%</span>
          </div>
          <div
            className="h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden"
            role="progressbar"
            aria-valuenow={progressPct}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className={cn(
                'h-full rounded-full transition-all duration-500',
                progressPct === 100 ? 'bg-green-500' : 'bg-blue-500',
              )}
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      )}

      {/* Inline Add Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="mb-5 p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 space-y-3">
          <div>
            <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
              {t('projects.milestones.name')} *
            </label>
            <input
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              className="w-full px-3 py-1.5 text-sm border border-neutral-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
              autoFocus
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                {t('projects.milestones.plannedDate')}
              </label>
              <input
                type="date"
                value={formPlannedDate}
                onChange={(e) => setFormPlannedDate(e.target.value)}
                className="w-full px-3 py-1.5 text-sm border border-neutral-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                {t('projects.milestones.status')}
              </label>
              <select
                value={formStatus}
                onChange={(e) => setFormStatus(e.target.value as Milestone['status'])}
                className="w-full px-3 py-1.5 text-sm border border-neutral-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="PENDING">{t('projects.milestones.statuses.PENDING')}</option>
                <option value="IN_PROGRESS">{t('projects.milestones.statuses.IN_PROGRESS')}</option>
                <option value="COMPLETED">{t('projects.milestones.statuses.COMPLETED')}</option>
                <option value="DELAYED">{t('projects.milestones.statuses.DELAYED')}</option>
              </select>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="milestone-is-key"
              checked={formIsKey}
              onChange={(e) => setFormIsKey(e.target.checked)}
              className="rounded border-neutral-300 dark:border-neutral-600 text-primary-600 focus:ring-primary-500"
            />
            <label htmlFor="milestone-is-key" className="text-xs text-neutral-600 dark:text-neutral-400">
              {t('projects.milestones.isKey')}
            </label>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <Button type="submit" variant="primary" size="xs" loading={createMutation.isPending}>
              {t('common.save')}
            </Button>
            <Button type="button" variant="ghost" size="xs" onClick={() => setShowForm(false)}>
              {t('common.cancel')}
            </Button>
          </div>
        </form>
      )}

      {/* Timeline */}
      {totalCount === 0 ? (
        <div className="text-center py-6">
          <p className="text-sm text-neutral-400 dark:text-neutral-500 mb-4">
            {t('projects.milestones.empty')}
          </p>
          <div className="mx-auto max-w-xs text-left space-y-2 mb-4">
            <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">{t('projects.milestones.examplesTitle')}</p>
            {(['example1', 'example2', 'example3'] as const).map((key) => (
              <div key={key} className="flex items-center gap-2 text-xs text-neutral-400 dark:text-neutral-500">
                <span className="w-2 h-2 rounded-full bg-neutral-300 dark:bg-neutral-600 flex-shrink-0" />
                {t(`projects.milestones.${key}`)}
              </div>
            ))}
          </div>
          <div className="flex items-center justify-center gap-2">
            <Button size="xs" variant="secondary" iconLeft={<Plus size={14} />} onClick={() => setShowForm(true)}>
              {t('projects.milestones.addFirst')}
            </Button>
            <Button size="xs" variant="secondary" iconLeft={<ClipboardList size={14} />} loading={createMutation.isPending} onClick={() => {
              const template = [
                t('projects.milestones.template.gpzu'),
                t('projects.milestones.template.surveys'),
                t('projects.milestones.template.pos'),
                t('projects.milestones.template.permit'),
                t('projects.milestones.template.kickoff'),
                t('projects.milestones.template.startWorks'),
              ];
              template.forEach((name, i) => {
                createMutation.mutate({ name, status: 'PENDING' as const, isKeyMilestone: i === 3 || i === 5, sequence: i });
              });
            }}>
              {t('projects.milestones.fillTemplate')}
            </Button>
          </div>
        </div>
      ) : (
        <div className="relative">
          {milestones.map((m, idx) => {
            const isLast = idx === milestones.length - 1;
            return (
              <div key={m.id} className="relative flex gap-3 group">
                {/* Vertical line */}
                {!isLast && (
                  <div className="absolute left-[11px] top-6 bottom-0 w-0.5 bg-neutral-200 dark:bg-neutral-700" />
                )}
                {/* Dot */}
                <button
                  type="button"
                  onClick={() => cycleStatus(m)}
                  title={t('projects.milestones.statuses.' + m.status)}
                  className={cn(
                    'relative z-10 mt-1 flex-shrink-0 rounded-full ring-2 transition-all',
                    statusColors[m.status],
                    statusRingColors[m.status],
                    m.isKeyMilestone ? 'w-6 h-6' : 'w-[22px] h-[22px]',
                  )}
                >
                  {m.isKeyMilestone && (
                    <Star size={12} className="absolute inset-0 m-auto text-white fill-white" />
                  )}
                  {!m.isKeyMilestone && m.status === 'COMPLETED' && (
                    <CheckCircle2 size={12} className="absolute inset-0 m-auto text-white" />
                  )}
                </button>

                {/* Content */}
                <div className={cn('flex-1 pb-5', isLast && 'pb-0')}>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className={cn(
                        'text-sm font-medium',
                        m.status === 'COMPLETED'
                          ? 'text-neutral-400 dark:text-neutral-500 line-through'
                          : 'text-neutral-800 dark:text-neutral-100',
                      )}>
                        {m.name}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {m.plannedDate && (
                          <span className="text-xs text-neutral-500 dark:text-neutral-400">
                            {t('projects.milestones.plannedDate')}: {m.plannedDate}
                          </span>
                        )}
                        {m.actualDate && (() => {
                          const deviationDays = m.plannedDate
                            ? Math.round((new Date(m.actualDate).getTime() - new Date(m.plannedDate).getTime()) / 86400000)
                            : null;
                          return (
                            <span className="text-xs text-green-600 dark:text-green-400">
                              {t('projects.milestones.actualDate')}: {m.actualDate}
                              {deviationDays !== null && deviationDays !== 0 && (
                                <span className={cn('ml-1', deviationDays > 0 ? 'text-red-500' : 'text-green-600 dark:text-green-400')}>
                                  ({deviationDays > 0 ? '+' : ''}{deviationDays} {t('projects.milestones.days')})
                                </span>
                              )}
                            </span>
                          );
                        })()}
                      </div>
                      {m.notes && (
                        <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">{m.notes}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className={cn(
                        'text-[10px] px-1.5 py-0.5 rounded-full font-medium',
                        m.status === 'COMPLETED' && 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
                        m.status === 'IN_PROGRESS' && 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
                        m.status === 'DELAYED' && 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
                        m.status === 'PENDING' && 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400',
                      )}>
                        {t('projects.milestones.statuses.' + m.status)}
                      </span>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(m.id)}
                        className="p-1 text-neutral-400 hover:text-danger-500 dark:text-neutral-500 dark:hover:text-danger-400 transition-colors"
                        title={t('common.delete')}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => { if (deleteTarget) deleteMutation.mutate(deleteTarget, { onSettled: () => setDeleteTarget(null) }); }}
        title={t('common.confirmDelete')}
        description={t('common.confirmDeleteDesc')}
        confirmVariant="danger"
        confirmLabel={t('common.delete')}
        loading={deleteMutation.isPending}
      />
    </div>
  );
};

export default MilestoneTracker;
