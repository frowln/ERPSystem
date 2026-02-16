import { apiClient } from '@/api/client';
import type { PaginatedResponse, PaginationParams } from '@/types';

export type LeadStatus = 'NEW' | 'QUALIFIED' | 'PROPOSITION' | 'NEGOTIATION' | 'WON' | 'LOST';
export type LeadPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';
export type ActivityType = 'CALL' | 'MEETING' | 'EMAIL' | 'TASK' | 'NOTE';

export interface CrmLead {
  id: string;
  title: string;
  companyName?: string;
  contactName: string;
  contactEmail?: string;
  contactPhone?: string;
  status: LeadStatus;
  priority: LeadPriority;
  stageId?: string;
  stageName?: string;
  teamId?: string;
  teamName?: string;
  assignedToId?: string;
  assignedToName?: string;
  expectedRevenue?: number;
  probability?: number;
  source?: string;
  lostReason?: string;
  projectId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CrmStage {
  id: string;
  name: string;
  sequence: number;
  probability: number;
  leadCount: number;
}

export interface CrmTeam {
  id: string;
  name: string;
  leaderId?: string;
  leaderName?: string;
  memberCount: number;
  isActive: boolean;
}

export interface CrmActivity {
  id: string;
  leadId: string;
  type: ActivityType;
  summary: string;
  description?: string;
  scheduledAt?: string;
  completedAt?: string;
  result?: string;
  assignedToId: string;
  assignedToName: string;
  createdAt: string;
}

export interface CrmPipeline {
  stages: CrmStage[];
  totalLeads: number;
  totalRevenue: number;
  conversionRate: number;
}

export interface CrmLeadFilters extends PaginationParams {
  status?: LeadStatus;
  priority?: LeadPriority;
  stageId?: string;
  teamId?: string;
  assignedToId?: string;
  search?: string;
}

export const crmApi = {
  // Leads
  getLeads: async (params?: CrmLeadFilters): Promise<PaginatedResponse<CrmLead>> => {
    const response = await apiClient.get<PaginatedResponse<CrmLead>>('/v1/crm/leads', { params });
    return response.data;
  },

  getLeadById: async (id: string): Promise<CrmLead> => {
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

  deleteLead: async (id: string): Promise<void> => {
    await apiClient.delete(`/v1/crm/leads/${id}`);
  },

  moveToStage: async (id: string, stageId: string): Promise<CrmLead> => {
    const response = await apiClient.patch<CrmLead>(`/v1/crm/leads/${id}/stage/${stageId}`);
    return response.data;
  },

  markAsWon: async (id: string): Promise<CrmLead> => {
    const response = await apiClient.post<CrmLead>(`/v1/crm/leads/${id}/won`);
    return response.data;
  },

  markAsLost: async (id: string, reason?: string): Promise<CrmLead> => {
    const response = await apiClient.post<CrmLead>(`/v1/crm/leads/${id}/lost`, null, {
      params: reason ? { reason } : undefined,
    });
    return response.data;
  },

  convertToProject: async (id: string, data: { projectName: string; projectCode: string }): Promise<CrmLead> => {
    const response = await apiClient.post<CrmLead>(`/v1/crm/leads/${id}/convert`, data);
    return response.data;
  },

  // Stages
  getStages: async (): Promise<CrmStage[]> => {
    const response = await apiClient.get<CrmStage[]>('/v1/crm/stages');
    return response.data;
  },

  createStage: async (data: Partial<CrmStage>): Promise<CrmStage> => {
    const response = await apiClient.post<CrmStage>('/v1/crm/stages', data);
    return response.data;
  },

  // Teams
  getTeams: async (): Promise<CrmTeam[]> => {
    const response = await apiClient.get<CrmTeam[]>('/v1/crm/teams');
    return response.data;
  },

  createTeam: async (data: Partial<CrmTeam>): Promise<CrmTeam> => {
    const response = await apiClient.post<CrmTeam>('/v1/crm/teams', data);
    return response.data;
  },

  // Activities
  getActivities: async (leadId: string): Promise<CrmActivity[]> => {
    const response = await apiClient.get<CrmActivity[]>(`/v1/crm/leads/${leadId}/activities`);
    return response.data;
  },

  createActivity: async (data: Partial<CrmActivity>): Promise<CrmActivity> => {
    const response = await apiClient.post<CrmActivity>('/v1/crm/activities', data);
    return response.data;
  },

  completeActivity: async (id: string, result?: string): Promise<CrmActivity> => {
    const response = await apiClient.post<CrmActivity>(`/v1/crm/activities/${id}/complete`, null, {
      params: result ? { result } : undefined,
    });
    return response.data;
  },

  // Pipeline
  getPipeline: async (): Promise<CrmPipeline> => {
    const response = await apiClient.get<CrmPipeline>('/v1/crm/pipeline');
    return response.data;
  },
};
