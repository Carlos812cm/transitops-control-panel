import { DriverStatus } from '@prisma/client';

export interface PublicDriver {
  id: string;
  firstName: string;
  lastName: string;
  licenseNumber: string;
  phone: string;
  email: string;
  status: DriverStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface DriverFilters {
  search?: string;
  q?: string;
  status?: DriverStatus;
}
