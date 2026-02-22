import React, { useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Modal } from '@/design-system/components/Modal';
import { Button } from '@/design-system/components/Button';
import { FormField, Input, Select, Textarea } from '@/design-system/components/FormField';
import { tasksApi } from '@/api/tasks';
import { useProjectOptions, useEmployeeOptions } from '@/hooks/useSelectOptions';
import { t } from '@/i18n';
import type { TaskPriority, TaskStatus } from '@/types';

interface TaskCreateModalProps {
  open: boolean;
  onClose: () => void;
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
}

const getInitialState = (): TaskCreateFormState => ({
  title: '',
  description: '',
  projectId: '',
  assigneeId: '',
  priority: 'NORMAL',
  status: 'TODO',
  plannedStartDate: '',
  plannedEndDate: '',
});

export const TaskCreateModal: React.FC<TaskCreateModalProps> = ({ open, onClose }) => {
  const queryClient = useQueryClient();
  const { options: projectOptions } = useProjectOptions();
  const { options: assigneeOptionsRaw } = useEmployeeOptions('ACTIVE');
  const assigneeOptions = useMemo(
    () => [{ value: '', label: t('taskBoard.unassigned') }, ...assigneeOptionsRaw],
    [assigneeOptionsRaw],
  );
  const [form, setForm] = useState<TaskCreateFormState>(getInitialState());

  const createTaskMutation = useMutation({
    mutationFn: () =>
      tasksApi.createTask({
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        projectId: form.projectId || undefined,
        assigneeId: form.assigneeId || undefined,
        priority: form.priority,
        status: form.status,
        plannedStartDate: form.plannedStartDate || undefined,
        plannedEndDate: form.plannedEndDate || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success(t('taskBoard.createTask'));
      setForm(getInitialState());
      onClose();
    },
    onError: () => {
      toast.error(t('errors.unexpectedError'));
    },
  });

  const closeAndReset = () => {
    if (createTaskMutation.isPending) return;
    setForm(getInitialState());
    onClose();
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
            disabled={!form.title.trim()}
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
          <FormField label={t('taskBoard.headerDeadline')} className="sm:col-span-1">
            <Input
              type="date"
              value={form.plannedEndDate}
              onChange={(e) => setForm((prev) => ({ ...prev, plannedEndDate: e.target.value }))}
            />
          </FormField>
          <FormField label={t('common.startDate')} className="sm:col-span-1">
            <Input
              type="date"
              value={form.plannedStartDate}
              onChange={(e) => setForm((prev) => ({ ...prev, plannedStartDate: e.target.value }))}
            />
          </FormField>
        </div>
      </div>
    </Modal>
  );
};

