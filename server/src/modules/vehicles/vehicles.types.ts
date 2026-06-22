import { VehicleStatus } from '@prisma/client';

import type { PaginationQuery } from '../../common/pagination/pagination.js';

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

export interface VehicleFilters extends PaginationQuery {
  search?: string;
  q?: string;
  status?: VehicleStatus;
}
