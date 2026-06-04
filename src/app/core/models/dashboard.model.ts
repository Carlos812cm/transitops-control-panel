import { Trip } from './trip.model';

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
  latestTrips: Trip[];
}
