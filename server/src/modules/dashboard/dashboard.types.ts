import { Prisma } from '@prisma/client';

const latestTripsInclude = {
  vehicle: true,
  driver: true,
  route: true,
} satisfies Prisma.TripInclude;

export type LatestTrip = Prisma.TripGetPayload<{
  include: typeof latestTripsInclude;
}>;

export interface DashboardStats {
  totalVehicles: number;
  availableVehicles: number;
  maintenanceVehicles: number;

  totalDrivers: number;
  activeDrivers: number;
  suspendedDrivers: number;

  totalRoutes: number;
  activeRoutes: number;

  totalTrips: number;
  scheduledTrips: number;
  inProgressTrips: number;
  completedTrips: number;
  cancelledTrips: number;
}

export interface DashboardSummary {
  stats: DashboardStats;
  latestTrips: LatestTrip[];
}

export { latestTripsInclude };
