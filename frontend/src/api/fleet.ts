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

// ---------------------------------------------------------------------------
// Backend response type interfaces (for field mapping)
// ---------------------------------------------------------------------------

/** Shape returned by GET /api/fleet/fuel (FuelRecordResponse.java) */
interface BackendFuelRecord {
  id: string;
  vehicleId: string;
  operatorId?: string;
  projectId?: string;
  fuelDate: string;
  quantity: number;
  pricePerUnit: number;
  totalCost: number;
  mileageAtFuel?: number;
  hoursAtFuel?: number;
  fuelStation?: string;
  receiptNumber?: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
}

/** Shape returned by GET /api/fleet/maintenance (MaintenanceRecordResponse.java) */
interface BackendMaintenanceRecord {
  id: string;
  vehicleId: string;
  maintenanceType: string;
  maintenanceTypeDisplayName?: string;
  description: string;
  startDate?: string;
  endDate?: string;
  status: string;
  statusDisplayName?: string;
  cost?: number;
  performedById?: string;
  vendor?: string;
  mileageAtService?: number;
  hoursAtService?: number;
  nextServiceMileage?: number;
  nextServiceHours?: number;
  nextServiceDate?: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
}

// ---------------------------------------------------------------------------
// Mapping functions: backend response → frontend types
// ---------------------------------------------------------------------------

/** Map FleetWaybillResponse → Waybill (ESM-2 frontend type) */
function mapWaybillToEsm(w: FleetWaybill): Waybill {
  return {
    id: w.id,
    number: w.number ?? '',
    vehicleId: w.vehicleId ?? '',
    vehicleName: w.vehicleName ?? '',
    driverName: w.driverName ?? '',
    date: w.waybillDate ?? '',
    routeFrom: w.departurePoint ?? undefined,
    routeTo: w.destinationPoint ?? undefined,
    routeDescription: w.routeDescription ?? undefined,
    departureTime: w.departureTime ?? '',
    returnTime: w.returnTime ?? undefined,
    mileageStart: w.mileageStart ?? 0,
    mileageEnd: w.mileageEnd ?? undefined,
    totalMileage: w.distance ?? undefined,
    odometerStart: w.engineHoursStart ?? undefined,
    odometerEnd: w.engineHoursEnd ?? undefined,
    fuelDispensed: w.fuelDispensed ?? undefined,
    fuelConsumed: w.fuelConsumed ?? undefined,
    fuelNorm: w.fuelNorm ?? undefined,
    status: (w.status as Waybill['status']) ?? 'DRAFT',
    medicalExamPassed: w.medicalExamPassed ?? undefined,
    mechanicApproved: w.mechanicApproved ?? undefined,
    createdAt: w.createdAt ?? undefined,
  };
}

/** Map ESM create form data → backend CreateFleetWaybillRequest shape */
function mapEsmCreateToWaybill(data: Record<string, unknown>): Record<string, unknown> {
  return {
    number: data.number,
    vehicleId: data.vehicleId,
    driverName: data.driverName,
    waybillDate: data.date,
    departurePoint: data.routeFrom,
    destinationPoint: data.routeTo,
    routeDescription: data.routeDescription,
    departureTime: data.departureTime,
    mileageStart: data.mileageStart,
    status: data.status ?? 'DRAFT',
  };
}

/** Map BackendFuelRecord → FuelAccountingRecord (frontend type) */
function mapFuelRecordToAccounting(r: BackendFuelRecord): FuelAccountingRecord {
  return {
    id: r.id,
    vehicleId: r.vehicleId ?? '',
    vehicleName: r.createdBy ?? '',
    fuelType: 'diesel',
    refuelDate: r.fuelDate ?? '',
    liters: r.quantity ?? 0,
    cost: r.totalCost ?? 0,
    costPerLiter: r.pricePerUnit ?? undefined,
    station: r.fuelStation ?? '',
    mileageAtRefuel: r.mileageAtFuel ?? 0,
    consumptionPer100km: undefined,
    normPer100km: 10,
    deviation: undefined,
    driverName: undefined,
  };
}

