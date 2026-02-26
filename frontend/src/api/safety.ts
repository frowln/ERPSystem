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
  SafetyMetrics,
  MetricsPeriod,
  TrainingRecord,
  CreateTrainingRecordRequest,
  PpeItem,
  PpeIssue,
  IssuePpeRequest,
  ReturnPpeRequest,
  SoutCard,
  AccidentActN1,
  AccidentActStatus,
  CreateAccidentActRequest,
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

  // ---------------------------------------------------------------------------
  // Safety Metrics (LTIR/TRIR)
  // ---------------------------------------------------------------------------
  getMetrics: async (period?: MetricsPeriod): Promise<SafetyMetrics> => {
    const response = await apiClient.get<SafetyMetrics>('/safety/metrics', {
      params: period ? { period } : undefined,
    });
    return response.data;
  },

  // ---------------------------------------------------------------------------
  // Training Journal (records per-employee)
  // ---------------------------------------------------------------------------
  getTrainingRecords: async (params?: SafetyFilters): Promise<PaginatedResponse<TrainingRecord>> => {
    const response = await apiClient.get<PaginatedResponse<TrainingRecord>>('/safety/training-records', { params });
    return response.data;
  },

  createTrainingRecord: async (data: CreateTrainingRecordRequest): Promise<TrainingRecord> => {
    const response = await apiClient.post<TrainingRecord>('/safety/training-records', data);
    return response.data;
  },

  // ---------------------------------------------------------------------------
  // PPE Management (СИЗ)
  // ---------------------------------------------------------------------------
  getPpeInventory: async (params?: SafetyFilters): Promise<PaginatedResponse<PpeItem>> => {
    const response = await apiClient.get<PaginatedResponse<PpeItem>>('/safety/ppe/inventory', { params });
    return response.data;
  },

  getPpeIssues: async (params?: SafetyFilters): Promise<PaginatedResponse<PpeIssue>> => {
    const response = await apiClient.get<PaginatedResponse<PpeIssue>>('/safety/ppe/issues', { params });
    return response.data;
  },

  issuePpe: async (data: IssuePpeRequest): Promise<PpeIssue> => {
    const response = await apiClient.post<PpeIssue>('/safety/ppe/issues', data);
    return response.data;
  },

  returnPpe: async (id: string, data: ReturnPpeRequest): Promise<PpeIssue> => {
    const response = await apiClient.patch<PpeIssue>(`/safety/ppe/issues/${id}/return`, data);
    return response.data;
  },

  // ---------------------------------------------------------------------------
  // SOUT Cards (Спецоценка условий труда)
  // ---------------------------------------------------------------------------
  getSoutCards: async (params?: SafetyFilters): Promise<PaginatedResponse<SoutCard>> => {
    const response = await apiClient.get<PaginatedResponse<SoutCard>>('/safety/sout', { params });
    return response.data;
  },

  getSoutCard: async (id: string): Promise<SoutCard> => {
    const response = await apiClient.get<SoutCard>(`/safety/sout/${id}`);
    return response.data;
  },

  // ---------------------------------------------------------------------------
  // Accident Investigation Act N-1
  // ---------------------------------------------------------------------------
  getAccidentActs: async (params?: SafetyFilters): Promise<PaginatedResponse<AccidentActN1>> => {
    const response = await apiClient.get<PaginatedResponse<AccidentActN1>>('/safety/accident-acts', { params });
    return response.data;
  },

  getAccidentAct: async (id: string): Promise<AccidentActN1> => {
    const response = await apiClient.get<AccidentActN1>(`/safety/accident-acts/${id}`);
    return response.data;
  },

  createAccidentAct: async (data: CreateAccidentActRequest): Promise<AccidentActN1> => {
    const response = await apiClient.post<AccidentActN1>('/safety/accident-acts', data);
    return response.data;
  },

  updateAccidentActStatus: async (id: string, status: AccidentActStatus): Promise<AccidentActN1> => {
    const response = await apiClient.patch<AccidentActN1>(`/safety/accident-acts/${id}/status`, { status });
    return response.data;
  },
};
