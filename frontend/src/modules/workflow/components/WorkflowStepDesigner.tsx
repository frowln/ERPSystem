import React, { useState, useCallback } from 'react';
import {
  ArrowDown,
  ArrowRight,
  ChevronUp,
  ChevronDown,
  Plus,
  Trash2,
  GitBranch,
  Clock,
  Zap,
  User,
  X,
} from 'lucide-react';
import { Button } from '@/design-system/components/Button';
import { Input, Select, Checkbox } from '@/design-system/components/FormField';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';
import type { WorkflowStep } from '../types';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface WorkflowStepDesignerProps {
  steps: WorkflowStep[];
  onChange: (steps: WorkflowStep[]) => void;
  className?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let _sid = 0;
function genStepId(): string {
  _sid += 1;
  return `step_${Date.now()}_${_sid}`;
}

function createEmptyStep(order: number, workflowId: string): WorkflowStep {
  return {
    id: genStepId(),
    workflowId,
    stepOrder: order,
    name: '',
    fromStatus: '',
    toStatus: '',
    requiredRole: '',
    slaHours: undefined,
    isAutomatic: false,
    conditions: undefined,
  };
}

// ---------------------------------------------------------------------------
// Step Card
// ---------------------------------------------------------------------------

interface StepCardProps {
  step: WorkflowStep;
  index: number;
  total: number;
  isEditing: boolean;
  onSelect: () => void;
  onClose: () => void;
  onUpdate: (patch: Partial<WorkflowStep>) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
}

const StepCard: React.FC<StepCardProps> = ({
  step,
  index,
  total,
  isEditing,
  onSelect,
  onClose,
  onUpdate,
  onMoveUp,
  onMoveDown,
  onRemove,
}) => {
  const hasConditions = !!step.conditions;

  return (
    <div
      className={cn(
        'rounded-lg border transition-all duration-150',
        isEditing
          ? 'border-primary-400 dark:border-primary-600 shadow-md ring-1 ring-primary-200 dark:ring-primary-800'
          : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600',
        'bg-white dark:bg-neutral-900',
      )}
    >
      {/* Card header */}
      <div
        className={cn(
          'flex items-center gap-3 px-4 py-3 cursor-pointer',
          !isEditing && 'hover:bg-neutral-50 dark:hover:bg-neutral-800/50',
        )}
        onClick={() => { if (!isEditing) onSelect(); }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && !isEditing) { e.preventDefault(); onSelect(); } }}
      >
        {/* Step number */}
        <div className={cn(
          'flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold flex-shrink-0',
          step.isAutomatic
            ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400'
            : 'bg-primary-100 text-primary-700 dark:bg-primary-900/50 dark:text-primary-400',
        )}>
          {index + 1}
        </div>

        {/* Step info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium text-neutral-900 dark:text-neutral-100 truncate">
              {step.name || t('workflow.stepDesigner.untitledStep')}
            </p>
            {hasConditions && (
              <GitBranch size={14} className="text-yellow-500 flex-shrink-0" />
            )}
          </div>
          {(step.fromStatus || step.toStatus) && (
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-xs text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded">
                {step.fromStatus || '---'}
              </span>
              <ArrowRight size={10} className="text-neutral-400 flex-shrink-0" />
              <span className="text-xs text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded">
                {step.toStatus || '---'}
              </span>
            </div>
          )}
        </div>

        {/* Badges */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {step.requiredRole && (
            <div className="flex items-center gap-1 text-xs text-neutral-600 dark:text-neutral-300">
              <User size={12} />
              <span>{step.requiredRole}</span>
            </div>
          )}
          {step.slaHours != null && step.slaHours > 0 && (
            <div className="flex items-center gap-1 text-xs text-neutral-500 dark:text-neutral-400">
              <Clock size={12} />
              <span>{step.slaHours}{t('workflow.stepDesigner.hoursAbbrev')}</span>
            </div>
          )}
          <StatusBadge
            status={step.isAutomatic ? 'auto' : 'manual'}
            colorMap={{ auto: 'green', manual: 'blue' }}
            label={step.isAutomatic ? t('workflow.stepDesigner.badgeAuto') : t('workflow.stepDesigner.badgeManual')}
          />
        </div>

        {/* Reorder + remove */}
        <div className="flex items-center gap-0.5 flex-shrink-0">
          <Button
            variant="ghost"
            size="xs"
            disabled={index === 0}
            onClick={(e) => { e.stopPropagation(); onMoveUp(); }}
            aria-label={t('workflow.stepDesigner.moveUp')}
          >
            <ChevronUp size={14} />
          </Button>
          <Button
            variant="ghost"
            size="xs"
            disabled={index === total - 1}
            onClick={(e) => { e.stopPropagation(); onMoveDown(); }}
            aria-label={t('workflow.stepDesigner.moveDown')}
          >
            <ChevronDown size={14} />
          </Button>
          <Button
            variant="ghost"
            size="xs"
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
            aria-label={t('workflow.stepDesigner.removeStep')}
          >
            <Trash2 size={14} className="text-neutral-400 hover:text-danger-600" />
          </Button>
        </div>
      </div>

      {/* Branch paths indicator */}
      {hasConditions && !isEditing && (
        <div className="px-4 pb-3 -mt-1">
          <div className="flex items-center gap-2 text-xs text-yellow-600 dark:text-yellow-400">
            <GitBranch size={12} />
            <span>{t('workflow.stepDesigner.hasBranching')}</span>
          </div>
        </div>
      )}

      {/* Inline editor panel */}
      {isEditing && (
        <div className="border-t border-neutral-200 dark:border-neutral-700 px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              {t('workflow.stepDesigner.editStepTitle')}
            </h4>
            <Button variant="ghost" size="xs" onClick={onClose} aria-label={t('common.close')}>
              <X size={14} />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                {t('workflow.labelStepName')}
              </label>
              <Input
                value={step.name}
                onChange={(e) => onUpdate({ name: e.target.value })}
                placeholder={t('workflow.placeholderStepName')}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                {t('workflow.labelResponsibleRole')}
              </label>
              <Select
                options={[
                  { value: 'ADMIN', label: 'Admin' },
                  { value: 'MANAGER', label: 'Manager' },
                  { value: 'ENGINEER', label: 'Engineer' },
                  { value: 'ACCOUNTANT', label: 'Accountant' },
                  { value: 'VIEWER', label: 'Viewer' },
                ]}
                value={step.requiredRole}
                onChange={(e) => onUpdate({ requiredRole: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                {t('workflow.labelStatusFrom')}
              </label>
              <Input
                value={step.fromStatus}
                onChange={(e) => onUpdate({ fromStatus: e.target.value })}
                placeholder={t('workflow.placeholderStatusFrom')}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                {t('workflow.labelStatusTo')}
              </label>
              <Input
                value={step.toStatus}
                onChange={(e) => onUpdate({ toStatus: e.target.value })}
                placeholder={t('workflow.placeholderStatusTo')}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                {t('workflow.labelSlaHours')}
              </label>
              <Input
                type="number"
                value={step.slaHours ?? ''}
                onChange={(e) =>
                  onUpdate({ slaHours: e.target.value ? Number(e.target.value) : undefined })
                }
                placeholder="24"
              />
            </div>
            <div className="flex items-end">
              <Checkbox
                id={`auto-${step.id}`}
                checked={step.isAutomatic}
                onChange={(e) => onUpdate({ isAutomatic: e.target.checked })}
                label={t('workflow.labelAutomatic')}
              />
            </div>
          </div>

          {/* Conditions / branching editor placeholder */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              {t('workflow.stepDesigner.conditionsLabel')}
            </label>
            <textarea
              className={cn(
                'w-full px-3 py-2 text-sm rounded-lg border resize-y min-h-[60px] transition-colors',
                'bg-white dark:bg-neutral-800 dark:text-neutral-100',
                'border-neutral-300 dark:border-neutral-600',
                'focus:outline-none focus:ring-2 focus:ring-primary-100 dark:focus:ring-primary-900 focus:border-primary-500',
                'placeholder:text-neutral-400 dark:placeholder:text-neutral-500',
              )}
              value={step.conditions ?? ''}
              onChange={(e) =>
                onUpdate({ conditions: e.target.value || undefined })
              }
              placeholder={t('workflow.stepDesigner.conditionsPlaceholder')}
              rows={2}
            />
          </div>
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Add Step Button (between steps)
// ---------------------------------------------------------------------------

interface AddStepBetweenProps {
  onClick: () => void;
}

const AddStepBetween: React.FC<AddStepBetweenProps> = ({ onClick }) => {
  return (
    <div className="flex flex-col items-center gap-0 py-1">
      <ArrowDown size={14} className="text-neutral-300 dark:text-neutral-600" />
      <button
        type="button"
        onClick={onClick}
        className={cn(
          'flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all',
          'text-neutral-400 hover:text-primary-600 dark:text-neutral-500 dark:hover:text-primary-400',
          'bg-transparent hover:bg-primary-50 dark:hover:bg-primary-900/30',
          'border border-dashed border-neutral-300 dark:border-neutral-600 hover:border-primary-400 dark:hover:border-primary-600',
        )}
        aria-label={t('workflow.stepDesigner.insertStep')}
      >
        <Plus size={12} />
        {t('workflow.stepDesigner.insertStep')}
      </button>
      <ArrowDown size={14} className="text-neutral-300 dark:text-neutral-600" />
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export const WorkflowStepDesigner: React.FC<WorkflowStepDesignerProps> = ({
  steps,
  onChange,
  className,
}) => {
  const [editingStepId, setEditingStepId] = useState<string | null>(null);

  const workflowId = steps.length > 0 ? steps[0].workflowId : '';

  // --- Actions ---

  const addStepAt = useCallback(
    (index: number) => {
      const newStep = createEmptyStep(index + 1, workflowId);
      const updated = [...steps];
      updated.splice(index, 0, newStep);
      // Recalculate step orders
      onChange(updated.map((s, i) => ({ ...s, stepOrder: i + 1 })));
      setEditingStepId(newStep.id);
    },
    [steps, onChange, workflowId],
  );

  const addStepAtEnd = useCallback(() => {
    addStepAt(steps.length);
  }, [addStepAt, steps.length]);

  const removeStep = useCallback(
    (stepId: string) => {
      const updated = steps.filter((s) => s.id !== stepId);
      onChange(updated.map((s, i) => ({ ...s, stepOrder: i + 1 })));
      if (editingStepId === stepId) setEditingStepId(null);
    },
    [steps, onChange, editingStepId],
  );

  const updateStep = useCallback(
    (stepId: string, patch: Partial<WorkflowStep>) => {
      onChange(steps.map((s) => (s.id === stepId ? { ...s, ...patch } : s)));
    },
    [steps, onChange],
  );

  const moveStep = useCallback(
    (stepId: string, direction: 'up' | 'down') => {
      const idx = steps.findIndex((s) => s.id === stepId);
      if (idx < 0) return;
      const newIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (newIdx < 0 || newIdx >= steps.length) return;

      const updated = [...steps];
      const temp = updated[idx];
      updated[idx] = updated[newIdx];
      updated[newIdx] = temp;
      onChange(updated.map((s, i) => ({ ...s, stepOrder: i + 1 })));
    },
    [steps, onChange],
  );

  return (
    <div className={cn('space-y-0', className)}>
      {steps.length === 0 ? (
        <div className={cn(
          'text-center py-12 rounded-lg border-2 border-dashed',
          'border-neutral-300 dark:border-neutral-600',
          'bg-neutral-50 dark:bg-neutral-800/30',
        )}>
          <Zap size={32} className="mx-auto text-neutral-400 dark:text-neutral-500 mb-3" />
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-3">
            {t('workflow.stepDesigner.emptyTitle')}
          </p>
          <p className="text-xs text-neutral-400 dark:text-neutral-500 mb-4">
            {t('workflow.stepDesigner.emptyDescription')}
          </p>
          <Button variant="outline" size="sm" iconLeft={<Plus size={14} />} onClick={addStepAtEnd}>
            {t('workflow.stepDesigner.addFirstStep')}
          </Button>
        </div>
      ) : (
        <>
          {steps.map((step, index) => (
            <React.Fragment key={step.id}>
              {index > 0 && (
                <AddStepBetween onClick={() => addStepAt(index)} />
              )}
              <StepCard
                step={step}
                index={index}
                total={steps.length}
                isEditing={editingStepId === step.id}
                onSelect={() => setEditingStepId(step.id)}
                onClose={() => setEditingStepId(null)}
                onUpdate={(patch) => updateStep(step.id, patch)}
                onMoveUp={() => moveStep(step.id, 'up')}
                onMoveDown={() => moveStep(step.id, 'down')}
                onRemove={() => removeStep(step.id)}
              />
            </React.Fragment>
          ))}

          {/* Add step at the end */}
          <div className="flex flex-col items-center gap-0 py-1">
            <ArrowDown size={14} className="text-neutral-300 dark:text-neutral-600" />
          </div>
          <div className="flex justify-center">
            <Button
              variant="outline"
              size="sm"
              iconLeft={<Plus size={14} />}
              onClick={addStepAtEnd}
            >
              {t('workflow.addStep')}
            </Button>
          </div>
        </>
      )}

      {/* Visual step flow at the bottom */}
      {steps.length > 1 && (
        <div className="mt-6 pt-4 border-t border-neutral-200 dark:border-neutral-700">
          <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-2 uppercase tracking-wider">
            {t('workflow.stepDesigner.flowOverview')}
          </p>
          <div className="flex items-center gap-2 overflow-x-auto py-2">
            {steps.map((step, i) => (
              <React.Fragment key={step.id}>
                <div
                  className={cn(
                    'flex-shrink-0 px-3 py-1.5 rounded-md text-xs font-medium',
                    step.isAutomatic
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400'
                      : 'bg-primary-100 text-primary-700 dark:bg-primary-900/50 dark:text-primary-400',
                  )}
                >
                  <div className="flex items-center gap-1">
                    {step.conditions && <GitBranch size={10} />}
                    <span>{step.name || t('workflow.stepDesigner.untitledStep')}</span>
                  </div>
                </div>
                {i < steps.length - 1 && (
                  <ArrowRight size={14} className="text-neutral-400 flex-shrink-0" />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
