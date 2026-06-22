import { Driver, Prisma } from '@prisma/client';

import { AppError } from '../../common/errors/app-error.js';
import {
  buildPaginationMeta,
  getPaginationOptions,
  PaginatedResult,
} from '../../common/pagination/pagination.js';
import { prisma } from '../../config/prisma.js';
import {
  CreateDriverBody,
  UpdateDriverBody,
  UpdateDriverStatusBody,
} from './drivers.schemas.js';
import { DriverFilters, PublicDriver } from './drivers.types.js';

function toPublicDriver(driver: Driver): PublicDriver {
  return {
    id: driver.id,
    firstName: driver.firstName,
    lastName: driver.lastName,
    licenseNumber: driver.licenseNumber,
    phone: driver.phone,
    email: driver.email,
    status: driver.status,
    createdAt: driver.createdAt,
    updatedAt: driver.updatedAt,
  };
}

function buildDriversWhere(filters: DriverFilters): Prisma.DriverWhereInput {
  const search = filters.search ?? filters.q;
  const where: Prisma.DriverWhereInput = {};

  if (filters.status) {
    where.status = filters.status;
  }

  if (search) {
    where.OR = [
      {
        firstName: {
          contains: search,
          mode: 'insensitive',
        },
      },
      {
        lastName: {
          contains: search,
          mode: 'insensitive',
        },
      },
      {
        licenseNumber: {
          contains: search,
          mode: 'insensitive',
        },
      },
      {
        phone: {
          contains: search,
          mode: 'insensitive',
        },
      },
      {
        email: {
          contains: search,
          mode: 'insensitive',
        },
      },
    ];
  }

  return where;
}

async function findDriverOrThrow(driverId: string): Promise<Driver> {
  const driver = await prisma.driver.findUnique({
    where: {
      id: driverId,
    },
  });

  if (!driver) {
    throw new AppError('Driver not found.', 404);
  }

  return driver;
}

async function ensureLicenseNumberIsAvailable(
  licenseNumber: string,
  driverId?: string,
): Promise<void> {
  const existingDriver = await prisma.driver.findUnique({
    where: {
      licenseNumber,
    },
  });

  if (existingDriver && existingDriver.id !== driverId) {
    throw new AppError('License number is already in use.', 409);
  }
}

async function ensureEmailIsAvailable(email: string, driverId?: string): Promise<void> {
  const existingDriver = await prisma.driver.findUnique({
    where: {
      email,
    },
  });

  if (existingDriver && existingDriver.id !== driverId) {
    throw new AppError('Driver email is already in use.', 409);
  }
}

export async function listDrivers(
  filters: DriverFilters,
): Promise<PaginatedResult<PublicDriver>> {
  const where = buildDriversWhere(filters);
  const pagination = getPaginationOptions(filters);

  const [total, drivers] = await prisma.$transaction([
    prisma.driver.count({ where }),
    prisma.driver.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      skip: pagination.skip,
      take: pagination.take,
    }),
  ]);

  return {
    data: drivers.map(toPublicDriver),
    meta: buildPaginationMeta(pagination, total),
  };
}

export async function getDriverById(driverId: string): Promise<PublicDriver> {
  const driver = await findDriverOrThrow(driverId);

  return toPublicDriver(driver);
}

export async function createDriver(payload: CreateDriverBody): Promise<PublicDriver> {
  await ensureLicenseNumberIsAvailable(payload.licenseNumber);
  await ensureEmailIsAvailable(payload.email);

  const driver = await prisma.driver.create({
    data: {
      firstName: payload.firstName,
      lastName: payload.lastName,
      licenseNumber: payload.licenseNumber,
      phone: payload.phone,
      email: payload.email,
      status: payload.status,
    },
  });

  return toPublicDriver(driver);
}

export async function updateDriver(
  driverId: string,
  payload: UpdateDriverBody,
): Promise<PublicDriver> {
  await findDriverOrThrow(driverId);

  if (payload.licenseNumber) {
    await ensureLicenseNumberIsAvailable(payload.licenseNumber, driverId);
  }

  if (payload.email) {
    await ensureEmailIsAvailable(payload.email, driverId);
  }

  const driver = await prisma.driver.update({
    where: {
      id: driverId,
    },
    data: {
      firstName: payload.firstName,
      lastName: payload.lastName,
      licenseNumber: payload.licenseNumber,
      phone: payload.phone,
      email: payload.email,
      status: payload.status,
    },
  });

  return toPublicDriver(driver);
}

export async function updateDriverStatus(
  driverId: string,
  payload: UpdateDriverStatusBody,
): Promise<PublicDriver> {
  await findDriverOrThrow(driverId);

  const driver = await prisma.driver.update({
    where: {
      id: driverId,
    },
    data: {
      status: payload.status,
    },
  });

  return toPublicDriver(driver);
}

export async function deleteDriver(driverId: string): Promise<null> {
  await findDriverOrThrow(driverId);

  const relatedTripsCount = await prisma.trip.count({
    where: {
      driverId,
    },
  });

  if (relatedTripsCount > 0) {
    throw new AppError('Driver cannot be deleted because they have related trips.', 409);
  }

  await prisma.driver.delete({
    where: {
      id: driverId,
    },
  });

  return null;
}
