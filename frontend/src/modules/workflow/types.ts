// Workflow types — aligned with backend DTOs

export type WorkflowStatus = 'ACTIVE' | 'INACTIVE' | 'DRAFT';
export type EntityType = 'CONTRACT' | 'DOCUMENT' | 'PURCHASE_REQUEST' | 'INVOICE' | 'BUDGET' | 'CHANGE_ORDER';
export type TriggerType = 'MANUAL' | 'ON_CREATE' | 'ON_STATUS_CHANGE' | 'ON_FIELD_CHANGE' | 'SCHEDULED';
export type ActionType = 'CHANGE_STATUS' | 'SEND_NOTIFICATION' | 'ASSIGN_USER' | 'CREATE_TASK' | 'SEND_EMAIL' | 'WEBHOOK';
export type ExecutionStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'SKIPPED';

export interface WorkflowDefinition {
  id: string;
  name: string;
  description?: string;
  entityType: string;
  isActive: boolean;
  organizationId?: string;
  createdById?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowStep {
  id: string;
  workflowDefinitionId: string;
  name: string;
  description?: string;
  actionType?: string;
  actionConfig?: string;
  fromStatus: string;
  toStatus: string;
  requiredRole: string;
  approverIds?: string;
  slaHours?: number;
  sortOrder: number;
  conditions?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AutomationRule {
  id: string;
  name: string;
  description?: string;
  entityType: string;
  triggerType: TriggerType;
  triggerTypeDisplayName?: string;
  triggerCondition?: string;
  actionType: ActionType;
  actionTypeDisplayName?: string;
  actionConfig?: string;
  isActive: boolean;
  organizationId?: string;
  priority?: number;
  lastExecutedAt?: string;
  executionCount: number;
  createdAt: string;
  updatedAt?: string;
}

export interface AutomationExecution {
  id: string;
  automationRuleId: string;
  entityId: string;
  entityType: string;
  executionStatus: ExecutionStatus;
  executionStatusDisplayName?: string;
  startedAt: string;
  completedAt?: string;
  triggerData?: string;
  resultData?: string;
  errorMessage?: string;
  createdAt: string;
}

// Approval inbox types
export type ApprovalInstanceStatus = 'IN_PROGRESS' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'ESCALATED';

export interface ApprovalInstance {
  id: string;
  entityType: string;
  entityId: string;
  entityNumber?: string;
  workflowName?: string;
  currentStepName?: string;
  currentStepOrder?: number;
  status: ApprovalInstanceStatus;
  slaDeadline?: string;
  isOverdue?: boolean;
  notes?: string;
  createdAt: string;
  completedAt?: string;
  updatedAt?: string;
}

// Condition builder types
export type ConditionOperator = 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'in_list';
export type ConditionLogic = 'AND' | 'OR';

export interface ConditionRow {
  id: string;
  field: string;
  operator: ConditionOperator;
  value: string;
}

export interface ConditionGroup {
  id: string;
  logic: ConditionLogic;
  conditions: ConditionRow[];
}

export interface ConditionConfig {
  logic: ConditionLogic;
  groups: ConditionGroup[];
}

// Rule template types
export type RuleTemplateCategory = 'APPROVAL' | 'NOTIFICATION' | 'ASSIGNMENT' | 'ESCALATION' | 'BUDGET';

export interface RuleTemplate {
  id: string;
  name: string;
  description: string;
  category: RuleTemplateCategory;
  icon: string;
  triggerType: TriggerType;
  actionType: ActionType;
  defaultConditions: ConditionConfig;
  defaultActionConfig: Record<string, unknown>;
}
