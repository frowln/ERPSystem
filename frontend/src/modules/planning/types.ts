// Planning / WBS types

export type WbsNodeType = 'PROJECT' | 'PHASE' | 'WORK_PACKAGE' | 'ACTIVITY' | 'MILESTONE';
export type BaselineStatus = 'DRAFT' | 'APPROVED' | 'ACTIVE' | 'SUPERSEDED';

export interface WbsNode {
  id: string;
  code: string;
  name: string;
  nodeType: WbsNodeType;
  parentId: string | null;
  projectId: string;
  level: number;
  plannedStartDate: string;
  plannedEndDate: string;
  actualStartDate?: string;
  actualEndDate?: string;
  percentComplete: number;
  totalFloat: number;
  isCriticalPath: boolean;
  budgetedCost: number;
  actualCost: number;
  earnedValue: number;
  children?: WbsNode[];
  isExpanded?: boolean;
}

export interface ScheduleBaseline {
  id: string;
  name: string;
  projectId: string;
  projectName?: string;
  status: BaselineStatus;
  baselineDate: string;
  totalActivities: number;
  plannedStartDate: string;
  plannedEndDate: string;
  totalBudget: number;
  notes?: string;
  createdAt: string;
}

export interface EvmMetrics {
  projectId: string;
  projectName: string;
  dataDate: string;
  bac: number; // Budget at Completion
  pv: number;  // Planned Value
  ev: number;  // Earned Value
  ac: number;  // Actual Cost
  sv: number;  // Schedule Variance
  cv: number;  // Cost Variance
  spi: number; // Schedule Performance Index
  cpi: number; // Cost Performance Index
  eac: number; // Estimate at Completion
  etc: number; // Estimate to Complete
  vac: number; // Variance at Completion
  tcpiEac: number;
  percentComplete: number;
  sCurveData: SCurveDataPoint[];
}

export interface SCurveDataPoint {
  period: string;
  pv: number;
  ev: number;
  ac: number;
}

export interface ResourceAllocation {
  id: string;
  wbsCode: string;
  wbsName: string;
  resourceName: string;
  resourceType: 'LABOR' | 'EQUIPMENT' | 'MATERIAL';
  plannedHours: number;
  actualHours: number;
  utilization: number;
  period: string;
  costRate: number;
  plannedCost: number;
  actualCost: number;
}

export interface EvmTrendPoint {
  snapshotDate: string;
  pv: number;
  ev: number;
  ac: number;
  spi: number;
  cpi: number;
  eac: number;
  etc: number;
}

export interface EacMethods {
  projectId: string;
  bac: number;
  eacCpi: number;
  eacSpiCpi: number;
  eacBottom: number;
  ieac: number;
}

export interface WorkVolumeSummary {
  wbsNodeId: string;
  wbsCode: string;
  wbsName: string;
  nodeType: string;
  unitOfMeasure: string;
  plannedVolume: number;
  actualVolume: number;
  remainingVolume: number;
  todayVolume: number;
  percentComplete: number;
  entries: WorkVolumeEntry[];
}

export interface WorkVolumeEntry {
  id: string;
  wbsNodeId: string;
  date: string;
  quantity: number;
  notes?: string;
  createdBy?: string;
}
