// Fleet module types
// Vehicles, maintenance, and fuel tracking

export type VehicleStatus = 'AVAILABLE' | 'IN_USE' | 'MAINTENANCE' | 'REPAIR' | 'DECOMMISSIONED';
export type VehicleType =
  | 'EXCAVATOR'
  | 'CRANE'
  | 'TRUCK'
  | 'LOADER'
  | 'BULLDOZER'
  | 'CONCRETE_MIXER'
  | 'GENERATOR'
  | 'COMPRESSOR'
  | 'OTHER';

export type FuelType = 'diesel' | 'gasoline_92' | 'gasoline_95';

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
  fuelType: string;
  operatingHours: number;
  currentOperator?: string;
  nextMaintenanceDate?: string;
  lastMaintenanceDate?: string;
  insuranceExpiryDate?: string;
  registrationExpiryDate?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateVehicleRequest {
  code: string;
  name: string;
  type: VehicleType;
  licensePlate?: string;
  brand: string;
  model: string;
  year: number;
  fuelType: string;
  projectId?: string;
}

export interface UpdateVehicleRequest extends Partial<CreateVehicleRequest> {
  id: string;
  status?: VehicleStatus;
}

// Maintenance types
export type MaintenanceStatus = 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE';
export type MaintenanceType = 'SCHEDULED' | 'REPAIR' | 'INSPECTION' | 'CERTIFICATION';

export interface Maintenance {
  id: string;
  vehicleId?: string;
  vehicle: string;
  vehiclePlate: string;
  type: string;
  status: MaintenanceStatus;
  scheduledDate: string;
  completedDate?: string;
  mechanic: string;
  cost: number;
  description: string;
  projectName?: string;
  parts?: MaintenancePart[];
  createdAt?: string;
  updatedAt?: string;
}

export interface MaintenancePart {
  id: string;
  maintenanceId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface CreateMaintenanceRequest {
  vehicleId: string;
  type: string;
  scheduledDate: string;
  mechanic: string;
  estimatedCost: number;
  description: string;
}

// Fuel types
export interface FuelRecord {
  id: string;
  vehicleId?: string;
  vehicle: string;
  vehiclePlate: string;
  date: string;
  liters: number;
  costPerLiter: number;
  totalCost: number;
  odometer: number;
  driver: string;
  fuelType: FuelType;
  station: string;
  projectId?: string;
  projectName?: string;
  createdAt?: string;
}

export interface CreateFuelRecordRequest {
  vehicleId: string;
  date: string;
  liters: number;
  costPerLiter: number;
  odometer: number;
  driver: string;
  fuelType: FuelType;
  station: string;
  projectId?: string;
}

export interface FleetSummary {
  totalVehicles: number;
  inUse: number;
  available: number;
  inMaintenance: number;
  decommissioned: number;
  totalFuelCostThisMonth: number;
  totalMaintenanceCostThisMonth: number;
  overdueMaintenanceCount: number;
}

// ---------------------------------------------------------------------------
// Waybill (ESM-2) — advanced
// ---------------------------------------------------------------------------
export type WaybillEsmStatus = 'DRAFT' | 'ISSUED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface Waybill {
  id: string;
  number: string;
  vehicleId: string;
  vehicleName: string;
  driverName: string;
  date: string;
  routeFrom?: string;
  routeTo?: string;
  routeDescription?: string;
  departureTime: string;
  returnTime?: string;
  mileageStart: number;
  mileageEnd?: number;
  totalMileage?: number;
  odometerStart?: number;
  odometerEnd?: number;
  fuelDispensed?: number;
  fuelConsumed?: number;
  fuelNorm?: number;
  status: WaybillEsmStatus;
  medicalExamPassed?: boolean;
  mechanicApproved?: boolean;
  createdAt?: string;
}

export interface CompleteWaybillRequest {
  mileageEnd: number;
  odometerEnd: number;
  fuelConsumed: number;
  returnTime: string;
}

// ---------------------------------------------------------------------------
// Fuel Accounting (extended) — advanced
// ---------------------------------------------------------------------------
export interface FuelAccountingRecord {
  id: string;
  vehicleId: string;
  vehicleName: string;
  fuelType: string;
  refuelDate: string;
  liters: number;
  cost: number;
  costPerLiter?: number;
  station: string;
  mileageAtRefuel: number;
  consumptionPer100km?: number;
  normPer100km: number;
  deviation?: number;
  driverName?: string;
}

export interface FuelSummary {
  totalCost: number;
  totalLiters: number;
  avgConsumption: number;
  totalDeviation: number;
  vehiclesAboveNorm: number;
  vehiclesBelowNorm: number;
}

