import { Prisma } from '@prisma/client';

import { AppError } from '../../common/errors/app-error.js';
import {
  buildPaginationMeta,
  getPaginationOptions,
  PaginatedResult,
} from '../../common/pagination/pagination.js';
import { prisma } from '../../config/prisma.js';
import {
  CreateTripBody,
  UpdateTripStatusBody,
} from './trips.schemas.js';
import { PublicTrip, TripFilters } from './trips.types.js';

const tripInclude = {
  vehicle: true,
  driver: true,
  route: true,
} satisfies Prisma.TripInclude;

type TripWithRelations = Prisma.TripGetPayload<{
  include: typeof tripInclude;
}>;

function toPublicTrip(trip: TripWithRelations): PublicTrip {
  return {
    id: trip.id,
    vehicleId: trip.vehicleId,
    driverId: trip.driverId,
    routeId: trip.routeId,
    scheduledDeparture: trip.scheduledDeparture,
    status: trip.status,
    notes: trip.notes,
    createdAt: trip.createdAt,
    updatedAt: trip.updatedAt,
    vehicle: trip.vehicle,
    driver: trip.driver,
    route: trip.route,
  };
}

function buildTripsWhere(filters: TripFilters): Prisma.TripWhereInput {
  const search = filters.search ?? filters.q;
  const where: Prisma.TripWhereInput = {};

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.vehicleId) {
    where.vehicleId = filters.vehicleId;
  }

  if (filters.driverId) {
    where.driverId = filters.driverId;
  }

  if (filters.routeId) {
    where.routeId = filters.routeId;
  }

  if (search) {
    where.OR = [
      {
        notes: {
          contains: search,
          mode: 'insensitive',
        },
      },
      {
        vehicle: {
          unitNumber: {
            contains: search,
            mode: 'insensitive',
          },
        },
      },
      {
        driver: {
          firstName: {
            contains: search,
            mode: 'insensitive',
          },
        },
      },
      {
        driver: {
          lastName: {
            contains: search,
            mode: 'insensitive',
          },
        },
      },
      {
        route: {
          name: {
            contains: search,
            mode: 'insensitive',
          },
        },
      },
    ];
  }

  return where;
}

async function findTripOrThrow(tripId: string): Promise<TripWithRelations> {
  const trip = await prisma.trip.findUnique({
    where: {
      id: tripId,
    },
    include: tripInclude,
  });

  if (!trip) {
    throw new AppError('Trip not found.', 404);
  }

  return trip;
}

async function ensureTripResourcesAreAvailable(payload: CreateTripBody): Promise<void> {
  const vehicle = await prisma.vehicle.findUnique({
    where: {
      id: payload.vehicleId,
    },
  });

  if (!vehicle) {
    throw new AppError('Vehicle not found.', 404);
  }

  if (vehicle.status !== 'AVAILABLE') {
    throw new AppError('Vehicle is not available for trips.', 400);
  }

  const driver = await prisma.driver.findUnique({
    where: {
      id: payload.driverId,
    },
  });

  if (!driver) {
    throw new AppError('Driver not found.', 404);
  }

  if (driver.status !== 'ACTIVE') {
    throw new AppError('Driver is not available for trips.', 400);
  }

  const route = await prisma.transitRoute.findUnique({
    where: {
      id: payload.routeId,
    },
  });

  if (!route) {
    throw new AppError('Route not found.', 404);
  }

  if (route.status !== 'ACTIVE') {
    throw new AppError('Route is not available for trips.', 400);
  }
}

export async function listTrips(filters: TripFilters): Promise<PaginatedResult<PublicTrip>> {
  const where = buildTripsWhere(filters);
  const pagination = getPaginationOptions(filters);

  const [total, trips] = await prisma.$transaction([
    prisma.trip.count({ where }),
    prisma.trip.findMany({
      where,
      include: tripInclude,
      orderBy: {
        scheduledDeparture: 'desc',
      },
      skip: pagination.skip,
      take: pagination.take,
    }),
  ]);

  return {
    data: trips.map(toPublicTrip),
    meta: buildPaginationMeta(pagination, total),
  };
}

export async function getTripById(tripId: string): Promise<PublicTrip> {
  const trip = await findTripOrThrow(tripId);

  return toPublicTrip(trip);
}

export async function createTrip(payload: CreateTripBody): Promise<PublicTrip> {
  await ensureTripResourcesAreAvailable(payload);

  const trip = await prisma.trip.create({
    data: {
      vehicleId: payload.vehicleId,
      driverId: payload.driverId,
      routeId: payload.routeId,
      scheduledDeparture: payload.scheduledDeparture,
      notes: payload.notes ?? null,
      status: 'SCHEDULED',
    },
    include: tripInclude,
  });

  return toPublicTrip(trip);
}

export async function updateTripStatus(
  tripId: string,
  payload: UpdateTripStatusBody,
): Promise<PublicTrip> {
  await findTripOrThrow(tripId);

  const trip = await prisma.trip.update({
    where: {
      id: tripId,
    },
    data: {
      status: payload.status,
    },
    include: tripInclude,
  });

  return toPublicTrip(trip);
}

export async function deleteTrip(tripId: string): Promise<null> {
  await findTripOrThrow(tripId);

  await prisma.trip.delete({
    where: {
      id: tripId,
    },
  });

  return null;
}
