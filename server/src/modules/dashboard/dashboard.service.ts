import { prisma } from '../../config/prisma.js';
import {
  DashboardSummary,
  latestTripsInclude,
} from './dashboard.types.js';

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const [
    totalVehicles,
    availableVehicles,
    maintenanceVehicles,
    totalDrivers,
    activeDrivers,
    suspendedDrivers,
    totalRoutes,
    activeRoutes,
    totalTrips,
    scheduledTrips,
    inProgressTrips,
    completedTrips,
    cancelledTrips,
    latestTrips,
  ] = await Promise.all([
    prisma.vehicle.count(),
    prisma.vehicle.count({
      where: {
        status: 'AVAILABLE',
      },
    }),
    prisma.vehicle.count({
      where: {
        status: 'MAINTENANCE',
      },
    }),

    prisma.driver.count(),
    prisma.driver.count({
      where: {
        status: 'ACTIVE',
      },
    }),
    prisma.driver.count({
      where: {
        status: 'SUSPENDED',
      },
    }),

    prisma.transitRoute.count(),
    prisma.transitRoute.count({
      where: {
        status: 'ACTIVE',
      },
    }),

    prisma.trip.count(),
    prisma.trip.count({
      where: {
        status: 'SCHEDULED',
      },
    }),
    prisma.trip.count({
      where: {
        status: 'IN_PROGRESS',
      },
    }),
    prisma.trip.count({
      where: {
        status: 'COMPLETED',
      },
    }),
    prisma.trip.count({
      where: {
        status: 'CANCELLED',
      },
    }),

    prisma.trip.findMany({
      include: latestTripsInclude,
      orderBy: {
        scheduledDeparture: 'desc',
      },
      take: 5,
    }),
  ]);

  return {
    stats: {
      totalVehicles,
      availableVehicles,
      maintenanceVehicles,

      totalDrivers,
      activeDrivers,
      suspendedDrivers,

      totalRoutes,
      activeRoutes,

      totalTrips,
      scheduledTrips,
      inProgressTrips,
      completedTrips,
      cancelledTrips,
    },
    latestTrips,
  };
}
