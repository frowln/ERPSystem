export type RequestStatus = 'NEW' | 'IN_PROGRESS' | 'REPAIRED' | 'SCRAP' | 'CANCELLED';
export type MaintenancePriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type MaintenanceType = 'CORRECTIVE' | 'PREVENTIVE' | 'PREDICTIVE';

export interface MaintenanceRequest {
  id: string;
  number: string;
  name: string;
  description?: string;
  equipmentId: string;
  equipmentName: string;
  maintenanceType: MaintenanceType;
  status: RequestStatus;
  priority: MaintenancePriority;
  teamId?: string;
  teamName?: string;
  assignedToId?: string;
  assignedToName?: string;
  requestedById: string;
  requestedByName: string;
  scheduledDate?: string;
  completedDate?: string;
  duration?: number;
  cost?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MaintenanceEquipment {
  id: string;
  code: string;
  name: string;
  category: string;
  location?: string;
  projectName?: string;
  status: 'OPERATIONAL' | 'MAINTENANCE' | 'OUT_OF_SERVICE' | 'RETIRED';
  serialNumber?: string;
  manufacturer?: string;
  model?: string;
  purchaseDate?: string;
  warrantyExpiry?: string;
  lastMaintenanceDate?: string;
  nextMaintenanceDate?: string;
  maintenanceCount: number;
  totalCost: number;
  assignedTeamName?: string;
  createdAt: string;
}

export interface MaintenanceTeam {
  id: string;
  name: string;
  leadName: string;
  memberCount: number;
  activeRequests: number;
  completedRequests: number;
  specialization?: string;
  isActive: boolean;
  createdAt: string;
}

export interface PreventiveSchedule {
  id: string;
  equipmentId: string;
  equipmentName: string;
  name: string;
  intervalDays: number;
  lastExecutedDate?: string;
  nextScheduledDate: string;
  teamName?: string;
  isActive: boolean;
  estimatedDuration: number;
  estimatedCost: number;
}
