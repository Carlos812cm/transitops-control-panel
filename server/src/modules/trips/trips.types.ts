import {
  Driver,
  TransitRoute,
  TripStatus,
  Vehicle,
} from '@prisma/client';

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

export interface TripFilters {
  search?: string;
  q?: string;
  status?: TripStatus;
  vehicleId?: string;
  driverId?: string;
  routeId?: string;
}
