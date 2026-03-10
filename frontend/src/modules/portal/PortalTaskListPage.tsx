import React, { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ClipboardList,
  Plus,
  CheckCircle,
  Clock,
  AlertTriangle,
  Play,
} from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { MetricCard } from '@/design-system/components/MetricCard';
import { DataTable } from '@/design-system/components/DataTable';
import { Button } from '@/design-system/components/Button';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { Modal } from '@/design-system/components/Modal';
import { FormField, Input, Select, Textarea } from '@/design-system/components/FormField';
import { portalApi } from '@/api/portal';
import { projectsApi } from '@/api/projects';
import { formatDate } from '@/lib/format';
import { t } from '@/i18n';
import toast from 'react-hot-toast';
import type { ColumnDef } from '@tanstack/react-table';
import type { PortalTask, PortalTaskStatus, PortalTaskPriority, CreatePortalTaskRequest } from './types';

const tp = (k: string) => t(`portal.tasks.${k}`);

const statusColorMap: Record<PortalTaskStatus, string> = {
  PENDING: 'gray',
  IN_PROGRESS: 'blue',
  COMPLETED: 'green',
  CANCELLED: 'red',
};

const priorityColorMap: Record<PortalTaskPriority, string> = {
  LOW: 'gray',
  MEDIUM: 'blue',
  HIGH: 'yellow',
  URGENT: 'red',
};

const getPriorityLabel = (priority: PortalTaskPriority): string => {
  const map: Record<PortalTaskPriority, string> = {
    LOW: 'priorityLow',
    MEDIUM: 'priorityMedium',
    HIGH: 'priorityHigh',
    URGENT: 'priorityUrgent',
  };
  return tp(map[priority]);
};

const getStatusLabel = (status: PortalTaskStatus): string => {
  const map: Record<PortalTaskStatus, string> = {
    PENDING: 'statusPending',
    IN_PROGRESS: 'statusInProgress',
    COMPLETED: 'statusCompleted',
    CANCELLED: 'statusCancelled',
  };
  return tp(map[status]);
};

const PortalTaskListPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('all');
  const [showCreate, setShowCreate] = useState(false);
  const [completionTaskId, setCompletionTaskId] = useState<string | null>(null);
  const [completionNote, setCompletionNote] = useState('');

  // Form state
  const [formPortalUserId, setFormPortalUserId] = useState('');
  const [formProjectId, setFormProjectId] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPriority, setFormPriority] = useState<PortalTaskPriority>('MEDIUM');
  const [formDueDate, setFormDueDate] = useState('');

  const statusFilter = activeTab === 'all' ? undefined : activeTab.toUpperCase() as PortalTaskStatus;

  const { data, isLoading } = useQuery({
    queryKey: ['portal-tasks', statusFilter],
    queryFn: () => portalApi.getTasks({ status: statusFilter, size: 100 }),
  });

  const { data: projects } = useQuery({
    queryKey: ['projects-select'],
    queryFn: () => projectsApi.getProjects({ size: 200 }),
  });

  const { data: portalUsers } = useQuery({
    queryKey: ['portal-users'],
    queryFn: () => portalApi.getUsers({ size: 200 }),
  });

  const tasks = data?.content ?? [];

  const metrics = useMemo(() => ({
    total: tasks.length,
    pending: tasks.filter((tk) => tk.status === 'PENDING').length,
    inProgress: tasks.filter((tk) => tk.status === 'IN_PROGRESS').length,
    completed: tasks.filter((tk) => tk.status === 'COMPLETED').length,
  }), [tasks]);

  const overdue = tasks.filter((tk) => tk.dueDate && new Date(tk.dueDate) < new Date() && tk.status !== 'COMPLETED' && tk.status !== 'CANCELLED').length;

  const tabs = [
    { id: 'all', label: tp('tabAll'), count: metrics.total },
    { id: 'pending', label: tp('tabPending'), count: metrics.pending },
    { id: 'in_progress', label: tp('tabInProgress'), count: metrics.inProgress },
    { id: 'completed', label: tp('tabCompleted'), count: metrics.completed },
  ];

  const projectOptions = (projects?.content ?? []).map((p) => ({ value: p.id, label: p.name }));
  const userOptions = (portalUsers?.content ?? []).map((u) => ({ value: u.id, label: `${u.fullName} (${u.companyName})` }));
  const priorityOptions = [
    { value: 'LOW', label: tp('priorityLow') },
    { value: 'MEDIUM', label: tp('priorityMedium') },
    { value: 'HIGH', label: tp('priorityHigh') },
    { value: 'URGENT', label: tp('priorityUrgent') },
  ];

  const createMutation = useMutation({
    mutationFn: (req: CreatePortalTaskRequest) => portalApi.createTask(req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portal-tasks'] });
      toast.success(tp('createSuccess'));
      setShowCreate(false);
      resetForm();
    },
    onError: () => toast.error(t('common.operationError')),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status, note }: { id: string; status: PortalTaskStatus; note?: string }) =>
      portalApi.updateTaskStatus(id, status, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portal-tasks'] });
      toast.success(tp('statusUpdated'));
      setCompletionTaskId(null);
      setCompletionNote('');
    },
    onError: () => toast.error(t('common.operationError')),
  });

  const resetForm = () => {
    setFormPortalUserId('');
    setFormProjectId('');
    setFormTitle('');
    setFormDescription('');
    setFormPriority('MEDIUM');
    setFormDueDate('');
  };

  const handleCreate = useCallback(() => {
    createMutation.mutate({
      portalUserId: formPortalUserId,
      projectId: formProjectId || undefined,
      title: formTitle,
      description: formDescription || undefined,
      priority: formPriority,
      dueDate: formDueDate || undefined,
    });
  }, [formPortalUserId, formProjectId, formTitle, formDescription, formPriority, formDueDate]);

  const columns: ColumnDef<PortalTask, unknown>[] = [
    {
      accessorKey: 'title',
      header: tp('colTitle'),
      cell: ({ row }) => (
        <div>
          <span className="font-medium text-neutral-900 dark:text-neutral-100">{row.original.title}</span>
          {row.original.description && (
            <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate max-w-xs">{row.original.description}</p>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'portalUserName',
      header: tp('colAssignee'),
    },
    {
      accessorKey: 'projectName',
      header: tp('colProject'),
      cell: ({ row }) => row.original.projectName || '\u2014',
    },
    {
      accessorKey: 'priority',
      header: tp('colPriority'),
      cell: ({ row }) => (
        <StatusBadge
          status={row.original.priority}
          colorMap={priorityColorMap}
          label={getPriorityLabel(row.original.priority)}
        />
      ),
    },
    {
      accessorKey: 'status',
      header: tp('colStatus'),
      cell: ({ row }) => (
        <StatusBadge
          status={row.original.status}
          colorMap={statusColorMap}
          label={getStatusLabel(row.original.status)}
        />
      ),
    },
    {
      accessorKey: 'dueDate',
      header: tp('colDueDate'),
      cell: ({ row }) => {
        if (!row.original.dueDate) return '\u2014';
        const isOverdue = new Date(row.original.dueDate) < new Date() && row.original.status !== 'COMPLETED' && row.original.status !== 'CANCELLED';
        return (
          <span className={isOverdue ? 'text-red-600 dark:text-red-400 font-medium' : ''}>
            {formatDate(row.original.dueDate)}
          </span>
        );
      },
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const task = row.original;
        return (
          <div className="flex items-center gap-1">
            {task.status === 'PENDING' && (
              <Button size="xs" variant="outline" onClick={() => statusMutation.mutate({ id: task.id, status: 'IN_PROGRESS' })} title={tp('startAction')}>
                <Play size={12} />
              </Button>
            )}
            {(task.status === 'PENDING' || task.status === 'IN_PROGRESS') && (
              <Button size="xs" variant="success" onClick={() => setCompletionTaskId(task.id)} title={tp('completeAction')}>
                <CheckCircle size={12} />
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={tp('title')}
        subtitle={tp('subtitle')}
        breadcrumbs={[
          { label: t('portal.dashboard.breadcrumbHome'), href: '/' },
          { label: t('portal.dashboard.breadcrumbPortal'), href: '/portal' },
          { label: tp('breadcrumb') },
        ]}
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        actions={
          <Button size="sm" onClick={() => setShowCreate(true)}>
            <Plus size={14} className="mr-1" /> {tp('createTask')}
          </Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard icon={<ClipboardList size={18} />} label={tp('metricTotal')} value={metrics.total} />
        <MetricCard icon={<Clock size={18} />} label={tp('metricPending')} value={metrics.pending} />
        <MetricCard icon={<Play size={18} />} label={tp('metricInProgress')} value={metrics.inProgress} />
        <MetricCard
          icon={<AlertTriangle size={18} />}
          label={tp('metricOverdue')}
          value={overdue}
          trend={overdue > 0 ? { direction: 'up', value: tp('trendOverdue') } : undefined}
        />
      </div>

      <DataTable
        columns={columns}
        data={tasks}
        loading={isLoading}
        enableSavedViews
      />

      {/* Create Task Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title={tp('createModalTitle')}>
        <div className="space-y-4">
          <FormField label={tp('fieldAssignee')} required>
            <Select options={userOptions} value={formPortalUserId} onChange={(e) => setFormPortalUserId(e.target.value)} placeholder={tp('assigneePlaceholder')} />
          </FormField>
          <FormField label={tp('fieldTitle')} required>
            <Input value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder={tp('titlePlaceholder')} />
          </FormField>
          <FormField label={tp('fieldProject')}>
            <Select options={projectOptions} value={formProjectId} onChange={(e) => setFormProjectId(e.target.value)} placeholder={tp('projectPlaceholder')} />
          </FormField>
          <FormField label={tp('fieldDescription')}>
            <Textarea
              rows={3}
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              placeholder={tp('descriptionPlaceholder')}
            />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label={tp('fieldPriority')}>
              <Select options={priorityOptions} value={formPriority} onChange={(e) => setFormPriority(e.target.value as PortalTaskPriority)} />
            </FormField>
            <FormField label={tp('fieldDueDate')}>
              <Input type="date" value={formDueDate} onChange={(e) => setFormDueDate(e.target.value)} />
            </FormField>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => { setShowCreate(false); resetForm(); }}>{t('common.cancel')}</Button>
            <Button onClick={handleCreate} disabled={!formPortalUserId || !formTitle.trim()} loading={createMutation.isPending}>{t('common.save')}</Button>
          </div>
        </div>
      </Modal>

      {/* Complete Task Modal */}
      <Modal open={!!completionTaskId} onClose={() => { setCompletionTaskId(null); setCompletionNote(''); }} title={tp('completeModalTitle')}>
        <div className="space-y-4">
          <FormField label={tp('completionNoteLabel')}>
            <Textarea
              rows={3}
              value={completionNote}
              onChange={(e) => setCompletionNote(e.target.value)}
              placeholder={tp('completionNotePlaceholder')}
            />
          </FormField>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => { setCompletionTaskId(null); setCompletionNote(''); }}>{t('common.cancel')}</Button>
            <Button variant="success" onClick={() => completionTaskId && statusMutation.mutate({ id: completionTaskId, status: 'COMPLETED', note: completionNote })} loading={statusMutation.isPending}>
              <CheckCircle size={14} className="mr-1" /> {tp('completeAction')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default PortalTaskListPage;
