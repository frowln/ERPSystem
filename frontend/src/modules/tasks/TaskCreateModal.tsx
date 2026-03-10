import React, { useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';
import { Modal } from '@/design-system/components/Modal';
import { Button } from '@/design-system/components/Button';
import { FormField, Input, Select, Textarea } from '@/design-system/components/FormField';
import { tasksApi, type TaskVisibility, type ParticipantRole } from '@/api/tasks';
import { useProjectOptions, useUserOptions } from '@/hooks/useSelectOptions';
import { t } from '@/i18n';
import type { TaskPriority, TaskStatus } from '@/types';

interface TaskCreateModalProps {
  open: boolean;
  onClose: () => void;
  defaultStatus?: TaskStatus;
}

interface TaskCreateFormState {
  title: string;
  description: string;
  projectId: string;
  assigneeId: string;
  priority: TaskPriority;
  status: TaskStatus;
  plannedStartDate: string;
  plannedEndDate: string;
  visibility: TaskVisibility;
}

interface PendingParticipant {
  userId: string;
  userName: string;
  role: ParticipantRole;
}

const getInitialState = (defaultStatus?: TaskStatus): TaskCreateFormState => ({
  title: '',
  description: '',
  projectId: '',
  assigneeId: '',
  priority: 'NORMAL',
  status: defaultStatus ?? 'TODO',
  plannedStartDate: '',
  plannedEndDate: '',
  visibility: 'PARTICIPANTS_ONLY',
});

export const TaskCreateModal: React.FC<TaskCreateModalProps> = ({ open, onClose, defaultStatus }) => {
  const queryClient = useQueryClient();
  const { options: projectOptionsRaw } = useProjectOptions();
  const projectOptions = useMemo(
    () => [{ value: '', label: t('common.notSelected') }, ...projectOptionsRaw],
    [projectOptionsRaw],
  );
  const { options: assigneeOptionsRaw } = useUserOptions();
  const assigneeOptions = useMemo(
    () => [{ value: '', label: t('taskBoard.unassigned') }, ...assigneeOptionsRaw],
    [assigneeOptionsRaw],
  );
  const [form, setForm] = useState<TaskCreateFormState>(getInitialState(defaultStatus));

  // Sync defaultStatus when modal opens with a different column
  React.useEffect(() => {
    if (open) {
      setForm((prev) => ({ ...prev, status: defaultStatus ?? 'TODO' }));
    }
  }, [open, defaultStatus]);
  const [pendingParticipants, setPendingParticipants] = useState<PendingParticipant[]>([]);
  const [addPartUserId, setAddPartUserId] = useState('');
  const [addPartRole, setAddPartRole] = useState<ParticipantRole>('CO_EXECUTOR');

  const hasDateError = !!(
    form.plannedStartDate &&
    form.plannedEndDate &&
    form.plannedStartDate > form.plannedEndDate
  );

  const createTaskMutation = useMutation({
    mutationFn: async () => {
      const assigneeName = form.assigneeId
        ? assigneeOptionsRaw.find((o) => o.value === form.assigneeId)?.label
        : undefined;
      const task = await tasksApi.createTask({
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        projectId: form.projectId || undefined,
        assigneeId: form.assigneeId || undefined,
        assigneeName,
        priority: form.priority,
        status: form.status,
        plannedStartDate: form.plannedStartDate || undefined,
        plannedEndDate: form.plannedEndDate || undefined,
        visibility: form.visibility,
      });
      // Add pending participants after task creation
      for (const pp of pendingParticipants) {
        try {
          await tasksApi.addParticipant(task.id, pp);
        } catch {
          // Silently continue — task is created, participant add is best-effort
        }
      }
      return task;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['my-tasks'] });
      toast.success(t('taskBoard.taskCreated'));
      setForm(getInitialState(defaultStatus));
      setPendingParticipants([]);
      onClose();
    },
    onError: (error) => {
      console.error('[TaskCreateModal] create error:', error);
    },
  });

  const closeAndReset = () => {
    if (createTaskMutation.isPending) return;
    setForm(getInitialState());
    setPendingParticipants([]);
    onClose();
  };

  const addPendingParticipant = () => {
    if (!addPartUserId) return;
    // Prevent duplicates
    if (pendingParticipants.some((p) => p.userId === addPartUserId && p.role === addPartRole)) return;
    const emp = assigneeOptionsRaw.find((o) => o.value === addPartUserId);
    setPendingParticipants((prev) => [
      ...prev,
      { userId: addPartUserId, userName: emp?.label ?? '', role: addPartRole },
    ]);
    setAddPartUserId('');
  };

  const removePendingParticipant = (userId: string, role: ParticipantRole) => {
    setPendingParticipants((prev) => prev.filter((p) => !(p.userId === userId && p.role === role)));
  };

  const roleLabel = (role: ParticipantRole) => {
    if (role === 'RESPONSIBLE') return t('taskDetail.roleResponsible');
    if (role === 'CO_EXECUTOR') return t('taskDetail.roleCoExecutor');
    return t('taskDetail.roleObserver');
  };

  return (
    <Modal
      open={open}
      onClose={closeAndReset}
      title={t('taskBoard.createTask')}
      footer={(
        <>
          <Button variant="secondary" onClick={closeAndReset}>
            {t('common.cancel')}
          </Button>
          <Button
            onClick={() => createTaskMutation.mutate()}
            loading={createTaskMutation.isPending}
            disabled={!form.title.trim() || hasDateError}
          >
            {t('common.create')}
          </Button>
        </>
      )}
    >
      <div className="space-y-4">
        <FormField label={t('taskBoard.headerTitle')} required>
          <Input
            value={form.title}
            onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
            placeholder={t('taskBoard.searchTasks')}
          />
        </FormField>
        <FormField label={t('common.description')}>
          <Textarea
            value={form.description}
            onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
            rows={3}
          />
        </FormField>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label={t('taskBoard.headerProject')}>
            <Select
              options={projectOptions}
              value={form.projectId}
              onChange={(e) => setForm((prev) => ({ ...prev, projectId: e.target.value }))}
            />
          </FormField>
          <FormField label={t('taskBoard.headerAssignee')}>
            <Select
              options={assigneeOptions}
              value={form.assigneeId}
              onChange={(e) => setForm((prev) => ({ ...prev, assigneeId: e.target.value }))}
            />
          </FormField>
          <FormField label={t('taskBoard.headerPriority')}>
            <Select
              options={[
                { value: 'LOW', label: t('taskBoard.priorityLow') },
                { value: 'NORMAL', label: t('taskBoard.priorityNormal') },
                { value: 'HIGH', label: t('taskBoard.priorityHigh') },
                { value: 'URGENT', label: t('taskBoard.priorityUrgent') },
                { value: 'CRITICAL', label: t('taskBoard.priorityCritical') },
              ]}
              value={form.priority}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, priority: e.target.value as TaskPriority }))
              }
            />
          </FormField>
          <FormField label={t('taskBoard.headerStatus')}>
            <Select
              options={[
                { value: 'BACKLOG', label: t('taskBoard.columnBacklog') },
                { value: 'TODO', label: t('taskBoard.columnTodo') },
                { value: 'IN_PROGRESS', label: t('taskBoard.columnInProgress') },
                { value: 'IN_REVIEW', label: t('taskBoard.columnInReview') },
                { value: 'DONE', label: t('taskBoard.columnDone') },
                { value: 'CANCELLED', label: t('common.cancelled') },
              ]}
              value={form.status}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, status: e.target.value as TaskStatus }))
              }
            />
          </FormField>
          <FormField label={t('common.startDate')} className="sm:col-span-1">
            <Input
              type="date"
              value={form.plannedStartDate}
              onChange={(e) => setForm((prev) => ({ ...prev, plannedStartDate: e.target.value }))}
            />
          </FormField>
          <FormField
            label={t('taskBoard.headerDeadline')}
            className="sm:col-span-1"
            error={hasDateError ? t('taskBoard.dateError') : undefined}
          >
            <Input
              type="date"
              value={form.plannedEndDate}
              onChange={(e) => setForm((prev) => ({ ...prev, plannedEndDate: e.target.value }))}
            />
          </FormField>
          <FormField label={t('taskDetail.visibility')} className="sm:col-span-2">
            <Select
              options={[
                { value: 'PARTICIPANTS_ONLY', label: t('taskDetail.visibilityParticipants') },
                { value: 'PROJECT', label: t('taskDetail.visibilityProject') },
                { value: 'ORGANIZATION', label: t('taskDetail.visibilityOrganization') },
              ]}
              value={form.visibility}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, visibility: e.target.value as TaskVisibility }))
              }
            />
            <p className="text-[11px] text-neutral-400 mt-1">{t('taskDetail.visibilityHint')}</p>
          </FormField>
        </div>

        {/* Participants to add */}
        <div className="border-t border-neutral-100 dark:border-neutral-800 pt-4">
          <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2 block">
            {t('taskDetail.participants')}
          </label>
          {pendingParticipants.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {pendingParticipants.map((pp) => (
                <span
                  key={`${pp.userId}-${pp.role}`}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-full"
                >
                  {pp.userName}
                  <span className="text-neutral-400">({roleLabel(pp.role)})</span>
                  <button
                    type="button"
                    onClick={() => removePendingParticipant(pp.userId, pp.role)}
                    className="ml-0.5 text-neutral-400 hover:text-red-500 transition-colors"
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <Select
              options={[
                { value: '', label: t('taskDetail.selectUser') },
                ...assigneeOptionsRaw,
              ]}
              value={addPartUserId}
              onChange={(e) => setAddPartUserId(e.target.value)}
              className="flex-1"
            />
            <Select
              options={[
                { value: 'CO_EXECUTOR', label: t('taskDetail.roleCoExecutor') },
                { value: 'OBSERVER', label: t('taskDetail.roleObserver') },
              ]}
              value={addPartRole}
              onChange={(e) => setAddPartRole(e.target.value as ParticipantRole)}
              className="w-40"
            />
            <Button
              variant="secondary"
              size="sm"
              onClick={addPendingParticipant}
              disabled={!addPartUserId}
            >
              {t('common.add')}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default TaskCreateModal;