export interface CreateFuelAccountingRequest {
  vehicleId: string;
  refuelDate: string;
  fuelType: string;
  liters: number;
  cost: number;
  station: string;
  mileageAtRefuel: number;
  driverName?: string;
}

// ---------------------------------------------------------------------------
// Maintenance Schedule Record — advanced
// ---------------------------------------------------------------------------
export type MaintenanceWorkType =
  | 'OIL_CHANGE'
  | 'TIRE_ROTATION'
  | 'BRAKE_CHECK'
  | 'ENGINE_SERVICE'
  | 'TRANSMISSION'
  | 'HYDRAULIC'
  | 'ELECTRICAL'
  | 'GENERAL_INSPECTION'
  | 'OTHER';

export type MaintScheduleStatus = 'SCHEDULED' | 'OVERDUE' | 'IN_PROGRESS' | 'COMPLETED';

export type MaintTriggerType = 'DATE' | 'MILEAGE' | 'HOURS';

export interface MaintenanceScheduleRecord {
  id: string;
  vehicleId: string;
  vehicleName: string;
  maintenanceType: 'scheduled' | 'unscheduled';
  workType: MaintenanceWorkType;
  description: string;
  scheduledDate?: string;
  actualDate?: string;
  scheduledMileage?: number;
  actualMileage?: number;
  dueDate?: string;
  dueMileage?: number;
  lastPerformed?: string;
  triggerType?: MaintTriggerType;
  intervalDays?: number;
  intervalMileage?: number;
  intervalHours?: number;
  status: MaintScheduleStatus | 'upcoming' | 'overdue' | 'completed';
  cost?: number;
  mechanicName?: string;
  notes?: string;
  createdAt?: string;
}

export interface CreateMaintenanceScheduleRequest {
  vehicleId: string;
  workType: MaintenanceWorkType;
  triggerType: MaintTriggerType;
  description: string;
  scheduledDate?: string;
  scheduledMileage?: number;
  intervalDays?: number;
  intervalMileage?: number;
  intervalHours?: number;
  estimatedCost?: number;
}

// ---------------------------------------------------------------------------
// GPS Vehicle Status — advanced
// ---------------------------------------------------------------------------
export type GpsVehicleStatusType = 'MOVING' | 'STOPPED' | 'IDLE' | 'OFFLINE' | 'moving' | 'idle' | 'offline';

export interface GpsVehicleStatus {
  id: string;
  vehicleId?: string;
  vehicleName: string;
  vehicleType?: string;
  licensePlate: string;
  status: GpsVehicleStatusType;
  currentSpeed?: number;
  heading?: number;
  lastLatitude?: number;
  lastLongitude?: number;
  lastLocationName?: string;
  todayDistance: number;
  todayStops?: number;
  lastUpdate: string;
}

export interface GpsTrackPoint {
  timestamp: string;
  latitude: number;
  longitude: number;
  speed: number;
  address?: string;
}

export interface GpsVehicleTrack {
  vehicleId: string;
  vehicleName: string;
  date: string;
  points: GpsTrackPoint[];
  totalDistance: number;
  totalStops: number;
  avgSpeed: number;
  maxSpeed: number;
}

export interface GeofenceAlert {
  id: string;
  vehicleId: string;
  vehicleName: string;
  zoneName: string;
  eventType: 'ENTERED' | 'EXITED';
  timestamp: string;
  latitude: number;
  longitude: number;
}

// ---------------------------------------------------------------------------
// Driver Rating — advanced
// ---------------------------------------------------------------------------
export type DriverRatingPeriod = 'MONTH' | 'QUARTER' | 'YEAR';

export interface DriverRating {
  id: string;
  driverName: string;
  vehicleNames: string[];
  tripsCount: number;
  totalDistance?: number;
  avgFuelConsumption: number;
  fuelEfficiencyScore?: number;
  speedViolations: number;
  speedComplianceScore?: number;
  maintenanceCareScore?: number;
  idleTimeScore?: number;
  idleTimeMinutes?: number;
  overallRating: number;
  rankPosition: number;
}

export interface DriverDetail {
  id: string;
  driverName: string;
  vehicleNames: string[];
  tripsCount: number;
  totalDistance: number;
  avgFuelConsumption: number;
  speedViolations: number;
  overallRating: number;
  fuelEfficiencyScore: number;
  speedComplianceScore: number;
  maintenanceCareScore: number;
  idleTimeScore: number;
  recentTrips: {
    date: string;
    vehicle: string;
    distance: number;
    fuelConsumption: number;
    violations: number;
  }[];
}
