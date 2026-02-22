import { apiClient } from './client';
import type { PaginatedResponse, PaginationParams } from '@/types';
import type {
  SafetyIncident,
  SafetyInspection,
  SafetyViolation,
  CreateIncidentRequest,
  IncidentStatus,
  SafetyTraining,
  TrainingStatus,
  TrainingType,
} from '@/modules/safety/types';

export type { SafetyTraining, TrainingStatus, TrainingType };

export interface SafetyFilters extends PaginationParams {
  status?: string;
  severity?: string;
  projectId?: string;
  search?: string;
}

export const safetyApi = {
  // Incidents
  getIncidents: async (params?: SafetyFilters): Promise<PaginatedResponse<SafetyIncident>> => {
    const response = await apiClient.get<PaginatedResponse<SafetyIncident>>('/safety/incidents', { params });
    return response.data;
  },

  getIncident: async (id: string): Promise<SafetyIncident> => {
    const response = await apiClient.get<SafetyIncident>(`/safety/incidents/${id}`);
    return response.data;
  },

  createIncident: async (data: CreateIncidentRequest): Promise<SafetyIncident> => {
    const response = await apiClient.post<SafetyIncident>('/safety/incidents', data);
    return response.data;
  },

  updateIncident: async (id: string, data: Partial<SafetyIncident>): Promise<SafetyIncident> => {
    const response = await apiClient.put<SafetyIncident>(`/safety/incidents/${id}`, data);
    return response.data;
  },

  changeIncidentStatus: async (id: string, status: IncidentStatus): Promise<SafetyIncident> => {
    const response = await apiClient.patch<SafetyIncident>(`/safety/incidents/${id}/status`, { status });
    return response.data;
  },

  // Inspections
  getInspections: async (params?: SafetyFilters): Promise<PaginatedResponse<SafetyInspection>> => {
    const response = await apiClient.get<PaginatedResponse<SafetyInspection>>('/safety/inspections', { params });
    return response.data;
  },

  getInspection: async (id: string): Promise<SafetyInspection> => {
    const response = await apiClient.get<SafetyInspection>(`/safety/inspections/${id}`);
    return response.data;
  },

  createInspection: async (data: {
    inspectionDate: string;
    inspectionType: string;
    projectId?: string;
    inspectorId?: string;
    inspectorName?: string;
    notes?: string;
  }): Promise<SafetyInspection> => {
    const response = await apiClient.post<SafetyInspection>('/safety/inspections', data);
    return response.data;
  },

  updateInspection: async (id: string, data: {
    inspectionDate?: string;
    inspectionType?: string;
    projectId?: string;
    inspectorId?: string;
    inspectorName?: string;
    notes?: string;
  }): Promise<SafetyInspection> => {
    const response = await apiClient.put<SafetyInspection>(`/safety/inspections/${id}`, data);
    return response.data;
  },

  // Violations
  getViolations: async (params?: SafetyFilters): Promise<PaginatedResponse<SafetyViolation>> => {
    const response = await apiClient.get<PaginatedResponse<SafetyViolation>>('/safety/violations', { params });
    return response.data;
  },

  getViolation: async (id: string): Promise<SafetyViolation> => {
    const response = await apiClient.get<SafetyViolation>(`/safety/violations/${id}`);
    return response.data;
  },

  resolveViolation: async (id: string, correctiveAction: string): Promise<SafetyViolation> => {
    const response = await apiClient.patch<SafetyViolation>(`/safety/violations/${id}/resolve`, { correctiveAction });
    return response.data;
  },

  deleteIncident: async (id: string): Promise<void> => {
    await apiClient.delete(`/safety/incidents/${id}`);
  },

  // Trainings
  getTrainings: async (params?: SafetyFilters): Promise<PaginatedResponse<SafetyTraining>> => {
    const response = await apiClient.get<PaginatedResponse<SafetyTraining>>('/safety/trainings', { params });
    return response.data;
  },

  getTraining: async (id: string): Promise<SafetyTraining> => {
    const response = await apiClient.get<SafetyTraining>(`/safety/trainings/${id}`);
    return response.data;
  },

  createTraining: async (data: {
    title: string;
    trainingType: TrainingType;
    projectId?: string;
    date: string;
    instructorId?: string;
    instructorName?: string;
    participants?: string;
    topics?: string;
    duration?: number;
    notes?: string;
  }): Promise<SafetyTraining> => {
    const response = await apiClient.post<SafetyTraining>('/safety/trainings', data);
    return response.data;
  },

  updateTraining: async (id: string, data: {
    title?: string;
    trainingType?: TrainingType;
    projectId?: string;
    date?: string;
    instructorId?: string;
    instructorName?: string;
    participants?: string;
    topics?: string;
    duration?: number;
    notes?: string;
  }): Promise<SafetyTraining> => {
    const response = await apiClient.put<SafetyTraining>(`/safety/trainings/${id}`, data);
    return response.data;
  },

  completeTraining: async (id: string): Promise<SafetyTraining> => {
    const response = await apiClient.patch<SafetyTraining>(`/safety/trainings/${id}/complete`);
    return response.data;
  },

  cancelTraining: async (id: string): Promise<SafetyTraining> => {
    const response = await apiClient.patch<SafetyTraining>(`/safety/trainings/${id}/cancel`);
    return response.data;
  },

  deleteTraining: async (id: string): Promise<void> => {
    await apiClient.delete(`/safety/trainings/${id}`);
  },
};
