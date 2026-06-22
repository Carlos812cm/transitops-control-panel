import { RouteStatus } from '@prisma/client';

import type { PaginationQuery } from '../../common/pagination/pagination.js';

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

export interface TransitRouteFilters extends PaginationQuery {
  search?: string;
  q?: string;
  status?: RouteStatus;
}
