export type DispatchStatus = 'DRAFT' | 'SCHEDULED' | 'DISPATCHED' | 'IN_TRANSIT' | 'DELIVERED' | 'COMPLETED' | 'CANCELLED';

export interface DispatchOrder {
  id: string;
  number: string;
  description: string;
  status: DispatchStatus;
  vehicleNumber?: string;
  vehicleType?: string;
  driverName?: string;
  driverPhone?: string;
  originLocation: string;
  destinationLocation: string;
  projectId?: string;
  projectName?: string;
  scheduledDate: string;
  dispatchedAt?: string;
  deliveredAt?: string;
  cargoDescription?: string;
  cargoWeight?: number;
  notes?: string;
  createdById: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
}

export interface DispatchRoute {
  id: string;
  name: string;
  code: string;
  originLocation: string;
  destinationLocation: string;
  distance: number;
  estimatedDuration: number;
  activeOrderCount: number;
  isActive: boolean;
  projectId?: string;
  projectName?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDispatchOrderRequest {
  description: string;
  vehicleNumber?: string;
  driverName?: string;
  driverPhone?: string;
  originLocation: string;
  destinationLocation: string;
  scheduledDate: string;
  cargoDescription?: string;
  cargoWeight?: number;
  projectId?: string;
  routeId?: string;
  notes?: string;
}
