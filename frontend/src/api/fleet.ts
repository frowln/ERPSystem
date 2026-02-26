import { apiClient } from './client';
import type { PaginatedResponse, PaginationParams } from '@/types';
import type {
  Waybill,
  FuelAccountingRecord,
  FuelSummary,
  MaintenanceScheduleRecord,
  GpsVehicleStatus,
  GpsVehicleTrack,
  GeofenceAlert,
  DriverRating,
  DriverDetail,
} from '@/modules/fleet/types';

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

export type WaybillStatus = 'DRAFT' | 'ISSUED' | 'IN_PROGRESS' | 'COMPLETED' | 'CLOSED';

export interface MaintenanceScheduleRule {
  id: string;
  name: string;
  description?: string;
  vehicleId?: string;
  vehicleName?: string;
  maintenanceType: string;
  maintenanceTypeDisplayName?: string;
  intervalHours?: number;
  intervalMileage?: number;
  intervalDays?: number;
  leadTimeHours?: number;
  leadTimeMileage?: number;
  leadTimeDays?: number;
  appliesToAllVehicles: boolean;
  isActive: boolean;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface MaintenanceDueItem {
  id: string;
  vehicleId: string;
  vehicleName: string;
  ruleId: string;
  ruleName: string;
  maintenanceType: string;
  triggerReason: string;
  currentHours?: number;
  thresholdHours?: number;
  currentMileage?: number;
  thresholdMileage?: number;
  overdue: boolean;
}

export interface ComplianceItem {
  vehicleId: string;
  vehicleCode: string;
  vehicleName: string;
  expiryDate: string;
  daysRemaining: number;
  expired: boolean;
}

export interface ComplianceDashboard {
  totalVehicles: number;
  overdueMaintenanceCount: number;
  approachingMaintenanceCount: number;
  expiredInsuranceCount: number;
  expiringInsuranceCount: number;
  expiredTechInspectionCount: number;
  expiringTechInspectionCount: number;
  insuranceAlerts: ComplianceItem[];
  techInspectionAlerts: ComplianceItem[];
}

export interface EquipmentUsageLog {
  id: string;
  vehicleId: string;
  vehicleName?: string;
  projectId?: string;
  projectName?: string;
  operatorName?: string;
  usageDate: string;
  hoursWorked: number;
  hoursStart?: number;
  hoursEnd?: number;
  fuelConsumed?: number;
  description?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface MachineHourRate {
  vehicleId: string;
  purchasePrice: number;
  usefulLifeYears: number;
  annualWorkingHours: number;
  fuelConsumptionRate: number;
  depreciationPerHour: number;
  annualDepreciation: number;
  fuelPerHour: number;
  annualFuelCost: number;
  maintenancePerHour: number;
  annualMaintenanceCost: number;
  insurancePerHour: number;
  annualInsuranceCost: number;
  operatorPerHour: number;
  annualOperatorCost: number;
  totalRatePerHour: number;
  annualTotalCost: number;
}

export interface OwnVsRent {
  vehicleId: string;
  ownRatePerHour: number;
  ownMonthlyCost: number;
  ownAnnualCost: number;
  marketRentalRatePerHour: number;
  rentMonthlyCost: number;
  rentAnnualCost: number;
  recommendation: 'OWN' | 'RENT' | 'NEUTRAL';
  savingsAnnual: number;
  savingsPercent: number;
}

export interface FleetWaybill {
  id: string;
  number: string;
  vehicleId: string;
  vehicleName?: string;
  vehicleLicensePlate?: string;
  projectId?: string;
  projectName?: string;
  waybillDate: string;
  driverName?: string;
  routeDescription?: string;
  departurePoint?: string;
  destinationPoint?: string;
  departureTime?: string;
  returnTime?: string;
  mileageStart?: number;
  mileageEnd?: number;
  distance?: number;
  engineHoursStart?: number;
  engineHoursEnd?: number;
  engineHoursWorked?: number;
  fuelDispensed?: number;
  fuelConsumed?: number;
  fuelNorm?: number;
  fuelRemaining?: number;
  fuelVariancePercent?: number;
  medicalExamPassed: boolean;
  medicalExaminer?: string;
  mechanicApproved: boolean;
  mechanicName?: string;
  notes?: string;
  status: WaybillStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface UsageLogFilters extends PaginationParams {
  vehicleId?: string;
  projectId?: string;
}

export interface WaybillFilters extends PaginationParams {
  status?: WaybillStatus;
  vehicleId?: string;
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

