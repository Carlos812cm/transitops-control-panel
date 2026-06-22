import { Prisma, Vehicle } from '@prisma/client';

import { AppError } from '../../common/errors/app-error.js';
import {
  buildPaginationMeta,
  getPaginationOptions,
  PaginatedResult,
} from '../../common/pagination/pagination.js';
import { prisma } from '../../config/prisma.js';
import {
  CreateVehicleBody,
  UpdateVehicleBody,
  UpdateVehicleStatusBody,
} from './vehicles.schemas.js';
import { PublicVehicle, VehicleFilters } from './vehicles.types.js';

function toPublicVehicle(vehicle: Vehicle): PublicVehicle {
  return {
    id: vehicle.id,
    unitNumber: vehicle.unitNumber,
    brand: vehicle.brand,
    model: vehicle.model,
    year: vehicle.year,
    capacity: vehicle.capacity,
    status: vehicle.status,
    lastMaintenanceDate: vehicle.lastMaintenanceDate,
    createdAt: vehicle.createdAt,
    updatedAt: vehicle.updatedAt,
  };
}

function buildVehiclesWhere(filters: VehicleFilters): Prisma.VehicleWhereInput {
  const search = filters.search ?? filters.q;
  const where: Prisma.VehicleWhereInput = {};

  if (filters.status) {
    where.status = filters.status;
  }

  if (search) {
    where.OR = [
      {
        unitNumber: {
          contains: search,
          mode: 'insensitive',
        },
      },
      {
        brand: {
          contains: search,
          mode: 'insensitive',
        },
      },
      {
        model: {
          contains: search,
          mode: 'insensitive',
        },
      },
    ];
  }

  return where;
}

async function findVehicleOrThrow(vehicleId: string): Promise<Vehicle> {
  const vehicle = await prisma.vehicle.findUnique({
    where: {
      id: vehicleId,
    },
  });

  if (!vehicle) {
    throw new AppError('Vehicle not found.', 404);
  }

  return vehicle;
}

async function ensureUnitNumberIsAvailable(unitNumber: string, vehicleId?: string): Promise<void> {
  const existingVehicle = await prisma.vehicle.findUnique({
    where: {
      unitNumber,
    },
  });

  if (existingVehicle && existingVehicle.id !== vehicleId) {
    throw new AppError('Unit number is already in use.', 409);
  }
}

export async function listVehicles(
  filters: VehicleFilters,
): Promise<PaginatedResult<PublicVehicle>> {
  const where = buildVehiclesWhere(filters);
  const pagination = getPaginationOptions(filters);

  const [total, vehicles] = await prisma.$transaction([
    prisma.vehicle.count({ where }),
    prisma.vehicle.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      skip: pagination.skip,
      take: pagination.take,
    }),
  ]);

  return {
    data: vehicles.map(toPublicVehicle),
    meta: buildPaginationMeta(pagination, total),
  };
}

export async function getVehicleById(vehicleId: string): Promise<PublicVehicle> {
  const vehicle = await findVehicleOrThrow(vehicleId);

  return toPublicVehicle(vehicle);
}

export async function createVehicle(payload: CreateVehicleBody): Promise<PublicVehicle> {
  await ensureUnitNumberIsAvailable(payload.unitNumber);

  const vehicle = await prisma.vehicle.create({
    data: {
      unitNumber: payload.unitNumber,
      brand: payload.brand,
      model: payload.model,
      year: payload.year,
      capacity: payload.capacity,
      status: payload.status,
      lastMaintenanceDate: payload.lastMaintenanceDate ?? null,
    },
  });

  return toPublicVehicle(vehicle);
}

export async function updateVehicle(
  vehicleId: string,
  payload: UpdateVehicleBody,
): Promise<PublicVehicle> {
  await findVehicleOrThrow(vehicleId);

  if (payload.unitNumber) {
    await ensureUnitNumberIsAvailable(payload.unitNumber, vehicleId);
  }

  const vehicle = await prisma.vehicle.update({
    where: {
      id: vehicleId,
    },
    data: {
      unitNumber: payload.unitNumber,
      brand: payload.brand,
      model: payload.model,
      year: payload.year,
      capacity: payload.capacity,
      status: payload.status,
      lastMaintenanceDate: payload.lastMaintenanceDate,
    },
  });

  return toPublicVehicle(vehicle);
}

export async function updateVehicleStatus(
  vehicleId: string,
  payload: UpdateVehicleStatusBody,
): Promise<PublicVehicle> {
  await findVehicleOrThrow(vehicleId);

  const vehicle = await prisma.vehicle.update({
    where: {
      id: vehicleId,
    },
    data: {
      status: payload.status,
    },
  });

  return toPublicVehicle(vehicle);
}

export async function deleteVehicle(vehicleId: string): Promise<null> {
  await findVehicleOrThrow(vehicleId);

  const relatedTripsCount = await prisma.trip.count({
    where: {
      vehicleId,
    },
  });

  if (relatedTripsCount > 0) {
    throw new AppError('Vehicle cannot be deleted because it has related trips.', 409);
  }

  await prisma.vehicle.delete({
    where: {
      id: vehicleId,
    },
  });

  return null;
}