/** Map fuel accounting create form → backend CreateFuelRecordRequest shape */
function mapAccountingCreateToFuel(data: Record<string, unknown>): Record<string, unknown> {
  return {
    vehicleId: data.vehicleId,
    fuelDate: data.refuelDate,
    quantity: data.liters,
    pricePerUnit: data.cost && data.liters ? Number(data.cost) / Number(data.liters) : 0,
    totalCost: data.cost,
    fuelStation: data.station,
    mileageAtFuel: data.mileageAtRefuel,
  };
}

/** Map BackendMaintenanceRecord → MaintenanceScheduleRecord (frontend type) */
function mapMaintenanceToScheduleRecord(r: BackendMaintenanceRecord): MaintenanceScheduleRecord {
  const statusMap: Record<string, MaintenanceScheduleRecord['status']> = {
    SCHEDULED: 'SCHEDULED',
    IN_PROGRESS: 'IN_PROGRESS',
    COMPLETED: 'COMPLETED',
    CANCELLED: 'COMPLETED',
    OVERDUE: 'OVERDUE',
  };
  return {
    id: r.id,
    vehicleId: r.vehicleId ?? '',
    vehicleName: r.vendor ?? '',
    maintenanceType: 'scheduled',
    workType: (r.maintenanceType as MaintenanceScheduleRecord['workType']) ?? 'GENERAL_INSPECTION',
    description: r.description ?? '',
    scheduledDate: r.startDate ?? undefined,
    actualDate: r.endDate ?? undefined,
    status: statusMap[r.status] ?? 'SCHEDULED',
    cost: r.cost ?? undefined,
    mechanicName: r.createdBy ?? undefined,
    notes: undefined,
    createdAt: r.createdAt ?? undefined,
  };
}

