// =============================================================================
// No-Code Automation Builder — Types, Registry & Preset Templates
// =============================================================================

import type React from 'react';
import {
  Bell,
  MessageSquare,
  RefreshCw,
  UserPlus,
  ClipboardList,
  Mail,
  PenTool,
  MessageCircle,
  Activity,
  GitPullRequest,
  CalendarClock,
  Plus,
  AlertTriangle,
  CheckCircle,
  FolderKanban,
  Banknote,
  Bug,
  FileText,
  ShoppingCart,
} from 'lucide-react';
import { t } from '@/i18n';

// ---------------------------------------------------------------------------
// Core Types
// ---------------------------------------------------------------------------

export type TriggerType =
  | 'status_change'
  | 'field_change'
  | 'date_reached'
  | 'item_created'
  | 'item_assigned'
  | 'approval_completed'
  | 'overdue';

export type ActionType =
  | 'notify_user'
  | 'notify_channel'
  | 'change_status'
  | 'assign_user'
  | 'create_task'
  | 'send_email'
  | 'update_field'
  | 'add_comment';

export type EntityType =
  | 'task'
  | 'project'
  | 'invoice'
  | 'defect'
  | 'document'
  | 'purchase_request';

export type ConditionOperator =
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'gt'
  | 'lt'
  | 'is_empty'
  | 'is_filled';

export interface AutomationTrigger {
  type: TriggerType;
  entityType: EntityType;
  config: Record<string, unknown>;
}

export interface AutomationCondition {
  field: string;
  operator: ConditionOperator;
  value: unknown;
}

export interface AutomationAction {
  type: ActionType;
  config: Record<string, unknown>;
}

export interface AutomationRule {
  id: string;
  name: string;
  description?: string;
  trigger: AutomationTrigger;
  conditions: AutomationCondition[];
  actions: AutomationAction[];
  enabled: boolean;
  createdAt: string;
  updatedAt?: string;
  executionCount: number;
  lastRunAt?: string;
}

// ---------------------------------------------------------------------------
// Option definitions (with lazy i18n labels)
// ---------------------------------------------------------------------------

export interface OptionDef<T extends string> {
  value: T;
  icon: React.ElementType;
  get label(): string;
}

function triggerOpt(value: TriggerType, icon: React.ElementType): OptionDef<TriggerType> {
  return { value, icon, get label() { return t(`automation.trigger.${value}`); } };
}

function actionOpt(value: ActionType, icon: React.ElementType): OptionDef<ActionType> {
  return { value, icon, get label() { return t(`automation.action.${value}`); } };
}

function entityOpt(value: EntityType, icon: React.ElementType): OptionDef<EntityType> {
  return { value, icon, get label() { return t(`automation.entity.${value}`); } };
}

// ---------------------------------------------------------------------------
// Trigger options
// ---------------------------------------------------------------------------

export const TRIGGER_OPTIONS: OptionDef<TriggerType>[] = [
  triggerOpt('status_change', RefreshCw),
  triggerOpt('field_change', PenTool),
  triggerOpt('date_reached', CalendarClock),
  triggerOpt('item_created', Plus),
  triggerOpt('item_assigned', UserPlus),
  triggerOpt('approval_completed', CheckCircle),
  triggerOpt('overdue', AlertTriangle),
];

// ---------------------------------------------------------------------------
// Action options
// ---------------------------------------------------------------------------

export const ACTION_OPTIONS: OptionDef<ActionType>[] = [
  actionOpt('notify_user', Bell),
  actionOpt('notify_channel', MessageSquare),
  actionOpt('change_status', RefreshCw),
  actionOpt('assign_user', UserPlus),
  actionOpt('create_task', ClipboardList),
  actionOpt('send_email', Mail),
  actionOpt('update_field', PenTool),
  actionOpt('add_comment', MessageCircle),
];

// ---------------------------------------------------------------------------
// Entity options
// ---------------------------------------------------------------------------

export const ENTITY_OPTIONS: OptionDef<EntityType>[] = [
  entityOpt('task', ClipboardList),
  entityOpt('project', FolderKanban),
  entityOpt('invoice', Banknote),
  entityOpt('defect', Bug),
  entityOpt('document', FileText),
  entityOpt('purchase_request', ShoppingCart),
];

// ---------------------------------------------------------------------------
// Condition operators
// ---------------------------------------------------------------------------

export interface OperatorDef {
  value: ConditionOperator;
  get label(): string;
}

