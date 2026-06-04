export type VehicleStatus = 'AVAILABLE' | 'INACTIVE' | 'MAINTENANCE';

export interface Vehicle {
  id: string;
  unitNumber: string;
  brand: string;
  model: string;
  year: number;
  capacity: number;
  status: VehicleStatus;
  lastMaintenanceDate?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateVehicleRequest {
  unitNumber: string;
  brand: string;
  model: string;
  year: number;
  capacity: number;
  status: VehicleStatus;
  lastMaintenanceDate?: Date;
}

export interface UpdateVehicleRequest extends Partial<CreateVehicleRequest> {}
