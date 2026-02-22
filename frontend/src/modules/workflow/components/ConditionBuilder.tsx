import React, { useCallback } from 'react';
import { Plus, Trash2, Copy } from 'lucide-react';
import { Button } from '@/design-system/components/Button';
import { Input, Select } from '@/design-system/components/FormField';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';
import type {
  ConditionConfig,
  ConditionGroup,
  ConditionRow,
  ConditionOperator,
  ConditionLogic,
} from '../types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let _idCounter = 0;
function genId(): string {
  _idCounter += 1;
  return `cond_${Date.now()}_${_idCounter}`;
}

function createEmptyRow(): ConditionRow {
  return { id: genId(), field: 'status', operator: 'equals', value: '' };
}

function createEmptyGroup(): ConditionGroup {
  return { id: genId(), logic: 'AND', conditions: [createEmptyRow()] };
}

export function createEmptyConfig(): ConditionConfig {
  return { logic: 'AND', groups: [createEmptyGroup()] };
}

// ---------------------------------------------------------------------------
// Field / operator option builders (localised)
// ---------------------------------------------------------------------------

function getFieldOptions() {
  return [
    { value: 'status', label: t('workflow.conditionBuilder.fieldStatus') },
    { value: 'amount', label: t('workflow.conditionBuilder.fieldAmount') },
    { value: 'priority', label: t('workflow.conditionBuilder.fieldPriority') },
    { value: 'assignee', label: t('workflow.conditionBuilder.fieldAssignee') },
    { value: 'department', label: t('workflow.conditionBuilder.fieldDepartment') },
    { value: 'entityType', label: t('workflow.conditionBuilder.fieldEntityType') },
    { value: 'createdBy', label: t('workflow.conditionBuilder.fieldCreatedBy') },
    { value: 'dueDate', label: t('workflow.conditionBuilder.fieldDueDate') },
  ];
}

function getOperatorOptions() {
  return [
    { value: 'equals', label: t('workflow.conditionBuilder.opEquals') },
    { value: 'not_equals', label: t('workflow.conditionBuilder.opNotEquals') },
    { value: 'greater_than', label: t('workflow.conditionBuilder.opGreaterThan') },
    { value: 'less_than', label: t('workflow.conditionBuilder.opLessThan') },
    { value: 'contains', label: t('workflow.conditionBuilder.opContains') },
    { value: 'in_list', label: t('workflow.conditionBuilder.opInList') },
  ];
}

