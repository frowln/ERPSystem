import React, { useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save, Play, Plus, Trash2, GripVertical, ArrowRight, Settings2, Pause } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { MetricCard } from '@/design-system/components/MetricCard';
import { Input, Select } from '@/design-system/components/FormField';
import { Modal } from '@/design-system/components/Modal';
import { EmptyState } from '@/design-system/components/EmptyState';
import { workflowApi } from '@/api/workflow';
import { t } from '@/i18n';
import type { WorkflowDefinition, WorkflowStep } from './types';

const statusColorMap: Record<string, 'gray' | 'blue' | 'green' | 'yellow' | 'red' | 'purple'> = {
  ACTIVE: 'green',
  INACTIVE: 'gray',
};

const getStatusLabels = (): Record<string, string> => ({
  ACTIVE: t('workflow.statusActive'),
  INACTIVE: t('workflow.statusInactive'),
});

const getEntityTypeLabels = (): Record<string, string> => ({
  CONTRACT: t('workflow.entityContract'),
  DOCUMENT: t('workflow.entityDocument'),
  PURCHASE_REQUEST: t('workflow.entityPurchaseRequest'),
  INVOICE: t('workflow.entityInvoice'),
  BUDGET: t('workflow.entityBudget'),
  CHANGE_ORDER: t('workflow.entityChangeOrder'),
});

const getStepStatusLabel = (status: string): string => {
  const key = `workflow.stepStatus.${status}` as Parameters<typeof t>[0];
  const label = t(key);
  return label === key ? status : label;
};

const getRoleLabel = (role: string): string => {
  const roleMap: Record<string, string> = {
    ADMIN: 'Администратор',
    MANAGER: 'Руководитель',
    ENGINEER: 'Инженер',
    ACCOUNTANT: 'Бухгалтер',
    VIEWER: 'Наблюдатель',
  };
  return roleMap[role] ?? role;
};

const emptyWorkflow: WorkflowDefinition = {
  id: '',
  name: '',
  description: '',
  entityType: 'CONTRACT',
  isActive: false,
  createdAt: '',
  updatedAt: '',
};

const WorkflowDesignerPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isNew = !id;
  const [addStepOpen, setAddStepOpen] = useState(false);
  const [selectedStep, setSelectedStep] = useState<WorkflowStep | null>(null);

  // Form state for new workflow
  const [formName, setFormName] = useState('');
  const [formEntityType, setFormEntityType] = useState('CONTRACT');
  const [formDescription, setFormDescription] = useState('');

  // New step form
  const [stepName, setStepName] = useState('');
  const [stepFromStatus, setStepFromStatus] = useState('');
  const [stepToStatus, setStepToStatus] = useState('');
  const [stepRole, setStepRole] = useState('');
  const [stepSlaHours, setStepSlaHours] = useState('');

  const { data: workflow } = useQuery<WorkflowDefinition>({
    queryKey: ['workflow', id],
    queryFn: () => workflowApi.getWorkflow(id!),
    enabled: !isNew && !!id,
  });

  const { data: steps } = useQuery<WorkflowStep[]>({
    queryKey: ['workflow-steps', id],
    queryFn: () => workflowApi.getWorkflowSteps(id!),
    enabled: !isNew && !!id,
  });

  const currentWorkflow = workflow ?? (isNew ? emptyWorkflow : emptyWorkflow);
  const currentSteps = steps ?? [];

  const statusLabels = getStatusLabels();
  const entityTypeLabels = getEntityTypeLabels();
  const statusKey = currentWorkflow.isActive ? 'ACTIVE' : 'INACTIVE';

  const totalSlaHours = useMemo(() => {
    return currentSteps.reduce((sum, s) => sum + (s.slaHours ?? 0), 0);
  }, [currentSteps]);

  const createMutation = useMutation({
    mutationFn: (data: Partial<WorkflowDefinition>) => workflowApi.createWorkflow(data),
    onSuccess: (created) => {
      toast.success(t('common.operationSuccess'));
      navigate(`/workflow/designer/${created.id}`, { replace: true });
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
    },
    onError: () => toast.error(t('common.operationError')),
  });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<WorkflowDefinition>) => workflowApi.updateWorkflow(id!, data),
    onSuccess: () => {
      toast.success(t('common.operationSuccess'));
      queryClient.invalidateQueries({ queryKey: ['workflow', id] });
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
    },
    onError: () => toast.error(t('common.operationError')),
  });

  const toggleMutation = useMutation({
    mutationFn: () => workflowApi.toggleWorkflowActive(id!),
    onSuccess: () => {
      toast.success(t('common.operationSuccess'));
      queryClient.invalidateQueries({ queryKey: ['workflow', id] });
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
    },
    onError: () => toast.error(t('common.operationError')),
  });

  const handleSave = () => {
    if (isNew) {
      createMutation.mutate({
        name: formName,
        entityType: formEntityType,
        description: formDescription,
        isActive: false,
      });
    } else {
      updateMutation.mutate({
        name: currentWorkflow.name,
        entityType: currentWorkflow.entityType,
        description: currentWorkflow.description,
      });
    }
  };

  const handleAddStep = () => {
    if (!stepName.trim()) return;
    const newStep: Partial<WorkflowStep> = {
      workflowDefinitionId: id!,
      name: stepName,
      fromStatus: stepFromStatus,
      toStatus: stepToStatus,
      requiredRole: stepRole,
      slaHours: stepSlaHours ? parseInt(stepSlaHours) : undefined,
      sortOrder: currentSteps.length + 1,
    };
    const allSteps = [...currentSteps.map(s => ({
      workflowDefinitionId: s.workflowDefinitionId,
      name: s.name,
      fromStatus: s.fromStatus,
      toStatus: s.toStatus,
      requiredRole: s.requiredRole,
      slaHours: s.slaHours,
      sortOrder: s.sortOrder,
      conditions: s.conditions,
    })), newStep];
    workflowApi.updateWorkflowSteps(id!, allSteps).then(() => {
      queryClient.invalidateQueries({ queryKey: ['workflow-steps', id] });
      toast.success(t('common.operationSuccess'));
      setAddStepOpen(false);
      setStepName('');
      setStepFromStatus('');
      setStepToStatus('');
      setStepRole('');
      setStepSlaHours('');
    }).catch(() => toast.error(t('common.operationError')));
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={isNew ? t('workflow.newProcess') : currentWorkflow.name}
        subtitle={isNew ? t('workflow.newProcessSubtitle') : `${entityTypeLabels[currentWorkflow.entityType] ?? currentWorkflow.entityType}`}
        breadcrumbs={[
          { label: t('workflow.breadcrumbHome'), href: '/' },
          { label: t('workflow.breadcrumbWorkflows'), href: '/workflow/templates' },
          { label: isNew ? t('workflow.breadcrumbNew') : currentWorkflow.name },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" iconLeft={<ArrowLeft size={16} />} onClick={() => navigate('/workflow/templates')}>
              {t('common.back')}
            </Button>
            <Button variant="outline" iconLeft={<Save size={16} />} onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending}>
              {t('common.save')}
            </Button>
            {!isNew && (
              <Button
                iconLeft={currentWorkflow.isActive ? <Pause size={16} /> : <Play size={16} />}
                variant={currentWorkflow.isActive ? 'outline' : 'primary'}
                onClick={() => toggleMutation.mutate()}
                disabled={toggleMutation.isPending}
              >
                {currentWorkflow.isActive ? t('workflow.statusInactive') : t('workflow.activate')}
              </Button>
            )}
          </div>
        }
      />

      {/* Info cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard icon={<Settings2 size={18} />} label={t('workflow.metricStepsCount')} value={currentSteps.length} />
        <MetricCard
          icon={<Play size={18} />}
          label={t('workflow.metricTotalSla')}
          value={totalSlaHours > 0 ? `${totalSlaHours} ${t('maintenance.hoursAbbrev')}` : '---'}
        />
        <div className="rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-4">
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">{t('workflow.processStatus')}</p>
          <StatusBadge
            status={statusKey}
            colorMap={statusColorMap}
            label={statusLabels[statusKey] ?? statusKey}
          />
        </div>
      </div>

      {/* Workflow details form */}
      <div className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6 mb-6">
        <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-4">{t('workflow.processParams')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">{t('workflow.labelName')}</label>
            <Input
              value={isNew ? formName : currentWorkflow.name}
              onChange={(e) => isNew ? setFormName(e.target.value) : undefined}
              placeholder={t('workflow.placeholderName')}
              readOnly={!isNew}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">{t('workflow.labelEntityType')}</label>
            <Select
              options={Object.entries(entityTypeLabels).map(([value, label]) => ({ value, label }))}
              value={isNew ? formEntityType : currentWorkflow.entityType}
              onChange={(e) => isNew ? setFormEntityType(e.target.value) : undefined}
              disabled={!isNew}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">{t('workflow.labelDescription')}</label>
            <Input
              value={isNew ? formDescription : (currentWorkflow.description ?? '')}
              onChange={(e) => isNew ? setFormDescription(e.target.value) : undefined}
              placeholder={t('workflow.placeholderDescription')}
              readOnly={!isNew}
            />
          </div>
        </div>
      </div>

      {/* Steps visual designer */}
      <div className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">{t('workflow.processSteps')}</h3>
          {!isNew && (
            <Button variant="outline" size="sm" iconLeft={<Plus size={14} />} onClick={() => setAddStepOpen(true)}>
              {t('workflow.addStep')}
            </Button>
          )}
        </div>

        {isNew ? (
          <EmptyState
            title={t('workflow.noSteps')}
            description={t('workflow.saveFirst')}
          />
        ) : currentSteps.length === 0 ? (
          <EmptyState
            title={t('workflow.noSteps')}
            description={t('workflow.noStepsDescription')}
          />
        ) : (
          <div className="space-y-3">
            {currentSteps.map((step) => (
              <div
                key={step.id}
                className={`flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-colors ${
                  selectedStep?.id === step.id
                    ? 'border-primary-300 bg-primary-50 dark:border-primary-700 dark:bg-primary-900/30'
                    : 'border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-600'
                }`}
                onClick={() => setSelectedStep(step)}
              >
                <GripVertical size={16} className="text-neutral-400 flex-shrink-0" />
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 text-sm font-semibold flex-shrink-0">
                  {step.sortOrder}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-neutral-900 dark:text-neutral-100">{step.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-700 px-2 py-0.5 rounded">{step.fromStatus ? getStepStatusLabel(step.fromStatus) : '—'}</span>
                    <ArrowRight size={12} className="text-neutral-400" />
                    <span className="text-xs text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-700 px-2 py-0.5 rounded">{step.toStatus ? getStepStatusLabel(step.toStatus) : '—'}</span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm text-neutral-700 dark:text-neutral-300">{step.requiredRole ? getRoleLabel(step.requiredRole) : '—'}</p>
                  {step.slaHours != null && step.slaHours > 0 && (
                    <span className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 block">SLA: {step.slaHours} {t('maintenance.hoursAbbrev')}</span>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={(e) => { e.stopPropagation(); }}
                >
                  <Trash2 size={14} className="text-neutral-400 hover:text-danger-600" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Step connector visual */}
        {currentSteps.length > 0 && (
          <div className="mt-6 flex items-center gap-2 overflow-x-auto py-2">
            {currentSteps.map((step, i) => (
              <React.Fragment key={step.id}>
                <div className="flex-shrink-0 px-3 py-1.5 rounded-md text-xs font-medium bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300">
                  {step.name}
                </div>
                {i < currentSteps.length - 1 && (
                  <ArrowRight size={14} className="text-neutral-400 flex-shrink-0" />
                )}
              </React.Fragment>
            ))}
          </div>
        )}
      </div>

      {/* Add Step Modal */}
      <Modal
        open={addStepOpen}
        onClose={() => setAddStepOpen(false)}
        title={t('workflow.addStep')}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">{t('workflow.labelStepName')}</label>
            <Input placeholder={t('workflow.placeholderStepName')} value={stepName} onChange={(e) => setStepName(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">{t('workflow.labelStatusFrom')}</label>
              <Input placeholder={t('workflow.placeholderStatusFrom')} value={stepFromStatus} onChange={(e) => setStepFromStatus(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">{t('workflow.labelStatusTo')}</label>
              <Input placeholder={t('workflow.placeholderStatusTo')} value={stepToStatus} onChange={(e) => setStepToStatus(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">{t('workflow.labelResponsibleRole')}</label>
              <Input placeholder={t('workflow.placeholderRole')} value={stepRole} onChange={(e) => setStepRole(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">{t('workflow.labelSlaHours')}</label>
              <Input type="number" placeholder="24" value={stepSlaHours} onChange={(e) => setStepSlaHours(e.target.value)} />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setAddStepOpen(false)}>{t('common.cancel')}</Button>
            <Button onClick={handleAddStep}>{t('workflow.addStepButton')}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default WorkflowDesignerPage;
