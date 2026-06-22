import {
  Driver,
  TransitRoute,
  TripStatus,
  Vehicle,
} from '@prisma/client';

import type { PaginationQuery } from '../../common/pagination/pagination.js';

export interface PublicTrip {
  id: string;
  vehicleId: string;
  driverId: string;
  routeId: string;
  scheduledDeparture: Date;
  status: TripStatus;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
  vehicle?: Vehicle;
  driver?: Driver;
  route?: TransitRoute;
}

export interface TripFilters extends PaginationQuery {
  search?: string;
  q?: string;
  status?: TripStatus;
  vehicleId?: string;
  driverId?: string;
  routeId?: string;
}
