import { apiClient } from '@/api/client';
import type { PaginatedResponse, PaginationParams } from '@/types';
import type { IoTDevice, SensorReading, IoTAlert, DeviceStatus, AlertSeverity } from './types';

export interface DeviceFilters extends PaginationParams {
  projectId?: string;
  status?: DeviceStatus;
}

export interface SensorDataFilters extends PaginationParams {
  // pageable defaults handled by backend
}

export interface AlertFilters extends PaginationParams {
  deviceId?: string;
  status?: string;
}

export const iotApi = {
  // ---- Devices ----

  getDevices: async (params?: DeviceFilters): Promise<PaginatedResponse<IoTDevice>> => {
    const response = await apiClient.get<PaginatedResponse<IoTDevice>>('/iot/devices', { params });
    return response.data;
  },

  getDeviceById: async (id: string): Promise<IoTDevice> => {
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

  deleteDevice: async (id: string): Promise<void> => {
    await apiClient.delete(`/iot/devices/${id}`);
  },

  // ---- Sensor Data ----

  getSensorData: async (deviceId: string, params?: SensorDataFilters): Promise<PaginatedResponse<SensorReading>> => {
    const response = await apiClient.get<PaginatedResponse<SensorReading>>(`/iot/devices/${deviceId}/data`, { params });
    return response.data;
  },

  ingestSensorData: async (data: { deviceId: string; sensorType: string; value: number; unit: string }): Promise<SensorReading> => {
    const response = await apiClient.post<SensorReading>('/iot/data', data);
    return response.data;
  },

  // ---- Alerts ----

  getAlerts: async (params?: AlertFilters): Promise<PaginatedResponse<IoTAlert>> => {
    const response = await apiClient.get<PaginatedResponse<IoTAlert>>('/iot/alerts', { params });
    return response.data;
  },

  acknowledgeAlert: async (id: string, userId: string): Promise<IoTAlert> => {
    const response = await apiClient.patch<IoTAlert>(`/iot/alerts/${id}/acknowledge`, null, { params: { userId } });
    return response.data;
  },

  resolveAlert: async (id: string): Promise<IoTAlert> => {
    const response = await apiClient.patch<IoTAlert>(`/iot/alerts/${id}/resolve`);
    return response.data;
  },
};
