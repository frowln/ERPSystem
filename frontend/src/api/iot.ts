import { apiClient } from './client';
import type { PaginatedResponse, PaginationParams } from '@/types';
import type { IoTDevice, SensorReading, AlertRule, IoTAlert, DeviceStatus, SensorType } from '@/modules/iot/types';

export interface DeviceFilters extends PaginationParams {
  status?: DeviceStatus;
  sensorType?: SensorType;
  projectId?: string;
  search?: string;
}

export const iotApi = {
  getDevices: async (params?: DeviceFilters): Promise<PaginatedResponse<IoTDevice>> => {
    const response = await apiClient.get<PaginatedResponse<IoTDevice>>('/iot/devices', { params });
    return response.data;
  },

  getDevice: async (id: string): Promise<IoTDevice> => {
    const response = await apiClient.get<IoTDevice>(`/iot/devices/${id}`);
    return response.data;
  },

  createDevice: async (data: Partial<IoTDevice>): Promise<IoTDevice> => {
    const response = await apiClient.post<IoTDevice>('/iot/devices', data);
    return response.data;
  },

  updateDevice: async (id: string, data: Partial<IoTDevice>): Promise<IoTDevice> => {
    const response = await apiClient.put<IoTDevice>(`/iot/devices/${id}`, data);
    return response.data;
  },

  getDeviceReadings: async (deviceId: string, params?: { from?: string; to?: string; limit?: number }): Promise<SensorReading[]> => {
    const response = await apiClient.get<SensorReading[]>(`/iot/devices/${deviceId}/readings`, { params });
    return response.data;
  },

  getAlertRules: async (): Promise<AlertRule[]> => {
    const response = await apiClient.get<AlertRule[]>('/iot/alert-rules');
    return response.data;
  },

  createAlertRule: async (data: Partial<AlertRule>): Promise<AlertRule> => {
    const response = await apiClient.post<AlertRule>('/iot/alert-rules', data);
    return response.data;
  },

  updateAlertRule: async (id: string, data: Partial<AlertRule>): Promise<AlertRule> => {
    const response = await apiClient.put<AlertRule>(`/iot/alert-rules/${id}`, data);
    return response.data;
  },

  deleteAlertRule: async (id: string): Promise<void> => {
    await apiClient.delete(`/iot/alert-rules/${id}`);
  },

  getAlerts: async (params?: PaginationParams): Promise<PaginatedResponse<IoTAlert>> => {
    const response = await apiClient.get<PaginatedResponse<IoTAlert>>('/iot/alerts', { params });
    return response.data;
  },

  acknowledgeAlert: async (id: string): Promise<IoTAlert> => {
    const response = await apiClient.patch<IoTAlert>(`/iot/alerts/${id}/acknowledge`);
    return response.data;
  },
};