  // Maintenance Schedule
  getScheduleRules: async (params?: PaginationParams): Promise<PaginatedResponse<MaintenanceScheduleRule>> => {
    const response = await apiClient.get<PaginatedResponse<MaintenanceScheduleRule>>('/fleet/maintenance/schedule-rules', { params });
    return response.data;
  },

  createScheduleRule: async (data: Record<string, unknown>): Promise<MaintenanceScheduleRule> => {
    const response = await apiClient.post<MaintenanceScheduleRule>('/fleet/maintenance/schedule-rules', data);
    return response.data;
  },

  updateScheduleRule: async (id: string, data: Record<string, unknown>): Promise<MaintenanceScheduleRule> => {
    const response = await apiClient.put<MaintenanceScheduleRule>(`/fleet/maintenance/schedule-rules/${id}`, data);
    return response.data;
  },

  deleteScheduleRule: async (id: string): Promise<void> => {
    await apiClient.delete(`/fleet/maintenance/schedule-rules/${id}`);
  },

  toggleScheduleRule: async (id: string, active: boolean): Promise<MaintenanceScheduleRule> => {
    const response = await apiClient.patch<MaintenanceScheduleRule>(`/fleet/maintenance/schedule-rules/${id}/toggle`, { active });
    return response.data;
  },

  getDueMaintenanceItems: async (): Promise<MaintenanceDueItem[]> => {
    const response = await apiClient.get<MaintenanceDueItem[]>('/fleet/maintenance/due-items');
    return response.data;
  },

  getComplianceDashboard: async (): Promise<ComplianceDashboard> => {
    const response = await apiClient.get<ComplianceDashboard>('/fleet/maintenance/compliance');
    return response.data;
  },

  // Usage Logs
  getUsageLogs: async (params?: UsageLogFilters): Promise<PaginatedResponse<EquipmentUsageLog>> => {
    const response = await apiClient.get<PaginatedResponse<EquipmentUsageLog>>('/fleet/usage-logs', { params });
    return response.data;
  },

  getUsageLog: async (id: string): Promise<EquipmentUsageLog> => {
    const response = await apiClient.get<EquipmentUsageLog>(`/fleet/usage-logs/${id}`);
    return response.data;
  },

  createUsageLog: async (data: Record<string, unknown>): Promise<EquipmentUsageLog> => {
    const response = await apiClient.post<EquipmentUsageLog>('/fleet/usage-logs', data);
    return response.data;
  },

  updateUsageLog: async (id: string, data: Record<string, unknown>): Promise<EquipmentUsageLog> => {
    const response = await apiClient.put<EquipmentUsageLog>(`/fleet/usage-logs/${id}`, data);
    return response.data;
  },

  deleteUsageLog: async (id: string): Promise<void> => {
    await apiClient.delete(`/fleet/usage-logs/${id}`);
  },

  getMachineHourRate: async (vehicleId: string, fuelPrice?: number): Promise<MachineHourRate> => {
    const response = await apiClient.get<MachineHourRate>(`/fleet/vehicles/${vehicleId}/machine-hour-rate`, {
      params: fuelPrice != null ? { fuelPrice } : undefined,
    });
    return response.data;
  },

  getOwnVsRent: async (vehicleId: string, fuelPrice?: number): Promise<OwnVsRent> => {
    const response = await apiClient.get<OwnVsRent>(`/fleet/vehicles/${vehicleId}/own-vs-rent`, {
      params: fuelPrice != null ? { fuelPrice } : undefined,
    });
    return response.data;
  },

  // Waybills
  getWaybills: async (params?: WaybillFilters): Promise<PaginatedResponse<FleetWaybill>> => {
    const response = await apiClient.get<PaginatedResponse<FleetWaybill>>('/fleet/waybills', { params });
    return response.data;
  },

  getWaybill: async (id: string): Promise<FleetWaybill> => {
    const response = await apiClient.get<FleetWaybill>(`/fleet/waybills/${id}`);
    return response.data;
  },

  createWaybill: async (data: Record<string, unknown>): Promise<FleetWaybill> => {
    const response = await apiClient.post<FleetWaybill>('/fleet/waybills', data);
    return response.data;
  },

  updateWaybill: async (id: string, data: Record<string, unknown>): Promise<FleetWaybill> => {
    const response = await apiClient.put<FleetWaybill>(`/fleet/waybills/${id}`, data);
    return response.data;
  },

