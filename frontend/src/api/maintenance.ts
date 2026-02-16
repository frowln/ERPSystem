import { apiClient } from './client';
import type { PaginatedResponse, PaginationParams } from '@/types';
import type { MaintenanceRequest, RequestStatus, MaintenancePriority, MaintenanceEquipment, MaintenanceTeam, PreventiveSchedule } from '@/modules/maintenance/types';

export interface MaintenanceRequestFilters extends PaginationParams {
  status?: RequestStatus;
  priority?: MaintenancePriority;
  equipmentId?: string;
  teamId?: string;
  search?: string;
}

export interface EquipmentFilters extends PaginationParams {
  status?: string;
  category?: string;
  search?: string;
}

export const maintenanceApi = {
  getRequests: async (params?: MaintenanceRequestFilters): Promise<PaginatedResponse<MaintenanceRequest>> => {
    const response = await apiClient.get<PaginatedResponse<MaintenanceRequest>>('/v1/maintenance/requests', { params });
    return response.data;
  },

  getRequest: async (id: string): Promise<MaintenanceRequest> => {
    const response = await apiClient.get<MaintenanceRequest>(`/v1/maintenance/requests/${id}`);
    return response.data;
  },

  createRequest: async (data: Partial<MaintenanceRequest>): Promise<MaintenanceRequest> => {
    const response = await apiClient.post<MaintenanceRequest>('/v1/maintenance/requests', data);
    return response.data;
  },

  updateRequestStatus: async (id: string, status: RequestStatus): Promise<MaintenanceRequest> => {
    const response = await apiClient.patch<MaintenanceRequest>(`/v1/maintenance/requests/${id}/status`, { status });
    return response.data;
  },

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

  getTeams: async (): Promise<MaintenanceTeam[]> => {
    const response = await apiClient.get<MaintenanceTeam[]>('/v1/maintenance/teams');
    return response.data;
  },

  getSchedules: async (equipmentId?: string): Promise<PreventiveSchedule[]> => {
    const response = await apiClient.get<PreventiveSchedule[]>('/v1/maintenance/schedules', { params: { equipmentId } });
    return response.data;
  },

  createSchedule: async (data: Partial<PreventiveSchedule>): Promise<PreventiveSchedule> => {
    const response = await apiClient.post<PreventiveSchedule>('/v1/maintenance/schedules', data);
    return response.data;
  },

  deleteRequest: async (id: string): Promise<void> => {
    await apiClient.delete(`/v1/maintenance/requests/${id}`);
  },
};
