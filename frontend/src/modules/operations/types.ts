export type DailyLogStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';

export type WeatherCondition =
  | 'CLEAR'
  | 'CLOUDY'
  | 'RAIN'
  | 'SNOW'
  | 'WIND'
  | 'FROST'
  | 'FOG';

export type WorkOrderStatus =
  | 'PLANNED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'ON_HOLD'
  | 'CANCELLED';

export type WorkOrderPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type ResourceType = 'LABOR' | 'EQUIPMENT' | 'MATERIAL';

export type ScheduleStatus = 'PLANNED' | 'CONFIRMED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

export interface DailyLog {
  id: string;
  number: string;
  logDate: string;
  projectId: string;
  projectName?: string;
  status: DailyLogStatus;
  weather: WeatherCondition;
  temperatureMin: number;
  temperatureMax: number;
  workersOnSite: number;
  equipmentOnSite: number;
  workDescription: string;
  issuesNotes?: string;
  safetyNotes?: string;
  visitorNotes?: string;
  supervisorId: string;
  supervisorName: string;
  approvedById?: string;
  approvedByName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DailyLogEntry {
  id: string;
  dailyLogId: string;
  workArea: string;
  workDescription: string;
  workersCount: number;
  hoursWorked: number;
  equipmentUsed?: string;
  percentComplete: number;
  notes?: string;
}

export interface WorkOrder {
  id: string;
  number: string;
  title: string;
  description: string;
  projectId: string;
  projectName?: string;
  status: WorkOrderStatus;
  priority: WorkOrderPriority;
  assignedToId: string;
  assignedToName: string;
  createdById: string;
  createdByName: string;
  plannedStartDate: string;
  plannedEndDate: string;
  actualStartDate?: string;
  actualEndDate?: string;
  workArea: string;
  estimatedHours: number;
  actualHours: number;
  percentComplete: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ResourceSchedule {
  id: string;
  resourceName: string;
  resourceType: ResourceType;
  projectId: string;
  projectName?: string;
  status: ScheduleStatus;
  scheduledDate: string;
  startTime?: string;
  endTime?: string;
  quantity: number;
  workArea: string;
  assignedToName?: string;
  notes?: string;
  createdAt: string;
}

export interface CreateDailyLogRequest {
  logDate: string;
  projectId: string;
  weather: WeatherCondition;
  temperatureMin: number;
  temperatureMax: number;
  workersOnSite: number;
  equipmentOnSite: number;
  workDescription: string;
  issuesNotes?: string;
  safetyNotes?: string;
  entries: Omit<DailyLogEntry, 'id' | 'dailyLogId'>[];
}

export interface CreateWorkOrderRequest {
  title: string;
  description: string;
  projectId: string;
  priority: WorkOrderPriority;
  assignedToId: string;
  plannedStartDate: string;
  plannedEndDate: string;
  workArea: string;
  estimatedHours: number;
}