/** Map maintenance schedule create form → backend CreateMaintenanceRequest shape */
function mapScheduleCreateToMaintenance(data: Record<string, unknown>): Record<string, unknown> {
  return {
    vehicleId: data.vehicleId,
    maintenanceType: data.workType ?? 'SCHEDULED_MAINTENANCE',
    description: data.description,
    startDate: data.scheduledDate,
    estimatedCost: data.estimatedCost,
  };
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

  // Maintenance Schedule — uses /fleet/maintenance-schedule backend
  getScheduleRules: async (params?: PaginationParams): Promise<PaginatedResponse<MaintenanceScheduleRule>> => {
    const response = await apiClient.get<PaginatedResponse<MaintenanceScheduleRule>>('/fleet/maintenance-schedule/rules', { params });
    return response.data;
  },

  createScheduleRule: async (data: Record<string, unknown>): Promise<MaintenanceScheduleRule> => {
    const response = await apiClient.post<MaintenanceScheduleRule>('/fleet/maintenance-schedule/rules', data);
    return response.data;
  },

  updateScheduleRule: async (id: string, data: Record<string, unknown>): Promise<MaintenanceScheduleRule> => {
    const response = await apiClient.put<MaintenanceScheduleRule>(`/fleet/maintenance-schedule/rules/${id}`, data);
    return response.data;
  },

  deleteScheduleRule: async (id: string): Promise<void> => {
    await apiClient.delete(`/fleet/maintenance/${id}`);
  },

  toggleScheduleRule: async (id: string, active: boolean): Promise<MaintenanceScheduleRule> => {
    const response = await apiClient.patch<MaintenanceScheduleRule>(`/fleet/maintenance-schedule/rules/${id}/toggle`, null, {
      params: { active },
    });
    return response.data;
  },

  getDueMaintenanceItems: async (): Promise<MaintenanceDueItem[]> => {
    const response = await apiClient.get<MaintenanceDueItem[]>('/fleet/maintenance-schedule/due');
    return response.data;
  },

  getComplianceDashboard: async (): Promise<ComplianceDashboard> => {
    const response = await apiClient.get<ComplianceDashboard>('/fleet/maintenance-schedule/compliance');
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
    const response = await apiClient.get<MachineHourRate>(`/fleet/usage-logs/machine-hour-rate/${vehicleId}`, {
      params: fuelPrice != null ? { fuelPricePerLiter: fuelPrice } : undefined,
    });
    return response.data;
  },

  getOwnVsRent: async (vehicleId: string, fuelPrice?: number): Promise<OwnVsRent> => {
    const response = await apiClient.get<OwnVsRent>(`/fleet/usage-logs/own-vs-rent/${vehicleId}`, {
      params: fuelPrice != null ? { fuelPricePerLiter: fuelPrice } : undefined,
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
    const response = await apiClient.patch<FleetWaybill>(`/fleet/waybills/${id}/status`, null, {
      params: { status },
    });
    return response.data;
  },

  deleteWaybill: async (id: string): Promise<void> => {
    await apiClient.delete(`/fleet/waybills/${id}`);
  },

  // ---- Waybills (ESM-2) — uses /fleet/waybills backend ----
  getWaybillsEsm: async (params?: PaginationParams & { status?: string }): Promise<PaginatedResponse<Waybill>> => {
    const response = await apiClient.get<PaginatedResponse<FleetWaybill>>('/fleet/waybills', { params });
    const raw = response.data;
    return {
      ...raw,
      content: (raw.content ?? []).map(mapWaybillToEsm),
    };
  },

  createWaybillEsm: async (data: Record<string, unknown>): Promise<Waybill> => {
    const payload = mapEsmCreateToWaybill(data);
    const response = await apiClient.post<FleetWaybill>('/fleet/waybills', payload);
    return mapWaybillToEsm(response.data);
  },

  completeWaybillEsm: async (id: string, data: Record<string, unknown>): Promise<Waybill> => {
    // Complete = update with mileageEnd, returnTime, fuelConsumed + change status to COMPLETED
    const response = await apiClient.put<FleetWaybill>(`/fleet/waybills/${id}`, {
      mileageEnd: data.mileageEnd,
      returnTime: data.returnTime,
      fuelConsumed: data.fuelConsumed,
    });
    // Also change status to COMPLETED
    const statusResp = await apiClient.patch<FleetWaybill>(`/fleet/waybills/${id}/status`, null, {
      params: { status: 'COMPLETED' },
    });
    return mapWaybillToEsm(statusResp.data ?? response.data);
  },

  changeWaybillEsmStatus: async (id: string, status: string): Promise<Waybill> => {
    const response = await apiClient.patch<FleetWaybill>(`/fleet/waybills/${id}/status`, null, {
      params: { status },
    });
    return mapWaybillToEsm(response.data);
  },

  printWaybillEsm: async (id: string): Promise<Blob> => {
    // Print is not available on the standard waybills endpoint; return an empty PDF-like blob
    const response = await apiClient.get(`/fleet/waybills/${id}`, { responseType: 'blob' }).catch(() => null);
    if (response) return response.data;
    return new Blob([''], { type: 'application/pdf' });
  },

  // ---- Fuel Accounting — uses /fleet/fuel backend ----
  getFuelAccountingRecords: async (params?: PaginationParams & { vehicleId?: string; fuelType?: string }): Promise<FuelAccountingRecord[]> => {
    const response = await apiClient.get<PaginatedResponse<BackendFuelRecord>>('/fleet/fuel', {
      params: { ...params, size: params?.size ?? 500, page: params?.page ?? 0 },
    });
    const raw = response.data;
    return (raw.content ?? []).map(mapFuelRecordToAccounting);
  },

  createFuelAccountingRecord: async (data: Record<string, unknown>): Promise<FuelAccountingRecord> => {
    const payload = mapAccountingCreateToFuel(data);
    const response = await apiClient.post<BackendFuelRecord>('/fleet/fuel', payload);
    return mapFuelRecordToAccounting(response.data);
  },

  getFuelSummary: async (_period?: string): Promise<FuelSummary> => {
    // No dedicated summary endpoint; compute from records
    const records = await fleetApi.getFuelAccountingRecords({ size: 1000, page: 0 });
    const totalCost = records.reduce((s, r) => s + r.cost, 0);
    const totalLiters = records.reduce((s, r) => s + r.liters, 0);
    const withConsumption = records.filter((r) => r.consumptionPer100km != null);
    const avgConsumption =
      withConsumption.length > 0
        ? withConsumption.reduce((s, r) => s + (r.consumptionPer100km ?? 0), 0) / withConsumption.length
        : 0;
    const aboveNorm = new Set(
      records.filter((r) => r.consumptionPer100km != null && r.consumptionPer100km > r.normPer100km).map((r) => r.vehicleId),
    ).size;
    const belowNorm = new Set(
      records.filter((r) => r.consumptionPer100km != null && r.consumptionPer100km <= r.normPer100km).map((r) => r.vehicleId),
    ).size;
    const totalDeviation = withConsumption.reduce((s, r) => s + ((r.consumptionPer100km ?? 0) - r.normPer100km), 0);
    return { totalCost, totalLiters, avgConsumption, totalDeviation, vehiclesAboveNorm: aboveNorm, vehiclesBelowNorm: belowNorm };
  },

  // ---- Maintenance Schedule Records — uses /fleet/maintenance backend ----
  getMaintenanceScheduleRecords: async (params?: { status?: string; workType?: string }): Promise<MaintenanceScheduleRecord[]> => {
    const response = await apiClient.get<PaginatedResponse<BackendMaintenanceRecord>>('/fleet/maintenance', {
      params: { ...params, size: 500, page: 0 },
    });
    const raw = response.data;
    return (raw.content ?? []).map(mapMaintenanceToScheduleRecord);
  },

  createMaintenanceScheduleRecord: async (data: Record<string, unknown>): Promise<MaintenanceScheduleRecord> => {
    const payload = mapScheduleCreateToMaintenance(data);
    const response = await apiClient.post<BackendMaintenanceRecord>('/fleet/maintenance', payload);
    return mapMaintenanceToScheduleRecord(response.data);
  },

  completeMaintenanceRecord: async (id: string, _data: Record<string, unknown>): Promise<MaintenanceScheduleRecord> => {
    const response = await apiClient.post<BackendMaintenanceRecord>(`/fleet/maintenance/${id}/complete`);
    return mapMaintenanceToScheduleRecord(response.data);
  },

  // ---- GPS Tracking (no backend yet — returns empty data) ----
  getGpsStatuses: async (): Promise<GpsVehicleStatus[]> => {
    // Backend endpoint /fleet/gps/statuses does not exist yet.
    // Return empty array to avoid 404 toast errors.
    const stored = localStorage.getItem('fleet_gps_statuses');
    return stored ? JSON.parse(stored) : [];
  },

  getVehicleTrack: async (vehicleId: string, date: string): Promise<GpsVehicleTrack> => {
    // Backend endpoint /fleet/gps/vehicles/{id}/track does not exist yet.
    const stored = localStorage.getItem(`fleet_gps_track_${vehicleId}_${date}`);
    if (stored) return JSON.parse(stored);
    return { vehicleId, vehicleName: '', date, points: [], totalDistance: 0, totalStops: 0, avgSpeed: 0, maxSpeed: 0 };
  },

  getGeofenceAlerts: async (): Promise<GeofenceAlert[]> => {
    // Backend endpoint /fleet/gps/geofence-alerts does not exist yet.
    const stored = localStorage.getItem('fleet_geofence_alerts');
    return stored ? JSON.parse(stored) : [];
  },

  // ---- Driver Ratings (no backend — localStorage fallback) ----
  getDriverRatings: async (period?: string): Promise<DriverRating[]> => {
    try {
      const response = await apiClient.get<DriverRating[]>('/fleet/drivers/ratings', {
        params: period ? { period } : undefined,
      });
      return response.data;
    } catch {
      const stored = localStorage.getItem('fleet_driver_ratings');
      return stored ? JSON.parse(stored) : [];
    }
  },

  getDriverDetail: async (driverId: string): Promise<DriverDetail> => {
    try {
      const response = await apiClient.get<DriverDetail>(`/fleet/drivers/${driverId}/detail`);
      return response.data;
    } catch {
      const stored = localStorage.getItem(`fleet_driver_detail_${driverId}`);
      if (stored) return JSON.parse(stored);
      return { id: driverId, driverName: '', vehicleNames: [], tripsCount: 0, totalDistance: 0, avgFuelConsumption: 0, speedViolations: 0, overallRating: 0, fuelEfficiencyScore: 0, speedComplianceScore: 0, maintenanceCareScore: 0, idleTimeScore: 0, recentTrips: [] };
    }
  },
};
