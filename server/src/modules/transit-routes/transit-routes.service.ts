import { Prisma, TransitRoute } from '@prisma/client';

import { AppError } from '../../common/errors/app-error.js';
import { prisma } from '../../config/prisma.js';
import {
  CreateTransitRouteBody,
  UpdateTransitRouteBody,
  UpdateTransitRouteStatusBody,
} from './transit-routes.schemas.js';
import {
  PublicTransitRoute,
  TransitRouteFilters,
} from './transit-routes.types.js';

function toPublicTransitRoute(route: TransitRoute): PublicTransitRoute {
  return {
    id: route.id,
    name: route.name,
    origin: route.origin,
    destination: route.destination,
    distanceKm: route.distanceKm,
    estimatedDurationMinutes: route.estimatedDurationMinutes,
    status: route.status,
    createdAt: route.createdAt,
    updatedAt: route.updatedAt,
  };
}

function buildTransitRoutesWhere(filters: TransitRouteFilters): Prisma.TransitRouteWhereInput {
  const search = filters.search ?? filters.q;
  const where: Prisma.TransitRouteWhereInput = {};

  if (filters.status) {
    where.status = filters.status;
  }

  if (search) {
    where.OR = [
      {
        name: {
          contains: search,
          mode: 'insensitive',
        },
      },
      {
        origin: {
          contains: search,
          mode: 'insensitive',
        },
      },
      {
        destination: {
          contains: search,
          mode: 'insensitive',
        },
      },
    ];
  }

  return where;
}

async function findTransitRouteOrThrow(routeId: string): Promise<TransitRoute> {
  const route = await prisma.transitRoute.findUnique({
    where: {
      id: routeId,
    },
  });

  if (!route) {
    throw new AppError('Route not found.', 404);
  }

  return route;
}

export async function listTransitRoutes(
  filters: TransitRouteFilters,
): Promise<PublicTransitRoute[]> {
  const routes = await prisma.transitRoute.findMany({
    where: buildTransitRoutesWhere(filters),
    orderBy: {
      createdAt: 'desc',
    },
  });

  return routes.map(toPublicTransitRoute);
}

export async function getTransitRouteById(routeId: string): Promise<PublicTransitRoute> {
  const route = await findTransitRouteOrThrow(routeId);

  return toPublicTransitRoute(route);
}

export async function createTransitRoute(
  payload: CreateTransitRouteBody,
): Promise<PublicTransitRoute> {
  const route = await prisma.transitRoute.create({
    data: {
      name: payload.name,
      origin: payload.origin,
      destination: payload.destination,
      distanceKm: payload.distanceKm,
      estimatedDurationMinutes: payload.estimatedDurationMinutes,
      status: payload.status,
    },
  });

  return toPublicTransitRoute(route);
}

export async function updateTransitRoute(
  routeId: string,
  payload: UpdateTransitRouteBody,
): Promise<PublicTransitRoute> {
  await findTransitRouteOrThrow(routeId);

  const route = await prisma.transitRoute.update({
    where: {
      id: routeId,
    },
    data: {
      name: payload.name,
      origin: payload.origin,
      destination: payload.destination,
      distanceKm: payload.distanceKm,
      estimatedDurationMinutes: payload.estimatedDurationMinutes,
      status: payload.status,
    },
  });

  return toPublicTransitRoute(route);
}

export async function updateTransitRouteStatus(
  routeId: string,
  payload: UpdateTransitRouteStatusBody,
): Promise<PublicTransitRoute> {
  await findTransitRouteOrThrow(routeId);

  const route = await prisma.transitRoute.update({
    where: {
      id: routeId,
    },
    data: {
      status: payload.status,
    },
  });

  return toPublicTransitRoute(route);
}

export async function deleteTransitRoute(routeId: string): Promise<null> {
  await findTransitRouteOrThrow(routeId);

  const relatedTripsCount = await prisma.trip.count({
    where: {
      routeId,
    },
  });

  if (relatedTripsCount > 0) {
    throw new AppError('Route cannot be deleted because it has related trips.', 409);
  }

  await prisma.transitRoute.delete({
    where: {
      id: routeId,
    },
  });

  return null;
}