function getLogicOptions() {
  return [
    { value: 'AND', label: t('workflow.conditionBuilder.logicAnd') },
    { value: 'OR', label: t('workflow.conditionBuilder.logicOr') },
  ];
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface ConditionRowEditorProps {
  row: ConditionRow;
  onUpdate: (id: string, patch: Partial<ConditionRow>) => void;
  onRemove: (id: string) => void;
  canRemove: boolean;
}

const ConditionRowEditor: React.FC<ConditionRowEditorProps> = ({
  row,
  onUpdate,
  onRemove,
  canRemove,
}) => {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Select
        options={getFieldOptions()}
        value={row.field}
        onChange={(e) => onUpdate(row.id, { field: e.target.value })}
        className="w-40"
        aria-label={t('workflow.conditionBuilder.fieldLabel')}
      />
      <Select
        options={getOperatorOptions()}
        value={row.operator}
        onChange={(e) => onUpdate(row.id, { operator: e.target.value as ConditionOperator })}
        className="w-40"
        aria-label={t('workflow.conditionBuilder.operatorLabel')}
      />
      <Input
        value={row.value}
        onChange={(e) => onUpdate(row.id, { value: e.target.value })}
        placeholder={t('workflow.conditionBuilder.valuePlaceholder')}
        className="w-44"
        aria-label={t('workflow.conditionBuilder.valueLabel')}
      />
      {canRemove && (
        <Button
          variant="ghost"
          size="xs"
          onClick={() => onRemove(row.id)}
          aria-label={t('workflow.conditionBuilder.removeCondition')}
        >
          <Trash2 size={14} className="text-neutral-400 hover:text-danger-600" />
        </Button>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------

interface ConditionGroupEditorProps {
  group: ConditionGroup;
  groupIndex: number;
  onUpdateGroup: (groupId: string, patch: Partial<ConditionGroup>) => void;
  onUpdateRow: (groupId: string, rowId: string, patch: Partial<ConditionRow>) => void;
  onRemoveRow: (groupId: string, rowId: string) => void;
  onAddRow: (groupId: string) => void;
  onRemoveGroup: (groupId: string) => void;
  onDuplicateGroup: (groupId: string) => void;
  canRemoveGroup: boolean;
}

const ConditionGroupEditor: React.FC<ConditionGroupEditorProps> = ({
  group,
  groupIndex,
  onUpdateGroup,
  onUpdateRow,
  onRemoveRow,
  onAddRow,
  onRemoveGroup,
  onDuplicateGroup,
  canRemoveGroup,
}) => {
  return (
    <div className={cn(
      'rounded-lg border p-4',
      'border-neutral-200 dark:border-neutral-700',
      'bg-neutral-50 dark:bg-neutral-800/50',
    )}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
            {t('workflow.conditionBuilder.groupLabel', { index: String(groupIndex + 1) })}
          </span>
          <Select
            options={getLogicOptions()}
            value={group.logic}
            onChange={(e) => onUpdateGroup(group.id, { logic: e.target.value as ConditionLogic })}
            className="w-24 !h-7 !text-xs"
            aria-label={t('workflow.conditionBuilder.groupLogicLabel')}
          />
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="xs"
            onClick={() => onDuplicateGroup(group.id)}
            aria-label={t('workflow.conditionBuilder.duplicateGroup')}
          >
            <Copy size={14} className="text-neutral-400" />
          </Button>
          {canRemoveGroup && (
            <Button
              variant="ghost"
              size="xs"
              onClick={() => onRemoveGroup(group.id)}
              aria-label={t('workflow.conditionBuilder.removeGroup')}
            >
              <Trash2 size={14} className="text-neutral-400 hover:text-danger-600" />
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-2">
        {group.conditions.map((row, rowIdx) => (
          <React.Fragment key={row.id}>
            {rowIdx > 0 && (
              <div className="flex items-center gap-2 pl-2">
                <span className="text-xs font-medium text-primary-600 dark:text-primary-400 uppercase">
                  {group.logic === 'AND'
                    ? t('workflow.conditionBuilder.logicAnd')
                    : t('workflow.conditionBuilder.logicOr')}
                </span>
                <div className="flex-1 border-t border-dashed border-neutral-300 dark:border-neutral-600" />
              </div>
            )}
            <ConditionRowEditor
              row={row}
              onUpdate={(rowId, patch) => onUpdateRow(group.id, rowId, patch)}
              onRemove={(rowId) => onRemoveRow(group.id, rowId)}
              canRemove={group.conditions.length > 1}
            />
          </React.Fragment>
        ))}
      </div>

      <Button
        variant="ghost"
        size="xs"
        className="mt-3"
        iconLeft={<Plus size={14} />}
        onClick={() => onAddRow(group.id)}
      >
        {t('workflow.conditionBuilder.addCondition')}
      </Button>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main ConditionBuilder component
// ---------------------------------------------------------------------------

interface ConditionBuilderProps {
  value: ConditionConfig;
  onChange: (config: ConditionConfig) => void;
  className?: string;
}

export const ConditionBuilder: React.FC<ConditionBuilderProps> = ({
  value,
  onChange,
  className,
}) => {
  // --- group-level logic ---
  const updateGroupLogic = useCallback(
    (logic: ConditionLogic) => {
      onChange({ ...value, logic });
    },
    [value, onChange],
  );

  const addGroup = useCallback(() => {
    onChange({ ...value, groups: [...value.groups, createEmptyGroup()] });
  }, [value, onChange]);

  const removeGroup = useCallback(
    (groupId: string) => {
      onChange({ ...value, groups: value.groups.filter((g) => g.id !== groupId) });
    },
    [value, onChange],
  );

  const duplicateGroup = useCallback(
    (groupId: string) => {
      const source = value.groups.find((g) => g.id === groupId);
      if (!source) return;
      const cloned: ConditionGroup = {
        id: genId(),
        logic: source.logic,
        conditions: source.conditions.map((c) => ({ ...c, id: genId() })),
      };
      const idx = value.groups.findIndex((g) => g.id === groupId);
      const updated = [...value.groups];
      updated.splice(idx + 1, 0, cloned);
      onChange({ ...value, groups: updated });
    },
    [value, onChange],
  );

  const updateGroup = useCallback(
    (groupId: string, patch: Partial<ConditionGroup>) => {
      onChange({
        ...value,
        groups: value.groups.map((g) => (g.id === groupId ? { ...g, ...patch } : g)),
      });
    },
    [value, onChange],
  );

  // --- row-level ---
  const updateRow = useCallback(
    (groupId: string, rowId: string, patch: Partial<ConditionRow>) => {
      onChange({
        ...value,
        groups: value.groups.map((g) => {
          if (g.id !== groupId) return g;
          return {
            ...g,
            conditions: g.conditions.map((r) => (r.id === rowId ? { ...r, ...patch } : r)),
          };
        }),
      });
    },
    [value, onChange],
  );

  const removeRow = useCallback(
    (groupId: string, rowId: string) => {
      onChange({
        ...value,
        groups: value.groups.map((g) => {
          if (g.id !== groupId) return g;
          return { ...g, conditions: g.conditions.filter((r) => r.id !== rowId) };
        }),
      });
    },
    [value, onChange],
  );

  const addRow = useCallback(
    (groupId: string) => {
      onChange({
        ...value,
        groups: value.groups.map((g) => {
          if (g.id !== groupId) return g;
          return { ...g, conditions: [...g.conditions, createEmptyRow()] };
        }),
      });
    },
    [value, onChange],
  );

  return (
    <div className={cn('space-y-4', className)}>
      {/* Top-level logic selector */}
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
          {t('workflow.conditionBuilder.matchLabel')}
        </span>
        <Select
          options={getLogicOptions()}
          value={value.logic}
          onChange={(e) => updateGroupLogic(e.target.value as ConditionLogic)}
          className="w-28"
          aria-label={t('workflow.conditionBuilder.topLevelLogicLabel')}
        />
        <span className="text-sm text-neutral-500 dark:text-neutral-400">
          {t('workflow.conditionBuilder.groupsOfConditions')}
        </span>
      </div>

      {/* Condition groups */}
      <div className="space-y-3">
        {value.groups.map((group, gIdx) => (
          <React.Fragment key={group.id}>
            {gIdx > 0 && (
              <div className="flex items-center gap-2">
                <div className="flex-1 border-t border-dashed border-neutral-300 dark:border-neutral-600" />
                <span className="text-xs font-semibold text-primary-600 dark:text-primary-400 uppercase px-2">
                  {value.logic === 'AND'
                    ? t('workflow.conditionBuilder.logicAnd')
                    : t('workflow.conditionBuilder.logicOr')}
                </span>
                <div className="flex-1 border-t border-dashed border-neutral-300 dark:border-neutral-600" />
              </div>
            )}
            <ConditionGroupEditor
              group={group}
              groupIndex={gIdx}
              onUpdateGroup={updateGroup}
              onUpdateRow={updateRow}
              onRemoveRow={removeRow}
              onAddRow={addRow}
              onRemoveGroup={removeGroup}
              onDuplicateGroup={duplicateGroup}
              canRemoveGroup={value.groups.length > 1}
            />
          </React.Fragment>
        ))}
      </div>

      {/* Add group button */}
      <Button
        variant="outline"
        size="sm"
        iconLeft={<Plus size={14} />}
        onClick={addGroup}
      >
        {t('workflow.conditionBuilder.addGroup')}
      </Button>
    </div>
  );
};
