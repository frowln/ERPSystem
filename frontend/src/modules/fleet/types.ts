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
