export interface QueryParams {
  search?: string;
  q?: string;
  status?: string;
  vehicleId?: string;
  driverId?: string;
  routeId?: string;
  page?: number;
  limit?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
