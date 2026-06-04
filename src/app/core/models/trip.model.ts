import { Vehicle } from './vehicle.model';
import { Driver } from './driver.model';
import { TransitRoute } from './route.model';

export type TripStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface Trip {
  id: string;
  vehicleId: string;
  driverId: string;
  routeId: string;
  scheduledDeparture: Date;
  status: TripStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;

  vehicle?: Vehicle; // Opcional, puede ser poblado al obtener detalles del viaje
  driver?: Driver; // Opcional, puede ser poblado al obtener detalles del viaje
  route?: TransitRoute; // Opcional, puede ser poblado al obtener detalles del viaje
}

export interface CreateTripRequest {
  vehicleId: string;
  driverId: string;
  routeId: string;
  scheduledDeparture: Date;
  notes?: string;
}

export interface UpdateTripStatusRequest {
  status: TripStatus;
}
