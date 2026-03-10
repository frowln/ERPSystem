// =============================================================================
// Automation Rule Editor — Visual "When → If → Then" builder modal
// =============================================================================

import React, { useState, useCallback } from 'react';
import {
  X,
  ChevronDown,
  Plus,
  Trash2,
  ArrowDown,
  Zap,
  Filter,
  Play,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';
import type {
  AutomationRule,
  AutomationTrigger,
  AutomationCondition,
  AutomationAction,
  TriggerType,
  ActionType,
  EntityType,
  ConditionOperator,
} from './automationTypes';
import {
  TRIGGER_OPTIONS,
  ACTION_OPTIONS,
  ENTITY_OPTIONS,
  OPERATOR_OPTIONS,
  generateId,
} from './automationTypes';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface AutomationRuleEditorProps {
  rule?: AutomationRule | null;
  onSave: (rule: AutomationRule) => void;
  onClose: () => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function SelectDropdown<T extends string>({
  value,
  options,
  onChange,
  className,
}: {
  value: T;
  options: { value: T; label: string; icon?: React.ElementType }[];
  onChange: (v: T) => void;
  className?: string;
}) {
  return (
    <div className={cn('relative', className)}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="w-full appearance-none rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 px-3 py-2 pr-8 text-sm text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronDown
        size={14}
        className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400"
      />
    </div>
  );
}

function TextInput({
  value,
  onChange,
  placeholder,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={cn(
        'w-full rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
        className,
      )}
    />
  );
}

// ---------------------------------------------------------------------------
// Section card wrapper
// ---------------------------------------------------------------------------

function SectionCard({
  borderColor,
  icon,
  title,
  children,
}: {
  borderColor: string;
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        'rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 overflow-hidden',
        borderColor,
      )}
    >
      <div className="flex items-center gap-2 px-4 py-3 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50">
        {icon}
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{title}</h3>
      </div>
      <div className="p-4 space-y-3">{children}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Flow arrow between sections
// ---------------------------------------------------------------------------

function FlowArrow() {
  return (
    <div className="flex justify-center py-1">
      <ArrowDown size={20} className="text-neutral-300 dark:text-neutral-600" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export const AutomationRuleEditor: React.FC<AutomationRuleEditorProps> = ({
  rule,
  onSave,
  onClose,
}) => {
  const isEditing = !!rule;

  const [name, setName] = useState(rule?.name ?? '');
  const [description, setDescription] = useState(rule?.description ?? '');
  const [trigger, setTrigger] = useState<AutomationTrigger>(
    rule?.trigger ?? { type: 'status_change', entityType: 'task', config: {} },
  );
  const [conditions, setConditions] = useState<AutomationCondition[]>(
    rule?.conditions ?? [],
  );
  const [actions, setActions] = useState<AutomationAction[]>(
    rule?.actions ?? [{ type: 'notify_user', config: {} }],
  );

  // ------- Trigger handlers -------
  const handleEntityChange = useCallback((entityType: EntityType) => {
    setTrigger((prev) => ({ ...prev, entityType }));
  }, []);

  const handleTriggerTypeChange = useCallback((type: TriggerType) => {
    setTrigger((prev) => ({ ...prev, type, config: {} }));
  }, []);

  const handleTriggerConfig = useCallback((key: string, value: string) => {
    setTrigger((prev) => ({
      ...prev,
      config: { ...prev.config, [key]: value },
    }));
  }, []);

  // ------- Condition handlers -------
  const addCondition = useCallback(() => {
    setConditions((prev) => [...prev, { field: '', operator: 'equals', value: '' }]);
  }, []);

  const removeCondition = useCallback((idx: number) => {
    setConditions((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  const updateCondition = useCallback(
    (idx: number, patch: Partial<AutomationCondition>) => {
      setConditions((prev) =>
        prev.map((c, i) => (i === idx ? { ...c, ...patch } : c)),
      );
    },
    [],
  );

  // ------- Action handlers -------
  const addAction = useCallback(() => {
    setActions((prev) => [...prev, { type: 'notify_user', config: {} }]);
  }, []);

  const removeAction = useCallback((idx: number) => {
    setActions((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  const updateActionType = useCallback((idx: number, type: ActionType) => {
    setActions((prev) =>
      prev.map((a, i) => (i === idx ? { ...a, type, config: {} } : a)),
    );
  }, []);

  const updateActionConfig = useCallback((idx: number, key: string, value: string) => {
    setActions((prev) =>
      prev.map((a, i) =>
        i === idx ? { ...a, config: { ...a.config, [key]: value } } : a,
      ),
    );
  }, []);

  // ------- Save -------
  const handleSave = useCallback(() => {
    const result: AutomationRule = {
      id: rule?.id ?? generateId(),
      name: name || t('automation.editor.untitledRule'),
      description: description || undefined,
      trigger,
      conditions,
      actions,
      enabled: rule?.enabled ?? true,
      createdAt: rule?.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      executionCount: rule?.executionCount ?? 0,
      lastRunAt: rule?.lastRunAt,
    };
    onSave(result);
  }, [rule, name, description, trigger, conditions, actions, onSave]);

  const triggerOptions = TRIGGER_OPTIONS.map((o) => ({ value: o.value, label: o.label, icon: o.icon }));
  const entityOptions = ENTITY_OPTIONS.map((o) => ({ value: o.value, label: o.label, icon: o.icon }));
  const actionOptions = ACTION_OPTIONS.map((o) => ({ value: o.value, label: o.label, icon: o.icon }));
  const operatorOptions = OPERATOR_OPTIONS.map((o) => ({ value: o.value, label: o.label }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-neutral-900 rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-700">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 rounded-t-2xl">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            {isEditing ? t('automation.editor.editRule') : t('automation.editor.createRule')}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Name & Description */}
          <div className="space-y-3">
            <TextInput
              value={name}
              onChange={setName}
              placeholder={t('automation.editor.namePlaceholder')}
              className="text-base font-medium"
            />
            <TextInput
              value={description}
              onChange={setDescription}
              placeholder={t('automation.editor.descriptionPlaceholder')}
            />
          </div>

          {/* WHEN — Trigger */}
          <SectionCard
            borderColor="border-l-4 !border-l-primary-500"
            icon={<Zap size={16} className="text-primary-500" />}
            title={t('automation.editor.when')}
          >
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">
                  {t('automation.editor.entity')}
                </label>
                <SelectDropdown
                  value={trigger.entityType}
                  options={entityOptions}
                  onChange={handleEntityChange}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">
                  {t('automation.editor.triggerType')}
                </label>
                <SelectDropdown
                  value={trigger.type}
                  options={triggerOptions}
                  onChange={handleTriggerTypeChange}
                />
              </div>
            </div>

            {/* Config fields for status_change */}
            {trigger.type === 'status_change' && (
              <div className="grid grid-cols-2 gap-3 mt-2">
                <TextInput
                  value={(trigger.config.fromStatus as string) ?? ''}
                  onChange={(v) => handleTriggerConfig('fromStatus', v)}
                  placeholder={t('automation.editor.fromStatus')}
                />
                <TextInput
                  value={(trigger.config.toStatus as string) ?? ''}
                  onChange={(v) => handleTriggerConfig('toStatus', v)}
                  placeholder={t('automation.editor.toStatus')}
                />
              </div>
            )}

            {/* Config fields for field_change */}
            {trigger.type === 'field_change' && (
              <div className="mt-2">
                <TextInput
                  value={(trigger.config.fieldName as string) ?? ''}
                  onChange={(v) => handleTriggerConfig('fieldName', v)}
                  placeholder={t('automation.editor.fieldName')}
                />
              </div>
            )}

            {/* Config for date_reached */}
            {trigger.type === 'date_reached' && (
              <div className="grid grid-cols-2 gap-3 mt-2">
                <TextInput
                  value={(trigger.config.dateField as string) ?? ''}
                  onChange={(v) => handleTriggerConfig('dateField', v)}
                  placeholder={t('automation.editor.dateField')}
                />
                <TextInput
                  value={(trigger.config.offsetDays as string) ?? ''}
                  onChange={(v) => handleTriggerConfig('offsetDays', v)}
                  placeholder={t('automation.editor.offsetDays')}
                />
              </div>
            )}
          </SectionCard>

          <FlowArrow />

          {/* IF — Conditions (optional) */}
          <SectionCard
            borderColor="border-l-4 !border-l-amber-500"
            icon={<Filter size={16} className="text-amber-500" />}
            title={`${t('automation.editor.if')} (${t('automation.editor.optional')})`}
          >
            {conditions.map((cond, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <TextInput
                  value={cond.field}
                  onChange={(v) => updateCondition(idx, { field: v })}
                  placeholder={t('automation.editor.condField')}
                  className="flex-1"
                />
                <SelectDropdown
                  value={cond.operator}
                  options={operatorOptions}
                  onChange={(v) => updateCondition(idx, { operator: v as ConditionOperator })}
                  className="w-36"
                />
                <TextInput
                  value={String(cond.value ?? '')}
                  onChange={(v) => updateCondition(idx, { value: v })}
                  placeholder={t('automation.editor.condValue')}
                  className="flex-1"
                />
                <button
                  onClick={() => removeCondition(idx)}
                  className="p-1.5 text-neutral-400 hover:text-danger-500 transition-colors flex-shrink-0"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            <button
              onClick={addCondition}
              className="flex items-center gap-1.5 text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
            >
              <Plus size={14} />
              {t('automation.editor.addCondition')}
            </button>
          </SectionCard>

          <FlowArrow />

          {/* THEN — Actions */}
          <SectionCard
            borderColor="border-l-4 !border-l-success-500"
            icon={<Play size={16} className="text-success-500" />}
            title={t('automation.editor.then')}
          >
            {actions.map((action, idx) => (
              <div
                key={idx}
                className="rounded-lg border border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/30 p-3 space-y-2"
              >
                <div className="flex items-center gap-2">
                  <SelectDropdown
                    value={action.type}
                    options={actionOptions}
                    onChange={(v) => updateActionType(idx, v as ActionType)}
                    className="flex-1"
                  />
                  {actions.length > 1 && (
                    <button
                      onClick={() => removeAction(idx)}
                      className="p-1.5 text-neutral-400 hover:text-danger-500 transition-colors flex-shrink-0"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>

                {/* Action-specific config */}
                {(action.type === 'notify_user' || action.type === 'assign_user') && (
                  <TextInput
                    value={(action.config.userId as string) ?? ''}
                    onChange={(v) => updateActionConfig(idx, 'userId', v)}
                    placeholder={t('automation.editor.userId')}
                  />
                )}
                {action.type === 'notify_channel' && (
                  <TextInput
                    value={(action.config.channel as string) ?? ''}
                    onChange={(v) => updateActionConfig(idx, 'channel', v)}
                    placeholder={t('automation.editor.channel')}
                  />
                )}
                {action.type === 'change_status' && (
                  <TextInput
                    value={(action.config.toStatus as string) ?? ''}
                    onChange={(v) => updateActionConfig(idx, 'toStatus', v)}
                    placeholder={t('automation.editor.toStatus')}
                  />
                )}
                {(action.type === 'notify_user' || action.type === 'send_email') && (
                  <TextInput
                    value={(action.config.message as string) ?? ''}
                    onChange={(v) => updateActionConfig(idx, 'message', v)}
                    placeholder={t('automation.editor.message')}
                  />
                )}
                {action.type === 'add_comment' && (
                  <TextInput
                    value={(action.config.comment as string) ?? ''}
                    onChange={(v) => updateActionConfig(idx, 'comment', v)}
                    placeholder={t('automation.editor.commentText')}
                  />
                )}
                {action.type === 'update_field' && (
                  <div className="grid grid-cols-2 gap-2">
                    <TextInput
                      value={(action.config.fieldName as string) ?? ''}
                      onChange={(v) => updateActionConfig(idx, 'fieldName', v)}
                      placeholder={t('automation.editor.fieldName')}
                    />
                    <TextInput
                      value={(action.config.fieldValue as string) ?? ''}
                      onChange={(v) => updateActionConfig(idx, 'fieldValue', v)}
                      placeholder={t('automation.editor.fieldValue')}
                    />
                  </div>
                )}
                {action.type === 'create_task' && (
                  <TextInput
                    value={(action.config.taskName as string) ?? ''}
                    onChange={(v) => updateActionConfig(idx, 'taskName', v)}
                    placeholder={t('automation.editor.taskName')}
                  />
                )}
              </div>
            ))}
            <button
              onClick={addAction}
              className="flex items-center gap-1.5 text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
            >
              <Plus size={14} />
              {t('automation.editor.addAction')}
            </button>
          </SectionCard>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 flex items-center justify-end gap-3 px-6 py-4 border-t border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-lg transition-colors"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
          >
            {t('common.save')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AutomationRuleEditor;
