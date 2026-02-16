import { apiClient } from '@/api/client';
import type { PaginatedResponse, PaginationParams } from '@/types';

export type RequestStatus = 'NEW' | 'ASSIGNED' | 'IN_PROGRESS' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED';
export type MaintenancePriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT' | 'CRITICAL';
export type EquipmentStatus = 'OPERATIONAL' | 'MAINTENANCE' | 'OUT_OF_SERVICE' | 'DECOMMISSIONED';

export interface MaintenanceRequest {
  id: string;
  number: string;
  title: string;
  description?: string;
  status: RequestStatus;
  priority: MaintenancePriority;
  equipmentId: string;
  equipmentName?: string;
  teamId?: string;
  teamName?: string;
  stageId?: string;
  stageName?: string;
  requestedById: string;
  requestedByName: string;
  assignedToId?: string;
  assignedToName?: string;
  dueDate?: string;
  completedAt?: string;
  estimatedHours?: number;
  actualHours?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MaintenanceEquipment {
  id: string;
  code: string;
  name: string;
  category?: string;
  status: EquipmentStatus;
  location?: string;
  manufacturer?: string;
  model?: string;
  serialNumber?: string;
  purchaseDate?: string;
  warrantyExpiry?: string;
  lastMaintenanceDate?: string;
  nextMaintenanceDate?: string;
  createdAt: string;
}

export interface MaintenanceTeam {
  id: string;
  name: string;
  leaderId?: string;
  leaderName?: string;
  memberCount: number;
  specialization?: string;
  isActive: boolean;
  createdAt: string;
}

export interface MaintenanceStage {
  id: string;
  name: string;
  sequence: number;
  color?: string;
}

export interface PreventiveSchedule {
  id: string;
  equipmentId: string;
  equipmentName?: string;
  taskDescription: string;
  frequencyType: string;
  frequencyValue: number;
  nextExecution: string;
  lastExecuted?: string;
  isActive: boolean;
  createdAt: string;
}

export interface MaintenanceDashboard {
  totalRequests: number;
  openRequests: number;
  overdueRequests: number;
  completedThisMonth: number;
  avgResolutionHours: number;
  equipmentCount: number;
  upcomingPreventive: number;
}

export interface MaintenanceRequestFilters extends PaginationParams {
  status?: RequestStatus;
  priority?: MaintenancePriority;
  equipmentId?: string;
  teamId?: string;
  search?: string;
}

export interface EquipmentFilters extends PaginationParams {
  status?: EquipmentStatus;
  category?: string;
  search?: string;
}

export const maintenanceApi = {
  // Requests
  getRequests: async (params?: MaintenanceRequestFilters): Promise<PaginatedResponse<MaintenanceRequest>> => {
    const response = await apiClient.get<PaginatedResponse<MaintenanceRequest>>('/v1/maintenance/requests', { params });
    return response.data;
  },

  getRequestById: async (id: string): Promise<MaintenanceRequest> => {
    const response = await apiClient.get<MaintenanceRequest>(`/v1/maintenance/requests/${id}`);
    return response.data;
  },

  createRequest: async (data: Partial<MaintenanceRequest>): Promise<MaintenanceRequest> => {
    const response = await apiClient.post<MaintenanceRequest>('/v1/maintenance/requests', data);
    return response.data;
  },

  updateRequestStatus: async (id: string, status: RequestStatus): Promise<MaintenanceRequest> => {
    const response = await apiClient.patch<MaintenanceRequest>(`/v1/maintenance/requests/${id}/status`, null, {
      params: { status },
    });
    return response.data;
  },

  updateRequestStage: async (id: string, stageId: string): Promise<MaintenanceRequest> => {
    const response = await apiClient.patch<MaintenanceRequest>(`/v1/maintenance/requests/${id}/stage`, null, {
      params: { stageId },
    });
    return response.data;
  },

  deleteRequest: async (id: string): Promise<void> => {
    await apiClient.delete(`/v1/maintenance/requests/${id}`);
  },

  getOverdueRequests: async (): Promise<MaintenanceRequest[]> => {
    const response = await apiClient.get<MaintenanceRequest[]>('/v1/maintenance/requests/overdue');
    return response.data;
  },

  // Equipment
  getEquipment: async (params?: EquipmentFilters): Promise<PaginatedResponse<MaintenanceEquipment>> => {
    const response = await apiClient.get<PaginatedResponse<MaintenanceEquipment>>('/v1/maintenance/equipment', { params });
    return response.data;
  },

  getEquipmentById: async (id: string): Promise<MaintenanceEquipment> => {
    const response = await apiClient.get<MaintenanceEquipment>(`/v1/maintenance/equipment/${id}`);
    return response.data;
  },

  createEquipment: async (data: Partial<MaintenanceEquipment>): Promise<MaintenanceEquipment> => {
    const response = await apiClient.post<MaintenanceEquipment>('/v1/maintenance/equipment', data);
    return response.data;
  },

  updateEquipment: async (id: string, data: Partial<MaintenanceEquipment>): Promise<MaintenanceEquipment> => {
    const response = await apiClient.put<MaintenanceEquipment>(`/v1/maintenance/equipment/${id}`, data);
    return response.data;
  },

  deleteEquipment: async (id: string): Promise<void> => {
    await apiClient.delete(`/v1/maintenance/equipment/${id}`);
  },

  // Teams
  getTeams: async (params?: PaginationParams & { search?: string }): Promise<PaginatedResponse<MaintenanceTeam>> => {
    const response = await apiClient.get<PaginatedResponse<MaintenanceTeam>>('/v1/maintenance/teams', { params });
    return response.data;
  },

  getTeamById: async (id: string): Promise<MaintenanceTeam> => {
    const response = await apiClient.get<MaintenanceTeam>(`/v1/maintenance/teams/${id}`);
    return response.data;
  },

  createTeam: async (data: Partial<MaintenanceTeam>): Promise<MaintenanceTeam> => {
    const response = await apiClient.post<MaintenanceTeam>('/v1/maintenance/teams', data);
    return response.data;
  },

  updateTeam: async (id: string, data: Partial<MaintenanceTeam>): Promise<MaintenanceTeam> => {
    const response = await apiClient.put<MaintenanceTeam>(`/v1/maintenance/teams/${id}`, data);
    return response.data;
  },

  deleteTeam: async (id: string): Promise<void> => {
    await apiClient.delete(`/v1/maintenance/teams/${id}`);
  },

  // Stages
  getStages: async (): Promise<MaintenanceStage[]> => {
    const response = await apiClient.get<MaintenanceStage[]>('/v1/maintenance/stages');
    return response.data;
  },

  // Schedules
  getSchedules: async (params?: PaginationParams & { equipmentId?: string }): Promise<PaginatedResponse<PreventiveSchedule>> => {
    const response = await apiClient.get<PaginatedResponse<PreventiveSchedule>>('/v1/maintenance/schedules', { params });
    return response.data;
  },

  getScheduleById: async (id: string): Promise<PreventiveSchedule> => {
    const response = await apiClient.get<PreventiveSchedule>(`/v1/maintenance/schedules/${id}`);
    return response.data;
  },

  createSchedule: async (data: Partial<PreventiveSchedule>): Promise<PreventiveSchedule> => {
    const response = await apiClient.post<PreventiveSchedule>('/v1/maintenance/schedules', data);
    return response.data;
  },

  deleteSchedule: async (id: string): Promise<void> => {
    await apiClient.delete(`/v1/maintenance/schedules/${id}`);
  },

  processSchedules: async (): Promise<{ createdRequests: number }> => {
    const response = await apiClient.post<{ createdRequests: number }>('/v1/maintenance/schedules/process');
    return response.data;
  },

  getUpcomingPreventive: async (): Promise<PreventiveSchedule[]> => {
    const response = await apiClient.get<PreventiveSchedule[]>('/v1/maintenance/schedules/upcoming');
    return response.data;
  },

  // Dashboard
  getDashboard: async (): Promise<MaintenanceDashboard> => {
    const response = await apiClient.get<MaintenanceDashboard>('/v1/maintenance/dashboard');
    return response.data;
  },
};