export const OPERATOR_OPTIONS: OperatorDef[] = [
  { value: 'equals', get label() { return t('automation.operator.equals'); } },
  { value: 'not_equals', get label() { return t('automation.operator.not_equals'); } },
  { value: 'contains', get label() { return t('automation.operator.contains'); } },
  { value: 'gt', get label() { return t('automation.operator.gt'); } },
  { value: 'lt', get label() { return t('automation.operator.lt'); } },
  { value: 'is_empty', get label() { return t('automation.operator.is_empty'); } },
  { value: 'is_filled', get label() { return t('automation.operator.is_filled'); } },
];

// ---------------------------------------------------------------------------
// Preset templates (8 common recipes)
// ---------------------------------------------------------------------------

export interface PresetTemplate {
  id: string;
  icon: React.ElementType;
  get name(): string;
  get description(): string;
  rule: Omit<AutomationRule, 'id' | 'createdAt' | 'executionCount' | 'enabled'>;
}

export const PRESET_TEMPLATES: PresetTemplate[] = [
  {
    id: 'task_completed_notify',
    icon: CheckCircle,
    get name() { return t('automation.templates.taskCompletedNotify'); },
    get description() { return t('automation.templates.taskCompletedNotifyDesc'); },
    rule: {
      name: '',
      trigger: { type: 'status_change', entityType: 'task', config: { toStatus: 'DONE' } },
      conditions: [],
      actions: [{ type: 'notify_user', config: { role: 'manager', message: '' } }],
    },
  },
  {
    id: 'task_overdue_notify',
    icon: AlertTriangle,
    get name() { return t('automation.templates.taskOverdueNotify'); },
    get description() { return t('automation.templates.taskOverdueNotifyDesc'); },
    rule: {
      name: '',
      trigger: { type: 'overdue', entityType: 'task', config: {} },
      conditions: [],
      actions: [
        { type: 'notify_user', config: { role: 'assignee', message: '' } },
        { type: 'notify_user', config: { role: 'manager', message: '' } },
      ],
    },
  },
  {
    id: 'defect_created_assign',
    icon: Bug,
    get name() { return t('automation.templates.defectCreatedAssign'); },
    get description() { return t('automation.templates.defectCreatedAssignDesc'); },
    rule: {
      name: '',
      trigger: { type: 'item_created', entityType: 'defect', config: {} },
      conditions: [],
      actions: [{ type: 'assign_user', config: { role: 'quality_engineer' } }],
    },
  },
  {
    id: 'invoice_approved_status',
    icon: Banknote,
    get name() { return t('automation.templates.invoiceApprovedStatus'); },
    get description() { return t('automation.templates.invoiceApprovedStatusDesc'); },
    rule: {
      name: '',
      trigger: { type: 'approval_completed', entityType: 'invoice', config: {} },
      conditions: [],
      actions: [{ type: 'change_status', config: { toStatus: 'PAYMENT' } }],
    },
  },
  {
    id: 'purchase_request_notify',
    icon: ShoppingCart,
    get name() { return t('automation.templates.purchaseRequestNotify'); },
    get description() { return t('automation.templates.purchaseRequestNotifyDesc'); },
    rule: {
      name: '',
      trigger: { type: 'item_created', entityType: 'purchase_request', config: {} },
      conditions: [],
      actions: [{ type: 'notify_channel', config: { channel: 'procurement' } }],
    },
  },
  {
    id: 'document_uploaded_notify',
    icon: FileText,
    get name() { return t('automation.templates.documentUploadedNotify'); },
    get description() { return t('automation.templates.documentUploadedNotifyDesc'); },
    rule: {
      name: '',
      trigger: { type: 'item_created', entityType: 'document', config: {} },
      conditions: [],
      actions: [{ type: 'notify_channel', config: { channel: 'pto' } }],
    },
  },
  {
    id: 'project_status_notify',
    icon: Activity,
    get name() { return t('automation.templates.projectStatusNotify'); },
    get description() { return t('automation.templates.projectStatusNotifyDesc'); },
    rule: {
      name: '',
      trigger: { type: 'status_change', entityType: 'project', config: {} },
      conditions: [],
      actions: [{ type: 'notify_channel', config: { channel: 'team' } }],
    },
  },
  {
    id: 'task_assigned_notify',
    icon: GitPullRequest,
    get name() { return t('automation.templates.taskAssignedNotify'); },
    get description() { return t('automation.templates.taskAssignedNotifyDesc'); },
    rule: {
      name: '',
      trigger: { type: 'item_assigned', entityType: 'task', config: {} },
      conditions: [],
      actions: [{ type: 'notify_user', config: { role: 'assignee', message: '' } }],
    },
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function createEmptyRule(): Omit<AutomationRule, 'id' | 'createdAt' | 'executionCount'> {
  return {
    name: '',
    trigger: { type: 'status_change', entityType: 'task', config: {} },
    conditions: [],
    actions: [{ type: 'notify_user', config: {} }],
    enabled: true,
  };
}

export function generateId(): string {
  return `rule_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}