  changeWaybillStatus: async (id: string, status: WaybillStatus): Promise<FleetWaybill> => {
    const response = await apiClient.patch<FleetWaybill>(`/fleet/waybills/${id}/status`, { status });
    return response.data;
  },

  deleteWaybill: async (id: string): Promise<void> => {
    await apiClient.delete(`/fleet/waybills/${id}`);
  },

  // ---- Waybills (ESM-2) ----
  getWaybillsEsm: async (params?: PaginationParams & { status?: string }): Promise<PaginatedResponse<Waybill>> => {
    const response = await apiClient.get<PaginatedResponse<Waybill>>('/fleet/waybills-esm', { params });
    return response.data;
  },

  createWaybillEsm: async (data: Record<string, unknown>): Promise<Waybill> => {
    const response = await apiClient.post<Waybill>('/fleet/waybills-esm', data);
    return response.data;
  },

  completeWaybillEsm: async (id: string, data: Record<string, unknown>): Promise<Waybill> => {
    const response = await apiClient.patch<Waybill>(`/fleet/waybills-esm/${id}/complete`, data);
    return response.data;
  },

  changeWaybillEsmStatus: async (id: string, status: string): Promise<Waybill> => {
    const response = await apiClient.patch<Waybill>(`/fleet/waybills-esm/${id}/status`, { status });
    return response.data;
  },

  printWaybillEsm: async (id: string): Promise<Blob> => {
    const response = await apiClient.get(`/fleet/waybills-esm/${id}/print`, { responseType: 'blob' });
    return response.data;
  },

  // ---- Fuel Accounting ----
  getFuelAccountingRecords: async (params?: PaginationParams & { vehicleId?: string; fuelType?: string }): Promise<FuelAccountingRecord[]> => {
    const response = await apiClient.get<FuelAccountingRecord[]>('/fleet/fuel-accounting', { params });
    return response.data;
  },

  createFuelAccountingRecord: async (data: Record<string, unknown>): Promise<FuelAccountingRecord> => {
    const response = await apiClient.post<FuelAccountingRecord>('/fleet/fuel-accounting', data);
    return response.data;
  },

  getFuelSummary: async (period?: string): Promise<FuelSummary> => {
    const response = await apiClient.get<FuelSummary>('/fleet/fuel-accounting/summary', {
      params: period ? { period } : undefined,
    });
    return response.data;
  },

  // ---- Maintenance Schedule Records ----
  getMaintenanceScheduleRecords: async (params?: { status?: string; workType?: string }): Promise<MaintenanceScheduleRecord[]> => {
    const response = await apiClient.get<MaintenanceScheduleRecord[]>('/fleet/maintenance-schedule-records', { params });
    return response.data;
  },

  createMaintenanceScheduleRecord: async (data: Record<string, unknown>): Promise<MaintenanceScheduleRecord> => {
    const response = await apiClient.post<MaintenanceScheduleRecord>('/fleet/maintenance-schedule-records', data);
    return response.data;
  },

  completeMaintenanceRecord: async (id: string, data: Record<string, unknown>): Promise<MaintenanceScheduleRecord> => {
    const response = await apiClient.patch<MaintenanceScheduleRecord>(`/fleet/maintenance-schedule-records/${id}/complete`, data);
    return response.data;
  },

  // ---- GPS Tracking ----
  getGpsStatuses: async (): Promise<GpsVehicleStatus[]> => {
    const response = await apiClient.get<GpsVehicleStatus[]>('/fleet/gps/statuses');
    return response.data;
  },

  getVehicleTrack: async (vehicleId: string, date: string): Promise<GpsVehicleTrack> => {
    const response = await apiClient.get<GpsVehicleTrack>(`/fleet/gps/vehicles/${vehicleId}/track`, {
      params: { date },
    });
    return response.data;
  },

  getGeofenceAlerts: async (): Promise<GeofenceAlert[]> => {
    const response = await apiClient.get<GeofenceAlert[]>('/fleet/gps/geofence-alerts');
    return response.data;
  },

  // ---- Driver Ratings ----
  getDriverRatings: async (period?: string): Promise<DriverRating[]> => {
    const response = await apiClient.get<DriverRating[]>('/fleet/drivers/ratings', {
      params: period ? { period } : undefined,
    });
    return response.data;
  },

  getDriverDetail: async (driverId: string): Promise<DriverDetail> => {
    const response = await apiClient.get<DriverDetail>(`/fleet/drivers/${driverId}/detail`);
    return response.data;
  },
};
