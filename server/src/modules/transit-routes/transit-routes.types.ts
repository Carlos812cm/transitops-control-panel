import { RouteStatus } from '@prisma/client';

export interface PublicTransitRoute {
  id: string;
  name: string;
  origin: string;
  destination: string;
  distanceKm: number;
  estimatedDurationMinutes: number;
  status: RouteStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface TransitRouteFilters {
  search?: string;
  q?: string;
  status?: RouteStatus;
}
