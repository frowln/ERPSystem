import { apiClient } from './client';
import type { PaginatedResponse, PaginationParams } from '@/types';
import type { CrmLead, LeadStatus, LeadPriority, CrmStage, CrmTeam, CrmActivity } from '@/modules/crm/types';

export interface CrmLeadFilters extends PaginationParams {
  status?: LeadStatus;
  priority?: LeadPriority;
  stageId?: string;
  teamId?: string;
  search?: string;
}

export const crmApi = {
  getLeads: async (params?: CrmLeadFilters): Promise<PaginatedResponse<CrmLead>> => {
    const response = await apiClient.get<PaginatedResponse<CrmLead>>('/v1/crm/leads', { params });
    return response.data;
  },

  getLead: async (id: string): Promise<CrmLead> => {
    const response = await apiClient.get<CrmLead>(`/v1/crm/leads/${id}`);
    return response.data;
  },

  createLead: async (data: Partial<CrmLead>): Promise<CrmLead> => {
    const response = await apiClient.post<CrmLead>('/v1/crm/leads', data);
    return response.data;
  },

  updateLead: async (id: string, data: Partial<CrmLead>): Promise<CrmLead> => {
    const response = await apiClient.put<CrmLead>(`/v1/crm/leads/${id}`, data);
    return response.data;
  },

  moveLeadToStage: async (id: string, stageId: string): Promise<CrmLead> => {
    const response = await apiClient.patch<CrmLead>(`/v1/crm/leads/${id}/stage`, { stageId });
    return response.data;
  },

  getStages: async (): Promise<CrmStage[]> => {
    const response = await apiClient.get<CrmStage[]>('/v1/crm/stages');
    return response.data;
  },

  getTeams: async (): Promise<CrmTeam[]> => {
    const response = await apiClient.get<CrmTeam[]>('/v1/crm/teams');
    return response.data;
  },

  getActivities: async (leadId: string): Promise<CrmActivity[]> => {
    const response = await apiClient.get<CrmActivity[]>(`/v1/crm/leads/${leadId}/activities`);
    return response.data;
  },

  createActivity: async (leadId: string, data: Partial<CrmActivity>): Promise<CrmActivity> => {
    const response = await apiClient.post<CrmActivity>(`/v1/crm/leads/${leadId}/activities`, data);
    return response.data;
  },

  deleteLead: async (id: string): Promise<void> => {
    await apiClient.delete(`/v1/crm/leads/${id}`);
  },
};
