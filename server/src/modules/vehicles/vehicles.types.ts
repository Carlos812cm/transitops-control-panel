import { VehicleStatus } from '@prisma/client';

export interface PublicVehicle {
  id: string;
  unitNumber: string;
  brand: string;
  model: string;
  year: number;
  capacity: number;
  status: VehicleStatus;
  lastMaintenanceDate?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface VehicleFilters {
  search?: string;
  q?: string;
  status?: VehicleStatus;
}
