import { DriverStatus } from '@prisma/client';

import type { PaginationQuery } from '../../common/pagination/pagination.js';

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

export interface DriverFilters extends PaginationQuery {
  search?: string;
  q?: string;
  status?: DriverStatus;
}
