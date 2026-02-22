import { apiClient } from './client';
import type { PaginatedResponse, PaginationParams } from '@/types';

export type ReportDataSource =
  | 'PROJECTS' | 'CONTRACTS' | 'INVOICES' | 'PAYMENTS'
  | 'EMPLOYEES' | 'MATERIALS' | 'DAILY_LOGS' | 'QUALITY_CHECKS'
  | 'SAFETY_INCIDENTS' | 'KS2_DOCUMENTS' | 'TASKS' | 'PURCHASE_REQUESTS';

export type ChartType = 'NONE' | 'BAR' | 'LINE' | 'PIE' | 'AREA' | 'STACKED_BAR';
export type OutputFormat = 'JSON' | 'PDF' | 'XLSX';
export type ExecutionStatus = 'RUNNING' | 'COMPLETED' | 'FAILED';

export interface ColumnDef {
  field: string;
  label: string;
  visible: boolean;
  sortOrder?: number;
}

export interface FilterDef {
  field: string;
  operator: string;
  value: string;
}

export interface ReportTemplate {
  id: string;
  name: string;
  description?: string;
  dataSource: ReportDataSource;
  columnsJson?: string;
  filtersJson?: string;
  groupByJson?: string;
  sortByJson?: string;
  chartType: ChartType;
  chartConfigJson?: string;
  isPublic: boolean;
  scheduleEnabled: boolean;
  scheduleCron?: string;
  scheduleRecipients?: string;
  lastRunAt?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReportTemplateRequest {
  name: string;
  description?: string;
  dataSource: ReportDataSource;
  columnsJson?: string;
  filtersJson?: string;
  groupByJson?: string;
  sortByJson?: string;
  chartType?: ChartType;
  chartConfigJson?: string;
  isPublic?: boolean;
  scheduleEnabled?: boolean;
  scheduleCron?: string;
  scheduleRecipients?: string;
}

export interface ReportExecution {
  id: string;
  templateId: string;
  executedById?: string;
  parametersJson?: string;
  rowCount?: number;
  executionTimeMs?: number;
  outputFormat: OutputFormat;
  outputPath?: string;
  status: ExecutionStatus;
  errorMessage?: string;
  createdAt: string;
}

export interface DataSourceInfo {
  id: ReportDataSource;
  label: string;
  description: string;
  fieldCount: number;
}

export interface FieldInfo {
  name: string;
  label: string;
  type: 'STRING' | 'NUMBER' | 'DATE' | 'BOOLEAN';
  filterable: boolean;
  sortable: boolean;
  groupable: boolean;
}

export const reportBuilderApi = {
  getTemplates: async (params?: PaginationParams): Promise<PaginatedResponse<ReportTemplate>> => {
    const response = await apiClient.get<PaginatedResponse<ReportTemplate>>('/analytics/report-builder/templates', { params });
    return response.data;
  },

  getTemplate: async (id: string): Promise<ReportTemplate> => {
    const response = await apiClient.get(`/analytics/report-builder/templates/${id}`);
    return response.data.data ?? response.data;
  },

  createTemplate: async (data: CreateReportTemplateRequest): Promise<ReportTemplate> => {
    const response = await apiClient.post('/analytics/report-builder/templates', data);
    return response.data.data ?? response.data;
  },

  updateTemplate: async (id: string, data: CreateReportTemplateRequest): Promise<ReportTemplate> => {
    const response = await apiClient.put(`/analytics/report-builder/templates/${id}`, data);
    return response.data.data ?? response.data;
  },

  deleteTemplate: async (id: string): Promise<void> => {
    await apiClient.delete(`/analytics/report-builder/templates/${id}`);
  },

  duplicateTemplate: async (id: string): Promise<ReportTemplate> => {
    const response = await apiClient.post(`/analytics/report-builder/templates/${id}/duplicate`);
    return response.data.data ?? response.data;
  },

  executeReport: async (id: string, outputFormat?: OutputFormat): Promise<ReportExecution> => {
    const response = await apiClient.post(`/analytics/report-builder/templates/${id}/execute`, { outputFormat: outputFormat || 'JSON' });
    return response.data.data ?? response.data;
  },

  getExecutionHistory: async (id: string, params?: PaginationParams): Promise<PaginatedResponse<ReportExecution>> => {
    const response = await apiClient.get<PaginatedResponse<ReportExecution>>(`/analytics/report-builder/templates/${id}/history`, { params });
    return response.data;
  },

  getDataSources: async (): Promise<DataSourceInfo[]> => {
    const response = await apiClient.get('/analytics/report-builder/data-sources');
    return response.data.data ?? response.data;
  },

  getFields: async (source: ReportDataSource): Promise<FieldInfo[]> => {
    const response = await apiClient.get(`/analytics/report-builder/data-sources/${source}/fields`);
    return response.data.data ?? response.data;
  },
};
