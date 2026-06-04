export type RouteStatus = 'ACTIVE' | 'INACTIVE';

export interface TransitRoute {
  id: string;
  name: string;
  origin: string;
  destination: string;
  distanceKm: number; // in kilometers
  estimatedDurationMinutes: number; // in minutes
  status: RouteStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateRouteRequest {
  name: string;
  origin: string;
  destination: string;
  distanceKm: number; // in kilometers
  estimatedDurationMinutes: number; // in minutes
  status: RouteStatus;
}

export interface UpdateRouteRequest extends Partial<CreateRouteRequest> {}
