// Workflow types

export type WorkflowStatus = 'ACTIVE' | 'INACTIVE' | 'DRAFT';
export type EntityType = 'CONTRACT' | 'DOCUMENT' | 'PURCHASE_REQUEST' | 'INVOICE' | 'BUDGET' | 'CHANGE_ORDER';
export type TriggerType = 'STATUS_CHANGE' | 'FIELD_UPDATE' | 'TIME_BASED' | 'APPROVAL' | 'CREATION';
export type ActionType = 'SEND_NOTIFICATION' | 'ASSIGN_ROLE' | 'UPDATE_STATUS' | 'CREATE_TASK' | 'SEND_EMAIL' | 'WEBHOOK';
export type ExecutionStatus = 'SUCCESS' | 'FAILURE' | 'SKIPPED' | 'PENDING';

export interface WorkflowDefinition {
  id: string;
  name: string;
  description?: string;
  entityType: EntityType;
  status: WorkflowStatus;
  stepsCount: number;
  version: number;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowStep {
  id: string;
  workflowId: string;
  stepOrder: number;
  name: string;
  fromStatus: string;
  toStatus: string;
  requiredRole: string;
  slaHours?: number;
  isAutomatic: boolean;
  conditions?: string;
}

export interface AutomationRule {
  id: string;
  name: string;
  description?: string;
  entityType: EntityType;
  triggerType: TriggerType;
  actionType: ActionType;
  isEnabled: boolean;
  executionCount: number;
  lastExecutedAt?: string;
  conditions: string;
  actionConfig: string;
  createdByName: string;
  createdAt: string;
}

export interface AutomationExecution {
  id: string;
  ruleId: string;
  ruleName: string;
  entityType: EntityType;
  entityId: string;
  status: ExecutionStatus;
  triggerType: TriggerType;
  actionType: ActionType;
  startedAt: string;
  completedAt?: string;
  durationMs?: number;
  errorMessage?: string;
  inputData?: string;
  outputData?: string;
}
