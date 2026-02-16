import { apiClient } from './client';
import type { PaginatedResponse, PaginationParams } from '@/types';

export type VehicleType = 'EXCAVATOR' | 'CRANE' | 'TRUCK' | 'LOADER' | 'BULLDOZER' | 'CONCRETE_MIXER' | 'GENERATOR' | 'COMPRESSOR' | 'OTHER';
export type VehicleStatus = 'AVAILABLE' | 'IN_USE' | 'MAINTENANCE' | 'REPAIR' | 'DECOMMISSIONED';

export interface Vehicle {
  id: string;
  code: string;
  name: string;
  type: VehicleType;
  licensePlate?: string;
  status: VehicleStatus;
  projectId?: string;
  projectName?: string;
  brand: string;
  model: string;
  year: number;
  photoUrl?: string;
  nextMaintenanceDate?: string;
  lastMaintenanceDate?: string;
  fuelType: string;
  operatingHours: number;
  currentOperator?: string;
  createdAt: string;
}

export interface VehicleAssignment {
  id: string;
  vehicleId: string;
  projectId: string;
  projectName: string;
  operatorName: string;
  startDate: string;
  endDate?: string;
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  hoursUsed: number;
}

export interface MaintenanceRecord {
  id: string;
  vehicleId: string;
  type: 'SCHEDULED' | 'REPAIR' | 'INSPECTION';
  description: string;
  scheduledDate: string;
  completedDate?: string;
  cost: number;
  performedBy: string;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED';
  notes?: string;
}

export interface FuelRecord {
  id: string;
  vehicleId: string;
  date: string;
  quantity: number;
  unitPrice: number;
  totalCost: number;
  fuelType: string;
  odometer?: number;
  filledBy: string;
}

export interface InspectionRecord {
  id: string;
  vehicleId: string;
  date: string;
  inspectorName: string;
  result: 'PASSED' | 'FAILED' | 'CONDITIONAL';
  notes: string;
  nextInspectionDate: string;
}

export interface VehicleFilters extends PaginationParams {
  type?: VehicleType;
  status?: VehicleStatus;
  search?: string;
  projectId?: string;
}

export const fleetApi = {
  getVehicles: async (params?: VehicleFilters): Promise<PaginatedResponse<Vehicle>> => {
    const response = await apiClient.get<PaginatedResponse<Vehicle>>('/fleet/vehicles', { params });
    return response.data;
  },

  getVehicle: async (id: string): Promise<Vehicle> => {
    const response = await apiClient.get<Vehicle>(`/fleet/vehicles/${id}`);
    return response.data;
  },

  createVehicle: async (data: Partial<Vehicle>): Promise<Vehicle> => {
    const response = await apiClient.post<Vehicle>('/fleet/vehicles', data);
    return response.data;
  },

  updateVehicle: async (id: string, data: Partial<Vehicle>): Promise<Vehicle> => {
    const response = await apiClient.put<Vehicle>(`/fleet/vehicles/${id}`, data);
    return response.data;
  },

  getAssignments: async (vehicleId: string): Promise<VehicleAssignment[]> => {
    const response = await apiClient.get<VehicleAssignment[]>(`/fleet/vehicles/${vehicleId}/assignments`);
    return response.data;
  },

  getMaintenanceRecords: async (vehicleId: string): Promise<MaintenanceRecord[]> => {
    const response = await apiClient.get<MaintenanceRecord[]>(`/fleet/maintenance/history/${vehicleId}`);
    return response.data;
  },

  getFuelRecords: async (vehicleId: string): Promise<FuelRecord[]> => {
    const response = await apiClient.get<FuelRecord[]>(`/fleet/fuel/history/${vehicleId}`);
    return response.data;
  },

  getInspections: async (vehicleId: string): Promise<InspectionRecord[]> => {
    const response = await apiClient.get<InspectionRecord[]>(`/fleet/inspections`, { params: { vehicleId } });
    return response.data;
  },

  deleteVehicle: async (id: string): Promise<void> => {
    await apiClient.delete(`/fleet/vehicles/${id}`);
  },
};
