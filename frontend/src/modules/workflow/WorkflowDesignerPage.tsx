import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Save, Play, Plus, Trash2, GripVertical, ArrowRight, Settings2 } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { MetricCard } from '@/design-system/components/MetricCard';
import { Input, Select } from '@/design-system/components/FormField';
import { Modal } from '@/design-system/components/Modal';
import { EmptyState } from '@/design-system/components/EmptyState';
import { workflowApi } from '@/api/workflow';
import type { WorkflowDefinition, WorkflowStep } from './types';

const statusColorMap: Record<string, 'gray' | 'blue' | 'green' | 'yellow' | 'red' | 'purple'> = {
  ACTIVE: 'green',
  INACTIVE: 'gray',
  DRAFT: 'yellow',
};

const statusLabels: Record<string, string> = {
  ACTIVE: 'Активный',
  INACTIVE: 'Неактивный',
  DRAFT: 'Черновик',
};

const entityTypeLabels: Record<string, string> = {
  CONTRACT: 'Договор',
  DOCUMENT: 'Документ',
  PURCHASE_REQUEST: 'Заявка на закупку',
  INVOICE: 'Счёт',
  BUDGET: 'Бюджет',
  CHANGE_ORDER: 'Доп. соглашение',
};


const emptyWorkflow: WorkflowDefinition = {
  id: '',
  name: '',
  description: '',
  entityType: 'CONTRACT',
  status: 'DRAFT',
  stepsCount: 0,
  version: 1,
  createdByName: '',
  createdAt: '',
  updatedAt: '',
};

const WorkflowDesignerPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = id === 'NEW';
  const [addStepOpen, setAddStepOpen] = useState(false);
  const [selectedStep, setSelectedStep] = useState<WorkflowStep | null>(null);

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

  const totalSlaHours = useMemo(() => {
    return currentSteps.reduce((sum, s) => sum + (s.slaHours ?? 0), 0);
  }, [currentSteps]);

  const autoSteps = currentSteps.filter((s) => s.isAutomatic).length;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={isNew ? 'Новый бизнес-процесс' : currentWorkflow.name}
        subtitle={isNew ? 'Настройте шаги нового процесса' : `Версия ${currentWorkflow.version} | ${entityTypeLabels[currentWorkflow.entityType] ?? currentWorkflow.entityType}`}
        breadcrumbs={[
          { label: 'Главная', href: '/' },
          { label: 'Бизнес-процессы', href: '/workflow/templates' },
          { label: isNew ? 'Новый' : currentWorkflow.name },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" iconLeft={<ArrowLeft size={16} />} onClick={() => navigate('/workflow/templates')}>
              Назад
            </Button>
            <Button variant="outline" iconLeft={<Save size={16} />}>
              Сохранить
            </Button>
            {!isNew && currentWorkflow.status === 'DRAFT' && (
              <Button iconLeft={<Play size={16} />}>
                Активировать
              </Button>
            )}
          </div>
        }
      />

      {/* Info cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard icon={<Settings2 size={18} />} label="Количество шагов" value={currentSteps.length} />
        <MetricCard icon={<ArrowRight size={18} />} label="Автоматических" value={autoSteps} subtitle="выполняются автоматически" />
        <MetricCard
          icon={<Play size={18} />}
          label="Общий SLA"
          value={totalSlaHours > 0 ? `${totalSlaHours} ч.` : '---'}
        />
        <div className="rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-4">
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">Статус процесса</p>
          <StatusBadge
            status={currentWorkflow.status}
            colorMap={statusColorMap}
            label={statusLabels[currentWorkflow.status] ?? currentWorkflow.status}
          />
        </div>
      </div>

      {/* Workflow details form */}
      <div className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6 mb-6">
        <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-4">Параметры процесса</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Название</label>
            <Input defaultValue={currentWorkflow.name} placeholder="Введите название процесса" />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Тип сущности</label>
            <Select
              options={Object.entries(entityTypeLabels).map(([value, label]) => ({ value, label }))}
              defaultValue={currentWorkflow.entityType}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Описание</label>
            <Input defaultValue={currentWorkflow.description ?? ''} placeholder="Описание процесса" />
          </div>
        </div>
      </div>

      {/* Steps visual designer */}
      <div className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">Шаги процесса</h3>
          <Button variant="outline" size="sm" iconLeft={<Plus size={14} />} onClick={() => setAddStepOpen(true)}>
            Добавить шаг
          </Button>
        </div>

        {currentSteps.length === 0 ? (
          <EmptyState
            title="Нет шагов"
            description="Добавьте первый шаг для настройки бизнес-процесса"
          />
        ) : (
          <div className="space-y-3">
            {currentSteps.map((step, index) => (
              <div
                key={step.id}
                className={`flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-colors ${
                  selectedStep?.id === step.id
                    ? 'border-primary-300 bg-primary-50'
                    : 'border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-600'
                }`}
                onClick={() => setSelectedStep(step)}
              >
                <GripVertical size={16} className="text-neutral-400 flex-shrink-0" />
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary-100 text-primary-700 text-sm font-semibold flex-shrink-0">
                  {step.stepOrder}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-neutral-900 dark:text-neutral-100">{step.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded">{step.fromStatus}</span>
                    <ArrowRight size={12} className="text-neutral-400" />
                    <span className="text-xs text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded">{step.toStatus}</span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm text-neutral-700 dark:text-neutral-300">{step.requiredRole}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {step.slaHours && (
                      <span className="text-xs text-neutral-500 dark:text-neutral-400">SLA: {step.slaHours} ч.</span>
                    )}
                    {step.isAutomatic && (
                      <span className="text-xs text-green-600 font-medium">Авто</span>
                    )}
                  </div>
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
                <div className={`flex-shrink-0 px-3 py-1.5 rounded-md text-xs font-medium ${
                  step.isAutomatic ? 'bg-green-100 text-green-700' : 'bg-primary-100 text-primary-700'
                }`}>
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
        title="Добавить шаг"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Название шага</label>
            <Input placeholder="Например: Проверка юристом" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Статус: откуда</label>
              <Input placeholder="Исходный статус" />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Статус: куда</label>
              <Input placeholder="Целевой статус" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Роль ответственного</label>
              <Input placeholder="Роль" />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">SLA (часы)</label>
              <Input type="number" placeholder="24" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="isAutomatic" className="rounded border-neutral-300 dark:border-neutral-600" />
            <label htmlFor="isAutomatic" className="text-sm text-neutral-700 dark:text-neutral-300">Автоматический шаг</label>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setAddStepOpen(false)}>Отмена</Button>
            <Button onClick={() => setAddStepOpen(false)}>Добавить</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default WorkflowDesignerPage;
