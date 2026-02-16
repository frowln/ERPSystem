import { apiClient } from './client';

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'down';
  uptime: number;
  uptimeFormatted: string;
  lastChecked: string;
  version: string;
}

export interface ServiceStatus {
  name: string;
  status: 'up' | 'down' | 'degraded';
  responseTime: number;
  lastCheck: string;
  errorCount: number;
}

export interface ErrorLogEntry {
  id: string;
  timestamp: string;
  level: 'ERROR' | 'WARNING' | 'CRITICAL';
  message: string;
  service: string;
  stackTrace?: string;
  count: number;
}

export interface PerformanceMetric {
  timestamp: string;
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  requestsPerSecond: number;
  averageResponseTime: number;
}

export interface MonitoringDashboardData {
  systemHealth: SystemHealth;
  services: ServiceStatus[];
  recentErrors: ErrorLogEntry[];
  performanceMetrics: PerformanceMetric[];
}

export interface MonitoringFilters {
  dateFrom?: string;
  dateTo?: string;
  service?: string;
  level?: string;
}

export const monitoringApi = {
  getDashboardData: async (): Promise<MonitoringDashboardData> => {
    const response = await apiClient.get<MonitoringDashboardData>('/monitoring/dashboard');
    return response.data;
  },

  getSystemHealth: async (): Promise<SystemHealth> => {
    const response = await apiClient.get<SystemHealth>('/monitoring/health');
    return response.data;
  },

  getServices: async (): Promise<ServiceStatus[]> => {
    const response = await apiClient.get<ServiceStatus[]>('/monitoring/services');
    return response.data;
  },

  getErrorLogs: async (params?: MonitoringFilters): Promise<ErrorLogEntry[]> => {
    const response = await apiClient.get<ErrorLogEntry[]>('/monitoring/errors', { params });
    return response.data;
  },

  getPerformanceMetrics: async (params?: MonitoringFilters): Promise<PerformanceMetric[]> => {
    const response = await apiClient.get<PerformanceMetric[]>('/monitoring/performance', { params });
    return response.data;
  },

  acknowledgeError: async (errorId: string): Promise<void> => {
    await apiClient.post(`/monitoring/errors/${errorId}/acknowledge`);
  },
};
